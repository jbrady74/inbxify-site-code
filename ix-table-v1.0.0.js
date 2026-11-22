/* ix-table-v1.0.0.js
   ════════════════════════════════════════════════════════════════
   INBXIFY ix series — ONE TABLE for TA Studio, Quill and the Publisher Portal
   (TA Reskin S1, 22 Nov 2026 · scoping v1.1 §4a · the four approved table boards)

   Basis: the Portal Obligations table (ps-obligations v1.0.5 table()). Companion: ix-table-v1.0.0.css.
   Reads the ix tokens only (ix-tokens + ix-tokens-portal-look); no --ps-* and no typed colour.

   WHAT A TABLE IS (Jeff, 17 and 18 Nov)
   · A real <table>, fixed layout, column widths declared once as weights and turned into percentages. A table
     min-width (1080px by default) and a scroll box, so a narrow window scrolls the table instead of cutting it.
   · A column is on the main row only if you scan the list by it or filter by it. Everything else goes in the
     opened row (ruling 6). Nothing on a table may be cut off: every cell carries its full text as a tooltip,
     and the dense variant (tight cell padding) is for wide tables.
   · Filter row directly under the header: one button per filtered column, opening a list with its own search
     box, all in Sen (no browser-drawn select). A filter with a value gets the gold edge. One line above the
     table: the count, how many filters are on, Clear filters (which resets every filter).
   · Rows: hover; zebra (opt-in, on by default for read-only lists, ruling 8); opened. An opened row reads as an
     expansion (ruling 7): dark rule above the row and below the panel, the row bold, the detail a white card on
     the tinted band, with its own heading, facts spread across the full width, its action in the card head.
   · Status pills one fixed width (64px). Numbers right-aligned with even-width digits.
   · Pager under the table. While reading: a coral bar on the table, placeholder rows, "Reading…" with a spinner
     and the seconds.

   API
     var t = IxTable.create(rootEl, {
       id:        'newsletters',              // unique on the page
       columns: [                             // in order; w = weight (or px when fixed: true)
         { key: 'no',     label: 'No.',        w: 70,  type: 'id' },
         { key: 'name',   label: 'Newsletter', w: 470, type: 'strong', filter: true },
         { key: 'date',   label: 'Date',       w: 210, type: 'date', filter: true, sort: 'dateIso' },
         { key: 'status', label: 'Status',     w: 140, type: 'pill', filter: true },
         { key: 'sends',  label: 'Sends',      w: 150, type: 'number' },
         { key: 'open',   label: '',           w: 110, type: 'action', fixed: true,
           html: function (r) { return '<a class="ix-table-btn" href="…" target="_blank">Open ↗</a>'; } }
       ],
       rows:      [ … ],                       // plain objects; a column reads r[key] unless it gives text()/html()
       rowId:     function (r) { return r.id; },
       zebra:     true,                        // default true when no expand is given (a read-only list)
       dense:     false,
       minWidth:  1080,
       pageSize:  25,                          // 0 = no pager
       noun:      ['newsletter', 'newsletters'],
       sort:      { key: 'date', dir: 'desc' },  // starting order; columns with sortable: true get arrows
       expand:    function (r) { return IxTable.panel({ … }); },   // optional: chevron column and opened rows
       group:     function (r) { return r.customer; },               // optional: group header rows
       words:     { empty: 'No newsletters yet.', noMatch: 'No newsletters match these filters.' },
       onRender:  function (root, t) { … }    // after every draw, to wire a module's own buttons
     });
     t.setRows(rows)    t.loading(true|false)    t.clearFilters()    t.open(id)    t.state()    t.destroy()

   COLUMN TYPES: id, text, strong, number, date, pill, flag, bar, action, link, html.
     text(r)   the shown text (escaped). value(r) the value filters and sort use (defaults to text).
     html(r)   html, as given (pill, flag, bar, action, link, html). title(r) the tooltip.
     pill      r[key] or pill(r) → { name, text }: name one of live, active, ended, draft, ready, sent, comp,
               warn, fail. IxTable.pill(name, text) draws one anywhere.
     sortable: true    the header sorts on click, one arrow style (▲ ▼).

   ARMOR: the root carries ix-own (title-admin-page-design's wildcard skips it); state classes are namespaced
   (.ixtb-open, .ixtb-z, .ixtb-set …), so site rules like .open and .red cannot reach them.

   HARDCODING (provisional): HC-P-RESKIN-4 the defaults below (min-width 1080, page size 25, pill names).
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.IxTable) return;
  var VERSION = '1.0.0';
  var DEFAULTS = { minWidth: 1080, pageSize: 25 };   // HC-P-RESKIN-4
  var PILLS = { live: 1, active: 1, ended: 1, draft: 1, ready: 1, sent: 1, comp: 1, warn: 1, fail: 1 };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  var CARET = '<svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 5l4 4 4-4"></path></svg>';
  var CHEV = '<svg class="ixtb-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  function pill(name, text) {
    var n = String(name || '').toLowerCase();
    if (!PILLS[n]) n = 'draft';
    return '<span class="ix-pill ix-pill--' + n + '">' + esc(text == null ? name : text) + '</span>';
  }

  // The opened row's card: { title, sub, action (html), facts: [{ label, value | html }], body (html) }
  function panel(p) {
    p = p || {};
    var facts = p.facts || [];
    var cols = Math.max(1, Math.min(facts.length || 1, p.columns || 6));
    return '<div class="ixtb-card">' +
      '<div class="ixtb-card-h">' +
        (p.title ? '<span class="ixtb-card-t">' + esc(p.title) + '</span>' : '') +
        (p.sub ? '<span class="ixtb-card-s">' + esc(p.sub) + '</span>' : '') +
        '<span class="ixtb-sp"></span>' + (p.action || '') +
      '</div>' +
      (facts.length ? '<div class="ixtb-card-b" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">' +
        facts.map(function (f) {
          return '<div class="ixtb-fact"><div class="ixtb-fact-l">' + esc(f.label) + '</div><div class="ixtb-fact-v">' +
            (f.html != null ? f.html : esc(f.value)) + '</div></div>';
        }).join('') + '</div>' : '') +
      (p.body ? '<div class="ixtb-card-x">' + p.body + '</div>' : '') +
    '</div>';
  }

  var tables = {};

  function create(root, o) {
    if (!root) throw new Error('IxTable.create: no root element');
    o = o || {};
    var id = o.id || ('t' + Math.random().toString(36).slice(2, 8));
    if (tables[id]) tables[id].destroy();
    var cols = (o.columns || []).slice();
    if (o.expand) cols.push({ key: '__chev', label: '', w: 36, fixed: true, type: 'chev' });
    var S = {
      rows: o.rows || [], filters: {}, sort: o.sort ? { key: o.sort.key, dir: o.sort.dir || 'asc' } : null,
      page: 0, open: {}, loading: false, t0: 0, dd: null, ddQuery: ''
    };
    var zebra = o.zebra == null ? !o.expand : !!o.zebra;
    var pageSize = o.pageSize == null ? DEFAULTS.pageSize : o.pageSize;
    var noun = o.noun || ['row', 'rows'];
    var words = o.words || {};
    var rowId = o.rowId || function (r, i) { return r.id != null ? r.id : i; };
    var timer = null;

    function colByKey(k) { for (var i = 0; i < cols.length; i++) if (cols[i].key === k) return cols[i]; return null; }
    function textOf(c, r) {
      if (c.text) return c.text(r);
      var v = r[c.key];
      if (c.type === 'pill' && v && typeof v === 'object') return v.text;
      return v == null ? '' : v;
    }
    function valueOf(c, r) {
      if (c.value) return c.value(r);
      if (c.type === 'pill') { var v = c.pill ? c.pill(r) : r[c.key]; return v && typeof v === 'object' ? v.text : v; }
      return textOf(c, r);
    }
    function sortVal(c, r) {
      if (c.sortValue) return c.sortValue(r);
      if (typeof c.sort === 'string') return r[c.sort];
      var v = valueOf(c, r);
      if (c.type === 'number' && typeof v === 'string') { var n = parseFloat(v.replace(/[^\d.-]/g, '')); return isNaN(n) ? -Infinity : n; }
      return v;
    }

    function filtered() {
      var keys = Object.keys(S.filters);
      var out = S.rows.filter(function (r) {
        for (var i = 0; i < keys.length; i++) {
          var c = colByKey(keys[i]);
          if (c && String(valueOf(c, r)) !== S.filters[keys[i]]) return false;
        }
        return true;
      });
      if (S.sort) {
        var c = colByKey(S.sort.key);
        if (c) {
          var d = S.sort.dir === 'desc' ? -1 : 1;
          out = out.map(function (r, i) { return { r: r, i: i, v: sortVal(c, r) }; }).sort(function (a, b) {
            var x = a.v, y = b.v;
            if (x == null || x === '') return 1; if (y == null || y === '') return -1;
            if (typeof x === 'number' && typeof y === 'number') return (x - y) * d || a.i - b.i;
            return String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' }) * d || a.i - b.i;
          }).map(function (x) { return x.r; });
        }
      }
      return out;
    }

    function colgroup() {
      var tot = cols.reduce(function (a, c) { return a + (c.fixed ? 0 : (c.w || 100)); }, 0) || 1;
      return '<colgroup>' + cols.map(function (c) {
        return '<col style="width:' + (c.fixed ? (c.w || 36) + 'px' : ((c.w || 100) / tot * 100).toFixed(3) + '%') + '">';
      }).join('') + '</colgroup>';
    }

    function cellClass(c) {
      var k = ['ixtb-c'];
      if (c.type === 'id') k.push('ixtb-id');
      if (c.type === 'number') k.push('ixtb-num');
      if (c.type === 'action') k.push('ixtb-act');
      if (c.type === 'chev') k.push('ixtb-cv');
      if (c.type === 'date') k.push('ixtb-date');
      if (c.align === 'right') k.push('ixtb-r');
      return k.join(' ');
    }

    function cell(c, r) {
      if (c.type === 'chev') return '<td class="ixtb-c ixtb-cv">' + CHEV + '</td>';
      var html, tip = c.title ? c.title(r) : '';
      if (c.type === 'pill') {
        var p = c.pill ? c.pill(r) : r[c.key];
        if (p && typeof p === 'object') { html = pill(p.name, p.text); tip = tip || p.text; }
        else { html = p ? pill(p, p) : ''; tip = tip || p; }
      } else if (c.html) {
        html = c.html(r);
      } else {
        var t = textOf(c, r);
        tip = tip || t;
        html = c.type === 'strong' ? '<b>' + esc(t) + '</b>' : esc(t);
      }
      return '<td class="' + cellClass(c) + '"' + (tip !== '' && tip != null && c.type !== 'action' ? ' title="' + esc(tip) + '"' : '') + '>' + (html == null ? '' : html) + '</td>';
    }

    function head() {
      var h = '<thead><tr>' + cols.map(function (c) {
        var arrow = '';
        if (S.sort && S.sort.key === c.key) arrow = ' <span class="ixtb-arrow" aria-hidden="true">' + (S.sort.dir === 'desc' ? '▼' : '▲') + '</span>';
        var cls = cellClass(c).replace('ixtb-c', 'ixtb-h') + (c.sortable ? ' ixtb-sortable' : '');
        var aria = c.sortable ? ' aria-sort="' + (S.sort && S.sort.key === c.key ? (S.sort.dir === 'desc' ? 'descending' : 'ascending') : 'none') + '"' : '';
        var inner = c.sortable ? '<button type="button" class="ixtb-sort" data-ixtb-sort="' + esc(c.key) + '">' + esc(c.label) + arrow + '</button>' : esc(c.label);
        return '<th class="' + cls + '" scope="col"' + aria + (c.tip ? ' title="' + esc(c.tip) + '"' : '') + '>' + inner + '</th>';
      }).join('') + '</tr>';
      if (cols.some(function (c) { return c.filter; })) {
        h += '<tr class="ixtb-frow">' + cols.map(function (c) {
          if (!c.filter) return '<td></td>';
          var v = S.filters[c.key];
          return '<td><button type="button" class="ixtb-fb' + (v != null ? ' ixtb-set' : '') + '" data-ixtb-f="' + esc(c.key) + '" aria-haspopup="listbox" aria-label="Filter ' + esc(c.label) + '">' +
            '<span>' + esc(v != null ? v : 'All') + '</span>' + CARET + '</button></td>';
        }).join('') + '</tr>';
      }
      return h + '</thead>';
    }

    function body(list) {
      var n = cols.length;
      if (S.loading) {
        var k = Math.max(4, Math.min(pageSize || 8, 8)), ph = '';
        for (var i = 0; i < k; i++) {
          ph += '<tr class="ixtb-ph">' + cols.map(function (c, j) {
            var w = c.type === 'chev' ? 0 : 40 + ((i * 7 + j * 13) % 45);
            return '<td class="' + cellClass(c) + '">' + (w ? '<span class="ixtb-bar" style="width:' + w + '%"></span>' : '') + '</td>';
          }).join('') + '</tr>';
        }
        return '<tbody>' + ph + '</tbody>';
      }
      if (!S.rows.length) return '<tbody><tr class="ixtb-empty"><td colspan="' + n + '">' + esc(words.empty || ('No ' + noun[1] + ' yet.')) + '</td></tr></tbody>';
      if (!list.length) return '<tbody><tr class="ixtb-empty"><td colspan="' + n + '">' + esc(words.noMatch || ('No ' + noun[1] + ' match these filters.')) + '</td></tr></tbody>';
      var start = pageSize ? S.page * pageSize : 0;
      var page = pageSize ? list.slice(start, start + pageSize) : list;
      var h = '<tbody>', z = 0, lastGroup = {};
      page.forEach(function (r, i) {
        var rid = String(rowId(r, start + i));
        if (o.group) {
          var g = o.group(r);
          if (g !== lastGroup.v) { lastGroup.v = g; z = 0; h += '<tr class="ixtb-group"><td colspan="' + n + '">' + esc(o.groupLabel ? o.groupLabel(g, r) : g) + '</td></tr>'; }
        }
        var open = !!S.open[rid];
        var cls = 'ixtb-row' + (zebra && z % 2 ? ' ixtb-z' : '') + (open ? ' ixtb-open' : '') + (o.expand ? ' ixtb-x' : '');
        z++;
        h += '<tr class="' + cls + '" data-ixtb-row="' + esc(rid) + '"' + (o.expand ? ' tabindex="0" aria-expanded="' + open + '"' : '') + '>' +
          cols.map(function (c) { return cell(c, r); }).join('') + '</tr>';
        if (open && o.expand) h += '<tr class="ixtb-sub"><td colspan="' + n + '">' + o.expand(r) + '</td></tr>';
      });
      return h + '</tbody>';
    }

    function bar(list) {
      var nf = Object.keys(S.filters).length;
      var count = S.loading ? '<span class="ixtb-reading"><span class="ixtb-spin" aria-hidden="true"></span><span class="ixtb-secs">Reading… ' + Math.floor((Date.now() - S.t0) / 1000) + 's</span></span>'
        : '<span>' + (nf ? list.length.toLocaleString() + ' of ' : '') + S.rows.length.toLocaleString() + ' ' + esc(S.rows.length === 1 ? noun[0] : noun[1]) + '</span>';
      return '<div class="ixtb-tbar">' + count + '<span class="ixtb-sp"></span>' +
        (nf ? '<span>' + nf + ' filter' + (nf === 1 ? '' : 's') + ' on</span><button type="button" class="ixtb-clear" data-ixtb-clear="1">Clear filters</button>' : '') +
        '</div>';
    }

    function pager(list) {
      if (!pageSize || S.loading) return '';
      var total = list.length, from = total ? S.page * pageSize + 1 : 0, to = Math.min(total, (S.page + 1) * pageSize);
      return '<div class="ixtb-pager"><span>' + from.toLocaleString() + ' to ' + to.toLocaleString() + ' of ' + total.toLocaleString() + '</span><span class="ixtb-sp"></span>' +
        '<span>' + pageSize + ' per page</span>' +
        '<button type="button" class="ix-table-btn" data-ixtb-page="-1"' + (S.page <= 0 ? ' disabled' : '') + '>Previous</button>' +
        '<button type="button" class="ix-table-btn" data-ixtb-page="1"' + (to >= total ? ' disabled' : '') + '>Next</button></div>';
    }

    function dropdown() {
      if (!S.dd) return '';
      var c = colByKey(S.dd);
      if (!c) return '';
      var seen = {}, vals = [];
      S.rows.forEach(function (r) { var v = String(valueOf(c, r)); if (v !== '' && !seen[v]) { seen[v] = 1; vals.push(v); } });
      vals.sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }); });
      var q = S.ddQuery.toLowerCase(), cur = S.filters[c.key];
      var items = [{ v: null, t: 'All' }].concat(vals.map(function (v) { return { v: v, t: v }; }))
        .filter(function (x) { return x.v == null || !q || x.t.toLowerCase().indexOf(q) > -1; });
      return '<div class="ixtb-dd" role="listbox" aria-label="Filter ' + esc(c.label) + '">' +
        '<input type="text" class="ixtb-dd-q" value="' + esc(S.ddQuery) + '" placeholder="Search ' + esc(String(c.label).toLowerCase()) + '" aria-label="Search ' + esc(c.label) + '">' +
        '<div class="ixtb-dd-list">' + items.map(function (x) {
          var on = (x.v == null && cur == null) || (x.v != null && x.v === cur);
          return '<div class="ixtb-dd-i' + (on ? ' ixtb-on' : '') + '" role="option" aria-selected="' + on + '" tabindex="-1" data-ixtb-v="' + (x.v == null ? '' : esc(x.v)) + '" data-ixtb-all="' + (x.v == null ? 1 : 0) + '">' +
            '<span>' + esc(x.t) + '</span>' + (on ? '<span aria-hidden="true">✓</span>' : '') + '</div>';
        }).join('') + (items.length === 1 && q ? '<div class="ixtb-dd-none">Nothing matches</div>' : '') + '</div></div>';
    }

    function draw() {
      var list = filtered();
      if (pageSize && S.page * pageSize >= list.length) S.page = Math.max(0, Math.ceil(list.length / pageSize) - 1);
      var hasFilters = cols.some(function (c) { return c.filter; });
      var focusQ = S.dd && document.activeElement && document.activeElement.classList.contains('ixtb-dd-q');
      var caret = focusQ ? document.activeElement.selectionStart : null;
      root.innerHTML = '<div class="ix-table-wrap ix-own" data-ixtb="' + esc(id) + '">' +
        (hasFilters || S.loading ? bar(list) : '') +
        '<div class="ix-table-box' + (o.dense ? ' ix-table--dense' : '') + (zebra ? ' ix-table--zebra' : '') + (S.loading ? ' ixtb-loading' : '') + '">' +
          '<div class="ixtb-scroll"><table class="ix-table" style="min-width:' + (o.minWidth || DEFAULTS.minWidth) + 'px">' + colgroup() + head() + body(list) + '</table></div>' +
          (S.loading ? '<div class="ixtb-readbar" aria-hidden="true"><i></i></div>' : '') +
          pager(list) +
        '</div>' + dropdown() + '</div>';
      if (S.loading) {   // the bar sits on the table, under the header and the filter row (the board)
        var th = root.querySelector('.ix-table thead'), rb = root.querySelector('.ixtb-readbar');
        if (th && rb) rb.style.top = th.offsetHeight + 'px';
      }
      if (S.dd) placeDropdown(focusQ, caret);
      if (typeof o.onRender === 'function') { try { o.onRender(root, api); } catch (e) { console.error('[IxTable] onRender', e); } }
    }

    function placeDropdown(focusQ, caret) {
      var wrap = root.querySelector('.ix-table-wrap'), dd = root.querySelector('.ixtb-dd');
      var fb = root.querySelector('[data-ixtb-f="' + (window.CSS && CSS.escape ? CSS.escape(S.dd) : S.dd) + '"]');
      if (!wrap || !dd || !fb) return;
      var w = wrap.getBoundingClientRect(), b = fb.getBoundingClientRect();
      var left = Math.min(b.left - w.left, w.width - dd.offsetWidth);
      dd.style.left = Math.max(0, Math.round(left)) + 'px';
      dd.style.top = Math.round(b.bottom - w.top + 4) + 'px';
      var q = dd.querySelector('.ixtb-dd-q');
      if (q) { q.focus(); if (focusQ && caret != null) q.setSelectionRange(caret, caret); }
    }

    // ── events, delegated on the root (survive every redraw) ──
    function onClick(e) {
      var t = e.target;
      var f = t.closest('[data-ixtb-f]');
      if (f) { e.preventDefault(); var k = f.getAttribute('data-ixtb-f'); S.dd = S.dd === k ? null : k; S.ddQuery = ''; draw(); return; }
      var it = t.closest('.ixtb-dd-i');
      if (it) {
        e.preventDefault();
        if (it.getAttribute('data-ixtb-all') === '1') delete S.filters[S.dd]; else S.filters[S.dd] = it.getAttribute('data-ixtb-v');
        S.dd = null; S.page = 0; draw(); return;
      }
      if (t.closest('.ixtb-dd')) return;
      if (S.dd) { S.dd = null; draw(); }
      if (t.closest('[data-ixtb-clear]')) { e.preventDefault(); S.filters = {}; S.page = 0; draw(); return; }
      var sb = t.closest('[data-ixtb-sort]');
      if (sb) {
        var key = sb.getAttribute('data-ixtb-sort');
        S.sort = S.sort && S.sort.key === key ? { key: key, dir: S.sort.dir === 'asc' ? 'desc' : 'asc' } : { key: key, dir: 'asc' };
        S.page = 0; draw(); return;
      }
      var pg = t.closest('[data-ixtb-page]');
      if (pg) { e.preventDefault(); if (!pg.disabled) { S.page += +pg.getAttribute('data-ixtb-page'); draw(); } return; }
      if (!o.expand) return;
      if (t.closest('a, button, input, select, textarea, label, [data-ixtb-keep]')) return;
      var row = t.closest('[data-ixtb-row]');
      if (row) toggle(row.getAttribute('data-ixtb-row'));
    }
    function onInput(e) {
      if (!e.target.classList.contains('ixtb-dd-q')) return;
      S.ddQuery = e.target.value; draw();
    }
    function onKey(e) {
      if (e.key === 'Escape' && S.dd) { var k = S.dd; S.dd = null; draw(); var b = root.querySelector('[data-ixtb-f="' + k + '"]'); if (b) b.focus(); return; }
      if (S.dd && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        var items = Array.prototype.slice.call(root.querySelectorAll('.ixtb-dd-i'));
        var i = items.indexOf(document.activeElement);
        var n = e.key === 'ArrowDown' ? Math.min(items.length - 1, i + 1) : Math.max(0, i - 1);
        if (items[n]) { e.preventDefault(); items[n].focus(); }
        return;
      }
      if (e.key === 'Enter') {
        if (document.activeElement && document.activeElement.classList.contains('ixtb-dd-i')) { e.preventDefault(); document.activeElement.click(); return; }
        if (S.dd && document.activeElement && document.activeElement.classList.contains('ixtb-dd-q')) {
          var first = root.querySelectorAll('.ixtb-dd-i')[root.querySelectorAll('.ixtb-dd-i').length > 1 ? 1 : 0];
          if (first) { e.preventDefault(); first.click(); }
          return;
        }
        var row = e.target.closest && e.target.closest('[data-ixtb-row]');
        if (row && e.target === row && o.expand) { e.preventDefault(); toggle(row.getAttribute('data-ixtb-row')); }
      }
    }
    function onDoc(e) { if (S.dd && !root.contains(e.target)) { S.dd = null; draw(); } }

    function toggle(rid) {
      rid = String(rid);
      var now = !S.open[rid];
      if (o.single !== false) S.open = {};
      if (now) S.open[rid] = 1; else delete S.open[rid];
      draw();
      var row = root.querySelector('[data-ixtb-row="' + (window.CSS && CSS.escape ? CSS.escape(rid) : rid) + '"]');
      if (row) row.focus({ preventScroll: true });
      if (typeof o.onOpen === 'function') o.onOpen(rid, now);
    }

    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('keydown', onKey);
    document.addEventListener('click', onDoc, true);

    var api = {
      id: id,
      setRows: function (rows) { S.rows = rows || []; S.loading = false; clearInterval(timer); draw(); return api; },
      loading: function (on) {
        S.loading = !!on;
        clearInterval(timer);
        if (on) {
          S.t0 = Date.now();
          timer = setInterval(function () { var s = root.querySelector('.ixtb-secs'); if (s) s.textContent = 'Reading… ' + Math.floor((Date.now() - S.t0) / 1000) + 's'; }, 250);
        }
        draw(); return api;
      },
      clearFilters: function () { S.filters = {}; S.page = 0; draw(); return api; },
      setFilter: function (key, v) { if (v == null) delete S.filters[key]; else S.filters[key] = String(v); S.page = 0; draw(); return api; },
      open: function (rid) { if (!S.open[String(rid)]) toggle(rid); return api; },
      redraw: function () { draw(); return api; },
      state: function () { return { filters: JSON.parse(JSON.stringify(S.filters)), sort: S.sort, page: S.page, open: Object.keys(S.open), loading: S.loading }; },
      destroy: function () {
        clearInterval(timer);
        root.removeEventListener('click', onClick); root.removeEventListener('input', onInput); root.removeEventListener('keydown', onKey);
        document.removeEventListener('click', onDoc, true);
        delete tables[id];
      }
    };
    tables[id] = api;
    draw();
    return api;
  }

  window.IxTable = { version: VERSION, create: create, pill: pill, panel: panel, esc: esc, get: function (id) { return tables[id]; } };
  try { console.log('[IxTable] v' + VERSION + ' loaded'); } catch (e) {}
})();
