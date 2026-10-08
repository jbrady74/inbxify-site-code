/* ta-create-from-print-v1.0.3.js
   ════════════════════════════════════════════════════════════════
   ta-create-from-print-v1.0.3.js
   INBXIFY TA Studio · Create from print (P1)
   Companion CSS: ta-create-from-print-v1.0.2.css

   v1.0.3 (8 Oct) — LINK EXISTING ARTICLES, A WHOLE ISSUE AT ONCE.
     Jeff, yes: the October 2026 issue was built the old way, so about
     15 print items have articles nothing points at. One Create at a time
     is too slow for that.
       InbxCreateFromPrint.linkMany({ rows, linkedIds, issueName, onDone })
         rows       [{ id, printTitle, page }]  print items with no article
         linkedIds  article ids already linked to some print item (left
                    out, so one article is never linked twice)
         onDone     ({ linked: [{ allocId, articleId }] }) after a save
     The panel reads this title's articles (the same check v1.0.2 does for
     one row), pairs each print item with its best article, strongest
     pairs first, each article used once. Pairs scoring STRONG_AT or
     better start ticked. Each row's dropdown offers its other candidates
     or "No match". Anything changed from the first guess turns gold;
     "Back to the matches" undoes it. Two rows naming the same article
     stop the save and say which. Save sends one 103B "link" batch (the
     route the Picker and Create use), checks every row's read-back
     (written value = the article), and closes only when all landed.
     Rows that failed stay ticked with their reason, for Try again.
     HARDCODING (provisional)
       HC-P-CFP-15 STRONG_AT 0.9 (start ticked), LM_CHOICES 5 per row,
                   batch URL ceiling 1800 (same as the Picker).

   v1.0.2 (8 Oct) — LOOK FOR THE ARTICLE BEFORE BUILDING ONE.
     LIVE (Jeff, October 2026 issue): Create on "Meet Frank And Carol
     Floriani" offered to build an article that already exists. The
     October articles were made the old way, before print items could
     point at them, so the row's Asset exists cell is empty even though
     the article is there.
     Ruling 6 Oct: a title match against an unlinked allocation offers
     to link it. Now the palette checks first:
       · It reads this title's articles from the asset-list Worker
         (TA_CONFIG.assetListUrl, /list?type=article, fresh) and scores
         each name against the printed headline, both ways round.
       · Matches (up to 3) show at the top of the files column: name,
         date, Draft if a draft, and "Link this one". Linking sends the
         same 103B link (and, from a Picker tile, the 124 fill) with the
         same read-back, then closes. No article is built.
       · "None of these, build a new one" puts the matches away.
       · No assetListUrl, or the list fails: the palette says the check
         did not run, and building still works.
     HARDCODING (provisional)
       HC-P-CFP-14 EXISTING_AT 0.6 match floor, EXISTING_MAX 3 shown;
                   'associated-title' as the ARTICLES title reference.

   v1.0.1 (8 Oct, P1.5) — the Asset Form gets the print page too. The
     palette passes open({ printSource }) so "Compare with print" is
     there from the first moment of a new article (ta-asf v1.11.8).
     Older ta-asf ignores the extra key. Nothing else changed.

   v1.0.0 (8 Oct) — first build.
   Scope: Create-From-Print-Scoping-v0_1.md (8 Oct 2026)

   WHAT IT DOES
     One Create action for a printed item that has no article yet.
     The print item is the answer key. Intake is the content. Nothing
     from print is poured into the article.

       1. Match    Propose the Intake files that belong to this item
                   (text match only in P1: title, byline, photo count).
       2. Confirm  The print page large on the left, the proposed files
                   large on the right, ticked. Untick, tick, and add
                   misses from "Show more from Intake".
       3. Build    Open the ASF seeded from the ticked files, exactly as
                   Intake's "make an article from these" does.
       4. Write    When the article is created: Scenario 103B links the
                   print item to it; from a Picker tile, Scenario 124
                   puts it in that tile. Read back from the Data Worker.
       5. Return   Back to where Create was clicked.

   ENTRY POINTS
     · Allocator row (same page):
         InbxCreateFromPrint.open({ allocation: {...}, origin:'allocator',
                                    onDone: fn })
     · Picker tile (plan page): the Picker sends the operator here with
         ?cfp_alloc=<allocation id>&cfp_plan=<plan id>&cfp_slot=<NL-BLOCKS id>
         &cfp_ret=<plan page path>
       This file reads those on load, reads the plan board for the
       allocation, and opens the palette. The params are removed from the
       address bar at once so a reload does not reopen it.

   NEEDS ON THE T-A PAGE
     TA_CONFIG.makeBundles      Scenario I (the Intake pool)
     TA_CONFIG.makeSlateWriter  Scenario 103B (the link)
     TA_CONFIG.makeBlockWriter  Scenario 124 (the tile fill, Picker only)
     TA_CONFIG.planBoard        Data Worker /plan-board, full URL. If
                                absent, derived from TA_CONFIG.planList
                                (/plans -> /plan-board), HC-P-CFP-6.
     TA_CONFIG.taItemId         the title, to keep the pool to its files
     ta-asf v1.11.7+            for afterCreate / onClosed / noWorkbench
     ix-pdf-pager v1.0.0+       to render the print page
     Data Worker v1.0.19+       for byline and image count on allocations

   HARDCODING (provisional ids; the doc chat allocates real numbers)
     HC-P-CFP-2  ALSO_POSSIBLE = 3 bundles ranked under the proposal
     HC-P-CFP-3  the pool is the title's waiting files (not attached,
                 not archived). Platform rule.
     HC-P-CFP-4  palette wording (module strings below)
     HC-P-CFP-5  PRINT_W = 1100 px render width for the print page
     HC-P-CFP-6  /plans -> /plan-board when TA_CONFIG.planBoard is unset
     HC-P-CFP-7  LINK_FIELD_FALLBACK 'asset-article', used only when no
                 plan board names linkFields.article (Allocator path)
     HC-P-CFP-8  match weights 0.6 title / 0.25 byline / 0.15 photos,
                 PROPOSE_AT 0.35
     HC-P-CFP-9  MEDIA option-id fallbacks, the same documented values
                 ta-cadence-board uses; TA_CONFIG.optionIds wins
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.InbxCreateFromPrint) return;

  var VERSION = '1.0.3';
  var FILE = 'ta-create-from-print-v1.0.3.js';
  var STRONG_AT = 0.9, LM_CHOICES = 5;   // HC-P-CFP-15
  var EXISTING_AT = 0.6, EXISTING_MAX = 3;   // HC-P-CFP-14
  var ART_TITLE_FIELD = 'associated-title';  // HC-P-CFP-14
  var TAG = '[cfp v' + VERSION + ']';

  var ALSO_POSSIBLE = 3;                    // HC-P-CFP-2
  var PRINT_W = 1100;                       // HC-P-CFP-5
  var LINK_FIELD_FALLBACK = 'asset-article';// HC-P-CFP-7
  var W_TITLE = 0.6, W_BYLINE = 0.25, W_PHOTOS = 0.15, PROPOSE_AT = 0.35;   // HC-P-CFP-8
  var BATCH_URL_CEILING = 1800;
  var RESULT_KEY = 'ix.cfp.result';         // read by ipp-picker v1.30 on return

  var MEDIA_TYPE_HASH = {                   // HC-P-CFP-9
    image: 'be8534c8e7579ff07ffbd6032f3a4bf7',
    video: '37581cd40911a2cc7b5f2913e3aeba71',
    audio: '97bef53fbe76af04c395e1d9e0419de1',
    text:  '5332c884efac157407557cf3efd387b7'
  };
  var MEDIA_STATUS_HASH = {
    attached: '33d44ad5cec9780f6aacd259c4a44fbc',
    archived: '57a4f54ecb4035d3c5b706222e82dee5'
  };
  var STOP = { the:1, a:1, an:1, and:1, of:1, to:1, in:1, for:1, on:1, at:1, with:1, by:1, is:1, are:1, our:1, your:1, from:1 };

  /* ── helpers ─────────────────────────────────────────────── */
  function cfg() { return window.TA_CONFIG || {}; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function optId(group, key, fallback) {
    var m = (cfg().optionIds && cfg().optionIds[group]) || {};
    return m[key] || fallback;
  }
  function kindOf(fd) {
    var raw = (fd && fd['media-type']) || '';
    if (raw === optId('mediaType', 'text', MEDIA_TYPE_HASH.text)) return 'text';
    if (raw === optId('mediaType', 'image', MEDIA_TYPE_HASH.image)) return 'image';
    if (raw === optId('mediaType', 'video', MEDIA_TYPE_HASH.video)) return 'video';
    if (raw === optId('mediaType', 'audio', MEDIA_TYPE_HASH.audio)) return 'audio';
    return 'other';
  }
  function isWaiting(fd) {
    var st = fd && fd.status;
    return st !== optId('mediaStatus', 'attached', MEDIA_STATUS_HASH.attached) &&
           st !== optId('mediaStatus', 'archived', MEDIA_STATUS_HASH.archived);
  }
  function plainText(html) {
    var d = document.createElement('div');
    d.innerHTML = String(html || '');
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function parseMeta(raw) {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try { var o = JSON.parse(raw); return (o && typeof o === 'object') ? o : {}; } catch (e) { return {}; }
  }
  function words(s) {
    return String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ')
      .trim().split(' ').filter(function (w) { return w && !STOP[w]; });
  }
  // Share of the printed title's words found in s. 1 = every word.
  function titleSim(printTitle, s) {
    var p = words(printTitle), q = words(s);
    if (!p.length || !q.length) return 0;
    if (p.join(' ') === q.join(' ')) return 1;
    var set = {}; q.forEach(function (w) { set[w] = 1; });
    var hit = p.filter(function (w) { return set[w]; }).length;
    return hit / p.length;
  }
  function lastName(byline) {
    var w = words(byline);
    return w.length ? w[w.length - 1] : '';
  }
  function boardUrl() {
    var c = cfg();
    if (c.planBoard) return c.planBoard;
    if (c.planList) return String(c.planList).replace(/\/plans(\?.*)?$/, '/plan-board');   // HC-P-CFP-6
    return '';
  }
  function getJSON(url) {
    return fetch(url, { method: 'GET', credentials: 'omit' }).then(function (r) {
      return r.text().then(function (t) {
        var j; try { j = JSON.parse(t); } catch (e) { throw new Error('the reply was not JSON (HTTP ' + r.status + ')'); }
        if (!r.ok || (j && j.ok === false)) throw new Error((j && j.error) || ('HTTP ' + r.status));
        return j;
      });
    });
  }
  function readBoard(planId) {
    var base = boardUrl();
    if (!base) return Promise.reject(new Error('this page has no TA_CONFIG.planBoard (or planList) address for the Data Worker'));
    return getJSON(base + (base.indexOf('?') < 0 ? '?' : '&') + 'planId=' + encodeURIComponent(planId) + '&fresh=1');
  }
  function batchUrl(url, op, batchId, ops) {
    return url + (url.indexOf('?') < 0 ? '?' : '&') + 'op=' + encodeURIComponent(op) +
      '&batchId=' + encodeURIComponent(batchId) + '&batch=' + encodeURIComponent(JSON.stringify({ ops: ops }));
  }
  // One op per call here; the URL ceiling is checked for safety.
  function sendOne(url, op, oneOp, who) {
    var u = batchUrl(url, op, 'cfp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), [oneOp]);
    if (u.length > BATCH_URL_CEILING * 4) return Promise.reject(new Error(who + ': the request is too long'));
    return fetch(u, { method: 'GET', credentials: 'omit' }).then(function (r) {
      return r.text().then(function (t) {
        if (!r.ok) throw new Error(who + ' answered HTTP ' + r.status);
        var b; try { b = JSON.parse(t); } catch (e) { throw new Error(who + ' sent a reply that is not JSON'); }
        var rows = (b && b.results) || [];
        return rows[0] || null;
      });
    });
  }

  /* ── state ───────────────────────────────────────────────── */
  var S = null;
  function fresh(job) {
    return {
      job: job,                 // { allocation, planId, slotId, returnUrl, origin, onDone }
      board: job.board || null, // plan board, Picker path
      pool: { loading: true, error: '', files: [], groups: [] },
      ranked: [],               // [{ group, score, reasons }]
      proposal: {},             // id -> true, the guess
      picked: {},               // id -> true, what the operator has now
      reasons: {},              // id -> short reason
      found: 0,                 // proposed photos
      showMore: false, q: '',
      page: Number(job.allocation.pdfPage) || 1,
      pageImg: {}, pageErr: '',
      anchor: null,
      write: null,              // last write-back result
      existing: { loading: true, err: '', items: [], dismissed: false },   // v1.0.2
      root: null
    };
  }

  /* ── 1 · the pool and the match ──────────────────────────── */
  function loadPool() {
    var url = cfg().makeBundles;
    if (!url) { S.pool = { loading: false, error: 'This page has no TA_CONFIG.makeBundles address (Scenario I), so Intake cannot be read.', files: [], groups: [] }; draw(); return; }
    if (!cfg().titleSlug) { S.pool = { loading: false, error: 'TA_CONFIG.titleSlug is missing, so Intake cannot be read.', files: [], groups: [] }; draw(); return; }
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titleSlug: cfg().titleSlug }) })
      .then(function (r) { if (!r.ok) throw new Error('Scenario I answered HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        if (!d || d.ok !== true) throw new Error('Scenario I did not answer ok');
        var tenant = cfg().taItemId || (d.tenant && d.tenant.titleAdminId) || '';
        var all = [].concat(Array.isArray(d.media) ? d.media : [], Array.isArray(d.mediaExtra) ? d.mediaExtra : []);
        var files = [];
        all.forEach(function (m) {
          var fd = (m && m.fieldData) || {};
          if (!m || !m.id) return;
          if (tenant && fd['title-admin'] !== tenant) return;   // this title's files only
          if (!isWaiting(fd)) return;                           // HC-P-CFP-3
          var meta = parseMeta(fd['source-metadata']);
          var html = fd['html-content'] || '';
          files.push({
            id: m.id, kind: kindOf(fd), name: fd.name || fd['original-filename'] || 'File',
            imageUrl: fd['image-url'] || (fd.image && fd.image.url) || '',
            html: html, text: kindOf(fd) === 'text' ? plainText(html).slice(0, 600) : '',
            meta: meta, metaRaw: fd['source-metadata'] || '',
            bundleId: fd['bundle-id'] || '', bundleLabel: fd['bundle-label'] || '',
            fd: fd
          });
        });
        S.pool = { loading: false, error: '', files: files, groups: groupFiles(files) };
        match();
        draw();
      })
      .catch(function (e) {
        S.pool = { loading: false, error: 'Could not read Intake: ' + ((e && e.message) || e) + '. Try again.', files: [], groups: [] };
        draw();
      });
  }
  // v1.0.2 — is there already an article for this print item?
  function refList(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(function (x) { return (x && x.id) || x; });
    return [(v && v.id) || v];
  }
  function loadExisting() {
    var base = cfg().assetListUrl, ta = cfg().taItemId;
    if (!base || !ta) { S.existing = { loading: false, err: 'The check for an existing article did not run (no TA_CONFIG.assetListUrl).', items: [], dismissed: false }; draw(); return; }
    var url = String(base).replace(/\/+$/, '') + '/list?type=article&title=' + encodeURIComponent(ta) + '&fresh=1';
    fetch(url, { method: 'GET' }).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = JSON.parse(t); } catch (e) {}
        if (!r.ok || !j || j.error) throw new Error((j && j.error) || ('HTTP ' + r.status));
        return j;
      });
    }).then(function (j) {
      if (!S) return;
      var pt = S.job.allocation.printTitle;
      var items = (j.items || []).filter(function (it) {
        return refList((it.fieldData || {})[ART_TITLE_FIELD]).indexOf(ta) >= 0 && !it.isArchived;
      }).map(function (it) {
        var name = String((it.fieldData || {}).name || '');
        var sc = (titleSim(pt, name) + titleSim(name, pt)) / 2;
        return { id: it.id, name: name, score: sc, isDraft: !!it.isDraft, at: it.createdOn || it.lastUpdated || '' };
      }).filter(function (x) { return x.name && x.score >= EXISTING_AT; })
        .sort(function (a, b) { return b.score - a.score; }).slice(0, EXISTING_MAX);
      S.existing = { loading: false, err: '', items: items, dismissed: false, truncated: !!j.truncated };
      draw();
    }).catch(function (e) {
      if (!S) return;
      S.existing = { loading: false, err: 'The check for an existing article failed (' + ((e && e.message) || e) + '). You can still build one.', items: [], dismissed: false };
      draw();
    });
  }
  function existingHtml() {
    var X = S.existing;
    if (!X || X.dismissed) return '';
    if (X.loading) return '<div class="cfp-exist cfp-exist--quiet"><span class="cfp-stars" aria-hidden="true"><i></i><i></i><i></i></span>Checking for an article that already exists\u2026</div>';
    if (X.err) return '<div class="cfp-exist cfp-exist--quiet">' + esc(X.err) + '</div>';
    if (!X.items.length) return '';
    var rows = X.items.map(function (it) {
      var d = it.at ? String(it.at).slice(0, 10) : '';
      return '<div class="cfp-exist-row"><span class="cfp-exist-name">' + esc(it.name) + '</span>' +
        '<span class="cfp-exist-meta">' + esc([d, it.isDraft ? 'Draft' : ''].filter(Boolean).join(' \u00b7 ')) + '</span>' +
        '<button type="button" class="ix-btn ix-btn--primary" data-cfp-link="' + esc(it.id) + '">Link this one</button></div>';
    }).join('');
    return '<div class="cfp-exist"><div class="cfp-exist-h">' +
      (X.items.length === 1 ? 'This article may already exist.' : 'One of these articles may already be this one.') +
      ' Link it instead of building a new one.</div>' + rows +
      '<button type="button" class="ix-revert" data-cfp-nolink>None of these, build a new one</button></div>';
  }
  function linkExisting(id) {
    var it = (S.existing.items || []).filter(function (x) { return x.id === id; })[0];
    if (!it || (S.write && S.write.busy)) return;
    S.write = { articleId: id, ok: null, mode: 'link', busy: true };
    draw();
    writeBack(id).then(function (r) {
      S.write.busy = false;
      if (r && r.ok) finish('Linked \u201c' + it.name + '\u201d to its print item' + (S.write.placed ? ' and placed it in its tile.' : '.'));
      else { draw(); toast(S.write.error, 'err'); }
    });
  }

  function groupFiles(files) {
    var by = {}, out = [];
    files.forEach(function (f) {
      var k = f.bundleId ? 'b:' + f.bundleId : 'f:' + f.id;
      if (!by[k]) { by[k] = { key: k, label: f.bundleId ? (f.bundleLabel || f.bundleId) : f.name, loose: !f.bundleId, files: [] }; out.push(by[k]); }
      by[k].files.push(f);
    });
    var order = { text: 1, image: 2, video: 3, audio: 4, other: 5 };
    out.forEach(function (g) { g.files.sort(function (a, b) { return (order[a.kind] || 9) - (order[b.kind] || 9); }); });
    return out;
  }
  function scoreGroup(g, al) {
    var heads = [g.label];
    g.files.forEach(function (f) {
      if (f.kind !== 'text') { heads.push(f.name); return; }
      if (f.meta.title) heads.push(f.meta.title);
      heads.push(f.text.slice(0, 140));
    });
    var t = 0; heads.forEach(function (h) { t = Math.max(t, titleSim(al.printTitle, h)); });
    var by = 0, ln = lastName(al.byline);
    if (ln) {
      g.files.forEach(function (f) {
        if (f.kind !== 'text') return;
        var hay = words((f.meta.byLine || '') + ' ' + f.text.slice(0, 400)).join(' ');
        if ((' ' + hay + ' ').indexOf(' ' + ln + ' ') >= 0) by = 1;
      });
    }
    var imgs = g.files.filter(function (f) { return f.kind === 'image'; }).length;
    var ph = 0, want = Number(al.imageCount) || 0;
    if (want && imgs) ph = 1 - Math.min(1, Math.abs(want - imgs) / Math.max(want, imgs));
    var score = W_TITLE * t + W_BYLINE * by + W_PHOTOS * ph;
    var reasons = [];
    if (t >= 0.99) reasons.push('Same headline as print');
    else if (t >= 0.5) reasons.push('Headline close to print');
    if (by) reasons.push('Byline matches (' + al.byline + ')');
    if (want && imgs) reasons.push(imgs + ' photo' + (imgs === 1 ? '' : 's') + ' here, print shows ' + want);
    return { group: g, score: score, title: t, byline: by, photos: imgs, reasons: reasons };
  }
  function match() {
    var al = S.job.allocation;
    S.ranked = S.pool.groups.map(function (g) { return scoreGroup(g, al); })
      .sort(function (a, b) { return b.score - a.score; });
    S.proposal = {}; S.reasons = {}; S.found = 0;
    var top = S.ranked[0];
    if (top && top.score >= PROPOSE_AT) {
      top.group.files.forEach(function (f) {
        S.proposal[f.id] = true;
        S.reasons[f.id] = f.kind === 'text'
          ? (top.reasons.filter(function (r) { return /headline|byline/i.test(r); }).join(' · ') || 'Text in the best-matching bundle')
          : 'In the bundle that matches print';
        if (f.kind === 'image') S.found++;
      });
    }
    S.picked = {}; for (var k in S.proposal) S.picked[k] = true;
    if (!top || top.score < PROPOSE_AT) S.showMore = true;
  }

  /* ── print page ──────────────────────────────────────────── */
  function loadPage(n) {
    var al = S.job.allocation;
    if (!al.pdfUrl) { S.pageErr = 'This print item has no stored PDF (print-pdf-url on ALLOCATIONS).'; draw(); return; }
    if (!window.IxPdfPager || typeof window.IxPdfPager.render !== 'function') {
      S.pageErr = 'The PDF viewer (ix-pdf-pager) is not loaded on this page.'; draw(); return;
    }
    if (S.pageImg[n]) { draw(); return; }
    S.pageErr = '';
    window.IxPdfPager.render(al.pdfUrl, n, PRINT_W).then(function (src) {
      if (!S) return;
      S.pageImg[n] = src; draw();
    }, function (e) {
      if (!S) return;
      S.pageErr = 'Could not draw page ' + n + ': ' + ((e && e.message) || e) + '.'; draw();
    });
  }

  /* ── drawing ─────────────────────────────────────────────── */
  function pickedCount() { var n = 0; for (var k in S.picked) if (S.picked[k]) n++; return n; }
  function changed() {
    var k;
    for (k in S.picked) if (!!S.picked[k] !== !!S.proposal[k]) return true;
    for (k in S.proposal) if (!!S.picked[k] !== !!S.proposal[k]) return true;
    return false;
  }
  function tileHtml(f, reason) {
    var on = !!S.picked[f.id], chg = on !== !!S.proposal[f.id];
    var face;
    if (f.kind === 'image' && f.imageUrl) {
      face = '<img class="cfp-img" src="' + esc(f.imageUrl) + '" alt="" loading="lazy">' +
             '<button type="button" class="cfp-zoom" data-cfp-zoom="' + esc(f.id) + '" aria-label="Open full size" title="Open full size">\u2922</button>';
    } else if (f.kind === 'text') {
      var t = f.meta.title || '';
      face = '<div class="cfp-txt">' + (t ? '<b>' + esc(t) + '</b>' : '') + '<span>' + esc(f.text.slice(0, 260)) + '</span></div>';
    } else {
      face = '<div class="cfp-txt cfp-txt--other"><b>' + esc(f.kind.toUpperCase()) + '</b><span>' + esc(f.name) + '</span></div>';
    }
    return '<div class="cfp-tile' + (on ? ' is-on' : '') + (chg ? ' cfp-tile--changed' : '') + '" data-cfp-tile="' + esc(f.id) + '" role="checkbox" aria-checked="' + on + '" tabindex="0">' +
      '<div class="cfp-face">' + face + '<span class="cfp-tick" aria-hidden="true">' + (on ? '\u2713' : '') + '</span></div>' +
      '<div class="cfp-cap"><span class="cfp-kind">' + esc(f.kind === 'text' ? 'TXT' : f.kind === 'image' ? 'IMG' : 'FILE') + '</span>' +
      '<span class="cfp-why" title="' + esc(reason || f.name) + '">' + esc(reason || f.name) + '</span></div>' +
    '</div>';
  }
  function proposalHtml() {
    var p = S.pool;
    if (p.loading) return '<div class="cfp-busy"><span class="cfp-stars" aria-hidden="true"><i></i><i></i><i></i></span>Matching Intake files to this article\u2026</div>';
    if (p.error) return '<div class="cfp-err">' + esc(p.error) + ' <button type="button" class="ix-revert" data-cfp-retry>Try again</button></div>';
    var al = S.job.allocation, top = S.ranked[0];
    var ids = Object.keys(S.proposal);
    if (!ids.length) {
      return '<div class="cfp-none">No waiting Intake files look like this article. Pick them under Show more from Intake.</div>';
    }
    var want = Number(al.imageCount) || 0;
    var head = '<div class="cfp-guess"><b>My guess:</b> ' + esc(top.group.loose ? 'one loose file' : 'bundle \u201c' + top.group.label + '\u201d') +
      (top.reasons.length ? ' \u00b7 ' + esc(top.reasons.join(' \u00b7 ')) : '') + '</div>' +
      (want && S.found < want ? '<div class="cfp-short">Print shows ' + want + ' photo' + (want === 1 ? '' : 's') + '. ' + S.found + ' found. Look under Show more from Intake for the rest.</div>' : '');
    var tiles = top.group.files.map(function (f) { return tileHtml(f, S.reasons[f.id]); }).join('');
    return head + '<div class="cfp-grid">' + tiles + '</div>';
  }
  function moreHtml() {
    if (!S.showMore || S.pool.loading || S.pool.error) return '';
    var q = S.q.trim().toLowerCase(), topKey = S.ranked[0] && S.proposal[(S.ranked[0].group.files[0] || {}).id] ? S.ranked[0].group.key : '';
    var rows = S.ranked.filter(function (r) { return r.group.key !== topKey; });
    if (q) rows = rows.filter(function (r) {
      var hay = (r.group.label + ' ' + r.group.files.map(function (f) { return f.name + ' ' + (f.meta.title || '') + ' ' + f.text.slice(0, 200); }).join(' ')).toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    var body = rows.length ? rows.map(function (r, i) {
      var tag = (!q && i < ALSO_POSSIBLE && r.score > 0) ? '<span class="cfp-also">Also possible</span>' : '';
      return '<div class="cfp-group"><div class="cfp-group-h">' + tag + '<span>' + esc(r.group.loose ? 'Loose file' : r.group.label) + '</span>' +
        '<span class="cfp-group-n">' + r.group.files.length + ' file' + (r.group.files.length === 1 ? '' : 's') + '</span></div>' +
        '<div class="cfp-grid">' + r.group.files.map(function (f) { return tileHtml(f, ''); }).join('') + '</div></div>';
    }).join('') : '<div class="cfp-none">' + (q ? 'No waiting file matches \u201c' + esc(S.q) + '\u201d.' : 'No other waiting files in Intake.') + '</div>';
    return '<div class="cfp-more"><div class="cfp-more-h"><span class="cfp-eyebrow">More from Intake</span>' +
      '<input type="search" class="cfp-q" data-cfp-q placeholder="Search Intake files" value="' + esc(S.q) + '"></div>' + body + '</div>';
  }
  function printHtml() {
    var al = S.job.allocation, n = S.page, max = Number(al.issuePages) || 0;
    var img = S.pageImg[n];
    return '<div class="cfp-pnav">' +
        '<button type="button" class="ix-btn ix-btn--ghost ix-btn--icon" data-cfp-page="-1"' + (n <= 1 ? ' disabled' : '') + ' aria-label="Previous page">\u2039</button>' +
        '<span class="cfp-pnum">PDF page ' + n + (max ? ' of ' + max : '') + (al.page ? ' \u00b7 printed p.' + esc(al.page) : '') + '</span>' +
        '<button type="button" class="ix-btn ix-btn--ghost ix-btn--icon" data-cfp-page="1"' + (max && n >= max ? ' disabled' : '') + ' aria-label="Next page">\u203a</button>' +
        '<button type="button" class="ix-revert cfp-full" data-cfp-full>Open full size</button>' +
      '</div>' +
      '<div class="cfp-page">' +
        (S.pageErr ? '<div class="cfp-err">' + esc(S.pageErr) + '</div>'
         : img ? '<img src="' + img + '" alt="Print page ' + n + '" data-cfp-full>'
         : '<div class="cfp-busy"><span class="cfp-stars" aria-hidden="true"><i></i><i></i><i></i></span>Drawing page ' + n + '\u2026</div>') +
      '</div>';
  }
  function draw() {
    if (!S || !S.root) return;
    var al = S.job.allocation, n = pickedCount();
    var meta = [al.issueName, al.page ? 'p.' + al.page : '', al.section, al.byline ? 'By ' + al.byline : '',
                al.imageCount ? al.imageCount + ' photo' + (al.imageCount === 1 ? '' : 's') + ' in print' : '']
               .filter(Boolean).join(' \u00b7 ');
    var keepQ = document.activeElement && document.activeElement.hasAttribute && document.activeElement.hasAttribute('data-cfp-q');
    var bodyEl = S.root.querySelector('.cfp-files'), scroll = bodyEl ? bodyEl.scrollTop : 0;
    S.root.innerHTML =
      '<div class="ix-modal ix-modal--wide cfp-modal" role="dialog" aria-modal="true" aria-label="Create from print">' +
        '<div class="cfp-head">' +
          '<div class="cfp-eyebrow">Create from print \u00b7 check the files</div>' +
          '<div class="cfp-title">' + esc(al.printTitle || 'Untitled print item') + '</div>' +
          '<div class="cfp-sub">' + esc(meta) + '</div>' +
        '</div>' +
        '<div class="cfp-body">' +
          '<section class="cfp-print"><div class="cfp-eyebrow">The print</div>' + printHtml() + '</section>' +
          '<section class="cfp-files">' + existingHtml() + '<div class="cfp-eyebrow">Files from Intake \u00b7 tick the ones that belong</div>' +
            proposalHtml() +
            (S.pool.loading || S.pool.error ? '' :
              '<button type="button" class="ix-revert cfp-more-btn" data-cfp-more>' + (S.showMore ? 'Hide the other Intake files' : 'Show more from Intake') + '</button>') +
            moreHtml() +
          '</section>' +
        '</div>' +
        '<div class="cfp-foot">' +
          '<span class="cfp-count">' + n + ' file' + (n === 1 ? '' : 's') + ' ticked' +
            (changed() ? ' \u00b7 <button type="button" class="ix-revert" data-cfp-reset>Back to my guess</button>' : '') + '</span>' +
          (S.write && S.write.busy ? '<span class="cfp-count">Linking\u2026</span>' : '') +
          (S.write && S.write.ok === false ? '<span class="cfp-wfail">' + esc(S.write.error) + ' <button type="button" class="ix-revert" data-cfp-rewrite>Try the link again</button></span>' : '') +
          '<span class="cfp-sp"></span>' +
          '<button type="button" class="ix-revert" data-cfp-cancel>Cancel</button>' +
          '<button type="button" class="ix-btn ix-btn--primary cfp-go" data-cfp-go' + (n ? '' : ' disabled') + '>' +
            (S.write && S.write.articleId && S.write.mode !== 'link' ? 'Article created' : 'Build the article from ' + n + ' file' + (n === 1 ? '' : 's')) + '</button>' +
        '</div>' +
      '</div>';
    var b2 = S.root.querySelector('.cfp-files'); if (b2) b2.scrollTop = scroll;
    if (keepQ) { var qi = S.root.querySelector('[data-cfp-q]'); if (qi) { qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); } }
    if (S.write && ((S.write.articleId && S.write.mode !== 'link') || S.write.busy)) { var go = S.root.querySelector('[data-cfp-go]'); if (go) go.disabled = true; }
  }

  /* ── ticks (click, Shift-click range, Cmd/Ctrl-click) ───────── */
  function visibleIds() {
    return Array.prototype.map.call(S.root.querySelectorAll('[data-cfp-tile]'), function (el) { return el.getAttribute('data-cfp-tile'); });
  }
  function toggle(id, e) {
    var to = !S.picked[id];
    if (e && e.shiftKey && S.anchor && S.anchor !== id) {
      var ids = visibleIds(), a = ids.indexOf(S.anchor), b = ids.indexOf(id);
      if (a >= 0 && b >= 0) {
        to = !!S.picked[S.anchor];
        var lo = Math.min(a, b), hi = Math.max(a, b);
        for (var i = lo; i <= hi; i++) { if (to) S.picked[ids[i]] = true; else delete S.picked[ids[i]]; }
        draw(); return;
      }
    }
    if (to) S.picked[id] = true; else delete S.picked[id];
    S.anchor = id;
    draw();
  }
  function fileById(id) {
    var f = S.pool.files; for (var i = 0; i < f.length; i++) if (f[i].id === id) return f[i];
    return null;
  }

  /* ── 3 · build: open the ASF seeded from the ticked files ──── */
  function build() {
    var ids = Object.keys(S.picked).filter(function (k) { return S.picked[k]; });
    if (!ids.length) return;
    if (!window.InbxASF || typeof window.InbxASF.open !== 'function') { toast('The Asset Form is not loaded on this page. Refresh and try again.', 'err'); return; }
    var v = String(window.InbxASF.version || '').split('.').map(Number);
    var hooksOk = v[0] > 1 || (v[0] === 1 && (v[1] > 11 || (v[1] === 11 && (v[2] || 0) >= 7)));
    if (!hooksOk) { toast('The Asset Form here is v' + window.InbxASF.version + '. Create from print needs ta-asf v1.11.7 or later to link the article back.', 'err'); return; }
    var prefilledMedia = ids.map(function (id) {
      var f = fileById(id) || { id: id, kind: 'other', imageUrl: '', html: '', metaRaw: '' };
      return { id: f.id, mediaType: f.kind, imageUrl: f.imageUrl, htmlContent: f.html, sourceMetadata: f.metaRaw };
    });
    S.write = null;   // v1.0.2 — a failed link attempt does not carry over
    hide();
    var ok = false;
    try {
      ok = window.InbxASF.open({
        mode: 'create', assetType: 'article',
        prefilledMediaIds: ids, prefilledMedia: prefilledMedia,
        tenantId: cfg().taItemId || null,
        noWorkbench: true,
        printSource: {   // v1.0.1 — Compare with print in the form
          pdfUrl: S.job.allocation.pdfUrl, pdfPage: S.job.allocation.pdfPage, issuePages: S.job.allocation.issuePages,
          issueName: S.job.allocation.issueName, page: S.job.allocation.page, printTitle: S.job.allocation.printTitle
        },
        afterCreate: function (newId) { return writeBack(newId); },
        onClosed: function (info) { afterAsf(info); }
      });
    } catch (e) { ok = false; console.error(TAG, 'ASF open threw', e); }
    if (ok === false) { show(); toast('The Asset Form would not open. Nothing was created.', 'err'); }
  }

  /* ── 4 · write back ──────────────────────────────────────── */
  function writeBack(newId) {
    var job = S.job, al = job.allocation, c = cfg();
    var prev = S.write || {};
    S.write = { articleId: newId, ok: null, mode: (prev.articleId === newId && prev.mode) || 'build', busy: !!prev.busy };
    if (!c.makeSlateWriter) return Promise.resolve(fail('this page has no TA_CONFIG.makeSlateWriter (Scenario 103B), so the print item was not linked'));
    var linkField = (S.board && S.board.linkFields && S.board.linkFields.article) || LINK_FIELD_FALLBACK;
    return sendOne(c.makeSlateWriter, 'link', { id: al.id, field: linkField, assetId: newId }, 'Scenario 103B').then(function (res) {
      var why = '';
      if (!res) why = 'no result came back';
      else if (res.fieldOk !== true) why = '103B refused the field \u201c' + (res.field || linkField) + '\u201d';
      else if (res.ok !== true || !res.id) why = res.err || 'Webflow refused the write';
      else if (String(res.value || '') !== String(newId)) why = 'the print item does not hold the article after the write';
      if (why) return fail('the print item was not linked (' + why + ')');
      if (!job.slotId) { S.write.ok = true; return { ok: true, note: 'linked to its print item' }; }
      return fillTile(newId);
    }, function (e) { return fail('the print item was not linked (' + ((e && e.message) || 'the request failed') + ')'); });
  }
  function fillTile(newId) {
    var job = S.job, c = cfg();
    var field = S.board && S.board.accepts && S.board.accepts.article;
    if (!c.makeBlockWriter) return Promise.resolve(fail('linked, but this page has no TA_CONFIG.makeBlockWriter (Scenario 124), so the tile was not filled'));
    if (!field || field === 'list') return Promise.resolve(fail('linked, but the plan data does not say which tile field holds an article'));
    return sendOne(c.makeBlockWriter, 'fill', { id: job.slotId, assetField: field, assetId: newId }, 'Scenario 124').then(function (res) {
      var why = '';
      if (!res) why = 'no result came back';
      else if (res.ok !== true || !res.id) why = res.err || 'Webflow refused the write';
      else if (String((res.fieldData || {}).asset || '') !== String(newId)) why = 'the tile does not hold the article after the write';
      if (why) return fail('linked, but the tile was not filled (' + why + ')');
      // Read back from the Data Worker: green only from what it shows.
      return readBoard(job.planId).then(function (b) {
        S.board = b;
        var slot = (b.slots || []).filter(function (s) { return s.id === job.slotId; })[0];
        var alc = (b.allocations || []).filter(function (a) { return a.id === job.allocation.id; })[0];
        var inTile = slot && slot.asset && slot.asset.id === newId;
        var linked = alc && alc.asset && alc.asset.id === newId;
        if (!inTile || !linked) return fail('the writes were sent, but the plan read back does not show ' + (!linked ? 'the link' : 'the article in its tile') + ' yet. Refresh the plan to check');
        S.write.ok = true; S.write.placed = true;
        return { ok: true, note: 'linked to its print item and placed in its tile' };
      }, function (e) { return fail('the writes were sent, but the plan could not be read back (' + ((e && e.message) || e) + ')'); });
    }, function (e) { return fail('linked, but the tile was not filled (' + ((e && e.message) || 'the request failed') + ')'); });
  }
  function fail(msg) {
    S.write.ok = false;
    S.write.error = (S.write.mode === 'link' ? 'Not linked: ' : 'Article created, but ') + msg + '.';
    return { ok: false, error: msg };
  }

  /* ── 5 · return ──────────────────────────────────────────── */
  function afterAsf(info) {
    if (!S) return;
    if (!info || !info.created) { show(); return; }   // nothing created: back to the palette, ticks intact
    if (!S.write || S.write.ok !== true) {             // created, link not done: stay, offer retry
      if (!S.write || S.write.ok == null) S.write = { articleId: info.created, ok: false, error: 'Article created, but it is not linked to its print item yet.' };
      show(); return;
    }
    var msg = 'Created \u201c' + (info.name || 'Untitled') + '\u201d and ' + (S.write && S.write.placed ? 'placed it in its tile.' : 'linked it to its print item.');
    finish(msg);
  }
  function finish(msg) {
    var job = S.job, articleId = (S.write && S.write.articleId) || null;
    close();
    if (job.origin === 'picker' && job.returnUrl) {
      try { sessionStorage.setItem(RESULT_KEY, JSON.stringify({ at: Date.now(), msg: msg, allocId: job.allocation.id })); } catch (e) {}
      window.location.href = job.returnUrl;
      return;
    }
    if (typeof job.onDone === 'function') { try { job.onDone({ msg: msg, articleId: articleId }); } catch (e) {} }
  }
  function cancel() {
    var job = S.job;
    close();
    if (job.origin === 'picker' && job.returnUrl) { window.location.href = job.returnUrl; return; }
    if (typeof job.onDone === 'function') { try { job.onDone({ cancelled: true }); } catch (e) {} }
  }
  function retryLink() {
    var id = S.write && S.write.articleId; if (!id) return;
    toast('Linking the article again\u2026', 'info');
    writeBack(id).then(function (r) {
      if (r && r.ok) finish('Linked the article to its print item' + (S.write.placed ? ' and placed it in its tile.' : '.'));   // build or link
      else { draw(); toast(S.write.error, 'err'); }
    });
  }

  /* ── overlay ─────────────────────────────────────────────── */
  function toast(msg, tone) {
    if (window.IxToast && typeof window.IxToast.show === 'function') { try { window.IxToast.show(msg, tone || 'info'); return; } catch (e) {} }
    console.log(TAG, msg);
  }
  function mount() {
    var o = document.createElement('div');
    o.className = 'ix-overlay cfp-overlay';
    document.body.appendChild(o);
    S.root = o;
    o.addEventListener('click', onClick);
    o.addEventListener('keydown', onKey);
    o.addEventListener('input', function (e) {
      if (!e.target.hasAttribute('data-cfp-q')) return;
      S.q = e.target.value; draw();
    });
    document.body.classList.add('cfp-lock');
  }
  function hide() { if (S && S.root) S.root.style.display = 'none'; document.body.classList.remove('cfp-lock'); }
  function show() { if (S && S.root) { S.root.style.display = ''; document.body.classList.add('cfp-lock'); draw(); } }
  function close() {
    if (S && S.root && S.root.parentNode) S.root.parentNode.removeChild(S.root);
    document.body.classList.remove('cfp-lock');
    S = null;
  }
  function onKey(e) {
    var t = e.target.closest && e.target.closest('[data-cfp-tile]');
    if (t && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); toggle(t.getAttribute('data-cfp-tile'), e); return; }
    if (e.key === 'Escape') cancel();
  }
  function onClick(e) {
    var t = e.target;
    if (t.closest('[data-cfp-zoom]')) {
      e.stopPropagation();
      var f = fileById(t.closest('[data-cfp-zoom]').getAttribute('data-cfp-zoom'));
      if (f && window.InbxLightbox && window.InbxLightbox.open) window.InbxLightbox.open(f.imageUrl, { caption: f.name });
      return;
    }
    var tile = t.closest('[data-cfp-tile]');
    if (tile) { toggle(tile.getAttribute('data-cfp-tile'), e); return; }
    var pg = t.closest('[data-cfp-page]');
    if (pg) { S.page = Math.max(1, S.page + Number(pg.getAttribute('data-cfp-page'))); draw(); loadPage(S.page); return; }
    if (t.closest('[data-cfp-full]')) {
      var al = S.job.allocation;
      if (window.IxPdfPager && al.pdfUrl) window.IxPdfPager.open({ url: al.pdfUrl, page: S.page, pages: Number(al.issuePages) || undefined, title: al.issueName || '' });
      return;
    }
    var lk = t.closest('[data-cfp-link]');
    if (lk) { linkExisting(lk.getAttribute('data-cfp-link')); return; }
    if (t.closest('[data-cfp-nolink]')) { S.existing.dismissed = true; draw(); return; }
    if (t.closest('[data-cfp-more]')) { S.showMore = !S.showMore; draw(); return; }
    if (t.closest('[data-cfp-reset]')) { S.picked = {}; for (var k in S.proposal) S.picked[k] = true; draw(); return; }
    if (t.closest('[data-cfp-retry]')) { S.pool.loading = true; draw(); loadPool(); return; }
    if (t.closest('[data-cfp-rewrite]')) { retryLink(); return; }
    if (t.closest('[data-cfp-cancel]')) { cancel(); return; }
    if (t.closest('[data-cfp-go]')) { build(); return; }
  }

  /* ── public open ─────────────────────────────────────────── */
  function open(job) {
    if (!job || !job.allocation || !job.allocation.id) { toast('Create from print needs a print item.', 'err'); return false; }
    if (job.allocation.type && job.allocation.type !== 'article') {
      toast('Create from print builds articles for now. This print item is \u201c' + job.allocation.type + '\u201d.', 'err');
      return false;
    }
    if (S) close();
    S = fresh(job);
    mount(); draw();
    loadExisting();   // v1.0.2
    loadPool();
    loadPage(S.page);
    return true;
  }

  /* ── Picker entry: read the address on load ──────────────── */
  function safeReturn(r) {
    r = String(r || '');
    return (r.charAt(0) === '/' && r.charAt(1) !== '/') ? r : '';   // same site only
  }
  function boot() {
    var p; try { p = new URLSearchParams(window.location.search); } catch (e) { return; }
    var allocId = p.get('cfp_alloc'); if (!allocId) return;
    var planId = p.get('cfp_plan') || '', slotId = p.get('cfp_slot') || '', ret = safeReturn(p.get('cfp_ret'));
    ['cfp_alloc', 'cfp_plan', 'cfp_slot', 'cfp_ret'].forEach(function (k) { p.delete(k); });
    try {
      var qs = p.toString();
      history.replaceState(history.state, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
    } catch (e) {}
    var go = function () {
      if (!planId) { toast('Create from print was opened without a plan.', 'err'); return; }
      readBoard(planId).then(function (b) {
        var al = (b.allocations || []).filter(function (a) { return a.id === allocId; })[0];
        if (!al) { toast('That print item is no longer on the plan. Nothing was opened.', 'err'); if (ret) window.location.href = ret; return; }
        open({ allocation: al, planId: planId, slotId: slotId, returnUrl: ret, origin: 'picker', board: b });
      }, function (e) {
        toast('Can\u2019t reach the data worker. Try again. (' + ((e && e.message) || e) + ')', 'err');
      });
    };
    // TA_CONFIG and the ASF load in the page body; wait for both.
    var tries = 0;
    (function wait() {
      if ((window.TA_CONFIG && window.InbxASF) || tries++ > 50) { go(); return; }
      setTimeout(wait, 100);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  /* ── v1.0.3 · Link existing articles (a whole issue) ─────── */
  var L = null;
  function lmScoreLabel(sc) { return sc >= 0.99 ? 'Same title' : sc >= 0.8 ? 'Close' : 'Possible'; }
  function lmArticle(id) { var a = L.arts; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function lmInit(arts) {
    var taken = {};
    (L.linkedIds || []).forEach(function (id) { taken[id] = 1; });
    L.arts = arts.filter(function (a) { return !taken[a.id]; });
    var pairs = [];
    L.rows.forEach(function (r) {
      r.cands = L.arts.map(function (a) {
        return { id: a.id, score: (titleSim(r.printTitle, a.name) + titleSim(a.name, r.printTitle)) / 2 };
      }).filter(function (c) { return c.score >= EXISTING_AT; })
        .sort(function (x, y) { return y.score - x.score; }).slice(0, LM_CHOICES);
      r.cands.forEach(function (c) { pairs.push({ r: r, c: c }); });
    });
    pairs.sort(function (x, y) { return y.c.score - x.c.score; });
    var usedRow = {}, usedArt = {};
    L.base = {};
    pairs.forEach(function (p) {
      if (usedRow[p.r.id] || usedArt[p.c.id]) return;
      usedRow[p.r.id] = 1; usedArt[p.c.id] = 1;
      L.base[p.r.id] = { art: p.c.id, on: p.c.score >= STRONG_AT };
    });
    L.rows.forEach(function (r) { if (!L.base[r.id]) L.base[r.id] = { art: '', on: false }; });
    L.cur = JSON.parse(JSON.stringify(L.base));
  }
  function lmScore(r, artId) { for (var i = 0; i < r.cands.length; i++) if (r.cands[i].id === artId) return r.cands[i].score; return 0; }
  function lmDupes() {
    var seen = {}, d = {};
    L.rows.forEach(function (r) {
      var c = L.cur[r.id]; if (!c.on || !c.art) return;
      if (seen[c.art]) { d[r.id] = seen[c.art]; d[seen[c.art].id] = r; } else seen[c.art] = r;
    });
    return d;
  }
  function lmToSend() { return L.rows.filter(function (r) { var c = L.cur[r.id]; return c.on && c.art; }); }
  function lmChanged(r) { var a = L.cur[r.id], b = L.base[r.id]; return a.on !== b.on || a.art !== b.art; }
  function lmDraw() {
    if (!L || !L.root) return;
    var body;
    if (L.loading) body = '<div class="cfp-busy"><span class="cfp-stars" aria-hidden="true"><i></i><i></i><i></i></span>Reading this title\u2019s articles and pairing them with the print\u2026</div>';
    else if (L.err) body = '<div class="cfp-err">' + esc(L.err) + '</div>';
    else {
      var dup = lmDupes();
      body = '<table class="cfp-lm-tbl"><thead><tr><th></th><th>Pg</th><th>Printed title</th><th>Existing article</th><th>Match</th></tr></thead><tbody>' +
        L.rows.map(function (r) {
          var c = L.cur[r.id], sc = c.art ? lmScore(r, c.art) : 0, fail = L.fails[r.id];
          var opts = '<option value=""' + (c.art ? '' : ' selected') + '>No match</option>' + r.cands.map(function (k) {
            var a = lmArticle(k.id) || {};
            var meta = [a.at ? String(a.at).slice(0, 10) : '', a.isDraft ? 'Draft' : ''].filter(Boolean).join(' \u00b7 ');
            return '<option value="' + esc(k.id) + '"' + (k.id === c.art ? ' selected' : '') + '>' + esc(a.name + (meta ? '  (' + meta + ')' : '')) + '</option>';
          }).join('');
          return '<tr class="' + (lmChanged(r) ? 'cfp-lm--changed' : '') + (fail ? ' cfp-lm--fail' : '') + '">' +
            '<td><input type="checkbox" data-lm-on="' + esc(r.id) + '"' + (c.on ? ' checked' : '') + (c.art ? '' : ' disabled') + ' aria-label="Link this row"></td>' +
            '<td class="cfp-lm-pg">' + esc(r.page == null ? '' : r.page) + '</td>' +
            '<td class="cfp-lm-pt">' + esc(r.printTitle) + '</td>' +
            '<td><select class="cfp-lm-sel' + (lmChanged(r) ? ' ix-picker-input--changed' : '') + '" data-lm-art="' + esc(r.id) + '"' + (r.cands.length ? '' : ' disabled') + '>' + opts + '</select>' +
              (dup[r.id] ? '<div class="cfp-lm-warn">Also chosen for p.' + esc(dup[r.id].page) + ' \u201c' + esc(dup[r.id].printTitle) + '\u201d</div>' : '') +
              (fail ? '<div class="cfp-lm-warn">Not linked: ' + esc(fail) + '</div>' : '') + '</td>' +
            '<td class="cfp-lm-sc">' + (c.art ? lmScoreLabel(sc) : (r.cands.length ? '' : 'Nothing close')) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }
    var n = L.loading || L.err ? 0 : lmToSend().length;
    var dupN = L.loading || L.err ? 0 : Object.keys(lmDupes()).length;
    var anyChg = !L.loading && !L.err && L.rows.some(lmChanged);
    L.root.innerHTML =
      '<div class="ix-modal ix-modal--wide cfp-modal cfp-lm" role="dialog" aria-modal="true" aria-label="Link existing articles">' +
        '<div class="cfp-head"><div class="cfp-eyebrow">Allocator \u00b7 link existing articles</div>' +
          '<div class="cfp-title">' + esc(L.issueName || 'This issue') + '</div>' +
          '<div class="cfp-sub">' + L.rows.length + ' print item' + (L.rows.length === 1 ? ' has' : 's have') +
            ' no article linked. Strong matches start ticked; check the rest.' + (L.truncated ? ' The article list came back incomplete, so some may be missing.' : '') + '</div></div>' +
        '<div class="cfp-lm-body">' + body + '</div>' +
        '<div class="cfp-foot">' +
          '<span class="cfp-count">' + (L.busy ? 'Linking\u2026' : n + ' to link') +
            (anyChg && !L.busy ? ' \u00b7 <button type="button" class="ix-revert" data-lm-reset>Back to the matches</button>' : '') + '</span>' +
          (dupN ? '<span class="cfp-wfail">One article is chosen for two print items. Pick one.</span>' : '') +
          '<span class="cfp-sp"></span>' +
          '<button type="button" class="ix-revert" data-lm-cancel>Cancel</button>' +
          '<button type="button" class="ix-btn ix-btn--primary cfp-go" data-lm-save' + (n && !dupN && !L.busy ? '' : ' disabled') + '>' +
            (Object.keys(L.fails).length ? 'Try again: link ' : 'Link ') + n + ' article' + (n === 1 ? '' : 's') + '</button>' +
        '</div></div>';
  }
  function lmClose() {
    if (L && L.root && L.root.parentNode) L.root.parentNode.removeChild(L.root);
    document.body.classList.remove('cfp-lock');
    L = null;
  }
  function lmSave() {
    var c = cfg(), rows = lmToSend();
    if (!rows.length || Object.keys(lmDupes()).length) return;
    if (!c.makeSlateWriter) { L.err = 'This page has no TA_CONFIG.makeSlateWriter (Scenario 103B), so nothing can be linked.'; lmDraw(); return; }
    var ops = rows.map(function (r) { return { id: r.id, field: L.linkField, assetId: L.cur[r.id].art }; });
    // Chunk by URL length, as the Picker does.
    var chunks = [], cur = [], batchId = 'cfp-lm-' + Date.now();
    ops.forEach(function (op) {
      var trial = cur.concat([op]);
      if (cur.length && batchUrl(c.makeSlateWriter, 'link', batchId, trial).length > BATCH_URL_CEILING) { chunks.push(cur); cur = [op]; }
      else cur = trial;
    });
    if (cur.length) chunks.push(cur);
    L.busy = true; L.fails = {}; lmDraw();
    var linked = [];
    var seq = Promise.resolve();
    chunks.forEach(function (ch) {
      seq = seq.then(function () {
        return fetch(batchUrl(c.makeSlateWriter, 'link', batchId, ch), { method: 'GET', credentials: 'omit' })
          .then(function (r) {
            return r.text().then(function (t) {
              if (!r.ok) throw new Error('Scenario 103B answered HTTP ' + r.status);
              var b; try { b = JSON.parse(t); } catch (e) { throw new Error('Scenario 103B sent a reply that is not JSON'); }
              return (b && b.results) || [];
            });
          })
          .then(function (res) {
            ch.forEach(function (op, k) {
              var x = null;
              for (var i = 0; i < res.length; i++) if (Number(res[i].i) === k + 1) x = res[i];
              var why = !x ? 'no result came back'
                : x.fieldOk !== true ? '103B refused the field \u201c' + (x.field || op.field) + '\u201d'
                : (x.ok !== true || !x.id) ? (x.err || 'Webflow refused the write')
                : String(x.value || '') !== String(op.assetId) ? 'the print item does not hold the article after the write' : '';
              if (why) L.fails[op.id] = why; else linked.push({ allocId: op.id, articleId: op.assetId });
            });
          }, function (e) {
            ch.forEach(function (op) { L.fails[op.id] = (e && e.message) || 'the request failed'; });
          });
      });
    });
    seq.then(function () {
      if (!L) return;
      L.busy = false;
      var done = L.onDone, nOk = linked.length, nBad = Object.keys(L.fails).length;
      if (linked.length) {
        // Linked rows leave the panel; failed ones stay ticked.
        var ok = {}; linked.forEach(function (x) { ok[x.allocId] = 1; });
        L.rows = L.rows.filter(function (r) { return !ok[r.id]; });
      }
      if (typeof done === 'function') { try { done({ linked: linked }); } catch (e) {} }
      if (!nBad) { lmClose(); toast('Linked ' + nOk + ' article' + (nOk === 1 ? '' : 's') + ' to ' + (nOk === 1 ? 'its print item.' : 'their print items.'), 'ok'); return; }
      lmDraw();
      toast((nOk ? nOk + ' linked, but ' : 'Nothing was linked. ') + nBad + ' failed. They are still ticked for Try again.', 'err');
    });
  }
  function lmClick(e) {
    var t = e.target;
    if (t.closest('[data-lm-cancel]')) { if (!L.busy) lmClose(); return; }
    if (t.closest('[data-lm-reset]')) { L.cur = JSON.parse(JSON.stringify(L.base)); lmDraw(); return; }
    if (t.closest('[data-lm-save]')) { lmSave(); return; }
  }
  function lmChange(e) {
    var t = e.target, id;
    if ((id = t.getAttribute('data-lm-on'))) { L.cur[id].on = !!t.checked; lmDraw(); return; }
    if ((id = t.getAttribute('data-lm-art'))) {
      L.cur[id].art = t.value; L.cur[id].on = !!t.value; lmDraw(); return;
    }
  }
  function linkMany(o) {
    o = o || {};
    var rows = (o.rows || []).filter(function (r) { return r && r.id; });
    if (!rows.length) { toast('Every print item already has an article linked.', 'info'); return false; }
    var base = cfg().assetListUrl, ta = cfg().taItemId;
    if (L) lmClose();
    L = { rows: rows.map(function (r) { return { id: r.id, printTitle: String(r.printTitle || ''), page: r.page }; }),
          linkedIds: o.linkedIds || [], issueName: o.issueName || '', onDone: o.onDone,
          linkField: o.linkField || LINK_FIELD_FALLBACK, loading: true, err: '', fails: {}, busy: false, arts: [] };
    var ov = document.createElement('div');
    ov.className = 'ix-overlay cfp-overlay';
    document.body.appendChild(ov); L.root = ov;
    document.body.classList.add('cfp-lock');
    ov.addEventListener('click', lmClick);
    ov.addEventListener('change', lmChange);
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape' && L && !L.busy) lmClose(); });
    lmDraw();
    if (!base || !ta) { L.loading = false; L.err = 'This page has no TA_CONFIG.assetListUrl, so the title\u2019s articles cannot be read.'; lmDraw(); return true; }
    fetch(String(base).replace(/\/+$/, '') + '/list?type=article&title=' + encodeURIComponent(ta) + '&fresh=1', { method: 'GET' })
      .then(function (r) {
        return r.text().then(function (t) {
          var j = null; try { j = JSON.parse(t); } catch (e) {}
          if (!r.ok || !j || j.error) throw new Error((j && j.error) || ('HTTP ' + r.status));
          return j;
        });
      })
      .then(function (j) {
        if (!L) return;
        var arts = (j.items || []).filter(function (it) {
          return refList((it.fieldData || {})[ART_TITLE_FIELD]).indexOf(ta) >= 0 && !it.isArchived;
        }).map(function (it) {
          return { id: it.id, name: String((it.fieldData || {}).name || ''), isDraft: !!it.isDraft, at: it.createdOn || it.lastUpdated || '' };
        }).filter(function (a) { return a.name; });
        L.truncated = !!j.truncated;
        lmInit(arts);
        L.loading = false; lmDraw();
      })
      .catch(function (e) {
        if (!L) return;
        L.loading = false; L.err = 'Could not read this title\u2019s articles: ' + ((e && e.message) || e) + '. Nothing was linked.'; lmDraw();
      });
    return true;
  }

  window.InbxCreateFromPrint = { open: open, linkMany: linkMany, version: VERSION, file: FILE,
    _internal: { titleSim: titleSim, scoreGroup: scoreGroup, groupFiles: groupFiles } };
})();
