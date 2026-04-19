// ============================================================
// studio-v1.0.0.js
// INBXIFY Studio — Phase 1 (read-only Assembler, Articles)
//
// Mounts into #studio-mount on the T-A page.
// Replaces the "Content Processor" + "Content Maker" tabs.
//
// Phase 1 scope:
//   - Sub-tabs: Input | Components | Assembler
//   - Input + Components are placeholders
//   - Assembler: Articles only, read-only
//     * Asset picker with filters (name, customer, product, MNLS)
//     * Sort: recent added / recent edited / name
//     * Availability filter: Articles default to "available"
//       (!newsletterId && status !== 'live')
//     * Metadata strip + three-column read-only display
//
// Reads from the Articles hidden collection list wrapper on
// the T-A page, class `.articles-wrapper`, via data-*
// attributes bound in Webflow Designer.
//
// This module does NOT write to Webflow. No save path.
// Phase 2 adds editing, staged save, unified Scenario F.
// ============================================================

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.getElementById('studio-mount');
    if (!mount) return;

    // ── Config ──
    var CFG = {
      get titleSlug()  { return window.TA_CONFIG && window.TA_CONFIG.titleSlug  || ''; },
      get titleId()    { return window.TA_CONFIG && window.TA_CONFIG.titleId    || ''; },
      get uploadcareBase() { return window.TA_CONFIG && window.TA_CONFIG.uploadcareBase || 'https://uyluucdnr2.ucarecd.net'; }
    };

    // ── State ──
    var S = {
      panel: 'assembler',     // input | components | assembler
      assetType: 'articles',  // articles | ads | events | re
      filter: {
        name: '',
        customerId: '',
        productId: '',
        mnlsId: '',
        sort: 'recent-edited',  // recent-edited | recent-added | name
        availabilityOnly: true
      },
      selectedAssetId: null
    };

    // ── Shell markup ──
    mount.innerHTML =
      '<div class="std-root">' +
        '<div class="std-subtabs">' +
          '<button class="std-subtab" data-std-panel="input">' +
            '<span class="std-subtab-icon">\u2B06</span>' +
            '<span>Input</span>' +
          '</button>' +
          '<button class="std-subtab" data-std-panel="components">' +
            '<span class="std-subtab-icon">\u25A3</span>' +
            '<span>Components</span>' +
          '</button>' +
          '<button class="std-subtab active" data-std-panel="assembler">' +
            '<span class="std-subtab-icon">\u29BE</span>' +
            '<span>Assembler</span>' +
          '</button>' +
        '</div>' +
        '<div class="std-panel" data-std-panel-body="input">' +
          '<div class="std-placeholder">' +
            '<div class="std-placeholder-icon">\u2B06</div>' +
            '<div class="std-placeholder-title">Input</div>' +
            '<div class="std-placeholder-sub">Phase 1: placeholder only. Upload (Google Drive) and Transcribe flows move here in Phase 2. Form Submission is being retired.</div>' +
          '</div>' +
        '</div>' +
        '<div class="std-panel" data-std-panel-body="components">' +
          '<div class="std-placeholder">' +
            '<div class="std-placeholder-icon">\u25A3</div>' +
            '<div class="std-placeholder-title">Components</div>' +
            '<div class="std-placeholder-sub">Phase 1: placeholder only. Ready-to-assign components queue arrives in Phase 3.</div>' +
          '</div>' +
        '</div>' +
        '<div class="std-panel active" data-std-panel-body="assembler">' +
          '<div class="asm-root" id="asm-root"></div>' +
        '</div>' +
      '</div>';

    // ── Sub-tab wiring ──
    mount.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-std-panel]');
      if (!btn) return;
      var panel = btn.getAttribute('data-std-panel');
      setPanel(panel);
    });

    function setPanel(name) {
      S.panel = name;
      Array.prototype.forEach.call(mount.querySelectorAll('[data-std-panel]'), function (el) {
        el.classList.toggle('active', el.getAttribute('data-std-panel') === name);
      });
      Array.prototype.forEach.call(mount.querySelectorAll('[data-std-panel-body]'), function (el) {
        el.classList.toggle('active', el.getAttribute('data-std-panel-body') === name);
      });
      if (name === 'assembler') renderAssembler();
    }

    // ═══════════════════════════════════════════
    // DOM readers — pull data from T-A page hidden collections
    // ═══════════════════════════════════════════

    // Articles
    function readArticles() {
      var wraps = document.querySelectorAll('.articles-wrapper[data-item]');
      var out = [];
      Array.prototype.forEach.call(wraps, function (el) {
        var d = el.dataset;
        var id = (d.articleId || '').trim();
        if (!id) return;
        out.push({
          id: id,
          name: (d.articleTitle || '').trim(),
          customerId: (d.articleCustomerId || '').trim(),
          customerName: (d.articleCustomerName || '').trim(),
          productId: (d.categoryId || '').trim(),
          productName: (d.articleCategory || d.label || '').trim(),
          revenueType: (d.type || '').trim(),
          mnlsId: (d.mnlsId || '').trim(),
          mnlsName: (d.mnlsName || '').trim(),
          newsletterId: (d.newsletterId || '').trim(),
          newsletterName: (d.newsletterName || '').trim(),
          newsletterDate: (d.newsletterDate || '').trim(),
          status: mapStatus((d.articleStatus || '').trim()),
          bodyStatus: (d.bodyStatus || '').trim(),
          created: (d.articleCreated || '').trim(),
          updated: (d.articleUpdated || '').trim(),

          // Body content
          subtitle: (d.articleSubtitle || '').trim(),
          bannerStatement: (d.articleBannerStatement || '').trim(),
          teaser: (d.articleTeaser || '').trim(),
          shortSummary: (d.articleShortSummary || '').trim(),
          bodyExcerpt: (d.articleBodyExcerpt || '').trim(),
          printIssueSource: (d.articlePrintIssueSource || '').trim(),

          // Main image
          mainImageUuid: (d.articleMainImageUuid || '').trim(),
          mainImageAlt:  (d.articleMainImageAlt  || '').trim(),
          mainImageUrl:  (d.articleMainImageUrl  || '').trim(), // fallback

          // CTA
          ctaButton: (d.articleCtaButtonText || '').trim(),
          ctaText:   (d.articleCtaText       || '').trim(),
          ctaUrl:    (d.articleCtaUrl        || '').trim(),

          // Writers
          writerName:      (d.articleWriterName      || '').trim(),
          writerTitle:     (d.articleWriterTitle     || '').trim(),
          cowriterName:    (d.articleCowriterName    || '').trim(),
          cowriterTitle:   (d.articleCowriterTitle   || '').trim(),
          writerComposite: (d.articleWriterComposite || '').trim(),
          cowriterComposite: (d.articleCowriterComposite || '').trim(),

          // Media flags
          showPhotoCredits: isOn(d.articleShowPhotoCredits),
          photographer: (d.articlePhotographer || '').trim(),
          photoEssay: isOn(d.articlePhotoEssay),
          videoArticle: isOn(d.articleVideoArticle),
          videoUrl: (d.articleVideoUrl || '').trim(),
          audioUrl: (d.articleAudioUrl || '').trim()
        });
      });
      return out;
    }

    function mapStatus(hash) {
      if (!hash) return 'draft';
      var MAP = {
        '991b2f66a1dd52df80fde0c7bc67d1a8': 'live',
        'cbad0e93deea996b0769d71d808d59c5': 'draft'
      };
      return MAP[hash] || hash.toLowerCase() || 'draft';
    }

    function isOn(v) {
      if (!v) return false;
      var s = String(v).trim().toLowerCase();
      return s === 'true' || s === 'on' || s === 'yes' || s === '1';
    }

    // Customers / Products / MNLS (for filter dropdowns)
    function readCustomers() {
      return dedupe(
        Array.prototype.map.call(
          document.querySelectorAll('.customers-wrapper[data-item]'),
          function (el) {
            return { id: (el.dataset.id || '').trim(), name: (el.dataset.name || '').trim() };
          }
        ).filter(function (c) { return c.id; })
      ).sort(byName);
    }
    function readProducts() {
      return dedupe(
        Array.prototype.map.call(
          document.querySelectorAll('.products-wrapper[data-item]'),
          function (el) {
            return { id: (el.dataset.id || '').trim(), name: (el.dataset.name || '').trim() };
          }
        ).filter(function (p) { return p.id; })
      ).sort(byName);
    }
    function readMnls() {
      // MNLS values come from Articles' data-mnls-id / data-mnls-name
      var seen = {};
      Array.prototype.forEach.call(
        document.querySelectorAll('.articles-wrapper[data-item]'),
        function (el) {
          var id = (el.dataset.mnlsId || '').trim();
          var name = (el.dataset.mnlsName || '').trim();
          if (id && !seen[id]) seen[id] = { id: id, name: name || id };
        }
      );
      return Object.keys(seen).map(function (k) { return seen[k]; }).sort(byName);
    }
    function dedupe(arr) {
      var seen = {};
      return arr.filter(function (x) {
        if (seen[x.id]) return false;
        seen[x.id] = true;
        return true;
      });
    }
    function byName(a, b) { return (a.name || '').localeCompare(b.name || ''); }

    // ═══════════════════════════════════════════
    // ASSEMBLER rendering
    // ═══════════════════════════════════════════

    function renderAssembler() {
      var root = document.getElementById('asm-root');
      if (!root) return;

      if (S.selectedAssetId) {
        renderOpenAssembler(root);
      } else {
        renderPicker(root);
      }
    }

    // ── Asset picker view ──
    function renderPicker(root) {
      var customers = readCustomers();
      var products = readProducts();
      var mnls = readMnls();

      var h = '';

      h += '<div class="asm-phase-notice"><strong>Phase 1 (read-only).</strong> Pick an Article to view its current state. Editing, Save, and component attachment arrive in Phase 2. Ads / Events / RE coming in Phase 6.</div>';

      h += '<div class="asm-picker-wrap">';

      // Header + type toggle
      h += '<div class="asm-picker-head">';
      h += '<div class="asm-picker-title">Pick an Asset</div>';
      h += '<div class="asm-picker-sub">Filter by type, customer, product, or section</div>';
      h += '<div class="asm-type-toggle">';
      h += typeOpt('articles', 'Articles');
      h += typeOpt('ads', 'Ads');
      h += typeOpt('events', 'Events');
      h += typeOpt('re', 'RE Listings');
      h += '</div>';
      h += '</div>';

      // Filters
      h += '<div class="asm-filters">';
      h += '<div class="asm-ff"><label class="asm-fl">Name</label>' +
           '<input class="asm-finp" id="asm-f-name" type="text" placeholder="Search\u2026" value="' + esc(S.filter.name) + '"></div>';
      h += '<div class="asm-ff"><label class="asm-fl">Customer</label>' +
           '<select class="asm-fsel" id="asm-f-customer">' +
             '<option value="">All customers</option>' +
             customers.map(function (c) {
               return '<option value="' + esc(c.id) + '"' + (c.id === S.filter.customerId ? ' selected' : '') + '>' + esc(c.name) + '</option>';
             }).join('') +
           '</select></div>';
      h += '<div class="asm-ff"><label class="asm-fl">Product Library</label>' +
           '<select class="asm-fsel" id="asm-f-product">' +
             '<option value="">All products</option>' +
             products.map(function (p) {
               return '<option value="' + esc(p.id) + '"' + (p.id === S.filter.productId ? ' selected' : '') + '>' + esc(p.name) + '</option>';
             }).join('') +
           '</select></div>';
      h += '<div class="asm-ff"><label class="asm-fl">MNLS</label>' +
           '<select class="asm-fsel" id="asm-f-mnls">' +
             '<option value="">All sections</option>' +
             mnls.map(function (m) {
               return '<option value="' + esc(m.id) + '"' + (m.id === S.filter.mnlsId ? ' selected' : '') + '>' + esc(m.name) + '</option>';
             }).join('') +
           '</select></div>';
      h += '<div class="asm-ff asm-sort-wrap"><label class="asm-fl">Sort</label>' +
           '<select class="asm-fsel" id="asm-f-sort">' +
             sortOpt('recent-edited', 'Recently edited') +
             sortOpt('recent-added', 'Recently added') +
             sortOpt('name', 'Name A-Z') +
           '</select></div>';
      h += '</div>';

      // Availability toggle
      h += '<div style="padding:6px 18px;border-bottom:1px solid var(--ix-border-soft);background:var(--ix-white);font-family:var(--ix-font-mono);font-size:10px;color:var(--ix-text-mid);display:flex;align-items:center;gap:10px">';
      h += '<label style="display:flex;align-items:center;gap:6px;cursor:pointer">';
      h += '<input type="checkbox" id="asm-f-avail"' + (S.filter.availabilityOnly ? ' checked' : '') + '>';
      h += '<span>Show available only <span style="color:var(--ix-text-tiny)">(not newsletter-attached + not Live)</span></span>';
      h += '</label>';
      h += '</div>';

      // Results list
      h += renderResultsList();

      h += '</div>';

      root.innerHTML = h;

      // Bind filter events
      bindFilterEvents(root);
    }

    function typeOpt(id, label) {
      var disabled = id !== 'articles';
      return '<button class="asm-type-opt' + (id === S.assetType ? ' active' : '') + '"' +
        (disabled ? ' disabled title="Phase 6"' : '') +
        ' data-asm-type="' + id + '">' +
        esc(label) + (disabled ? ' \u2014 soon' : '') +
        '</button>';
    }

    function sortOpt(val, label) {
      return '<option value="' + val + '"' + (val === S.filter.sort ? ' selected' : '') + '>' + esc(label) + '</option>';
    }

    function renderResultsList() {
      if (S.assetType !== 'articles') {
        return '<div class="asm-results-empty">' + S.assetType.toUpperCase() + ' support arrives in Phase 6.</div>';
      }

      var items = getFilteredArticles();
      var h = '<div class="asm-result-count">' + items.length + ' article' + (items.length === 1 ? '' : 's') + '</div>';

      if (!items.length) {
        h += '<div class="asm-results-empty">No articles match these filters.</div>';
        return '<div class="asm-results">' + h + '</div>';
      }

      h += '<div>';
      items.forEach(function (a) {
        var dotClass = a.newsletterId ? 'assigned' : (a.status === 'live' ? 'live' : 'draft');
        var metaBits = [];
        if (a.customerName) metaBits.push(esc(a.customerName));
        else metaBits.push('<span style="color:var(--ix-text-tiny)">No customer</span>');
        if (a.productName) metaBits.push(esc(a.productName));
        if (a.mnlsName) metaBits.push(esc(a.mnlsName));
        if (a.newsletterName) metaBits.push('\u2192 ' + esc(a.newsletterName));

        h += '<div class="asm-result" data-asm-open="' + esc(a.id) + '">';
        h += '<div class="asm-result-main">';
        h += '<div class="asm-result-name">' + (esc(a.name) || '<em>Untitled</em>') + '</div>';
        h += '<div class="asm-result-meta">';
        h += '<span class="asm-status-dot ' + dotClass + '"></span>';
        h += '<span>' + (a.newsletterId ? 'ASSIGNED' : a.status.toUpperCase()) + '</span>';
        metaBits.forEach(function (b, i) {
          h += '<span class="sep">\u00B7</span><span>' + b + '</span>';
        });
        h += '</div></div>';
        h += '<div></div>';
        h += '<div class="asm-result-chevron">\u203A</div>';
        h += '</div>';
      });
      h += '</div>';

      return '<div class="asm-results">' + h + '</div>';
    }

    function getFilteredArticles() {
      var items = readArticles();

      if (S.filter.availabilityOnly) {
        items = items.filter(function (a) {
          return !a.newsletterId && a.status !== 'live';
        });
      }

      var nameQ = S.filter.name.toLowerCase().trim();
      if (nameQ) items = items.filter(function (a) { return (a.name || '').toLowerCase().indexOf(nameQ) !== -1; });
      if (S.filter.customerId) items = items.filter(function (a) { return a.customerId === S.filter.customerId; });
      if (S.filter.productId)  items = items.filter(function (a) { return a.productId  === S.filter.productId; });
      if (S.filter.mnlsId)     items = items.filter(function (a) { return a.mnlsId     === S.filter.mnlsId; });

      items.sort(function (a, b) {
        if (S.filter.sort === 'name') return (a.name || '').localeCompare(b.name || '');
        if (S.filter.sort === 'recent-added') return cmpDesc(a.created, b.created);
        return cmpDesc(a.updated || a.created, b.updated || b.created); // recent-edited (default)
      });

      return items;
    }

    function cmpDesc(a, b) {
      a = a || ''; b = b || '';
      if (a === b) return 0;
      return a < b ? 1 : -1;
    }

    function bindFilterEvents(root) {
      // Type toggle
      Array.prototype.forEach.call(root.querySelectorAll('[data-asm-type]'), function (b) {
        b.addEventListener('click', function () {
          if (b.disabled) return;
          S.assetType = b.getAttribute('data-asm-type');
          renderAssembler();
        });
      });

      // Filters
      var byId = function (id) { return root.querySelector('#' + id); };
      var onName = byId('asm-f-name');
      if (onName) onName.addEventListener('input', function () { S.filter.name = onName.value; updateResults(); });
      var onCust = byId('asm-f-customer');
      if (onCust) onCust.addEventListener('change', function () { S.filter.customerId = onCust.value; updateResults(); });
      var onProd = byId('asm-f-product');
      if (onProd) onProd.addEventListener('change', function () { S.filter.productId = onProd.value; updateResults(); });
      var onMnls = byId('asm-f-mnls');
      if (onMnls) onMnls.addEventListener('change', function () { S.filter.mnlsId = onMnls.value; updateResults(); });
      var onSort = byId('asm-f-sort');
      if (onSort) onSort.addEventListener('change', function () { S.filter.sort = onSort.value; updateResults(); });
      var onAvail = byId('asm-f-avail');
      if (onAvail) onAvail.addEventListener('change', function () { S.filter.availabilityOnly = onAvail.checked; updateResults(); });

      // Result click
      root.addEventListener('click', function (e) {
        var row = e.target.closest('[data-asm-open]');
        if (!row) return;
        S.selectedAssetId = row.getAttribute('data-asm-open');
        renderAssembler();
      });
    }

    function updateResults() {
      var host = document.querySelector('#asm-root .asm-picker-wrap');
      if (!host) return;
      // Replace just the results container
      var existing = host.querySelector('.asm-results');
      var emptyNode = host.querySelector('.asm-results-empty'); // if no asm-results, this might be the fallback
      var replacement = document.createElement('div');
      replacement.innerHTML = renderResultsList();
      var newList = replacement.firstElementChild;
      if (existing) existing.parentNode.replaceChild(newList, existing);
      else if (emptyNode) emptyNode.parentNode.replaceChild(newList, emptyNode);
      else host.appendChild(newList);
    }

    // ── Open Assembler (single asset) ──
    function renderOpenAssembler(root) {
      var articles = readArticles();
      var a = articles.find(function (x) { return x.id === S.selectedAssetId; });

      if (!a) {
        root.innerHTML = '<div class="asm-results-empty">Article not found. It may have been removed, or its CMS data hasn\u2019t loaded yet.</div>' +
                        '<div style="text-align:center;margin-top:12px"><button class="asm-back-btn" id="asm-back">\u2190 Back to picker</button></div>';
        document.getElementById('asm-back').addEventListener('click', function () {
          S.selectedAssetId = null;
          renderAssembler();
        });
        return;
      }

      var h = '';

      // Back + phase notice
      h += '<div class="asm-back-row">';
      h += '<button class="asm-back-btn" id="asm-back">\u2190 Back to picker</button>';
      h += '<div style="font-family:var(--ix-font-mono);font-size:10px;color:var(--ix-text-light);letter-spacing:0.04em;text-transform:uppercase">Read-only view (Phase 1)</div>';
      h += '</div>';

      // Metadata strip
      h += '<div class="asm-meta-strip">';
      h += '<div class="asm-meta-bar"></div>';
      h += '<div class="asm-meta-body">';
      h += metaCell('Article', a.name || '<em>Untitled</em>', 'primary');
      h += metaCell('Customer', a.customerName || '', a.customerName ? '' : 'empty');
      h += metaCell('Product', a.productName || '', a.productName ? '' : 'empty');
      h += metaCell('MNLS', a.mnlsName || '', a.mnlsName ? '' : 'empty');
      // Status pill
      var pillClass = a.newsletterId ? 'assigned' : a.status;
      var pillLabel = a.newsletterId ? 'Assigned' : (a.status === 'live' ? 'Live' : 'Draft');
      h += '<div class="asm-meta-cell">';
      h += '<div class="asm-meta-label">Status</div>';
      h += '<div class="asm-status-pill ' + pillClass + '">' + pillLabel + '</div>';
      if (a.newsletterId && a.newsletterName) {
        h += '<div class="asm-meta-value" style="font-size:11px;color:var(--ix-text-light);margin-top:2px">' + esc(a.newsletterName) + (a.newsletterDate ? ' · ' + esc(a.newsletterDate) : '') + '</div>';
      }
      h += '</div>';
      h += '</div>';
      h += '</div>';

      // Three columns
      h += '<div class="asm-columns">';

      // COLUMN 1 — Text Subcomponents
      h += renderCol1(a);

      // COLUMN 2 — Media
      h += renderCol2(a);

      // COLUMN 3 — Editorial & Metadata
      h += renderCol3(a);

      h += '</div>';

      root.innerHTML = h;

      document.getElementById('asm-back').addEventListener('click', function () {
        S.selectedAssetId = null;
        renderAssembler();
      });
    }

    function metaCell(label, value, cls) {
      return '<div class="asm-meta-cell">' +
        '<div class="asm-meta-label">' + esc(label) + '</div>' +
        '<div class="asm-meta-value ' + (cls || '') + '">' + (value || '<span class="empty">\u2014</span>') + '</div>' +
        '</div>';
    }

    // Column 1 — Text
    function renderCol1(a) {
      var h = '';
      h += '<div class="asm-col">';
      h += '<div class="asm-col-head"><div class="asm-col-title">Text</div><div class="asm-col-count">1 of 3</div></div>';
      h += '<div class="asm-col-body">';

      h += scRow('Title',           a.name);
      h += scRow('Sub-Title',       a.subtitle);
      h += scRow('Banner Statement', a.bannerStatement);
      h += scRow('Teaser Summary',   a.teaser, { multiline: true, badge: charCount(a.teaser, 400) });
      h += scRow('Short Summary',    a.shortSummary, { multiline: true, badge: charCount(a.shortSummary, 150) });
      h += scRow('Revenue Type',     a.revenueType);

      // Writers block
      h += '<div class="asm-sc">';
      h += '<div class="asm-sc-label">Writers</div>';
      var wParts = [];
      if (a.writerName || a.writerTitle) wParts.push(joinBits(a.writerName, a.writerTitle));
      if (a.cowriterName || a.cowriterTitle) wParts.push('co: ' + joinBits(a.cowriterName, a.cowriterTitle));
      if (wParts.length) {
        h += '<div class="asm-sc-value">' + wParts.map(esc).join('<br>') + '</div>';
      } else {
        h += '<div class="asm-sc-value empty">No writers set</div>';
      }
      h += '</div>';

      h += '</div></div>';
      return h;
    }

    // Column 2 — Media
    function renderCol2(a) {
      var h = '';
      h += '<div class="asm-col">';
      h += '<div class="asm-col-head"><div class="asm-col-title">Media</div><div class="asm-col-count">2 of 3</div></div>';
      h += '<div class="asm-col-body">';

      // Main image slot
      h += '<div class="asm-img-slot">';
      h += '<div class="asm-img-slot-label">Main Image</div>';
      var imgUrl = buildMainImageUrl(a);
      if (imgUrl) {
        h += '<img class="asm-img-thumb" src="' + esc(imgUrl) + '" alt="' + esc(a.mainImageAlt) + '">';
      } else {
        h += '<div class="asm-img-placeholder">No main image</div>';
      }
      if (a.mainImageAlt) {
        h += '<div class="asm-img-alt">Alt: ' + esc(a.mainImageAlt) + '</div>';
      } else if (imgUrl) {
        h += '<div class="asm-img-alt empty">\u26A0 Alt text missing</div>';
      }
      h += '</div>';

      // Interior images (Phase 1: read from MEDIA items reference — deferred)
      h += '<div class="asm-img-slot">';
      h += '<div class="asm-img-slot-label">Interior Images</div>';
      h += '<div class="asm-gallery-empty">Interior-image gallery displays in Phase 2</div>';
      h += '</div>';

      // Photo credits block
      h += '<div class="asm-switch-row">';
      h += '<div class="asm-switch-label">Show Photo Credits</div>';
      h += '<div class="asm-switch-state ' + (a.showPhotoCredits ? 'on' : 'off') + '">' + (a.showPhotoCredits ? 'on' : 'off') + '</div>';
      h += '</div>';
      if (a.showPhotoCredits || a.photographer) {
        h += scRow('Photographer', a.photographer);
      }

      h += '<div class="asm-switch-row">';
      h += '<div class="asm-switch-label">Photo Essay</div>';
      h += '<div class="asm-switch-state ' + (a.photoEssay ? 'on' : 'off') + '">' + (a.photoEssay ? 'on' : 'off') + '</div>';
      h += '</div>';

      h += '<div class="asm-switch-row">';
      h += '<div class="asm-switch-label">Video Article</div>';
      h += '<div class="asm-switch-state ' + (a.videoArticle ? 'on' : 'off') + '">' + (a.videoArticle ? 'on' : 'off') + '</div>';
      h += '</div>';
      if (a.videoArticle || a.videoUrl) {
        h += scRow('Video URL', a.videoUrl);
      }
      if (a.audioUrl) h += scRow('Audio URL', a.audioUrl);

      h += '</div></div>';
      return h;
    }

    // Column 3 — Editorial / metadata / CTA
    function renderCol3(a) {
      var h = '';
      h += '<div class="asm-col">';
      h += '<div class="asm-col-head"><div class="asm-col-title">Editorial</div><div class="asm-col-count">3 of 3</div></div>';
      h += '<div class="asm-col-body">';

      // Body preview
      h += '<div class="asm-sc">';
      h += '<div class="asm-sc-label">Article Body ' + (a.bodyStatus ? '<span style="color:var(--ix-text-tiny)">(status: ' + esc(a.bodyStatus) + ')</span>' : '') + '</div>';
      var plainBody = stripTagsAndTruncate(a.bodyExcerpt, 600);
      if (plainBody) {
        h += '<div class="asm-body-preview">' + esc(plainBody) + (plainBody.length >= 600 ? '\u2026' : '') + '</div>';
      } else {
        h += '<div class="asm-body-preview empty">No body content</div>';
      }
      h += '<button class="asm-body-launch" disabled>Open body editor (Phase 5)</button>';
      h += '</div>';

      // Print issue source
      h += scRow('Print Issue Source', a.printIssueSource);

      // CTA
      h += '<div class="asm-sc">';
      h += '<div class="asm-sc-label">Call-to-Action</div>';
      if (a.ctaButton || a.ctaText || a.ctaUrl) {
        var ctaBits = [];
        if (a.ctaButton) ctaBits.push('<strong>' + esc(a.ctaButton) + '</strong>');
        if (a.ctaText) ctaBits.push(esc(a.ctaText));
        if (a.ctaUrl) ctaBits.push('<span style="font-family:var(--ix-font-mono);font-size:11px;color:var(--ix-blue-deep);word-break:break-all">' + esc(a.ctaUrl) + '</span>');
        h += '<div class="asm-sc-value">' + ctaBits.join('<br>') + '</div>';
      } else {
        h += '<div class="asm-sc-value empty">No CTA set</div>';
      }
      h += '</div>';

      // IDs
      h += '<div class="asm-sc" style="opacity:0.7">';
      h += '<div class="asm-sc-label">Identifiers</div>';
      h += '<div class="asm-sc-value" style="font-family:var(--ix-font-mono);font-size:10px;line-height:1.6">';
      h += 'Article: <span style="color:var(--ix-blue-deep)">' + esc(a.id) + '</span>';
      if (a.customerId) h += '<br>Customer: <span style="color:var(--ix-text-mid)">' + esc(a.customerId) + '</span>';
      if (a.productId)  h += '<br>Product: <span style="color:var(--ix-text-mid)">' + esc(a.productId) + '</span>';
      if (a.mnlsId)     h += '<br>MNLS: <span style="color:var(--ix-text-mid)">' + esc(a.mnlsId) + '</span>';
      h += '</div></div>';

      h += '</div></div>';
      return h;
    }

    // ── Subcomponent row helper ──
    function scRow(label, value, opts) {
      opts = opts || {};
      var h = '<div class="asm-sc">';
      h += '<div class="asm-sc-label">' + esc(label) + '</div>';
      if (value) {
        h += '<div class="asm-sc-value' + (opts.multiline ? ' multiline' : '') + '">' + esc(value) + '</div>';
        if (opts.badge) h += '<div class="asm-sc-badge">' + opts.badge + '</div>';
      } else {
        h += '<div class="asm-sc-value empty">Not set</div>';
      }
      h += '</div>';
      return h;
    }

    function charCount(s, max) {
      var len = (s || '').length;
      var status = len > max ? ' (over)' : (len === 0 ? '' : '');
      return len + ' / ' + max + status;
    }

    function joinBits() {
      return Array.prototype.slice.call(arguments).filter(Boolean).join(', ');
    }

    function stripTagsAndTruncate(html, maxLen) {
      if (!html) return '';
      // Quick server-Webflow-safe tag strip
      var tmp = document.createElement('div');
      tmp.innerHTML = html;
      var txt = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
      if (txt.length > maxLen) txt = txt.substring(0, maxLen);
      return txt;
    }

    function esc(s) {
      if (s === null || s === undefined) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function buildMainImageUrl(a) {
      if (a.mainImageUrl) return a.mainImageUrl;
      if (a.mainImageUuid && CFG.uploadcareBase) {
        return CFG.uploadcareBase.replace(/\/+$/, '') + '/' + a.mainImageUuid + '/-/resize/600x/-/format/auto/-/quality/smart/';
      }
      return '';
    }

    // ── Init ──
    renderAssembler();
    console.log('\u29BE Studio v1.0.0 mounted — Phase 1 (read-only Articles)');
  });

})();
