/* ta-create-events-v1.0.0.js
   ============================================================
   ta-create-events-v1.0.0.js
   INBXIFY TA Studio — CREATE EVENTS FROM PRINT (Allocator RE Events · 6)

   v1.0.0 (1 Nov 2026)
     WHY. Intake Review finds the events on an Events page, in articles
     and in ads, and ticks them, but nothing ever turned a tick into an
     EVENTS record. This is the twin of ta-create-listings v1.0.4 and
     follows Spec v1.14 Section 9a item 1 and Section 3.2.

     WHAT IT DOES
       · Opened from the Allocator: "Create events" in the board head, or
         the "Events" link on an Events page row (that row preselected).
         Sources: every Events page of the issue, then the articles and
         ads Intake Review flagged "Also create event", then every other
         article and print ad (an article or ad with no event reads as
         nothing found).
       · Read events: the source page is rendered and sent to the
         ix-print-parse Worker /extract: kind "events" for an Events
         page, "event-in-block" for one named article or ad.
       · One card per printed event: name, audience, cost, venue, room,
         street, city, state, ZIP, link, rain plan, registration, sponsor
         credit, description, and an optional photo cut from a box drawn
         on the page. Under the fields, one line per date.
       · ONE EVENTS ROW PER DATE (Q5, re-ruled 1 Nov). A date list makes
         one row per date (date-pattern Multiple); one date makes one row
         (Single); a range ("Aug 5 to 7") makes one row (Span) with
         dt-date-override. Each date line is matched on its own.
       · Match, per date line, against every event of this PUBLISHER
         (ix-asset-list type=event, all of its titles):
           Same      name, venue, date and time all equal, one record,
                     not archived. Updated automatically through
                     Scenario G: print wins for any field it shows and
                     never blanks one (R3).
           New       no existing event with an equal or similar name.
                     Created through Scenario 104.
           Needs you anything in between (Section 3.2 table), an
                     archived match (R4), or two or more matches. The
                     line opens a side-by-side: printed values on the
                     left, each candidate on the right, differences
                     marked. Choices: Same one, update it · Different,
                     create new · Skip. A choice gets a cancel link.
         A record already matched by another date line of the same card
         is never a reason to ask about a sibling date (the other dates
         of a weekly series are not "moved" copies of each other).
       · A card the reader was unsure about (the parser's check flag)
         waits for "Dates look right" before anything on it can write.
       · Every write puts this print issue on the first line of
         print-issue-source (only if not already listed). An event held
         by another of the publisher's titles gets this title added to
         titles: one item listing both titles (ruling 3).
       · Create is refused while any ticked line still needs you; the
         button says how many.
       · After the writes the event list is read again (fresh=1) and each
         row is checked against what Webflow holds. Green only from that
         read (TOAST-TRUTH).

     NEEDS on the page: TA_CONFIG.printParseWorker, assetListUrl,
     makeCreateAssets (Scenario 104 v3.4), makeStudio (Scenario G v9.5),
     uploadcarePublicKey, taItemId, titleSlug, titleTimezone;
     window.IxPdfPager; window.IxInfo for the ⓘ badge.

     NOT DONE (stated, not hidden)
       · No MEDIA row is made for a drawn photo; the event holds it by URL
         (event-hero-image-ulc-link-ev-1-only and event-image-url).
       · No ALLOCATIONS rows for the events (Spec 9a item 3).
       · print-issue-source longer than 400 characters arrives cut from
         the asset list; it is then left as it is and the card says so,
         so a cut copy is never written back.

     HARDCODING (provisional, for the Tracker)
       HC-P-CE-1  render widths 1100 display / 1400 read / 3600 photo
                  crop, minimum box 40 px, unsharp mask amount 0.5 and
                  threshold 3, JPEG 0.92 (same values as HC-P-CL1-1/-5).
       HC-P-CE-2  option LABELS looked up by name in the live options:
                  status "Available" / "Archived", schedule-status
                  "Scheduled", date-pattern "Single" / "Span" /
                  "Multiple". No option id is typed in this file.
       HC-P-CE-3  span display text "Aug 5 – 7" / "Aug 30 – Sep 2"
                  (en-US short month) for dt-date-override.
       HC-P-STC-2 similar name = one name contains the other, or shared
                  words are at least two thirds of the shorter name.
   ============================================================ */
(function () {
  'use strict';
  var VERSION = '1.0.0';
  var FILE = 'ta-create-events-v' + VERSION + '.js';
  var TAG = '[ta-create-events v' + VERSION + ']';
  var SHOW_W = 1100, READ_W = 1400, CROP_W = 3600, MIN_BOX = 40;     // HC-P-CE-1
  var SHARP_AMT = 0.5, SHARP_TH = 3;                                   // HC-P-CE-1
  var SIMILAR = 2 / 3;                                                 // HC-P-STC-2
  var LBL = { available: 'Available', archived: 'Archived', scheduled: 'Scheduled',
              single: 'Single', span: 'Span', multiple: 'Multiple' };  // HC-P-CE-2
  var CUT_AT = 400;   // the asset list cuts plain text at 400 characters
  var EXTRACT_TIMEOUT_MS = 4 * 60 * 1000;

  var L = null;   // state while open

  function cfg() { return window.TA_CONFIG || {}; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(msg, kind) {
    if (window.InbxASF && window.InbxASF._internal && typeof window.InbxASF._internal.toast === 'function') {
      try { window.InbxASF._internal.toast(msg, kind === 'err' ? 'error' : kind || 'info'); return; } catch (e) {}
    }
    console[kind === 'err' ? 'warn' : 'log'](TAG, msg);
  }
  function tz() { return cfg().titleTimezone || 'America/New_York'; }
  function issueYear(name) { var m = String(name || '').match(/(19|20)\d\d/); return m ? m[0] : String(new Date().getFullYear()); }
  function trim(v) { return String(v == null ? '' : v).trim(); }
  function normText(s) {
    return String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/['\u2019]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  }
  function similarName(a, b) {
    var A = normText(a), B = normText(b);
    if (!A || !B) return false;
    if (A === B || A.indexOf(B) !== -1 || B.indexOf(A) !== -1) return true;
    var wa = A.split(' '), wb = B.split(' '), short = wa.length <= wb.length ? wa : wb, long = short === wa ? wb : wa;
    var shared = 0, seen = {};
    short.forEach(function (w) { if (!seen[w] && long.indexOf(w) !== -1) { shared++; seen[w] = 1; } });
    return shared / short.length >= SIMILAR;
  }
  function isTrue(v) { return v === true || v === 'true'; }
  // A printed link often has no https:// ; Webflow's Link field needs one.
  function linkVal(v) { v = trim(v); return v && !/^[a-z][a-z0-9+.-]*:/i.test(v) ? 'https://' + v.replace(/^\/+/, '') : v; }
  function urlKey(v) { return trim(v).toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').replace(/\/+$/, ''); }

  /* ── dates in the title's time zone ─────────────────────── */
  function split(iso, hasTime) {
    if (!iso) return { date: '', time: '' };
    var d = new Date(iso);
    if (isNaN(d.getTime())) return { date: String(iso).slice(0, 10), time: '' };
    try {
      var p = {};
      new Intl.DateTimeFormat('en-CA', { timeZone: tz(), year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      return { date: p.year + '-' + p.month + '-' + p.day, time: hasTime ? p.hour + ':' + p.minute : '' };
    } catch (e) { return { date: String(iso).slice(0, 10), time: '' }; }
  }
  function mon(date) {
    try { return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' }).format(new Date(date + 'T12:00:00Z')); }
    catch (e) { return ''; }
  }
  function dayOf(date) { return String(Number(String(date).slice(8, 10)) || ''); }
  function spanText(a, b) {   // HC-P-CE-3
    if (!a || !b) return '';
    return mon(a) === mon(b) ? mon(a) + ' ' + dayOf(a) + ' \u2013 ' + dayOf(b) : mon(a) + ' ' + dayOf(a) + ' \u2013 ' + mon(b) + ' ' + dayOf(b);
  }
  function niceDate(date) {
    if (!date) return 'no date';
    try { return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(date + 'T12:00:00Z')); }
    catch (e) { return date; }
  }
  function niceTime(t) {
    if (!t) return '';
    var h = Number(t.slice(0, 2)), m = t.slice(3, 5);
    return (h % 12 || 12) + (m === '00' ? '' : ':' + m) + (h < 12 ? ' am' : ' pm');
  }

  /* ── the publisher's events ─────────────────────────────── */
  function loadExisting(fresh) {
    var base = String(cfg().assetListUrl || '').replace(/\/+$/, '');
    if (!base) return Promise.reject(new Error('TA_CONFIG.assetListUrl is not set'));
    return fetch(base + '/list?type=event&title=' + encodeURIComponent(cfg().taItemId || '') + (fresh ? '&fresh=1' : ''))
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {}
        if (!r.ok || !j || j.error) throw new Error((j && j.error) || ('the asset list answered HTTP ' + r.status));
        return j; }); });
  }
  function opts(slug) { return (L.ex.options && L.ex.options[slug]) || {}; }
  function optId(slug, label) {
    var m = opts(slug), want = String(label).toLowerCase();
    for (var k in m) if (String(m[k]).trim().toLowerCase() === want) return k;
    return '';
  }
  function optLabel(slug, id) { return opts(slug)[id] || ''; }
  function shape(it) {
    var fd = it.fieldData || {};
    var st = split(fd['event-start'], !!trim(fd['dt-time'])), en = split(fd['event-end'], !!trim(fd['dt-end-time']));
    return { id: it.id, fd: fd, isDraft: !!it.isDraft, name: trim(fd.name), nameN: normText(fd.name),
             venueN: normText(fd['event-location']), date: st.date, time: st.time, endDate: en.date,
             archived: !!it.isArchived || String(optLabel('status', fd.status)).toLowerCase() === LBL.archived.toLowerCase(),
             titles: [].concat(fd.titles || []) };
  }
  function titleName(id) {
    var t = (L.ex.titles || []).filter(function (x) { return x.id === id; })[0];
    return t ? t.name : 'another title';
  }

  /* ── open / close ────────────────────────────────────────── */
  function open(opts0) {
    if (L) close(true);
    opts0 = opts0 || {};
    var rows = (opts0.rows || []).filter(function (r) { return r && r.pdfUrl && r.pdfPage; });
    if (!rows.length) { toast('No Events page, article or ad on this issue has a stored PDF page to read.', 'err'); return false; }
    if (!window.IxPdfPager || typeof window.IxPdfPager.render !== 'function') { toast('The PDF viewer (ix-pdf-pager) is not loaded on this page.', 'err'); return false; }
    var rank = function (r) { return r.type === 'events-page' ? 0 : r.alsoEvent ? 1 : 2; };
    rows.sort(function (a, b) { return rank(a) - rank(b) || (a.pdfPage || 0) - (b.pdfPage || 0); });
    var start = 0;
    rows.forEach(function (r, i) { if (opts0.startId && r.id === opts0.startId) start = i; });
    L = { rows: rows, src: start, page: rows[start].pdfPage, img: {}, hi: {}, cards: [], seq: 0,
          ex: { loading: true, items: [], list: [], options: {}, titles: [], err: '' },
          reading: false, readErr: '', select: null, write: null, onDone: opts0.onDone || null, stale: false };
    var o = document.createElement('div'); o.className = 'ixce'; document.body.appendChild(o); L.root = o;
    css();
    o.addEventListener('click', onClick);
    o.addEventListener('input', onInput);
    o.addEventListener('change', onChange);
    o.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    loadExisting(false).then(function (j) { if (!L) return; setEx(j); rematch(); draw(); },
      function (e) { if (!L) return; L.ex = { loading: false, items: [], list: [], options: {}, titles: [], err: String(e.message || e) }; draw(); });
    showPage(L.page);
    draw();
    return true;
  }
  function setEx(j) {
    L.ex = { loading: false, items: j.items || [], list: [], options: j.options || {}, titles: j.titles || [],
             err: j.truncated ? 'the event list came back incomplete, so some matches may be missed' : '' };
    L.ex.list = L.ex.items.map(shape);   // after options: shape() reads the status words
  }
  function pending() { return L && L.cards.some(function (c) { return c.on && c.occ.some(function (o) { return o.on && !o.done; }); }); }
  function close(force) {
    if (!L) return;
    if (!force && L.write && !L.write.done) { toast('Wait for the events to finish.', 'info'); return; }
    if (!force && !L.write && pending() && !window.confirm('Close without creating the ticked events? What was read is not kept.')) return;
    document.removeEventListener('keydown', onKey, true);
    if (L.root && L.root.parentNode) L.root.parentNode.removeChild(L.root);
    var done = L.onDone, made = 0;
    L.cards.forEach(function (c) { c.occ.forEach(function (o) { if (o.done && o.done.ok) made++; }); });
    L = null;
    if (done && made) { try { done({ made: made }); } catch (e) {} }
  }
  function onKey(e) {
    if (!L || e.key !== 'Escape') return;
    e.stopPropagation();
    if (L.select) { L.select = null; draw(); return; }
    close(false);
  }

  /* ── pages ───────────────────────────────────────────────── */
  function src() { return L.rows[L.src]; }
  function showPage(n) {
    var r = src(); L.page = n; L.pageErr = '';
    if (L.img[n]) { draw(); return; }
    window.IxPdfPager.render(r.pdfUrl, n, SHOW_W).then(function (u) { if (!L) return; L.img[n] = u; draw(); },
      function (e) { if (!L) return; L.pageErr = 'Could not draw page ' + n + ': ' + ((e && e.message) || e); draw(); });
  }

  /* ── reading ─────────────────────────────────────────────── */
  function read() {
    var r = src(), base = String(cfg().printParseWorker || '').replace(/\/+$/, '');
    if (!base) { L.readErr = 'TA_CONFIG.printParseWorker is not set on this page.'; draw(); return; }
    L.reading = true; L.readErr = ''; draw();
    var job = r.type === 'events-page' ? { kind: 'events' }
      : { kind: 'event-in-block', blockName: r.name, blockKind: r.type === 'article' ? 'article' : 'ad' };
    window.IxPdfPager.render(r.pdfUrl, r.pdfPage, READ_W).then(function (dataUrl) {
      var ctl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); }, EXTRACT_TIMEOUT_MS);
      var body = { kind: job.kind, pdfPage: r.pdfPage, mediaType: 'image/jpeg', image: dataUrl.split(',')[1],
                   titleName: cfg().titleName || '', issueName: r.issueName || '', issueYear: issueYear(r.issueName) };
      if (job.blockName) { body.blockName = job.blockName; body.blockKind = job.blockKind; }
      return fetch(base + '/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
        .then(function (res) { clearTimeout(timer); return res.json().catch(function () { throw new Error('/extract returned HTTP ' + res.status + ' with no JSON'); }); },
              function (e) { clearTimeout(timer); throw (e && e.name === 'AbortError') ? new Error('no answer after 4 minutes') : e; });
    }).then(function (j) {
      if (!L) return;
      if (!j || j.ok !== true) throw new Error((j && j.reason) || '/extract failed');
      var items = j.items || [];
      L.cards = L.cards.filter(function (c) { return c.srcId !== r.id || c.occ.some(function (o) { return o.done; }); });
      items.forEach(function (x) { L.cards.push(card(x, r)); });
      L.reading = false;
      rematch(); draw();
      toast(items.length ? items.length + ' event' + (items.length === 1 ? '' : 's') + ' read from p.' + (r.page || r.pdfPage) : 'No events with a date were found there.', items.length ? 'success' : 'info');
    }).catch(function (e) { if (!L) return; L.reading = false; L.readErr = 'Could not read the events: ' + ((e && e.message) || e); draw(); });
  }
  function card(x, r) {
    var reg = x.registrationRequired === true ? 'yes' : x.registrationRequired === false ? 'no' : '';
    var base = { name: trim(x.title), audience: trim(x.audience), cost: trim(x.cost), venue: trim(x.venueName), room: trim(x.room),
                 street: trim(x.street), city: trim(x.city), state: trim(x.state), zip: trim(x.zip), link: trim(x.link),
                 rain: trim(x.rainPlan), reg: reg, sponsor: trim(x.sponsorCredit), description: trim(x.description) };
    var occ = [], span = false;
    if (x.dates && x.dates.length) {
      x.dates.forEach(function (d) { occ.push({ date: d.date || '', start: d.startTime || x.startTime || '', end: d.endTime || x.endTime || '', endDate: '' }); });
    } else if (x.startDate && x.endDate && x.endDate > x.startDate) {
      span = true; occ.push({ date: x.startDate, start: x.startTime || '', end: x.endTime || '', endDate: x.endDate });
    } else {
      occ.push({ date: x.startDate || '', start: x.startTime || '', end: x.endTime || '', endDate: '' });
    }
    var key = 'c' + (++L.seq);
    return { key: key, srcId: r.id, srcName: r.name, pdfPage: r.pdfPage, issueName: r.issueName || '', span: span,
             base: base, cur: JSON.parse(JSON.stringify(base)), on: true, crop: null,
             unsure: x.check ? (trim(x.checkReason) || 'The reader was unsure of a date or time.') : '', unsureOk: false,
             raw: trim(x.rawText), organiser: trim(x.organiser),
             occ: occ.map(function (b, i) { return { k: key + 'o' + i, base: b, cur: JSON.parse(JSON.stringify(b)), on: true,
                                                     m: null, pick: null, dupOf: null, done: null }; }) };
  }
  function pattern(c) { return c.span ? LBL.span : c.occ.length > 1 ? LBL.multiple : LBL.single; }

  /* ── matching (Section 3.2) ─────────────────────────────── */
  function exactFor(c, o) {
    var n = normText(c.cur.name), v = normText(c.cur.venue);
    return L.ex.list.filter(function (e) {
      return e.nameN === n && e.venueN === v && e.date === o.cur.date && (e.time || '') === (o.cur.start || '') &&
             (!c.span || (e.endDate || '') === (o.cur.endDate || ''));
    });
  }
  function classify(c, o, claimed) {
    if (L.ex.loading) return { kind: 'wait' };
    if (!o.cur.date) return { kind: 'bad', why: 'needs a date' };
    if (!trim(c.cur.name)) return { kind: 'bad', why: 'needs a name' };
    var exact = exactFor(c, o);
    if (exact.length === 1 && !exact[0].archived) return { kind: 'same', e: exact[0] };
    if (exact.length === 1) return { kind: 'check', cands: exact, why: 'It matches an archived event.' };
    if (exact.length > 1) return { kind: 'check', cands: exact, why: 'Two or more existing events match.' };
    var n = normText(c.cur.name), v = normText(c.cur.venue), why = '', cands = [];
    L.ex.list.forEach(function (e) {
      if (claimed[e.id] || !similarName(c.cur.name, e.name)) return;
      var nameEq = e.nameN === n, venueEq = e.venueN === v, whenEq = e.date === o.cur.date && (e.time || '') === (o.cur.start || '');
      var r = '';
      if (nameEq && !e.date) r = 'An event with this name has no date set.';
      else if (nameEq && venueEq) r = 'Same name and venue, different date or time.';
      else if (nameEq) r = 'Same name, different venue.';
      else if (venueEq && whenEq) r = 'Similar name, same venue, date and time.';
      if (r) { cands.push(e); why = why || r; }
    });
    if (cands.length) return { kind: 'check', cands: cands, why: cands.length > 1 ? 'Two or more existing events could be this one.' : why };
    return { kind: 'new' };
  }
  function rematch() {
    var seen = {};
    L.cards.forEach(function (c) {
      var claimed = {};
      c.occ.forEach(function (o) { var x = L.ex.loading ? [] : exactFor(c, o); if (x.length === 1) claimed[x[0].id] = o.k; });
      c.occ.forEach(function (o) {
        if (o.done) return;
        var mine = {}; for (var id in claimed) if (claimed[id] !== o.k) mine[id] = 1;
        o.m = classify(c, o, mine);
        if (o.pick && o.pick.indexOf('same:') === 0 && !(o.m.cands || []).some(function (e) { return 'same:' + e.id === o.pick; })) o.pick = null;
        // A second copy of the same event and date in this batch is unticked,
        // unless the operator ticked it back (o.forced).
        var k = normText(c.cur.name) + '|' + normText(c.cur.venue) + '|' + o.cur.date + '|' + o.cur.start;
        if (c.on && o.cur.date && seen[k] && seen[k] !== o.k) { o.dupOf = seen[k]; if (!o.forced) o.on = false; }
        else { if (o.dupOf && !o.forced) o.on = true; o.dupOf = null; if (c.on && o.on && o.cur.date) seen[k] = o.k; }
      });
    });
  }

  /* ── what a date line will write ────────────────────────── */
  var SAME_FIELDS = [   // card key, payload key, EVENTS slug, how to compare
    ['venue', 'eventLocation', 'event-location', 'norm'], ['room', 'eventVenueRoom', 'venue-room'],
    ['street', 'eventVenueStreetAddress', 'event-address'], ['city', 'eventVenueCity', 'event-city'],
    ['state', 'eventVenueState', 'event-state'], ['zip', 'eventVenueZip', 'venue-zip'],
    ['audience', 'eventAudience', 'event-audience'], ['cost', 'eventCost', 'event-cost'], ['rain', 'rainDate', 'rain-date'],
    ['link', 'eventLink', 'event-link', 'url'], ['sponsor', 'eventSponsorCredit', 'event-sponsor-credit'],
    ['description', 'eventDescription', 'event-description', 'cut']
  ];
  var WORDS = { eventName: 'name', eventLocation: 'venue', eventVenueRoom: 'room', eventVenueStreetAddress: 'street', eventVenueCity: 'city',
    eventVenueState: 'state', eventVenueZip: 'ZIP', eventAudience: 'audience', eventCost: 'cost', rainDate: 'rain plan', eventLink: 'link',
    eventSponsorCredit: 'sponsor', eventDescription: 'description', registrationRequired: 'registration', eventStartDate: 'date',
    datePattern: 'date pattern', recordStatus: 'restored to Available', scheduleStatus: 'schedule status', printIssueSource: 'print issue',
    titleIds: 'this title', mainImageSrc: 'photo', dateOverride: 'date text' };
  function differs(mode, mine, theirs) {
    var a = trim(mine), b = trim(theirs);
    if (!a) return false;                                   // R3: never blank a field
    if (mode === 'norm') return normText(a) !== normText(b);
    if (mode === 'url') return urlKey(a) !== urlKey(b);
    if (mode === 'cut' && b.slice(-1) === '\u2026') return a.indexOf(b.slice(0, -1)) !== 0;
    return a !== b;
  }
  function issueLine(c, fd) {
    var issue = trim(c.issueName); if (!issue) return { f: null };
    var ps = String(fd['print-issue-source'] || '');
    var lines = ps.split(/\r?\n/).map(trim);
    if (lines.indexOf(issue) !== -1) return { f: null };
    if (ps.length >= CUT_AT && ps.slice(-1) === '\u2026') return { f: null, cut: true };
    return { f: issue + (trim(ps) ? '\n' + ps : '') };
  }
  function updFields(c, o, e, picked) {
    var fd = e.fd, cur = c.cur, f = {};
    if (picked && differs('norm', cur.name, fd.name)) f.eventName = trim(cur.name);
    SAME_FIELDS.forEach(function (p) { if (differs(p[3], cur[p[0]], fd[p[2]])) f[p[1]] = p[3] === 'url' ? linkVal(cur[p[0]]) : trim(cur[p[0]]); });
    if (cur.reg && (cur.reg === 'yes') !== isTrue(fd['registration-required'])) f.registrationRequired = cur.reg === 'yes';
    if (picked && (o.cur.date !== e.date || (o.cur.start || '') !== (e.time || '') || (c.span && (o.cur.endDate || '') !== (e.endDate || '')))) {
      f.eventStartDate = o.cur.date; f.eventStartTime = o.cur.start || '';
      if (c.span) { f.eventEndDate = o.cur.endDate; f.dateOverride = spanText(o.cur.date, o.cur.endDate); }
      if (o.cur.end) f.eventEndTime = o.cur.end;
    }
    var dp = optId('date-pattern', pattern(c)); if (dp && fd['date-pattern'] !== dp) f.datePattern = dp;
    if (e.archived) { var av = optId('status', LBL.available); if (av) f.recordStatus = av; }
    if (!fd['schedule-status']) { var sc = optId('schedule-status', LBL.scheduled); if (sc) f.scheduleStatus = sc; }
    var il = issueLine(c, fd); if (il.f) f.printIssueSource = il.f;
    var ta = cfg().taItemId; if (ta && e.titles.indexOf(ta) === -1) f.titleIds = e.titles.concat([ta]);
    if (c.crop) f.mainImageSrc = '(photo)';
    return f;
  }
  function target(c, o) {   // { act: 'new' | 'upd' | 'skip' | 'need' | 'bad' | 'wait', e?, picked? }
    var m = o.m || { kind: 'wait' };
    if (c.unsure && !c.unsureOk) return { act: 'need', unsure: true };
    if (m.kind === 'bad' || m.kind === 'wait') return { act: m.kind };
    if (m.kind === 'same') return { act: 'upd', e: m.e, picked: false };
    if (m.kind === 'new') return { act: 'new' };
    if (!o.pick) return { act: 'need' };
    if (o.pick === 'new') return { act: 'new', picked: true };
    if (o.pick === 'skip') return { act: 'skip', picked: true };
    var id = o.pick.slice(5), e = m.cands.filter(function (x) { return x.id === id; })[0];
    return e ? { act: 'upd', e: e, picked: true } : { act: 'need' };
  }
  function will(c, o) {
    if (o.done) return o.done.ok ? { cls: 'ok', t: o.done.msg } : { cls: 'err', t: o.done.msg };
    if (!c.on || !o.on) return { cls: 'off', t: o.dupOf ? 'Skip \u00b7 same event as another line' : 'Skip' };
    var t = target(c, o), mine = t.picked ? ' (your pick)' : '';
    if (t.act === 'wait') return { cls: 'off', t: 'Checking\u2026' };
    if (t.act === 'bad') return { cls: 'bad', t: 'This date line ' + o.m.why };
    if (t.act === 'need') return { cls: 'need', t: t.unsure ? 'Needs you \u00b7 check the dates' : 'Needs you' };
    if (t.act === 'skip') return { cls: 'off', t: 'Skip' + mine };
    if (t.act === 'new') return { cls: 'new', t: 'New event' + mine };
    var f = Object.keys(updFields(c, o, t.e, t.picked));
    var other = t.e.titles.indexOf(cfg().taItemId) === -1 ? ' \u00b7 from ' + titleName(t.e.titles[0]) : '';
    return f.length ? { cls: 'upd', t: 'Update' + mine + other + ' \u00b7 ' + f.map(function (k) { return WORDS[k] || k; }).join(', ') }
                    : { cls: 'same', t: 'Already up to date' + mine };
  }
  function lines() {
    var out = [];
    L.cards.forEach(function (c) { c.occ.forEach(function (o) { out.push({ c: c, o: o }); }); });
    return out;
  }
  function tally() {
    var t = { nNew: 0, nUpd: 0, need: 0, bad: 0, todo: [] };
    lines().forEach(function (x) {
      if (!x.c.on || !x.o.on || x.o.done) return;
      var w = will(x.c, x.o);
      if (w.cls === 'new') { t.nNew++; t.todo.push(x); }
      else if (w.cls === 'upd') { t.nUpd++; t.todo.push(x); }
      else if (w.cls === 'need') t.need++;
      else if (w.cls === 'bad') t.bad++;
    });
    return t;
  }

  /* ── drawing ─────────────────────────────────────────────── */
  function badge() {
    if (!window.IxInfo || typeof window.IxInfo.badge !== 'function') return '';
    return window.IxInfo.badge({
      file: FILE, version: VERSION, title: 'Create events from print',
      blurb: 'Reads the events printed on an Events page, or announced in an article or ad, and turns each date into an EVENTS record. ' +
             'Every date is matched against this publisher\u2019s events: a certain match is updated, a certain miss is created, and anything ' +
             'in between waits for you side by side. Print never blanks a field. Nothing is green until a fresh read of the event list shows it.',
      scenarios: [ { name: '104 \u00b7 Create an Asset v3.4', note: 'creates a new event (assetType event)' },
                   { name: 'G \u00b7 Studio Read-Write v9.5', note: 'updates an existing event (updateAsset, event)' } ],
      companions: 'Workers: ix-print-parse /extract (events, event-in-block) \u00b7 ix-asset-list /list?type=event \u00b7 Uploadcare upload \u00b7 ix-pdf-pager \u00b7 opened from ta-cadence-board'
    });
  }
  function draw() {
    if (!L) return;
    var focusKey = document.activeElement && L.root.contains(document.activeElement) ? document.activeElement.getAttribute('data-ce-f') : null;
    var r = src(), scroll = (L.root.querySelector('.ixce-list') || {}).scrollTop || 0;
    var groups = [['Events pages', 0], ['Flagged \u201cAlso create event\u201d', 1], ['Other articles and ads', 2]];
    var opts1 = groups.map(function (g) {
      var inner = L.rows.map(function (x, i) {
        var rk = x.type === 'events-page' ? 0 : x.alsoEvent ? 1 : 2; if (rk !== g[1]) return '';
        return '<option value="' + i + '"' + (i === L.src ? ' selected' : '') + '>p.' + esc(x.page || x.pdfPage) + ' \u00b7 ' +
          esc(x.type === 'events-page' ? 'Events page' : x.type === 'article' ? 'Article' : 'Ad') + ' \u00b7 ' + esc(x.name) + '</option>';
      }).join('');
      return inner ? '<optgroup label="' + esc(g[0]) + '">' + inner + '</optgroup>' : '';
    }).join('');
    var max = Number(r.issuePages) || 0, n = L.page, img = L.img[n];
    var sel = L.select ? cardBy(L.select) : null;
    var left =
      '<div class="ixce-bar">' +
        '<select class="ixce-src" data-ce-src' + (L.reading || L.write ? ' disabled' : '') + '>' + opts1 + '</select>' +
        '<button type="button" class="ix-btn ix-btn--primary" data-ce-read' + (L.reading || L.write || L.ex.loading ? ' disabled' : '') + '>' +
          (L.reading ? 'Reading\u2026' : L.cards.some(function (c) { return c.srcId === r.id; }) ? 'Read again' : 'Read events') + '</button>' +
        '<span class="ixce-sp"></span>' +
        '<button type="button" class="ix-btn ix-btn--ghost ix-btn--icon" data-ce-pg="-1"' + (n <= 1 ? ' disabled' : '') + ' aria-label="Previous page">\u2039</button>' +
        '<span class="ixce-pnum">PDF page ' + n + (max ? ' of ' + max : '') + '</span>' +
        '<button type="button" class="ix-btn ix-btn--ghost ix-btn--icon" data-ce-pg="1"' + (max && n >= max ? ' disabled' : '') + ' aria-label="Next page">\u203a</button>' +
      '</div>' +
      (sel ? '<div class="ixce-selhint"><b>Drag a box around the picture for ' + esc(sel.cur.name || 'this event') + '.</b><span class="ixce-sp"></span>' +
             '<button type="button" class="ix-revert" data-ce-selx>Cancel</button></div>' : '') +
      (L.readErr ? '<div class="ixce-err">' + esc(L.readErr) + '</div>' : '') +
      '<div class="ixce-page' + (sel ? ' is-select' : '') + '">' +
        (L.pageErr ? '<div class="ixce-err">' + esc(L.pageErr) + '</div>'
         : img ? '<img src="' + img + '" alt="Print page ' + n + '" draggable="false"' + (sel ? ' data-ce-pageimg' : '') + '>'
         : '<div class="ixce-wait">Drawing page ' + n + '\u2026</div>') +
      '</div>';
    var head = L.ex.loading ? '<div class="ixce-note">Loading this publisher\u2019s events for the match\u2026</div>'
      : L.ex.err ? '<div class="ixce-err">Match: ' + esc(L.ex.err) + '.</div>' : '';
    var cards = L.cards.length ? L.cards.map(cardHtml).join('')
      : '<div class="ixce-empty">' + (L.reading ? 'Claude is reading the page\u2026 about a minute.' :
          'Pick an Events page, article or ad at the top left, then <b>Read events</b>.') + '</div>';
    L.root.innerHTML =
      '<div class="ixce-box" role="dialog" aria-modal="true" aria-label="Create events from print">' +
        '<div class="ixce-head"><div><div class="ixce-eb">Create events from print</div>' +
          '<div class="ixce-title">' + esc(r.issueName || 'This issue') + '</div></div>' +
          '<div class="ixce-hr">' + badge() + '<button type="button" class="ix-revert" data-ce-close>Close</button></div></div>' +
        '<div class="ixce-body"><section class="ixce-left">' + left + '</section>' +
          '<section class="ixce-right">' + head + '<div class="ixce-list">' + cards + '</div></section></div>' +
        '<div class="ixce-foot">' + footHtml() + '</div>' +
      '</div>';
    var li = L.root.querySelector('.ixce-list'); if (li) li.scrollTop = scroll;
    L.stale = false;
    if (focusKey) { var fe = L.root.querySelector('[data-ce-f="' + focusKey + '"]'); if (fe && !fe.disabled) { try { fe.focus({ preventScroll: true }); } catch (e) { fe.focus(); } } }
  }
  function footHtml() {
    if (L.write) {
      var pct = L.write.n ? Math.round(100 * L.write.i / L.write.n) : 0;
      return '<div class="ixce-prog"><div class="ixce-progbar' + (L.write.done ? '' : ' is-run') + '" style="width:' + (L.write.done ? 100 : pct) + '%"></div></div>' +
        '<span class="ixce-ft">' + esc(L.write.line) + '</span><span class="ixce-sp"></span>' +
        (L.write.done ? '<button type="button" class="ix-btn ix-btn--primary" data-ce-close>Done</button>' : '');
    }
    var t = tally(), parts = [];
    if (t.nNew) parts.push(t.nNew + ' new'); if (t.nUpd) parts.push(t.nUpd + ' update' + (t.nUpd === 1 ? '' : 's'));
    var label = t.need ? t.need + ' still need' + (t.need === 1 ? 's' : '') + ' you'
      : t.todo.length ? (t.nNew ? 'Create ' + t.nNew : '') + (t.nNew && t.nUpd ? ' \u00b7 ' : '') + (t.nUpd ? 'Update ' + t.nUpd : '') : 'Create events';
    return '<span class="ixce-ft">' + (parts.length ? parts.join(' \u00b7 ') : 'Nothing ticked to create or update') +
        (t.need ? ' \u00b7 <span class="ixce-needt">' + t.need + ' need' + (t.need === 1 ? 's' : '') + ' you</span>' : '') +
        (t.bad ? ' \u00b7 <span class="ixce-bad">' + t.bad + ' need' + (t.bad === 1 ? 's' : '') + ' a fix</span>' : '') + '</span>' +
      '<span class="ixce-sp"></span>' +
      '<button type="button" class="ix-revert" data-ce-close>Cancel</button>' +
      '<button type="button" class="ix-btn ix-btn--primary" data-ce-go' + (!t.todo.length || t.need || t.bad ? ' disabled' : '') + '>' + label + '</button>';
  }
  function fieldHtml(c, k, label, cls, lock) {
    var v = c.cur[k] == null ? '' : c.cur[k], chg = String(v) !== String(c.base[k] == null ? '' : c.base[k]);
    return '<label class="ixce-f ' + (cls || '') + '"><span>' + label + '</span>' +
      '<input type="text" class="' + (chg ? 'is-chg' : '') + '" data-ce-f="' + c.key + ':' + k + '" value="' + esc(v) + '"' + (lock ? ' disabled' : '') + '></label>';
  }
  function cardHtml(c) {
    var lock = !!(L.write || c.occ.some(function (o) { return o.done; }));
    var edited = JSON.stringify(c.cur) !== JSON.stringify(c.base) || !!c.crop || c.unsureOk ||
                 c.occ.some(function (o) { return o.pick || JSON.stringify(o.cur) !== JSON.stringify(o.base); });
    var nDates = c.occ.length;
    var regChg = c.cur.reg !== c.base.reg;
    var old = null; c.occ.forEach(function (o) { var t = o.m && o.m.kind === 'same' ? o.m.e : null; if (t && !old) old = t.fd; });
    var oldPic = old && (old['event-hero-image-ulc-link-ev-1-only'] || old['event-image-url']);
    return '<div class="ixce-card' + (c.on ? '' : ' is-off') + (L.select === c.key ? ' is-sel' : '') + (edited && !lock ? ' is-pend' : '') + '" data-ce-card="' + c.key + '">' +
      '<div class="ixce-ch">' +
        '<input type="checkbox" data-ce-on="' + c.key + '"' + (c.on ? ' checked' : '') + (lock ? ' disabled' : '') + ' aria-label="Include this event">' +
        '<span class="ixce-from">p.' + esc(c.pdfPage) + ' \u00b7 ' + esc(c.srcName) + ' \u00b7 ' + nDates + ' date' + (nDates === 1 ? '' : 's') + ' \u00b7 ' + esc(pattern(c)) + '</span>' +
        '<span class="ixce-sp"></span>' +
        (edited && !lock ? '<button type="button" class="ix-revert" data-ce-undo="' + c.key + '">cancel</button>' : '') +
        (L.select === c.key ? '<span class="ixce-now">Drawing this photo</span>' : '') +
      '</div>' +
      (c.unsure ? '<div class="ixce-unsure' + (c.unsureOk ? ' is-ok' : '') + '"><b>' + (c.unsureOk ? 'You checked the dates.' : 'The reader was unsure.') + '</b> ' + esc(c.unsure) +
          (c.raw ? '<div class="ixce-raw">Printed: \u201c' + esc(c.raw) + '\u201d</div>' : '') +
          (!c.unsureOk && !lock ? '<button type="button" class="ix-btn ix-btn--ghost" data-ce-unsure="' + c.key + '">Dates look right</button>' : '') + '</div>' : '') +
      '<div class="ixce-cb">' +
        '<div class="ixce-photo">' +
          (c.crop ? '<img src="' + c.crop.show + '" alt="">' : oldPic ? '<img class="is-old" src="' + esc(oldPic) + '" alt="" title="The picture this event has now">' : '<span class="ixce-nopic">No photo</span>') +
          (lock ? '' : '<button type="button" class="ix-btn ix-btn--ghost ixce-drawbtn" data-ce-draw="' + c.key + '">' + (c.crop ? 'Draw again' : 'Draw its photo') + '</button>') +
          (c.crop && !lock ? '<button type="button" class="ix-revert" data-ce-nocrop="' + c.key + '">cancel photo</button>' : '') +
          '<span class="ixce-opt">Optional</span>' +
        '</div>' +
        '<div class="ixce-fields">' +
          fieldHtml(c, 'name', 'Name', 'ixce-f--w3', lock) + fieldHtml(c, 'audience', 'Audience', '', lock) +
          fieldHtml(c, 'venue', 'Venue', 'ixce-f--w2', lock) + fieldHtml(c, 'room', 'Room', '', lock) + fieldHtml(c, 'cost', 'Cost', '', lock) +
          fieldHtml(c, 'street', 'Street', 'ixce-f--w2', lock) + fieldHtml(c, 'city', 'City', '', lock) +
          '<div class="ixce-f ixce-pair">' + fieldHtml(c, 'state', 'State', '', lock) + fieldHtml(c, 'zip', 'ZIP', '', lock) + '</div>' +
          fieldHtml(c, 'link', 'Link', 'ixce-f--w2', lock) + fieldHtml(c, 'rain', 'Rain plan', 'ixce-f--w2', lock) +
          '<label class="ixce-f"><span>Registration</span><select class="' + (regChg ? 'is-chg' : '') + '" data-ce-f="' + c.key + ':reg"' + (lock ? ' disabled' : '') + '>' +
            '<option value=""' + (c.cur.reg === '' ? ' selected' : '') + '>Not printed</option>' +
            '<option value="yes"' + (c.cur.reg === 'yes' ? ' selected' : '') + '>Required</option>' +
            '<option value="no"' + (c.cur.reg === 'no' ? ' selected' : '') + '>Not required</option></select></label>' +
          fieldHtml(c, 'sponsor', 'Sponsor credit', 'ixce-f--w3', lock) +
          '<label class="ixce-f ixce-f--w4"><span>Description</span><textarea rows="2" class="' + (c.cur.description !== c.base.description ? 'is-chg' : '') + '" data-ce-f="' + c.key + ':description"' + (lock ? ' disabled' : '') + '>' + esc(c.cur.description) + '</textarea></label>' +
          (c.organiser ? '<div class="ixce-was">Organiser in print: ' + esc(c.organiser) + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="ixce-occs">' + c.occ.map(function (o) { return occHtml(c, o, lock); }).join('') + '</div>' +
    '</div>';
  }
  function occHtml(c, o, lock) {
    var w = will(c, o), dis = lock || !!o.done ? ' disabled' : '';
    function inp(k, type, aria) {
      var chg = String(o.cur[k] || '') !== String(o.base[k] || '');
      return '<input type="' + type + '" class="' + (chg ? 'is-chg' : '') + '" data-ce-f="' + o.k + ':' + k + '" value="' + esc(o.cur[k] || '') + '" aria-label="' + aria + '"' + dis + '>';
    }
    var html = '<div class="ixce-occ' + (o.pick ? ' is-pend' : '') + '" data-ce-occ="' + o.k + '">' +
      '<div class="ixce-orow">' +
        '<input type="checkbox" data-ce-oon="' + o.k + '"' + (o.on ? ' checked' : '') + dis + ' aria-label="Include this date">' +
        inp('date', 'date', 'Date') + inp('start', 'time', 'Start time') + '<span class="ixce-to">to</span>' + inp('end', 'time', 'End time') +
        (c.span ? '<span class="ixce-to">until</span>' + inp('endDate', 'date', 'Last day') : '') +
        '<span class="ixce-sp"></span>' +
        (o.pick && !lock ? '<button type="button" class="ix-revert" data-ce-unpick="' + o.k + '">cancel</button>' : '') +
        '<span class="ixce-will ixce-will--' + w.cls + '">' + esc(w.t) + '</span>' +
      '</div>';
    if (!o.done && !o.pick && c.on && o.on && o.m && o.m.kind === 'check' && !(c.unsure && !c.unsureOk) && !lock) html += compareHtml(c, o);
    return html + '</div>';
  }
  function cell(label, mine, theirs, mode) {
    var d = differs(mode || 'norm', mine, theirs);
    return '<div class="ixce-cl">' + label + '</div><div class="ixce-cv' + (d ? ' is-diff' : '') + '">' + esc(theirs || '\u2014') + '</div>';
  }
  function compareHtml(c, o) {
    var when = niceDate(o.cur.date) + (o.cur.start ? ', ' + niceTime(o.cur.start) : '') + (c.span && o.cur.endDate ? ' until ' + niceDate(o.cur.endDate) : '');
    var left = '<div class="ixce-cmp-col ixce-cmp-print"><div class="ixce-cmp-h">As printed</div><div class="ixce-cg">' +
      '<div class="ixce-cl">Name</div><div class="ixce-cv">' + esc(c.cur.name) + '</div>' +
      '<div class="ixce-cl">Venue</div><div class="ixce-cv">' + esc(c.cur.venue || '\u2014') + '</div>' +
      '<div class="ixce-cl">When</div><div class="ixce-cv">' + esc(when) + '</div>' +
      '<div class="ixce-cl">Audience</div><div class="ixce-cv">' + esc(c.cur.audience || '\u2014') + '</div>' +
      '<div class="ixce-cl">Cost</div><div class="ixce-cv">' + esc(c.cur.cost || '\u2014') + '</div></div>' +
      '<div class="ixce-cmp-btns"><button type="button" class="ix-btn ix-btn--ghost" data-ce-pick="' + o.k + '|new">Different, create new</button>' +
      '<button type="button" class="ix-revert" data-ce-pick="' + o.k + '|skip">Skip</button></div></div>';
    var right = o.m.cands.map(function (e) {
      var fd = e.fd, ewhen = e.date ? niceDate(e.date) + (e.time ? ', ' + niceTime(e.time) : '') + (e.endDate && e.endDate !== e.date ? ' until ' + niceDate(e.endDate) : '') : 'no date';
      var pic = fd['event-hero-image-ulc-link-ev-1-only'] || fd['event-image-url'];
      var hist = trim(String(fd['print-issue-source'] || '').split(/\r?\n/)[0]);
      var whenDiff = e.date !== o.cur.date || (e.time || '') !== (o.cur.start || '');
      return '<div class="ixce-cmp-col' + (o.pick === 'same:' + e.id ? ' is-picked' : '') + '"><div class="ixce-cmp-h">In Webflow' +
          (e.archived ? ' <span class="ixce-arch">Archived</span>' : '') + (e.isDraft ? ' <span class="ixce-arch">Draft</span>' : '') + '</div>' +
        (pic ? '<img class="ixce-cmp-pic" src="' + esc(pic) + '" alt="">' : '') +
        '<div class="ixce-cg">' +
          cell('Name', c.cur.name, e.name) + cell('Venue', c.cur.venue, fd['event-location']) +
          '<div class="ixce-cl">When</div><div class="ixce-cv' + (whenDiff ? ' is-diff' : '') + '">' + esc(ewhen) + '</div>' +
          cell('Audience', c.cur.audience, fd['event-audience'], 'plain') + cell('Cost', c.cur.cost, fd['event-cost'], 'plain') +
          '<div class="ixce-cl">Titles</div><div class="ixce-cv">' + esc(e.titles.map(titleName).join(', ') || '\u2014') + '</div>' +
          '<div class="ixce-cl">Last print</div><div class="ixce-cv">' + esc(hist || '\u2014') + '</div>' +
        '</div>' +
        '<div class="ixce-cmp-btns"><button type="button" class="ix-btn ix-btn--primary" data-ce-pick="' + o.k + '|same:' + e.id + '">Same one, update it</button></div></div>';
    }).join('');
    return '<div class="ixce-cmp"><div class="ixce-cmp-why">' + esc(o.m.why) + '</div><div class="ixce-cmp-grid">' + left + right + '</div></div>';
  }

  /* ── events ──────────────────────────────────────────────── */
  function cardBy(k) { return L.cards.filter(function (c) { return c.key === k; })[0]; }
  function occBy(k) {
    for (var i = 0; i < L.cards.length; i++) for (var j = 0; j < L.cards[i].occ.length; j++) if (L.cards[i].occ[j].k === k) return { c: L.cards[i], o: L.cards[i].occ[j] };
    return null;
  }
  function onClick(e) {
    if (!L) return;
    var t = e.target, a;
    if (t.closest('[data-ce-close]')) { close(!!(L.write && L.write.done)); return; }
    if (t.closest('[data-ce-read]')) { read(); return; }
    if ((a = t.closest('[data-ce-pg]'))) { showPage(Math.max(1, L.page + Number(a.getAttribute('data-ce-pg')))); return; }
    if ((a = t.closest('[data-ce-draw]'))) {
      var dc = cardBy(a.getAttribute('data-ce-draw')); L.select = dc.key;
      if (L.page !== dc.pdfPage) showPage(dc.pdfPage); else draw();
      return;
    }
    if (t.closest('[data-ce-selx]')) { L.select = null; draw(); return; }
    if ((a = t.closest('[data-ce-nocrop]'))) { cardBy(a.getAttribute('data-ce-nocrop')).crop = null; draw(); return; }
    if ((a = t.closest('[data-ce-unsure]'))) { cardBy(a.getAttribute('data-ce-unsure')).unsureOk = true; rematch(); draw(); return; }
    if ((a = t.closest('[data-ce-pick]'))) {
      var p = a.getAttribute('data-ce-pick').split('|'), x = occBy(p[0]); if (x) x.o.pick = p[1]; draw(); return;
    }
    if ((a = t.closest('[data-ce-unpick]'))) { var y = occBy(a.getAttribute('data-ce-unpick')); if (y) y.o.pick = null; draw(); return; }
    if ((a = t.closest('[data-ce-undo]'))) {
      var u = cardBy(a.getAttribute('data-ce-undo'));
      u.cur = JSON.parse(JSON.stringify(u.base)); u.crop = null; u.unsureOk = false;
      u.occ.forEach(function (o) { o.cur = JSON.parse(JSON.stringify(o.base)); o.pick = null; o.on = true; o.forced = false; o.dupOf = null; });
      rematch(); draw(); return;
    }
    if (t.closest('[data-ce-go]')) { go(); return; }
    if (L.stale && !t.closest('input,select,textarea,button')) draw();
  }
  function setField(t) {
    var p = t.getAttribute('data-ce-f').split(':'), c = cardBy(p[0]), x = c ? null : occBy(p[0]);
    var obj = c || (x && x.o); if (!obj) return;
    obj.cur[p[1]] = t.value;
    t.classList.toggle('is-chg', String(t.value) !== String(obj.base[p[1]] == null ? '' : obj.base[p[1]]));
  }
  function onInput(e) {
    if (!L) return;
    var t = e.target;
    if (t.hasAttribute('data-ce-f') && t.tagName !== 'SELECT') { setField(t); rematch(); drawLight(); }
  }
  function onChange(e) {
    if (!L) return;
    var t = e.target;
    if (t.hasAttribute('data-ce-src')) { L.src = Number(t.value) || 0; L.readErr = ''; showPage(src().pdfPage); return; }
    if (t.hasAttribute('data-ce-on')) { cardBy(t.getAttribute('data-ce-on')).on = t.checked; rematch(); draw(); return; }
    if (t.hasAttribute('data-ce-oon')) { var x = occBy(t.getAttribute('data-ce-oon')); x.o.on = t.checked; x.o.forced = t.checked; rematch(); draw(); return; }
    if (t.hasAttribute('data-ce-f')) {
      setField(t); rematch();
      if (t.tagName === 'SELECT' || t.type === 'date' || t.type === 'time') draw(); else drawLight();
    }
  }
  // While typing: refresh the line statuses and the foot only, keep focus.
  // If an outcome changed shape (a compare panel must appear or go), the
  // list is redrawn on the next click outside a field (never mid-click on
  // a button, so no click is lost).
  function drawLight() {
    lines().forEach(function (x) {
      var row = L.root.querySelector('[data-ce-occ="' + x.o.k + '"]'); if (!row) return;
      var el = row.querySelector('.ixce-will'), w = will(x.c, x.o);
      if (el) { el.className = 'ixce-will ixce-will--' + w.cls; el.textContent = w.t; }
      var hasCmp = !!row.querySelector('.ixce-cmp'), wants = !!(x.c.on && x.o.on && !x.o.pick && x.o.m && x.o.m.kind === 'check' && !(x.c.unsure && !x.c.unsureOk));
      if (hasCmp !== wants) L.stale = true;
    });
    var f = L.root.querySelector('.ixce-foot'); if (f) f.innerHTML = footHtml();
  }

  /* ── photo box (optional) ───────────────────────────────── */
  function onDown(e) {
    var img = e.target.closest && e.target.closest('[data-ce-pageimg]');
    if (!img || !L.select) return;
    e.preventDefault();
    var host = img.parentNode, hr = host.getBoundingClientRect();
    var box = document.createElement('div'); box.className = 'ixce-box-sel'; host.appendChild(box);
    var x0 = e.clientX, y0 = e.clientY;
    function place(x1, y1) {
      var ir = img.getBoundingClientRect();
      var l = Math.max(ir.left, Math.min(x0, x1)), t = Math.max(ir.top, Math.min(y0, y1));
      var r = Math.min(ir.right, Math.max(x0, x1)), b = Math.min(ir.bottom, Math.max(y0, y1));
      box.style.left = (l - hr.left) + 'px'; box.style.top = (t - hr.top) + 'px';
      box.style.width = Math.max(0, r - l) + 'px'; box.style.height = Math.max(0, b - t) + 'px';
      return { fx: (l - ir.left) / ir.width, fy: (t - ir.top) / ir.height, fw: (r - l) / ir.width, fh: (b - t) / ir.height, w: r - l, h: b - t };
    }
    var last = place(x0, y0);
    function mv(ev) { last = place(ev.clientX, ev.clientY); }
    function up() {
      document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up);
      if (last.w < MIN_BOX || last.h < MIN_BOX) { if (box.parentNode) box.parentNode.removeChild(box); return; }
      cropHi(L.select, L.page, last);
    }
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
  }
  function cropHi(key, n, f) {
    var c = cardBy(key), r = src();
    var hi = L.hi[n] || (L.hi[n] = window.IxPdfPager.render(r.pdfUrl, n, CROP_W));
    hi.then(function (u) {
      return new Promise(function (res, rej) {
        var im = new Image();
        im.onload = function () {
          var sx = Math.round(f.fx * im.naturalWidth), sy = Math.round(f.fy * im.naturalHeight);
          var w = Math.round(f.fw * im.naturalWidth), h = Math.round(f.fh * im.naturalHeight);
          var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          cv.getContext('2d').drawImage(im, sx, sy, w, h, 0, 0, w, h);
          try { sharpen(cv); } catch (e) { console.warn(TAG, 'sharpen skipped:', e); }
          res({ data: cv.toDataURL('image/jpeg', 0.92), w: w, h: h });
        };
        im.onerror = function () { rej(new Error('the page image could not be read')); };
        im.src = u;
      });
    }).then(function (cr) {
      if (!L || !c) return;
      c.crop = { data: cr.data, show: cr.data, w: cr.w, h: cr.h, url: '' };
      L.select = null; draw();
    }).catch(function (e) { if (!L) return; delete L.hi[n]; L.select = null; draw(); toast('Could not cut the photo: ' + ((e && e.message) || e), 'err'); });
  }
  function sharpen(cv) {   // light unsharp mask, same as ta-create-listings v1.0.3
    var w = cv.width, h = cv.height; if (w < 3 || h < 3) return;
    var ctx = cv.getContext('2d'), img = ctx.getImageData(0, 0, w, h), d = img.data;
    var n = w * h, tmp = new Float32Array(n), blur = new Float32Array(n), ch, x, y, i;
    for (ch = 0; ch < 3; ch++) {
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
        i = y * w + x; var l = x ? i - 1 : i, r = x < w - 1 ? i + 1 : i;
        tmp[i] = (d[l * 4 + ch] + 2 * d[i * 4 + ch] + d[r * 4 + ch]) / 4;
      }
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
        i = y * w + x; var u = y ? i - w : i, dn = y < h - 1 ? i + w : i;
        blur[i] = (tmp[u] + 2 * tmp[i] + tmp[dn]) / 4;
      }
      for (i = 0; i < n; i++) {
        var v = d[i * 4 + ch], diff = v - blur[i];
        if (diff > SHARP_TH || diff < -SHARP_TH) d[i * 4 + ch] = v + SHARP_AMT * diff;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  function upload(c) {
    if (!c.crop) return Promise.resolve('');
    if (c.crop.url) return Promise.resolve(c.crop.url);
    var k = cfg().uploadcarePublicKey || cfg().uploadcareKey;
    if (!k) return Promise.reject(new Error('TA_CONFIG.uploadcarePublicKey is missing'));
    return fetch(c.crop.data).then(function (r) { return r.blob(); }).then(function (blob) {
      var fd = new FormData();
      fd.append('UPLOADCARE_PUB_KEY', k); fd.append('UPLOADCARE_STORE', '1');
      fd.append('file', blob, 'event-' + normText(c.cur.name).replace(/ /g, '-').slice(0, 60) + '.jpg');
      return fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: fd });
    }).then(function (r) { if (!r.ok) throw new Error('Uploadcare HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        if (!d || !d.file) throw new Error('Uploadcare returned no file');
        var base = (cfg().uploadcareBase || 'https://ucarecdn.com').replace(/\/$/, '');
        return (c.crop.url = base + '/' + d.file + '/');
      });
  }

  /* ── create / update ─────────────────────────────────────── */
  function postJson(url, body) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {}
        if (!r.ok) throw new Error('HTTP ' + r.status);
        if (!j || j.ok !== true) throw new Error((j && (j.error || j.message)) || 'the scenario did not confirm (' + String(t).slice(0, 60) + ')');
        return j; }); });
  }
  function createOne(c, o, photo) {
    var url = cfg().makeCreateAssets; if (!url) return Promise.reject(new Error('TA_CONFIG.makeCreateAssets is not set'));
    var cur = c.cur, f = {
      eventName: trim(cur.name), eventDescription: trim(cur.description), eventLocation: trim(cur.venue), eventVenueRoom: trim(cur.room),
      eventVenueStreetAddress: trim(cur.street), eventVenueCity: trim(cur.city), eventVenueState: trim(cur.state), eventVenueZip: trim(cur.zip),
      eventStartDate: o.cur.date, eventStartTime: o.cur.start || '', eventEndDate: c.span ? o.cur.endDate || '' : '', eventEndTime: o.cur.end || '',
      eventLink: linkVal(cur.link), eventSponsorCredit: trim(cur.sponsor), eventAudience: trim(cur.audience), eventCost: trim(cur.cost),
      rainDate: trim(cur.rain), datePattern: optId('date-pattern', pattern(c)), scheduleStatus: optId('schedule-status', LBL.scheduled),
      recordStatus: optId('status', LBL.available), dateOverride: c.span ? spanText(o.cur.date, o.cur.endDate) : '',
      printIssueSource: trim(c.issueName), eventImageMediaId: '', eventImageSrc: photo || '', eventImageAlt: photo ? trim(cur.name) : '' };
    if (cur.reg) f.registrationRequired = cur.reg === 'yes';
    o.sent = f;
    return postJson(url, { action: 'createAsset', assetType: 'event', titleSlug: cfg().titleSlug || '', taItemId: cfg().taItemId || '',
      source: 'ta-create-events-v' + VERSION + ' ' + (c.issueName || '') + ' p.' + c.pdfPage, fields: f })
      .then(function (j) {
        var id = j.itemId || j.eventItemId || '';
        if (!id) throw new Error('Scenario 104 returned no item id');
        if (j.published === false) return { ok: false, id: id, made: true, msg: 'Created as a draft, but Webflow refused to publish it' + (j.publishError ? ' (' + j.publishError + ')' : '') };
        return { ok: true, id: id, made: true, msg: 'Created' };
      });
  }
  function updateOne(c, o, e, picked, photo) {
    var url = cfg().makeStudio; if (!url) return Promise.reject(new Error('TA_CONFIG.makeStudio (Scenario G) is not set'));
    var f = updFields(c, o, e, picked);
    if (photo) f.mainImageSrc = photo; else delete f.mainImageSrc;
    o.sent = f;
    return postJson(url, { action: 'updateAsset', assetType: 'event', itemId: e.id, articleId: e.id, titleSlug: cfg().titleSlug || '',
      op: 'save-draft', version: 'ta-create-events-' + VERSION, fields: f, timestamp: new Date().toISOString() })
      .then(function (j) {
        if (j.published === false) return { ok: false, id: e.id, msg: 'Updated, but Webflow refused to publish it' + (j.publishError ? ' (' + j.publishError + ')' : '') };
        return { ok: true, id: e.id, msg: 'Updated' };
      });
  }
  function go() {
    var t = tally(); if (!t.todo.length || t.need || t.bad) return;
    var list = t.todo.map(function (x) { var tg = target(x.c, x.o); return { c: x.c, o: x.o, tg: tg }; });
    L.write = { i: 0, n: list.length, line: 'Starting\u2026', done: false };
    draw();
    var chain = Promise.resolve();
    list.forEach(function (x, i) {
      chain = chain.then(function () {
        if (!L) return;
        var upd = x.tg.act === 'upd';
        L.write.i = i; L.write.line = (upd ? 'Updating ' : 'Creating ') + (i + 1) + ' of ' + list.length + ': ' + x.c.cur.name + ' \u00b7 ' + niceDate(x.o.cur.date); draw();
        return upload(x.c).then(function (photo) { return upd ? updateOne(x.c, x.o, x.tg.e, x.tg.picked, photo) : createOne(x.c, x.o, photo); })
          .then(function (res) { x.o.done = res; }, function (e) { x.o.done = { ok: false, msg: (upd ? 'Not updated: ' : 'Not created: ') + ((e && e.message) || e) }; })
          .then(function () { if (L) { L.write.i = i + 1; draw(); } });
      });
    });
    chain.then(function () { if (!L) return; L.write.line = 'Checking what Webflow holds\u2026'; draw(); return verify(list); })
      .then(function () {
        if (!L) return;
        var ok = list.filter(function (x) { return x.o.done && x.o.done.ok; }).length;
        L.write.line = ok + ' of ' + list.length + ' confirmed in Webflow' + (ok < list.length ? ' \u2014 the others say why on their lines' : '');
        L.write.done = true; draw();
      });
  }
  // Green only from a fresh read of the event list (TOAST-TRUTH).
  function verify(list) {
    return loadExisting(true).then(function (j) {
      if (!L) return;
      setEx(j);
      var by = {}; L.ex.list.forEach(function (e) { by[e.id] = e; });
      list.forEach(function (x) {
        var d = x.o.done; if (!d || !d.ok) return;
        var e = by[d.id];
        if (!e) { x.o.done = { ok: false, msg: 'Sent, but the event list does not show it yet. Reload the Asset Library to check.' }; return; }
        var s = x.o.sent || {}, fd = e.fd, miss = [];
        if ('eventName' in s && normText(fd.name) !== normText(s.eventName)) miss.push('name');
        if (s.eventStartDate && e.date !== s.eventStartDate) miss.push('date');
        if (s.eventStartDate && (s.eventStartTime || '') !== (e.time || '')) miss.push('time');
        SAME_FIELDS.forEach(function (p) { if (trim(s[p[1]]) && differs(p[3], s[p[1]], fd[p[2]])) miss.push(WORDS[p[1]]); });
        if ('registrationRequired' in s && isTrue(fd['registration-required']) !== s.registrationRequired) miss.push('registration');
        if (s.datePattern && fd['date-pattern'] !== s.datePattern) miss.push('date pattern');
        if (s.recordStatus && fd.status !== s.recordStatus) miss.push('status');
        if (s.printIssueSource && String(fd['print-issue-source'] || '').split(/\r?\n/)[0].trim() !== trim(x.c.issueName)) miss.push('print issue');
        if (s.titleIds && e.titles.indexOf(cfg().taItemId) === -1) miss.push('this title');
        var pic = String(fd['event-hero-image-ulc-link-ev-1-only'] || '');
        if ((s.mainImageSrc || s.eventImageSrc) && pic.indexOf(String(s.mainImageSrc || s.eventImageSrc).replace(/\/$/, '')) !== 0) miss.push('photo');
        if (miss.length) x.o.done = { ok: false, msg: 'Sent, but Webflow does not show the ' + miss.join(', ') };
        else d.msg = d.msg + (e.isDraft ? ' \u00b7 draft in Webflow' : ' \u00b7 checked \u2713');
        if (e.isDraft) d.ok = false;
      });
    }, function (e) {
      if (!L) return;
      list.forEach(function (x) { if (x.o.done && x.o.done.ok) x.o.done = { ok: false, msg: x.o.done.msg + ', but could not be checked (' + ((e && e.message) || e) + ')' }; });
    });
  }

  /* ── styles ──────────────────────────────────────────────── */
  function css() {
    if (document.getElementById('ixce-css')) return;
    var st = document.createElement('style'); st.id = 'ixce-css';
    st.textContent =
      '.ixce{position:fixed;inset:0;z-index:99990;background:rgba(26,58,58,.55);display:flex;align-items:center;justify-content:center;padding:2vh 2vw;}' +
      '.ixce-box{background:#fff;border-radius:12px;width:96vw;max-width:1700px;height:94vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35);font-family:var(--ix-font-body,inherit);color:var(--ix-text-dark,#1A3A3A);}' +
      '.ixce-head{display:flex;align-items:flex-start;justify-content:space-between;padding:16px 24px;border-bottom:1px solid var(--ix-border-soft,#E8E4DA);}' +
      '.ixce-hr{display:flex;align-items:center;gap:14px;}' +
      '.ixce-eb{font:600 11px/1 var(--ix-font-mono,ui-monospace,monospace);letter-spacing:.12em;text-transform:uppercase;color:var(--ix-text-light,#7A8A8A);}' +
      '.ixce-title{font-size:22px;font-weight:700;margin-top:6px;}' +
      '.ixce-body{flex:1;min-height:0;display:grid;grid-template-columns:40% 60%;}' +
      '.ixce-left{min-height:0;display:flex;flex-direction:column;padding:14px 20px;background:var(--ix-cream,#FAF9F5);border-right:1px solid var(--ix-border-soft,#E8E4DA);overflow:hidden;}' +
      '.ixce-right{min-height:0;display:flex;flex-direction:column;padding:14px 20px;}' +
      '.ixce-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:0 0 auto;margin-bottom:10px;}' +
      '.ixce-src{max-width:100%;flex:1 1 220px;min-width:0;font:inherit;font-size:14px;padding:7px 8px;border:1px solid var(--ix-border,#DDD8CC);border-radius:6px;background:#fff;}' +
      '.ixce-sp{flex:1 1 auto;}' +
      '.ixce-pnum{font-size:13px;color:var(--ix-text-mid,#4A5A5A);white-space:nowrap;}' +
      '.ixce-page{flex:1 1 0;min-height:0;display:flex;align-items:flex-start;justify-content:center;position:relative;}' +
      '.ixce-page img{max-width:100%;max-height:100%;width:auto;height:auto;display:block;box-shadow:0 4px 14px rgba(0,0,0,.12);background:#fff;user-select:none;-webkit-user-drag:none;}' +
      '.ixce-page.is-select img{cursor:crosshair;outline:3px dashed #E07A5F;}' +
      '.ixce-box-sel{position:absolute;border:2px solid #E07A5F;background:rgba(224,122,95,.15);pointer-events:none;}' +
      '.ixce-selhint{flex:0 0 auto;display:flex;align-items:center;gap:12px;margin-bottom:8px;padding:8px 12px;border:1px solid #E07A5F;border-radius:8px;background:#FDE3DA;font-size:14px;}' +
      '.ixce-list{flex:1;min-height:0;overflow:auto;padding-right:4px;}' +
      '.ixce-card{border:2px solid var(--ix-border,#DDD8CC);border-radius:8px;margin-bottom:12px;background:#fff;}' +
      '.ixce-card.is-pend{border-color:var(--ix-changed-border,#C4A35A);}' +
      '.ixce-card.is-off{opacity:.55;}' +
      '.ixce-card.is-sel{border-color:#E07A5F;background:#FDE3DA;box-shadow:0 0 0 4px rgba(224,122,95,.25);}' +
      '.ixce-now{padding:2px 10px;border-radius:999px;background:#E07A5F;color:#fff;font-weight:700;font-size:12px;white-space:nowrap;}' +
      '.ixce-ch{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--ix-border-soft,#E8E4DA);font-size:13px;}' +
      '.ixce-ch input[type=checkbox],.ixce-orow input[type=checkbox]{width:18px;height:18px;margin:0;flex:0 0 auto;}' +
      '.ixce-from{color:var(--ix-text-mid,#4A5A5A);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}' +
      '.ixce-unsure{margin:10px 12px 0;padding:8px 12px;border-radius:6px;background:#FDF3E1;border:1px solid #E8C98A;font-size:13px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;}' +
      '.ixce-unsure.is-ok{background:#EEF6F1;border-color:#A9D3BD;}' +
      '.ixce-raw{flex:1 1 100%;color:var(--ix-text-mid,#4A5A5A);font-style:italic;}' +
      '.ixce-cb{display:grid;grid-template-columns:160px 1fr;gap:14px;padding:12px;}' +
      '.ixce-photo{display:flex;flex-direction:column;gap:6px;}' +
      '.ixce-photo img{width:160px;height:120px;object-fit:cover;border-radius:4px;border:1px solid #ddd;}' +
      '.ixce-photo img.is-old{opacity:.6;}' +
      '.ixce-nopic{width:160px;height:120px;display:flex;align-items:center;justify-content:center;background:var(--ix-cream,#FAF9F5);border:1px dashed #ccc;border-radius:4px;color:#888;font-size:13px;}' +
      '.ixce-opt{font-size:12px;color:var(--ix-text-light,#7A8A8A);text-align:center;}' +
      '.ixce-fields{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 10px;align-content:start;}' +
      '.ixce-f{display:flex;flex-direction:column;gap:3px;font-size:12px;color:var(--ix-text-mid,#4A5A5A);min-width:0;}' +
      '.ixce-f--w2{grid-column:span 2;}.ixce-f--w3{grid-column:span 3;}.ixce-f--w4{grid-column:1/-1;}' +
      '.ixce-pair{display:grid;grid-template-columns:1fr 1.4fr;gap:6px;}' +
      '.ixce-f input,.ixce-f select,.ixce-f textarea,.ixce-orow input{font:inherit;font-size:14px;color:var(--ix-text-dark,#1A3A3A);padding:6px 8px;border:1px solid var(--ix-border,#DDD8CC);border-radius:6px;min-width:0;background:#fff;}' +
      '.ixce-f textarea{resize:vertical;}' +
      '.ixce .is-chg{border:2px solid var(--ix-changed-border,#C4A35A) !important;box-shadow:0 0 0 3px var(--ix-changed-shadow,rgba(196,163,90,.25));}' +
      '.ixce-was{grid-column:1/-1;font-size:12px;color:var(--ix-text-mid,#4A5A5A);}' +
      '.ixce-occs{border-top:1px solid var(--ix-border-soft,#E8E4DA);padding:6px 12px 10px;}' +
      '.ixce-occ{border:2px solid transparent;border-radius:6px;padding:4px 6px;margin-top:4px;}' +
      '.ixce-occ.is-pend{border-color:var(--ix-changed-border,#C4A35A);}' +
      '.ixce-orow{display:flex;align-items:center;gap:8px;}' +
      '.ixce-orow input[type=date]{width:150px;}.ixce-orow input[type=time]{width:112px;}' +
      '.ixce-to{font-size:12px;color:var(--ix-text-light,#7A8A8A);}' +
      '.ixce-will{padding:2px 8px;border-radius:999px;font-weight:700;font-size:12px;white-space:nowrap;max-width:46%;overflow:hidden;text-overflow:ellipsis;}' +
      '.ixce-will--new{background:#e3eefc;color:#1d4f91;}.ixce-will--upd{background:#fbf1d9;color:#6F5722;}.ixce-will--same{background:#eee;color:#555;}' +
      '.ixce-will--need{background:#FDE3DA;color:#9A3A20;}.ixce-will--bad{background:#fbe3de;color:#A5361F;}' +
      '.ixce-will--off{background:#eee;color:#666;}.ixce-will--ok{background:#dff3ea;color:#1F7A5C;}.ixce-will--err{background:#fbe3de;color:#A5361F;white-space:normal;}' +
      '.ixce-cmp{margin:8px 0 4px;padding:10px;border:1px solid #F0C9BC;border-radius:8px;background:#FFF8F5;}' +
      '.ixce-cmp-why{font-size:13px;font-weight:700;margin-bottom:8px;}' +
      '.ixce-cmp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;}' +
      '.ixce-cmp-col{display:flex;flex-direction:column;gap:8px;background:#fff;border:1px solid var(--ix-border,#DDD8CC);border-radius:6px;padding:8px 10px;}' +
      '.ixce-cmp-col.is-picked{border:2px solid var(--ix-changed-border,#C4A35A);}' +
      '.ixce-cmp-print{background:var(--ix-cream,#FAF9F5);}' +
      '.ixce-cmp-h{font:600 11px/1.2 var(--ix-font-mono,ui-monospace,monospace);letter-spacing:.08em;text-transform:uppercase;color:var(--ix-text-light,#7A8A8A);}' +
      '.ixce-arch{display:inline-block;margin-left:6px;padding:1px 6px;border-radius:999px;background:#eee;color:#555;letter-spacing:0;text-transform:none;}' +
      '.ixce-cmp-pic{width:100%;height:90px;object-fit:cover;border-radius:4px;}' +
      '.ixce-cg{display:grid;grid-template-columns:76px 1fr;gap:3px 8px;font-size:13px;}' +
      '.ixce-cl{color:var(--ix-text-light,#7A8A8A);}' +
      '.ixce-cv{min-width:0;overflow-wrap:anywhere;}' +
      '.ixce-cv.is-diff{background:rgba(196,163,90,.22);box-shadow:inset 3px 0 0 #C4A35A;padding-left:6px;border-radius:3px;}' +
      '.ixce-cmp-btns{display:flex;align-items:center;gap:10px;margin-top:auto;}' +
      '.ixce-needt{color:#9A3A20;font-weight:700;}' +
      '.ixce-bad{color:var(--ix-danger,#A5361F);}' +
      '.ixce-note,.ixce-empty,.ixce-wait{font-size:14px;color:var(--ix-text-mid,#4A5A5A);padding:10px 0;}' +
      '.ixce-err{font-size:14px;color:var(--ix-danger,#A5361F);padding:6px 0;}' +
      '.ixce-foot{position:relative;display:flex;align-items:center;gap:14px;padding:14px 24px;border-top:1px solid var(--ix-border-soft,#E8E4DA);}' +
      '.ixce-ft{font-size:15px;}' +
      '.ixce-prog{position:absolute;left:0;right:0;top:0;height:4px;background:#EFEBE1;}' +
      '.ixce-progbar{height:100%;background:#C4A35A;transition:width .4s ease;}' +
      '.ixce-progbar.is-run{background:linear-gradient(90deg,#C4A35A,#E2C98C,#C4A35A);background-size:200% 100%;animation:ixceRun 1.2s linear infinite;}' +
      '@keyframes ixceRun{from{background-position:200% 0}to{background-position:0 0}}';
    document.head.appendChild(st);
  }

  window.InbxCreateEvents = { open: open, close: function () { close(true); }, version: VERSION };
  console.log(TAG, 'ready');
})();
