/* ta-create-listings-v1.0.0.js
   ============================================================
   ta-create-listings-v1.0.0.js
   INBXIFY TA Studio — CREATE LISTINGS FROM PRINT (RE build step C)

   v1.0.0 (25 Oct 2026, November Build)
     WHY. Intake Review lets the operator tick the homes it finds, but
     nothing ever turned a tick into an RE record: step C was never
     built, and the ticks lived only in the review draft, which is
     deleted when the items go to the Allocator. November's six listings
     were lost that way. Jeff ruled (25 Oct): build it now; each
     listing's photo comes from a box drawn on the print page; a listing
     whose address already exists UPDATES that record.

     WHAT IT DOES
       · Opened from the Allocator: "Create listings" in the board head
         (every RE page and print ad of the issue as a source), or the
         "Listings" link on an RE page row (that row preselected).
       · Read listings: the source page is rendered and sent to the
         ix-print-parse Worker /extract — kind "re" for an RE page,
         "re-in-block" for one named ad — exactly as Intake Review reads
         them. Listing Phase words come from the asset list Worker.
       · Each home is a card: tick, address, price, phase, phase note,
         beds, baths, sq ft, MLS. Anything edited gets the gold border
         and the card's cancel link puts it back.
       · Duplicate check: every address is matched against this title's
         RE records (street part, case, punctuation and suffixes
         normalised: Avenue = Ave). A match UPDATES that record: price,
         phase, phase note and hide-price when they differ, beds / baths
         / sq ft / MLS / brokerage only where the record has none, and
         the photo when one is drawn. A second copy of the same address
         in this batch is unticked.
       · Photo: "Draw its photo" puts the page in select mode; drag a box
         around the home. The crop is cut from a 2400 px render, uploaded
         to Uploadcare, and becomes property-image-link.
       · Create: one listing at a time. New → Scenario 104 createAsset
         (realestate), whose v3 reply says if Webflow refused to publish.
         Existing → Scenario G updateAsset (realestate). Then the asset
         list is read again (fresh) and every listing is checked against
         what Webflow holds. Green only from that read (TOAST-TRUTH).

     NOT DONE (stated, not hidden)
       · No MEDIA row is made for the crop; the listing holds the photo
         by URL (property-image-link), which is what the newsletter
         renders. hero-image-media-item stays empty.
       · The agent (listing-agent-customer) is not set: the print names
         an agent, but matching names to CUSTOMERS is not built.
       · A listing found under ANOTHER title of the publisher is created
         new for this title, with a note; cross-title merging waits for
         the publisher-wide RE ruling.

     NEEDS on the page: TA_CONFIG.printParseWorker, assetListUrl,
     makeCreateAssets (Scenario 104 v3), makeStudio (Scenario G),
     uploadcarePublicKey, taItemId, titleSlug; window.IxPdfPager.

     HARDCODING (provisional)
       HC-P-CL1-1  render widths: 1100 display, 1400 read (matches the
                   parser), 2400 photo crop; minimum box 40 px.
       HC-P-CL1-2  hide price when the phase is "Sold" (copy of
                   ta-print-review HIDE_PRICE_PHASES).
       HC-P-CL1-3  street-suffix table for the address match.
   ============================================================ */
(function () {
  'use strict';
  var VERSION = '1.0.0';
  var TAG = '[ta-create-listings v' + VERSION + ']';
  var SHOW_W = 1100, READ_W = 1400, CROP_W = 2400, MIN_BOX = 40;   // HC-P-CL1-1
  var HIDE_PRICE = ['sold'];                                         // HC-P-CL1-2
  var SUFFIX = { avenue: 'ave', av: 'ave', street: 'st', road: 'rd', drive: 'dr', lane: 'ln', court: 'ct',
    place: 'pl', terrace: 'ter', boulevard: 'blvd', circle: 'cir', parkway: 'pkwy', highway: 'hwy',
    trail: 'trl', way: 'way', north: 'n', south: 's', east: 'e', west: 'w' };        // HC-P-CL1-3
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
  function cleanPrice(v) { var s = String(v == null ? '' : v).replace(/[^0-9.]/g, ''); return s; }
  function money(v) { var n = Number(cleanPrice(v)); return !cleanPrice(v) || isNaN(n) ? '' : '$' + n.toLocaleString('en-US'); }
  function normAddr(a) {
    var street = String(a || '').split(',')[0].toLowerCase().replace(/[.#']/g, '').replace(/[^a-z0-9 ]/g, ' ');
    return street.split(/\s+/).filter(Boolean).map(function (w) { return SUFFIX[w] || w; }).join(' ');
  }
  function issueYear(name) { var m = String(name || '').match(/(19|20)\d\d/); return m ? m[0] : String(new Date().getFullYear()); }

  /* ── existing RE records and phase words ──────────────────── */
  function loadExisting(fresh) {
    var base = String(cfg().assetListUrl || '').replace(/\/+$/, '');
    if (!base) return Promise.reject(new Error('TA_CONFIG.assetListUrl is not set'));
    return fetch(base + '/list?type=realestate&title=' + encodeURIComponent(cfg().taItemId || '') + (fresh ? '&fresh=1' : ''))
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {}
        if (!r.ok || !j || j.error) throw new Error((j && j.error) || ('the asset list answered HTTP ' + r.status));
        return j; }); });
  }
  function phaseMap() { return (L.ex.options && L.ex.options['listing-phase']) || {}; }
  function phaseIdFor(label) {
    var m = phaseMap(), want = String(label || '').trim().toLowerCase();
    for (var k in m) if (String(m[k]).trim().toLowerCase() === want) return k;
    return '';
  }
  function phaseLabel(id) { return phaseMap()[id] || ''; }
  function hides(id) { return HIDE_PRICE.indexOf(String(phaseLabel(id)).trim().toLowerCase()) !== -1; }

  function matchFor(addr) {
    var key = normAddr(addr); if (!key) return null;
    var ta = cfg().taItemId, items = L.ex.items || [], other = null;
    for (var i = 0; i < items.length; i++) {
      var fd = items[i].fieldData || {};
      if (normAddr(fd.name) !== key) continue;
      var titles = [].concat(fd.titles || []);
      if (titles.indexOf(ta) !== -1) return { id: items[i].id, fd: fd, mine: true };
      other = other || { id: items[i].id, fd: fd, mine: false, titles: titles };
    }
    return other;
  }
  function titleName(id) {
    var t = (L.ex.titles || []).filter(function (x) { return x.id === id; })[0];
    return t ? t.name : 'another title';
  }

  /* ── open / close ────────────────────────────────────────── */
  function open(opts) {
    if (L) close(true);
    opts = opts || {};
    var rows = (opts.rows || []).filter(function (r) { return r && r.pdfUrl && r.pdfPage; });
    if (!rows.length) { toast('No RE page or print ad on this issue has a stored PDF page to read.', 'err'); return false; }
    if (!window.IxPdfPager || typeof window.IxPdfPager.render !== 'function') { toast('The PDF viewer (ix-pdf-pager) is not loaded on this page.', 'err'); return false; }
    rows.sort(function (a, b) { return (a.pdfPage || 0) - (b.pdfPage || 0); });
    var start = 0;
    rows.forEach(function (r, i) { if (opts.startId && r.id === opts.startId) start = i; });
    L = { rows: rows, src: start, page: rows[start].pdfPage, img: {}, hi: {}, cards: [], seq: 0,
          ex: { loading: true, items: [], options: {}, titles: [], err: '' },
          reading: false, readErr: '', select: null, write: null, onDone: opts.onDone || null };
    var o = document.createElement('div'); o.className = 'ixcl'; document.body.appendChild(o); L.root = o;
    css();
    o.addEventListener('click', onClick);
    o.addEventListener('input', onInput);
    o.addEventListener('change', onInput);
    o.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    loadExisting(false).then(function (j) { if (!L) return; L.ex = { loading: false, items: j.items || [], options: j.options || {}, titles: j.titles || [], err: j.truncated ? 'the RE list came back incomplete, so some duplicates may be missed' : '' }; rematch(); draw(); },
                             function (e) { if (!L) return; L.ex = { loading: false, items: [], options: {}, titles: [], err: String(e.message || e) }; draw(); });
    showPage(L.page);
    draw();
    return true;
  }
  function pending() { return L && L.cards.some(function (c) { return c.on && !c.done; }); }
  function close(force) {
    if (!L) return;
    if (!force && L.write && !L.write.done) { toast('Wait for the listings to finish.', 'info'); return; }
    if (!force && !L.write && pending() && !window.confirm('Close without creating the ticked listings? What was read is not kept.')) return;
    document.removeEventListener('keydown', onKey, true);
    if (L.root && L.root.parentNode) L.root.parentNode.removeChild(L.root);
    var done = L.onDone, made = L.cards.filter(function (c) { return c.done && c.done.ok; }).length;
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
    var r = src(); L.page = n;
    if (L.img[n]) { draw(); return; }
    window.IxPdfPager.render(r.pdfUrl, n, SHOW_W).then(function (u) { if (!L) return; L.img[n] = u; draw(); },
      function (e) { if (!L) return; L.pageErr = 'Could not draw page ' + n + ': ' + ((e && e.message) || e); draw(); });
  }

  /* ── reading ─────────────────────────────────────────────── */
  function read() {
    var r = src(), base = String(cfg().printParseWorker || '').replace(/\/+$/, '');
    if (!base) { L.readErr = 'TA_CONFIG.printParseWorker is not set on this page.'; draw(); return; }
    L.reading = true; L.readErr = ''; draw();
    var job = r.type === 're-page' ? { kind: 're' } : { kind: 're-in-block', blockName: r.name };
    window.IxPdfPager.render(r.pdfUrl, r.pdfPage, READ_W).then(function (dataUrl) {
      var ctl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); }, EXTRACT_TIMEOUT_MS);
      var body = { kind: job.kind, pdfPage: r.pdfPage, mediaType: 'image/jpeg', image: dataUrl.split(',')[1],
                   titleName: cfg().titleName || '', issueName: r.issueName || '', issueYear: issueYear(r.issueName),
                   phases: Object.keys(phaseMap()).map(function (k) { return String(phaseMap()[k]); }) };
      if (job.blockName) body.blockName = job.blockName;
      return fetch(base + '/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
        .then(function (res) { clearTimeout(timer); return res.json().catch(function () { throw new Error('/extract returned HTTP ' + res.status + ' with no JSON'); }); },
              function (e) { clearTimeout(timer); throw (e && e.name === 'AbortError') ? new Error('no answer after 4 minutes') : e; });
    }).then(function (j) {
      if (!L) return;
      if (!j || j.ok !== true) throw new Error((j && j.reason) || '/extract failed');
      var items = j.items || [], added = 0;
      L.cards = L.cards.filter(function (c) { return c.srcId !== r.id || c.done; });   // re-read replaces this source
      items.forEach(function (x) { L.cards.push(card(x, r)); added++; });
      L.reading = false;
      rematch(); draw();
      toast(added ? added + ' listing' + (added === 1 ? '' : 's') + ' read from p.' + (r.page || r.pdfPage) : 'No homes with a street address were found there.', added ? 'success' : 'info');
    }).catch(function (e) { if (!L) return; L.reading = false; L.readErr = 'Could not read the listings: ' + ((e && e.message) || e); draw(); });
  }
  function card(x, r) {
    var addr = String(x.address || '').trim(); if (x.city) addr += ', ' + String(x.city).trim();
    var base = { address: addr, price: cleanPrice(x.price), phaseId: phaseIdFor(x.phase), phaseNote: String(x.phaseNote || (x.phase ? '' : x.statusPrinted || '')).trim(),
                 bedrooms: String(x.bedrooms || ''), bathrooms: String(x.bathrooms || ''), sqFt: String(x.sqFt || '').replace(/[^0-9.]/g, ''),
                 mls: String(x.mlsNumber || ''), brokerage: String(x.brokerage || ''), description: String(x.description || ''), link: String(x.link || '') };
    return { key: 'c' + (++L.seq), srcId: r.id, srcName: r.name, pdfPage: r.pdfPage, printed: x.statusPrinted || '', agent: x.agentName || '',
             base: base, cur: JSON.parse(JSON.stringify(base)), on: true, crop: null, match: null, dupOf: null, done: null };
  }
  function rematch() {
    var seen = {};
    L.cards.forEach(function (c) {
      c.match = L.ex.loading ? null : matchFor(c.cur.address);
      var k = normAddr(c.cur.address);
      if (k && seen[k] && seen[k] !== c.key) { if (!c.dupOf && !c.done) c.on = false; c.dupOf = seen[k]; }
      else { c.dupOf = null; if (k) seen[k] = c.key; }
    });
  }

  /* ── what a card will do ─────────────────────────────────── */
  function updateFields(c) {
    var fd = c.match.fd || {}, f = {}, cur = c.cur;
    var price = cleanPrice(cur.price), had = fd['property-price'] == null ? '' : String(fd['property-price']);
    if (price && Number(price) !== Number(had || NaN)) f.propertyPrice = price;
    var phaseChanged = cur.phaseId && cur.phaseId !== (fd['listing-phase'] || '');
    if (phaseChanged) f.listingPhase = cur.phaseId;
    if ((cur.phaseNote || phaseChanged) && cur.phaseNote !== (fd['phase-note'] || '')) f.propertyStatus = cur.phaseNote;
    var hp = hides(cur.phaseId || fd['listing-phase']), hadHp = fd['hide-price'] === true || fd['hide-price'] === 'true';
    if (hp !== hadHp && (phaseChanged || hp)) f.hidePrice = hp;
    [['bedrooms', 'bedrooms'], ['bathrooms', 'bathrooms'], ['sqFt', 'sq-ft'], ['mls', 'mls-number'], ['brokerage', 'brokerage']].forEach(function (p) {
      var v = String(cur[p[0]] || '').trim(), old = fd[p[1]];
      if (v && (old == null || String(old).trim() === '')) f[p[0] === 'mls' ? 'propertyMls' : p[0]] = v;
    });
    if (c.crop) f.mainImageSrc = '(photo)';
    return f;
  }
  var F_WORDS = { propertyPrice: 'price', listingPhase: 'phase', propertyStatus: 'phase note', hidePrice: 'hide price', bedrooms: 'beds',
                  bathrooms: 'baths', sqFt: 'sq ft', propertyMls: 'MLS', brokerage: 'brokerage', mainImageSrc: 'photo' };
  function will(c) {
    if (c.done) return c.done.ok ? { cls: 'ok', t: c.done.msg } : { cls: 'err', t: c.done.msg };
    if (!c.on) return { cls: 'off', t: c.dupOf ? 'Skip \u00b7 same address as another card' : 'Skip' };
    if (c.match && c.match.mine) {
      var f = Object.keys(updateFields(c));
      return f.length ? { cls: 'upd', t: 'Update \u00b7 ' + f.map(function (k) { return F_WORDS[k]; }).join(', ') } : { cls: 'off', t: 'Already up to date' };
    }
    var t = 'New listing';
    if (c.match && !c.match.mine) t += ' \u00b7 also under ' + titleName((c.match.titles || [])[0]);
    return { cls: 'new', t: t };
  }
  function problems(c) {
    var p = [];
    if (!String(c.cur.address).trim()) p.push('needs an address');
    if (!(c.match && c.match.mine) && !c.cur.phaseId && !String(c.cur.phaseNote).trim()) p.push('needs a phase or a phase note');
    return p;
  }
  function toDo() { return L.cards.filter(function (c) { if (!c.on || c.done) return false; var w = will(c); return w.cls === 'new' || w.cls === 'upd'; }); }

  /* ── drawing ─────────────────────────────────────────────── */
  function draw() {
    if (!L) return;
    var r = src(), scroll = (L.root.querySelector('.ixcl-list') || {}).scrollTop || 0;
    var opts = L.rows.map(function (x, i) {
      return '<option value="' + i + '"' + (i === L.src ? ' selected' : '') + '>p.' + esc(x.page || x.pdfPage) + ' \u00b7 ' +
        esc(x.type === 're-page' ? 'RE page' : 'Ad') + ' \u00b7 ' + esc(x.name) + '</option>';
    }).join('');
    var max = Number(r.issuePages) || 0, n = L.page;
    var img = L.img[n];
    var sel = L.select ? L.cards.filter(function (c) { return c.key === L.select; })[0] : null;
    var left =
      '<div class="ixcl-bar">' +
        '<select class="ixcl-src" data-cl-src' + (L.reading || L.write ? ' disabled' : '') + '>' + opts + '</select>' +
        '<button type="button" class="ix-btn ix-btn--primary" data-cl-read' + (L.reading || L.write || L.ex.loading ? ' disabled' : '') + '>' +
          (L.reading ? 'Reading\u2026' : L.cards.some(function (c) { return c.srcId === r.id; }) ? 'Read again' : 'Read listings') + '</button>' +
        '<span class="ixcl-sp"></span>' +
        '<button type="button" class="ix-btn ix-btn--ghost ix-btn--icon" data-cl-pg="-1"' + (n <= 1 ? ' disabled' : '') + ' aria-label="Previous page">\u2039</button>' +
        '<span class="ixcl-pnum">PDF page ' + n + (max ? ' of ' + max : '') + '</span>' +
        '<button type="button" class="ix-btn ix-btn--ghost ix-btn--icon" data-cl-pg="1"' + (max && n >= max ? ' disabled' : '') + ' aria-label="Next page">\u203a</button>' +
      '</div>' +
      (sel ? '<div class="ixcl-selhint"><b>Drag a box around the photo of ' + esc(sel.cur.address || 'this home') + '.</b> ' +
             '<button type="button" class="ix-revert" data-cl-selx>Cancel</button></div>' : '') +
      (L.readErr ? '<div class="ixcl-err">' + esc(L.readErr) + '</div>' : '') +
      '<div class="ixcl-page' + (sel ? ' is-select' : '') + '">' +
        (L.pageErr ? '<div class="ixcl-err">' + esc(L.pageErr) + '</div>'
         : img ? '<img src="' + img + '" alt="Print page ' + n + '" draggable="false"' + (sel ? ' data-cl-pageimg' : '') + '>'
         : '<div class="ixcl-wait">Drawing page ' + n + '\u2026</div>') +
      '</div>';

    var head = '';
    if (L.ex.loading) head = '<div class="ixcl-note">Loading this title\u2019s RE listings for the duplicate check\u2026</div>';
    else if (L.ex.err) head = '<div class="ixcl-err">Duplicate check: ' + esc(L.ex.err) + '.</div>';
    var cards = L.cards.length ? L.cards.map(cardHtml).join('')
      : '<div class="ixcl-empty">' + (L.reading ? 'Claude is reading the page\u2026 about a minute.' :
          'Pick the RE page or the agent\u2019s ad at the top left, then <b>Read listings</b>.') + '</div>';

    var foot = footHtml();
    L.root.innerHTML =
      '<div class="ixcl-box" role="dialog" aria-modal="true" aria-label="Create listings from print">' +
        '<div class="ixcl-head"><div><div class="ixcl-eb">Create listings from print</div>' +
          '<div class="ixcl-title">' + esc(r.issueName || 'This issue') + '</div></div>' +
          '<button type="button" class="ix-revert" data-cl-close>Close</button></div>' +
        '<div class="ixcl-body"><section class="ixcl-left">' + left + '</section>' +
          '<section class="ixcl-right">' + head + '<div class="ixcl-list">' + cards + '</div></section></div>' +
        '<div class="ixcl-foot">' + foot + '</div>' +
      '</div>';
    var li = L.root.querySelector('.ixcl-list'); if (li) li.scrollTop = scroll;
  }
  function footHtml() {
    var todo = toDo(), nNew = todo.filter(function (c) { return will(c).cls === 'new'; }).length, nUpd = todo.length - nNew;
    var noPic = todo.filter(function (c) { return will(c).cls === 'new' && !c.crop; }).length;
    var bad = todo.filter(function (c) { return problems(c).length; }).length;
    var foot;
    if (L.write) {
      foot = '<span class="ixcl-ft">' + esc(L.write.line) + '</span><span class="ixcl-sp"></span>' +
        (L.write.done ? '<button type="button" class="ix-btn ix-btn--primary" data-cl-close>Done</button>' : '');
    } else {
      var parts = [];
      if (nNew) parts.push(nNew + ' new'); if (nUpd) parts.push(nUpd + ' update' + (nUpd === 1 ? '' : 's'));
      foot = '<span class="ixcl-ft">' + (parts.length ? parts.join(' \u00b7 ') : 'Nothing ticked to create or update') +
          (noPic ? ' \u00b7 <span class="ixcl-warn">' + noPic + ' new without a photo</span>' : '') +
          (bad ? ' \u00b7 <span class="ixcl-bad">' + bad + ' need' + (bad === 1 ? 's' : '') + ' a fix</span>' : '') + '</span>' +
        '<span class="ixcl-sp"></span>' +
        '<button type="button" class="ix-revert" data-cl-close>Cancel</button>' +
        '<button type="button" class="ix-btn ix-btn--primary" data-cl-go' + (!todo.length || bad ? ' disabled' : '') + '>' +
          (todo.length ? (nNew ? 'Create ' + nNew : '') + (nNew && nUpd ? ' \u00b7 ' : '') + (nUpd ? 'Update ' + nUpd : '') : 'Create listings') + '</button>';
    }
    return foot;
  }
  function fieldHtml(c, k, label, wide, type) {
    var v = c.cur[k] == null ? '' : c.cur[k], chg = String(v) !== String(c.base[k] == null ? '' : c.base[k]);
    return '<label class="ixcl-f' + (wide ? ' ixcl-f--wide' : '') + '"><span>' + label + '</span>' +
      '<input type="' + (type || 'text') + '" class="' + (chg ? 'is-chg' : '') + '" data-cl-f="' + c.key + ':' + k + '" value="' + esc(v) + '"' + (c.done || L.write ? ' disabled' : '') + '></label>';
  }
  function cardHtml(c) {
    var w = will(c), pm = phaseMap(), chgPh = c.cur.phaseId !== c.base.phaseId;
    var phOpts = '<option value="">\u2014 no phase \u2014</option>' + Object.keys(pm).map(function (k) {
      return '<option value="' + esc(k) + '"' + (k === c.cur.phaseId ? ' selected' : '') + '>' + esc(pm[k]) + '</option>'; }).join('');
    var edited = JSON.stringify(c.cur) !== JSON.stringify(c.base) || c.crop;
    var lock = !!(c.done || L.write);
    var prob = problems(c);
    var m = c.match && c.match.mine ? c.match.fd : null;
    return '<div class="ixcl-card' + (c.on ? '' : ' is-off') + (L.select === c.key ? ' is-sel' : '') + '" data-cl-card="' + c.key + '">' +
      '<div class="ixcl-ch">' +
        '<input type="checkbox" data-cl-on="' + c.key + '"' + (c.on ? ' checked' : '') + (lock ? ' disabled' : '') + ' aria-label="Include this listing">' +
        '<span class="ixcl-from">p.' + esc(c.pdfPage) + ' \u00b7 ' + esc(c.srcName) + (c.printed ? ' \u00b7 printed \u201c' + esc(c.printed) + '\u201d' : '') + '</span>' +
        '<span class="ixcl-sp"></span>' +
        (edited && !lock ? '<button type="button" class="ix-revert" data-cl-undo="' + c.key + '">cancel</button>' : '') +
        '<span class="ixcl-will ixcl-will--' + w.cls + '">' + esc(w.t) + '</span>' +
      '</div>' +
      '<div class="ixcl-cb">' +
        '<div class="ixcl-photo">' +
          (c.crop ? '<img src="' + c.crop.show + '" alt="">' : m && m['property-image-link'] ? '<img class="is-old" src="' + esc(m['property-image-link']) + '" alt="" title="The photo this listing has now">' : '<span class="ixcl-nopic">No photo</span>') +
          (lock ? '' : '<button type="button" class="ix-btn ' + (c.crop ? 'ix-btn--ghost' : 'ix-btn--primary') + ' ixcl-drawbtn" data-cl-draw="' + c.key + '">' + (c.crop ? 'Draw again' : 'Draw its photo') + '</button>') +
          (c.crop && !lock ? '<button type="button" class="ix-revert" data-cl-nocrop="' + c.key + '">cancel photo</button>' : '') +
        '</div>' +
        '<div class="ixcl-fields">' +
          fieldHtml(c, 'address', 'Address', true) +
          fieldHtml(c, 'price', 'Price') +
          '<label class="ixcl-f"><span>Phase</span><select class="' + (chgPh ? 'is-chg' : '') + '" data-cl-f="' + c.key + ':phaseId"' + (lock ? ' disabled' : '') + '>' + phOpts + '</select></label>' +
          fieldHtml(c, 'phaseNote', 'Phase note', true) +
          fieldHtml(c, 'bedrooms', 'Beds') + fieldHtml(c, 'bathrooms', 'Baths') + fieldHtml(c, 'sqFt', 'Sq ft') + fieldHtml(c, 'mls', 'MLS') +
          (m ? '<div class="ixcl-was">Now in Webflow: ' + esc(money(m['property-price']) || 'no price') + ' \u00b7 ' + esc(phaseLabel(m['listing-phase']) || 'no phase') +
               (m['phase-note'] ? ' \u00b7 \u201c' + esc(m['phase-note']) + '\u201d' : '') + '</div>' : '') +
          (prob.length && c.on && !c.done ? '<div class="ixcl-bad">This listing ' + esc(prob.join(' and ')) + '.</div>' : '') +
          (c.agent ? '<div class="ixcl-was">Agent in print: ' + esc(c.agent) + ' (not linked)</div>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ── events ──────────────────────────────────────────────── */
  function cardBy(k) { return L.cards.filter(function (c) { return c.key === k; })[0]; }
  function onClick(e) {
    if (!L) return;
    var t = e.target, a;
    if (t.closest('[data-cl-close]')) { close(!!(L.write && L.write.done)); return; }
    if (t.closest('[data-cl-read]')) { read(); return; }
    if ((a = t.closest('[data-cl-pg]'))) { showPage(Math.max(1, L.page + Number(a.getAttribute('data-cl-pg')))); return; }
    if ((a = t.closest('[data-cl-draw]'))) {
      var c = cardBy(a.getAttribute('data-cl-draw')); L.select = c.key;
      if (L.page !== c.pdfPage) showPage(c.pdfPage); else draw();
      return;
    }
    if (t.closest('[data-cl-selx]')) { L.select = null; draw(); return; }
    if ((a = t.closest('[data-cl-nocrop]'))) { cardBy(a.getAttribute('data-cl-nocrop')).crop = null; draw(); return; }
    if ((a = t.closest('[data-cl-undo]'))) {
      var u = cardBy(a.getAttribute('data-cl-undo')); u.cur = JSON.parse(JSON.stringify(u.base)); u.crop = null; rematch(); draw(); return;
    }
    if (t.closest('[data-cl-go]')) { go(); return; }
  }
  function onInput(e) {
    if (!L) return;
    var t = e.target;
    if (t.hasAttribute('data-cl-src')) {
      if (e.type !== 'change') return;
      L.src = Number(t.value) || 0; L.readErr = ''; showPage(src().pdfPage); return;
    }
    if (t.hasAttribute('data-cl-on')) { var c = cardBy(t.getAttribute('data-cl-on')); c.on = t.checked; draw(); return; }
    if (t.hasAttribute('data-cl-f')) {
      var p = t.getAttribute('data-cl-f').split(':'), cc = cardBy(p[0]);
      cc.cur[p[1]] = t.value;
      var chg = String(t.value) !== String(cc.base[p[1]] == null ? '' : cc.base[p[1]]);
      t.classList.toggle('is-chg', chg);
      if (p[1] === 'address') rematch();
      if (t.tagName === 'SELECT') { if (e.type === 'change') draw(); } else drawLight();
    }
  }
  // While typing: refresh only the card's status and the footer, keep focus.
  function drawLight() {
    L.cards.forEach(function (c) {
      var el = L.root.querySelector('[data-cl-card="' + c.key + '"] .ixcl-will');
      if (el) { var w = will(c); el.className = 'ixcl-will ixcl-will--' + w.cls; el.textContent = w.t; }
    });
    var f = L.root.querySelector('.ixcl-foot'); if (f) f.innerHTML = footHtml();
  }

  /* ── photo box ───────────────────────────────────────────── */
  function onDown(e) {
    var img = e.target.closest && e.target.closest('[data-cl-pageimg]');
    if (!img || !L.select) return;
    e.preventDefault();
    var host = img.parentNode, hr = host.getBoundingClientRect();
    var box = document.createElement('div'); box.className = 'ixcl-box-sel'; host.appendChild(box);
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
  function upload(c) {
    if (!c.crop) return Promise.resolve('');
    if (c.crop.url) return Promise.resolve(c.crop.url);
    var k = cfg().uploadcarePublicKey || cfg().uploadcareKey;
    if (!k) return Promise.reject(new Error('TA_CONFIG.uploadcarePublicKey is missing'));
    return fetch(c.crop.data).then(function (r) { return r.blob(); }).then(function (blob) {
      var fd = new FormData();
      fd.append('UPLOADCARE_PUB_KEY', k); fd.append('UPLOADCARE_STORE', '1');
      fd.append('file', blob, 'listing-' + normAddr(c.cur.address).replace(/ /g, '-').slice(0, 60) + '.jpg');
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
  function createOne(c, photo) {
    var url = cfg().makeCreateAssets; if (!url) return Promise.reject(new Error('TA_CONFIG.makeCreateAssets is not set'));
    var cur = c.cur;
    return postJson(url, { action: 'createAsset', assetType: 'realestate', titleSlug: cfg().titleSlug || '', taItemId: cfg().taItemId || '',
      source: 'ta-create-listings-v' + VERSION + ' ' + (src().issueName || '') + ' p.' + c.pdfPage,
      fields: { propertyAddress: cur.address.trim(), propertyMls: cur.mls, listingPhase: cur.phaseId, propertyStatus: cur.phaseNote,
        propertyPrice: cleanPrice(cur.price), hidePrice: hides(cur.phaseId), bedrooms: cur.bedrooms, bathrooms: cur.bathrooms, sqFt: cur.sqFt,
        brokerage: cur.brokerage, propertyFeatures: cur.description, propertyLink: cur.link, listingStatus: '',
        listingImageMediaId: '', listingImageSrc: photo, listingImageAlt: '',
        customerId: '', customerName: '', newsletterId: '', newsletterName: '', newsletterDate: '', revenueType: '' } })
      .then(function (j) {
        var id = j.itemId || j.reItemId || '';
        if (!id) throw new Error('Scenario 104 returned no item id');
        c.newId = id;
        if (j.published === false) return { ok: false, id: id, msg: 'Created as a draft, but Webflow refused to publish it' + (j.publishError ? ' (' + j.publishError + ')' : '') };
        return { ok: true, id: id, msg: 'Created' };
      });
  }
  function updateOne(c, photo) {
    var url = cfg().makeStudio; if (!url) return Promise.reject(new Error('TA_CONFIG.makeStudio (Scenario G) is not set'));
    var f = updateFields(c);
    if (photo) f.mainImageSrc = photo; else delete f.mainImageSrc;
    if ('hidePrice' in f) f.hidePrice = !!f.hidePrice;
    return postJson(url, { action: 'updateAsset', assetType: 'realestate', itemId: c.match.id, articleId: c.match.id,
      titleSlug: cfg().titleSlug || '', op: 'save-draft', version: 'ta-create-listings-' + VERSION, fields: f, timestamp: new Date().toISOString() })
      .then(function () { c.sent = f; return { ok: true, id: c.match.id, msg: 'Updated' }; });
  }
  function go() {
    var list = toDo(); if (!list.length) return;
    L.write = { i: 0, n: list.length, line: 'Starting\u2026', done: false };
    draw();
    var chain = Promise.resolve();
    list.forEach(function (c, i) {
      chain = chain.then(function () {
        if (!L) return;
        var upd = c.match && c.match.mine;
        L.write.line = (upd ? 'Updating ' : 'Creating ') + (i + 1) + ' of ' + list.length + ': ' + c.cur.address; draw();
        return upload(c).then(function (photo) { return upd ? updateOne(c, photo) : createOne(c, photo); })
          .then(function (res) { c.done = res; }, function (e) { c.done = { ok: false, msg: (upd ? 'Not updated: ' : 'Not created: ') + ((e && e.message) || e) }; })
          .then(draw);
      });
    });
    chain.then(function () { if (!L) return; L.write.line = 'Checking what Webflow holds\u2026'; draw(); return verify(list); })
      .then(function () {
        if (!L) return;
        var ok = list.filter(function (c) { return c.done && c.done.ok; }).length;
        L.write.line = ok + ' of ' + list.length + ' confirmed in Webflow' + (ok < list.length ? ' \u2014 the others say why on their cards' : '');
        L.write.done = true; draw();
      });
  }
  // Green only from a fresh read of the RE list.
  function verify(list) {
    return loadExisting(true).then(function (j) {
      if (!L) return;
      L.ex.items = j.items || [];
      var by = {}; (j.items || []).forEach(function (x) { by[x.id] = x; });
      list.forEach(function (c) {
        if (!c.done || !c.done.ok) return;
        var it = by[c.done.id], fd = it && it.fieldData;
        if (!fd) { c.done = { ok: false, msg: 'Sent, but the RE list does not show it yet. Reload the Asset Library to check.' }; return; }
        var miss = [];
        if (c.match && c.match.mine) {
          var s = c.sent || {};
          if ('propertyPrice' in s && Number(fd['property-price']) !== Number(s.propertyPrice)) miss.push('price');
          if ('listingPhase' in s && fd['listing-phase'] !== s.listingPhase) miss.push('phase');
          if ('propertyStatus' in s && String(fd['phase-note'] || '') !== String(s.propertyStatus)) miss.push('phase note');
          if (c.crop && c.crop.url && String(fd['property-image-link'] || '').indexOf(c.crop.url.replace(/\/$/, '')) !== 0) miss.push('photo');
        } else {
          if (normAddr(fd.name) !== normAddr(c.cur.address)) miss.push('address');
          if (c.cur.phaseId && fd['listing-phase'] !== c.cur.phaseId) miss.push('phase');
          if (c.crop && !fd['property-image-link']) miss.push('photo');
        }
        if (miss.length) c.done = { ok: false, msg: 'Sent, but Webflow does not show the ' + miss.join(', ') };
        else c.done.msg = c.done.msg + (it.isDraft ? ' \u00b7 draft in Webflow' : ' \u00b7 checked \u2713');
        if (it.isDraft) c.done.ok = false;
      });
    }, function (e) {
      if (!L) return;
      list.forEach(function (c) { if (c.done && c.done.ok) c.done = { ok: false, msg: c.done.msg + ', but could not be checked (' + ((e && e.message) || e) + ')' }; });
    });
  }

  /* ── styles ──────────────────────────────────────────────── */
  function css() {
    if (document.getElementById('ixcl-css')) return;
    var st = document.createElement('style'); st.id = 'ixcl-css';
    st.textContent =
      '.ixcl{position:fixed;inset:0;z-index:99990;background:rgba(26,58,58,.55);display:flex;align-items:center;justify-content:center;padding:2vh 2vw;}' +
      '.ixcl-box{background:#fff;border-radius:12px;width:96vw;max-width:1700px;height:94vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35);font-family:var(--ix-font-body,inherit);color:var(--ix-text-dark,#1A3A3A);}' +
      '.ixcl-head{display:flex;align-items:flex-start;justify-content:space-between;padding:16px 24px;border-bottom:1px solid var(--ix-border-soft,#E8E4DA);}' +
      '.ixcl-eb{font:600 11px/1 var(--ix-font-mono,ui-monospace,monospace);letter-spacing:.12em;text-transform:uppercase;color:var(--ix-text-light,#7A8A8A);}' +
      '.ixcl-title{font-size:22px;font-weight:700;margin-top:6px;}' +
      '.ixcl-body{flex:1;min-height:0;display:grid;grid-template-columns:44% 56%;}' +
      '.ixcl-left{min-height:0;display:flex;flex-direction:column;padding:14px 20px;background:var(--ix-cream,#FAF9F5);border-right:1px solid var(--ix-border-soft,#E8E4DA);overflow:hidden;}' +
      '.ixcl-right{min-height:0;display:flex;flex-direction:column;padding:14px 20px;}' +
      '.ixcl-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:0 0 auto;margin-bottom:10px;}' +
      '.ixcl-src{max-width:100%;flex:1 1 220px;min-width:0;font:inherit;font-size:14px;padding:7px 8px;border:1px solid var(--ix-border,#DDD8CC);border-radius:6px;background:#fff;}' +
      '.ixcl-sp{flex:1 1 auto;}' +
      '.ixcl-pnum{font-size:13px;color:var(--ix-text-mid,#4A5A5A);white-space:nowrap;}' +
      '.ixcl-page{flex:1 1 0;min-height:0;display:flex;align-items:flex-start;justify-content:center;position:relative;}' +
      '.ixcl-page img{max-width:100%;max-height:100%;width:auto;height:auto;display:block;box-shadow:0 4px 14px rgba(0,0,0,.12);background:#fff;user-select:none;-webkit-user-drag:none;}' +
      '.ixcl-page.is-select img{cursor:crosshair;outline:2px dashed #c9a227;}' +
      '.ixcl-box-sel{position:absolute;border:2px solid #c9a227;background:rgba(201,162,39,.15);pointer-events:none;}' +
      '.ixcl-selhint{flex:0 0 auto;margin-bottom:8px;padding:8px 12px;border:1px solid #e5dcc3;border-radius:8px;background:#fffdf6;font-size:14px;}' +
      '.ixcl-list{flex:1;min-height:0;overflow:auto;padding-right:4px;}' +
      '.ixcl-card{border:2px solid var(--ix-border,#DDD8CC);border-radius:8px;margin-bottom:12px;background:#fff;}' +
      '.ixcl-card.is-off{opacity:.55;}' +
      '.ixcl-card.is-sel{border-color:#c9a227;box-shadow:0 0 0 3px rgba(196,163,90,.25);}' +
      '.ixcl-ch{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--ix-border-soft,#E8E4DA);font-size:13px;}' +
      '.ixcl-ch input[type=checkbox]{width:18px;height:18px;}' +
      '.ixcl-from{color:var(--ix-text-mid,#4A5A5A);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}' +
      '.ixcl-will{padding:2px 8px;border-radius:999px;font-weight:700;font-size:12px;white-space:nowrap;}' +
      '.ixcl-will--new{background:#e3eefc;color:#1d4f91;}.ixcl-will--upd{background:#fbf1d9;color:#6F5722;}' +
      '.ixcl-will--off{background:#eee;color:#666;}.ixcl-will--ok{background:#dff3ea;color:#1F7A5C;}.ixcl-will--err{background:#fbe3de;color:#A5361F;white-space:normal;}' +
      '.ixcl-cb{display:grid;grid-template-columns:180px 1fr;gap:14px;padding:12px;}' +
      '.ixcl-photo{display:flex;flex-direction:column;gap:6px;align-items:stretch;}' +
      '.ixcl-photo img{width:180px;height:135px;object-fit:cover;border-radius:4px;border:1px solid #ddd;}' +
      '.ixcl-photo img.is-old{opacity:.6;}' +
      '.ixcl-nopic{width:180px;height:135px;display:flex;align-items:center;justify-content:center;background:var(--ix-cream,#FAF9F5);border:1px dashed #ccc;border-radius:4px;color:#888;font-size:13px;}' +
      '.ixcl-fields{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 10px;align-content:start;}' +
      '.ixcl-f{display:flex;flex-direction:column;gap:3px;font-size:12px;color:var(--ix-text-mid,#4A5A5A);min-width:0;}' +
      '.ixcl-f--wide{grid-column:span 2;}' +
      '.ixcl-f input,.ixcl-f select{font:inherit;font-size:14px;color:var(--ix-text-dark,#1A3A3A);padding:6px 8px;border:1px solid var(--ix-border,#DDD8CC);border-radius:6px;min-width:0;background:#fff;}' +
      '.ixcl-f .is-chg{border:2px solid var(--ix-changed-border,#C4A35A);box-shadow:0 0 0 3px var(--ix-changed-shadow,rgba(196,163,90,.25));}' +
      '.ixcl-was{grid-column:1/-1;font-size:12px;color:var(--ix-text-mid,#4A5A5A);}' +
      '.ixcl-bad{grid-column:1/-1;font-size:13px;color:var(--ix-danger,#A5361F);}' +
      '.ixcl-warn{color:#8a6a12;}' +
      '.ixcl-note,.ixcl-empty,.ixcl-wait{font-size:14px;color:var(--ix-text-mid,#4A5A5A);padding:10px 0;}' +
      '.ixcl-err{font-size:14px;color:var(--ix-danger,#A5361F);padding:6px 0;}' +
      '.ixcl-foot{display:flex;align-items:center;gap:14px;padding:14px 24px;border-top:1px solid var(--ix-border-soft,#E8E4DA);}' +
      '.ixcl-ft{font-size:15px;}';
    document.head.appendChild(st);
  }

  window.InbxCreateListings = { open: open, close: function () { close(true); }, version: VERSION };
  console.log(TAG, 'ready');
})();
