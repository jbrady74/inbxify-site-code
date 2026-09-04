// quill-home-v1.0.2.js
// ============================================================
// quill-home-v1.0.2.js
// INBXIFY — Quill platform home
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

    mount.innerHTML = shell(data, state);
    wire(mount, data, state);
    paintGroups(mount, data, state);

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
        '<span class="qh-vtag">v1.0.2</span>' +
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
            (live ? '<span class="qh-stat qh-stat--live">' + live + ' live</span>' : '') +
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
      '<span class="qh-tile-foot">' +
        '<span class="qh-st" data-qh-status="' + esc(t.status) + '">' + esc(label) + '</span>' +
      '</span>' +
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
