// ix-asset-list-v1.2.0.js
// ============================================================
// INBXIFY · Cloudflare Worker · ix-asset-list
// Publisher-scoped asset listing for the T-A Asset Library.
// Replaces Make Scenario 121 (List Assets, paged).
//
// v1.2.0 (8 Nov 2026, SS-Fork B · Creative S7) — MEDIA LISTED.
//   GET /list?type=media&title=… lists the publisher's MEDIA rows (scoped by
//   the MEDIA `title-admin` reference). Needs one new Worker variable:
//   COLL_MEDIA = the MEDIA collection id (69990992411206c574331aed on the
//   current site). Ad Maker reads a customer's saved pieces this way.
//
// v1.1.1 (6 Nov 2026, SS-Fork B · Creative S5) — NAMED FIELDS LEFT UNCUT.
//   GET /list?…&full=<slug,slug> keeps the named plain-text fields whole
//   instead of cutting them at MAX_TEXT. Ad Maker reads ADS
//   reformat-recipe this way (a recipe is JSON well over 400 characters;
//   cut, it cannot be parsed). The cache key carries the list, so a
//   caller without full= still gets the small payload it got before.
//   Nothing else changes. /health says 1.1.1.
//
// v1.1.0 (1 Nov 2026, Allocator RE Events · 6) — FIND A HOME'S TOWN.
//   Jeff's ruling: a listing printed without a city or state resolves
//   itself instead of going to him (replaces spec ruling R2).
//   GET /geocode?title=<TITLE-ADMIN id>&street=<street as printed>
//     Reads the title's send ZIP codes (TITLES-ADMIN send-zip-codes,
//     the field Publish already reads), asks the US Census Bureau's
//     address lookup for that street in each ZIP, and answers
//     { ok:true, zips:[…], matches:[{ zip, city, state, matched }] }.
//     One match: Create listings fills the town in by itself. None or
//     several: the card goes to Jeff with the candidates.
//     No ZIP codes on the title: matches is empty and `note` says so.
//   Nothing else changes; /list answers exactly as before.
//   HARDCODING (provisional): HC-W-AL11-1 the Census lookup address and
//   benchmark, overridable with env GEOCODER_URL; HC-W-AL11-2 the
//   send-zip-codes field slug (same as ipp-publish).
//
// v1.0.0 (25 Sept 2026) — first build.
//
// WHY THIS EXISTS
//   Webflow's v2 list API cannot filter on a reference field
//   (HC-031 scope 3 / TD-260). Scenario 121 therefore returned
//   every PUBLISHER's items to every browser, 100 at a time,
//   and the Library filtered to one TITLE client-side. This
//   Worker does the paging and the PUBLISHER filter server-side,
//   so only this PUBLISHER's items leave Cloudflare.
//
// REQUEST
//   GET /list?type=<article|ad|event|realestate|media>&title=<TITLE-ADMIN item id>[&fresh=1]
//
//   The caller sends its TITLE. The Worker reads that TITLE's
//   PUBLISHER (`associated-client` on TITLES-ADMIN), then every
//   TITLE of that PUBLISHER, then keeps every item whose TITLE
//   reference is in that set. The caller filters to one TITLE
//   itself if it wants to; `titles` is on every item.
//
//   fresh=1 bypasses the short cache. Use it right after a write.
//
// RESPONSE (200)
//   {
//     type, publisher, titles: [{id, name}],
//     items: [{ id, createdOn, lastUpdated, isDraft, isArchived, fieldData }],
//     options: { <slug>: { <optionId>: <label> } },   // every Option field
//     total, truncated, cachedAt
//   }
//   fieldData is Webflow's own, minus RichText fields; plain
//   strings longer than MAX_TEXT are cut, with "…" appended.
//   Option values stay as ids; `options` turns them into words.
//
//   truncated = true means a page failed or MAX_PAGES was hit.
//   A caller that hides or counts things by absence MUST check it.
//
// ERRORS
//   4xx / 5xx with { error: "<plain sentence>" }. Never a 200
//   with an empty list when something failed (TOAST-TRUTH).
//
// LIMIT, stated plainly
//   The Worker trusts the TITLE id it is sent. That stops one
//   publisher's data loading in another's page by accident.
//   It is not access control against a forged request.
//
// CONFIG (Cloudflare dashboard → Settings → Variables)
//   WEBFLOW_TOKEN      Secret. Webflow API token, CMS read.
//   ALLOWED_ORIGINS    Plain text, comma-separated. Origins that
//                      may call this Worker, e.g.
//                      https://www.inbxify.com,https://inbxify.webflow.io
//   COLL_ARTICLES      64e905038caaa2edd76842b5
//   COLL_ADS           68929c45dc27b1bb31fb4404
//   COLL_EVENTS        68f7e5e0f07acb4581519ab4
//   COLL_RE            68d452672ad6cfb333cae5f9
//   COLL_MEDIA         69990992411206c574331aed   (v1.2.0)
//   COLL_TITLES_ADMIN  64e905038caaa2edd76842bb
//   Collection ids live in config, not code. They are platform
//   values (one Webflow site), not tenant values.
// ============================================================

const WF = 'https://api.webflow.com/v2';
const PAGE = 100;          // Webflow v2 maximum per call
const MAX_PAGES = 50;      // 5,000 items per collection before truncated=true
const PARALLEL = 4;        // concurrent page reads, kept under Webflow's rate limit
const MAX_TEXT = 400;      // plain-text cut-off per field, keeps payloads small
const TTL_LIST = 60;       // seconds, per type + publisher
const TTL_META = 300;      // seconds, TITLES-ADMIN and collection schemas

// Which field on each collection holds the TITLE reference.
// Schema knowledge, confirmed against live responses 25 Sept 2026.
const TYPES = {
  article:    { env: 'COLL_ARTICLES', titleField: 'associated-title' },
  ad:         { env: 'COLL_ADS',      titleField: 'titles' },
  event:      { env: 'COLL_EVENTS',   titleField: 'titles' },
  realestate: { env: 'COLL_RE',       titleField: 'titles' },
  media:      { env: 'COLL_MEDIA',    titleField: 'title-admin' },   // v1.2.0
};
const PUBLISHER_FIELD_ON_TITLES = 'associated-client';

export default {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'GET') return fail(405, 'Only GET is supported.', cors);

    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ ok: true, version: '1.2.0' }, 200, cors);
    if (url.pathname === '/geocode') return geocode(url, env, ctx, cors);   // v1.1.0
    if (url.pathname !== '/list') return fail(404, 'Unknown path. Use /list or /geocode.', cors);

    const type = (url.searchParams.get('type') || '').toLowerCase();
    const titleId = (url.searchParams.get('title') || '').trim();
    const fresh = url.searchParams.get('fresh') === '1';
    const full = new Set((url.searchParams.get('full') || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 10));   // v1.1.1

    const spec = TYPES[type];
    if (!spec) return fail(400, 'Unknown type "' + type + '". Use article, ad, event, realestate or media.', cors);
    if (!/^[0-9a-f]{24}$/.test(titleId)) return fail(400, 'Missing or malformed title id.', cors);
    if (!env.WEBFLOW_TOKEN) return fail(500, 'WEBFLOW_TOKEN is not set on this Worker.', cors);
    const collId = env[spec.env];
    if (!collId) return fail(500, spec.env + ' is not set on this Worker.', cors);
    if (!env.COLL_TITLES_ADMIN) return fail(500, 'COLL_TITLES_ADMIN is not set on this Worker.', cors);

    try {
      // 1. TITLE → PUBLISHER → every TITLE of that PUBLISHER
      const titlesRead = await cached(ctx, 'titles-admin', TTL_META, fresh,
        () => readAll(env, env.COLL_TITLES_ADMIN));
      const titleRows = titlesRead.rows;
      const me = titleRows.find(r => r.id === titleId);
      if (!me) return fail(404, 'That title id is not in TITLES-ADMIN.', cors);
      const publisher = refId(me.fieldData && me.fieldData[PUBLISHER_FIELD_ON_TITLES]);
      if (!publisher) return fail(422, 'This title has no PUBLISHER set in TITLES-ADMIN.', cors);
      const pubTitles = titleRows
        .filter(r => refId(r.fieldData && r.fieldData[PUBLISHER_FIELD_ON_TITLES]) === publisher)
        .map(r => ({ id: r.id, name: (r.fieldData && r.fieldData.name) || '' }));
      const titleSet = new Set(pubTitles.map(t => t.id));

      // 2. Collection schema → which fields are RichText, which are Options
      const schema = await cached(ctx, 'schema:' + collId, TTL_META, fresh,
        () => wf(env, '/collections/' + collId));
      const richText = new Set();
      const options = {};
      (schema.fields || []).forEach(f => {
        if (f.type === 'RichText') richText.add(f.slug);
        if (f.type === 'Option' && f.validations && Array.isArray(f.validations.options)) {
          const m = {};
          f.validations.options.forEach(o => { m[o.id] = o.name; });
          options[f.slug] = m;
        }
      });

      // 3. Every item in the collection, then keep this PUBLISHER's
      const listKey = 'list:' + type + ':' + publisher + (full.size ? ':full=' + [...full].sort().join(',') : '');   // v1.1.1
      const listRead = await cached(ctx, listKey, TTL_LIST, fresh, async () => {
        const all = await readAll(env, collId);
        const kept = all.rows
          .filter(r => refIds(r.fieldData && r.fieldData[spec.titleField]).some(id => titleSet.has(id)))
          .map(r => slim(r, richText, full));
        return { rows: kept, truncated: all.truncated, at: new Date().toISOString() };
      });

      return json({
        type,
        publisher,
        titles: pubTitles,
        items: listRead.rows,
        options,
        total: listRead.rows.length,
        truncated: !!(listRead.truncated || titlesRead.truncated),
        cachedAt: listRead.at,
      }, 200, cors);
    } catch (e) {
      const msg = (e && e.message) ? e.message : String(e);
      return fail(502, 'Webflow read failed: ' + msg, cors);
    }
  },
};

// ── v1.1.0 · /geocode ───────────────────────────────────────
const ZIP_FIELD = 'send-zip-codes';   // HC-W-AL11-2 (same field ipp-publish reads)
const GEOCODER = 'https://geocoding.geo.census.gov/geocoder/locations/address?benchmark=Public_AR_Current&format=json';   // HC-W-AL11-1

function titleCase(s) {
  return String(s || '').toLowerCase().replace(/\b([a-z])/g, (m, c) => c.toUpperCase());
}

async function geocode(url, env, ctx, cors) {
  const titleId = (url.searchParams.get('title') || '').trim();
  const street = (url.searchParams.get('street') || '').trim().slice(0, 160);
  if (!/^[0-9a-f]{24}$/.test(titleId)) return fail(400, 'Missing or malformed title id.', cors);
  if (!street) return fail(400, 'Missing street.', cors);
  if (!env.WEBFLOW_TOKEN || !env.COLL_TITLES_ADMIN) return fail(500, 'WEBFLOW_TOKEN or COLL_TITLES_ADMIN is not set on this Worker.', cors);
  try {
    const titlesRead = await cached(ctx, 'titles-admin', TTL_META, false, () => readAll(env, env.COLL_TITLES_ADMIN));
    const me = titlesRead.rows.find(r => r.id === titleId);
    if (!me) return fail(404, 'That title id is not in TITLES-ADMIN.', cors);
    const zips = String((me.fieldData && me.fieldData[ZIP_FIELD]) || '')
      .split(/[\s,;]+/).map(z => z.trim()).filter(z => /^\d{5}$/.test(z));
    if (!zips.length) return json({ ok: true, zips: [], matches: [], note: 'This title has no send ZIP codes (TITLES-ADMIN ' + ZIP_FIELD + ').' }, 200, cors);
    const base = env.GEOCODER_URL || GEOCODER;
    const seen = {}, matches = [], failed = [];
    await Promise.all(zips.map(async zip => {
      try {
        const r = await fetch(base + '&street=' + encodeURIComponent(street) + '&zip=' + zip, { headers: { accept: 'application/json' } });
        if (!r.ok) { failed.push(zip); return; }
        const j = await r.json();
        const list = (j && j.result && j.result.addressMatches) || [];
        list.forEach(m => {
          const a = m.addressComponents || {};
          const z = a.zip || zip, k = z + '|' + (a.city || '') + '|' + (a.state || '');
          if (seen[k]) return; seen[k] = 1;
          matches.push({ zip: z, city: titleCase(a.city), state: String(a.state || '').toUpperCase(), matched: m.matchedAddress || '' });
        });
      } catch (e) { failed.push(zip); }
    }));
    return json({ ok: true, zips, matches, failed }, 200, cors);
  } catch (e) {
    return fail(502, 'Lookup failed: ' + ((e && e.message) || String(e)), cors);
  }
}

// ── Webflow reads ───────────────────────────────────────────

async function wf(env, path) {
  const res = await fetch(WF + path, {
    headers: { Authorization: 'Bearer ' + env.WEBFLOW_TOKEN, 'accept-version': '2.0.0' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error('HTTP ' + res.status + ' on ' + path + (body ? ' · ' + body.slice(0, 200) : ''));
  }
  return res.json();
}

// Reads every page. First page tells us the total; the rest run
// PARALLEL at a time. A failed page sets truncated rather than
// throwing, so the caller still gets what was read, flagged.
async function readAll(env, collId) {
  const first = await wf(env, '/collections/' + collId + '/items?limit=' + PAGE + '&offset=0');
  let rows = (first.items || []).slice();
  let truncated = false;
  const total = (first.pagination && first.pagination.total) || rows.length;
  const pages = Math.min(Math.ceil(total / PAGE), MAX_PAGES);
  if (Math.ceil(total / PAGE) > MAX_PAGES) truncated = true;

  const offsets = [];
  for (let p = 1; p < pages; p++) offsets.push(p * PAGE);
  for (let i = 0; i < offsets.length; i += PARALLEL) {
    const batch = offsets.slice(i, i + PARALLEL).map(off =>
      wf(env, '/collections/' + collId + '/items?limit=' + PAGE + '&offset=' + off)
        .then(r => r.items || [])
        .catch(() => { truncated = true; return []; }));
    (await Promise.all(batch)).forEach(items => { rows = rows.concat(items); });
  }
  // de-duplicate by id: items created mid-read can shift offsets
  const seen = new Set();
  rows = rows.filter(r => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  return { rows, truncated };
}

// ── Shaping ─────────────────────────────────────────────────

function slim(r, richText, full) {
  const fd = {};
  const src = r.fieldData || {};
  Object.keys(src).forEach(k => {
    if (richText.has(k)) return;
    const v = src[k];
    fd[k] = (typeof v === 'string' && v.length > MAX_TEXT && !(full && full.has(k))) ? v.slice(0, MAX_TEXT) + '…' : v;   // v1.1.1
  });
  return {
    id: r.id,
    createdOn: r.createdOn || null,
    lastUpdated: r.lastUpdated || null,
    isDraft: !!r.isDraft,
    isArchived: !!r.isArchived,
    fieldData: fd,
  };
}

// A reference comes back as a bare id or an object with .id
function refId(v) {
  if (!v) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'object' && v.id) return String(v.id);
  return null;
}
function refIds(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(refId).filter(Boolean);
  const one = refId(v);
  return one ? [one] : [];
}

// ── Cache (Cloudflare Cache API, per data centre) ───────────

async function cached(ctx, key, ttl, bypass, produce) {
  const cache = caches.default;
  const req = new Request('https://ix-asset-list.cache/' + encodeURIComponent(key));
  if (!bypass) {
    const hit = await cache.match(req);
    if (hit) return hit.json();
  }
  const value = await produce();
  // never cache a truncated read: the next call should try again
  if (!(value && value.truncated)) {
    const res = new Response(JSON.stringify(value), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=' + ttl },
    });
    ctx.waitUntil(cache.put(req, res));
  }
  return value;
}

// ── HTTP helpers ────────────────────────────────────────────

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const h = { Vary: 'Origin' };
  if (origin && allowed.includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    h['Access-Control-Max-Age'] = '86400';
  }
  return h;
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors),
  });
}

function fail(status, message, cors) {
  return json({ error: message }, status, cors);
}
