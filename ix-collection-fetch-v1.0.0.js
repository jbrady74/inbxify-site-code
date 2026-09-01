/* ix-collection-fetch-v1.0.0.js
   ============================================================
   ix-collection-fetch-v1.0.0.js
   INBXIFY ix-series — ONE paging loop for every collection read.

   ── WHY THIS EXISTS ──

   Every surface that reads a CMS collection through a Make webhook
   has written its own paging, or forgotten to. The results so far:

     content-library    makeListAssets       paged correctly, by hand
     client-manager     112_IBX_getBusiness… whole-collection fetch
     ta-cadence-board   makeListNlBlocks     offset=0&limit=100, NO LOOP

   The third is a live under-report. Past row 100 the Cadence Board
   cannot see placement at all, and every asset beyond that boundary
   reads as unplaced. The same bug will appear in the next surface
   that needs a list, because there is nothing to reuse.

   Webflow's v2 List Items endpoint returns at most 100 rows per
   call. That is not a limit any single surface gets to opt out of,
   so it should be solved once, here, and consumed by class.

   ── WHAT IT DOES NOT DO ──

   It does not filter by reference server-side, because Webflow v2
   cannot. Callers still filter client-side after the fetch. That
   constraint is architectural and is tracked separately (TD-PAG);
   this file only guarantees you receive ALL the rows before you
   filter them.

   ── RESPONSE SHAPES ──

   The scenarios have returned at least four shapes across their
   lives. ta-cadence-board tolerates three of them; that tolerance
   is preserved here rather than tidied away, because tidying it
   means a silent empty read the next time a scenario is edited.

     { items: [...] }            { items: { items: [...] } }
     { nlblocks: [...] }         { nlblocks: { items: [...] } }
     [...]                       { assets: [...] }

   ── USE ──

     IXFetch.all(url).then(function (rows) { ... });

     IXFetch.all(url, {
       pageSize: 100,          // Webflow's ceiling; rarely change it
       maxPages: 50,           // hard stop; see SAFETY below
       onPage:   function (rows, pageNo, total) { ... },
       signal:   abortController.signal
     })

   ── SAFETY ──

   maxPages exists because an endpoint that ignores `offset` would
   otherwise loop forever, returning the same first page. If the cap
   is reached the promise still RESOLVES with what was gathered and
   sets `.truncated = true` on the returned array. A caller showing
   an "Available" filter MUST check that flag — a truncated read is
   exactly the condition that makes a used asset look free.
   ============================================================ */
(function (w) {
  'use strict';

  var VERSION  = '1.0.0';
  var TAG      = '[ix-collection-fetch v' + VERSION + ']';
  var PAGE     = 100;   // Webflow v2 hard ceiling
  var MAXPAGES = 50;    // 5,000 rows before we refuse to keep going

  function log() {
    var c = w.TA_CONFIG;
    if (c && c.debug) { try { console.log.apply(console, [TAG].concat([].slice.call(arguments))); } catch (e) {} }
  }

  /* Pull the row array out of whatever the scenario decided to send.
     Order matters: check the specific keys before the generic ones,
     or { items: { items: [] } } resolves to the wrapper object. */
  function rowsOf(resp) {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    var keys = ['items', 'nlblocks', 'assets', 'rows', 'records'];
    for (var i = 0; i < keys.length; i++) {
      var v = resp[keys[i]];
      if (Array.isArray(v)) return v;
      if (v && Array.isArray(v.items)) return v.items;
    }
    return [];
  }

  function join(url, offset, limit) {
    return url + (url.indexOf('?') === -1 ? '?' : '&') +
           'offset=' + offset + '&limit=' + limit;
  }

  /* Fetch every page until a short one comes back.

     A page shorter than pageSize means the end — that is the only
     reliable terminator, because not every scenario returns a total
     and the ones that do have not always been right. */
  function all(url, opts) {
    opts = opts || {};
    if (!url) {
      console.warn(TAG, 'no url given — returning empty');
      var e = []; e.truncated = false; return Promise.resolve(e);
    }

    var size   = opts.pageSize || PAGE;
    var cap    = opts.maxPages || MAXPAGES;
    var out    = [];
    var pageNo = 0;

    function step(offset) {
      return fetch(join(url, offset, size), { signal: opts.signal })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (resp) {
          var rows = rowsOf(resp);
          pageNo++;
          for (var i = 0; i < rows.length; i++) out.push(rows[i]);
          if (typeof opts.onPage === 'function') {
            try { opts.onPage(rows, pageNo, out.length); } catch (e) {}
          }

          if (rows.length < size) {          // short page = done
            out.truncated = false;
            log('done', out.length + ' rows in ' + pageNo + ' page(s)');
            return out;
          }
          if (pageNo >= cap) {               // refused, not failed
            out.truncated = true;
            console.warn(TAG, 'stopped at maxPages (' + cap + '). ' +
              'Read is INCOMPLETE — ' + out.length + ' rows. ' +
              'Callers that infer absence from this read must not trust it.');
            return out;
          }
          return step(offset + size);
        });
    }

    return step(0).catch(function (err) {
      if (err && err.name === 'AbortError') { out.truncated = true; return out; }
      console.warn(TAG, 'fetch failed after ' + out.length + ' rows:', err && err.message);
      out.truncated = true;                  // partial is not complete
      return out;
    });
  }

  /* Index rows by a field, or by the first field that has a value.
     Saves every caller re-writing the same loop.

       IXFetch.indexBy(rows, ['asset-article','asset-ad','asset-re','asset-event'])
         -> { assetId: [row, row], ... } */
  function indexBy(rows, fields, pick) {
    var keys = (typeof fields === 'string') ? [fields] : (fields || []);
    var map  = {};
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i] || {};
      var fd  = row.fieldData || row;
      var id  = '';
      for (var k = 0; k < keys.length; k++) {
        if (fd[keys[k]]) { id = fd[keys[k]]; break; }
      }
      if (!id) continue;
      (map[id] = map[id] || []).push(pick ? pick(row, fd) : row);
    }
    return map;
  }

  w.IXFetch = { version: VERSION, all: all, rowsOf: rowsOf, indexBy: indexBy };
  log('ready');
})(window);
