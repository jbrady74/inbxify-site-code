/* ============================================================
   ta-performance-v0.6.2.js
   INBXIFY — Performance tab (T-A)
   v0.4.0 (from v0.3.7):
     • Inline row expand REMOVED. Clicking a Reported row opens a
       FULL-SCREEN newsletter detail modal (M4): header band with
       status + Print + close, totals strip, By-source card
       (multiplier edit + report PDF link + GA4 seat), Content card.
     • Print: window.print() on the open modal; print stylesheet in
       the paired CSS renders it as a professional 1–2 pager. While
       the modal is open <body> carries .nlm-open so print CSS can
       isolate the modal from the rest of the T-A page.
     • Article titles resolved from the .articles-wrapper hidden
       list (slug → real name); fallback prettifies the slug and
       strips a trailing CMS hash token.
     • Esc closes the modal.
   Everything else (By advertiser, drill-in, report modal, house
   method, read path, webhooks) unchanged from v0.3.7.

   MEASUREMENT (house method — locked Jul 2026):
     reach(p) = Σ raw clicks(id ≥ p) / Σ raw clicks
     sawIt    = round(reach(topLinkId) × opens × HOUSE_FACTOR)
     Curve from RAW clicks; factor adjusts volume only.

   v0.5.0 (from v0.4.3):
     • BREAKING: nexstar-multiplier renamed nexstar-factor.
       CMS slug, DOM attr (data-nl-factor), webhook action
       (set-factor) and all JS identifiers move together.
     • Factor now scales BOTH opens and clicks (campaign totals and
       per-item). Sends stays as reported.
       Consequence: Open rate and CTR scale with the factor; CTOR is
       unchanged because the factor cancels in clicks/opens.
     • Raw values no longer surfaced. "Clicks raw" column dropped
       from the By-source table; adjusted values only.
     • Saw-it uses adjusted opens so it reconciles with the Opens
       shown above it. Curve itself still built from RAW clicks —
       a uniform factor cancels out of the ratio.
     • NEW Slug column in By-Newsletter table (carried from v0.4.4).
     • Table cardinal rules applied to By-Newsletter (v0.4.4).

   v0.5.1 (from v0.5.0):
     • Refresh control in the channel bar — serves both By newsletter
       and By advertiser, since that bar renders above each.
       Scenario 132 writes to Webflow with no way to notify the
       browser; this is the manual pull.
     • "Data as of <newest perf-updated-at>" beside it, so stale
       reads are visible rather than guessed at.
     • Click feedback per standing rule: disable + REFRESHING\u2026
       before the reload takes over.

   v0.5.2 (from v0.5.1):
     • Content table default sort is now Clicks desc, tie-broken by
       Saw-it. Was Saw-it desc, which ordered by issue position
       rather than by engagement.
     < MIN_CURVE_CLICKS total ⇒ Saw-it renders "—".

   HARDCODE LEDGER (this file):
     HC: MIN_CURVE_CLICKS = 50   (curve threshold — house rule)
     HC: HOUSE_FACTOR default 1.0 (global; never per-client)
     HC: PERF_SAVE_WEBHOOK / PERF_REPORT_WEBHOOK — Make URLs,
         empty until scenarios exist. Strict {ok:true} gate.

   Pairs with ta-performance-v0.4.3.css.
   Load AFTER title-admin-page-design + ix-modals + ix-buttons.
   ============================================================ */
(function () {
  'use strict';

  var MOUNT_ID = 'ta-perf-mount';
  var MIN_CURVE_CLICKS = 50;
  var HOUSE_FACTOR = 1.0;
  var PERF_SAVE_WEBHOOK = '';      // fallback only — prefer mount attr below
  var PERF_REPORT_WEBHOOK = '';
  var DEFAULT_SEND_TIME = '10:00 AM';   // HC — display default until saved

  // Webhook URLs are configured in Webflow on the mount div, so deploys
  // never require a JS edit:  <div id="ta-perf-mount"
  //   data-save-webhook="https://hook.us1.make.com/..."
  //   data-report-webhook="...">
  function saveWebhook() {
    var mt = document.getElementById(MOUNT_ID);
    return (mt && mt.dataset.saveWebhook) || PERF_SAVE_WEBHOOK;
  }
  function reportWebhook() {
    var mt = document.getElementById(MOUNT_ID);
    return (mt && mt.dataset.reportWebhook) || PERF_REPORT_WEBHOOK;
  }

  /* ── data ─────────────────────────────────────────────── */

  var NLS = [];
  var CUSTOMERS = {};
  var ARTICLES = {};   // slug -> name

  function readCustomers() {
    document.querySelectorAll('.customers-wrapper').forEach(function (el) {
      var d = el.dataset;
      if (d.id) CUSTOMERS[d.id] = { id: d.id, name: d.name || d.id };
    });
  }

  function readArticles() {
    document.querySelectorAll('.articles-wrapper').forEach(function (el) {
      var d = el.dataset;
      var slug = d.slug || d.articleSlug || '';
      var name = d.name || d.title || d.articleName || '';
      if (slug && name) ARTICLES[slug] = name;
    });
  }

  function parseDate(v) {
    if (!v) return null;
    var n = Number(v);
    if (!isNaN(n) && n > 1000000000) return new Date(n < 1e12 ? n * 1000 : n);
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  // Accept BOTH shapes: spec envelope ({v,sources:{...}}) and raw
  // single-report parser output pasted directly.
  function normalizeStats(j) {
    if (!j || typeof j !== 'object') return j;
    if (j.sources) return j;
    if (j.source === 'nexstar' && (j.links || j.items)) {
      return { v: 1, sources: { nexstar: [j] }, settings: { nexstarFactor: 1.0 } };
    }
    return j;
  }

  function readNewsletters() {
    NLS = [];
    var els = document.querySelectorAll('.newsletter-wrapper');
    if (!els.length) els = document.querySelectorAll('.perfnl-wrapper');
    els.forEach(function (el) {
      var d = el.dataset;
      if (!d.nlId && !d.id && !d.nlSlug) return;
      var stats = null;
      var jsonEl = el.querySelector('.perfnl-json, .perf-stats-json')
        || (el.parentElement && el.parentElement.querySelector('.perfnl-json, .perf-stats-json'));
      if (jsonEl) {
        var raw = (jsonEl.textContent || '').trim();
        if (raw) { try { stats = normalizeStats(JSON.parse(raw)); } catch (e) { stats = { _parseError: true }; } }
      }
      var issueRaw = d.nlIssueNo || d.issue || d.issueNumber || '';
      // Record-level settings fields (v0.4.2): nexstar-multiplier + send-time.
      // Record multiplier is authoritative over any stats.settings value.
      var recMult = parseFloat(d.nlFactor);
      if (stats && !stats._parseError && !isNaN(recMult) && recMult > 0) {
        stats.settings = stats.settings || {};
        stats.settings.nexstarFactor = recMult;
      }
      NLS.push({
        sendTime: (d.nlSendTime || '').trim(),
        id: d.nlId || d.id || d.nlSlug || '',
        slug: (d.nlSlug || d.slug || '').trim(),
        name: d.nlName || d.name || '',
        issue: issueRaw ? parseInt(issueRaw, 10) : null,
        date: parseDate(d.nlDate || d.date || d.publishDate),
        status: d.nlStatus || d.status || '',
        updated: parseDate(d.perfUpdated || d.updated), stats: stats
      });
    });
    NLS.sort(function (a, b) { return (b.date || 0) - (a.date || 0); });
  }

  /* ── math (house method) ──────────────────────────────── */

  function nexCampaigns(stats) {
    if (!stats || !stats.sources) return [];
    var n = stats.sources.nexstar;
    if (!n) return [];
    return Array.isArray(n) ? n : [n];
  }
  function mcCampaigns(stats) {
    var out = [];
    if (stats && stats.sources) {
      if (stats.sources.mcSend && stats.sources.mcSend.delivered) out.push({ label: 'Mailchimp \u00b7 send', c: stats.sources.mcSend });
      if (stats.sources.mcResend && stats.sources.mcResend.delivered) out.push({ label: 'Mailchimp \u00b7 resend', c: stats.sources.mcResend });
    }
    return out;
  }
  function factor(stats) {
    return (stats && stats.settings && typeof stats.settings.nexstarFactor === 'number')
      ? stats.settings.nexstarFactor : 1.0;
  }
  function nlTotals(stats) {
    var t = { sends: 0, opens: 0, clicks: 0, any: false };
    var m = factor(stats);
    nexCampaigns(stats).forEach(function (c) {
      // Factor scales opens AND clicks. Sends is contracted delivery — never scaled.
      t.sends += c.delivered || 0;
      t.opens += Math.round((c.opens || 0) * m);
      t.clicks += Math.round((c.clicksRaw || c.clicks || 0) * m); t.any = true;
    });
    mcCampaigns(stats).forEach(function (s) {
      t.sends += s.c.delivered || 0; t.opens += s.c.opens || 0;
      t.clicks += s.c.clicksRaw || 0; t.any = true;
    });
    if (t.any) {
      t.openRate = t.sends ? t.opens / t.sends : 0;
      t.ctr = t.sends ? t.clicks / t.sends : 0;
      t.ctor = t.opens ? t.clicks / t.opens : 0;
    }
    return t;
  }
  function curveFor(camp) {
    var links = camp.links || [];
    var total = 0; links.forEach(function (l) { total += l.clicks || 0; });
    if (total < MIN_CURVE_CLICKS) return null;
    return function (pos) {
      var atOrBelow = 0;
      links.forEach(function (l) { if (l.id >= pos) atOrBelow += l.clicks || 0; });
      return atOrBelow / total;
    };
  }
  // Adjusted clicks are ALLOCATED, not rounded per item: the campaign's
  // adjusted total (round(rawTotal × m)) is distributed across ALL items
  // proportionally by raw clicks, whole numbers via largest-remainder.
  // Guarantees Σ item adj == campaign adj total — columns always reconcile.
  function allocate(entries, adjTotal, rawTotal) {
    if (!rawTotal) return entries.map(function () { return 0; });
    var exact = entries.map(function (r) { return r * adjTotal / rawTotal; });
    var base = exact.map(Math.floor);
    var left = adjTotal - base.reduce(function (s, b) { return s + b; }, 0);
    var order = exact.map(function (x, i) { return { i: i, f: x - Math.floor(x) }; })
      .sort(function (a, b) { return b.f - a.f; });
    for (var k = 0; k < left; k++) base[order[k % order.length].i]++;
    return base;
  }

  function itemMetrics(stats) {
    var out = {};
    var m = factor(stats);
    nexCampaigns(stats).forEach(function (camp) {
      var curve = curveFor(camp);
      var items = camp.items || (stats.items || {});
      var keys = Object.keys(items);
      var raws = keys.map(function (k) { return items[k].clicks || 0; });
      var rawTotal = raws.reduce(function (s, r) { return s + r; }, 0);
      var adjTotal = Math.round(rawTotal * m);
      var alloc = allocate(raws, adjTotal, rawTotal);
      keys.forEach(function (k, idx) {
        var it = items[k];
        if (it.type === 'house') return;   // allocated (keeps totals honest) but not displayed
        var rec = out[k] || (out[k] = {
          key: k, type: it.type, customerId: it.customerId || '',
          slug: it.slug || '', utmContent: it.utmContent || '',
          clicksRaw: 0, clicks: 0, sawIt: 0, sawItKnown: false, topPos: null
        });
        rec.clicksRaw += raws[idx];
        rec.clicks += alloc[idx];
        var top = it.linkIds && it.linkIds.length ? Math.min.apply(null, it.linkIds) : null;
        if (top != null && (rec.topPos == null || top < rec.topPos)) rec.topPos = top;
        if (curve && top != null) {
          // adjusted opens, so Saw-it reconciles with the Opens displayed above
          rec.sawIt += Math.round(curve(top) * Math.round((camp.opens || 0) * m) * HOUSE_FACTOR);
          rec.sawItKnown = true;
        }
      });
    });
    return out;
  }

  /* ── formatting ───────────────────────────────────────── */

  function fmt(n) { return (n == null) ? '\u2014' : n.toLocaleString('en-US'); }
  function pct(x) { return (x == null) ? '\u2014' : (x * 100).toFixed(1) + '%'; }
  function dash(html) { return '<span class="perf-dash">' + (html || '\u2014') + '</span>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // MM/DD/YYYY from the report face. Parsed explicitly rather than via
  // Date.parse so it cannot be read as DD/MM in another locale.
  function parseBroadcast(v) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(v || '').trim());
    if (!m) return null;
    var d = new Date(+m[3], +m[1] - 1, +m[2]);
    return isNaN(d) ? null : d;
  }

  // Strictly the date the blast went out, per the report. No fallback —
  // the record's own printed date has its own column, and the two are
  // independent readings that legitimately differ.
  function sendDate(nl) {
    var camps = nl.stats ? nexCampaigns(nl.stats) : [];
    for (var i = 0; i < camps.length; i++) {
      var d = parseBroadcast(camps[i].broadcastDate);
      if (d) return d;
    }
    return null;
  }

  function dShort(d) { return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''; }
  function dLong(d) { return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }

  var TIPS = {
    opens: 'Reported by Nexstar and Mailchimp. Not adjusted.',
    clicks: 'Nexstar (\u00d7 your factor) + Mailchimp send + resend. Sources shown in the detail view.',
    sawit: 'Estimate: this send\u2019s own scroll curve (clicks at-or-below the item\u2019s position \u00f7 total clicks) \u00d7 opens \u00d7 house factor. Not a measurement.',
    onsite: 'GA4, inbxify.com. Articles: pageviews of the article. Ads and events: times displayed on site pages. Arrives v1.1.',
    site: 'GA4: web-version pageviews of this issue + average engagement time. Arrives v1.1.',
    advclicks: 'All sources, factor applied, summed across ingested issues.',
    advsawit: 'Sum of per-issue estimates \u2014 each issue\u2019s own scroll curve \u00d7 its opens. Not a measurement.',
    pos: 'Topmost link position in that issue. Drives the Saw-it estimate.'
  };
  function iCircle(tip) { return '<span class="perf-i">i<span class="tip">' + esc(tip) + '</span></span>'; }

  var TYPE_LABEL = { article: 'Article', ad: '', find: 'The Find', event: 'Event', realestate: 'RE', external: 'Link', other: '' };

  function articleTitle(rec) {
    if (rec.slug && ARTICLES[rec.slug]) return ARTICLES[rec.slug];
    if (rec.slug) {
      // prettify slug; drop a trailing CMS hash token (e.g. "…-6c3eb")
      var words = rec.slug.split('-');
      if (words.length > 1 && /^[0-9a-f]{4,8}$/.test(words[words.length - 1])) words.pop();
      return words.join(' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); });
    }
    return rec.utmContent || rec.key;
  }

  // The pill is the SLOT when the link carries one — utm_content holds
  // FA-1 / TS-1 / BA-2 / RE-3 across every type. The generic type label
  // is only a fallback for links with no slot code.
  function slotPill(rec) {
    var slot = (rec.utmContent || '').trim();
    if (slot) return slot;
    if (rec.type === 'find') return 'FIND';
    if (rec.type === 'ad') return 'AD';
    return TYPE_LABEL[rec.type] || '';
  }

  function itemLabel(rec) {
    var pill = slotPill(rec);
    var tag = pill ? '<span class="perf-type">' + esc(pill) + '</span>' : '';
    if (rec.type === 'ad' || rec.type === 'find') {
      var c = CUSTOMERS[rec.customerId];
      var name = c ? c.name : (rec.customerId ? rec.customerId.slice(0, 8) + '\u2026' : 'Unknown');
      return '<span class="perf-cust" data-perf-cust="' + esc(rec.customerId) + '">' + esc(name) + '</span>' + tag;
    }
    return esc(articleTitle(rec)) + tag;
  }

  /* ── NEWSLETTER DETAIL MODAL (v0.4.0) ─────────────────── */

  var TITLE_NAME = '';
  function titleName() {
    if (TITLE_NAME) return TITLE_NAME;
    var el = document.querySelector('[data-perf-title-name]');
    TITLE_NAME = (el && el.textContent.trim()) || '';
    return TITLE_NAME;
  }

  function sourceRows(nl) {
    var s = nl.stats, m = factor(s), rows = '';
    nexCampaigns(s).forEach(function (c, i) {
      var raw = c.clicksRaw || c.clicks || 0;
      var suffix = c.campaign || c.campaignSuffix || String.fromCharCode(65 + i);
      var rep = c.report || {};
      var link = rep.driveFileId
        ? '<a class="nlm-report-link" target="_blank" rel="noopener" href="https://drive.google.com/file/d/' + esc(rep.driveFileId) + '/view">' + esc(rep.fileName || 'report') + ' \u2197</a>'
        : dash(esc(rep.fileName || ''));
      rows += '<tr><td class="nlm-lbl">Nexstar \u00b7 ' + esc(suffix) + '</td>'
        + '<td class="num">' + fmt(c.delivered) + '</td>'
        + '<td class="num"><strong data-perf-opens-adj>' + fmt(Math.round((c.opens || 0) * m)) + '</strong></td>'
        + '<td class="num nlm-multcell">\u00d7 <input class="perf-mult" data-perf-mult value="' + m.toFixed(2) + '" data-orig="' + m.toFixed(2) + '"></td>'
        + '<td class="num"><strong data-perf-adj>' + fmt(Math.round(raw * m)) + '</strong><span data-perf-multactions></span></td>'
        + '<td class="num">' + link + '</td></tr>';
    });
    mcCampaigns(s).forEach(function (x) {
      rows += '<tr><td class="nlm-lbl">' + esc(x.label) + '</td>'
        + '<td class="num">' + fmt(x.c.delivered) + '</td><td class="num">' + fmt(x.c.opens) + '</td>'
        + '<td class="num"></td><td class="num">' + fmt(x.c.clicksRaw) + '</td><td class="num"></td></tr>';
    });
    if (!mcCampaigns(s).length) {
      rows += '<tr><td class="nlm-lbl">Mailchimp \u00b7 send</td><td class="num perf-dash" colspan="4">\u2014</td><td class="num">' + dash('not ingested') + '</td></tr>'
        + '<tr><td class="nlm-lbl">Mailchimp \u00b7 resend</td><td class="num perf-dash" colspan="4">\u2014</td><td class="num">' + dash('not ingested') + '</td></tr>';
    }
    rows += '<tr><td class="nlm-lbl">Site ' + iCircle(TIPS.site) + '</td>'
      + '<td class="num perf-dash" colspan="2">\u2014 pageviews</td>'
      + '<td class="num perf-dash" colspan="2">\u2014 avg engagement</td>'
      + '<td class="num">' + dash('GA4 \u00b7 v1.1') + '</td></tr>';
    return rows;
  }

  function contentRows(nl) {
    var items = itemMetrics(nl.stats);
    // Clicks desc is the default — measured engagement leads. Saw-it only
    // breaks ties, since it is a position-derived estimate and sorting on it
    // reproduces issue order rather than performance.
    var keys = Object.keys(items).sort(function (a, b) { return (items[b].clicks - items[a].clicks) || (items[b].sawIt - items[a].sawIt); });
    if (!keys.length) return '<tr><td colspan="4">' + dash('no per-item data') + '</td></tr>';
    return keys.map(function (k) {
      var r = items[k];
      return '<tr><td>' + itemLabel(r) + '</td>'
        + '<td class="num">' + fmt(r.clicks) + '</td>'
        + '<td class="num">' + (r.sawItKnown ? '<span class="perf-est">' + fmt(r.sawIt) + '</span>' : dash()) + '</td>'
        + '<td class="num">' + dash() + '</td></tr>';
    }).join('');
  }

  function openNlModal(nl) {
    closeNlModal();
    var t = nlTotals(nl.stats);
    var bcast = '';
    var nc = nexCampaigns(nl.stats);
    if (nc.length && nc[0].broadcastDate) bcast = ' \u00b7 Nexstar broadcast ' + esc(nc[0].broadcastDate);
    var overlay = document.createElement('div');
    overlay.className = 'ix-overlay nlm-overlay';
    setTimeout(function () { wireSort(overlay); }, 0);
    overlay.innerHTML =
      '<div class="nlmodal">'
      + '<div class="nlmodal-bar"></div>'
      + '<div class="nlmodal-head">'
      + '<div><div class="nlmodal-eyebrow">' + esc(titleName()) + (titleName() ? ' \u00b7 ' : '') + 'NEWSLETTER PERFORMANCE</div>'
      + '<div class="nlmodal-title">' + esc(nl.name || ('#' + nl.issue)) + '</div>'
      + '<div class="nlmodal-date">Sent ' + esc(dLong(nl.date))
      + ' \u00b7 <input class="nlm-sendtime" data-perf-sendtime value="' + esc(nl.sendTime || DEFAULT_SEND_TIME) + '" data-orig="' + esc(nl.sendTime || DEFAULT_SEND_TIME) + '"><span data-perf-sendtime-actions></span>'
      + bcast
      + (nl.updated ? ' \u00b7 data updated ' + esc(dShort(nl.updated)) : '') + '</div></div>'
      + '<div class="nlmodal-spacer"></div>'
      + '<span class="nlmodal-status">Reported</span>'
      + '<button class="nlmodal-print" data-nlm-print>\ud83d\udda8 Print</button>'
      + '<button class="nlmodal-close" data-nlm-close>\u2715</button>'
      + '</div>'
      + '<div class="nlmodal-body"><div class="nlmodal-inner">'
      + '<div class="nlm-totals">'
      + nlmTot('Sends', fmt(t.sends)) + nlmTot('Opens', fmt(t.opens)) + nlmTot('Open rate', pct(t.openRate))
      + nlmTot('Clicks', fmt(t.clicks)) + nlmTot('CTR', pct(t.ctr)) + nlmTot('CTOR', pct(t.ctor))
      + '</div>'
      + '<div class="nlm-card"><h4>By source</h4><table>'
      + '<tr><th>Source</th><th class="num">Delivered</th><th class="num">Opens</th><th class="num">Factor</th><th class="num">Clicks</th><th class="num">Report</th></tr>'
      + sourceRows(nl)
      + '</table><div class="nlm-meta">Factor scales Nexstar opens and clicks \u00b7 sends as reported \u00b7 CTOR unaffected</div></div>'
      + '<div class="nlm-card nlm-content-card"><h4>Content</h4><table>'
      + '<tr><th>Item</th><th class="num">Clicks</th><th class="num">Views (est.) ' + iCircle(TIPS.sawit) + '</th><th class="num">On site ' + iCircle(TIPS.onsite) + '</th></tr>'
      + contentRows(nl)
      + '</table><div class="nlm-meta">Saw-it: this send\u2019s own scroll curve \u00d7 opens \u00b7 always est. \u00b7 never summed with On-site</div></div>'
      + '<div class="nlm-printfoot"><span>' + esc(titleName()) + ' \u00b7 ' + esc(nl.name || '') + ' \u00b7 NEWSLETTER PERFORMANCE</span>'
      + '<span>Generated ' + esc(dLong(new Date())) + ' \u00b7 INBXIFY</span></div>'
      + '</div></div></div>';
    document.body.appendChild(overlay);
    document.body.classList.add('nlm-open');
    wireMultiplier(overlay, nl);
    wireSendTime(overlay, nl);
    overlay.addEventListener('click', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-nlm-close')) closeNlModal();
      if (e.target.hasAttribute && e.target.hasAttribute('data-nlm-print')) window.print();
      var cust = e.target.closest && e.target.closest('[data-perf-cust]');
      if (cust && cust.getAttribute('data-perf-cust')) {
        closeNlModal();
        STATE.channel = 'adv'; STATE.drill = cust.getAttribute('data-perf-cust'); render();
      }
    });
    function nlmTot(l, v) { return '<div class="nlm-total"><div class="l">' + l + '</div><div class="v">' + v + '</div></div>'; }
  }

  function closeNlModal() {
    var m = document.querySelector('.nlm-overlay');
    if (m) m.remove();
    document.body.classList.remove('nlm-open');
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNlModal();
  });

  /* ── multiplier edit (canonical dirty pattern) ────────── */

  function wireMultiplier(root, nl) {
    root.querySelectorAll('[data-perf-mult]').forEach(function (input) {
      var actions = root.querySelector('[data-perf-multactions]');
      function setDirty(on) {
        input.classList.toggle('ipp-dirty', on);
        if (!actions) return;
        actions.innerHTML = on
          ? '<button class="perf-save" data-perf-save>Save</button><span class="ipp-cancel-link" data-perf-cancel>cancel</span>'
          : '';
      }
      input.addEventListener('input', function () {
        var v = parseFloat(input.value);
        setDirty(input.value !== input.getAttribute('data-orig'));
        if (!isNaN(v)) {
          var adj = root.querySelector('[data-perf-adj]');
          var opAdj = root.querySelector('[data-perf-opens-adj]');
          var raw = 0, rawOpens = 0;
          nexCampaigns(nl.stats).forEach(function (c) {
            raw += c.clicksRaw || c.clicks || 0;
            rawOpens += c.opens || 0;
          });
          if (adj) adj.textContent = fmt(Math.round(raw * v));
          if (opAdj) opAdj.textContent = fmt(Math.round(rawOpens * v));
        }
      });
      root.addEventListener('click', function (e) {
        if (e.target.hasAttribute && e.target.hasAttribute('data-perf-cancel')) {
          input.value = input.getAttribute('data-orig');
          input.dispatchEvent(new Event('input'));
          setDirty(false);
        }
        if (e.target.hasAttribute && e.target.hasAttribute('data-perf-save')) {
          saveMultiplier(nl, parseFloat(input.value), e.target, function (ok) {
            if (ok) { render(); openNlModal(nl); }
          });
        }
      });
    });
  }

  function wireSendTime(root, nl) {
    var input = root.querySelector('[data-perf-sendtime]');
    if (!input) return;
    var actions = root.querySelector('[data-perf-sendtime-actions]');
    function setDirty(on) {
      input.classList.toggle('ipp-dirty', on);
      if (actions) actions.innerHTML = on
        ? '<button class="perf-save" data-perf-st-save>Save</button><span class="ipp-cancel-link" data-perf-st-cancel>cancel</span>'
        : '';
    }
    input.addEventListener('input', function () {
      setDirty(input.value !== input.getAttribute('data-orig'));
    });
    root.addEventListener('click', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-perf-st-cancel')) {
        input.value = input.getAttribute('data-orig'); setDirty(false);
      }
      if (e.target.hasAttribute && e.target.hasAttribute('data-perf-st-save')) {
        var v = input.value.trim();
        if (!/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(v)) { alert('Use a time like 10:00 AM'); return; }
        saveSetting(nl, 'set-send-time', v, e.target, function (ok) {
          if (ok) { nl.sendTime = v; input.setAttribute('data-orig', v); setDirty(false); }
        });
      }
    });
  }

  function saveSetting(nl, action, value, btn, done) {
    var url = saveWebhook();
    if (!url) {
      alert('Applied for this session. Save webhook not configured yet \u2014 value will not persist.');
      return done(true);
    }
    var orig = btn.textContent;
    btn.disabled = true; btn.textContent = 'SAVING\u2026';
    fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action, newsletterId: nl.id, value: value })
    }).then(function (r) { return r.json(); }).then(function (j) {
      // STRICT success: body {ok:true} only — never bare res.ok (standing rule)
      if (j && j.ok === true) { done(true); }
      else { alert('Save failed \u2014 scenario did not confirm.'); btn.disabled = false; btn.textContent = orig; done(false); }
    }).catch(function () { alert('Save failed \u2014 network.'); btn.disabled = false; btn.textContent = orig; done(false); });
  }

  function saveMultiplier(nl, value, btn, done) {
    if (isNaN(value) || value <= 0) { alert('Factor must be a positive number.'); return done(false); }
    if (!saveWebhook()) {
      nl.stats.settings = nl.stats.settings || {};
      nl.stats.settings.nexstarFactor = value;
      alert('Applied for this session. Save webhook not configured yet \u2014 value will not persist.');
      return done(true);
    }
    saveSetting(nl, 'set-factor', value, btn, function (ok) {
      if (ok) {
        nl.stats.settings = nl.stats.settings || {};
        nl.stats.settings.nexstarFactor = value;
      }
      done(ok);
    });
  }

  /* ── report modal (unchanged from v0.3.x) ─────────────── */

  function openReportModal(custId) {
    var name = (CUSTOMERS[custId] || {}).name || custId;
    var overlay = document.createElement('div');
    overlay.className = 'ix-overlay';
    overlay.innerHTML =
      '<div class="ix-modal" style="max-width:560px">'
      + '<div class="ix-modal-bar"></div>'
      + '<div class="ix-modal-head"><div>'
      + '<h3 class="ix-modal-title">Generate advertiser report</h3>'
      + '<div class="ix-modal-sub">' + esc(name) + '</div></div>'
      + '<span class="ix-modal-x" data-perf-modalx>\u2715</span></div>'
      + '<div class="ix-modal-body">'
      + '<div class="perf-frow"><label class="perf-flabel">Period</label>'
      + '<select class="perf-fselect" data-perf-period>'
      + '<option value="3m" selected>Last 3 months</option><option value="1m">Last month</option>'
      + '<option value="6m">Last 6 months</option><option value="ytd">Year to date</option>'
      + '<option value="all">All time</option></select></div>'
      + '<div class="perf-frow"><label class="perf-flabel">Include</label>'
      + '<div class="perf-fincl">'
      + '<label><input type="checkbox" checked data-inc="banners"> Banner placements</label>'
      + '<label><input type="checkbox" checked data-inc="articles"> Articles</label>'
      + '<label><input type="checkbox" checked data-inc="events"> Events sponsorships</label>'
      + '</div><div class="perf-fhint">Sections render only if content exists in the period.</div></div>'
      + '</div>'
      + '<div class="ix-modal-footer">'
      + '<span class="ix-modal-footer-info">PDF saves to the customer record + downloads here</span>'
      + '<div class="ix-modal-footer-right">'
      + '<button class="perf-btnghost" data-perf-modalx>Cancel</button>'
      + '<button class="perf-btnprimary" data-perf-genfire>Generate PDF</button>'
      + '</div></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.hasAttribute('data-perf-modalx')) overlay.remove();
      if (e.target.hasAttribute('data-perf-genfire')) {
        if (!reportWebhook()) {
          alert('Report pipeline not built yet \u2014 parameters captured, scenario pending.');
          return;
        }
        var btn = e.target; btn.disabled = true; btn.textContent = 'GENERATING\u2026';
        fetch(reportWebhook(), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate-report', customerId: custId,
            period: overlay.querySelector('[data-perf-period]').value,
            include: Array.prototype.map.call(overlay.querySelectorAll('[data-inc]:checked'),
              function (c) { return c.getAttribute('data-inc'); })
          })
        }).then(function (r) { return r.json(); }).then(function (j) {
          if (j && j.ok === true && j.fileUrl) { window.open(j.fileUrl, '_blank'); overlay.remove(); }
          else { alert('Generation failed \u2014 scenario did not confirm.'); btn.disabled = false; btn.textContent = 'Generate PDF'; }
        }).catch(function () { alert('Generation failed \u2014 network.'); btn.disabled = false; btn.textContent = 'Generate PDF'; });
      }
    });
  }

  /* ── by newsletter table (rows only — no expand) ──────── */

  function rowNl(nl, idx) {
    var t = nl.stats ? nlTotals(nl.stats) : { any: false };
    var wait = !t.any;
    var status;
    if (nl.stats && nl.stats._parseError) {
      status = '<span class="perf-status perf-status--err">JSON invalid</span>';
    } else if (nl.stats && !t.any) {
      status = '<span class="perf-status perf-status--err">JSON shape?</span>';
    } else {
      status = wait
        ? '<span class="perf-status perf-status--wait">Awaiting data</span>'
        : '<span class="perf-status perf-status--live">Reported</span>';
    }
    // date lives in its own column as of v0.6.1 — no duplication here
    var label = esc(nl.name || (nl.issue != null ? '#' + nl.issue : nl.id));
    var sd = sendDate(nl);
    var nlCell = nl.date ? esc(dShort(nl.date)) : dash();
    var sdCell = sd ? esc(dShort(sd)) : dash();
    return '<tr class="perf-row' + (wait ? ' perf-row--wait' : '') + '" data-perf-nl="' + idx + '">'
      + '<td><span class="perf-chev">\u25b6</span></td>'
      + '<td>' + (wait ? label : '<strong>' + label + '</strong>') + '</td>'
      + '<td class="perf-slug-cell" title="' + esc(nl.slug || '') + '">'
      + (nl.slug ? esc(nl.slug) : dash()) + '</td>'
      + '<td class="perf-datecell">' + nlCell + '</td>'
      + '<td class="perf-datecell">' + sdCell + '</td>'
      + '<td>' + status + '</td>'
      + '<td class="perf-sendtime-cell">' + esc(nl.sendTime || DEFAULT_SEND_TIME) + '</td>'
      + '<td class="num">' + (wait ? dash() : fmt(t.sends)) + '</td>'
      + '<td class="num">' + (wait ? dash() : fmt(t.opens)) + '</td>'
      + '<td class="num">' + (wait ? dash() : pct(t.openRate)) + '</td>'
      + '<td class="num">' + (wait ? dash() : fmt(t.clicks)) + '</td>'
      + '<td class="num">' + (wait ? dash() : pct(t.ctr)) + '</td>'
      + '<td class="num">' + (wait ? dash() : pct(t.ctor)) + '</td>'
      + '</tr>';
  }

  /* ── by advertiser + drill-in (unchanged) ─────────────── */

  function advIndex() {
    var by = {};
    NLS.forEach(function (nl) {
      if (!nl.stats) return;
      var items = itemMetrics(nl.stats);
      Object.keys(items).forEach(function (k) {
        var r = items[k];
        if ((r.type !== 'ad' && r.type !== 'find') || !r.customerId) return;
        var a = by[r.customerId] || (by[r.customerId] = {
          id: r.customerId, name: (CUSTOMERS[r.customerId] || {}).name || r.customerId.slice(0, 8) + '\u2026',
          issues: {}, clicks: 0, sawIt: 0, sawItKnown: false, slots: {}, lastDate: null, rows: []
        });
        a.issues[nl.id] = 1;
        a.clicks += r.clicks;
        if (r.sawItKnown) { a.sawIt += r.sawIt; a.sawItKnown = true; }
        a.slots[r.type === 'find' ? 'FIND' : 'BA'] = 1;
        if (nl.date && (!a.lastDate || nl.date > a.lastDate)) a.lastDate = nl.date;
        a.rows.push({ nl: nl, item: r });
      });
    });
    return Object.keys(by).map(function (k) { return by[k]; })
      .sort(function (x, y) { return y.sawIt - x.sawIt || y.clicks - x.clicks; });
  }


  // ── STANDING RULE: every table header sorts ───────────────────────────
  // Sorts the rendered DOM rather than the source arrays: the tables are
  // built as HTML strings from several different shapes, and one DOM sorter
  // covers all of them — tab views, drill-ins and modals alike.
  function cellSortValue(td) {
    if (!td) return { t: 'e', v: 0 };
    var raw = (td.textContent || '').replace(/\s+/g, ' ').trim();
    if (!raw || raw === '\u2014' || raw === '-') return { t: 'e', v: 0 };   // always last
    var num = raw.replace(/[,%$]/g, '').replace(/\best\.?/i, '').trim();
    if (num !== '' && /^-?\d*\.?\d+$/.test(num)) return { t: 'n', v: parseFloat(num) };
    var d = Date.parse(raw);
    if (!isNaN(d) && /\d/.test(raw) && /[A-Za-z]{3}|\//.test(raw)) return { t: 'n', v: d };
    return { t: 's', v: raw.toLowerCase() };
  }

  function sortTable(table, idx, dir) {
    var tbody = table.tBodies[0];
    if (!tbody) return;
    var rows = [].slice.call(tbody.rows);
    if (rows.length < 2) return;
    rows.forEach(function (r, i) { r._i = i; });          // stable tiebreak
    rows.sort(function (a, b) {
      var x = cellSortValue(a.cells[idx]), y = cellSortValue(b.cells[idx]);
      if (x.t === 'e' && y.t === 'e') return a._i - b._i;
      if (x.t === 'e') return 1;                           // blanks sink, both ways
      if (y.t === 'e') return -1;
      var c = (x.t === 'n' && y.t === 'n') ? (x.v - y.v)
            : String(x.v) < String(y.v) ? -1 : String(x.v) > String(y.v) ? 1 : 0;
      return (c === 0) ? (a._i - b._i) : c * dir;
    });
    rows.forEach(function (r) { tbody.appendChild(r); });
  }

  function wireSort(scope) {
    if (!scope) return;
    [].slice.call(scope.querySelectorAll('table')).forEach(function (table) {
      var head = table.tHead;
      if (!head || head.dataset.sortWired) return;
      head.dataset.sortWired = '1';
      [].slice.call(head.rows[0] ? head.rows[0].cells : []).forEach(function (th, idx) {
        if (!(th.textContent || '').trim()) return;        // chevron/spacer column
        th.classList.add('perf-sortable');
        th.addEventListener('click', function (e) {
          // the info tooltip lives inside the th; clicking it must not sort
          if (e.target.closest && e.target.closest('.perf-i')) return;
          var dir = th.classList.contains('perf-sort-asc') ? -1 : 1;
          [].slice.call(head.rows[0].cells).forEach(function (o) {
            o.classList.remove('perf-sort-asc', 'perf-sort-desc');
          });
          th.classList.add(dir === 1 ? 'perf-sort-asc' : 'perf-sort-desc');
          sortTable(table, idx, dir);
        });
      });
    });
  }

  function viewAdv() {
    var list = advIndex();
    var rows = list.map(function (a) {
      return '<tr class="perf-row" data-perf-cust="' + esc(a.id) + '">'
        + '<td><strong>' + esc(a.name) + '</strong></td>'
        + '<td class="num">' + Object.keys(a.issues).length + '</td>'
        + '<td class="num">' + fmt(a.clicks) + '</td>'
        + '<td class="num">' + (a.sawItKnown ? '<span class="perf-est">' + fmt(a.sawIt) + '</span>' : dash()) + '</td>'
        + '<td class="num">' + (a.lastDate ? dShort(a.lastDate) : dash()) + '</td></tr>';
    }).join('');
    var ingested = NLS.filter(function (n) { return n.stats; }).length;
    return '<div class="ta-perf__card perf-adv-card"><table>'
      + '<thead><tr><th>Advertiser</th><th class="num">Issues</th>'
      + '<th class="num">Clicks ' + iCircle(TIPS.advclicks) + '</th>'
      + '<th class="num">Views (est.) ' + iCircle(TIPS.advsawit) + '</th>'
      + '<th class="num">Last ran</th></tr></thead><tbody>'
      + (rows || '<tr><td colspan="5">' + dash('no ingested issues yet \u2014 drop a report in the folder') + '</td></tr>')
      + '</tbody></table>'
      + '<div class="perf-meta">Rows drill in \u00b7 sums cover ingested issues only (' + ingested + ' of ' + NLS.length + ')</div></div>';
  }

  function viewDrill(custId) {
    var a = advIndex().filter(function (x) { return x.id === custId; })[0];
    var name = (CUSTOMERS[custId] || {}).name || custId;
    var issueRows = '';
    if (a) {
      a.rows.sort(function (x, y) { return (y.nl.date || 0) - (x.nl.date || 0); });
      issueRows = a.rows.map(function (row) {
        var r = row.item, nl = row.nl;
        var linkTotal = 0;
        nexCampaigns(nl.stats).forEach(function (c) { (c.links || []).forEach(function () { linkTotal++; }); });
        return '<tr><td class="num">' + esc(nl.name || (nl.issue != null ? '#' + nl.issue : nl.id)) + '</td>'
          + '<td>' + dShort(nl.date) + '</td>'
          + '<td><span class="perf-type">' + esc(r.utmContent || 'BA') + '</span></td>'
          + '<td class="num">' + (r.topPos != null ? r.topPos + (linkTotal ? ' / ' + linkTotal : '') : dash()) + '</td>'
          + '<td class="num">' + fmt(r.clicks) + '</td>'
          + '<td class="num">' + (r.sawItKnown ? '<span class="perf-est">' + fmt(r.sawIt) + '</span>' : dash()) + '</td>'
          + '<td class="num">' + dash() + '</td></tr>';
      }).join('');
    }
    return '<span class="perf-back" data-perf-back>\u2190 All advertisers</span>'
      + '<div class="perf-cust-head"><span class="perf-cust-name">' + esc(name) + '</span>'
      + '<span class="perf-genreport" data-perf-genreport="' + esc(custId) + '">Generate report</span></div>'
      + '<div class="perf-totals">'
      + tot('Issues ran', a ? Object.keys(a.issues).length : 0)
      + tot('Placements', a ? a.rows.length : 0)
      + tot('Clicks', a ? fmt(a.clicks) : '\u2014')
      + tot('Views', a && a.sawItKnown ? fmt(a.sawIt) + '<span class="est">est.</span>' : '\u2014')
      + tot('On site', '\u2014')
      + '</div>'
      + '<div class="ta-perf__card perf-drill-card"><table>'
      + '<thead><tr><th class="num">Issue</th><th>Date</th><th>Slot</th>'
      + '<th class="num">Position ' + iCircle(TIPS.pos) + '</th>'
      + '<th class="num">Clicks</th><th class="num">Views (est.)</th><th class="num">On site</th></tr></thead>'
      + '<tbody>' + (issueRows || '<tr><td colspan="7">' + dash('no ingested placements') + '</td></tr>') + '</tbody></table>'
      + '<div class="perf-meta">Skeleton of the future advertiser report \u00b7 Saw-it always est., never summed with On-site</div></div>';
    function tot(l, v) { return '<div class="perf-total"><div class="l">' + l + '</div><div class="v">' + v + '</div></div>'; }
  }

  /* ── shell + routing ──────────────────────────────────── */

  // STANDING RULE: refresh returns the user to the view they were on.
  // sessionStorage survives a reload and dies with the tab, which is the
  // right lifetime — it should not persist across a fresh visit.
  var CH_KEY  = 'ix-perf-channel';
  var TAB_KEY = 'ix-perf-wtab';

  // Webflow's native tabs reset to their default pane on reload. Capture
  // whichever top-level tab is current, then re-click it after Webflow has
  // wired its own handlers. The key is read from the DOM, never hardcoded.
  function currentWTab() {
    var el = document.querySelector('[data-w-tab].w--current');
    return el ? (el.getAttribute('data-w-tab') || '') : '';
  }

  function tabLog() {
    if (window.IX_PERF_TABDEBUG) console.log.apply(console, ['[ta-perf tab]'].concat([].slice.call(arguments)));
  }

  function restoreWTab() {
    var key;
    try { key = sessionStorage.getItem(TAB_KEY); } catch (e) { return; }
    if (!key) return;
    try { sessionStorage.removeItem(TAB_KEY); } catch (e) { /* non-fatal */ }
    tabLog('restoring', key, 'current is', currentWTab());
    if (currentWTab() === key) return;

    // Webflow binds its tab handlers on its own schedule. A single deferred
    // click can land before that wiring exists, so retry on a backoff and
    // stop as soon as the tab actually becomes current.
    var delays = [0, 60, 150, 350, 700, 1200, 2500], i = 0;
    (function attempt() {
      if (i >= delays.length) { tabLog('gave up after', delays.length, 'attempts'); return; }
      var wait = delays[i++];
      setTimeout(function () {
        if (currentWTab() === key) { tabLog('landed on', key); return; }
        var link = document.querySelector('[data-w-tab="' + key + '"].w-tab-link')
                || document.querySelector('a[data-w-tab="' + key + '"]')
                || document.querySelector('[data-w-tab="' + key + '"]');
        tabLog('attempt', i, 'wait', wait, 'link found:', !!link);
        if (link && link.click) link.click();
        attempt();
      }, wait);
    })();
  }

  function savedChannel() {
    try {
      var v = sessionStorage.getItem(CH_KEY);
      return (v === 'nl' || v === 'adv') ? v : 'nl';
    } catch (e) { return 'nl'; }   // private mode / storage disabled
  }

  function rememberChannel(v) {
    try { sessionStorage.setItem(CH_KEY, v); } catch (e) { /* non-fatal */ }
  }

  var STATE = { channel: savedChannel(), drill: null };

  function freshest() {
    var best = null;
    NLS.forEach(function (nl) {
      if (!nl.updated) return;
      var d = new Date(nl.updated);
      if (isNaN(d)) return;
      if (!best || d > best) best = d;
    });
    return best;
  }

  function shellHTML() {
    return '<div class="ta-perf" id="ta-perf">'
      + '<div class="ta-perf__head"><div class="ta-perf__eyebrow" data-perf-title-name></div>'
      + '<div class="ta-perf__title">Performance</div></div>'
      + '<div class="ix-channels ta-perf__channels" role="tablist">'
      + '<button class="ix-channel" data-perf-channel="nl">By newsletter</button>'
      + '<button class="ix-channel" data-perf-channel="adv">By advertiser</button>'
      + '<div class="ix-channel-spacer"></div>'
      + '<span class="perf-asof" data-perf-asof></span>'
      + '<button class="perf-refresh" data-perf-refresh title="Re-read the page after an ingest run">\u21bb Refresh</button>'
      + '</div>'
      + '<div data-perf-view></div></div>';
  }

  function render() {
    var root = document.getElementById('ta-perf');
    if (!root) return;
    root.querySelectorAll('[data-perf-channel]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-perf-channel') === STATE.channel);
    });
    var asof = root.querySelector('[data-perf-asof]');
    if (asof) {
      var f = freshest();
      asof.textContent = f ? 'Data as of ' + dShort(f) : 'No data ingested yet';
    }
    var view = root.querySelector('[data-perf-view]');
    setTimeout(function () { wireSort(root); }, 0);
    if (STATE.channel === 'adv') {
      view.innerHTML = STATE.drill ? viewDrill(STATE.drill) : viewAdv();
      return;
    }
    view.innerHTML = '<div class="ta-perf__card perf-nl-card"><table>'
      + '<thead><tr><th style="width:26px"></th><th>Newsletter</th><th>Slug</th>'
      + '<th>NL date</th><th>Send date</th><th>Status</th><th>Send time</th>'
      + '<th class="num">Sends</th><th class="num">Opens ' + iCircle(TIPS.opens) + '</th>'
      + '<th class="num">Open rate</th><th class="num">Clicks ' + iCircle(TIPS.clicks) + '</th>'
      + '<th class="num">CTR</th><th class="num">CTOR</th></tr></thead><tbody>'
      + (NLS.map(rowNl).join('') || '<tr><td colspan="13">' + dash('no newsletters found \u2014 is the newsletter-wrapper list on the page?') + '</td></tr>')
      + '</tbody></table></div>';
  }

  function wire(root) {
    root.addEventListener('click', function (e) {
      var rf = e.target.closest && e.target.closest('[data-perf-refresh]');
      if (rf) {
        // Webflow publish propagates to the CDN on a lag; a reload within a few
        // seconds of an ingest run can still serve the previous build.
        rf.disabled = true; rf.textContent = 'REFRESHING\u2026';
        rememberChannel(STATE.channel);   // survive the reload
        var wtab = currentWTab();
        tabLog('saving', wtab);
        try { sessionStorage.setItem(TAB_KEY, wtab); } catch (e) { /* non-fatal */ }
        location.reload();
        return;
      }
      var chan = e.target.closest && e.target.closest('[data-perf-channel]');
      if (chan) {
        STATE.channel = chan.getAttribute('data-perf-channel');
        rememberChannel(STATE.channel);
        STATE.drill = null; render(); return;
      }
      if (e.target.closest && e.target.closest('[data-perf-back]')) { STATE.drill = null; render(); return; }
      var gen = e.target.closest && e.target.closest('[data-perf-genreport]');
      if (gen) { openReportModal(gen.getAttribute('data-perf-genreport')); return; }
      var cust = e.target.closest && e.target.closest('[data-perf-cust]');
      if (cust && cust.getAttribute('data-perf-cust')) {
        STATE.channel = 'adv'; STATE.drill = cust.getAttribute('data-perf-cust'); render(); return;
      }
      var row = e.target.closest && e.target.closest('[data-perf-nl]');
      if (row && !e.target.closest('input,button,a')) {
        var i = parseInt(row.getAttribute('data-perf-nl'), 10);
        if (!NLS[i] || !NLS[i].stats || NLS[i].stats._parseError) return;
        var t = nlTotals(NLS[i].stats);
        if (!t.any) return;
        openNlModal(NLS[i]);
      }
    });
  }

  function init() {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) return;
    if (document.getElementById('ta-perf')) return;
    readCustomers();
    readArticles();
    readNewsletters();
    mount.innerHTML = shellHTML();
    wire(document.getElementById('ta-perf'));
    render();
    restoreWTab();   // put the user back on the T-A tab they refreshed from
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
/* End of ta-performance-v0.4.3.js */
