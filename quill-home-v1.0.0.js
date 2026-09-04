// quill-home-v1.0.0.js
// ============================================================
// quill-home-v1.0.0.js
// INBXIFY — Quill platform home
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
// KNOWN LIMIT — 100-ITEM COLLECTION LIST DOM CAP
// ──────────────────────────────────────────────────────────
// Webflow renders at most 100 items per Collection List into the
// DOM, separately from any storage limit. At 37 titles there is
// headroom. Past 100 titles, rows silently vanish — the same
// failure that hid 45 Business Categories from the Directory.
// countSourceRows() below detects the ceiling and paints a
// visible warning rather than under-reporting in silence.
// The documented upgrade is the paged Make webhook fetch already
// proven in the Asset Library at 119 articles.
//
// ALSO: set a SORT RULE on both Collection Lists in the Designer.
// An unsorted list at the cap drops arbitrary rows.
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

    // Webflow's per-list DOM render cap.
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

    var data = readSources();
    var state = { filter: 'all', term: '', shut: {} };

    // Publishers over the compact threshold start collapsed.
    data.publishers.forEach(function (p) {
      if (p.titles.length > CFG.compactThreshold) state.shut[p.id] = true;
    });

    mount.innerHTML = shell(data);
    wire(mount, data, state);
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
  // SHELL
  // ══════════════════════════════════════════════════════════
  function shell(data) {
    var warnings = [];

    if (data.pubCount >= CFG.domCap || data.titleCount >= CFG.domCap) {
      warnings.push(
        'A source list has hit Webflow\u2019s ' + CFG.domCap + '-item render cap. ' +
        'Rows beyond the cap are not in the DOM and are missing from this page. ' +
        'Move to the paged fetch before trusting these counts.'
      );
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
        '<span class="qh-vtag">v1.0.0</span>' +
      '</div>' +

      '<div class="qh-strip">' +
        '<span class="qh-strip-lbl">Network</span>' +
        '<span class="qh-strip-fig"><b>' + data.publishers.length + '</b> publisher' +
          (data.publishers.length === 1 ? '' : 's') + '</span>' +
        '<span class="qh-strip-fig"><b>' + data.titleTotal + '</b> title' +
          (data.titleTotal === 1 ? '' : 's') + '</span>' +
        '<span class="qh-strip-fig"><b>' + data.liveTotal + '</b> live</span>' +
        '<span class="qh-strip-sp"></span>' +
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

    var q = mount.querySelector('#qh-q');
    if (q) {
      q.addEventListener('input', function () {
        state.term = q.value.trim().toLowerCase();
        paintGroups(mount, data, state);
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════
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
