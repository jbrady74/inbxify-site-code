// ix-sales-v1.0.1.js
// INBXIFY · Cloudflare Worker · ix-sales
// SALES RECORDS and OBLIGATIONS: the one place the rules live. The portal
// (S2) and Studio (S3) both call this; the Revenue Picker (S4) and Scenario
// 108 (S5) call it too. Scoping: Sales-Records-Obligations-Scoping-v0_3.md.
//
// v1.0.1 (2 Nov 2026, S1) — SALES RECORDS multi-ref slug is titles-sold (targets TITLES-ADMIN). No other change.
// v1.0.0 (2 Nov 2026, S1) — FIRST BUILD.
//   Rulings carried (SR-1 to SR-17, the lifecycle, the sweep):
//   · One sales record per product line. Obligations are generated on save,
//     one per EDITION SEND, by placement: Single, Mirrored, Split, Pool.
//     Window frequency: every send due by window-end. Every edition: one
//     send per PUBLICATION PLAN of the title from start-month, count capped
//     at sends. End date is never stored.
//   · Edit: Open obligations are regenerated; Assigned, Fulfilled, Missed
//     stay. Cancel: Open and Assigned → Cancelled; the record → Ended.
//   · Missed goes stale; Make good writes a replacement in a chosen month
//     and names the Missed one in make-good-of.
//   · Fulfil: Scenario 108 posts the edition; every Assigned obligation on
//     it → Fulfilled, fulfilled-at = now, audience = NEWSLETTER send-volume
//     (the number a person kept on Send Setup).
//   · The sweep (cron, daily): Open past its due month's last edition, or
//     past due-by → Missed. No creative: Open, due within the title's
//     no-creative-lead editions, no ADS of the shape for the customer on the
//     title → flagged (computed, never stored).
//   · Default ad: /ads/<id>/default sets default-for-shape and clears every
//     other ad of the same customer and shape. No fallback anywhere.
//   · Pool obligations have no title-admin until /assign sets it.
//   · Products: PRODUCT LIBRARY rows whose sold-by names any of the
//     publisher's TITLES-ADMIN rows. Titles: grouped by TITLES county.
//   WRITES. Webflow v2 create / PATCH / publish with WEBFLOW_WRITE_TOKEN.
//   Every create writes self-this-item-id. A write counts only when Webflow
//   echoes the value sent (TOAST-TRUTH); the answer says written and
//   unconfirmed. Option values are written by ID, read from each schema by
//   label (never typed). Reads use WEBFLOW_TOKEN, staged.
//   ACCESS. Browser routes answer only IX_CONFIG.allowedOrigins (the portal
//   and Studio pages). Make routes (/fulfil, /sweep by hand) take X-IX-Key.
//   The portal sends ?publisher=<PUBLISHERS id>; S2 must prove the logged-in
//   member owns that publisher (Memberstack id on TITLES) before the page
//   is allowed to ask. The Worker trusts the origin, not the member.
//
// IX_CONFIG (Plain text, JSON) — platform values, HC-S-1 by design
//   { "collections": { "sales": "68fbca18098fd19160cfd6d7",
//       "obligations": "68fd04367a3d8ba79eb3bf6e",
//       "publishers": "64e905038caaa2edd76842ba", "customers": "6539226238805f7127e99189",
//       "titles": "64e905038caaa2edd76842bb", "titlesSite": "690ab3509c59e0b616c9addb",
//       "newsletters": "64e905038caaa2edd76842bc", "ads": "68929c45dc27b1bb31fb4404",
//       "articles": "64e905038caaa2edd76842b5", "franchises": "68fa2e3c16639f180010d514",
//       "plans": "68b1ce556019ec55bf4727f3" },
//     "allowedOrigins": ["https://www.inbxify.com","https://inbxify.com","https://app.inbxify.com"],
//     "shapeBundleDefault": "banner>sidebar",      // HC-P-SR-8
//     "noCreativeLeadDefault": 2,                   // when a title has none
//     "cacheSeconds": 600 }
// SECRETS  WEBFLOW_TOKEN (CMS read), WEBFLOW_WRITE_TOKEN (CMS read+write), IX_KEY
// CRON     wrangler.toml  [triggers] crons = ["30 9 * * *"]   (05:30 Eastern in winter)
//
// HARDCODING (provisional ids, for the tracker)
//   HC-S-1  Collection ids and origins in IX_CONFIG. By design.
//   HC-S-2  Field slugs in JOIN. Same class as HC-P-DW1-2. The S0 contract.
//   HC-S-3  ADS add-type label per slot shape (SHAPE_AD_TYPE). The only way
//           to know which ADS rows fit a shape until ADS carries slot-shape.
//   HC-S-4  Name pattern SR-0001 / SR-0001-01 (SR_PAD, OB_PAD).
//   HC-S-5  Pool spread: sends evenly over the months of the window, the
//           remainder on the earliest months.
//   HC-S-6  The "last edition of the month" rule for Missed reads
//           PUBLICATION PLAN publication-date; a title with no plan in the
//           month falls back to the calendar month end.
// ============================================================

const VERSION = '1.0.1';
const WF = 'https://api.webflow.com/v2';
const PAGE = 100, MAX_PAGES = 100, PARALLEL = 4, MAX_RETRIES = 4;
const SR_PAD = 4, OB_PAD = 2;                                        // HC-S-4

// HC-S-2 · the S0 contract. Slugs confirmed by API dump 2 Nov 2026.
const JOIN = {
  sales: { publisher: 'publisher', customer: 'customer', product: 'product', franchise: 'franchise',
           titles: 'titles-sold', status: 'status', type: 'type', placement: 'placement', frequency: 'frequency',
           week: 'week', startMonth: 'start-month', windowEnd: 'window-end', sends: 'sends',
           splitCounts: 'split-counts', enteredBy: 'entered-by', self: 'self-this-item-id' },
  ob: { publisher: 'publisher', customer: 'customer', sales: 'sales-record', title: 'title-admin',
        edition: 'edition', ad: 'ad', article: 'article', type: 'type', status: 'status', shape: 'slot-shape',
        productId: 'product-id', dueMonth: 'due-month', dueBy: 'due-by', week: 'week', audience: 'audience',
        fulfilledAt: 'fulfilled-at', makeGoodOf: 'make-good-of', enteredBy: 'entered-by', self: 'self-this-item-id' },
  ta: { publisher: 'associated-client', bundles: 'shape-bundles', lead: 'no-creative-lead', volumeDefault: 'send-volume-default' },
  titleSite: { ta: 'titles-admin', county: 'county' },
  plan: { ta: 'title-admin', date: 'publication-date', status: 'planning-status' },
  nl: { plan: 'publication-plan', ta: 'sector', volume: 'send-volume' },
  ad: { customer: 'associated-advertiser', titles: 'titles', type: 'add-type', status: 'status', isDefault: 'default-for-shape',
        banner: 'banner-ad-link', sidebar: 'sidebar-ad-link', splash: 'splash-ad-link--get', companion: 'companion-sidebar' },
  product: { soldBy: 'sold-by', shape: 'slot-shape' },
};
// HC-S-3 · which ADS rows fit a slot shape, by the add-type LABEL.
const SHAPE_AD_TYPE = { banner: 'Banner Ad', sidebar: 'Sidebar Ad', splash: 'Splash Ad', 'sponsor band': 'Banner Ad', 'list block': 'Text Ad' };
const STATUS = { open: 'Open', assigned: 'Assigned', fulfilled: 'Fulfilled', missed: 'Missed', cancelled: 'Cancelled' };
const SR_STATUS = { active: 'Active', ended: 'Ended' };
const PLACEMENT = { single: 'Single', mirrored: 'Mirrored', split: 'Split', pool: 'Pool' };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname.replace(/\/+$/, '') || '/';
    if (p === '/health') return json({ ok: true, version: VERSION }, 200);
    if (request.method === 'OPTIONS') return preflight(request, env);
    let run;
    try {
      const cfg = loadConfig(env);
      run = new Run(env, ctx, cfg, request);
      const m = request.method;
      const id = (p.match(/^\/(sales|obligations|ads)\/([0-9a-f]{24})(?:\/([a-z-]+))?$/) || []);
      // ── Make routes (key) ──
      if (p === '/fulfil' && m === 'POST') { run.needKey(); return run.out(await fulfil(run, await body(request)), 200); }
      if (p === '/sweep' && m === 'GET') { run.needKey(); return run.out(await sweep(run), 200); }
      // ── browser routes (origin) ──
      run.needOrigin();
      if (p === '/sales' && m === 'GET') return run.out(await listSales(run, url), 200);
      if (p === '/sales' && m === 'POST') return run.out(await createSale(run, await body(request)), 200);
      if (id[1] === 'sales' && !id[3] && m === 'PATCH') return run.out(await editSale(run, id[2], await body(request)), 200);
      if (id[1] === 'sales' && id[3] === 'cancel' && m === 'POST') return run.out(await cancelSale(run, id[2]), 200);
      if (p === '/obligations' && m === 'GET') return run.out(await listObligations(run, url), 200);
      if (p === '/obligations' && m === 'POST') return run.out(await createOneOff(run, await body(request)), 200);
      if (id[1] === 'obligations' && id[3] === 'make-good' && m === 'POST') return run.out(await makeGood(run, id[2], await body(request)), 200);
      if (id[1] === 'obligations' && id[3] === 'assign' && m === 'POST') return run.out(await assign(run, id[2], await body(request), true), 200);
      if (id[1] === 'obligations' && id[3] === 'unassign' && m === 'POST') return run.out(await assign(run, id[2], {}, false), 200);
      if (id[1] === 'ads' && id[3] === 'default' && m === 'POST') return run.out(await setDefaultAd(run, id[2]), 200);
      if (p === '/pool' && m === 'GET') return run.out(await pool(run, url), 200);
      if (p === '/products' && m === 'GET') return run.out(await products(run, url), 200);
      if (p === '/titles' && m === 'GET') return run.out(await titles(run, url), 200);
      return run.out({ ok: false, error: 'Unknown route. See the v1.0.1 header.' }, 404);
    } catch (e) {
      const status = (e && e.status) || 502;
      const o = run ? run.out.bind(run) : (b, s) => json(b, s);
      return o({ ok: false, error: (e && e.message) || String(e), version: VERSION, meta: run ? run.meta() : null }, status);
    }
  },
  async scheduled(event, env, ctx) {                                   // the daily sweep
    const run = new Run(env, ctx, loadConfig(env), null);
    ctx.waitUntil(sweep(run).catch(e => console.log('sweep failed: ' + ((e && e.message) || e))));
  },
};

// ── config, access, run ──────────────────────────────────────
function loadConfig(env) {
  let cfg; try { cfg = JSON.parse(env.IX_CONFIG || ''); } catch (e) { throw httpErr(500, 'IX_CONFIG is missing or is not valid JSON.'); }
  const C = cfg.collections || {};
  const need = ['sales', 'obligations', 'publishers', 'customers', 'titles', 'titlesSite', 'newsletters', 'ads', 'franchises', 'plans'];
  const missing = need.filter(k => !/^[0-9a-f]{24}$/.test(C[k] || ''));
  if (missing.length) throw httpErr(500, 'IX_CONFIG.collections is missing: ' + missing.join(', ') + '.');
  return cfg;
}
function preflight(request, env) {
  let cfg = null; try { cfg = loadConfig(env); } catch (e) {}
  const origin = request.headers.get('Origin') || '';
  const ok = !!cfg && (cfg.allowedOrigins || []).includes(origin);
  return new Response(null, { status: 204, headers: ok ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-IX-Key', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' } : { 'Vary': 'Origin' } });
}
async function body(request) { try { return await request.json(); } catch (e) { throw httpErr(400, 'The body is not JSON.'); } }

class Run {
  constructor(env, ctx, cfg, request) {
    this.env = env; this.ctx = ctx; this.cfg = cfg; this.request = request;
    this.origin = request ? (request.headers.get('Origin') || '') : '';
    this.ttl = Number(cfg.cacheSeconds) > 0 ? Number(cfg.cacheSeconds) : 600;
    this.calls = 0; this.writes = 0; this.retries = 0; this.warnings = []; this.t0 = Date.now();
    this.active = 0; this.waiting = []; this.memo = new Map();
  }
  warn(m) { if (!this.warnings.includes(m)) this.warnings.push(m); }
  meta() { return { version: VERSION, webflowCalls: this.calls, writes: this.writes, retries: this.retries, ms: Date.now() - this.t0, warnings: this.warnings }; }
  needKey() { if (!this.env.IX_KEY || !this.request || this.request.headers.get('X-IX-Key') !== this.env.IX_KEY) throw httpErr(401, 'Missing or wrong X-IX-Key header.'); }
  needOrigin() {
    const allowed = Array.isArray(this.cfg.allowedOrigins) ? this.cfg.allowedOrigins : [];
    if (!allowed.length) throw httpErr(403, 'IX_CONFIG.allowedOrigins is not set, so this route answers no one.');
    if (!allowed.includes(this.origin)) throw httpErr(403, 'This origin may not call ix-sales.');
  }
  out(obj, status) {
    const h = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
    if (this.origin && (this.cfg.allowedOrigins || []).includes(this.origin)) h['Access-Control-Allow-Origin'] = this.origin;
    if (obj && obj.ok !== undefined && !obj.meta) obj.meta = this.meta();
    return new Response(JSON.stringify(obj), { status, headers: h });
  }
  async slot(fn) { while (this.active >= PARALLEL) await new Promise(r => this.waiting.push(r)); this.active++;
    try { return await fn(); } finally { this.active--; const n = this.waiting.shift(); if (n) n(); } }
  async wf(path, opts) {
    const o = opts || {};
    const write = !!o.method && o.method !== 'GET';
    const token = write ? this.env.WEBFLOW_WRITE_TOKEN : this.env.WEBFLOW_TOKEN;
    if (!token) throw httpErr(500, (write ? 'WEBFLOW_WRITE_TOKEN' : 'WEBFLOW_TOKEN') + ' is not set on this Worker.');
    for (let attempt = 0; ; attempt++) {
      const res = await this.slot(() => { this.calls++; if (write) this.writes++;
        return fetch(WF + path, { method: o.method || 'GET', body: o.body ? JSON.stringify(o.body) : undefined,
          headers: Object.assign({ Authorization: 'Bearer ' + token, 'accept-version': '2.0.0' }, o.body ? { 'Content-Type': 'application/json' } : {}) }); });
      if (res.ok) return res.status === 204 ? {} : res.json();
      if (res.status === 404 && o.allow404) return null;
      if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) { this.retries++;
        const ra = Number(res.headers.get('Retry-After')); await sleep(ra > 0 ? Math.min(ra, 60) * 1000 : 1000 * Math.pow(2, attempt)); continue; }
      const txt = await res.text().catch(() => '');
      throw httpErr(res.status === 429 ? 503 : 502, 'Webflow HTTP ' + res.status + ' on ' + (o.method || 'GET') + ' ' + path + (txt ? ' · ' + txt.slice(0, 240) : ''));
    }
  }
  async listAll(collId) {                                            // every page, never a partial list
    const mk = 'list:' + collId; if (this.memo.has(mk)) return this.memo.get(mk);
    const p = (async () => {
      const base = '/collections/' + collId + '/items?limit=' + PAGE + '&offset=';
      const first = await this.wf(base + 0); const pages = [first.items || []];
      const total = Number(first.pagination && first.pagination.total) || 0;
      const planned = Math.ceil(total / PAGE); if (planned > MAX_PAGES) throw httpErr(502, 'Collection ' + collId + ' is over the read limit.');
      const offs = []; for (let i = 1; i < planned; i++) offs.push(i * PAGE);
      (await Promise.all(offs.map(off => this.wf(base + off).then(r => r.items || [])))).forEach(x => pages.push(x));
      while (pages[pages.length - 1].length === PAGE) { if (pages.length >= MAX_PAGES) throw httpErr(502, 'Collection ' + collId + ' is over the read limit.'); pages.push((await this.wf(base + pages.length * PAGE)).items || []); }
      const seen = new Set(); return pages.flat().filter(r => seen.has(r.id) ? false : (seen.add(r.id), true));
    })();
    this.memo.set(mk, p); p.catch(() => this.memo.delete(mk)); return p;
  }
  async schema(collId) { const mk = 'schema:' + collId; if (!this.memo.has(mk)) this.memo.set(mk, this.wf('/collections/' + collId)); return this.memo.get(mk); }
  async getItem(collId, id) { return /^[0-9a-f]{24}$/.test(id || '') ? this.wf('/collections/' + collId + '/items/' + id, { allow404: true }) : null; }
  // option id by label, from the schema (never typed)
  async optId(collId, slug, label) {
    const s = await this.schema(collId);
    const f = ((s && s.fields) || []).find(x => x.slug === slug && x.type === 'Option');
    if (!f) throw httpErr(500, 'Collection ' + collId + ' has no Option field "' + slug + '".');
    const o = ((f.validations || {}).options || []).find(x => keyOf(x.name) === keyOf(label));
    if (!o) throw httpErr(500, 'Option field "' + slug + '" has no value "' + label + '".');
    return o.id;
  }
  async optLabel(collId, slug, id) {
    if (!id) return '';
    const s = await this.schema(collId);
    const f = ((s && s.fields) || []).find(x => x.slug === slug && x.type === 'Option');
    const o = f && ((f.validations || {}).options || []).find(x => x.id === id);
    return o ? o.name : '';
  }
  // ── writes, TOAST-TRUTH ──
  async create(collId, fieldData) {
    const r = await this.wf('/collections/' + collId + '/items', { method: 'POST', body: { isArchived: false, isDraft: false, fieldData } });
    const id = r && r.id; if (!id) throw httpErr(502, 'Webflow answered a create with no id.');
    const r2 = await this.wf('/collections/' + collId + '/items/' + id, { method: 'PATCH', body: { fieldData: { 'self-this-item-id': id } } });
    const echoed = echoes(r2, Object.assign({}, fieldData, { 'self-this-item-id': id }));
    await this.publish(collId, [id]);
    return { id, item: r2, unconfirmed: echoed };
  }
  async patch(collId, id, fieldData) {
    const r = await this.wf('/collections/' + collId + '/items/' + id, { method: 'PATCH', body: { fieldData } });
    await this.publish(collId, [id]);
    return { id, item: r, unconfirmed: echoes(r, fieldData) };
  }
  async publish(collId, ids) {
    try { await this.wf('/collections/' + collId + '/items/publish', { method: 'POST', body: { itemIds: ids } }); }
    catch (e) { this.warn('Publish of ' + ids.length + ' item(s) in ' + collId + ' failed: ' + ((e && e.message) || e) + '. The staged write stands.'); }
  }
}
function echoes(item, sent) {                                          // the fields Webflow did NOT echo back as sent
  const f = (item && item.fieldData) || {}, bad = [];
  Object.keys(sent).forEach(k => { const a = f[k], b = sent[k];
    const same = Array.isArray(b) ? JSON.stringify((a || []).map(refId).sort()) === JSON.stringify(b.map(refId).sort())
      : (b == null ? (a == null || a === '') : String(refId(a) || a) === String(refId(b) || b));
    if (!same) bad.push(k); });
  return bad;
}

// ── sales records ────────────────────────────────────────────
async function scope(run, publisherId) {
  if (!/^[0-9a-f]{24}$/.test(publisherId || '')) throw httpErr(400, 'Missing or malformed publisher.');
  const C = run.cfg.collections;
  const [tas, sites] = await Promise.all([run.listAll(C.titles), run.listAll(C.titlesSite)]);
  const mine = tas.filter(t => !t.isArchived && refId(fd(t)[JOIN.ta.publisher]) === publisherId);
  if (!mine.length) throw httpErr(404, 'No TITLES-ADMIN row belongs to publisher ' + publisherId + '.');
  const taIds = new Set(mine.map(t => t.id));
  const siteByTa = new Map(); sites.forEach(s => { const ta = refId(fd(s)[JOIN.titleSite.ta]); if (ta && taIds.has(ta)) siteByTa.set(ta, s); });
  return { publisherId, tas: mine, taIds, siteByTa, taById: new Map(mine.map(t => [t.id, t])) };
}
async function listSales(run, url) {
  const C = run.cfg.collections, S = JOIN.sales, O = JOIN.ob;
  const sc = await scope(run, url.searchParams.get('publisher'));
  const [sales, obs, custs, prods] = await Promise.all([run.listAll(C.sales), run.listAll(C.obligations), run.listAll(C.customers), run.listAll(C.franchises)]);
  const custBy = index(custs), prodBy = index(prods), taById = sc.taById;
  const obsBySale = new Map(); obs.forEach(o => { const s = refId(fd(o)[O.sales]); if (s) { if (!obsBySale.has(s)) obsBySale.set(s, []); obsBySale.get(s).push(o); } });
  const rows = [];
  for (const s of sales) {
    const f = fd(s); if (s.isArchived || refId(f[S.publisher]) !== sc.publisherId) continue;
    const mine = obsBySale.get(s.id) || [];
    const st = {}; for (const o of mine) { const l = await run.optLabel(C.obligations, O.status, fd(o)[O.status]); st[l] = (st[l] || 0) + 1; }
    const reached = mine.reduce((a, o) => a + (Number(fd(o)[O.audience]) || 0), 0);
    const last = mine.filter(o => fd(o)[O.status]).map(o => fd(o)[O.dueMonth]).filter(Boolean).sort().slice(-1)[0] || null;
    rows.push(Object.assign(await saleShape(run, s, custBy, prodBy, taById), {
      sends: mine.length, delivered: st[STATUS.fulfilled] || 0, missed: st[STATUS.missed] || 0, open: st[STATUS.open] || 0,
      assigned: st[STATUS.assigned] || 0, cancelled: st[STATUS.cancelled] || 0, reached, endsMonth: f[S.windowEnd] ? ym(f[S.windowEnd]) : last }));
  }
  rows.sort((a, b) => b.name.localeCompare(a.name));
  return { ok: true, publisher: sc.publisherId, sales: rows };
}
async function saleShape(run, s, custBy, prodBy, taById) {
  const C = run.cfg.collections, S = JOIN.sales, f = fd(s);
  const cust = custBy.get(refId(f[S.customer])), prod = prodBy.get(refId(f[S.product])), fr = prodBy.get(refId(f[S.franchise]));
  return { id: s.id, name: String(f.name || ''), customerId: refId(f[S.customer]), customer: cust ? String(fd(cust).name || '') : null,
    productId: refId(f[S.product]), product: prod ? String(fd(prod).name || '') : null,
    shape: prod ? await run.optLabel(C.franchises, JOIN.product.shape, fd(prod)[JOIN.product.shape]) : null,
    franchiseId: refId(f[S.franchise]), franchise: fr ? String(fd(fr).name || '') : null,
    titles: refIds(f[S.titles]).map(id => ({ id, name: (taById.get(id) ? String(fd(taById.get(id)).name || '') : null) })),
    status: await run.optLabel(C.sales, S.status, f[S.status]), type: await run.optLabel(C.sales, S.type, f[S.type]),
    placement: await run.optLabel(C.sales, S.placement, f[S.placement]), frequency: await run.optLabel(C.sales, S.frequency, f[S.frequency]),
    week: await run.optLabel(C.sales, S.week, f[S.week]), startMonth: String(f[S.startMonth] || ''), windowEnd: f[S.windowEnd] || null,
    sendsBought: Number(f[S.sends]) || 0, splitCounts: parseSplit(f[S.splitCounts]), enteredBy: String(f[S.enteredBy] || '') };
}
function parseSplit(v) { if (!v) return null; try { const o = JSON.parse(v); return o && typeof o === 'object' ? o : null; } catch (e) { return null; } }

// The request body for create and edit:
// { publisher, customer, product, franchise?, titles:[TITLES-ADMIN ids], placement, type, frequency,
//   startMonth:"YYYY-MM", windowEnd?:"YYYY-MM-DD", sends, week?, splitCounts?:{taId:n}, enteredBy }
async function validateSale(run, b, sc) {
  const C = run.cfg.collections;
  const err = m => { throw httpErr(400, m); };
  if (!/^[0-9a-f]{24}$/.test(b.customer || '')) err('customer is required.');
  if (!/^[0-9a-f]{24}$/.test(b.product || '')) err('product is required.');
  const titles = [...new Set((Array.isArray(b.titles) ? b.titles : []).filter(id => /^[0-9a-f]{24}$/.test(id)))];
  if (!titles.length) err('At least one title is required.');
  const bad = titles.filter(id => !sc.taIds.has(id)); if (bad.length) err('Titles not owned by this publisher: ' + bad.join(', ') + '.');
  if (!/^\d{4}-\d{2}$/.test(b.startMonth || '')) err('startMonth must be YYYY-MM.');
  const sends = Number(b.sends); if (!Number.isInteger(sends) || sends < 1) err('sends must be a whole number, 1 or more.');
  const placement = titles.length === 1 ? PLACEMENT.single : String(b.placement || PLACEMENT.mirrored);
  if (!Object.values(PLACEMENT).includes(placement)) err('placement must be Single, Mirrored, Split or Pool.');
  const frequency = String(b.frequency || 'Monthly');
  if (frequency === 'Window' && !/^\d{4}-\d{2}-\d{2}$/.test(b.windowEnd || '')) err('windowEnd (YYYY-MM-DD) is required for a Window.');
  let split = null;
  if (placement === PLACEMENT.split) {
    split = b.splitCounts && typeof b.splitCounts === 'object' ? b.splitCounts : null;
    if (!split) err('splitCounts {titleId: n} is required for Split.');
    const sum = titles.reduce((a, id) => a + (Number(split[id]) || 0), 0);
    if (sum !== sends) err('splitCounts add up to ' + sum + ', sends is ' + sends + '.');
  }
  const prod = await run.getItem(C.franchises, b.product); if (!prod) err('product is not a PRODUCT LIBRARY row.');
  const soldBy = refIds(fd(prod)[JOIN.product.soldBy]);
  if (!soldBy.some(id => sc.taIds.has(id))) err('This publisher does not sell "' + fd(prod).name + '" (sold-by).');
  const shape = await run.optLabel(C.franchises, JOIN.product.shape, fd(prod)[JOIN.product.shape]);
  if (!shape) run.warn('PRODUCT LIBRARY "' + fd(prod).name + '" has no slot-shape; its obligations carry none.');
  if (shape === 'sponsor band' && !/^[0-9a-f]{24}$/.test(b.franchise || '')) err('A franchise sponsor needs a franchise.');
  if (b.franchise && placement !== PLACEMENT.single) err('A franchise sponsor is sold on one title.');
  return { titles, sends, placement, frequency, split, shape, prod };
}
async function nextSrName(run) {
  const sales = await run.listAll(run.cfg.collections.sales);
  const n = sales.reduce((m, s) => { const x = /^SR-(\d+)$/.exec(String(fd(s).name || '')); return x ? Math.max(m, Number(x[1])) : m; }, 0);
  return 'SR-' + String(n + 1).padStart(SR_PAD, '0');
}
async function createSale(run, b) {
  const C = run.cfg.collections, S = JOIN.sales;
  const sc = await scope(run, b.publisher);
  const v = await validateSale(run, b, sc);
  const name = await nextSrName(run);
  const fields = {
    name, slug: name.toLowerCase(),
    [S.publisher]: sc.publisherId, [S.customer]: b.customer, [S.product]: b.product, [S.titles]: v.titles,
    [S.status]: await run.optId(C.sales, S.status, SR_STATUS.active), [S.type]: await run.optId(C.sales, S.type, b.type || 'Paid'),
    [S.placement]: await run.optId(C.sales, S.placement, v.placement), [S.frequency]: await run.optId(C.sales, S.frequency, v.frequency),
    [S.week]: await run.optId(C.sales, S.week, b.week || 'Any week'), [S.startMonth]: b.startMonth, [S.sends]: v.sends,
    [S.enteredBy]: String(b.enteredBy || '').slice(0, 120),
  };
  if (b.franchise) fields[S.franchise] = b.franchise;
  if (v.frequency === 'Window') fields[S.windowEnd] = b.windowEnd + 'T00:00:00.000Z';
  if (v.split) fields[S.splitCounts] = JSON.stringify(v.split);
  const w = await run.create(C.sales, fields);
  const gen = await generate(run, w.id, name, Object.assign({}, b, v, { publisher: sc.publisherId, shape: v.shape }), sc);
  return { ok: true, id: w.id, name, unconfirmed: w.unconfirmed, obligations: gen };
}
async function editSale(run, id, b) {
  const C = run.cfg.collections, S = JOIN.sales, O = JOIN.ob;
  const s = await run.getItem(C.sales, id); if (!s) throw httpErr(404, 'Sales record not found.');
  const sc = await scope(run, b.publisher || refId(fd(s)[S.publisher]));
  if (refId(fd(s)[S.publisher]) !== sc.publisherId) throw httpErr(403, 'This sales record belongs to another publisher.');
  const cur = fd(s);
  const merged = Object.assign({
    customer: refId(cur[S.customer]), product: refId(cur[S.product]), franchise: refId(cur[S.franchise]) || '', titles: refIds(cur[S.titles]),
    placement: await run.optLabel(C.sales, S.placement, cur[S.placement]), type: await run.optLabel(C.sales, S.type, cur[S.type]),
    frequency: await run.optLabel(C.sales, S.frequency, cur[S.frequency]), week: await run.optLabel(C.sales, S.week, cur[S.week]),
    startMonth: cur[S.startMonth], windowEnd: cur[S.windowEnd] ? String(cur[S.windowEnd]).slice(0, 10) : '', sends: cur[S.sends],
    splitCounts: parseSplit(cur[S.splitCounts]), enteredBy: cur[S.enteredBy],
  }, b);
  const v = await validateSale(run, merged, sc);
  const fields = {
    [S.customer]: merged.customer, [S.product]: merged.product, [S.titles]: v.titles, [S.franchise]: merged.franchise || null,
    [S.type]: await run.optId(C.sales, S.type, merged.type || 'Paid'), [S.placement]: await run.optId(C.sales, S.placement, v.placement),
    [S.frequency]: await run.optId(C.sales, S.frequency, v.frequency), [S.week]: await run.optId(C.sales, S.week, merged.week || 'Any week'),
    [S.startMonth]: merged.startMonth, [S.sends]: v.sends, [S.splitCounts]: v.split ? JSON.stringify(v.split) : '',
    [S.windowEnd]: v.frequency === 'Window' ? merged.windowEnd + 'T00:00:00.000Z' : null,
  };
  const w = await run.patch(C.sales, id, fields);
  // Open obligations go; everything else stays. Then regenerate, minus what already stands.
  const obs = (await run.listAll(C.obligations)).filter(o => refId(fd(o)[O.sales]) === id);
  const openId = await run.optId(C.obligations, O.status, STATUS.open), cancelledId = await run.optId(C.obligations, O.status, STATUS.cancelled);
  const kept = obs.filter(o => fd(o)[O.status] !== openId && fd(o)[O.status] !== cancelledId);
  let dropped = 0;
  for (const o of obs) if (fd(o)[O.status] === openId) { await run.patch(C.obligations, o.id, { [O.status]: cancelledId }); dropped++; }
  const gen = await generate(run, id, String(cur.name || ''), Object.assign({}, merged, v, { publisher: sc.publisherId, shape: v.shape }), sc, kept.length);
  return { ok: true, id, unconfirmed: w.unconfirmed, keptStanding: kept.length, openCancelled: dropped, obligations: gen };
}
async function cancelSale(run, id) {
  const C = run.cfg.collections, S = JOIN.sales, O = JOIN.ob;
  const s = await run.getItem(C.sales, id); if (!s) throw httpErr(404, 'Sales record not found.');
  const openId = await run.optId(C.obligations, O.status, STATUS.open), asgId = await run.optId(C.obligations, O.status, STATUS.assigned);
  const cancelledId = await run.optId(C.obligations, O.status, STATUS.cancelled);
  const obs = (await run.listAll(C.obligations)).filter(o => refId(fd(o)[O.sales]) === id);
  let n = 0;
  for (const o of obs) if ([openId, asgId].includes(fd(o)[O.status])) { await run.patch(C.obligations, o.id, { [O.status]: cancelledId }); n++; }
  const w = await run.patch(C.sales, id, { [S.status]: await run.optId(C.sales, S.status, SR_STATUS.ended) });
  return { ok: true, id, cancelled: n, unconfirmed: w.unconfirmed };
}

// ── generation ───────────────────────────────────────────────
// Returns the obligations written. `already` is how many standing ones a
// regenerate keeps, so the new ones fill the remaining count.
async function generate(run, saleId, saleName, v, sc, already) {
  const C = run.cfg.collections, O = JOIN.ob;
  const want = Math.max(0, (v.placement === PLACEMENT.mirrored ? v.sends * v.titles.length : v.sends) - (already || 0));
  if (!want) return [];
  const plans = (await run.listAll(C.plans)).filter(p => !p.isArchived);
  const [y, m] = v.startMonth.split('-').map(Number);
  const monthAt = i => { const d = new Date(Date.UTC(y, m - 1 + i, 1)); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'); };
  const step = v.frequency === 'Quarterly' ? 3 : 1;
  const windowMonths = v.frequency === 'Window' ? Math.max(1, monthsBetween(v.startMonth, ym(v.windowEnd)) + 1) : null;
  // the due month of send #i (0-based) on one title
  const dueFor = (i, taId) => {
    if (v.frequency === 'One time') return v.startMonth;
    if (v.frequency === 'Window') return monthAt(Math.floor(i * windowMonths / v.sends));       // HC-S-5
    if (v.frequency === 'Every edition') {
      const mine = plans.filter(p => refId(fd(p)[JOIN.plan.ta]) === taId && ym(fd(p)[JOIN.plan.date]) >= v.startMonth)
        .sort((a, b) => String(fd(a)[JOIN.plan.date]).localeCompare(String(fd(b)[JOIN.plan.date])));
      if (mine[i]) return ym(fd(mine[i])[JOIN.plan.date]);
      run.warn('Every edition: ' + (taId || 'the pool') + ' has fewer planned editions than sends; the rest fall monthly.');
      return monthAt(i);
    }
    return monthAt(i * step);
  };
  const rows = [];                                                   // { title, i }
  if (v.placement === PLACEMENT.single) for (let i = 0; i < v.sends; i++) rows.push({ title: v.titles[0], i });
  else if (v.placement === PLACEMENT.mirrored) v.titles.forEach(t => { for (let i = 0; i < v.sends; i++) rows.push({ title: t, i }); });
  else if (v.placement === PLACEMENT.split) v.titles.forEach(t => { const n = Number(v.split[t]) || 0; for (let i = 0; i < n; i++) rows.push({ title: t, i: Math.floor(i * (v.frequency === 'Window' ? 1 : 12) / Math.max(n, 1)) }); });
  else for (let i = 0; i < v.sends; i++) rows.push({ title: null, i: v.frequency === 'Window' ? i : Math.floor(i * 12 / v.sends) });   // Pool, HC-S-5
  const ids = {
    type: await run.optId(C.obligations, O.type, v.type || 'Paid'), open: await run.optId(C.obligations, O.status, STATUS.open),
    week: await run.optId(C.obligations, O.week, v.week || 'Any week'),
    shape: v.shape ? await run.optId(C.obligations, O.shape, v.shape) : null,
  };
  const out = []; let seq = (already || 0);
  for (const r of rows.slice(0, want)) {
    seq++;
    const name = saleName + '-' + String(seq).padStart(OB_PAD, '0');
    const fields = { name, slug: name.toLowerCase(), [O.publisher]: v.publisher, [O.customer]: v.customer, [O.sales]: saleId,
      [O.type]: ids.type, [O.status]: ids.open, [O.week]: ids.week, [O.productId]: v.product, [O.enteredBy]: String(v.enteredBy || '').slice(0, 120),
      [O.dueMonth]: dueFor(r.i, r.title) };
    if (r.title) fields[O.title] = r.title;
    if (ids.shape) fields[O.shape] = ids.shape;
    if (v.frequency === 'Window') fields[O.dueBy] = v.windowEnd + 'T00:00:00.000Z';
    const w = await run.create(C.obligations, fields);
    out.push({ id: w.id, name, title: r.title, dueMonth: fields[O.dueMonth], unconfirmed: w.unconfirmed });
  }
  return out;
}

// ── obligations ──────────────────────────────────────────────
async function obShape(run, o, custBy, taById, nlBy) {
  const C = run.cfg.collections, O = JOIN.ob, f = fd(o);
  const cust = custBy.get(refId(f[O.customer])), ta = taById.get(refId(f[O.title])), nl = nlBy && nlBy.get(refId(f[O.edition]));
  return { id: o.id, name: String(f.name || ''), salesId: refId(f[O.sales]), customerId: refId(f[O.customer]), customer: cust ? String(fd(cust).name || '') : null,
    titleId: refId(f[O.title]), title: ta ? String(fd(ta).name || '') : null, pool: !refId(f[O.title]),
    status: await run.optLabel(C.obligations, O.status, f[O.status]), type: await run.optLabel(C.obligations, O.type, f[O.type]),
    shape: await run.optLabel(C.obligations, O.shape, f[O.shape]), week: await run.optLabel(C.obligations, O.week, f[O.week]),
    productId: String(f[O.productId] || ''), dueMonth: String(f[O.dueMonth] || ''), dueBy: f[O.dueBy] ? String(f[O.dueBy]).slice(0, 10) : null,
    editionId: refId(f[O.edition]), edition: nl ? String(fd(nl).name || '') : null, adId: refId(f[O.ad]), articleId: refId(f[O.article]),
    audience: f[O.audience] == null ? null : Number(f[O.audience]), fulfilledAt: f[O.fulfilledAt] || null, makeGoodOf: String(f[O.makeGoodOf] || '') || null };
}
async function listObligations(run, url) {
  const C = run.cfg.collections, O = JOIN.ob;
  const sc = await scope(run, url.searchParams.get('publisher'));
  const q = k => (url.searchParams.get(k) || '').trim();
  const [obs, custs, nls, ads] = await Promise.all([run.listAll(C.obligations), run.listAll(C.customers), run.listAll(C.newsletters), run.listAll(C.ads)]);
  const custBy = index(custs), nlBy = index(nls);
  const flags = await noCreativeFlags(run, sc, obs, ads);
  const out = [];
  for (const o of obs) {
    const f = fd(o); if (o.isArchived || refId(f[O.publisher]) !== sc.publisherId) continue;
    const s = await obShape(run, o, custBy, sc.taById, nlBy);
    if (q('title') && s.titleId !== q('title')) continue;
    if (q('month') && s.dueMonth !== q('month')) continue;
    if (q('customer') && s.customerId !== q('customer')) continue;
    if (q('status') && keyOf(s.status) !== keyOf(q('status'))) continue;
    s.noCreative = flags.has(o.id);
    s.nudge = nudgeOf(s);
    out.push(s);
  }
  out.sort((a, b) => a.dueMonth.localeCompare(b.dueMonth) || a.name.localeCompare(b.name));
  return { ok: true, publisher: sc.publisherId, obligations: out };
}
function nudgeOf(s) {
  if (s.status !== STATUS.open) return null;
  const now = ym(new Date().toISOString());
  if (s.dueBy) return s.dueBy < new Date().toISOString().slice(0, 10) ? 'overdue' : 'by ' + s.dueBy;
  if (s.dueMonth < now) return 'overdue';
  if (s.dueMonth === now) return 'due this month';
  return null;
}
async function createOneOff(run, b) {
  const C = run.cfg.collections, O = JOIN.ob;
  const sc = await scope(run, b.publisher);
  if (!/^[0-9a-f]{24}$/.test(b.customer || '')) throw httpErr(400, 'customer is required.');
  const comp = keyOf(b.type || '') === 'comp';
  if (!comp && !/^[0-9a-f]{24}$/.test(b.sales || '')) throw httpErr(400, 'A one-off needs a sales record, or type Comp.');
  if (!/^[0-9a-f]{24}$/.test(b.title || '') || !sc.taIds.has(b.title)) throw httpErr(400, 'title must be one of this publisher\'s titles.');
  if (!/^\d{4}-\d{2}$/.test(b.dueMonth || '')) throw httpErr(400, 'dueMonth must be YYYY-MM.');
  if (!/^[0-9a-f]{24}$/.test(b.product || '')) throw httpErr(400, 'product is required.');
  const prod = await run.getItem(C.franchises, b.product); if (!prod) throw httpErr(400, 'product is not a PRODUCT LIBRARY row.');
  const shape = await run.optLabel(C.franchises, JOIN.product.shape, fd(prod)[JOIN.product.shape]);
  const n = (await run.listAll(C.obligations)).filter(o => !refId(fd(o)[O.sales])).length + 1;
  const name = 'OB-1OFF-' + String(n).padStart(3, '0');
  const fields = { name, slug: name.toLowerCase(), [O.publisher]: sc.publisherId, [O.customer]: b.customer, [O.title]: b.title,
    [O.type]: await run.optId(C.obligations, O.type, comp ? 'Comp' : 'Paid'), [O.status]: await run.optId(C.obligations, O.status, STATUS.open),
    [O.week]: await run.optId(C.obligations, O.week, b.week || 'Any week'), [O.productId]: b.product, [O.dueMonth]: b.dueMonth,
    [O.enteredBy]: String(b.enteredBy || '').slice(0, 120) };
  if (b.sales) fields[O.sales] = b.sales;
  if (shape) fields[O.shape] = await run.optId(C.obligations, O.shape, shape);
  const w = await run.create(C.obligations, fields);
  return { ok: true, id: w.id, name, unconfirmed: w.unconfirmed };
}
async function makeGood(run, id, b) {
  const C = run.cfg.collections, O = JOIN.ob;
  const o = await run.getItem(C.obligations, id); if (!o) throw httpErr(404, 'Obligation not found.');
  const f = fd(o);
  if (f[O.status] !== await run.optId(C.obligations, O.status, STATUS.missed)) throw httpErr(409, 'Only a Missed obligation can be made good.');
  if (!/^\d{4}-\d{2}$/.test(b.dueMonth || '')) throw httpErr(400, 'dueMonth must be YYYY-MM.');
  const name = String(f.name || id) + '-MG';
  const fields = { name, slug: name.toLowerCase(), [O.publisher]: refId(f[O.publisher]), [O.customer]: refId(f[O.customer]), [O.title]: refId(f[O.title]) || null,
    [O.type]: f[O.type], [O.status]: await run.optId(C.obligations, O.status, STATUS.open), [O.shape]: f[O.shape] || null, [O.week]: f[O.week],
    [O.productId]: f[O.productId] || '', [O.dueMonth]: b.dueMonth, [O.makeGoodOf]: id, [O.enteredBy]: String(b.enteredBy || '').slice(0, 120) };
  if (refId(f[O.sales])) fields[O.sales] = refId(f[O.sales]);
  const w = await run.create(C.obligations, fields);
  return { ok: true, id: w.id, name, replaces: id, unconfirmed: w.unconfirmed };
}
// assign: { title, edition?, ad?, article? }   unassign: nothing
async function assign(run, id, b, on) {
  const C = run.cfg.collections, O = JOIN.ob, S = JOIN.sales;
  const o = await run.getItem(C.obligations, id); if (!o) throw httpErr(404, 'Obligation not found.');
  const f = fd(o);
  const openId = await run.optId(C.obligations, O.status, STATUS.open), asgId = await run.optId(C.obligations, O.status, STATUS.assigned);
  if (on) {
    if (f[O.status] !== openId && f[O.status] !== asgId) throw httpErr(409, 'Only an Open obligation can be assigned.');
    const title = b.title || refId(f[O.title]);
    if (!/^[0-9a-f]{24}$/.test(title || '')) throw httpErr(400, 'A pool send needs a title when it is assigned.');
    const fields = { [O.status]: asgId, [O.title]: title };
    if (b.edition) fields[O.edition] = b.edition; if (b.ad) fields[O.ad] = b.ad; if (b.article) fields[O.article] = b.article;
    const w = await run.patch(C.obligations, id, fields);
    return { ok: true, id, status: STATUS.assigned, unconfirmed: w.unconfirmed };
  }
  if (f[O.status] !== asgId) throw httpErr(409, 'Only an Assigned obligation can be unassigned.');
  // a pool send loses its title again; a directed one keeps it
  let pool = false;
  const s = await run.getItem(C.sales, refId(f[O.sales]));
  if (s) pool = (await run.optLabel(C.sales, S.placement, fd(s)[S.placement])) === PLACEMENT.pool;
  const fields = { [O.status]: openId, [O.edition]: null, [O.ad]: null, [O.article]: null };
  if (pool) fields[O.title] = null;
  const w = await run.patch(C.obligations, id, fields);
  return { ok: true, id, status: STATUS.open, pool, unconfirmed: w.unconfirmed };
}

// ── fulfil (Scenario 108, on publish) ────────────────────────
// { edition: <NEWSLETTER id> }  → every Assigned obligation on that edition.
async function fulfil(run, b) {
  const C = run.cfg.collections, O = JOIN.ob;
  if (!/^[0-9a-f]{24}$/.test(b.edition || '')) throw httpErr(400, 'edition (NEWSLETTER id) is required.');
  const nl = await run.getItem(C.newsletters, b.edition); if (!nl) throw httpErr(404, 'NEWSLETTER not found.');
  const audience = Number(fd(nl)[JOIN.nl.volume]);
  if (!(audience > 0)) run.warn('NEWSLETTER "' + fd(nl).name + '" has no send-volume; audience is left empty.');
  const asgId = await run.optId(C.obligations, O.status, STATUS.assigned), fulId = await run.optId(C.obligations, O.status, STATUS.fulfilled);
  const obs = (await run.listAll(C.obligations)).filter(o => refId(fd(o)[O.edition]) === b.edition && fd(o)[O.status] === asgId);
  const now = new Date().toISOString(), done = [];
  for (const o of obs) {
    const fields = { [O.status]: fulId, [O.fulfilledAt]: now }; if (audience > 0) fields[O.audience] = audience;
    const w = await run.patch(C.obligations, o.id, fields); done.push({ id: o.id, name: fd(o).name, unconfirmed: w.unconfirmed });
  }
  return { ok: true, edition: b.edition, audience: audience > 0 ? audience : null, fulfilled: done };
}

// ── the sweep ────────────────────────────────────────────────
// Missed: Open, and the due month's last edition has gone (HC-S-6), or
// due-by has passed. No creative is computed by noCreativeFlags and
// answered here for the log; the lists compute it live.
async function sweep(run) {
  const C = run.cfg.collections, O = JOIN.ob;
  const [obs, plans, tas, ads] = await Promise.all([run.listAll(C.obligations), run.listAll(C.plans), run.listAll(C.titles), run.listAll(C.ads)]);
  const today = new Date().toISOString().slice(0, 10), thisMonth = today.slice(0, 7);
  const openId = await run.optId(C.obligations, O.status, STATUS.open), missedId = await run.optId(C.obligations, O.status, STATUS.missed);
  const lastEdition = (taIds, month) => {                            // latest plan date in the month across these titles
    const ds = plans.filter(p => !p.isArchived && taIds.includes(refId(fd(p)[JOIN.plan.ta])) && ym(fd(p)[JOIN.plan.date]) === month)
      .map(p => String(fd(p)[JOIN.plan.date]).slice(0, 10)).sort();
    return ds.length ? ds[ds.length - 1] : null;
  };
  const taByPub = new Map(); tas.forEach(t => { const pub = refId(fd(t)[JOIN.ta.publisher]); if (!pub) return; if (!taByPub.has(pub)) taByPub.set(pub, []); taByPub.get(pub).push(t.id); });
  const missed = [];
  for (const o of obs) {
    const f = fd(o); if (o.isArchived || f[O.status] !== openId) continue;
    let gone = false;
    if (f[O.dueBy]) gone = String(f[O.dueBy]).slice(0, 10) < today;
    else {
      const month = String(f[O.dueMonth] || ''); if (!month) continue;
      if (month > thisMonth) continue;
      const taIds = refId(f[O.title]) ? [refId(f[O.title])] : (taByPub.get(refId(f[O.publisher])) || []);
      const last = lastEdition(taIds, month);
      gone = last ? last < today : (month < thisMonth);                 // HC-S-6 fallback: calendar month end
    }
    if (!gone) continue;
    const w = await run.patch(C.obligations, o.id, { [O.status]: missedId });
    missed.push({ id: o.id, name: f.name, unconfirmed: w.unconfirmed });
  }
  const flags = [], justMissed = new Set(missed.map(m => m.id));
  const stillOpen = obs.filter(o => !justMissed.has(o.id));
  for (const pub of taByPub.keys()) {
    const sc = { publisherId: pub, taIds: new Set(taByPub.get(pub)) };
    (await noCreativeFlags(run, sc, stillOpen, ads, plans)).forEach(id => flags.push(id));
  }
  return { ok: true, at: new Date().toISOString(), missed, noCreative: flags.length };
}
// Open obligations whose first eligible edition is within the title's
// no-creative-lead editions and whose customer has no live ADS row of the
// shape naming the title (pool: any of the publisher's titles).
async function noCreativeFlags(run, sc, obs, ads, plansIn) {
  const C = run.cfg.collections, O = JOIN.ob;
  const plans = plansIn || await run.listAll(C.plans);
  const tas = await run.listAll(C.titles);
  const today = new Date().toISOString().slice(0, 10);
  const adType = new Map(); for (const a of ads) { if (a.isDraft || a.isArchived) continue; adType.set(a.id, await run.optLabel(C.ads, JOIN.ad.type, fd(a)[JOIN.ad.type])); }
  const openId = await run.optId(C.obligations, O.status, STATUS.open);
  const flagged = new Set();
  for (const o of obs) {
    const f = fd(o); if (o.isArchived || f[O.status] !== openId || refId(f[O.publisher]) !== sc.publisherId) continue;
    const shape = await run.optLabel(C.obligations, O.shape, f[O.shape]);
    const want = SHAPE_AD_TYPE[shape]; if (!want) continue;           // articles are not ads
    const taIds = refId(f[O.title]) ? [refId(f[O.title])] : [...sc.taIds];
    const leadOf = id => { const t = tas.find(x => x.id === id); const n = Number(fd(t)[JOIN.ta.lead]); return Number.isInteger(n) && n > 0 ? n : (Number(run.cfg.noCreativeLeadDefault) || 2); };
    const month = String(f[O.dueMonth] || '');
    const soon = taIds.some(id => {
      const ahead = plans.filter(p => !p.isArchived && refId(fd(p)[JOIN.plan.ta]) === id && String(fd(p)[JOIN.plan.date]).slice(0, 10) >= today)
        .map(p => String(fd(p)[JOIN.plan.date]).slice(0, 10)).sort();
      const idx = ahead.findIndex(d => ym(d) >= month);
      return idx >= 0 && idx < leadOf(id);
    });
    if (!soon) continue;
    const has = ads.some(a => !a.isDraft && !a.isArchived && refId(fd(a)[JOIN.ad.customer]) === refId(f[O.customer]) &&
      adType.get(a.id) === want && refIds(fd(a)[JOIN.ad.titles]).some(t => taIds.includes(t)));
    if (!has) flagged.add(o.id);
  }
  return flagged;
}

// ── default ad, pool, products, titles ───────────────────────
async function setDefaultAd(run, id) {
  const C = run.cfg.collections, A = JOIN.ad;
  const ad = await run.getItem(C.ads, id); if (!ad) throw httpErr(404, 'Ad not found.');
  const f = fd(ad), cust = refId(f[A.customer]), type = f[A.type];
  const others = (await run.listAll(C.ads)).filter(a => a.id !== id && !a.isArchived && refId(fd(a)[A.customer]) === cust && fd(a)[A.type] === type && fd(a)[A.isDefault] === true);
  for (const a of others) await run.patch(C.ads, a.id, { [A.isDefault]: false });
  const w = await run.patch(C.ads, id, { [A.isDefault]: true });
  return { ok: true, id, cleared: others.map(a => a.id), unconfirmed: w.unconfirmed };
}
async function pool(run, url) {
  const C = run.cfg.collections, O = JOIN.ob, S = JOIN.sales;
  const id = (url.searchParams.get('sales') || '').trim(); if (!/^[0-9a-f]{24}$/.test(id)) throw httpErr(400, 'Missing sales (SALES RECORD id).');
  const s = await run.getItem(C.sales, id); if (!s) throw httpErr(404, 'Sales record not found.');
  const sc = await scope(run, refId(fd(s)[S.publisher]));
  const obs = (await run.listAll(C.obligations)).filter(o => refId(fd(o)[O.sales]) === id && !o.isArchived);
  const cancelledId = await run.optId(C.obligations, O.status, STATUS.cancelled), openId = await run.optId(C.obligations, O.status, STATUS.open);
  const live = obs.filter(o => fd(o)[O.status] !== cancelledId);
  const left = live.filter(o => fd(o)[O.status] === openId).length;
  const months = live.map(o => String(fd(o)[O.dueMonth] || '')).filter(Boolean).sort();
  const endMonth = fd(s)[S.windowEnd] ? ym(fd(s)[S.windowEnd]) : months[months.length - 1];
  const monthsLeft = endMonth ? Math.max(1, monthsBetween(ym(new Date().toISOString()), endMonth) + 1) : 1;
  const spread = {}; refIds(fd(s)[S.titles]).forEach(t => { spread[t] = 0; });
  live.forEach(o => { const t = refId(fd(o)[O.title]); if (t && fd(o)[O.status] !== openId) spread[t] = (spread[t] || 0) + 1; });
  const cap = Math.ceil(live.length / Math.max(1, refIds(fd(s)[S.titles]).length) * 1.5);
  return { ok: true, sales: id, sends: live.length, left, monthsLeft, perMonthNeeded: Math.round(left / monthsLeft * 10) / 10, endMonth,
    softCapPerTitle: cap, spread: Object.keys(spread).map(t => ({ titleId: t, title: sc.taById.get(t) ? String(fd(sc.taById.get(t)).name || '') : null, placed: spread[t], overCap: spread[t] > cap })) };
}
async function products(run, url) {
  const C = run.cfg.collections;
  const sc = await scope(run, url.searchParams.get('publisher'));
  const rows = (await run.listAll(C.franchises)).filter(p => !p.isArchived && !p.isDraft && refIds(fd(p)[JOIN.product.soldBy]).some(id => sc.taIds.has(id)));
  const out = []; for (const p of rows) out.push({ id: p.id, name: String(fd(p).name || ''), shape: await run.optLabel(C.franchises, JOIN.product.shape, fd(p)[JOIN.product.shape]) || null });
  out.sort((a, b) => a.name.localeCompare(b.name));
  if (!out.length) run.warn('No PRODUCT LIBRARY row names any of this publisher\'s titles in sold-by.');
  return { ok: true, publisher: sc.publisherId, products: out };
}
async function titles(run, url) {
  const sc = await scope(run, url.searchParams.get('publisher'));
  const byCounty = new Map();
  sc.tas.forEach(t => { const site = sc.siteByTa.get(t.id); const county = String(site ? fd(site)[JOIN.titleSite.county] || '' : '').trim() || 'No county';
    if (!byCounty.has(county)) byCounty.set(county, []); byCounty.get(county).push({ id: t.id, name: String(fd(t).name || '') }); });
  const counties = [...byCounty.entries()].map(([county, list]) => ({ county, titles: list.sort((a, b) => a.name.localeCompare(b.name)) })).sort((a, b) => a.county.localeCompare(b.county));
  return { ok: true, publisher: sc.publisherId, titleCount: sc.tas.length, counties };
}

// ── helpers ──────────────────────────────────────────────────
function fd(item) { return (item && item.fieldData) || {}; }
function refId(v) { if (!v) return null; if (typeof v === 'string') return v.trim() || null; if (typeof v === 'object' && v.id) return String(v.id); return null; }
function refIds(v) { if (!v) return []; if (Array.isArray(v)) return v.map(refId).filter(Boolean); const o = refId(v); return o ? [o] : []; }
function index(rows) { const m = new Map(); (rows || []).forEach(r => m.set(r.id, r)); return m; }
function keyOf(s) { return String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function ym(v) { const s = String(v || ''); return /^\d{4}-\d{2}/.test(s) ? s.slice(0, 7) : ''; }
function monthsBetween(a, b) { const [ay, am] = a.split('-').map(Number), [by, bm] = b.split('-').map(Number); return (by - ay) * 12 + (bm - am); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function httpErr(status, message) { const e = new Error(message); e.status = status; return e; }
function json(obj, status) { return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } }); }
