// quill-home-v1.0.7.js
// ============================================================
// quill-home-v1.0.7.js
// INBXIFY — Quill platform home
//
// v1.0.7 (8 Nov 2026, Publisher Portal) — PORTAL BUTTON AND ONE POINTER.
//   Jeff (8 Nov):
//   · Each publisher header gains "Portal ↗" to the right of Members. It is
//     a real link (target=_blank, rel=noopener) to CFG.publisherRoute with
//     the publisher's slug, so it opens that publisher's portal in a new
//     tab and Cmd-click and right-click work. No slug, no button. Same
//     84 x 24 pill as Members. The publisher name keeps its same-tab route.
//   · Title tiles keep opening TA Studio in the same tab (ruled).
//   · CURSOR FIX. The hand now shows everywhere a click goes somewhere:
//     - The "Next issue" strip at the foot of live tiles had cursor:help,
//       so that part of the tile showed "?" and the rest showed the hand.
//       It now uses the hand; its hover tip stays.
//     - The Members button was styled only after the Members window had
//       been opened once (memStyles ran in openMembers). Until then it was
//       a plain browser button with the arrow. Styles now load at boot.
//   HARDCODING: HC-P-PP2-11 grows by the Portal words in MEM_W.
//
//
// v1.0.6 (2 Nov 2026, Publisher Portal S2) — WELCOME EMAIL IN THE MEMBERS MODAL.
//   ix-members v1.1.0 sends our own personal welcome (Resend) on Add member.
//   · The Add message now says whether the welcome went out, or why not.
//   · Each member row gains "Send welcome", which sends it again
//     (POST /members/<id>/welcome). Its result shows in the message line.
//   Rows keep fixed column widths; the new link sits left of Remove.
//   HARDCODING: HC-P-PP2-11 grows by the welcome words in MEM_W.
//
// v1.0.5 (2 Nov 2026, Publisher Portal S2) — PORTAL MEMBERS PER PUBLISHER.
//   Each publisher header gains a "Members" button (left-most in the stats
//   row, so nothing already there moves). It opens a modal that lists the
//   publisher's portal members and adds or removes them, through the
//   ix-members Worker (v1.0.0), which writes Memberstack and PUBLISHERS
//   portal-member-ids. Your Memberstack login token goes with every call;
//   ix-members accepts it only for staff (its IX_CONFIG.staffMemberIds).
//   · Add member: first name, last name, email. Typed fields carry the
//     changed border; a small Cancel link clears them. The button shows a
//     moving bar while the Worker runs. The answer is shown as the Worker
//     gave it, including anything it could not confirm (TOAST-TRUTH).
//   · Remove: a confirm line in the row names the person and what happens;
//     nothing is removed until "Yes, remove".
//   · New members are passwordless. They log in at QUILL_CONFIG
//     portalLoginPath (default /portal-login).
//   Styles injected (#qh-mem-styles), ix-brand tokens only; quill-home CSS
//   stays v1.0.0. HARDCODING: HC-P-PP2-10 membersUrl default and
//   portalLoginPath default (both overridable in QUILL_CONFIG);
//   HC-P-PP2-11 the modal words (MEM_W).
//
// v1.0.4 (2 Nov 2026, Publishing Status S2) — CURRENT TOGETHER, THEN "NEXT ISSUE:".
//   Jeff (2 Nov): on a live tile the current issue line and the LIVE label sit together, then a
//   "Next issue:" row with a chip: Not started (red), In progress (red) or Set to next (green), each
//   with a tooltip that says what it means and what to do. Reads next from /quill-status (ix-issue-data
//   v1.0.140). The v1.0.3 go-live chip is replaced by this row. The publisher header counts red next
//   chips ("1 next not set"). Non-live tiles are unchanged. HARDCODING: HC-P-QH3-1 grows by these words.
//
// v1.0.3 (2 Nov 2026, Publishing Status S2) — CURRENT ISSUE AND GO-LIVE ON THE TILES.
//   Jeff (2 Nov): each title tile alerts on two things: the current issue (number and date) and
//   whether nothing is set to go live. One GET to the Data Worker's /quill-status (ix-issue-data
//   v1.0.139) answers every title; QUILL_CONFIG.quillStatus holds its URL (empty = off).
//   Live titles only. Each live tile gains:
//     · a line "Current WLN-123A · Sun, Nov 1" (the title's current issue, set by Scenario 108), or
//       "No current issue" in the accent when there is none;
//     · a coral chip "Nothing set to go live" when no newsletter of the title is at Publish Next as
//       Current, or "Not released" when one is set but its issue is not released (108 skips it).
//       A title that is set and released shows no chip.
//   The publisher header counts the chips ("2 not set") so a collapsed group still shows them.
//   A failed read says so once in the warnings strip; tiles then show neither line nor chip.
//   Styles are injected (#qh-qs-styles); quill-home CSS stays v1.0.0. HARDCODING: HC-P-QH3-1 the
//   tile words above and the date format.
//
// v1.0.2 — CONFIRMED FIELD SLUGS baked in as defaults.
//   CFG.fields.titleCode   = '3-digit-t-a-abbreviation'
//   CFG.fields.titleStatus = 'title-status'
//   Both read off the live CMS. No other change from v1.0.1.
//   v1.0.1 shipped with these blank, so stage 2 would have
//   returned every tile without a code and every status as the
//   fallback. Overriding them in QUILL_CONFIG still works and
//   still wins.
//
// v1.0.1 — 100-ITEM CAP FIX APPLIED AT BUILD (standing rule).
//
//   v1.0.0 detected the Collection-List render cap and painted a
//   warning. That is still a silent-failure surface: the warning
//   only fires AT the cap, and the operator still has to act.
//   Per the standing rule, the fix ships at build instead.
//
//   PATTERN PORTED, NOT RE-DERIVED. This is the same two-stage
//   read proven in content-library (paged webhook past the cap)
//   and client-manager (fetch the whole collection, then
//   overwrite the DOM-read data wholesale). Both are cited in
//   the Platform Roadmap as the remedies for this exact defect.
//
//   STAGE 1 — DOM bootstrap. Read the hidden Collection Lists and
//   paint immediately. Fast, and it works with no webhook wired.
//   Capped at 100 per list, which is why there is a stage 2.
//
//   STAGE 2 — live overwrite. If QUILL_CONFIG.makeListQuill is
//   set, page the full collections through Make and REPLACE the
//   DOM-read data wholesale, then repaint. Past the cap the DOM
//   is simply an incomplete prefix of the truth, so merging it
//   would be worse than discarding it.
//
//   Not wired yet? The surface degrades to stage 1 and says so in
//   the footer rather than pretending it has everything.
//
// ──────────────────────────────────────────────────────────
// MAKE SCENARIO CONTRACT (stage 2)
// ──────────────────────────────────────────────────────────
// Mirror makeListAssets. Webhook → Router on `collection` →
// Webflow "Make an API Call" → Webhook Response.
//
//   GET params sent:  ?collection=publishers|titles&offset=N&limit=100
//   Webflow call:     RELATIVE path /v2/collections/{id}/items
//                     header accept-version: 2.0.0
//                     query limit=100&offset=N&sortBy=createdOn&sortOrder=desc
//   Response:         {items:{items:[...],pagination:{limit,offset,total}}}
//                     A bare {items:[...]} is also accepted.
//
// RELATIVE PATH ONLY. A full URL gets /beta/ prepended and 404s
// (data-ref §12 standing rule).
//
// sortBy=createdOn DESC guarantees a stable order across pages.
// Without it, paging can return the same record twice and miss
// another entirely.
//
// Renders publisher groups and title tiles into #quill-home-mount
// from two hidden Webflow Collection Lists on the page.
//
// MULTI-TENANT: no publisher, title, slug, colour or count is
// hardcoded anywhere below. Everything comes from the DOM.
//
// ──────────────────────────────────────────────────────────
// DATA CONTRACT
// ──────────────────────────────────────────────────────────
// The JS reads DATA ATTRIBUTES, not field slugs. Bind whatever
// Webflow field you like to the attribute name. If a slug is
// wrong, that is a binding change in the Designer, not a code
// change here.
//
//   PUBLISHERS list — one wrapper per item, class .qh-pub-src
//     data-id            Item ID          (required)
//     data-name          Publisher name   (required)
//     data-slug          URL slug         (required for routing)
//     data-meta          Optional subtitle line (contact, note)
//     data-logo          Optional logo image URL
//
//   TITLES-ADMIN list — one wrapper per item, class .qh-title-src
//     data-id            Item ID          (required)
//     data-name          Title name       (required)
//     data-slug          Title URL slug   (required for routing)
//     data-code          3-digit T-A abbreviation
//     data-status        Status OPTION NAME (see STATUS_MAP)
//     data-publisher-id  PUBLISHERS item ID this title belongs to
//
// WEBFLOW OPTION-FIELD RULE: one binding per attribute, NAME or
// hash, never both. data-status is bound to the option NAME.
// If you later need the hash too, that is a SECOND attribute.
//
// WEBFLOW SWITCH-FIELD RULE: switches cannot bind to custom
// attributes. Do not make status a switch.
//
// ──────────────────────────────────────────────────────────
// FIELD MAP (stage 2 only)
// ──────────────────────────────────────────────────────────
// Stage 1 reads DOM attributes. Stage 2 reads Webflow API
// records, which are keyed by CMS FIELD SLUG. The two are
// different namespaces, so the slugs live in CFG.fields below
// and must be filled in before stage 2 is switched on.
//
// ALSO: set a SORT RULE on both Collection Lists in the Designer.
// An unsorted list at the cap drops arbitrary rows — that is what
// made the MEDIA picker return an inconsistent 100.
// ============================================================

(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════
  // CONFIG — the only block you should need to edit
  // ══════════════════════════════════════════════════════════
  var CFG = {

    // Route patterns. {slug} is replaced with the record's slug.
    // Override per-deploy via window.QUILL_CONFIG rather than
    // editing this file.
    publisherRoute: '/publisher/{slug}',
    titleRoute:     '/title-admin/{slug}',

    // Maps the TITLES-ADMIN status OPTION NAME (left) onto one of
    // three internal states (right): live | setup | queued.
    // Comparison is lowercased and trimmed. Add rows here when
    // you add options in the CMS — no other code changes.
    statusMap: {
      'live':         'live',
      'active':       'live',
      'onboarding':   'setup',
      'in setup':     'setup',
      'setup':        'setup',
      'not started':  'queued',
      'pipeline':     'queued',
      'prospect':     'queued'
    },

    // Anything unmapped or empty lands here.
    statusFallback: 'queued',

    // Human labels for the three internal states.
    statusLabel: { live: 'Live', setup: 'Onboarding', queued: 'Not started' },

    // A publisher with more than this many titles renders compact
    // and ships collapsed, so one large publisher cannot bury the
    // rest below the fold.
    compactThreshold: 8,

    // ── STAGE 2 · paged live read ───────────────────────────
    // Make webhook that fronts the Webflow v2 list endpoint.
    // Empty = stage 2 off, surface runs on the DOM read alone.
    makeListQuill: '',

    // v1.0.3 — Data Worker GET /quill-status (current issue and go-live per title).
    // Empty = the tiles carry no issue line or go-live chip.
    quillStatus: '',

    // v1.0.5 — ix-members Worker (portal members). HC-P-PP2-10.
    membersUrl: 'https://ix-members.jeff-2cd.workers.dev',
    portalLoginPath: '/portal-login',

    // CMS field slugs, used ONLY by stage 2. Webflow API records
    // are keyed by slug, not by the data-attributes stage 1 reads.
    // Fill these in before switching stage 2 on.
    fields: {
      pubName:    'name',
      pubSlug:    'slug',
      pubMeta:    '',            // optional, leave blank if none
      pubLogo:    '',            // optional
      titleName:  'name',
      titleSlug:  'slug',
      titleCode:  '3-digit-t-a-abbreviation',
      titleStatus:'title-status',
      titlePub:   'publisher'    // Ref → PUBLISHERS
    },

    // Webflow v2 caps limit at 100 per page. Not adjustable.
    pageSize: 100,

    // Guard against a feed that never shortens. 20 rounds is
    // 2,000 records, far past any real roster.
    maxRounds: 20,

    // Webflow's per-list DOM render cap. Stage 1 only.
    domCap: 100
  };

  // Per-deploy overrides, shallow-merged. Set window.QUILL_CONFIG
  // in the page head BEFORE this script loads.
  if (window.QUILL_CONFIG) {
    Object.keys(window.QUILL_CONFIG).forEach(function (k) {
      CFG[k] = window.QUILL_CONFIG[k];
    });
  }

  // ══════════════════════════════════════════════════════════
  // BOOT
  // ══════════════════════════════════════════════════════════
  function boot() {
    var mount = document.getElementById('quill-home-mount');
    if (!mount) return;

    // ── STAGE 1 · DOM bootstrap. Paint now. ──
    var data = readSources();
    var state = { filter: 'all', term: '', shut: {}, stage: 1, loading: false };
    applyCollapseDefaults(data, state);

    memStyles();                                                      // v1.0.7: header buttons styled from the start
    mount.innerHTML = shell(data, state);
    wire(mount, data, state);
    paintGroups(mount, data, state);

    loadQuillStatus(mount, data, state);                       // v1.0.3

    // ── STAGE 2 · live paged read, overwrite wholesale. ──
    if (!CFG.makeListQuill) return;

    state.loading = true;
    repaintChrome(mount, data, state);

    Promise.all([loadAll('publishers'), loadAll('titles')])
      .then(function (res) {
        var pubRows = res[0], titleRows = res[1];
        state.loading = false;

        // Either leg failing means we cannot trust the pair. Keep the
        // DOM read rather than paint a half-live roster that looks
        // authoritative. Partial truth is worse than stale truth here.
        if (!pubRows || !titleRows) {
          state.stage = 1;
          state.stageError = 'Live read failed. Showing the on-page lists, ' +
            'which stop at ' + CFG.domCap + ' rows per collection.';
          repaintChrome(mount, data, state);
          return;
        }

        var live = shapeApi(pubRows, titleRows);

        // WHOLESALE REPLACE, never merge. Past the cap the DOM read is
        // an incomplete prefix of this, so merging would preserve
        // nothing and risk duplicating everything.
        data.publishers = live.publishers;
        data.orphans    = live.orphans;
        data.titleTotal = live.titleTotal;
        data.liveTotal  = live.liveTotal;
        data.pubCount   = pubRows.length;
        data.titleCount = titleRows.length;
        state.stage = 2;
        state.shut = {};
        applyCollapseDefaults(data, state);

        repaintChrome(mount, data, state);
        paintGroups(mount, data, state);
      });
  }

  function applyCollapseDefaults(data, state) {
    data.publishers.forEach(function (p) {
      if (p.titles.length > CFG.compactThreshold) state.shut[p.id] = true;
    });
  }

  // Repaint the shell without losing the wired listener (which is
  // bound to the mount, not to anything inside it).
  function repaintChrome(mount, data, state) {
    var q = mount.querySelector('#qh-q');
    var term = q ? q.value : '';
    mount.innerHTML = shell(data, state);
    var q2 = mount.querySelector('#qh-q');
    if (q2 && term) q2.value = term;
    mount.querySelectorAll('[data-qh-filter]').forEach(function (b) {
      b.setAttribute('data-qh-active',
        b.getAttribute('data-qh-filter') === state.filter ? 'true' : 'false');
    });
    paintGroups(mount, data, state);
  }

  // ══════════════════════════════════════════════════════════
  // READ — hidden Collection Lists → objects
  // ══════════════════════════════════════════════════════════
  function readSources() {
    var pubEls   = document.querySelectorAll('.qh-pub-src');
    var titleEls = document.querySelectorAll('.qh-title-src');

    var publishers = [];
    var byId = {};

    pubEls.forEach(function (el) {
      var d = el.dataset;
      if (!d.id) return;                  // unbound row, skip
      var p = {
        id:    d.id,
        name:  d.name || '',
        slug:  d.slug || '',
        meta:  d.meta || '',
        logo:  d.logo || '',
        titles: []
      };
      if (!p.name) return;                // nameless row is not renderable
      publishers.push(p);
      byId[p.id] = p;
    });

    var orphans = 0;
    titleEls.forEach(function (el) {
      var d = el.dataset;
      if (!d.id || !d.name) return;
      var t = {
        id:     d.id,
        name:   d.name,
        slug:   d.slug || '',
        code:   d.code || '',
        status: normaliseStatus(d.status),
        pubId:  d.publisherId || ''
      };
      var parent = byId[t.pubId];
      if (parent) { parent.titles.push(t); } else { orphans++; }
    });

    return {
      publishers: publishers,
      orphans: orphans,
      pubCount: pubEls.length,
      titleCount: titleEls.length,
      titleTotal: publishers.reduce(function (n, p) { return n + p.titles.length; }, 0),
      liveTotal: publishers.reduce(function (n, p) {
        return n + p.titles.filter(function (t) { return t.status === 'live'; }).length;
      }, 0)
    };
  }

  function normaliseStatus(raw) {
    var key = String(raw || '').trim().toLowerCase();
    return CFG.statusMap[key] || CFG.statusFallback;
  }

  // ══════════════════════════════════════════════════════════
  // STAGE 2 — PAGED LIVE READ
  // ══════════════════════════════════════════════════════════

  // PORTED VERBATIM from content-library v1.0.51. Make answers an
  // overlapping or immediate webhook call with plain-text
  // "Accepted" rather than JSON. One retry after 600ms per the
  // data-ref §12 standing rule. Never throws to the caller.
  function fetchJsonResilient(url, label, _retried) {
    return fetch(url, { method: 'GET' })
      .then(function (r) {
        return r.text().then(function (t) {
          var s = (t || '').trim();
          if (!s || (s[0] !== '{' && s[0] !== '[')) {
            if (!_retried) {
              return new Promise(function (res) {
                setTimeout(function () {
                  res(fetchJsonResilient(url, label, true));
                }, 600);
              });
            }
            throw new Error('non-JSON after retry: ' + s.slice(0, 40));
          }
          return JSON.parse(s);
        });
      })
      .catch(function (e) {
        if (!_retried) {
          return new Promise(function (res) {
            setTimeout(function () {
              res(fetchJsonResilient(url, label, true));
            }, 600);
          });
        }
        console.warn('[QUILL] ' + (label || 'fetch') + ' failed', e && e.message);
        return null;
      });
  }

  function fetchPage(collection, offset) {
    var url = CFG.makeListQuill +
      (CFG.makeListQuill.indexOf('?') === -1 ? '?' : '&') +
      'collection=' + encodeURIComponent(collection) +
      '&offset=' + offset + '&limit=' + CFG.pageSize;
    return fetchJsonResilient(url, collection + ' page ' + offset);
  }

  // Accepts both documented shapes: {items:{items:[],pagination:{}}}
  // and a bare {items:[]}. content-library handles both because Make
  // has answered with each at different times.
  function unwrap(resp) {
    if (!resp) return null;
    var arr = Array.isArray(resp.items) ? resp.items
            : (resp.items && Array.isArray(resp.items.items)) ? resp.items.items
            : Array.isArray(resp) ? resp : null;
    if (!arr) return null;
    var total = (resp.total != null) ? resp.total
              : (resp.items && resp.items.pagination &&
                 resp.items.pagination.total) || null;
    return { rows: arr, total: total };
  }

  // Walks every page. Returns null on any failure so the caller can
  // fall back rather than paint a partial roster as if complete.
  function loadAll(collection) {
    var out = [];
    var round = 0;

    function next(offset) {
      if (round++ >= CFG.maxRounds) {
        console.warn('[QUILL] ' + collection + ' hit the round guard at ' +
                     out.length + ' rows.');
        return Promise.resolve(out);
      }
      return fetchPage(collection, offset).then(function (resp) {
        var page = unwrap(resp);
        if (!page) return null;                    // hard fail, bubble up
        out = out.concat(page.rows);
        var done = !page.rows.length ||
                   page.rows.length < CFG.pageSize ||
                   (page.total != null && out.length >= page.total);
        return done ? out : next(offset + page.rows.length);
      });
    }
    return next(0);
  }

  // Webflow API records → the same internal shape stage 1 produces,
  // so render, filter and sort are untouched.
  function shapeApi(pubRows, titleRows) {
    var F = CFG.fields;
    var publishers = [], byId = {};

    pubRows.forEach(function (rec) {
      var fd = rec.fieldData || {};
      var name = fd[F.pubName] || '';
      if (!rec.id || !name) return;
      var p = {
        id: rec.id,
        name: name,
        slug: fd[F.pubSlug] || rec.slug || '',
        meta: F.pubMeta ? (fd[F.pubMeta] || '') : '',
        logo: F.pubLogo ? imgUrl(fd[F.pubLogo]) : '',
        titles: []
      };
      publishers.push(p);
      byId[p.id] = p;
    });

    var orphans = 0;
    titleRows.forEach(function (rec) {
      var fd = rec.fieldData || {};
      var name = fd[F.titleName] || '';
      if (!rec.id || !name) return;
      var t = {
        id: rec.id,
        name: name,
        slug: fd[F.titleSlug] || rec.slug || '',
        code: F.titleCode ? (fd[F.titleCode] || '') : '',
        status: normaliseStatus(F.titleStatus ? fd[F.titleStatus] : ''),
        pubId: refId(fd[F.titlePub])
      };
      var parent = byId[t.pubId];
      if (parent) { parent.titles.push(t); } else { orphans++; }
    });

    publishers.forEach(function (p) {
      p.titles.sort(function (a, b) { return a.name.localeCompare(b.name); });
    });
    publishers.sort(function (a, b) { return a.name.localeCompare(b.name); });

    return {
      publishers: publishers,
      orphans: orphans,
      titleTotal: publishers.reduce(function (n, p) { return n + p.titles.length; }, 0),
      liveTotal: publishers.reduce(function (n, p) {
        return n + p.titles.filter(function (t) { return t.status === 'live'; }).length;
      }, 0)
    };
  }

  // Webflow returns a reference as a bare id string OR an object
  // carrying .id. Normalise, same as content-library v1.0.63.
  function refId(v) {
    if (!v) return '';
    if (typeof v === 'string') return v.trim();
    if (typeof v === 'object' && v.id) return String(v.id);
    return '';
  }

  function imgUrl(v) {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && v.url) return v.url;
    return '';
  }

  // ══════════════════════════════════════════════════════════
  // SHELL
  // ══════════════════════════════════════════════════════════
  function shell(data, state) {
    var warnings = [];

    if (state.stageError) {
      warnings.push(state.stageError);
    } else if (state.stage === 1 && !CFG.makeListQuill) {
      // Not an error. The surface says what it is reading from so a
      // short roster is never mistaken for a complete one.
      if (data.pubCount >= CFG.domCap || data.titleCount >= CFG.domCap) {
        warnings.push(
          'On-page lists have hit Webflow\u2019s ' + CFG.domCap + '-item render cap ' +
          'and rows beyond it are missing. Wire QUILL_CONFIG.makeListQuill to read ' +
          'the full collections.'
        );
      }
    }
    if (QS.err) warnings.push('Issue status did not load (' + QS.err + '). Tiles show no current issue or go-live flag.');   // v1.0.3
    if (data.orphans) {
      var one = data.orphans === 1;
      warnings.push(
        data.orphans + ' title' + (one ? '' : 's') +
        (one ? ' could not be matched to a publisher and is not shown. '
             : ' could not be matched to a publisher and are not shown. ') +
        'Check the PUBLISHER reference on those TITLES-ADMIN records.'
      );
    }

    return '' +
    '<div class="qh-wrap">' +

      '<div class="qh-chrome">' +
        '<div class="qh-mark">Q</div>' +
        '<div>' +
          '<div class="qh-kick">Healthiest Media</div>' +
          '<div class="qh-brandname">Quill</div>' +
        '</div>' +
        '<div class="qh-chrome-right">' +
          '<span class="qh-wordmark">INBXIFY</span>' +
          '<span class="qh-rule"></span>' +
        '</div>' +
      '</div>' +

      '<div class="qh-bar">' +
        '<h1>Platform Home</h1>' +
        '<span class="qh-bar-sub">All Publishers</span>' +
        '<span class="qh-vtag">v1.0.4</span>' +
      '</div>' +

      '<div class="qh-strip">' +
        '<span class="qh-strip-lbl">Network</span>' +
        '<span class="qh-strip-fig"><b>' + data.publishers.length + '</b> publisher' +
          (data.publishers.length === 1 ? '' : 's') + '</span>' +
        '<span class="qh-strip-fig"><b>' + data.titleTotal + '</b> title' +
          (data.titleTotal === 1 ? '' : 's') + '</span>' +
        '<span class="qh-strip-fig"><b>' + data.liveTotal + '</b> live</span>' +
        '<span class="qh-strip-sp"></span>' +
        '<span class="qh-strip-lbl">' + esc(sourceLabel(state)) + '</span>' +
      '</div>' +

      warnings.map(function (w) {
        return '<div class="qh-warn">' + esc(w) + '</div>';
      }).join('') +

      '<div class="qh-toolbar">' +
        '<div class="qh-search">' +
          '<span class="qh-search-ico">\u2315</span>' +
          '<input type="text" id="qh-q" autocomplete="off" ' +
                 'placeholder="Find a title or publisher\u2026" ' +
                 'aria-label="Find a title or publisher">' +
        '</div>' +
        '<button class="qh-btn qh-btn--pill" data-qh-filter="all" data-qh-active="true">All</button>' +
        '<button class="qh-btn qh-btn--pill" data-qh-filter="live">Live</button>' +
        '<button class="qh-btn qh-btn--pill" data-qh-filter="setup">Onboarding</button>' +
        '<button class="qh-btn qh-btn--pill" data-qh-filter="queued">Not started</button>' +
        '<span class="qh-tb-sp"></span>' +
        '<span class="qh-count" id="qh-count"></span>' +
        '<button class="qh-btn qh-btn--ghost" id="qh-collapse">Collapse all</button>' +
      '</div>' +

      '<div class="qh-groups" id="qh-groups"></div>' +
    '</div>';
  }

  // ══════════════════════════════════════════════════════════
  // PAINT
  // ══════════════════════════════════════════════════════════
  function paintGroups(mount, data, state) {
    var host = mount.querySelector('#qh-groups');
    var term = state.term;
    var shown = 0;
    var html = '';

    if (!data.publishers.length) {
      host.innerHTML = '<div class="qh-empty">No publishers found. ' +
        'Check that the PUBLISHERS Collection List is on the page and its ' +
        'attribute bindings are set.</div>';
      mount.querySelector('#qh-count').textContent = '';
      return;
    }

    data.publishers.forEach(function (p) {
      var visible = p.titles.filter(function (t) { return match(t, p, state); });
      shown += visible.length;
      if (!visible.length) return;

      // A live search or filter force-opens a group so a result is
      // never hidden behind a collapsed publisher.
      var forced = !!(term || state.filter !== 'all');
      var isShut = !forced && !!state.shut[p.id];
      var compact = p.titles.length > CFG.compactThreshold;
      var live = p.titles.filter(function (t) { return t.status === 'live'; }).length;

      html +=
      '<div class="qh-grp' + (isShut ? ' qh-grp--shut' : '') + '" data-qh-pub="' + esc(p.id) + '">' +
        '<div class="qh-grp-hd">' +
          '<button class="qh-pub-id" data-qh-route="' + esc(route(CFG.publisherRoute, p.slug)) + '">' +
            '<span class="qh-pub-logo">' +
              (p.logo ? '<img src="' + esc(p.logo) + '" alt="">' : esc(initials(p.name))) +
            '</span>' +
            '<span>' +
              '<span class="qh-pub-nm">' + esc(p.name) + '</span>' +
              (p.meta ? '<span class="qh-pub-meta">' + esc(p.meta) + '</span>' : '') +
            '</span>' +
          '</button>' +
          '<div class="qh-grp-stats">' +
            '<button class="qh-mem-btn" type="button" data-qh-members="' + esc(p.id) + '">' + MEM_W.button + '</button>' +   // v1.0.5
            portalLink(p) +                                                                                                // v1.0.7
            (live ? '<span class="qh-stat qh-stat--live">' + live + ' live</span>' : '') +
            (notSetOf(p) ? '<span class="qh-stat qh-stat--alert">' + notSetOf(p) + QS_W.count + '</span>' : '') +   // v1.0.4
            '<span class="qh-stat">' + p.titles.length + ' title' +
              (p.titles.length === 1 ? '' : 's') + '</span>' +
            '<button class="qh-toggle" data-qh-toggle="' + esc(p.id) + '" ' +
                    'aria-expanded="' + (isShut ? 'false' : 'true') + '" ' +
                    'aria-label="Toggle ' + esc(p.name) + '">' +
              (isShut ? '\u25B8' : '\u25BE') +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="qh-tiles' + (compact ? ' qh-tiles--compact' : '') + '">' +
          visible.map(tile).join('') +
        '</div>' +
      '</div>';
    });

    host.innerHTML = html || '<div class="qh-empty">Nothing matches that search.</div>';
    mount.querySelector('#qh-count').textContent =
      shown + (shown === 1 ? ' title' : ' titles');
  }

  // ══════════════════════════════════════════════════════════
  // v1.0.3 — ISSUE STATUS (Data Worker /quill-status)
  // ══════════════════════════════════════════════════════════
  var QS = { titles: null, err: '' };
  var QS_W = { current: 'Current', none: 'No current issue', next: 'Next issue:',                // HC-P-QH3-1
               notStarted: 'Not started', inProgress: 'In progress', set: 'Set to next', count: ' next not set',
               tipNone: 'Scenario 108 has not made any issue current for this title yet.',
               tipNotStarted: 'No PubPlan is dated after the current issue. Add the next one on Pub Plans.',
               tipNotSet: '{code} is being planned. When it is released, use Set to go live on its Pub Plans card.',
               tipNotRel: '{code} is set to go live, but its issue is not released. Scenario 108 skips it until it is released.',
               tipSet: '{code} is released and set to go live. Scenario 108 makes it the current issue the day before {date}.' };
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function dayLabel(ymd) {                   // 'YYYY-MM-DD' → 'Sun, Nov 1' (a calendar date: no zone shift)
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ''));
    if (!m) return '';
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return DAYS[d.getUTCDay()] + ', ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate();
  }
  function qsOf(t) { return (QS.titles && t.status === 'live') ? (QS.titles[t.id] || { current: null, live: null }) : null; }
  function nextOf(t) { var q = qsOf(t); return q ? (q.next || { stage: 'notStarted' }) : null; }
  function notSetOf(p) {
    return p.titles.filter(function (t) { var n = nextOf(t); return !!n && n.stage !== 'set'; }).length;
  }
  function fill(w, n) { return w.replace('{code}', (n && n.code) || 'The next issue').replace('{date}', dayLabel(n && n.date) || 'its issue date'); }
  function currentBits(t) {
    var q = qsOf(t); if (!q) return '';
    var c = q.current;
    return c
      ? '<span class="qh-iss">' + QS_W.current + ' <b>' + esc(c.code || (c.issueNo ? '#' + c.issueNo : '')) + '</b>' +
          (c.date ? ' \u00B7 ' + esc(dayLabel(c.date)) : '') + '</span>'
      : '<span class="qh-iss qh-iss--none" title="' + esc(QS_W.tipNone) + '">' + QS_W.none + '</span>';
  }
  function nextBits(t) {
    var n = nextOf(t); if (!n) return '';
    var st = n.stage === 'set' ? 'set' : n.stage === 'inProgress' ? 'inProgress' : 'notStarted';
    var tip = st === 'set' ? fill(QS_W.tipSet, n) : st === 'notStarted' ? QS_W.tipNotStarted
            : fill(n.why === 'notReleased' ? QS_W.tipNotRel : QS_W.tipNotSet, n);
    return '<span class="qh-next" title="' + esc(tip) + '">' +
             '<span class="qh-next-l">' + QS_W.next + '</span>' +
             (n.code ? '<b>' + esc(n.code) + '</b>' : '') +
             '<span class="qh-nchip qh-nchip--' + (st === 'set' ? 'ok' : 'bad') + '">' + QS_W[st] + '</span>' +
           '</span>';
  }
  function qsStyles() {
    if (document.getElementById('qh-qs-styles')) return;
    var st = document.createElement('style'); st.id = 'qh-qs-styles';
    st.textContent =
      '#quill-home-mount .qh-iss{font:500 11px/1.3 var(--bx-font-mono);color:var(--bx-text-mid);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '#quill-home-mount .qh-iss b{font-weight:500;color:var(--bx-ink)}' +
      '#quill-home-mount .qh-iss--none{color:var(--bx-accent-deep)}' +
      '#quill-home-mount .qh-next{margin-top:auto;display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding-top:7px;border-top:1px solid var(--bx-border-soft);' +
        'font:500 11px/1.3 var(--bx-font-mono);color:var(--bx-text-mid);cursor:pointer}' +   // v1.0.7: was help (the "?")
      '#quill-home-mount .qh-next b{font-weight:500;color:var(--bx-ink)}' +
      '#quill-home-mount .qh-nchip{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:var(--bx-radius-pill);font:600 11px/1.3 var(--bx-font-body);white-space:nowrap}' +
      '#quill-home-mount .qh-nchip::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}' +
      '#quill-home-mount .qh-nchip--bad{background:var(--bx-accent-tint);border:1px solid var(--bx-accent-line);color:var(--bx-danger)}' +
      '#quill-home-mount .qh-nchip--ok{background:var(--bx-ok-tint);border:1px solid var(--bx-ok-line);color:var(--bx-ok)}' +
      '#quill-home-mount .qh-tile-foot--mid{margin-top:0}' +
      '#quill-home-mount .qh-stat--alert{background:var(--bx-accent-tint);border-color:var(--bx-accent-line);color:var(--bx-accent-deep)}';
    document.head.appendChild(st);
  }
  function loadQuillStatus(mount, data, state) {
    var u = String(CFG.quillStatus || '').trim();
    if (!u) { console.info('[Quill] QUILL_CONFIG.quillStatus is not set, so tiles show no issue status.'); return; }
    qsStyles();
    fetch(u, { method: 'GET' })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (res) {
        if (!res.body || !res.body.ok || !res.body.titles) throw new Error((res.body && res.body.error) || ('HTTP ' + res.status));
        QS.titles = res.body.titles; QS.err = '';
      })
      .catch(function (e) { QS.titles = null; QS.err = (e && e.message) || 'no answer'; console.error('[Quill] /quill-status:', e); })
      .then(function () { repaintChrome(mount, data, state); });
  }

  // ══════════════════════════════════════════════════════════
  // v1.0.5 — PORTAL MEMBERS (ix-members)
  // ══════════════════════════════════════════════════════════
  var MEM_W = { button: 'Members', title: 'Portal members',
    portal: 'Portal \u2197', portalTip: 'Open the {name} portal in a new tab',                     // v1.0.7                                       // HC-P-PP2-11
    intro: 'People who can log in to this publisher\u2019s portal. New members log in with a code sent to their email; there is no password.',
    loading: 'Loading members\u2026', none: 'No one has portal access yet.',
    canLogIn: 'Can log in', noPlan: 'No portal plan', missing: 'Not found in Memberstack',
    remove: 'Remove', confirm: 'Remove {name}? They lose access to this portal{plan}.', confirmPlan: ' and, if they belong to no other publisher, their login stops opening any portal',
    yes: 'Yes, remove', no: 'Keep', addHd: 'Add a member', first: 'First name', last: 'Last name', email: 'Email',
    add: 'Add member', adding: 'Adding\u2026', cancel: 'Cancel', close: 'Close',
    added: '{name} added. They log in at {path} with their email.', linked: '{name} already had a login. It is now linked to this publisher.',
    already: '{email} is already a member of this publisher.', removed: '{name} removed.',
    unconfirmed: 'Saved, but not confirmed: {list}. Check before relying on it.',
    welcomeSent: 'Welcome email sent to {email}.', welcomeFail: 'Welcome email not sent: {error}', resend: 'Send welcome', resending: 'Sending\u2026',
    needAll: 'First name, last name and a full email are all needed.',
    noLogin: 'Your Quill login could not be read. Refresh the page and log in again.',
    noUrl: 'QUILL_CONFIG.membersUrl is not set, so members cannot be managed here.' };
  var MEM = { pub: null, el: null, busy: false };

  // v1.0.7 — Portal ↗: a real link, new tab, from CFG.publisherRoute.
  function portalLink(p) {
    var href = route(CFG.publisherRoute, p.slug);
    if (!href || href.indexOf('{slug}') > -1) return '';
    return '<a class="qh-mem-btn qh-portal-btn" href="' + esc(href) + '" target="_blank" rel="noopener" ' +
           'title="' + esc(fillW(MEM_W.portalTip, { name: p.name })) + '">' + MEM_W.portal + '</a>';
  }

  function memStyles() {
    if (document.getElementById('qh-mem-styles')) return;
    var st = document.createElement('style'); st.id = 'qh-mem-styles';
    st.textContent =
      '#quill-home-mount .qh-mem-btn{display:inline-flex;align-items:center;justify-content:center;width:84px;height:24px;padding:0 10px;border:1px solid var(--bx-border);border-radius:var(--bx-radius-pill);' +
        'background:var(--bx-surface);font:600 11px/1 var(--bx-font-body);color:var(--bx-blue-deep);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '#quill-home-mount .qh-mem-btn:hover{background:var(--bx-blue-pale)}' +
      '#quill-home-mount a.qh-portal-btn,#quill-home-mount a.qh-portal-btn:hover,#quill-home-mount a.qh-portal-btn:visited{text-decoration:none!important;color:var(--bx-blue-deep)!important;box-sizing:border-box}' +   // v1.0.7: site link styles off
      '.qh-mem-ov{position:fixed;inset:0;z-index:9500;background:rgba(20,27,51,.45);display:flex;align-items:flex-start;justify-content:center;padding:64px 16px;overflow:auto}' +
      '.qh-mem{width:100%;max-width:640px;background:var(--bx-surface);border-radius:var(--bx-radius);box-shadow:var(--bx-shadow-lg);font-family:var(--bx-font-body);color:var(--bx-text)}' +
      '.qh-mem *{box-sizing:border-box}' +
      '.qh-mem-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 24px 14px;border-bottom:1px solid var(--bx-border-soft)}' +
      '.qh-mem-eb{margin:0 0 4px;font:600 11px/1.3 var(--bx-font-body);letter-spacing:.1em;text-transform:uppercase;color:var(--bx-accent-deep)}' +
      '.qh-mem-ti{margin:0;font:600 22px/1.2 var(--bx-font-display);color:var(--bx-ink)}' +
      '.qh-mem-x{flex:none;width:32px;height:32px;border:0;border-radius:var(--bx-radius-sm);background:none;font:400 22px/1 var(--bx-font-body);color:var(--bx-text-mid);cursor:pointer}' +
      '.qh-mem-x:hover{background:var(--bx-mist)}' +
      '.qh-mem-bd{padding:14px 24px 22px}' +
      '.qh-mem-in{margin:0 0 14px;font-size:13px;line-height:1.5;color:var(--bx-text-mid)}' +
      '.qh-mem-list{margin:0 0 20px;padding:0;list-style:none;border:1px solid var(--bx-border);border-radius:var(--bx-radius-sm)}' +
      '.qh-mem-row{display:grid;grid-template-columns:minmax(0,1fr) 120px 96px 64px;align-items:center;gap:12px;padding:9px 12px;border-top:1px solid var(--bx-border-soft);font-size:13px}' +
      '.qh-mem-row:first-child{border-top:0}' +
      '.qh-mem-who{min-width:0}.qh-mem-nm{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.qh-mem-em{display:block;font:400 12px/1.4 var(--bx-font-mono);color:var(--bx-text-mid);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.qh-mem-st{font-size:12px;white-space:nowrap}.qh-mem-st--ok{color:var(--bx-ok)}.qh-mem-st--bad{color:var(--bx-accent-deep)}' +
      '.qh-mem-lk{justify-self:end;padding:0;border:0;background:none;font:500 12px/1 var(--bx-font-body);color:var(--bx-blue-deep);text-decoration:underline;cursor:pointer}' +
      '.qh-mem-conf{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--bx-radius-sm);background:var(--bx-accent-tint);font-size:12px;line-height:1.4;color:var(--bx-text)}' +
      '.qh-mem-conf .qh-mem-go{height:28px;padding:0 12px;border:0;border-radius:var(--bx-radius-sm);background:var(--bx-danger);color:#fff;font:600 12px/1 var(--bx-font-body);cursor:pointer}' +
      '.qh-mem-empty{padding:12px;font-size:13px;color:var(--bx-text-mid)}' +
      '.qh-mem-add{padding-top:16px;border-top:1px solid var(--bx-border-soft)}' +
      '.qh-mem-addhd{margin:0 0 10px;font:600 14px/1.3 var(--bx-font-display);color:var(--bx-ink)}' +
      '.qh-mem-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px}' +
      '.qh-mem-f{display:flex;flex-direction:column;gap:4px;min-width:0}.qh-mem-f--wide{grid-column:1/-1}' +
      '.qh-mem-f label{font:500 12px/1.3 var(--bx-font-body);color:var(--bx-text)}' +
      '.qh-mem-f input{height:38px;padding:0 10px;font:400 14px/1 var(--bx-font-body);color:var(--bx-text);background:var(--bx-surface);border:1px solid var(--bx-idle);border-radius:var(--bx-radius-sm)}' +
      '.qh-mem-f input:focus{outline:none;border-color:var(--bx-blue-deep);box-shadow:var(--bx-shadow-blue)}' +
      '.qh-mem-f input[data-dirty="true"]{border:2px solid var(--bx-changed-border)}' +
      '.qh-mem-bar{display:flex;align-items:center;justify-content:flex-end;gap:16px;margin-top:14px}' +
      '.qh-mem-cx{padding:0;border:0;background:none;font:500 12px/1 var(--bx-font-body);color:var(--bx-text-mid);text-decoration:underline;cursor:pointer}' +
      '.qh-mem-cx[hidden]{display:none}' +
      '.qh-mem-ok{position:relative;overflow:hidden;width:150px;height:38px;border:0;border-radius:var(--bx-radius-sm);background:var(--bx-blue-deep);color:#fff;font:600 14px/1 var(--bx-font-body);cursor:pointer}' +
      '.qh-mem-ok:hover{background:var(--bx-ink-mid)}.qh-mem-ok[aria-busy="true"]{cursor:progress}' +
      '.qh-mem-ok[aria-busy="true"]::after{content:"";position:absolute;left:0;bottom:0;height:4px;width:40%;background:var(--bx-blue-lift);animation:qh-mem-run 1s ease-in-out infinite}' +
      '@keyframes qh-mem-run{0%{transform:translateX(-100%)}100%{transform:translateX(260%)}}' +
      '.qh-mem-msg{margin:12px 0 0;font-size:13px;line-height:1.5}.qh-mem-msg:empty{display:none}' +
      '.qh-mem-msg--ok{color:var(--bx-ok)}.qh-mem-msg--bad{color:var(--bx-danger)}';
    document.head.appendChild(st);
  }

  function memToken() {
    var d = window.$memberstackDom;
    if (!d || !d.getMemberCookie) return Promise.resolve(null);
    return Promise.resolve(d.getMemberCookie()).catch(function () { return null; });
  }
  function memCall(path, opts) {
    var base = String(CFG.membersUrl || '').replace(/\/+$/, '');
    if (!base) return Promise.reject(new Error(MEM_W.noUrl));
    return memToken().then(function (tok) {
      if (!tok) throw new Error(MEM_W.noLogin);
      var o = opts || {};
      return fetch(base + path, { method: o.method || 'GET', headers: Object.assign({ Authorization: 'Bearer ' + tok }, o.body ? { 'Content-Type': 'application/json' } : {}),
        body: o.body ? JSON.stringify(o.body) : undefined })
        .then(function (r) { return r.json().catch(function () { return null; }).then(function (j) {
          if (!j) throw new Error('ix-members HTTP ' + r.status);
          if (!r.ok && !(j && j.unconfirmed)) throw new Error(j.error || ('ix-members HTTP ' + r.status));
          return j; }); });
    });
  }
  function fillW(w, o) { return w.replace(/\{(\w+)\}/g, function (_, k) { return o[k] == null ? '' : o[k]; }); }
  function memName(m) { var n = ((m.firstName || '') + ' ' + (m.lastName || '')).trim(); return n || m.email || m.id; }

  function openMembers(pub) {
    memStyles();
    closeMembers();
    MEM.pub = pub; MEM.busy = false;
    var ov = document.createElement('div'); ov.className = 'qh-mem-ov';
    ov.innerHTML =
      '<div class="qh-mem" role="dialog" aria-modal="true" aria-labelledby="qh-mem-ti">' +
        '<div class="qh-mem-hd"><div><p class="qh-mem-eb">' + esc(pub.name) + '</p><h2 class="qh-mem-ti" id="qh-mem-ti">' + MEM_W.title + '</h2></div>' +
          '<button class="qh-mem-x" type="button" data-mem-close aria-label="' + MEM_W.close + '">\u00D7</button></div>' +
        '<div class="qh-mem-bd">' +
          '<p class="qh-mem-in">' + MEM_W.intro + '</p>' +
          '<ul class="qh-mem-list" id="qh-mem-list"><li class="qh-mem-empty">' + MEM_W.loading + '</li></ul>' +
          '<form class="qh-mem-add" id="qh-mem-form" novalidate>' +
            '<h3 class="qh-mem-addhd">' + MEM_W.addHd + '</h3>' +
            '<div class="qh-mem-grid">' +
              '<div class="qh-mem-f"><label for="qh-mem-first">' + MEM_W.first + '</label><input id="qh-mem-first" autocomplete="off"></div>' +
              '<div class="qh-mem-f"><label for="qh-mem-last">' + MEM_W.last + '</label><input id="qh-mem-last" autocomplete="off"></div>' +
              '<div class="qh-mem-f qh-mem-f--wide"><label for="qh-mem-email">' + MEM_W.email + '</label><input id="qh-mem-email" type="email" autocomplete="off"></div>' +
            '</div>' +
            '<div class="qh-mem-bar"><button class="qh-mem-cx" type="button" data-mem-cancel hidden>' + MEM_W.cancel + '</button>' +
              '<button class="qh-mem-ok" type="submit">' + MEM_W.add + '</button></div>' +
            '<p class="qh-mem-msg" id="qh-mem-msg" aria-live="polite"></p>' +
          '</form>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov); MEM.el = ov;

    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-mem-close]')) { if (!MEM.busy) closeMembers(); return; }
      if (e.target.closest('[data-mem-cancel]')) { resetAdd(); return; }
      var wl = e.target.closest('[data-mem-welcome]'); if (wl) { doWelcome(wl); return; }
      var rm = e.target.closest('[data-mem-remove]'); if (rm) { askRemove(rm.getAttribute('data-mem-remove')); return; }
      var keep = e.target.closest('[data-mem-keep]'); if (keep) { var c = ov.querySelector('.qh-mem-conf'); if (c) c.remove(); return; }
      var go = e.target.closest('[data-mem-go]'); if (go) { doRemove(go.getAttribute('data-mem-go')); return; }
    });
    ov.addEventListener('input', function (e) {
      var inp = e.target.closest('.qh-mem-f input'); if (!inp) return;
      inp.setAttribute('data-dirty', inp.value.trim() ? 'true' : 'false');
      ov.querySelector('[data-mem-cancel]').hidden = !ov.querySelectorAll('.qh-mem-f input[data-dirty="true"]').length;
    });
    ov.querySelector('#qh-mem-form').addEventListener('submit', function (e) { e.preventDefault(); doAdd(); });
    document.addEventListener('keydown', memKey);
    ov.querySelector('#qh-mem-first').focus();
    loadMembers();
  }
  function memKey(e) { if (e.key === 'Escape' && MEM.el && !MEM.busy) closeMembers(); }
  function closeMembers() {
    if (MEM.el) { MEM.el.remove(); MEM.el = null; }
    document.removeEventListener('keydown', memKey);
  }
  function memMsg(text, ok) { var m = MEM.el && MEM.el.querySelector('#qh-mem-msg'); if (!m) return; m.className = 'qh-mem-msg ' + (ok ? 'qh-mem-msg--ok' : 'qh-mem-msg--bad'); m.textContent = text || ''; }
  function resetAdd() {
    if (!MEM.el) return;
    MEM.el.querySelectorAll('.qh-mem-f input').forEach(function (i) { i.value = ''; i.setAttribute('data-dirty', 'false'); });
    MEM.el.querySelector('[data-mem-cancel]').hidden = true;
    memMsg('', true);
  }

  function loadMembers() {
    var list = MEM.el.querySelector('#qh-mem-list');
    memCall('/members?publisher=' + encodeURIComponent(MEM.pub.id)).then(function (j) {
      if (!MEM.el) return;
      MEM.rows = j.members || [];
      paintMembers();
    }).catch(function (e) { if (list) list.innerHTML = '<li class="qh-mem-empty">' + esc(e.message) + '</li>'; });
  }
  function paintMembers() {
    var list = MEM.el.querySelector('#qh-mem-list');
    if (!MEM.rows.length) { list.innerHTML = '<li class="qh-mem-empty">' + MEM_W.none + '</li>'; return; }
    list.innerHTML = MEM.rows.map(function (m) {
      var st = m.missing || m.unreadable ? ['bad', MEM_W.missing] : (m.hasPortalPlan ? ['ok', MEM_W.canLogIn] : ['bad', MEM_W.noPlan]);
      return '<li class="qh-mem-row" data-mem-row="' + esc(m.id) + '">' +
        '<span class="qh-mem-who"><span class="qh-mem-nm">' + esc(memName(m)) + '</span><span class="qh-mem-em">' + esc(m.email || m.id) + '</span></span>' +
        '<span class="qh-mem-st qh-mem-st--' + st[0] + '">' + st[1] + '</span>' +
        '<button class="qh-mem-lk" type="button" data-mem-welcome="' + esc(m.id) + '">' + MEM_W.resend + '</button>' +
        '<button class="qh-mem-lk" type="button" data-mem-remove="' + esc(m.id) + '">' + MEM_W.remove + '</button>' +
      '</li>';
    }).join('');
  }
  function askRemove(id) {
    var old = MEM.el.querySelector('.qh-mem-conf'); if (old) old.remove();
    var row = MEM.el.querySelector('[data-mem-row="' + id + '"]'); if (!row) return;
    var m = MEM.rows.filter(function (r) { return r.id === id; })[0] || { id: id };
    var c = document.createElement('div'); c.className = 'qh-mem-conf';
    c.innerHTML = '<span>' + esc(fillW(MEM_W.confirm, { name: memName(m), plan: MEM_W.confirmPlan })) + '</span>' +
      '<button class="qh-mem-go" type="button" data-mem-go="' + esc(id) + '">' + MEM_W.yes + '</button>' +
      '<button class="qh-mem-cx" type="button" data-mem-keep>' + MEM_W.no + '</button>';
    row.appendChild(c);
  }
  function doRemove(id) {
    if (MEM.busy) return; MEM.busy = true;
    var m = MEM.rows.filter(function (r) { return r.id === id; })[0] || { id: id };
    var go = MEM.el.querySelector('[data-mem-go="' + id + '"]'); if (go) { go.setAttribute('aria-busy', 'true'); go.disabled = true; }
    memCall('/members/' + encodeURIComponent(id) + '/remove', { method: 'POST', body: { publisher: MEM.pub.id } }).then(function (j) {
      memMsg(j.unconfirmed && j.unconfirmed.length ? fillW(MEM_W.unconfirmed, { list: j.unconfirmed.join(', ') }) : fillW(MEM_W.removed, { name: memName(m) }), !(j.unconfirmed && j.unconfirmed.length));
      MEM.rows = MEM.rows.filter(function (r) { return r.id !== id; }); paintMembers();
    }).catch(function (e) { memMsg(e.message, false); var c = MEM.el && MEM.el.querySelector('.qh-mem-conf'); if (c) c.remove(); })
      .then(function () { MEM.busy = false; });
  }
  function doWelcome(btn) {
    if (MEM.busy) return; MEM.busy = true;
    var id = btn.getAttribute('data-mem-welcome');
    btn.textContent = MEM_W.resending; btn.disabled = true; memMsg('', true);
    memCall('/members/' + encodeURIComponent(id) + '/welcome', { method: 'POST', body: { publisher: MEM.pub.id } }).then(function (j) {
      var w = j.welcome || {};
      memMsg(w.sent ? fillW(MEM_W.welcomeSent, { email: w.to || '' }) : fillW(MEM_W.welcomeFail, { error: w.error || j.error || '' }), !!w.sent);
    }).catch(function (e) { memMsg(fillW(MEM_W.welcomeFail, { error: e.message }), false); })
      .then(function () { MEM.busy = false; btn.textContent = MEM_W.resend; btn.disabled = false; });
  }
  function doAdd() {
    if (MEM.busy) return;
    var f = MEM.el.querySelector('#qh-mem-first').value.trim(), l = MEM.el.querySelector('#qh-mem-last').value.trim();
    var em = MEM.el.querySelector('#qh-mem-email').value.trim().toLowerCase();
    if (!f || !l || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { memMsg(MEM_W.needAll, false); return; }
    var btn = MEM.el.querySelector('.qh-mem-ok');
    MEM.busy = true; memMsg('', true); btn.setAttribute('aria-busy', 'true'); btn.textContent = MEM_W.adding; btn.disabled = true;
    memCall('/members', { method: 'POST', body: { publisher: MEM.pub.id, email: em, firstName: f, lastName: l } }).then(function (j) {
      var nm = memName(j.member || { firstName: f, lastName: l, email: em });
      var text = j.alreadyLinked ? fillW(MEM_W.already, { email: em }) : fillW(j.created ? MEM_W.added : MEM_W.linked, { name: nm, path: CFG.portalLoginPath });
      if (j.unconfirmed && j.unconfirmed.length) text += ' ' + fillW(MEM_W.unconfirmed, { list: j.unconfirmed.join(', ') });
      var wOk = true;
      if (j.welcome) { wOk = !!j.welcome.sent; text += ' ' + (j.welcome.sent ? fillW(MEM_W.welcomeSent, { email: j.welcome.to || em }) : fillW(MEM_W.welcomeFail, { error: j.welcome.error || '' })); }
      resetAdd(); memMsg(text, wOk && !(j.unconfirmed && j.unconfirmed.length));
      if (j.member && !MEM.rows.some(function (r) { return r.id === j.member.id; })) MEM.rows.push(j.member);
      paintMembers();
    }).catch(function (e) { memMsg(e.message, false); })
      .then(function () { MEM.busy = false; if (MEM.el) { btn.removeAttribute('aria-busy'); btn.textContent = MEM_W.add; btn.disabled = false; } });
  }

  function tile(t) {
    var label = CFG.statusLabel[t.status] || t.status;
    return '' +
    '<button class="qh-tile" data-qh-status="' + esc(t.status) + '" ' +
            'data-qh-route="' + esc(route(CFG.titleRoute, t.slug)) + '">' +
      '<span class="qh-tile-top">' +
        (t.code ? '<span class="qh-code">' + esc(t.code) + '</span>' : '') +
        '<span class="qh-dot" data-qh-status="' + esc(t.status) + '"></span>' +
      '</span>' +
      '<span class="qh-tile-nm">' + esc(t.name) + '</span>' +
      currentBits(t) +                                                   // v1.0.4: current, then LIVE, then Next issue
      '<span class="qh-tile-foot' + (qsOf(t) ? ' qh-tile-foot--mid' : '') + '">' +
        '<span class="qh-st" data-qh-status="' + esc(t.status) + '">' + esc(label) + '</span>' +
      '</span>' +
      nextBits(t) +
    '</button>';
  }

  function match(t, p, state) {
    if (state.filter !== 'all' && t.status !== state.filter) return false;
    if (!state.term) return true;
    var hay = (t.name + ' ' + t.code + ' ' + p.name).toLowerCase();
    return hay.indexOf(state.term) > -1;
  }

  // ══════════════════════════════════════════════════════════
  // WIRE — one delegated listener, survives every repaint
  // ══════════════════════════════════════════════════════════
  function wire(mount, data, state) {
    mount.addEventListener('click', function (e) {
      var memBtn = e.target.closest('[data-qh-members]');                // v1.0.5
      if (memBtn) {
        var pid = memBtn.getAttribute('data-qh-members');
        var pub = data.publishers.filter(function (x) { return x.id === pid; })[0];
        if (pub) openMembers(pub);
        return;
      }

      var toggle = e.target.closest('[data-qh-toggle]');
      if (toggle) {
        var id = toggle.getAttribute('data-qh-toggle');
        state.shut[id] = !state.shut[id];
        paintGroups(mount, data, state);
        return;
      }

      var filter = e.target.closest('[data-qh-filter]');
      if (filter) {
        state.filter = filter.getAttribute('data-qh-filter');
        mount.querySelectorAll('[data-qh-filter]').forEach(function (b) {
          b.setAttribute('data-qh-active', b === filter ? 'true' : 'false');
        });
        paintGroups(mount, data, state);
        return;
      }

      if (e.target.closest('#qh-collapse')) {
        data.publishers.forEach(function (p) { state.shut[p.id] = true; });
        paintGroups(mount, data, state);
        return;
      }

      // Routing last — the specific handlers above take precedence,
      // which is why the toggle inside a group header does not
      // navigate to the publisher page.
      var nav = e.target.closest('[data-qh-route]');
      if (nav) {
        var href = nav.getAttribute('data-qh-route');
        if (href && href.indexOf('/{slug}') === -1) window.location.href = href;
      }
    });

    // DELEGATED, not bound to #qh-q directly. repaintChrome replaces
    // mount.innerHTML when the stage-2 read lands, which destroys the
    // input element. A listener attached to that element dies with it
    // and search silently stops working the moment the live data
    // arrives — precisely when the roster is large enough to need it.
    mount.addEventListener('input', function (e) {
      var q = e.target.closest('#qh-q');
      if (!q) return;
      state.term = q.value.trim().toLowerCase();
      paintGroups(mount, data, state);
    });
  }

  // ══════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════
  // Provenance, stated on the surface. A roster that is complete and
  // a roster that stops at the cap should never look identical.
  function sourceLabel(state) {
    if (state.loading) return 'Loading full lists\u2026';
    if (state.stage === 2) return 'Full lists';
    if (state.stageError) return 'On-page lists \u00B7 live read failed';
    if (!CFG.makeListQuill) return 'On-page lists \u00B7 max ' + CFG.domCap;
    return 'On-page lists';
  }

  function route(pattern, slug) {
    if (!slug) return '';                       // no slug, no navigation
    return pattern.replace('{slug}', encodeURIComponent(slug));
  }

  function initials(name) {
    return String(name || '')
      .split(/\s+/).filter(Boolean).slice(0, 2)
      .map(function (w) { return w.charAt(0).toUpperCase(); })
      .join('') || '?';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
