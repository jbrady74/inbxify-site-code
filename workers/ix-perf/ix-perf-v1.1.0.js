// ix-perf-v1.1.0.js
// INBXIFY · Cloudflare Worker · ix-perf · the performance collector and its reads
//
// v1.1.0 (16 Nov 2026, Performance Report S3 · build step 2) — QUILL READS: GET /raw AND GET /sources.
//   Quill's Performance tab (quill-performance v1.0.0) reads its numbers here. Mockup v0.1, Jeff 16 Nov: D1 to D12
//   accepted except D6 (no "Ad seen at" switch: Ad seen is the stored seen flag, measured under PERF_SEEN). Raw counts
//   keeps Readers and drops Avg time (Jeff, 16 Nov); each event's own time shows when rows are not merged.
//
//   WHO MAY READ (D1). Staff only. Quill sends the Memberstack login token in "Authorization: Bearer <token>" (the
//     same token Quill Home sends to ix-sales). This Worker asks ix-members GET /whoami through the service binding
//     MEMBERS, exactly as ix-sales v1.0.2+ does, and answers only when it says staff. No key anywhere. The page's
//     Origin must also be in PERF_ORIGINS. A checked token is trusted for 60 seconds in this isolate.
//
//   NAMES (D2). Rows hold ids and slugs. Names come from the CMS copy in D1 database ix-content, bound read-only here
//     as CMS_DB (the database ix-issue-data reads as IX_DB). Collections are found by their Webflow display name
//     (PUBLISHERS, TITLES, CUSTOMERS) in its collections table, or set in PERF_CMS. A collection not in the copy, or a
//     missing binding, leaves the slug or id showing, and the answer says so in "warnings" (never a silent blank).
//
//   GET /raw   ?from=YYYY-MM-DD&to=YYYY-MM-DD    (both days included; default the last 7 days in PERF_TZ)
//              &group=day,title,event            merge rows by these columns (D3 default). group=none merges nothing:
//                                                one row per event (at most RAW_EVENT_DAYS days at a time).
//                                                group= (empty) merges everything into one row.
//              &f.<column>=<value>               filter; one per column. An empty value means "blank".
//              &page=1&size=12                   page of rows (size at most 200)
//              &all=1                            every row, for Export CSV (at most RAW_ALL_MAX rows)
//              &options=1                        also the values each filter offers in this date range
//     Columns: day, publisher, title, issue, surface, event, spot, advertiser, linktype.
//     Events (D7): page_view (page_views), ad_on_page (ad_views, every row), ad_seen (ad_views with seen = 1),
//     click (clicks). Merged rows carry n (count) and readers (different reader codes). Event rows carry at, reader,
//     visit, ms (engaged time for a page view, longest time on screen for an ad), path, dest and label.
//     Answers { ok, from, to, group, filters, rows, total: { rows, events }, page, size, names, options, warnings, version }.
//   GET /sources  Each input with its last delivery and health (D9, D10). Health rules are hours in PERF_SOURCES
//     (default {"site":{"hours":24}}): healthy within the hours, late within twice the hours, otherwise down;
//     failing when the last error is newer than the last delivery. A source with no source_status row is not
//     connected. Site also answers rows in the last 24 hours, rows today, and rows per day for the last 7 days.
//
//   NEEDS (Cloudflare dashboard, ix-perf > Settings > Bindings):
//     · Service binding MEMBERS → Worker ix-members.
//     · D1 binding CMS_DB → database ix-content (only read here; nothing in this Worker writes to it).
//     · D1 schema v1.0.2 on ix-perf (three day indexes; console copy ix-perf-schema-v1.0.2-console.sql).
//     Variables (optional): PERF_SOURCES (health hours), PERF_CMS (collection ids, if display names ever change).
//
//   Collection (POST /c) and /config are unchanged. /health also reports the two new bindings (members, cms).
//   CORS now allows the Authorization header, for the read routes.
//
//   HARDCODING (provisional, for the S3 delta): HC-P-PR3-1 RAW_DEFAULT_DAYS 7, RAW_EVENT_DAYS 31, RAW_SIZE_MAX 200,
//     RAW_ALL_MAX 50000, OPT_MAX 500; HC-P-PR3-2 the default health rule (site, 24 hours) and the "twice the hours"
//     late band; HC-P-PR3-3 the CMS display names PUBLISHERS, TITLES, CUSTOMERS (override PERF_CMS); HC-P-PR3-4 the
//     60-second login and 10-minute collection-list caches; HC-P-PR3-5 the event keys and their order.
//
// v1.0.0 (16 Nov 2026, Performance Report S2 · build step 1) — THE SITE COLLECTOR.
//   We count everything ourselves (S1 ruling 1). This Worker takes what the site script (ix-perf-site v1.0.0) sends from
//   every title site page and stores it in D1 (database ix-perf, binding PERF_DB; tables in ix-perf-schema-v1.0.0.sql).
//   Later steps add localtap.link clicks, the email open picture and the provider intakes to the same Worker.
//
//   ROUTES
//     POST /c        One message from a page. The body is JSON sent as text (navigator.sendBeacon), so no preflight.
//                    t: 'open'   a page opened: one page_views row. Answers { ok, seen: { ratio, ms } } so the page
//                                measures ads with the one "seen" setting (seed ruling 12).
//                    t: 'end'    the reader left or switched away: raises engaged_ms on the page's row (never lowers
//                                it) and writes every ad shown, one ad_views row each, keeping the largest times sent.
//                                A page may send several (each tab switch); the last one wins where it is larger.
//                    t: 'click'  one clicks row.
//     GET  /health   { ok, version, d1, seen, tz }
//     GET  /config   { ok, seen } (the same setting, for anything else that needs it)
//
//   THE "SEEN" SETTING (seed rulings 12 and 13; Jeff 16 Nov: half the ad on screen for half a second). One place:
//     the Worker variable PERF_SEEN, JSON {"ratio":0.5,"ms":500}. Absent or unreadable: 0.5 and 500. The page measures
//     with ratio; this Worker marks an ad seen when its longest unbroken stretch reached ms. Every ad row also keeps
//     max_ms, total_ms and the setting it was measured with, so a different time can be counted later on the same rows.
//
//   WHO MAY SEND. Only pages whose Origin is in PERF_ORIGINS (comma list; default https://inbxify.com and
//   https://www.inbxify.com). Anything else gets 403 and nothing is written. No key: the page cannot keep a secret.
//   Staff and bot visits are stored like any other (Jeff, 16 Nov).
//
//   LIMITS. A message over 64 KB, or with more than 300 ads, is refused (413). Text fields are cut to fixed lengths.
//
//   SOURCE STATUS. Each isolate stamps source_status 'site' at most once a minute with the rows written since.
//
//   NEEDS (Cloudflare dashboard): D1 database ix-perf with the schema run; this Worker bound to it as PERF_DB.
//     Variables (optional): PERF_SEEN, PERF_ORIGINS, PERF_TZ (default America/New_York, for the day column).
//
//   HARDCODING (provisional, for the S2 delta): HC-P-PR2-2 the default seen setting 0.5 / 500 ms (Jeff's ruling);
//     HC-P-PR2-3 the default origins and zone; HC-P-PR2-4 the size limits and field lengths; HC-P-PR2-5 the
//     one-minute status stamp.

const VERSION = '1.1.0';
const DEF_SEEN = { ratio: 0.5, ms: 500 };                                   // HC-P-PR2-2
const DEF_ORIGINS = ['https://inbxify.com', 'https://www.inbxify.com'];     // HC-P-PR2-3
const DEF_TZ = 'America/New_York';                                          // HC-P-PR2-3
const MAX_BODY = 65536, MAX_ADS = 300;                                      // HC-P-PR2-4
const LEN = { id: 64, code: 64, path: 512, dest: 1024, host: 255, label: 80, small: 40 };   // HC-P-PR2-4
const STAMP_MS = 60000;                                                     // HC-P-PR2-5
const KINDS = ['issue', 'article', 'archives', 'directory', 'franchise', 'home', 'other'];
const SHAPES = ['banner', 'sidebar', 'house', 'text', 'sponsor', 'paid'];
const LINK_TYPES = ['CALL', 'TEXT', 'EMAIL', 'SOCIAL', 'WEB', 'NO LINK'];
const REF_KINDS = ['email', 'internal', 'search', 'social', 'direct', 'other'];
const DEVICES = ['phone', 'tablet', 'desktop'];

let pending = 0, lastStamp = 0;   // per isolate

function seenOf(env) {
  try {
    const v = env.PERF_SEEN ? JSON.parse(env.PERF_SEEN) : null;
    const ratio = Number(v && v.ratio), ms = Number(v && v.ms);
    if (ratio > 0 && ratio <= 1 && ms >= 0 && ms <= 60000) return { ratio, ms: Math.round(ms) };
  } catch (e) {}
  return Object.assign({}, DEF_SEEN);
}
function originsOf(env) {
  const list = String(env.PERF_ORIGINS || '').split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);
  return list.length ? list : DEF_ORIGINS;
}
function tzOf(env) { return String(env.PERF_TZ || '').trim() || DEF_TZ; }
function dayOf(ms, tz) {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms)); }
  catch (e) { return new Date(ms).toISOString().slice(0, 10); }
}

function cors(origin) {
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
           'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
}
function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), { status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, origin ? cors(origin) : {}) });
}

// Cleaning: every value from a page is cut and checked before it reaches SQL (all SQL is bound, never built from text).
const str = (v, n) => (v == null ? '' : String(v)).slice(0, n || LEN.small);
const oneOf = (v, list, dflt) => (list.indexOf(v) >= 0 ? v : dflt);
const int = (v, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 ? Math.min(n, max || 86400000) : 0; };
const bit = v => (v ? 1 : 0);
const idOk = v => /^[A-Za-z0-9_.:-]{6,64}$/.test(String(v || ''));
function atOf(v, now) {   // the page's clock is trusted only within a day of ours
  const n = Number(v);
  return Number.isFinite(n) && Math.abs(n - now) < 86400000 ? Math.round(n) : now;
}
function hostOf(u) { try { return new URL(u).host.slice(0, LEN.host); } catch (e) { return ''; } }

// The context every row shares.
function ctxOf(m) {
  return {
    reader: str(m.reader, LEN.id), visit: str(m.visit, LEN.id),
    publisher: str(m.publisher, LEN.code), title: str(m.title, LEN.code), titleAdmin: str(m.titleAdmin, LEN.code),
    kind: oneOf(m.kind, KINDS, 'other'),
    issueId: str(m.issueId, LEN.code), issueCode: str(m.issueCode, LEN.code),
  };
}

async function onOpen(db, m, now, tz, script) {
  const c = ctxOf(m), at = atOf(m.at, now);
  await db.prepare(
    'INSERT OR IGNORE INTO page_views (id, at, day, reader, visit, visit_first, reader_new, publisher, title, title_admin, kind, path,' +
    ' issue_id, issue_code, ref_kind, ref_host, utm_source, utm_medium, utm_content, device, engaged_ms, last_at, script)' +
    ' VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)'
  ).bind(m.pv, at, dayOf(at, tz), c.reader, c.visit, bit(m.visitFirst), bit(m.readerNew), c.publisher, c.title, c.titleAdmin,
         c.kind, str(m.path, LEN.path), c.issueId, c.issueCode, oneOf(m.refKind, REF_KINDS, 'other'), str(m.refHost, LEN.host),
         str(m.utmSource, LEN.code), str(m.utmMedium, LEN.code), str(m.utmContent, LEN.code), oneOf(m.device, DEVICES, 'desktop'),
         now, str(script, 16)).run();
  return 1;
}

async function onEnd(db, m, now, tz, seen) {
  const c = ctxOf(m), at = atOf(m.at, now), day = dayOf(at, tz);
  const stmts = [db.prepare('UPDATE page_views SET engaged_ms = MAX(engaged_ms, ?), last_at = ? WHERE id = ?')
    .bind(int(m.engagedMs), now, m.pv)];
  const ads = Array.isArray(m.ads) ? m.ads : [];
  const ratio = Number(m.ratio) > 0 && Number(m.ratio) <= 1 ? Number(m.ratio) : seen.ratio;
  ads.forEach(a => {
    const n = int(a.n, 10000), max = int(a.maxMs), total = Math.max(int(a.totalMs), max);
    const firstAt = atOf(a.at, now);
    stmts.push(db.prepare(
      'INSERT INTO ad_views (id, page_view_id, at, day, reader, visit, publisher, title, kind, issue_id, issue_code,' +
      ' ad_id, advertiser_id, slot, shape, href_host, max_ms, total_ms, ratio, seen_ms, seen)' +
      ' VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)' +
      ' ON CONFLICT(id) DO UPDATE SET max_ms = MAX(max_ms, excluded.max_ms), total_ms = MAX(total_ms, excluded.total_ms),' +
      ' slot = excluded.slot, seen = MAX(seen, excluded.seen), seen_ms = excluded.seen_ms, ratio = excluded.ratio'
    ).bind(m.pv + ':' + n, m.pv, firstAt, dayOf(firstAt, tz), c.reader, c.visit, c.publisher, c.title, c.kind, c.issueId, c.issueCode,
           str(a.ad, LEN.code), str(a.adv, LEN.code), str(a.slot, LEN.code), oneOf(a.shape, SHAPES, 'banner'),
           str(a.host, LEN.host), max, total, ratio, seen.ms, max >= seen.ms ? 1 : 0));
  });
  await db.batch(stmts);
  return stmts.length;
}

async function onClick(db, m, now, tz) {
  const c = ctxOf(m), at = atOf(m.at, now), dest = str(m.dest, LEN.dest);
  await db.prepare(
    'INSERT OR IGNORE INTO clicks (id, at, day, source, page_view_id, reader, visit, publisher, title, kind, issue_id, issue_code,' +
    ' ad_id, advertiser_id, slot, shape, link_type, dest, dest_host, internal, label, link_code, scanner)' +
    " VALUES (?,?,?,'site',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'',0)"
  ).bind(m.id, at, dayOf(at, tz), m.pv, c.reader, c.visit, c.publisher, c.title, c.kind, c.issueId, c.issueCode,
         str(m.ad, LEN.code), str(m.adv, LEN.code), str(m.slot, LEN.code), m.shape ? oneOf(m.shape, SHAPES, '') : '',
         oneOf(m.linkType, LINK_TYPES, 'NO LINK'), dest, hostOf(dest), bit(m.internal), str(m.label, LEN.label)).run();
  return 1;
}

async function stamp(db, ctx, now, err) {
  if (!err && now - lastStamp < STAMP_MS) return;
  lastStamp = now;
  const n = pending; pending = 0;
  const q = err
    ? db.prepare('INSERT INTO source_status (source, last_error_at, last_error) VALUES (\'site\', ?, ?)' +
        ' ON CONFLICT(source) DO UPDATE SET last_error_at = excluded.last_error_at, last_error = excluded.last_error')
        .bind(now, String(err).slice(0, 300))
    : db.prepare('INSERT INTO source_status (source, last_ok_at, last_count) VALUES (\'site\', ?, ?)' +
        ' ON CONFLICT(source) DO UPDATE SET last_ok_at = excluded.last_ok_at, last_count = excluded.last_count')
        .bind(now, n);
  const p = q.run().catch(() => {});
  if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
}

async function collect(request, env, ctx, origin) {
  const db = env.PERF_DB;
  if (!db) return json({ ok: false, error: 'PERF_DB is not bound on ix-perf.' }, 500, origin);
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len > MAX_BODY) return json({ ok: false, error: 'Too large.' }, 413, origin);
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ ok: false, error: 'Too large.' }, 413, origin);
  let m;
  try { m = JSON.parse(text); } catch (e) { return json({ ok: false, error: 'Not JSON.' }, 400, origin); }
  if (!m || typeof m !== 'object') return json({ ok: false, error: 'Not JSON.' }, 400, origin);
  if (!idOk(m.pv)) return json({ ok: false, error: 'No page view id.' }, 400, origin);
  if (Array.isArray(m.ads) && m.ads.length > MAX_ADS) return json({ ok: false, error: 'Too many ads.' }, 413, origin);
  const now = Date.now(), tz = tzOf(env), seen = seenOf(env);
  try {
    let n = 0;
    if (m.t === 'open') n = await onOpen(db, m, now, tz, m.v);
    else if (m.t === 'end') n = await onEnd(db, m, now, tz, seen);
    else if (m.t === 'click') { if (!idOk(m.id)) return json({ ok: false, error: 'No click id.' }, 400, origin); n = await onClick(db, m, now, tz); }
    else return json({ ok: false, error: 'Unknown message type.' }, 400, origin);
    pending += n;
    await stamp(db, ctx, now, null);
    return json(m.t === 'open' ? { ok: true, seen } : { ok: true }, 200, origin);
  } catch (e) {
    await stamp(db, ctx, now, e && e.message);
    return json({ ok: false, error: 'Not stored: ' + (e && e.message) }, 500, origin);
  }
}

// ══════════════════════════════════════════════════════════
// v1.1.0 — QUILL READS: GET /raw AND GET /sources (staff only)
// ══════════════════════════════════════════════════════════
const RAW_DEFAULT_DAYS = 7, RAW_EVENT_DAYS = 31, RAW_SIZE_MAX = 200, RAW_ALL_MAX = 50000, OPT_MAX = 500;   // HC-P-PR3-1
const DEF_SOURCES = { site: { hours: 24 } };                                                               // HC-P-PR3-2
const CMS_NAMES = { publishers: 'PUBLISHERS', titles: 'TITLES', customers: 'CUSTOMERS' };                 // HC-P-PR3-3
const AUTH_TTL = 60000, CMS_TTL = 600000;                                                                  // HC-P-PR3-4
const EVENTS = ['page_view', 'ad_on_page', 'ad_seen', 'click'];                                            // HC-P-PR3-5
const DIMS = ['day', 'publisher', 'title', 'issue', 'surface', 'event', 'spot', 'advertiser', 'linktype'];
const authCache = new Map();          // token -> { at, who }
let cmsCols = null, cmsColsAt = 0;    // collection ids found in ix-content

function httpErr(status, msg) { const e = new Error(msg); e.status = status; return e; }

async function staffOnly(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const tok = (auth.match(/^Bearer\s+(\S+)/i) || [])[1];
  if (!tok) throw httpErr(401, 'Not logged in: no Memberstack token was sent.');
  const hit = authCache.get(tok);
  if (hit && Date.now() - hit.at < AUTH_TTL) { if (!hit.who.staff) throw httpErr(403, 'Only inbxify staff can read performance numbers.'); return hit.who; }
  if (!env.MEMBERS || typeof env.MEMBERS.fetch !== 'function') throw httpErr(500, 'The MEMBERS service binding (to ix-members) is not set on ix-perf.');
  let res, j = null;
  try { res = await env.MEMBERS.fetch(new Request('https://ix-members/whoami', { headers: { Authorization: 'Bearer ' + tok } })); j = await res.json().catch(() => null); }
  catch (e) { throw httpErr(502, 'ix-members did not answer: ' + ((e && e.message) || e)); }
  if (!res.ok || !j || !j.ok) throw httpErr(res && res.status === 401 ? 401 : 403, (j && j.error) || 'The login check failed.');
  const who = { memberId: j.memberId, staff: !!j.staff };
  if (authCache.size > 500) authCache.clear();
  authCache.set(tok, { at: Date.now(), who });
  if (!who.staff) throw httpErr(403, 'Only inbxify staff can read performance numbers.');
  return who;
}

async function readRoute(url, request, env, origin) {
  try {
    if (!env.PERF_DB) throw httpErr(500, 'PERF_DB is not bound on ix-perf.');
    await staffOnly(request, env);
    const out = url.pathname === '/raw' ? await rawRead(url, env) : await sourcesRead(env);
    out.version = VERSION;
    return json(out, 200, origin);
  } catch (e) {
    return json({ ok: false, error: (e && e.message) || String(e), version: VERSION }, (e && e.status) || 500, origin);
  }
}

// ── dates ─────────────────────────────────────────────────
const dayOk = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || '')) && !isNaN(Date.parse(d + 'T00:00:00Z'));
function addDays(d, n) { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
function daysBetween(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000) + 1; }

// ── the four events as one list ───────────────────────────
// Every column is text with '' for "blank", so a filter on a blank value matches. All values are bound, never built.
function branches(events) {
  // [table, event, extra WHERE, spot, advertiser, linktype, ms, path, dest, label, page view id]
  const B = {
    page_view: ['page_views', 'page_view', '', "''", "''", "''", 'engaged_ms', "COALESCE(path,'')", "''", "''", "''"],
    ad_on_page: ['ad_views', 'ad_on_page', '', "COALESCE(slot,'')", "COALESCE(advertiser_id,'')", "''", 'max_ms', "''", "COALESCE(href_host,'')", "''", 'page_view_id'],
    ad_seen: ['ad_views', 'ad_seen', ' AND seen = 1', "COALESCE(slot,'')", "COALESCE(advertiser_id,'')", "''", 'max_ms', "''", "COALESCE(href_host,'')", "''", 'page_view_id'],
    click: ['clicks', 'click', '', "COALESCE(slot,'')", "COALESCE(advertiser_id,'')", "COALESCE(link_type,'')", 'NULL', "''", "COALESCE(dest,'')", "COALESCE(label,'')", "COALESCE(page_view_id,'')"]
  };
  return events.map(e => { const b = B[e];
    return "SELECT day, at, COALESCE(publisher,'') AS publisher, COALESCE(title,'') AS title, COALESCE(issue_code,'') AS issue," +
      " COALESCE(kind,'') AS surface, '" + b[1] + "' AS event, " + b[3] + ' AS spot, ' + b[4] + ' AS advertiser, ' + b[5] + ' AS linktype,' +
      " COALESCE(reader,'') AS reader, COALESCE(visit,'') AS visit, " + b[6] + ' AS ms, id, ' + b[7] + ' AS path, ' + b[8] + ' AS dest, ' +
      b[9] + ' AS label, ' + b[10] + ' AS pv FROM ' + b[0] + ' WHERE day BETWEEN ?1 AND ?2' + b[2];
  }).join(' UNION ALL ');
}
const EV_ORDER = "CASE event WHEN 'page_view' THEN 1 WHEN 'ad_on_page' THEN 2 WHEN 'ad_seen' THEN 3 ELSE 4 END";

function parseRaw(url, tz) {
  const q = url.searchParams, today = dayOf(Date.now(), tz);
  let to = dayOk(q.get('to')) ? q.get('to') : today;
  let from = dayOk(q.get('from')) ? q.get('from') : addDays(to, -(RAW_DEFAULT_DAYS - 1));
  if (from > to) { const t = from; from = to; to = t; }
  const gRaw = q.has('group') ? q.get('group') : 'day,title,event';
  const eventMode = gRaw === 'none';
  const group = eventMode ? [] : DIMS.filter(d => String(gRaw).split(',').map(s => s.trim()).indexOf(d) >= 0);
  const filters = {};
  DIMS.forEach(d => { if (q.has('f.' + d)) filters[d] = String(q.get('f.' + d)).slice(0, 200); });
  const all = q.get('all') === '1';
  const size = all ? RAW_ALL_MAX : Math.min(RAW_SIZE_MAX, Math.max(1, parseInt(q.get('size'), 10) || 12));
  const page = all ? 1 : Math.max(1, parseInt(q.get('page'), 10) || 1);
  return { from, to, group, eventMode, filters, all, size, page, options: q.get('options') === '1' };
}

async function rawRead(url, env) {
  const db = env.PERF_DB, tz = tzOf(env), p = parseRaw(url, tz), warnings = [];
  if (p.eventMode && daysBetween(p.from, p.to) > RAW_EVENT_DAYS)
    throw httpErr(400, 'One row per event shows at most ' + RAW_EVENT_DAYS + ' days at a time. Narrow the dates, or merge rows.');
  const events = p.filters.event != null ? EVENTS.filter(e => e === p.filters.event) : EVENTS.slice();
  const binds = [p.from, p.to];
  const where = [];
  DIMS.forEach(d => { if (d !== 'event' && p.filters[d] != null) { binds.push(p.filters[d]); where.push(d + ' = ?' + binds.length); } });
  const W = where.length ? ' WHERE ' + where.join(' AND ') : '';
  let rows = [], total = { rows: 0, events: 0 };

  if (events.length) {
    const U = '(' + branches(events) + ')';
    if (p.eventMode) {
      const tot = await db.prepare('SELECT COUNT(*) AS n FROM ' + U + W).bind(...binds).first();
      total = { rows: tot.n, events: tot.n };
      const r = await db.prepare('SELECT * FROM ' + U + W + ' ORDER BY at DESC LIMIT ' + p.size + ' OFFSET ' + ((p.page - 1) * p.size)).bind(...binds).all();
      rows = r.results || [];
      // the page an ad was on: one read for the page view ids on this page of rows
      const pvIds = [...new Set(rows.filter(x => x.pv && !x.path).map(x => x.pv))];
      const paths = {};
      for (let i = 0; i < pvIds.length; i += 90) {
        const part = pvIds.slice(i, i + 90);
        const pr = await db.prepare('SELECT id, path FROM page_views WHERE id IN (' + part.map(() => '?').join(',') + ')').bind(...part).all();
        (pr.results || []).forEach(x => { paths[x.id] = x.path || ''; });
      }
      rows = rows.map(x => ({ at: x.at, day: x.day, publisher: x.publisher, title: x.title, issue: x.issue, surface: x.surface, event: x.event,
        spot: x.spot, advertiser: x.advertiser, linktype: x.linktype, reader: x.reader, visit: x.visit, ms: x.ms,
        path: x.path || paths[x.pv] || '', dest: x.dest, label: x.label }));
    } else {
      const G = p.group.join(', ');
      const order = p.group.map(d => d === 'day' ? 'day DESC' : d === 'event' ? EV_ORDER : d).join(', ');
      const sel = (G ? G + ', ' : '') + 'COUNT(*) AS n, COUNT(DISTINCT reader) AS readers';
      const tot = await db.prepare('SELECT COUNT(*) AS rows_n, COALESCE(SUM(n),0) AS events_n FROM (SELECT COUNT(*) AS n FROM ' + U + W +
        (G ? ' GROUP BY ' + G : '') + ')').bind(...binds).first();
      total = { rows: tot.rows_n, events: tot.events_n };
      const r = await db.prepare('SELECT ' + sel + ' FROM ' + U + W + (G ? ' GROUP BY ' + G + ' ORDER BY ' + order : '') +
        ' LIMIT ' + p.size + ' OFFSET ' + ((p.page - 1) * p.size)).bind(...binds).all();
      rows = r.results || [];
      if (!G && rows.length && rows[0].n === 0) { rows = []; total = { rows: 0, events: 0 }; }
    }
  }
  if (p.all && total.rows > RAW_ALL_MAX) warnings.push('Only the first ' + RAW_ALL_MAX.toLocaleString('en-US') + ' of ' + total.rows.toLocaleString('en-US') + ' rows were sent. Narrow the dates or filters.');

  let options = null;
  if (p.options) options = await optionsRead(db, p.from, p.to);
  const want = { publisher: new Set(), title: new Set(), advertiser: new Set() };
  rows.forEach(x => { ['publisher', 'title', 'advertiser'].forEach(k => { if (x[k]) want[k].add(x[k]); }); });
  if (options) ['publisher', 'title', 'advertiser'].forEach(k => options[k].forEach(v => { if (v) want[k].add(v); }));
  const names = await namesRead(env, want, warnings);

  return { ok: true, from: p.from, to: p.to, group: p.eventMode ? 'none' : p.group.join(','), filters: p.filters,
    rows, total, page: p.page, size: p.size, names, options, warnings };
}

async function optionsRead(db, from, to) {
  const cols = { publisher: 'publisher', title: 'title', issue: 'issue_code', surface: 'kind' };
  const stmts = [], keys = [];
  Object.keys(cols).forEach(k => {
    keys.push(k);
    stmts.push(db.prepare(['page_views', 'ad_views', 'clicks'].map(t => 'SELECT DISTINCT COALESCE(' + cols[k] + ",'') AS v FROM " + t + ' WHERE day BETWEEN ?1 AND ?2').join(' UNION ') +
      ' ORDER BY v LIMIT ' + OPT_MAX).bind(from, to));
  });
  keys.push('spot'); stmts.push(db.prepare("SELECT DISTINCT COALESCE(slot,'') AS v FROM ad_views WHERE day BETWEEN ?1 AND ?2 UNION SELECT DISTINCT COALESCE(slot,'') FROM clicks WHERE day BETWEEN ?1 AND ?2 ORDER BY v LIMIT " + OPT_MAX).bind(from, to));
  keys.push('advertiser'); stmts.push(db.prepare("SELECT DISTINCT COALESCE(advertiser_id,'') AS v FROM ad_views WHERE day BETWEEN ?1 AND ?2 UNION SELECT DISTINCT COALESCE(advertiser_id,'') FROM clicks WHERE day BETWEEN ?1 AND ?2 ORDER BY v LIMIT " + OPT_MAX).bind(from, to));
  keys.push('linktype'); stmts.push(db.prepare("SELECT DISTINCT COALESCE(link_type,'') AS v FROM clicks WHERE day BETWEEN ?1 AND ?2 ORDER BY v LIMIT " + OPT_MAX).bind(from, to));
  keys.push('day'); stmts.push(db.prepare('SELECT DISTINCT day AS v FROM page_views WHERE day BETWEEN ?1 AND ?2 UNION SELECT DISTINCT day FROM ad_views WHERE day BETWEEN ?1 AND ?2 UNION SELECT DISTINCT day FROM clicks WHERE day BETWEEN ?1 AND ?2 ORDER BY v DESC').bind(from, to));
  const res = await db.batch(stmts), out = { event: EVENTS.slice() };
  res.forEach((r, i) => { out[keys[i]] = (r.results || []).map(x => x.v); });
  return out;
}

// ── names from the CMS copy (ix-content) ──────────────────
async function cmsCollections(env, warnings) {
  if (cmsCols && Date.now() - cmsColsAt < CMS_TTL) return cmsCols;
  let over = {};
  try { over = env.PERF_CMS ? JSON.parse(env.PERF_CMS) : {}; } catch (e) { warnings.push('PERF_CMS is not valid JSON, so it was ignored.'); }
  const found = {};
  const r = await env.CMS_DB.prepare('SELECT collection_id, display_name, copied FROM collections').all();
  const list = r.results || [];
  Object.keys(CMS_NAMES).forEach(k => {
    if (over[k]) { found[k] = { id: over[k], copied: 1 }; return; }
    const m = list.filter(c => String(c.display_name || '').trim().toUpperCase() === CMS_NAMES[k]);
    found[k] = m.length === 1 ? { id: m[0].collection_id, copied: m[0].copied } : null;
  });
  cmsCols = found; cmsColsAt = Date.now();
  return found;
}
async function namesRead(env, want, warnings) {
  const names = { publisher: {}, title: {}, advertiser: {} };
  const any = want.publisher.size || want.title.size || want.advertiser.size;
  if (!any) return names;
  if (!env.CMS_DB) { warnings.push('ix-perf has no CMS_DB binding (database ix-content), so ids and slugs show instead of names.'); return names; }
  try {
    const C = await cmsCollections(env, warnings);
    const jobs = [['publisher', 'publishers', 'slug'], ['title', 'titles', 'slug'], ['advertiser', 'customers', 'item_id']];
    for (const [k, coll, key] of jobs) {
      const vals = [...want[k]];
      if (!vals.length) continue;
      const c = C[coll];
      if (!c) { warnings.push(CMS_NAMES[coll] + ' was not found in the CMS copy, so ' + k + 's show their ' + (key === 'slug' ? 'slug' : 'id') + '.'); continue; }
      if (!c.copied) warnings.push(CMS_NAMES[coll] + ' is not on the CMS copy list, so its names may be missing or old.');
      for (let i = 0; i < vals.length; i += 90) {
        const part = vals.slice(i, i + 90);
        const r = await env.CMS_DB.prepare('SELECT ' + key + ' AS k, name FROM copy_items WHERE collection_id = ? AND ' + key + ' IN (' +
          part.map(() => '?').join(',') + ')').bind(c.id, ...part).all();
        (r.results || []).forEach(x => { if (x.name) names[k][x.k] = x.name; });
      }
    }
  } catch (e) { warnings.push('Names could not be read from the CMS copy: ' + ((e && e.message) || e)); }
  return names;
}

// ── GET /sources ──────────────────────────────────────────
async function sourcesRead(env) {
  const db = env.PERF_DB, tz = tzOf(env), now = Date.now(), today = dayOf(now, tz), warnings = [];
  let rules = DEF_SOURCES;
  try { if (env.PERF_SOURCES) rules = Object.assign({}, DEF_SOURCES, JSON.parse(env.PERF_SOURCES)); } catch (e) { warnings.push('PERF_SOURCES is not valid JSON, so the default rules are used.'); }
  const st = await db.prepare('SELECT * FROM source_status').all();
  const rows = {};
  (st.results || []).forEach(r => { rows[r.source] = r; });
  const since = addDays(today, -6), yday = addDays(today, -1), cut = now - 86400000;
  const tables = ['page_views', 'ad_views', 'clicks'];
  const res = await db.batch([
    ...tables.map(t => db.prepare('SELECT day, COUNT(*) AS n FROM ' + t + ' WHERE day BETWEEN ? AND ? GROUP BY day').bind(since, today)),
    ...tables.map(t => db.prepare('SELECT COUNT(*) AS n FROM ' + t + ' WHERE day BETWEEN ? AND ? AND at >= ?').bind(yday, today, cut))
  ]);
  const days = {};
  for (let i = 0; i < 7; i++) days[addDays(since, i)] = { page_views: 0, ad_views: 0, clicks: 0 };
  tables.forEach((t, i) => (res[i].results || []).forEach(r => { if (days[r.day]) days[r.day][t] = r.n; }));
  const rows24 = tables.reduce((s, t, i) => s + (((res[3 + i].results || [])[0] || {}).n || 0), 0);
  const rowsToday = tables.reduce((s, t) => s + days[today][t], 0);

  const keys = [...new Set(Object.keys(rules).concat(Object.keys(rows)))];
  const sources = keys.map(k => {
    const r = rows[k], hours = Number(rules[k] && rules[k].hours) || null;
    const o = { source: k, connected: !!r, hours, lastOkAt: r ? r.last_ok_at || null : null,
      lastErrorAt: r ? r.last_error_at || null : null, lastError: r ? r.last_error || '' : '', note: r ? r.note || '' : '' };
    if (!r) o.status = 'not_connected';
    else if (o.lastErrorAt && (!o.lastOkAt || o.lastErrorAt > o.lastOkAt)) o.status = 'failing';
    else if (!o.lastOkAt) o.status = 'never';
    else if (!hours) o.status = 'no_rule';
    else { const age = now - o.lastOkAt; o.status = age <= hours * 3600000 ? 'healthy' : age <= 2 * hours * 3600000 ? 'late' : 'down'; }
    if (k === 'site') { o.rows24 = rows24; o.rowsToday = rowsToday; o.days = Object.keys(days).sort().reverse().map(d => Object.assign({ day: d }, days[d])); }
    return o;
  });
  return { ok: true, now, today, tz, sources, warnings };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = originsOf(env).indexOf(origin.replace(/\/+$/, '')) >= 0;
    if (request.method === 'OPTIONS') return new Response(null, { status: allowed ? 204 : 403, headers: allowed ? cors(origin) : {} });
    if (url.pathname === '/health') return json({ ok: true, version: VERSION, d1: !!env.PERF_DB, seen: seenOf(env), tz: tzOf(env),
      members: !!(env.MEMBERS && typeof env.MEMBERS.fetch === 'function'), cms: !!env.CMS_DB });                // v1.1.0
    if ((url.pathname === '/raw' || url.pathname === '/sources') && request.method === 'GET') {                 // v1.1.0
      if (!allowed) return json({ ok: false, error: 'This page may not read ix-perf.' }, 403);
      return readRoute(url, request, env, origin);
    }
    if (url.pathname === '/config') return json({ ok: true, seen: seenOf(env) }, 200, allowed ? origin : null);
    if (url.pathname === '/c' && request.method === 'POST') {
      if (!allowed) return json({ ok: false, error: 'This page may not send to ix-perf.' }, 403);
      return collect(request, env, ctx, origin);
    }
    return json({ ok: false, error: 'No such route.' }, 404);
  },
};
