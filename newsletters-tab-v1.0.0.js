/* ============================================================
   INBXIFY — Newsletters Tab
   newsletters-tab-v1.0.0.js
   Mounts into: .tab-pane-newsletters on TITLES-ADMIN page

   DATA SOURCE:
     Hidden collection list: .newsletter-source .w-dyn-items
     Each .w-dyn-item contains a div with data-nl-* attributes
     plus denormalized FA/TS/BA/TF/EV fields.

   DATA CONTRACT (49 attributes on inner div):
     Core (8):  data-nl-id, data-nl-slug, data-nl-issue-no,
                data-nl-date, data-nl-status, data-nl-name,
                data-nl-pubplan-id, data-nl-send-volume
     FA (8):    data-title-fa1..4, data-customer-fa1..4
     TS (8):    data-title-ts1..4, data-customer-ts1..4
     BA (12):   data-image-ba1..12
     TXA (7):   data-txa-category, data-txa-customer-lbp,
                data-txa-customer-txa1..5
     EV (4):    data-event-name-1..4

   NAVIGATION:
     Card click → /newsletters/{data-nl-slug}
   ============================================================ */

(function () {
  'use strict';

  /* ── Constants ── */
  var INITIAL_SHOW = 4;
  var BATCH_SIZE = 4;
  var MOUNT_SEL = '.tab-pane-newsletters';
  var SOURCE_SEL = '.newsletter-source .w-dyn-items';

  /* ── Status pill map ── */
  var STATUS_MAP = {
    'draft':            { label: 'Draft',    cls: 'nl-pill-draft' },
    'building':         { label: 'Building', cls: 'nl-pill-building' },
    'in assembly':      { label: 'Building', cls: 'nl-pill-building' },
    'ready to publish': { label: 'RTP',      cls: 'nl-pill-rtp' },
    'rtp':              { label: 'RTP',      cls: 'nl-pill-rtp' },
    'live':             { label: 'Live',     cls: 'nl-pill-live' },
    'sent':             { label: 'Sent',     cls: 'nl-pill-sent' },
    'published':        { label: 'Sent',     cls: 'nl-pill-sent' }
  };

  /* ── Utility ── */
  function esc(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getAttr(el, key) {
    var val = el.getAttribute(key);
    return (val && val.trim()) ? val.trim() : '';
  }

  /* ── Read newsletter data from DOM ── */
  function readNewsletters() {
    var container = document.querySelector(SOURCE_SEL);
    if (!container) return [];

    var items = container.querySelectorAll('.w-dyn-item');
    var newsletters = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      // Find the inner div with data-nl-id (the bound div)
      var el = item.querySelector('div[data-nl-id]');
      if (!el) {
        // Fallback: try first child div
        el = item.querySelector('div');
      }
      if (!el) continue;

      var nl = {
        id:         getAttr(el, 'data-nl-id'),
        slug:       getAttr(el, 'data-nl-slug'),
        issueNo:    getAttr(el, 'data-nl-issue-no'),
        date:       getAttr(el, 'data-nl-date'),
        status:     getAttr(el, 'data-nl-status'),
        name:       getAttr(el, 'data-nl-name'),
        pubplanId:  getAttr(el, 'data-nl-pubplan-id'),
        sendVolume: getAttr(el, 'data-nl-send-volume'),
        fa: [],
        ts: [],
        ba: [],
        ev: [],
        txa: {
          category:    getAttr(el, 'data-txa-category'),
          customerLbp: getAttr(el, 'data-txa-customer-lbp'),
          customers:   []
        }
      };

      // FA slots 1-4
      for (var f = 1; f <= 4; f++) {
        var title = getAttr(el, 'data-title-fa' + f);
        var cust  = getAttr(el, 'data-customer-fa' + f);
        nl.fa.push({ title: title, customer: cust });
      }

      // TS slots 1-4
      for (var t = 1; t <= 4; t++) {
        var tsTitle = getAttr(el, 'data-title-ts' + t);
        var tsCust  = getAttr(el, 'data-customer-ts' + t);
        nl.ts.push({ title: tsTitle, customer: tsCust });
      }

      // BA slots 1-12
      for (var b = 1; b <= 12; b++) {
        nl.ba.push(getAttr(el, 'data-image-ba' + b));
      }

      // Events 1-4
      for (var e = 1; e <= 4; e++) {
        var evName = getAttr(el, 'data-event-name-' + e);
        nl.ev.push(evName);
      }

      // TXA customers 1-5
      for (var x = 1; x <= 5; x++) {
        nl.txa.customers.push(getAttr(el, 'data-txa-customer-txa' + x));
      }

      newsletters.push(nl);
    }

    // Sort by issue number descending (latest first)
    newsletters.sort(function (a, b) {
      var aNum = parseInt(a.issueNo, 10) || 0;
      var bNum = parseInt(b.issueNo, 10) || 0;
      return bNum - aNum;
    });

    return newsletters;
  }

  /* ── Resolve status pill ── */
  function getStatusPill(status) {
    var key = (status || '').toLowerCase().trim();
    var match = STATUS_MAP[key];
    if (match) return match;
    // Fallback: check partial matches
    for (var k in STATUS_MAP) {
      if (key.indexOf(k) !== -1) return STATUS_MAP[k];
    }
    return { label: status || '—', cls: 'nl-pill-draft' };
  }

  /* ── Render FA or TS column ── */
  function renderArticleSlots(slots, prefix, dotClass, label) {
    var html = '<div class="nl-sec-label"><span class="nl-dot ' + dotClass + '"></span>' + esc(label) + '</div>';

    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      if (s.title) {
        html += '<div class="nl-art-row">';
        html += '<div class="nl-art-info">';
        html += '<div class="nl-art-title">' + esc(s.title) + '</div>';
        if (s.customer) {
          html += '<div class="nl-art-customer">' + esc(s.customer) + '</div>';
        }
        html += '</div></div>';
      } else {
        html += '<div class="nl-empty-slot">&mdash; ' + prefix + '-' + (i + 1) + ' open &mdash;</div>';
      }
    }

    return html;
  }

  /* ── Render The Find section ── */
  function renderTheFind(txa) {
    var html = '<div class="nl-sec-label"><span class="nl-dot nl-dot-tf"></span>The find</div>';

    if (!txa.category) {
      html += '<div class="nl-empty-slot">&mdash; not assigned &mdash;</div>';
      return html;
    }

    // Determine LBP vs TXA
    var catLower = txa.category.toLowerCase();
    var isLbp = catLower.indexOf('local business profile') !== -1;

    if (isLbp) {
      html += '<div class="nl-tf-type">LBP &mdash; Local Business Profile</div>';
      if (txa.customerLbp) {
        html += '<div class="nl-tf-customer">' + esc(txa.customerLbp) + '</div>';
      }
    } else {
      // Extract category name after "The Find | "
      var catName = txa.category;
      var pipeIdx = catName.indexOf('|');
      if (pipeIdx !== -1) {
        catName = catName.substring(pipeIdx + 1).trim();
      }

      // Count filled TXA customers
      var filledCount = 0;
      for (var i = 0; i < txa.customers.length; i++) {
        if (txa.customers[i]) filledCount++;
      }

      html += '<div class="nl-tf-type">TXA &mdash; ' + esc(catName) + ' (' + filledCount + ')</div>';
      for (var j = 0; j < txa.customers.length; j++) {
        if (txa.customers[j]) {
          html += '<div class="nl-tf-customer">' + esc(txa.customers[j]) + '</div>';
        }
      }
    }

    return html;
  }

  /* ── Render Banner Ads section ── */
  function renderBannerAds(baImages) {
    var html = '<div class="nl-sec-label"><span class="nl-dot nl-dot-ba"></span>Banner ads</div>';
    html += '<div class="nl-ba-grid">';

    for (var i = 0; i < baImages.length; i++) {
      var img = baImages[i];
      if (img) {
        html += '<div class="nl-ba-thumb"><img src="' + esc(img) + '" alt="BA-' + (i + 1) + '" loading="lazy"></div>';
      } else {
        html += '<div class="nl-ba-thumb"><span class="nl-ba-thumb-empty">BA-' + (i + 1) + '</span></div>';
      }
    }

    html += '</div>';
    return html;
  }

  /* ── Render Events section ── */
  function renderEvents(events) {
    var html = '<div class="nl-sec-label"><span class="nl-dot nl-dot-ev"></span>Events</div>';
    var hasAny = false;

    for (var i = 0; i < events.length; i++) {
      if (events[i]) {
        hasAny = true;
        html += '<div class="nl-ev-row"><span class="nl-ev-name">' + esc(events[i]) + '</span></div>';
      }
    }

    if (!hasAny) {
      html += '<div class="nl-empty-slot">&mdash; no events &mdash;</div>';
    }

    return html;
  }

  /* ── Render single card ── */
  function renderCard(nl) {
    var pill = getStatusPill(nl.status);

    // Check if any BA images exist in slots 7-12 to determine if we show 6 or 12
    var hasSecondHalf = false;
    for (var b = 6; b < 12; b++) {
      if (nl.ba[b]) { hasSecondHalf = true; break; }
    }
    var baToShow = hasSecondHalf ? nl.ba : nl.ba.slice(0, 6);

    var html = '';
    html += '<div class="nl-card" data-nl-card-id="' + esc(nl.id) + '" data-nl-slug="' + esc(nl.slug) + '">';

    // Header
    html += '<div class="nl-card-head">';
    html += '<span class="nl-card-issue">Issue #' + esc(nl.issueNo) + '</span>';
    html += '<span class="nl-card-date">' + esc(nl.date) + '</span>';
    html += '<span class="nl-card-spacer"></span>';
    html += '<span class="nl-pill ' + pill.cls + '">' + esc(pill.label) + '</span>';
    html += '</div>';

    // Body
    html += '<div class="nl-card-body">';

    // Row 1: FA | TS
    html += '<div class="nl-section">';
    html += renderArticleSlots(nl.fa, 'FA', 'nl-dot-fa', 'Feature articles');
    html += '</div>';
    html += '<div class="nl-section">';
    html += renderArticleSlots(nl.ts, 'TS', 'nl-dot-ts', 'Themed spotlights');
    html += '</div>';

    // Row 2: The Find | Banner Ads
    html += '<div class="nl-section nl-section-row2">';
    html += renderTheFind(nl.txa);
    html += '</div>';
    html += '<div class="nl-section nl-section-row2">';
    html += renderBannerAds(baToShow);
    html += '</div>';

    // Row 3 (full width): Events
    html += '<div class="nl-section-full">';
    html += renderEvents(nl.ev);
    html += '</div>';

    html += '</div>'; // end body

    // Footer
    html += '<div class="nl-card-foot">';
    html += '<div class="nl-perf">';

    if (nl.sendVolume) {
      var vol = parseInt(nl.sendVolume, 10);
      var volStr = vol >= 1000 ? (vol / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : vol.toString();
      html += '<span class="nl-perf-item">Sends: <span class="nl-perf-val">' + volStr + '</span></span>';
    } else {
      html += '<span class="nl-perf-item">Sends: <span class="nl-perf-val">&mdash;</span></span>';
    }

    html += '</div></div>';

    html += '</div>'; // end card
    return html;
  }

  /* ── Main render ── */
  function render() {
    var mount = document.querySelector(MOUNT_SEL);
    if (!mount) return;

    var newsletters = readNewsletters();

    // Build the root container
    var root = mount.querySelector('.nl-tab-root');
    if (!root) {
      root = document.createElement('div');
      root.className = 'nl-tab-root';
      mount.appendChild(root);
    }

    if (!newsletters.length) {
      root.innerHTML =
        '<div class="nl-tab-header">' +
          '<div class="nl-tab-header-left">' +
            '<div class="nl-tab-icon">NL</div>' +
            '<div><div class="nl-tab-title">Newsletters</div>' +
            '<div class="nl-tab-subtitle">All issues</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="nl-empty-state">' +
          '<div class="nl-empty-state-icon">📭</div>' +
          '<div class="nl-empty-state-text">No newsletters found</div>' +
        '</div>';
      return;
    }

    var html = '';

    // Header
    html += '<div class="nl-tab-header">';
    html += '<div class="nl-tab-header-left">';
    html += '<div class="nl-tab-icon">NL</div>';
    html += '<div><div class="nl-tab-title">Newsletters</div>';
    html += '<div class="nl-tab-subtitle">' + newsletters.length + ' issues &middot; latest first</div></div>';
    html += '</div>';
    html += '</div>';

    // Card list
    html += '<div class="nl-card-list" id="nl-card-list">';

    var showCount = Math.min(INITIAL_SHOW, newsletters.length);
    for (var i = 0; i < showCount; i++) {
      html += renderCard(newsletters[i]);
    }

    html += '</div>';

    // Show more button
    if (newsletters.length > INITIAL_SHOW) {
      html += '<div class="nl-show-more-wrap" id="nl-show-more-wrap">';
      html += '<button class="nl-show-more-btn" id="nl-show-more-btn">';
      html += 'Show more (' + (newsletters.length - INITIAL_SHOW) + ' remaining)';
      html += '</button>';
      html += '</div>';
    }

    root.innerHTML = html;

    // Store state for show-more
    root._nlData = newsletters;
    root._nlShown = showCount;

    // Bind events
    bindCardClicks(root);
    bindShowMore(root);
  }

  /* ── Card click → navigate to newsletter page ── */
  function bindCardClicks(root) {
    var cards = root.querySelectorAll('.nl-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener('click', handleCardClick);
    }
  }

  function handleCardClick(e) {
    // Don't navigate if clicking inside a button or link
    if (e.target.closest('button') || e.target.closest('a')) return;

    var card = e.currentTarget;
    var slug = card.getAttribute('data-nl-slug');
    if (slug) {
      window.location.href = '/newsletters/' + slug;
    }
  }

  /* ── Show more pagination ── */
  function bindShowMore(root) {
    var btn = root.querySelector('#nl-show-more-btn');
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();

      var newsletters = root._nlData;
      var shown = root._nlShown;
      var list = root.querySelector('#nl-card-list');
      var wrap = root.querySelector('#nl-show-more-wrap');

      if (!newsletters || !list) return;

      var nextBatch = Math.min(shown + BATCH_SIZE, newsletters.length);
      var fragment = '';

      for (var i = shown; i < nextBatch; i++) {
        fragment += renderCard(newsletters[i]);
      }

      // Append new cards
      var temp = document.createElement('div');
      temp.innerHTML = fragment;
      while (temp.firstChild) {
        var newCard = temp.firstChild;
        list.appendChild(newCard);
        newCard.addEventListener('click', handleCardClick);
      }

      root._nlShown = nextBatch;

      // Update or remove show-more button
      var remaining = newsletters.length - nextBatch;
      if (remaining <= 0) {
        if (wrap) wrap.style.display = 'none';
      } else {
        btn.textContent = 'Show more (' + remaining + ' remaining)';
      }
    });
  }

  /* ── Init ── */
  function init() {
    // Wait for DOM to be ready and collection lists to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        // Small delay to ensure Webflow CMS lists have rendered
        setTimeout(render, 200);
      });
    } else {
      setTimeout(render, 200);
    }
  }

  init();

})();
