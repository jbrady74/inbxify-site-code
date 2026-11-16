// ix-perf-v1.0.0.js
// INBXIFY · Cloudflare Worker · ix-perf · the performance collector
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

const VERSION = '1.0.0';
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
           'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = originsOf(env).indexOf(origin.replace(/\/+$/, '')) >= 0;
    if (request.method === 'OPTIONS') return new Response(null, { status: allowed ? 204 : 403, headers: allowed ? cors(origin) : {} });
    if (url.pathname === '/health') return json({ ok: true, version: VERSION, d1: !!env.PERF_DB, seen: seenOf(env), tz: tzOf(env) });
    if (url.pathname === '/config') return json({ ok: true, seen: seenOf(env) }, 200, allowed ? origin : null);
    if (url.pathname === '/c' && request.method === 'POST') {
      if (!allowed) return json({ ok: false, error: 'This page may not send to ix-perf.' }, 403);
      return collect(request, env, ctx, origin);
    }
    return json({ ok: false, error: 'No such route.' }, 404);
  },
};
