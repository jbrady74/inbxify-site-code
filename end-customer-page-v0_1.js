/* ============================================================
   end-customer-page-v0.1.js
   INBXIFY — End-Customers template page: action bar (interim)

   The Add Client flow (client-manager v1.0.20) auto-redirects here
   after create. The full Customer Page design is mocked but NOT yet
   built (customer-page-mockup-v0_1.html) — this file exists only so
   the landing isn't a dead end: it injects an action bar at the top
   of the page with the two working exits Jeff specified:

     1A  "Open in Title-Admin" — one button if the customer works
         with a single T-A; a dropdown if several.
     1B  "Generate Ad" — deep-links to the T-A page's Studio Generate
         tab with the customer stashed
         (/title-admin/{slug}?adgenCust={id}&adgenName={name} —
         consumed by client-manager v1.0.20's deep-link handler).

   REQUIRED WEBFLOW SETUP on the End-Customers template page
   (multi-tenant — all values come from CMS bindings, nothing
   hardcoded):

     1. An embed (anywhere on the page):
          <div id="ixcp-data"
               data-cust-id=""     ← bind: This Item ID
               data-cust-name="">  ← bind: Name
          </div>

     2. A hidden collection list bound to the customer's
        associated TITLES-ADMIN reference(s); on each Collection
        Item, a div:
          <div class="ixcp-ta"
               data-ta-slug=""     ← bind: TITLES-ADMIN Slug
               data-ta-name="">    ← bind: TITLES-ADMIN Name
          </div>

   With zero .ixcp-ta rows the T-A control hides itself (and warns
   in console) rather than rendering a broken link.
   ============================================================ */
(function () {
  'use strict';

  function init() {
    var dataEl = document.getElementById('ixcp-data');
    if (!dataEl) { console.warn('[CUST PAGE] #ixcp-data embed missing — action bar not rendered.'); return; }
    var custId = dataEl.getAttribute('data-cust-id') || '';
    var custName = dataEl.getAttribute('data-cust-name') || '';

    var tas = [];
    document.querySelectorAll('.ixcp-ta').forEach(function (el) {
      var slug = el.getAttribute('data-ta-slug');
      var name = el.getAttribute('data-ta-name') || slug;
      if (slug) tas.push({ slug: slug, name: name });
    });

    var bar = document.createElement('div');
    bar.className = 'ixcp-bar';

    // ── 1A: Title-Admin exit ──
    if (tas.length === 1) {
      var a = document.createElement('a');
      a.className = 'ixcp-btn ixcp-btn--ghost';
      a.href = '/title-admin/' + tas[0].slug;
      a.textContent = 'Open in ' + tas[0].name;
      bar.appendChild(a);
    } else if (tas.length > 1) {
      var wrap = document.createElement('div');
      wrap.className = 'ixcp-dd';
      var toggle = document.createElement('button');
      toggle.className = 'ixcp-btn ixcp-btn--ghost';
      toggle.textContent = 'Open in Title-Admin \u25be';
      var menu = document.createElement('div');
      menu.className = 'ixcp-dd-menu';
      tas.forEach(function (t) {
        var item = document.createElement('a');
        item.className = 'ixcp-dd-item';
        item.href = '/title-admin/' + t.slug;
        item.textContent = t.name;
        menu.appendChild(item);
      });
      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        menu.classList.toggle('open');
      });
      document.addEventListener('click', function () { menu.classList.remove('open'); });
      wrap.appendChild(toggle);
      wrap.appendChild(menu);
      bar.appendChild(wrap);
    } else {
      console.warn('[CUST PAGE] No .ixcp-ta rows found — is the hidden TITLES-ADMIN collection list on the page?');
    }

    // ── 1B: Generate Ad deep link ──
    // Target T-A: the single associated one, or the first in the list
    // (the dropdown remains the way to reach the others).
    if (tas.length > 0 && custId) {
      var gen = document.createElement('a');
      gen.className = 'ixcp-btn ixcp-btn--primary';
      gen.href = '/title-admin/' + tas[0].slug +
        '?adgenCust=' + encodeURIComponent(custId) +
        '&adgenName=' + encodeURIComponent(custName);
      gen.textContent = 'Generate Ad';
      bar.appendChild(gen);
    }

    if (bar.children.length) document.body.insertBefore(bar, document.body.firstChild);

    // styles (inline-injected; ix palette)
    var css = document.createElement('style');
    css.textContent = [
      '.ixcp-bar{position:sticky;top:0;z-index:9000;display:flex;gap:10px;justify-content:flex-end;align-items:center;',
      'padding:10px 22px;background:#1a3a3a;border-bottom:2px solid #c4a35a}',
      '.ixcp-btn{font-family:"DM Mono",monospace;font-size:11px;letter-spacing:.05em;text-transform:uppercase;',
      'padding:8px 16px;border-radius:4px;text-decoration:none;cursor:pointer;border:1.5px solid transparent;transition:all .15s}',
      '.ixcp-btn--primary{background:#c4a35a;color:#1a3a3a;font-weight:700}',
      '.ixcp-btn--primary:hover{background:#d4b56e}',
      '.ixcp-btn--ghost{background:transparent;color:#faf9f5;border-color:#faf9f5}',
      '.ixcp-btn--ghost:hover{border-color:#c4a35a;color:#c4a35a}',
      '.ixcp-dd{position:relative}',
      '.ixcp-dd-menu{display:none;position:absolute;right:0;top:calc(100% + 6px);background:#fff;border:1.5px solid #1a3a3a;',
      'border-radius:5px;min-width:220px;box-shadow:0 6px 18px rgba(0,0,0,.18);overflow:hidden}',
      '.ixcp-dd-menu.open{display:block}',
      '.ixcp-dd-item{display:block;padding:10px 14px;font-family:"DM Sans",sans-serif;font-size:13px;color:#1a3a3a;text-decoration:none}',
      '.ixcp-dd-item:hover{background:#faf5e8}'
    ].join('');
    document.head.appendChild(css);

    console.log('\u2699 [CUST PAGE v0.1] action bar rendered \u2014 ' + tas.length + ' T-A link(s)' + (custId ? ', Generate Ad live' : ', no cust id (Generate Ad hidden)'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
