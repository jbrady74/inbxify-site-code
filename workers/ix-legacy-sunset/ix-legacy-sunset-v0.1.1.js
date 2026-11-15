// ix-legacy-sunset-v0.1.1.js
// INBXIFY · Cloudflare Worker · ix-legacy-sunset
// v0.1.1 (15 Nov 2026) — PICTURE ADDRESSES WITH BRACKETS. The first Save
//   (WLN-116B) stopped at "Could not download …/69543f7d00806dc74a12bcfc_line%20(2…
//   (403)". Webflow file names keep brackets, e.g. "line (2).png", and the
//   v0.1.0 address finder stopped at "(", so it asked Webflow for a file that
//   does not exist (Webflow's file host answers 403 for a missing file).
//   Now: an address runs to its closing quote (every address in a capture
//   sits inside quotes), unmatched closing brackets are trimmed, the exact
//   addresses the capture sends are used first, and a download that fails
//   is retried once with the address re-encoded.
//   Nothing was written to Webflow by the failed Save; any pictures it had
//   already uploaded to Uploadcare before stopping are unused copies.
//
// Legacy Sunset S1 (15 Nov 2026). A short-lived Worker: deleted, with its KV
// namespace, when the series closes. Nothing else reads it.
//
// WHAT IT IS FOR
//   Old newsletters (NEWSLETTERS uses-legacy on) are drawn by the old layout
//   on the NEWSLETTERS Template, bound to the picker collections. To retire
//   the pickers, each old newsletter is captured in the browser (the bookmark
//   script legacy-sunset/ls-capture-vX.js, run on the live page after every
//   page script has run), checked in place by Jeff, then saved here into its
//   Web Render HTML, and uses-legacy is turned off.
//
// RULINGS IT FOLLOWS (Legacy Sunset seed + S1, 13–15 Nov 2026)
//   · Web HTML only. The capture carries its own style rules (inline <style>).
//   · Pictures on Webflow's file host are rehosted to Uploadcare: original
//     uploaded once, src = raw link + size + -/format/auto/ (Raw Links rule).
//   · Nothing is saved until Jeff has compared the capture in place and
//     pressed Save. Save writes the HTML first, reads it back, and only then
//     turns uses-legacy off, and reads that back (TOAST-TRUTH).
//   · Undo turns uses-legacy back on (the way back). The HTML stays.
//   · Never touches ix-issue-data, ix-content or any picture CMS field.
//
// ROUTES (all but /health need a signed-in staff member: Memberstack token,
// checked through the MEMBERS service binding to ix-members /whoami)
//   GET  /health                 open. Version and which bindings are set.
//   GET  /inventory              every NEWSLETTERS item with uses-legacy on,
//                                plus every item already saved here.
//   GET  /lookup?slug=           one NEWSLETTERS item by slug, with its
//                                save and fields status.
//   POST /fields  {id, html}     the CMS fields whose values appear in the
//                                capture, by collection (follows references
//                                two levels). Stored in KV for /report.
//   POST /save    {id, html, images:[{url,w}]}
//                                rehost Webflow-hosted pictures, write
//                                web-render-html, read back, turn
//                                uses-legacy off, read back.
//   POST /undo    {id}           uses-legacy back on, read back.
//   GET  /report                 all fields reports merged + the save log.
//
// BINDINGS AND SECRETS (Cloudflare dashboard, never in the repo)
//   WEBFLOW_TOKEN       Secret. Webflow site token, CMS read and write.
//   UPLOADCARE_PUB_KEY  Secret. Uploadcare public key (upload only).
//   MEMBERS             Service binding to ix-members.
//   LS_KV               KV namespace ix-legacy-sunset (fields reports, save log).
//   Optional plain variables: SITE_ID, UC_HOST.
//
// HARDCODING (provisional ids, for the tracker; all die with this Worker)
//   HC-P-LS1-1  NEWSLETTERS field slugs web-render-html and uses-legacy (F).
//   HC-P-LS1-2  Uploadcare host for new uploads, uyluucdnr2.ucarecd.net
//               (UC_HOST overrides; Raw Links open question 4 may change it).
//   HC-P-LS1-3  Webflow site id (SITE_ID overrides) and the NEWSLETTERS
//               collection found by slug "nl" or name "NEWSLETTERS".
//   HC-P-LS1-4  The list of Webflow file hosts treated as "must rehost" (WF_HOSTS).
//   HC-P-LS1-5  Allowed page origins (ORIGINS).

const VERSION = '0.1.1';
const ORIGINS = ['https://www.inbxify.com', 'https://inbxify.com'];          // HC-P-LS1-5
const SITE_ID_DEFAULT = '64b64d17aa77f55568870489';                           // HC-P-LS1-3
const UC_HOST_DEFAULT = 'uyluucdnr2.ucarecd.net';                             // HC-P-LS1-2
const F = { web: 'web-render-html', legacy: 'uses-legacy' };                   // HC-P-LS1-1
const WF_HOSTS = ['cdn.prod.website-files.com', 'assets.website-files.com',   // HC-P-LS1-4
  'assets-global.website-files.com', 'uploads-ssl.webflow.com', 'global-uploads.webflow.com'];
const WF_URL_RE = new RegExp('https?://(?:' + WF_HOSTS.map(h => h.replace(/\./g, '\\.')).join('|') + ')/[^\\s"\'<>{}]+', 'gi');
// An address found by WF_URL_RE, cut back to the address itself: it ends at
// the first HTML-escaped quote, and closing brackets that have no opening
// bracket in the address belong to a CSS url( … ) around it.
function cleanWf(u) {
  u = u.split('&quot;')[0].split('&#39;')[0].split('&#x27;')[0].replace(/&amp;/g, '&');
  let open = (u.match(/\(/g) || []).length, close = (u.match(/\)/g) || []).length;
  while (close > open && u.endsWith(')')) { u = u.slice(0, -1); close--; }
  return u.replace(/[;,]+$/, '');
}
const MARK = 'data-ls-capture';
const API = 'https://api.webflow.com/v2';
const GAP_MS = 650;            // Webflow pacing between calls
const MAX_ITEMS_FIELDS = 160;  // cap on items read by /fields

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const run = { env, cors, lastCall: 0, calls: 0 };
    try {
      if (url.pathname === '/health') return json(run, 200, health(env));
      const who = await identify(env, request);
      if (!who.ok) return json(run, who.status, { ok: false, error: who.why });
      if (!who.staff) return json(run, 403, { ok: false, error: 'This login is not staff.' });
      run.who = who;
      if (request.method === 'GET' && url.pathname === '/inventory') return json(run, 200, await inventory(run));
      if (request.method === 'GET' && url.pathname === '/lookup') return json(run, 200, await lookup(run, url.searchParams.get('slug') || ''));
      if (request.method === 'GET' && url.pathname === '/report') return json(run, 200, await report(run));
      if (request.method === 'POST') {
        const body = await request.json().catch(() => null);
        if (!body) throw httpErr(400, 'The request body is not JSON.');
        if (url.pathname === '/fields') return json(run, 200, await fields(run, body));
        if (url.pathname === '/save') return json(run, 200, await save(run, body));
        if (url.pathname === '/undo') return json(run, 200, await undo(run, body));
      }
      return json(run, 404, { ok: false, error: 'No such route.' });
    } catch (e) {
      return json(run, e.status || 500, { ok: false, error: (e && e.message) || String(e), calls: run.calls });
    }
  }
};

// ── plumbing ────────────────────────────────────────────────────────────────

function corsHeaders(origin) {
  const h = { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600', Vary: 'Origin' };
  if (ORIGINS.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
function json(run, status, obj) {
  return new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, run.cors) });
}
function httpErr(status, msg) { const e = new Error(msg); e.status = status; return e; }
function health(env) {
  return { ok: true, worker: 'ix-legacy-sunset', version: VERSION,
    bindings: { WEBFLOW_TOKEN: !!env.WEBFLOW_TOKEN, UPLOADCARE_PUB_KEY: !!env.UPLOADCARE_PUB_KEY,
      MEMBERS: !!(env.MEMBERS && env.MEMBERS.fetch), LS_KV: !!(env.LS_KV && env.LS_KV.get) },
    siteId: env.SITE_ID || SITE_ID_DEFAULT, ucHost: env.UC_HOST || UC_HOST_DEFAULT };
}

async function identify(env, request) {
  const auth = request.headers.get('Authorization') || '';
  if (!/^Bearer\s+\S+/i.test(auth)) return { ok: false, status: 401, why: 'Not signed in: no Memberstack token was sent.' };
  if (!env.MEMBERS || typeof env.MEMBERS.fetch !== 'function') return { ok: false, status: 500, why: 'The MEMBERS service binding (to ix-members) is not set on this Worker.' };
  let res, j = null;
  try { res = await env.MEMBERS.fetch(new Request('https://ix-members/whoami', { headers: { Authorization: auth } })); j = await res.json().catch(() => null); }
  catch (e) { return { ok: false, status: 502, why: 'ix-members did not answer: ' + ((e && e.message) || e) }; }
  if (!res.ok || !j || !j.ok) return { ok: false, status: res && res.status === 401 ? 401 : 403, why: (j && j.error) || 'The login check failed.' };
  return { ok: true, staff: !!j.staff, email: j.email || '', memberId: j.memberId };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// One Webflow call, paced, with 429 retries (Retry-After honoured).
async function wf(run, path, init) {
  if (!run.env.WEBFLOW_TOKEN) throw httpErr(500, 'WEBFLOW_TOKEN is not set on this Worker.');
  for (let attempt = 0; attempt < 5; attempt++) {
    const wait = run.lastCall + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    run.lastCall = Date.now(); run.calls++;
    const res = await fetch(API + path, Object.assign({}, init, { headers: Object.assign({
      Authorization: 'Bearer ' + run.env.WEBFLOW_TOKEN, accept: 'application/json', 'Content-Type': 'application/json' }, (init && init.headers) || {}) }));
    if (res.status === 429) { const ra = parseFloat(res.headers.get('Retry-After') || '') || (2 + attempt * 3); await sleep(ra * 1000); continue; }
    const j = await res.json().catch(() => null);
    if (!res.ok) throw httpErr(res.status === 404 ? 404 : 502, 'Webflow ' + res.status + ' on ' + path + ': ' + ((j && (j.message || j.msg)) || 'no message') +
      (j && j.details ? ' ' + JSON.stringify(j.details).slice(0, 300) : ''));
    return j;
  }
  throw httpErr(503, 'Webflow kept answering 429 (rate limit) on ' + path + '.');
}

async function nlCollection(run) {
  if (run.nlCol) return run.nlCol;
  const site = run.env.SITE_ID || SITE_ID_DEFAULT;
  const j = await wf(run, '/sites/' + site + '/collections');
  const cols = (j && j.collections) || [];
  let hit = cols.filter(c => (c.slug || '').toLowerCase() === 'nl');
  if (hit.length !== 1) hit = cols.filter(c => (c.displayName || '').trim().toUpperCase() === 'NEWSLETTERS');
  if (hit.length !== 1) throw httpErr(500, 'Could not find exactly one NEWSLETTERS collection (slug "nl" or name "NEWSLETTERS"); found ' + hit.length + '.');
  run.nlCol = hit[0].id;
  return run.nlCol;
}

async function listAll(run, colId) {
  const out = [];
  for (let offset = 0; offset < 5000; offset += 100) {
    const j = await wf(run, '/collections/' + colId + '/items?limit=100&offset=' + offset);
    const items = (j && j.items) || [];
    out.push(...items);
    if (items.length < 100) break;
  }
  return out;
}

function nlRow(it, saved) {
  const fd = it.fieldData || {};
  return { id: it.id, name: fd.name || '', slug: fd.slug || '', url: fd.slug ? 'https://www.inbxify.com/nl/' + fd.slug : '',
    usesLegacy: fd[F.legacy] === true, hasWebHtml: !!(fd[F.web] && String(fd[F.web]).trim()),
    draft: !!it.isDraft, archived: !!it.isArchived, published: !!it.lastPublished,
    saved: saved || null };
}

async function kvGet(run, key) { if (!run.env.LS_KV) return null; const v = await run.env.LS_KV.get(key); return v ? JSON.parse(v) : null; }
async function kvPut(run, key, obj) { if (run.env.LS_KV) await run.env.LS_KV.put(key, JSON.stringify(obj)); }
async function kvList(run, prefix) {
  if (!run.env.LS_KV) return [];
  const keys = []; let cursor;
  do { const r = await run.env.LS_KV.list({ prefix, cursor }); keys.push(...r.keys.map(k => k.name)); cursor = r.list_complete ? null : r.cursor; } while (cursor);
  return keys;
}

// ── /inventory and /lookup ──────────────────────────────────────────────────

async function inventory(run) {
  const col = await nlCollection(run);
  const items = await listAll(run, col);
  const savedKeys = new Set((await kvList(run, 'saved:')).map(k => k.slice(6)));
  const rows = [];
  for (const it of items) {
    const legacy = (it.fieldData || {})[F.legacy] === true;
    if (!legacy && !savedKeys.has(it.id)) continue;
    rows.push(nlRow(it, savedKeys.has(it.id) ? await kvGet(run, 'saved:' + it.id) : null));
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return { ok: true, collectionId: col, newslettersInCollection: items.length,
    legacyOn: rows.filter(r => r.usesLegacy).length, saved: rows.filter(r => r.saved && !r.usesLegacy).length,
    notPublished: rows.filter(r => r.usesLegacy && (!r.published || r.draft || r.archived)).length, rows, calls: run.calls };
}

async function lookup(run, slug) {
  slug = slug.trim().toLowerCase();
  if (!slug) throw httpErr(400, 'Give ?slug=.');
  const col = await nlCollection(run);
  const j = await wf(run, '/collections/' + col + '/items?slug=' + encodeURIComponent(slug) + '&limit=5');
  let it = ((j && j.items) || []).find(i => ((i.fieldData || {}).slug || '') === slug);
  if (!it) { const all = await listAll(run, col); it = all.find(i => ((i.fieldData || {}).slug || '') === slug); }
  if (!it) throw httpErr(404, 'No NEWSLETTERS item has the slug "' + slug + '".');
  const row = nlRow(it, await kvGet(run, 'saved:' + it.id));
  const fr = await kvGet(run, 'fields:' + it.id);
  return { ok: true, collectionId: col, item: row, fieldsReport: fr ? { at: fr.at, collections: fr.collections.length } : null };
}

// ── /fields : which CMS fields show in the capture ─────────────────────────

const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n));
const norm = s => decode(String(s)).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function valueHits(field, val, hay) {
  if (val == null || val === '') return false;
  const t = field.type;
  if (t === 'Switch' || t === 'Number' || t === 'DateTime' || t === 'Color' || t === 'Reference' || t === 'MultiReference') return false;
  if (t === 'Image' || t === 'File') return val.url ? hay.raw.includes(fileTail(val.url)) : false;
  if (t === 'MultiImage') return (val || []).some(v => v && v.url && hay.raw.includes(fileTail(v.url)));
  if (t === 'Option') { const o = ((field.validations || {}).options || []).find(x => x.id === val); return o ? hay.text.includes(norm(o.name)) : false; }
  const s = String(val);
  const ids = s.match(UUID_RE);
  if (ids && /ucarecd|ucarecdn/.test(s)) return ids.some(id => hay.raw.toLowerCase().includes(id.toLowerCase()));
  if (/^https?:\/\//i.test(s.trim())) return hay.raw.includes(s.trim()) || hay.raw.includes(s.trim().replace(/&/g, '&amp;'));
  const n = norm(s);
  if (n.length < 4) return false;
  return hay.text.includes(n.length > 120 ? n.slice(0, 80) : n);
}
function fileTail(u) { try { return decodeURIComponent(new URL(u).pathname.split('/').pop()); } catch (e) { return String(u); } }

async function fields(run, body) {
  const id = String(body.id || ''), html = String(body.html || '');
  if (!/^[0-9a-f]{24}$/.test(id)) throw httpErr(400, 'Give the NEWSLETTERS item id.');
  if (!html.includes(MARK)) throw httpErr(400, 'That is not a capture (no ' + MARK + ' marker).');
  const hay = { raw: html + ' ' + decodeURIComponent(html.replace(/%(?![0-9a-f]{2})/gi, '%25')), text: norm(html) };
  const nlCol = await nlCollection(run);
  const schemas = new Map();
  const schema = async cid => { if (!schemas.has(cid)) schemas.set(cid, await wf(run, '/collections/' + cid)); return schemas.get(cid); };
  const found = new Map();   // colId -> Map(slug -> {name,type,hits})
  const seen = new Set(); let itemsRead = 0, capped = false;
  const queue = [{ col: nlCol, id, depth: 0 }];
  while (queue.length) {
    const q = queue.shift();
    const key = q.col + '/' + q.id;
    if (seen.has(key)) continue;
    seen.add(key);
    if (itemsRead >= MAX_ITEMS_FIELDS) { capped = true; break; }
    let it;
    try { it = await wf(run, '/collections/' + q.col + '/items/' + q.id); } catch (e) { continue; }
    itemsRead++;
    const sc = await schema(q.col), fd = (it && it.fieldData) || {};
    for (const f of (sc.fields || [])) {
      const v = fd[f.slug];
      if (q.depth < 2 && (f.type === 'Reference' || f.type === 'MultiReference')) {
        const target = (f.validations || {}).collectionId;
        const ids = Array.isArray(v) ? v : v ? [v] : [];
        if (target) for (const rid of ids) queue.push({ col: target, id: rid, depth: q.depth + 1 });
      }
      if (valueHits(f, v, hay)) {
        if (!found.has(q.col)) found.set(q.col, new Map());
        const m = found.get(q.col);
        const cur = m.get(f.slug) || { slug: f.slug, name: f.displayName, type: f.type, hits: 0 };
        cur.hits++; m.set(f.slug, cur);
      }
    }
  }
  const collections = [];
  for (const [cid, m] of found) collections.push({ collectionId: cid, name: (schemas.get(cid) || {}).displayName || cid,
    fields: [...m.values()].sort((a, b) => a.slug.localeCompare(b.slug)) });
  collections.sort((a, b) => a.name.localeCompare(b.name));
  const rep = { ok: true, id, at: new Date().toISOString(), itemsRead, capped, collections,
    note: 'Found by value: a field counts when its value appears in the capture. Fields used only for conditional visibility, filters or sorting print nothing and cannot be seen here; switches, numbers and dates are not matched.' };
  await kvPut(run, 'fields:' + id, rep);
  rep.calls = run.calls;
  return rep;
}

async function report(run) {
  const merged = new Map();
  const fieldKeys = await kvList(run, 'fields:');
  for (const k of fieldKeys) {
    const r = await kvGet(run, k); if (!r) continue;
    for (const c of r.collections) {
      if (!merged.has(c.collectionId)) merged.set(c.collectionId, { collectionId: c.collectionId, name: c.name, fields: new Map() });
      const m = merged.get(c.collectionId).fields;
      for (const f of c.fields) { const cur = m.get(f.slug) || { slug: f.slug, name: f.name, type: f.type, newsletters: 0 }; cur.newsletters++; m.set(f.slug, cur); }
    }
  }
  const saved = [];
  for (const k of await kvList(run, 'saved:')) { const s = await kvGet(run, k); if (s) saved.push(s); }
  return { ok: true, newslettersChecked: fieldKeys.length,
    collections: [...merged.values()].map(c => ({ collectionId: c.collectionId, name: c.name, fields: [...c.fields.values()] })).sort((a, b) => a.name.localeCompare(b.name)),
    saved: saved.sort((a, b) => (a.name || '').localeCompare(b.name || '')) };
}

// ── /save and /undo ─────────────────────────────────────────────────────────

async function readItem(run, col, id) {
  // The live copy is what the page serves; fall back to staged if never published.
  try { return await wf(run, '/collections/' + col + '/items/' + id + '/live'); }
  catch (e) { if (e.status === 404) return await wf(run, '/collections/' + col + '/items/' + id); throw e; }
}
async function writeItem(run, col, id, fieldData, published) {
  const path = '/collections/' + col + '/items/' + id + (published ? '/live' : '');
  return wf(run, path, { method: 'PATCH', body: JSON.stringify({ fieldData }) });
}

async function rehost(run, srcUrl, width) {
  const key = run.env.UPLOADCARE_PUB_KEY;
  if (!key) throw httpErr(500, 'UPLOADCARE_PUB_KEY is not set on this Worker.');
  let res = await fetch(srcUrl);
  if (!res.ok) {
    let alt = srcUrl;
    try { alt = encodeURI(decodeURI(srcUrl)); } catch (e) {}
    if (alt !== srcUrl) res = await fetch(alt);
  }
  if (!res.ok) throw httpErr(502, 'Could not download ' + srcUrl + ' (' + res.status + '). Nothing was written to Webflow.');
  const type = (res.headers.get('Content-Type') || 'application/octet-stream').split(';')[0];
  const bytes = await res.arrayBuffer();
  const name = fileTail(srcUrl).replace(/^[0-9a-f]{24}_/, '').replace(/[^\w.-]+/g, '_').slice(0, 80) || 'image';
  const up = new FormData();
  up.append('UPLOADCARE_PUB_KEY', key); up.append('UPLOADCARE_STORE', '1');
  up.append('file', new Blob([bytes], { type }), name);
  const r = await fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: up });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || !j.file) throw httpErr(502, 'Uploadcare refused ' + name + ': ' + r.status + ' ' + JSON.stringify(j).slice(0, 200));
  const raw = 'https://' + (run.env.UC_HOST || UC_HOST_DEFAULT) + '/' + j.file + '/';
  const svg = type === 'image/svg+xml' || /\.svg$/i.test(name);
  // SVG is not processed by Uploadcare, so it gets no size or format.
  const shown = svg ? raw : raw + (width > 0 ? '-/resize/' + width + 'x/' : '') + '-/format/auto/';
  return { from: srcUrl, to: shown, uuid: j.file, bytes: bytes.byteLength, type };
}

async function save(run, body) {
  const id = String(body.id || '');
  let html = String(body.html || '');
  if (!/^[0-9a-f]{24}$/.test(id)) throw httpErr(400, 'Give the NEWSLETTERS item id.');
  if (!html.includes(MARK)) throw httpErr(400, 'That is not a capture (no ' + MARK + ' marker).');
  if (/<script[\s>]/i.test(html)) throw httpErr(400, 'The capture still holds a <script>; captures carry none.');
  const col = await nlCollection(run);
  const before = await readItem(run, col, id);
  const fd0 = (before && before.fieldData) || {};
  if (fd0[F.legacy] !== true) throw httpErr(409, 'uses-legacy is already off on ' + (fd0.name || id) + '. Use Undo first to capture it again.');
  const published = !!before.lastPublished;

  // 1 · Rehost every Webflow-hosted picture the capture still points at.
  const widths = new Map();
  for (const im of (Array.isArray(body.images) ? body.images : [])) if (im && im.url) widths.set(im.url, Math.max(widths.get(im.url) || 0, Math.round(+im.w || 0)));
  const urls = [...new Set([...widths.keys()].filter(u => html.includes(u) || html.includes(u.replace(/&/g, '&amp;')))
    .concat((html.match(WF_URL_RE) || []).map(cleanWf)))]
    .sort((a, b) => b.length - a.length);   // longest first, so no address is replaced inside a longer one
  const rehosted = [];
  for (const u of urls) {
    const r = await rehost(run, u, Math.min(widths.get(u) || 0, 3000));
    rehosted.push(r);
    html = html.split(u).join(r.to).split(u.replace(/&/g, '&amp;')).join(r.to);
  }
  const left = (html.match(WF_URL_RE) || []).map(cleanWf);
  if (left.length) throw httpErr(500, 'Webflow-hosted links are still in the capture after rehosting: ' + left.slice(0, 3).join(', ') + '. Nothing was saved.');

  // 2 · Write Web Render HTML, read it back.
  await writeItem(run, col, id, { [F.web]: html }, published);
  const r1 = await readItem(run, col, id);
  const got = String(((r1 && r1.fieldData) || {})[F.web] || '');
  if (got !== html) {
    let i = 0; while (i < got.length && got[i] === html[i]) i++;
    throw httpErr(502, 'Web Render HTML did not read back the same (sent ' + html.length + ' characters, read ' + got.length +
      ', first difference at ' + i + '). uses-legacy was left on.');
  }

  // 3 · Turn uses-legacy off, read it back.
  await writeItem(run, col, id, { [F.legacy]: false }, published);
  const r2 = await readItem(run, col, id);
  const legacyNow = ((r2 && r2.fieldData) || {})[F.legacy];
  if (legacyNow !== false) throw httpErr(502, 'The HTML is saved, but uses-legacy did not read back off. Check the item in Webflow.');

  const rec = { id, name: fd0.name || '', slug: fd0.slug || '', at: new Date().toISOString(), by: run.who.email,
    characters: html.length, rehosted: rehosted.map(r => ({ from: r.from, to: r.to, bytes: r.bytes })), published };
  await kvPut(run, 'saved:' + id, rec);
  return { ok: true, saved: rec, readBack: { webHtmlCharacters: got.length, usesLegacy: legacyNow }, calls: run.calls };
}

async function undo(run, body) {
  const id = String(body.id || '');
  if (!/^[0-9a-f]{24}$/.test(id)) throw httpErr(400, 'Give the NEWSLETTERS item id.');
  const col = await nlCollection(run);
  const before = await readItem(run, col, id);
  await writeItem(run, col, id, { [F.legacy]: true }, !!before.lastPublished);
  const r = await readItem(run, col, id);
  const on = ((r && r.fieldData) || {})[F.legacy];
  if (on !== true) throw httpErr(502, 'uses-legacy did not read back on.');
  const rec = await kvGet(run, 'saved:' + id);
  if (rec) { rec.undoneAt = new Date().toISOString(); rec.undoneBy = run.who.email; await kvPut(run, 'saved:' + id, rec); }
  return { ok: true, id, usesLegacy: on, calls: run.calls };
}
