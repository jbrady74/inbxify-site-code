/* ============================================================
   ta-performance-v0.3.1.js
   INBXIFY — Performance tab (T-A) — DATA
   v0.3.0 (from v0.2.0): first data version. Three views:
     • By newsletter (DEFAULT) — rows from NEWSLETTERS via the
       hidden list below; expand 1 (by source + multiplier +
       report link + GA4 seat) and expand 2 (content items).
     • By advertiser — one row per customer, summed across
       ingested issues. Rows drill in.
     • Customer drill-in — lifetime strip + issue-by-issue.
       Reachable from adv rows AND customer names in expand 2.
       "Generate report" link opens the parameter modal (M3);
       generation pipeline NOT in this version — modal fires
       PERF_REPORT_WEBHOOK when configured, else shows note.

   READ PATH — uses the EXISTING .newsletter-wrapper hidden list
     (the NEWSLETTERS "newsletter-source" collection already on the
     T-A page). Falls back to .perfnl-wrapper if absent.
     REQUIRED bindings on each item (add any missing in Designer):
       data-id (or data-item-id / data-slug)   = record key
       data-name (or data-title)               = Name
       data-issue (or data-issue-number)       = Issue Number
       data-date (or data-publish-date)        = Publish Date
       data-status                             = Status (optional)
       data-perf-updated                       = perf-updated-at
     PLUS inside the item a hidden TEXT-bound div:
       <div class="perfnl-json">{perf-stats-json}</div>
     (JSON must be element TEXT, never an attribute — attribute
     binding mangles quotes. v0.3.1 also accepts class
     .perf-stats-json for this div.)

   MEASUREMENT (house method — locked Jul 2026):
     reach(p) = Σ raw clicks(id ≥ p) / Σ raw clicks
     sawIt    = round(reach(topLinkId) × opens × HOUSE_FACTOR)
     Curve from RAW clicks; multiplier adjusts volume only.
     < MIN_CURVE_CLICKS total ⇒ Saw-it renders "—".
     Nexstar multiplier: clicks only; raw never mutated.

   HARDCODE LEDGER (this file):
     HC: MIN_CURVE_CLICKS = 50   (curve threshold — house rule)
     HC: HOUSE_FACTOR default 1.0 (global; config read TBD —
         until TA-config read exists it is a const here)
     HC: PERF_SAVE_WEBHOOK / PERF_REPORT_WEBHOOK — Make URLs,
         empty until scenarios exist. Strict {ok:true} gate.

   Pairs with ta-performance-v0.3.0.css (CSS unchanged).
   Load AFTER title-admin-page-design + ix-modals + ix-buttons.
   ============================================================ */
(function () {
  'use strict';

  var MOUNT_ID = 'ta-perf-mount';
  var MIN_CURVE_CLICKS = 50;          // HC — house rule
  var HOUSE_FACTOR = 1.0;             // HC — global, never per-client
  var PERF_SAVE_WEBHOOK = '';         // HC — Make: save settings (multiplier)
  var PERF_REPORT_WEBHOOK = '';       // HC — Make: generate advertiser report

  /* ── data ─────────────────────────────────────────────── */

  var NLS = [];        // [{id,name,issue,date,status,updated,stats}]
  var CUSTOMERS = {};  // customerId -> {id,name} from .customers-wrapper

  function readCustomers() {
    document.querySelectorAll('.customers-wrapper').forEach(function (el) {
      var d = el.dataset;
      if (d.id) CUSTOMERS[d.id] = { id: d.id, name: d.name || d.id };
    });
  }

  function parseDate(v) {
    if (!v) return null;
    var n = Number(v);
    if (!isNaN(n) && n > 1000000000) return new Date(n < 1e12 ? n * 1000 : n);
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  function readNewsletters() {
    NLS = [];
    var els = document.querySelectorAll('.newsletter-wrapper');
    if (!els.length) els = document.querySelectorAll('.perfnl-wrapper');
    els.forEach(function (el) {
      var d = el.dataset;
      if (!d.id && !d.itemId && !d.slug) return;
      var stats = null;
      var jsonEl = el.querySelector('.perfnl-json, .perf-stats-json');
      if (jsonEl) {
        var raw = (jsonEl.textContent || '').trim();
        if (raw) { try { stats = JSON.parse(raw); } catch (e) { stats = { _parseError: true }; } }
      }
      var issueRaw = d.issue || d.issueNumber || d.issueNo || '';
      NLS.push({
        id: d.id || d.itemId || d.slug || '',
        name: d.name || d.title || '',
        issue: issueRaw ? parseInt(issueRaw, 10) : null,
        date: parseDate(d.date || d.publishDate || d.published),
        status: d.status || '',
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
      if (stats.sources.mcSend && stats.sources.mcSend.delivered) out.push({ label: 'Mailchimp · send', c: stats.sources.mcSend });
      if (stats.sources.mcResend && stats.sources.mcResend.delivered) out.push({ label: 'Mailchimp · resend', c: stats.sources.mcResend });
    }
    return out;
  }
  function mult(stats) {
    return (stats && stats.settings && typeof stats.settings.nexstarMultiplier === 'number')
      ? stats.settings.nexstarMultiplier : 1.0;
  }
  function adjNexClicks(camp, m) { return Math.round((camp.clicksRaw || camp.clicks || 0) * m); }

  function nlTotals(stats) {
    var t = { sends: 0, opens: 0, clicks: 0, any: false };
    var m = mult(stats);
    nexCampaigns(stats).forEach(function (c) {
      t.sends += c.delivered || 0; t.opens += c.opens || 0;
      t.clicks += adjNexClicks(c, m); t.any = true;
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

  // reach curve per campaign; returns fn(pos)->fraction, or null below threshold
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

  // per-item across campaigns: clicks (adjusted) + sawIt (est) or null
  function itemMetrics(stats) {
    var out = {}; // key -> {key,type,label,customerId,slug,utmContent,clicks,sawIt,topPos,posOf}
    var m = mult(stats);
    nexCampaigns(stats).forEach(function (camp) {
      var curve = curveFor(camp);
      var items = camp.items || (stats.items || {});
      Object.keys(items).forEach(function (k) {
        var it = items[k];
        if (it.type === 'house') return;
        var rec = out[k] || (out[k] = {
          key: k, type: it.type, customerId: it.customerId || '',
          slug: it.slug || '', utmContent: it.utmContent || '',
          clicksRaw: 0, clicks: 0, sawIt: 0, sawItKnown: false, topPos: null
        });
        var raw = it.clicks || 0;
        rec.clicksRaw += raw;
        rec.clicks += Math.round(raw * m);
        var top = it.linkIds && it.linkIds.length ? Math.min.apply(null, it.linkIds) : null;
        if (top != null && (rec.topPos == null || top < rec.topPos)) rec.topPos = top;
        if (curve && top != null) {
          rec.sawIt += Math.round(curve(top) * (camp.opens || 0) * HOUSE_FACTOR);
          rec.sawItKnown = true;
        }
      });
    });
    return out;
  }

  /* ── formatting ───────────────────────────────────────── */

  function fmt(n) { return (n == null) ? '—' : n.toLocaleString('en-US'); }
  function pct(x) { return (x == null) ? '—' : (x * 100).toFixed(1) + '%'; }
  function dash(html) { return '<span class="perf-dash">' + (html || '—') + '</span>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function dShort(d) { return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''; }

  var TIPS = {
    opens: 'Reported by Nexstar and Mailchimp. Not adjusted.',
    clicks: 'Nexstar (\u00d7 your multiplier) + Mailchimp send + resend. Per-source lines in the row expand.',
    sawit: 'Estimate: this issue\u2019s own scroll curve (clicks at-or-below the item\u2019s position \u00f7 total clicks) \u00d7 opens \u00d7 house factor. Not a measurement.',
    onsite: 'GA4, inbxify.com. Articles: pageviews of the article. Ads and events: times displayed on site pages. Arrives v1.1.',
    site: 'GA4: web-version pageviews of this issue + average engagement time. Arrives v1.1.',
    advclicks: 'All sources, multiplier applied, summed across ingested issues.',
    advsawit: 'Sum of per-issue estimates \u2014 each issue\u2019s own scroll curve \u00d7 its opens. Not a measurement.',
    pos: 'Topmost link position in that issue. Drives the Saw-it estimate.'
  };
  function iCircle(tip) {
    return '<span class="perf-i">i<span class="tip">' + esc(tip) + '</span></span>';
  }

  var TYPE_LABEL = { article: 'Article', ad: '', find: 'The Find', event: 'Event', realestate: 'RE', external: 'Link', other: '' };

  function itemLabel(rec) {
    if (rec.type === 'ad' || rec.type === 'find') {
      var c = CUSTOMERS[rec.customerId];
      var name = c ? c.name : (rec.customerId ? rec.customerId.slice(0, 8) + '…' : 'Unknown');
      return '<span class="perf-cust" data-perf-cust="' + esc(rec.customerId) + '">' + esc(name) + '</span>'
        + '<span class="perf-type">' + esc(rec.utmContent || (rec.type === 'find' ? 'FIND' : 'AD')) + '</span>';
    }
    var title = rec.slug ? rec.slug.replace(/-/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); }) : (rec.utmContent || rec.key);
    return esc(title) + (TYPE_LABEL[rec.type] ? '<span class="perf-type">' + TYPE_LABEL[rec.type] + '</span>' : '');
  }

  /* ── render: by newsletter ────────────────────────────── */

  function rowNl(nl, idx) {
    var t = nl.stats ? nlTotals(nl.stats) : { any: false };
    var wait = !t.any;
    var status = wait
      ? '<span class="perf-status perf-status--wait">Awaiting data</span>'
      : '<span class="perf-status perf-status--live">Reported</span>';
    var label = (nl.issue ? 'WLN-' + nl.issue : esc(nl.name)) + (nl.date ? ' · ' + dShort(nl.date) : '');
    return '<tr class="perf-row" data-perf-nl="' + idx + '">'
      + '<td><span class="perf-chev">\u25b6</span></td>'
      + '<td>' + (wait ? label : '<strong>' + label + '</strong>') + '</td>'
      + '<td>' + status + '</td>'
      + '<td class="num">' + (wait ? dash() : fmt(t.sends)) + '</td>'
      + '<td class="num">' + (wait ? dash() : fmt(t.opens)) + '</td>'
      + '<td class="num">' + (wait ? dash() : pct(t.openRate)) + '</td>'
      + '<td class="num">' + (wait ? dash() : fmt(t.clicks)) + '</td>'
      + '<td class="num">' + (wait ? dash() : pct(t.ctr)) + '</td>'
      + '<td class="num">' + (wait ? dash() : pct(t.ctor)) + '</td>'
      + '</tr>';
  }

  function expandNl(nl) {
    var s = nl.stats || {};
    var m = mult(s);
    var srcRows = '';
    nexCampaigns(s).forEach(function (c, i) {
      var raw = c.clicksRaw || c.clicks || 0;
      var suffix = c.campaign || c.campaignSuffix || (i ? String.fromCharCode(65 + i) : 'A');
      var rep = c.report || {};
      var link = rep.driveFileId
        ? '<a class="perf-report-link" target="_blank" rel="noopener" href="https://drive.google.com/file/d/' + esc(rep.driveFileId) + '/view">' + esc(rep.fileName || 'report') + ' \u2197</a>'
        : dash(esc(rep.fileName || ''));
      srcRows += '<tr>'
        + '<td class="lbl">Nexstar \u00b7 ' + esc(suffix) + '</td>'
        + '<td class="num">' + fmt(c.delivered) + '</td>'
        + '<td class="num">' + fmt(c.opens) + '</td>'
        + '<td class="num">' + fmt(raw) + ' raw</td>'
        + '<td class="num perf-multcell">\u00d7 <input class="perf-mult" data-perf-mult value="' + m.toFixed(2) + '" data-orig="' + m.toFixed(2) + '"> = <strong data-perf-adj>' + fmt(Math.round(raw * m)) + '</strong><span data-perf-multactions></span></td>'
        + '<td class="num">' + link + '</td>'
        + '</tr>';
    });
    mcCampaigns(s).forEach(function (x) {
      srcRows += '<tr><td class="lbl">' + esc(x.label) + '</td>'
        + '<td class="num">' + fmt(x.c.delivered) + '</td><td class="num">' + fmt(x.c.opens) + '</td>'
        + '<td class="num">' + fmt(x.c.clicksRaw) + '</td><td class="num"></td><td class="num"></td></tr>';
    });
    if (!mcCampaigns(s).length) {
      srcRows += '<tr><td class="lbl">Mailchimp \u00b7 send</td><td class="num" colspan="4">' + dash() + '</td><td class="num">' + dash('not ingested') + '</td></tr>'
        + '<tr><td class="lbl">Mailchimp \u00b7 resend</td><td class="num" colspan="4">' + dash() + '</td><td class="num">' + dash('not ingested') + '</td></tr>';
    }
    srcRows += '<tr><td class="lbl">Site ' + iCircle(TIPS.site) + '</td>'
      + '<td class="num" colspan="2">' + dash('\u2014 pageviews') + '</td>'
      + '<td class="num" colspan="2">' + dash('\u2014 avg engagement') + '</td>'
      + '<td class="num">' + dash('GA4 \u00b7 v1.1') + '</td></tr>';

    var items = itemMetrics(s);
    var keys = Object.keys(items).sort(function (a, b) { return (items[a].topPos || 999) - (items[b].topPos || 999); });
    var contentRows = keys.map(function (k) {
      var r = items[k];
      return '<tr><td>' + itemLabel(r) + '</td>'
        + '<td class="num">' + fmt(r.clicks) + '</td>'
        + '<td class="num">' + (r.sawItKnown ? '<span class="perf-est">' + fmt(r.sawIt) + '</span>' : dash()) + '</td>'
        + '<td class="num">' + dash() + '</td></tr>';
    }).join('');

    return '<tr class="perf-expand"><td colspan="9">'
      + '<div class="perf-expand-inner"><h4>By source</h4><div class="perf-src"><table>' + srcRows + '</table></div>'
      + '<div class="perf-meta">Multiplier edits recalc Nexstar-derived numbers only \u00b7 raw values never change</div></div>'
      + '<div class="perf-expand-inner perf-expand-inner--gap"><h4>Content</h4><div class="perf-content"><table>'
      + '<tr class="perf-content-head"><td>Item</td><td class="num">Clicks</td>'
      + '<td class="num">Saw it (est.) ' + iCircle(TIPS.sawit) + '</td>'
      + '<td class="num">On site ' + iCircle(TIPS.onsite) + '</td></tr>'
      + (contentRows || '<tr><td colspan="4">' + dash('no per-item data') + '</td></tr>')
      + '</table></div>'
      + '<div class="perf-meta">Saw-it uses raw clicks for the curve, adjusted clicks for volume \u00b7 customer names open the advertiser view</div></div>'
      + '</td></tr>';
  }

  /* ── render: by advertiser + drill-in ─────────────────── */

  function advIndex() {
    var by = {}; // customerId -> {name, issues:{}, clicks, sawIt, sawItKnown, slots:{}, lastDate, rows:[]}
    NLS.forEach(function (nl) {
      if (!nl.stats) return;
      var items = itemMetrics(nl.stats);
      Object.keys(items).forEach(function (k) {
        var r = items[k];
        if ((r.type !== 'ad' && r.type !== 'find') || !r.customerId) return;
        var a = by[r.customerId] || (by[r.customerId] = {
          id: r.customerId, name: (CUSTOMERS[r.customerId] || {}).name || r.customerId.slice(0, 8) + '…',
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

  function viewAdv() {
    var list = advIndex();
    var rows = list.map(function (a) {
      return '<tr class="perf-row" data-perf-cust="' + esc(a.id) + '">'
        + '<td><strong>' + esc(a.name) + '</strong></td>'
        + '<td>' + Object.keys(a.slots).map(function (s) { return '<span class="perf-type">' + s + '</span>'; }).join(' ') + '</td>'
        + '<td class="num">' + Object.keys(a.issues).length + '</td>'
        + '<td class="num">' + fmt(a.clicks) + '</td>'
        + '<td class="num">' + (a.sawItKnown ? '<span class="perf-est">' + fmt(a.sawIt) + '</span>' : dash()) + '</td>'
        + '<td class="num">' + (a.lastDate ? dShort(a.lastDate) : dash()) + '</td></tr>';
    }).join('');
    var ingested = NLS.filter(function (n) { return n.stats; }).length;
    return '<div class="ta-perf__card"><table>'
      + '<thead><tr><th>Advertiser</th><th>Slots</th><th class="num">Issues</th>'
      + '<th class="num">Clicks ' + iCircle(TIPS.advclicks) + '</th>'
      + '<th class="num">Saw it (est.) ' + iCircle(TIPS.advsawit) + '</th>'
      + '<th class="num">Last ran</th></tr></thead><tbody>'
      + (rows || '<tr><td colspan="6">' + dash('no ingested issues yet \u2014 drop a report in the folder') + '</td></tr>')
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
        return '<tr><td class="num">' + (nl.issue ? 'WLN-' + nl.issue : esc(nl.name)) + '</td>'
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
      + tot('Clicks', a ? fmt(a.clicks) : '—')
      + tot('Saw it', a && a.sawItKnown ? fmt(a.sawIt) + '<span class="est">est.</span>' : '—')
      + tot('On site', '—')
      + '</div>'
      + '<div class="ta-perf__card"><table>'
      + '<thead><tr><th class="num">Issue</th><th>Date</th><th>Slot</th>'
      + '<th class="num">Position ' + iCircle(TIPS.pos) + '</th>'
      + '<th class="num">Clicks</th><th class="num">Saw it (est.)</th><th class="num">On site</th></tr></thead>'
      + '<tbody>' + (issueRows || '<tr><td colspan="7">' + dash('no ingested placements') + '</td></tr>') + '</tbody></table>'
      + '<div class="perf-meta">Skeleton of the future advertiser report \u00b7 Saw-it always est., never summed with On-site</div></div>';
    function tot(l, v) { return '<div class="perf-total"><div class="l">' + l + '</div><div class="v">' + v + '</div></div>'; }
  }

  /* ── multiplier edit (canonical dirty pattern) ────────── */

  function wireMultiplier(root, nl) {
    root.querySelectorAll('[data-perf-mult]').forEach(function (input) {
      var actions = input.parentElement.querySelector('[data-perf-multactions]');
      function setDirty(on) {
        input.classList.toggle('ipp-dirty', on);
        if (!actions) return;
        actions.innerHTML = on
          ? '<button class="ix-btn perf-save" data-perf-save>Save</button><span class="ipp-cancel-link" data-perf-cancel>cancel</span>'
          : '';
      }
      input.addEventListener('input', function () {
        var v = parseFloat(input.value);
        setDirty(input.value !== input.getAttribute('data-orig'));
        if (!isNaN(v)) {
          // live recalc of the adjusted cell only; full totals recalc on save
          var raw = 0;
          nexCampaigns(nl.stats).forEach(function (c) { raw += c.clicksRaw || c.clicks || 0; });
          var adj = input.closest('tr').querySelector('[data-perf-adj]');
          if (adj) adj.textContent = fmt(Math.round((nexCampaigns(nl.stats)[0].clicksRaw || 0) * v));
        }
      });
      root.addEventListener('click', function (e) {
        if (e.target.hasAttribute && e.target.hasAttribute('data-perf-cancel')) {
          input.value = input.getAttribute('data-orig'); setDirty(false);
          input.dispatchEvent(new Event('input'));
          setDirty(false);
        }
        if (e.target.hasAttribute && e.target.hasAttribute('data-perf-save')) {
          saveMultiplier(nl, parseFloat(input.value), e.target, function (ok) {
            if (ok) { input.setAttribute('data-orig', input.value); setDirty(false); render(); }
          });
        }
      });
    });
  }

  function saveMultiplier(nl, value, btn, done) {
    if (isNaN(value) || value <= 0) { alert('Multiplier must be a positive number.'); return done(false); }
    if (!PERF_SAVE_WEBHOOK) {
      // No scenario yet: apply locally so the tab is usable; flag unsaved.
      nl.stats.settings = nl.stats.settings || {};
      nl.stats.settings.nexstarMultiplier = value;
      alert('Applied for this session. Save webhook not configured yet \u2014 value will not persist.');
      return done(true);
    }
    var orig = btn.textContent;
    btn.disabled = true; btn.textContent = 'SAVING\u2026';
    fetch(PERF_SAVE_WEBHOOK, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set-multiplier', newsletterId: nl.id, value: value })
    }).then(function (r) { return r.json(); }).then(function (j) {
      // STRICT success: body {ok:true} only — never bare res.ok (standing rule)
      if (j && j.ok === true) {
        nl.stats.settings = nl.stats.settings || {};
        nl.stats.settings.nexstarMultiplier = value;
        done(true);
      } else { alert('Save failed \u2014 scenario did not confirm.'); btn.disabled = false; btn.textContent = orig; done(false); }
    }).catch(function () { alert('Save failed \u2014 network.'); btn.disabled = false; btn.textContent = orig; done(false); });
  }

  /* ── report modal (M3) ────────────────────────────────── */

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
        if (!PERF_REPORT_WEBHOOK) {
          alert('Report pipeline not built yet \u2014 parameters captured, scenario pending.');
          return;
        }
        var btn = e.target; btn.disabled = true; btn.textContent = 'GENERATING\u2026';
        fetch(PERF_REPORT_WEBHOOK, {
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

  /* ── shell + routing ──────────────────────────────────── */

  var STATE = { channel: 'nl', drill: null, openRow: null };

  function shellHTML() {
    return '<div class="ta-perf" id="ta-perf">'
      + '<div class="ta-perf__head"><div class="ta-perf__eyebrow" data-perf-title-name></div>'
      + '<div class="ta-perf__title">Performance</div></div>'
      + '<div class="ix-channels ta-perf__channels" role="tablist">'
      + '<button class="ix-channel" data-perf-channel="nl">By newsletter</button>'
      + '<button class="ix-channel" data-perf-channel="adv">By advertiser</button>'
      + '<div class="ix-channel-spacer"></div></div>'
      + '<div data-perf-view></div></div>';
  }

  function render() {
    var root = document.getElementById('ta-perf');
    if (!root) return;
    root.querySelectorAll('[data-perf-channel]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-perf-channel') === STATE.channel);
    });
    var view = root.querySelector('[data-perf-view]');
    if (STATE.channel === 'adv') {
      view.innerHTML = STATE.drill ? viewDrill(STATE.drill) : viewAdv();
      return;
    }
    // by newsletter
    var body = NLS.map(function (nl, i) {
      var open = STATE.openRow === i && nl.stats;
      return rowNl(nl, i).replace('class="perf-row"', open ? 'class="perf-row open"' : 'class="perf-row"')
        + (open ? expandNl(nl) : '');
    }).join('');
    view.innerHTML = '<div class="ta-perf__card"><table>'
      + '<thead><tr><th style="width:26px"></th><th>Newsletter</th><th>Status</th>'
      + '<th class="num">Sends</th><th class="num">Opens ' + iCircle(TIPS.opens) + '</th>'
      + '<th class="num">Open rate</th><th class="num">Clicks ' + iCircle(TIPS.clicks) + '</th>'
      + '<th class="num">CTR</th><th class="num">CTOR</th></tr></thead><tbody>'
      + (body || '<tr><td colspan="9">' + dash('no newsletters found \u2014 is the .perfnl-wrapper list on the page?') + '</td></tr>')
      + '</tbody></table></div>';
    if (STATE.openRow != null && NLS[STATE.openRow]) wireMultiplier(view, NLS[STATE.openRow]);
  }

  function wire(root) {
    root.addEventListener('click', function (e) {
      var chan = e.target.closest && e.target.closest('[data-perf-channel]');
      if (chan) { STATE.channel = chan.getAttribute('data-perf-channel'); STATE.drill = null; render(); return; }
      if (e.target.closest && e.target.closest('[data-perf-back]')) { STATE.drill = null; render(); return; }
      var gen = e.target.closest && e.target.closest('[data-perf-genreport]');
      if (gen) { openReportModal(gen.getAttribute('data-perf-genreport')); return; }
      var cust = e.target.closest && e.target.closest('[data-perf-cust]');
      if (cust && cust.getAttribute('data-perf-cust')) {
        STATE.channel = 'adv'; STATE.drill = cust.getAttribute('data-perf-cust'); render(); return;
      }
      var row = e.target.closest && e.target.closest('[data-perf-nl]');
      if (row && !e.target.closest('input,button,a,.ipp-cancel-link')) {
        var i = parseInt(row.getAttribute('data-perf-nl'), 10);
        if (!NLS[i] || !NLS[i].stats) return;              // awaiting rows don't expand
        STATE.openRow = (STATE.openRow === i) ? null : i;
        render();
      }
    });
  }

  function init() {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) return;
    if (document.getElementById('ta-perf')) return;
    readCustomers();
    readNewsletters();
    mount.innerHTML = shellHTML();
    var root = document.getElementById('ta-perf');
    root.dataset.perfInit = '1';
    // Title name: ix-header component owns it in v0.2.0+; keep hook populated if present
    wire(root);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
/* End of ta-performance-v0.3.1.js */
