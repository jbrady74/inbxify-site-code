// ix-content-v1.0.0.js
// INBXIFY · Cloudflare Worker · ix-content
// The home of working data (D1) and the keeper of a full, current copy of every Webflow collection
// that stays in Webflow. Content Home phase 1 (Content-Home-Scoping-v0_2, rulings 1 to 9).
//
// v1.0.0 (9 Nov 2026, Content Home S2 · D1 base and copy) — FIRST BUILD.
//   Rulings this session (Jeff, 9 Nov): a new Worker, ix-content, owns D1 writes, webhooks, backfill, the nightly
//   check and status; ix-issue-data binds the same D1 for reads in phase 3. ix-content has its OWN Webflow site token,
//   because Webflow's rate limit is per token: its backfill, nightly check and webhook re-reads never spend the
//   120-a-minute budget the IPP pages use. Admin routes are locked by the staff login check (no stored secret).
//   The status route is open. The copy list is every collection in scoping section 4b; legacy (4c) is not copied.
//   The D1-to-R2 export waits for phase 2 (in phase 1 D1 holds only a copy, which a backfill can rebuild).
//
//   WHAT IT DOES
//   1 · COPY. Each collection on the KV copy list is listed from Webflow (100 items a request, every page) and
//       written to copy_items: one row per item, with its full fieldData, draft and archived flags, dates, and
//       tenancy columns (publisher_id, title_admin_id, plan_id).
//   2 · TENANCY, FOUND NOT TYPED. The Worker reads each collection's schema and takes the Reference field that
//       points at TITLES-ADMIN, PUBLISHERS or PUBLICATION PLANS (their ids are in contentHome.settings.tenancy).
//       A MultiReference to TITLES-ADMIN fills copy_title_links (one row per title). No direct title: taken from
//       the item's plan. No direct publisher: taken from its title (or its titles, when they share one publisher).
//       Two fields pointing at the same target is not guessed: the status names them, and a "tenancy" entry on
//       that collection in contentHome.copy picks one (the manual override).
//   3 · WEBHOOKS ARE HINTS. POST /webhook takes Webflow's item created, changed, deleted, unpublished and
//       published calls. It never stores the payload: it re-reads that one item from Webflow by id and stores what
//       Webflow holds (a 404 removes the row). A forged call can only cause a re-read. Repeat hints for one item
//       inside contentHome.settings.webhooks.dedupeMs are folded into one trailing re-read, so the last change is
//       never missed. A re-read Webflow refuses (429 / 5xx) is queued in pending_items, drained by later hints and
//       by the nightly check. Every call is logged (webhook_log), with whether it carried x-webflow-signature.
//   4 · NIGHTLY CHECK (Cron Trigger, and POST /admin/nightly). Registers any missing webhooks (when
//       settings.webhooks.autoRegister), lists every copied collection once, repairs drift (added, changed,
//       removed), recomputes derived tenancy, counts every collection's items against the caps, prunes the log.
//       It reports what it fixed. On an empty database the first nightly run IS the backfill.
//   5 · BACKFILL (POST /admin/backfill). The same list pass without the webhook step. Resumable: a run stops at its
//       time or call limit, saves where it was, and the next call carries on (?fresh=1 starts over).
//   6 · PACER. Every Webflow call goes through class Pacer: spaced to settings.pace.perMinute, honours Retry-After
//       on a 429 (capped), retries 5xx, slows when X-RateLimit-Remaining runs low. Webhook re-reads never sleep.
//   7 · STATUS (GET /status, open). Copy age per collection, D1 rows against Webflow's total, rows with no title
//       or publisher, last nightly and backfill results, webhook registrations and the latest webhook calls,
//       Webflow items in use against the item cap, collections against the collection cap. Reads D1 only; it never
//       calls Webflow, so opening it costs nothing.
//
//   ONE SHARED PERMISSION CHECK (seed section 7). permit(env, request, action, row) asks ix-members (service
//   binding MEMBERS, GET /whoami) who is calling and answers through RULES. Today every action is staff-only.
//   Phase 2 adds publisher rules there (a member's publishers from PUBLISHERS portal-member-ids, against the row's
//   publisher_id), never by adding publishers to the staff list.
//
//   ROUTES
//   GET  /health                 open. Version, bindings, schema present, KV keys present.
//   GET  /status                 open. See 7.
//   POST /webhook                open. Webflow hints. See 3.
//   POST /admin/backfill         staff. ?fresh=1 starts a new run instead of resuming.
//   POST /admin/nightly          staff. Runs the nightly check now. ?fresh=1 as above.
//   POST /admin/register         staff. Lists the site's webhooks and creates the missing ones.
//   Staff calls: from a page on an allowed origin, signed in to Memberstack as staff:
//     const t = await window.$memberstackDom.getMemberCookie();
//     fetch('https://ix-content.jeff-2cd.workers.dev/admin/backfill', { method:'POST', headers:{ Authorization:'Bearer '+t } })
//
//   BINDINGS (Cloudflare dashboard, never in the repo)
//   IX_DB          D1 database "ix-content" (HC-P-CH1-1). Schema: ix-content-schema-v1.0.0.sql.
//   IX_KV          KV namespace "ix-config" (shared with ix-issue-data; this Worker reads only contentHome.* keys).
//   MEMBERS        Service binding to ix-members.
//   WEBFLOW_TOKEN  Secret. ix-content's own site token: CMS read, Sites read and write.
//   Cron Trigger   The nightly check's time (HC-P-CH1-4), set in Settings > Triggers.
//
//   KV KEYS (namespace ix-config)
//   contentHome.copy      [ { id?, name?, tenancy?: { titleAdmin?, publisher?, plan? } } ]  (HC-P-CH1-2)
//                         An entry names a collection by id, or by name (Webflow display name or slug, any case).
//                         tenancy picks a field slug when the schema is ambiguous; "" means "this collection has none".
//   contentHome.events    [ "collection_item_created", ... ]  webhook trigger types (HC-P-CH1-3)
//   contentHome.reads     { route: "webflow" | "d1" }  read switch, used from phase 3 (HC-P-CH1-5)
//   contentHome.settings  siteId, selfUrl, allowedOrigins, tenancy ids, caps (HC-P-CH1-6), pace and run
//                         limits (HC-P-CH1-4), webhook options. Defaults below fill anything left out.
//
//   HARDCODING (provisional ids, for the tracker): HC-P-CH1-7 binding names IX_DB, IX_KV, MEMBERS, WEBFLOW_TOKEN
//   and the KV key names (KV_KEYS); HC-P-CH1-8 Webflow API base and page size 100 (Webflow's own maximum);
//   HC-P-CH1-9 the staff-only RULES (phase 2 widens them); HC-P-CH1-10 DEFAULTS (used only where
//   contentHome.settings leaves a value out); HC-P-CH1-11 tenancy target ids live in contentHome.settings.tenancy.

const VERSION = '1.0.0';
const WF = 'https://api.webflow.com/v2';                         // HC-P-CH1-8
const PAGE = 100;                                                // HC-P-CH1-8 · Webflow lists at most 100 a request
const KV_KEYS = {                                                // HC-P-CH1-7
  copy: 'contentHome.copy',
  events: 'contentHome.events',
  reads: 'contentHome.reads',
  settings: 'contentHome.settings',
};
const DEFAULTS = {                                               // HC-P-CH1-10 · only where settings leave a value out
  allowedOrigins: ['https://www.inbxify.com', 'https://inbxify.com'],
  caps: { items: 20000, collections: 40 },
  pace: { perMinute: 100, maxRetries: 4, retryAfterCapMs: 65000, lowWater: 5, lowWaterPauseMs: 3000 },
  runs: { maxCalls: 800, maxQueries: 800, adminBudgetMs: 90000, cronBudgetMs: 600000, resumeWithinHours: 24, busyIfBeatWithinMs: 120000 },
  webhooks: { autoRegister: true, dedupeMs: 5000, logDays: 30, drainPerHint: 3, maxHintsPerCall: 50 },
};
const SCHEMA_TABLES = ['copy_items', 'copy_title_links', 'nl_blocks', 'allocations', 'allocation_plans', 'change_log',
  'collections', 'sync_runs', 'pending_items', 'webhook_log', 'site_facts'];
const ID24 = /^[0-9a-f]{24}$/i;

// ─────────────────────────────────────────────────────────────────────────────────────────
// ENTRY
// ─────────────────────────────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    let allowed = DEFAULTS.allowedOrigins;
    try { const s = env.IX_KV ? await env.IX_KV.get(KV_KEYS.settings, 'json') : null; if (s && Array.isArray(s.allowedOrigins)) allowed = s.allowedOrigins; } catch (_) {}
    const cors = corsHeaders(origin, allowed);
    try {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      const url = new URL(request.url);
      const p = url.pathname.replace(/\/+$/, '') || '/';
      const m = request.method;
      if (p === '/health' && m === 'GET') return json(await health(env), 200, cors);
      if (p === '/status' && m === 'GET') return json(await status(env), 200, cors);
      if (p === '/webhook' && m === 'POST') return webhookRoute(request, env, ctx);
      if (p.startsWith('/admin/')) {
        if (m !== 'POST') return json({ ok: false, error: 'Admin routes take POST.' }, 405, cors);
        if (origin && !allowed.includes(origin)) return json({ ok: false, error: 'This origin may not call ix-content.' }, 403, cors);
        const gate = await permit(env, request, 'content.admin', null);
        if (!gate.ok) return json({ ok: false, error: gate.why }, gate.status, cors);
        const by = gate.who.email || gate.who.memberId;
        const fresh = url.searchParams.get('fresh') === '1';
        if (p === '/admin/backfill') return json(await runCheck(env, { kind: 'backfill', by, fresh, budget: 'admin' }), 200, cors);
        if (p === '/admin/nightly') return json(await runCheck(env, { kind: 'nightly', by, fresh, budget: 'admin' }), 200, cors);
        if (p === '/admin/register') {
          const cfg = await loadConfig(env);
          const pacer = new Pacer(env, cfg.s, { maxCalls: 20 });
          return json({ ok: true, by, webhooks: await ensureWebhooks(needDb(env), pacer, cfg), meta: pacer.meta() }, 200, cors);
        }
      }
      return json({ ok: false, error: 'Unknown route. See the v1.0.0 header.' }, 404, cors);
    } catch (e) {
      return json({ ok: false, error: (e && e.message) || String(e), detail: (e && e.detail) || undefined }, (e && e.status) || 500, cors);
    }
  },

  async scheduled(event, env, ctx) {
    try { await runCheck(env, { kind: 'nightly', by: 'cron ' + (event.cron || ''), fresh: false, budget: 'cron' }); }
    catch (e) { console.log('ix-content nightly failed: ' + ((e && e.message) || e)); }
  },
};

// ─────────────────────────────────────────────────────────────────────────────────────────
// ONE SHARED PERMISSION CHECK (seed section 7) — "may this member do this action on this row?"
// ─────────────────────────────────────────────────────────────────────────────────────────
const RULES = {                                                  // HC-P-CH1-9 · phase 2 adds publisher rules here
  'content.admin': (who /*, row */) => who.staff,
};

async function permit(env, request, action, row) {
  const rule = RULES[action];
  if (!rule) return { ok: false, status: 500, why: 'No permission rule for action "' + action + '".' };
  const auth = request.headers.get('Authorization') || '';
  if (!/^Bearer\s+\S+/i.test(auth)) return { ok: false, status: 401, why: 'Not signed in: no Memberstack token was sent.' };
  if (!env.MEMBERS || typeof env.MEMBERS.fetch !== 'function') return { ok: false, status: 500, why: 'The MEMBERS service binding (to ix-members) is not set on this Worker.' };
  let res, j = null;
  try { res = await env.MEMBERS.fetch(new Request('https://ix-members/whoami', { headers: { Authorization: auth } })); j = await res.json().catch(() => null); }
  catch (e) { return { ok: false, status: 502, why: 'ix-members did not answer: ' + ((e && e.message) || e) }; }
  if (!res.ok || !j || !j.ok) return { ok: false, status: res && res.status === 401 ? 401 : 403, why: (j && j.error) || 'The login check failed.' };
  const who = { memberId: j.memberId, email: j.email || null, staff: !!j.staff, publishers: (j.publishers || []).map(p => p.id) };
  if (!rule(who, row)) return { ok: false, status: 403, who, why: 'This login may not do that (' + action + ').' };
  return { ok: true, who };
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// CONFIG (KV only; nothing here is typed per publisher or title)
// ─────────────────────────────────────────────────────────────────────────────────────────
async function loadConfig(env) {
  if (!env.IX_KV) throw httpErr(500, 'The IX_KV binding (KV namespace ix-config) is not set on this Worker.');
  const [copy, events, reads, settings] = await Promise.all([
    env.IX_KV.get(KV_KEYS.copy, 'json'), env.IX_KV.get(KV_KEYS.events, 'json'),
    env.IX_KV.get(KV_KEYS.reads, 'json'), env.IX_KV.get(KV_KEYS.settings, 'json'),
  ]);
  if (!settings) throw httpErr(500, 'KV key ' + KV_KEYS.settings + ' is missing in ix-config.');
  if (!Array.isArray(copy)) throw httpErr(500, 'KV key ' + KV_KEYS.copy + ' is missing or not a list.');
  if (!Array.isArray(events)) throw httpErr(500, 'KV key ' + KV_KEYS.events + ' is missing or not a list.');
  const s = {
    ...DEFAULTS, ...settings,
    caps: { ...DEFAULTS.caps, ...(settings.caps || {}) },
    pace: { ...DEFAULTS.pace, ...(settings.pace || {}) },
    runs: { ...DEFAULTS.runs, ...(settings.runs || {}) },
    webhooks: { ...DEFAULTS.webhooks, ...(settings.webhooks || {}) },
  };
  if (!ID24.test(s.siteId || '')) throw httpErr(500, KV_KEYS.settings + '.siteId is missing.');
  const t = s.tenancy || {};
  for (const k of ['titlesAdmin', 'publishers', 'plans']) if (!ID24.test(t[k] || '')) throw httpErr(500, KV_KEYS.settings + '.tenancy.' + k + ' is missing.');
  return { copy, events, reads: reads || {}, s };
}

function needDb(env) {
  if (!env.IX_DB || typeof env.IX_DB.prepare !== 'function') throw httpErr(500, 'The IX_DB binding (D1 database ix-content) is not set on this Worker.');
  return env.IX_DB;
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// PACER — every Webflow call goes through here
// ─────────────────────────────────────────────────────────────────────────────────────────
class Pacer {
  constructor(env, s, opts) {
    if (!env.WEBFLOW_TOKEN) throw httpErr(500, 'The WEBFLOW_TOKEN secret is not set on this Worker.');
    this.token = env.WEBFLOW_TOKEN;
    this.p = s.pace;
    this.gap = Math.ceil(60000 / Math.max(1, Number(this.p.perMinute) || 100));
    this.maxCalls = (opts && opts.maxCalls) || s.runs.maxCalls;
    this.noWait = !!(opts && opts.noWait);
    this.last = 0; this.calls = 0; this.waitedMs = 0; this.r429 = 0; this.retries = 0;
  }
  meta() { return { webflowCalls: this.calls, waitedMs: this.waitedMs, got429: this.r429, retries: this.retries }; }
  budgetLeft() { return this.maxCalls - this.calls; }
  async call(path, opts) {
    const method = (opts && opts.method) || 'GET';
    const body = opts && opts.body;
    for (let attempt = 0; ; attempt++) {
      if (this.calls >= this.maxCalls) { const e = httpErr(503, 'This run has used its Webflow call budget.'); e.budget = true; throw e; }
      const wait = this.last + this.gap - Date.now();
      if (wait > 0 && !this.noWait) await sleep(wait);
      this.last = Date.now(); this.calls++;
      let res;
      try {
        res = await fetch(WF + path, {
          method,
          headers: { Authorization: 'Bearer ' + this.token, accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch (e) {
        if (!this.noWait && attempt < this.p.maxRetries) { this.retries++; await this.nap(2000 * (attempt + 1)); continue; }
        const x = httpErr(502, 'Webflow did not answer (' + method + ' ' + path + '): ' + ((e && e.message) || e)); x.busy = true; throw x;
      }
      if (res.status === 429 || res.status >= 500) {
        if (res.status === 429) this.r429++;
        if (this.noWait || attempt >= this.p.maxRetries) {
          const x = httpErr(res.status === 429 ? 503 : 502, 'Webflow answered ' + res.status + ' on ' + method + ' ' + path +
            (res.status === 429 ? ' (rate limit)' : '') + '.'); x.busy = true; throw x;
        }
        const ra = Number(res.headers.get('Retry-After'));
        this.retries++;
        await this.nap(Math.min(this.p.retryAfterCapMs, Number.isFinite(ra) && ra > 0 ? ra * 1000 : 2000 * (attempt + 1)));
        continue;
      }
      const remaining = Number(res.headers.get('X-RateLimit-Remaining'));
      if (!this.noWait && Number.isFinite(remaining) && remaining <= this.p.lowWater) await this.nap(this.p.lowWaterPauseMs);
      if (res.status === 404) return { status: 404, data: null };
      const text = await res.text();
      let data = null; try { data = text ? JSON.parse(text) : null; } catch (_) {}
      if (!res.ok) {
        const x = httpErr(502, 'Webflow refused ' + method + ' ' + path + ' (' + res.status + '): ' +
          ((data && (data.message || data.msg || data.code)) || text.slice(0, 200)));
        x.wfStatus = res.status; x.detail = data; throw x;
      }
      return { status: res.status, data };
    }
  }
  async nap(ms) { this.waitedMs += ms; await sleep(ms); }
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// COLLECTIONS AND TENANCY
// ─────────────────────────────────────────────────────────────────────────────────────────
async function siteCollections(pacer, siteId) {
  const r = await pacer.call('/sites/' + siteId + '/collections');
  return ((r.data && r.data.collections) || []).map(c => ({ id: c.id, name: c.displayName || c.singularName || c.slug, slug: c.slug || '', singular: c.singularName || '' }));
}

// The KV copy list against the site's collections. Never guesses: an entry that matches none or several is a problem.
function resolveCopy(copyList, siteCols) {
  const resolved = [], problems = [], taken = new Set();
  for (const entry of copyList) {
    if (!entry || typeof entry !== 'object') { problems.push({ entry, why: 'Not an object.' }); continue; }
    let hits;
    if (entry.id) hits = siteCols.filter(c => c.id === entry.id);
    else {
      const n = String(entry.name || '').trim().toLowerCase();
      hits = n ? siteCols.filter(c => [c.name, c.slug, c.singular].some(v => String(v || '').toLowerCase() === n)) : [];
    }
    if (hits.length !== 1) {
      problems.push({ entry, why: hits.length ? 'Matches more than one collection; give its id.' : (entry.id ? 'No collection with this id on the site.' : 'No collection with this name or slug on the site.'),
        candidates: hits.map(c => ({ id: c.id, name: c.name, slug: c.slug })) });
      continue;
    }
    if (taken.has(hits[0].id)) { problems.push({ entry, why: 'Listed twice.' }); continue; }
    taken.add(hits[0].id);
    resolved.push({ id: hits[0].id, name: hits[0].name, slug: hits[0].slug, override: entry.tenancy || null });
  }
  return { resolved, problems };
}

const TEN_KEYS = { titleAdmin: 'titlesAdmin', publisher: 'publishers', plan: 'plans' };

// From a collection's schema: which field gives each tenancy column. override (KV) wins; "" means none.
function tenancyOf(colId, schema, T, override) {
  const out = { self: null, titleAdmin: null, publisher: null, plan: null, notes: [] };
  for (const [k, tk] of Object.entries(TEN_KEYS)) if (colId === T[tk]) out.self = k;
  const fields = (schema && schema.fields) || [];
  for (const [k, tk] of Object.entries(TEN_KEYS)) {
    if (out.self === k) continue;
    if (override && Object.prototype.hasOwnProperty.call(override, k)) {
      const slug = override[k];
      if (!slug) { out.notes.push(k + ': none (set in KV)'); continue; }
      const f = fields.find(x => x.slug === slug);
      if (!f) { out.notes.push(k + ': KV names field "' + slug + '", which this collection does not have'); continue; }
      out[k] = { slug, multi: f.type === 'MultiReference' };
      out.notes.push(k + ': ' + slug + ' (set in KV)');
      continue;
    }
    const refs = fields.filter(f => (f.type === 'Reference' || f.type === 'MultiReference') && f.validations && f.validations.collectionId === T[tk]);
    if (refs.length === 1) out[k] = { slug: refs[0].slug, multi: refs[0].type === 'MultiReference' };
    else if (refs.length > 1) out.notes.push(k + ': ' + refs.length + ' fields point at it (' + refs.map(f => f.slug).join(', ') + '); pick one with a tenancy entry in ' + KV_KEYS.copy);
  }
  return out;
}

function refValues(v) {
  if (Array.isArray(v)) return v.filter(x => typeof x === 'string' && ID24.test(x));
  return typeof v === 'string' && ID24.test(v) ? [v] : [];
}

function rowOf(item, ten) {
  const fd = item.fieldData || {};
  const pick = k => {
    if (ten.self === k) return [item.id];
    return ten[k] ? refValues(fd[ten[k].slug]) : [];
  };
  const titles = pick('titleAdmin'), pubs = pick('publisher'), plans = pick('plan');
  const title = titles.length === 1 ? titles[0] : null;
  const publisher = pubs.length === 1 ? pubs[0] : null;
  const plan = plans.length === 1 ? plans[0] : null;
  const titleDerived = !titles.length && !!plan ? 1 : 0;
  const publisherDerived = !pubs.length && (titles.length || titleDerived) ? 1 : 0;
  return { title, titles, publisher, plan, titleDerived, publisherDerived };
}

function upsertStmts(db, colId, item, ten, runId, now, isNew) {
  const r = rowOf(item, ten);
  const fd = item.fieldData || {};
  const out = [db.prepare(
    'INSERT INTO copy_items (collection_id,item_id,publisher_id,title_admin_id,plan_id,title_derived,publisher_derived,slug,name,' +
    'is_draft,is_archived,created_on,last_updated,last_published,field_data,copied_at,seen_run) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ' +
    'ON CONFLICT(collection_id,item_id) DO UPDATE SET publisher_id=excluded.publisher_id,title_admin_id=excluded.title_admin_id,' +
    'plan_id=excluded.plan_id,title_derived=excluded.title_derived,publisher_derived=excluded.publisher_derived,slug=excluded.slug,' +
    'name=excluded.name,is_draft=excluded.is_draft,is_archived=excluded.is_archived,created_on=excluded.created_on,' +
    'last_updated=excluded.last_updated,last_published=excluded.last_published,field_data=excluded.field_data,' +
    'copied_at=excluded.copied_at,seen_run=COALESCE(excluded.seen_run,copy_items.seen_run)'
  ).bind(colId, item.id, r.publisher, r.title, r.plan, r.titleDerived, r.publisherDerived,
    nn(fd.slug), nn(fd.name), item.isDraft ? 1 : 0, item.isArchived ? 1 : 0, nn(item.createdOn), nn(item.lastUpdated),
    nn(item.lastPublished), JSON.stringify(fd), now, runId || null)];
  if (!isNew) out.push(db.prepare('DELETE FROM copy_title_links WHERE collection_id=? AND item_id=?').bind(colId, item.id));
  if (r.titles.length) out.push(db.prepare('INSERT OR IGNORE INTO copy_title_links (collection_id,item_id,title_admin_id) SELECT ?,?,value FROM json_each(?)')
    .bind(colId, item.id, JSON.stringify(r.titles)));
  return out;
}

// Derived tenancy: title from the plan, then publisher from the title (or titles sharing one publisher).
async function derivePass(db, T, itemId) {
  const one = itemId ? ' AND item_id=?3' : '';
  const b = (sql) => itemId ? db.prepare(sql).bind(T.plans, T.titlesAdmin, itemId) : db.prepare(sql).bind(T.plans, T.titlesAdmin);
  await db.batch([
    b('UPDATE copy_items SET title_admin_id=(SELECT p.title_admin_id FROM copy_items p WHERE p.collection_id=?1 AND p.item_id=copy_items.plan_id) ' +
      'WHERE title_derived=1 AND ?2 IS NOT NULL' + one),
    b('UPDATE copy_items SET publisher_id=COALESCE(' +
      '(SELECT t.publisher_id FROM copy_items t WHERE t.collection_id=?2 AND t.item_id=copy_items.title_admin_id),' +
      '(SELECT CASE WHEN COUNT(DISTINCT t.publisher_id)=1 THEN MAX(t.publisher_id) END FROM copy_title_links l ' +
      'JOIN copy_items t ON t.collection_id=?2 AND t.item_id=l.title_admin_id ' +
      'WHERE l.collection_id=copy_items.collection_id AND l.item_id=copy_items.item_id)) ' +
      'WHERE publisher_derived=1 AND ?1 IS NOT NULL' + one),
  ]);
}

async function saveCollections(db, siteCols, resolved, now) {
  const copied = new Set(resolved.map(c => c.id));
  const stmts = siteCols.map(c => db.prepare(
    'INSERT INTO collections (collection_id,display_name,slug,copied,updated_at) VALUES (?,?,?,?,?) ' +
    'ON CONFLICT(collection_id) DO UPDATE SET display_name=excluded.display_name,slug=excluded.slug,copied=excluded.copied,updated_at=excluded.updated_at'
  ).bind(c.id, c.name, c.slug, copied.has(c.id) ? 1 : 0, now));
  const ids = siteCols.map(c => c.id);
  if (ids.length) stmts.push(db.prepare('DELETE FROM collections WHERE collection_id NOT IN (' + ids.map(() => '?').join(',') + ')').bind(...ids));
  for (const part of chunk(stmts, 50)) await db.batch(part);
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// BACKFILL AND NIGHTLY CHECK — one resumable run
// ─────────────────────────────────────────────────────────────────────────────────────────
async function runCheck(env, opts) {
  const db = needDb(env);
  const cfg = await loadConfig(env);
  const T = cfg.s.tenancy;
  const budgetMs = opts.budget === 'cron' ? cfg.s.runs.cronBudgetMs : cfg.s.runs.adminBudgetMs;
  const deadline = Date.now() + budgetMs;
  const pacer = new Pacer(env, cfg.s, { maxCalls: cfg.s.runs.maxCalls });
  const now = iso();
  const q = { n: 0, max: cfg.s.runs.maxQueries };       // D1 queries this invocation (Workers Paid allows 1,000)

  // Another run still beating? Refuse rather than run twice.
  const busy = await db.prepare("SELECT run_id,kind,beat_at FROM sync_runs WHERE status='running' ORDER BY started_at DESC LIMIT 1").first();
  if (busy && busy.beat_at && Date.now() - Date.parse(busy.beat_at) < cfg.s.runs.busyIfBeatWithinMs)
    throw httpErr(409, 'A ' + busy.kind + ' run (' + busy.run_id + ') is already working. Wait a minute and look at /status.');

  let run = null, state, report;
  if (opts.fresh) {
    await db.prepare("UPDATE sync_runs SET status='abandoned',finished_at=? WHERE kind=? AND status IN ('running','stopped','failed')").bind(now, opts.kind).run();
  } else {
    run = await db.prepare("SELECT * FROM sync_runs WHERE kind=? AND status IN ('running','stopped','failed') ORDER BY started_at DESC LIMIT 1").bind(opts.kind).first();
    if (run && Date.now() - Date.parse(run.started_at) > cfg.s.runs.resumeWithinHours * 3600e3) {
      await db.prepare("UPDATE sync_runs SET status='abandoned',finished_at=? WHERE run_id=?").bind(now, run.run_id).run();
      run = null;
    }
  }
  if (run) {
    state = JSON.parse(run.state_json); report = JSON.parse(run.report_json);
    report.resumed = (report.resumed || 0) + 1; report.resumedBy = opts.by;
  } else {
    const siteCols = await siteCollections(pacer, cfg.s.siteId);
    const { resolved, problems } = resolveCopy(cfg.copy, siteCols);
    await saveCollections(db, siteCols, resolved, now);
    state = { phase: opts.kind === 'nightly' ? 'webhooks' : 'copy', cols: resolved.map(c => c.id), names: Object.fromEntries(resolved.map(c => [c.id, c.name])),
      over: Object.fromEntries(resolved.map(c => [c.id, c.override])), ten: {}, i: 0, offset: 0, problems: problems.length };
    report = { kind: opts.kind, by: opts.by, problems, perCollection: {}, errors: [], webhooks: null, counts: null, pruned: null, resumed: 0 };
    run = { run_id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), started_at: now };
    await db.prepare("INSERT INTO sync_runs (run_id,kind,by_who,started_at,beat_at,status,state_json,report_json) VALUES (?,?,?,?,?,'running',?,?)")
      .bind(run.run_id, opts.kind, opts.by, now, now, JSON.stringify(state), JSON.stringify(report)).run();
  }
  const metaBase = report.meta || {};                     // totals from earlier invocations of this run
  const save = async (status) => {
    q.n++;
    report.meta = mergeMeta(metaBase, pacer.meta());
    await db.prepare('UPDATE sync_runs SET status=?,beat_at=?,finished_at=?,state_json=?,report_json=? WHERE run_id=?')
      .bind(status, iso(), status === 'done' ? iso() : null, JSON.stringify(state), JSON.stringify(report), run.run_id).run();
  };
  await save('running');
  const outOfTime = (more) => Date.now() > deadline - 3000 || pacer.budgetLeft() < 3 || q.n + (more || 0) > q.max - 25;

  try {
    if (state.phase === 'webhooks') {
      if (cfg.s.webhooks.autoRegister) {
        try { report.webhooks = await ensureWebhooks(db, pacer, cfg); }
        catch (e) { report.errors.push('Webhook registration: ' + e.message); }
      }
      state.phase = 'copy'; await save('running');
    }
    if (state.phase === 'copy') {
      while (state.i < state.cols.length) {
        if (outOfTime()) { await save('stopped'); return summary(run, report, state, false); }
        const done = await syncOne(db, pacer, cfg, state.cols[state.i], run, state, report, outOfTime, save, q);
        if (!done) { await save('stopped'); return summary(run, report, state, false); }
        state.i++; state.offset = 0; await save('running');
      }
      state.phase = 'derive';
    }
    if (state.phase === 'derive') {
      await derivePass(db, T, null);
      if (opts.kind === 'nightly') await drainPending(db, pacer, cfg, 50, report);
      state.phase = 'counts'; await save('running');
    }
    if (state.phase === 'counts') {
      if (outOfTime()) { await save('stopped'); return summary(run, report, state, false); }
      report.counts = await countSite(db, pacer, cfg, report);
      state.phase = 'prune'; await save('running');
    }
    if (state.phase === 'prune') {
      report.pruned = await prune(db, cfg, state);
      state.phase = 'done';
    }
    await save('done');
    return summary(run, report, state, true);
  } catch (e) {
    if (e && e.budget) { await save('stopped'); return summary(run, report, state, false); }
    report.errors.push((e && e.message) || String(e));
    await save('failed');
    const x = httpErr((e && e.status) || 500, 'The ' + opts.kind + ' run stopped with an error: ' + ((e && e.message) || e) + ' Run it again to carry on.');
    x.detail = summary(run, report, state, false);
    throw x;
  }
}

// One collection: list every page, write what differs, then remove rows Webflow no longer has. False = stopped partway.
async function syncOne(db, pacer, cfg, colId, run, state, report, outOfTime, save, q) {
  const T = cfg.s.tenancy;
  const name = state.names[colId] || colId;
  const pc = report.perCollection[colId] || (report.perCollection[colId] = { name, added: 0, changed: 0, unchanged: 0, removed: 0, webflowTotal: null, notes: [] });
  if (!state.ten[colId]) {
    const sc = await pacer.call('/collections/' + colId);
    state.ten[colId] = tenancyOf(colId, sc.data, T, state.over[colId]);
    pc.notes = state.ten[colId].notes.slice();
  }
  const ten = state.ten[colId];
  const prev = await db.prepare('SELECT tenancy_json FROM collections WHERE collection_id=?').bind(colId).first();
  const force = !prev || prev.tenancy_json !== JSON.stringify(ten);       // tenancy mapping changed: rewrite every row
  const have = new Map();
  const ex = await db.prepare('SELECT item_id,last_updated,is_draft,is_archived FROM copy_items WHERE collection_id=?').bind(colId).all();
  q.n += 2;
  for (const r of ex.results || []) have.set(r.item_id, r);

  let total = pc.webflowTotal;
  for (;;) {
    if (outOfTime()) return false;
    const r = await pacer.call('/collections/' + colId + '/items?limit=' + PAGE + '&offset=' + state.offset);
    const items = (r.data && r.data.items) || [];
    total = r.data && r.data.pagination ? r.data.pagination.total : null;
    pc.webflowTotal = total;
    const now = iso(), stmts = [], same = [];
    let nAdded = 0, nChanged = 0;
    for (const it of items) {
      const h = have.get(it.id);
      if (!force && h && h.last_updated === nn(it.lastUpdated) && h.is_draft === (it.isDraft ? 1 : 0) && h.is_archived === (it.isArchived ? 1 : 0)) same.push(it.id);
      else { stmts.push(...upsertStmts(db, colId, it, ten, run.run_id, now, !h)); if (h) nChanged++; else nAdded++; }
    }
    for (const ids of chunk(same, 90))
      stmts.push(db.prepare('UPDATE copy_items SET seen_run=? WHERE collection_id=? AND item_id IN (' + ids.map(() => '?').join(',') + ')').bind(run.run_id, colId, ...ids));
    if (outOfTime(stmts.length + 1)) return false;          // stop before writing; this page is read again on resume
    pc.unchanged += same.length; pc.added += nAdded; pc.changed += nChanged;
    for (const part of chunk(stmts, 200)) await db.batch(part);
    q.n += stmts.length;
    state.offset += items.length;
    await save('running');
    if (items.length < PAGE || (total != null && state.offset >= total)) break;
  }

  // Remove rows Webflow no longer holds, only when this run saw the whole list. Rows a webhook wrote after the
  // run started are kept (their copied_at is newer).
  q.n += 4;
  const seen = await db.prepare('SELECT COUNT(*) AS n FROM copy_items WHERE collection_id=? AND seen_run=?').bind(colId, run.run_id).first();
  if (total != null && seen && seen.n >= total) {
    const del = await db.prepare('DELETE FROM copy_items WHERE collection_id=? AND (seen_run IS NULL OR seen_run<>?) AND copied_at<?')
      .bind(colId, run.run_id, run.started_at).run();
    pc.removed += (del.meta && del.meta.changes) || 0;
    await db.prepare('DELETE FROM copy_title_links WHERE collection_id=? AND item_id NOT IN (SELECT item_id FROM copy_items WHERE collection_id=?)').bind(colId, colId).run();
  } else {
    pc.notes.push('The list changed during the check (' + (seen ? seen.n : 0) + ' of ' + total + ' seen), so nothing was removed this time.');
  }
  await db.prepare('UPDATE collections SET webflow_total=?,tenancy_json=?,last_full_check=? WHERE collection_id=?')
    .bind(total, JSON.stringify(ten), iso(), colId).run();
  return true;
}

// Every collection's item count against the caps. Copied collections reuse this run's totals; the rest ask for 1 item.
async function countSite(db, pacer, cfg, report) {
  const siteCols = await siteCollections(pacer, cfg.s.siteId);
  const per = [];
  let sum = 0;
  for (const c of siteCols) {
    let n = report.perCollection[c.id] ? report.perCollection[c.id].webflowTotal : null;
    if (n == null) { const r = await pacer.call('/collections/' + c.id + '/items?limit=1'); n = r.data && r.data.pagination ? r.data.pagination.total : 0; }
    per.push({ id: c.id, name: c.name, items: n });
    sum += n || 0;
  }
  per.sort((a, b) => (b.items || 0) - (a.items || 0));
  const at = iso();
  const items = { inUse: sum, cap: cfg.s.caps.items, left: cfg.s.caps.items - sum, perCollection: per };
  const collections = { inUse: siteCols.length, cap: cfg.s.caps.collections, left: cfg.s.caps.collections - siteCols.length };
  await db.batch([
    db.prepare('INSERT OR REPLACE INTO site_facts (k,v_json,at) VALUES (?,?,?)').bind('items', JSON.stringify(items), at),
    db.prepare('INSERT OR REPLACE INTO site_facts (k,v_json,at) VALUES (?,?,?)').bind('collections', JSON.stringify(collections), at),
  ]);
  return { items: { inUse: sum, cap: items.cap, left: items.left }, collections };
}

async function prune(db, cfg, state) {
  const cut = new Date(Date.now() - cfg.s.webhooks.logDays * 86400e3).toISOString();
  const runCut = new Date(Date.now() - 90 * 86400e3).toISOString();
  const out = {};
  const a = await db.prepare('DELETE FROM webhook_log WHERE received_at<?').bind(cut).run();
  out.webhookLog = (a.meta && a.meta.changes) || 0;
  const b = await db.prepare("DELETE FROM sync_runs WHERE started_at<? AND status<>'running'").bind(runCut).run();
  out.oldRuns = (b.meta && b.meta.changes) || 0;
  // A collection taken off the copy list loses its rows, but only when every list entry resolved (a typo never wipes).
  if (!state.problems) {
    const c = await db.prepare('DELETE FROM copy_items WHERE collection_id NOT IN (SELECT collection_id FROM collections WHERE copied=1)').run();
    out.offListRows = (c.meta && c.meta.changes) || 0;
    await db.prepare('DELETE FROM copy_title_links WHERE collection_id NOT IN (SELECT collection_id FROM collections WHERE copied=1)').run();
  } else out.offListRows = 'skipped: the copy list has entries that did not resolve';
  return out;
}

function summary(run, report, state, done) {
  const drift = { added: 0, changed: 0, removed: 0 };
  for (const pc of Object.values(report.perCollection)) { drift.added += pc.added; drift.changed += pc.changed; drift.removed += pc.removed; }
  return {
    ok: true, done, runId: run.run_id, kind: report.kind, by: report.by,
    next: done ? null : 'Stopped at its time or call limit at ' + (state.names[state.cols[state.i]] || state.phase) + '. Run the same call again to carry on.',
    drift, problems: report.problems, errors: report.errors, webhooks: report.webhooks, counts: report.counts, pruned: report.pruned,
    perCollection: Object.entries(report.perCollection).map(([id, pc]) => ({ id, ...pc })).sort((a, b) => a.name.localeCompare(b.name)),
    meta: { version: VERSION, ...(report.meta || {}), resumed: report.resumed || 0 },
  };
}

function mergeMeta(a, b) {
  a = a || {}; const out = { ...a };
  for (const k of Object.keys(b)) out[k] = (a[k] || 0) + b[k];
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// WEBHOOKS — registration
// ─────────────────────────────────────────────────────────────────────────────────────────
async function ensureWebhooks(db, pacer, cfg) {
  if (!cfg.s.selfUrl) throw httpErr(500, KV_KEYS.settings + '.selfUrl is missing (this Worker\'s own address).');
  const target = String(cfg.s.selfUrl).replace(/\/+$/, '') + '/webhook';
  const r = await pacer.call('/sites/' + cfg.s.siteId + '/webhooks');
  const list = (r.data && r.data.webhooks) || [];
  const events = [];
  for (const ev of cfg.events) {
    const have = list.find(w => w.triggerType === ev && w.url === target);
    if (have) { events.push({ triggerType: ev, status: 'already', id: have.id }); continue; }
    try {
      const c = await pacer.call('/sites/' + cfg.s.siteId + '/webhooks', { method: 'POST', body: { triggerType: ev, url: target } });
      events.push({ triggerType: ev, status: 'created', id: c.data && c.data.id });
    } catch (e) {
      events.push({ triggerType: ev, status: 'refused', error: e.message, wfStatus: e.wfStatus || null });
    }
  }
  const others = list.filter(w => w.url !== target).map(w => ({ triggerType: w.triggerType, url: String(w.url || '').split('?')[0] }));
  const out = { at: iso(), target, events, otherWebhooksOnSite: others };
  await db.prepare('INSERT OR REPLACE INTO site_facts (k,v_json,at) VALUES (?,?,?)').bind('webhooks', JSON.stringify(out), out.at).run();
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// WEBHOOKS — receiving (hints only)
// ─────────────────────────────────────────────────────────────────────────────────────────
const RECENT = new Map();   // per instance: "cid:iid" -> { at, trailing }

async function webhookRoute(request, env, ctx) {
  const body = await request.json().catch(() => null);
  const trigger = String((body && body.triggerType) || 'unknown').slice(0, 60);
  const sigHeaders = [...request.headers.keys()].filter(k => k.startsWith('x-webflow'));
  const signed = request.headers.has('x-webflow-signature');
  let maxHints = DEFAULTS.webhooks.maxHintsPerCall;
  try { const s = await env.IX_KV.get(KV_KEYS.settings, 'json'); if (s && s.webhooks && s.webhooks.maxHintsPerCall) maxHints = s.webhooks.maxHintsPerCall; } catch (_) {}
  const hints = hintsOf(body).slice(0, maxHints);
  ctx.waitUntil(handleHints(env, trigger, hints, signed, sigHeaders).catch(e => console.log('ix-content webhook: ' + ((e && e.message) || e))));
  return new Response(JSON.stringify({ ok: true, hints: hints.length }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

// Read Webflow's payload loosely: payload.items[], payload, items[], or the item itself.
function hintsOf(body) {
  const out = [], seen = new Set();
  const p = body && typeof body === 'object' ? (body.payload || body) : null;
  const fallbackCid = p && typeof p.collectionId === 'string' && ID24.test(p.collectionId) ? p.collectionId : null;
  const add = (o) => {
    if (!o || typeof o !== 'object') return;
    const id = o.id || o._id || o.itemId;
    const cid = o.collectionId || o._cid || null;
    if (typeof id !== 'string' || !ID24.test(id) || seen.has(id)) return;
    seen.add(id);
    out.push({ itemId: id, collectionId: typeof cid === 'string' && ID24.test(cid) ? cid : fallbackCid });
  };
  if (p && Array.isArray(p.items)) p.items.forEach(add); else add(p);
  return out;
}

async function handleHints(env, trigger, hints, signed, sigHeaders) {
  const db = needDb(env);
  const at = iso();
  const log = (cid, iid, action, detail) => db.prepare('INSERT INTO webhook_log (received_at,trigger_type,collection_id,item_id,signed,action,detail) VALUES (?,?,?,?,?,?,?)')
    .bind(at, trigger, cid || null, iid || null, signed ? 1 : 0, action, detail ? String(detail).slice(0, 500) : null).run();
  let cfg;
  try { cfg = await loadConfig(env); } catch (e) { await log(null, null, 'error', e.message); return; }
  if (!hints.length) { await log(null, null, 'no-item', 'headers: ' + (sigHeaders.join(', ') || 'none')); return; }
  const copied = await copiedMap(db);
  const pacer = new Pacer(env, cfg.s, { noWait: true, maxCalls: hints.length * 2 + cfg.s.webhooks.drainPerHint + 4 });
  const work = [];
  for (const h of hints) {
    let cid = h.collectionId;
    if (!cid) { const row = await db.prepare('SELECT collection_id FROM copy_items WHERE item_id=? LIMIT 1').bind(h.itemId).first(); cid = row && row.collection_id; }
    if (!cid || !copied.has(cid)) { await log(cid, h.itemId, 'ignored', 'not a copied collection'); continue; }
    work.push(coalesced(cfg, cid, h.itemId, () => refreshOne(db, pacer, cfg, copied.get(cid), cid, h.itemId, trigger, log)).then(a => a === 'folded' ? log(cid, h.itemId, 'folded', 'a re-read for this item is already queued') : null));
  }
  await Promise.all(work);
  await drainPending(db, pacer, cfg, cfg.s.webhooks.drainPerHint, null, log);
}

// One re-read per item per dedupe window, plus one trailing re-read for hints that arrive inside it.
async function coalesced(cfg, cid, iid, fn) {
  const key = cid + ':' + iid, w = cfg.s.webhooks.dedupeMs, r = RECENT.get(key);
  if (r && r.trailing) return 'folded';
  if (r && Date.now() - r.at < w) {
    r.trailing = true;
    await sleep(w - (Date.now() - r.at));
    r.trailing = false; r.at = Date.now();
    return fn();
  }
  RECENT.set(key, { at: Date.now(), trailing: false });
  if (RECENT.size > 2000) for (const k of RECENT.keys()) { RECENT.delete(k); if (RECENT.size < 1000) break; }
  return fn();
}

async function copiedMap(db) {
  const r = await db.prepare('SELECT collection_id,tenancy_json FROM collections WHERE copied=1').all();
  return new Map((r.results || []).map(x => [x.collection_id, x.tenancy_json ? JSON.parse(x.tenancy_json) : null]));
}

async function tenancyFor(db, pacer, cfg, cid, ten) {
  if (ten) return ten;
  const sc = await pacer.call('/collections/' + cid);
  const entry = cfg.copy.find(e => e && e.id === cid);
  const t = tenancyOf(cid, sc.data, cfg.s.tenancy, entry && entry.tenancy);
  await db.prepare('UPDATE collections SET tenancy_json=? WHERE collection_id=?').bind(JSON.stringify(t), cid).run();
  return t;
}

async function refreshOne(db, pacer, cfg, ten, cid, iid, trigger, log) {
  const now = iso();
  try {
    const r = await pacer.call('/collections/' + cid + '/items/' + iid);
    if (r.status === 404) {
      const d = await db.prepare('DELETE FROM copy_items WHERE collection_id=? AND item_id=?').bind(cid, iid).run();
      await db.batch([
        db.prepare('DELETE FROM copy_title_links WHERE collection_id=? AND item_id=?').bind(cid, iid),
        db.prepare('DELETE FROM pending_items WHERE collection_id=? AND item_id=?').bind(cid, iid),
        db.prepare('UPDATE collections SET last_change=? WHERE collection_id=?').bind(now, cid),
      ]);
      if (log) await log(cid, iid, 'removed', (d.meta && d.meta.changes) ? 'not in Webflow; row removed' : 'not in Webflow; no row held');
      return 'removed';
    }
    const t = await tenancyFor(db, pacer, cfg, cid, ten);
    const item = r.data && r.data.id ? r.data : null;
    if (!item) { if (log) await log(cid, iid, 'error', 'Webflow answered without an item'); return 'error'; }
    await db.batch([
      ...upsertStmts(db, cid, item, t, null, now, false),
      db.prepare('DELETE FROM pending_items WHERE collection_id=? AND item_id=?').bind(cid, iid),
      db.prepare('UPDATE collections SET last_change=? WHERE collection_id=?').bind(now, cid),
    ]);
    const T = cfg.s.tenancy;
    await derivePass(db, T, (cid === T.plans || cid === T.titlesAdmin) ? null : iid);
    if (log) await log(cid, iid, 'stored', 'lastUpdated ' + (item.lastUpdated || '?') + (item.isDraft ? ', draft' : '') + (item.isArchived ? ', archived' : ''));
    return 'stored';
  } catch (e) {
    if (e && (e.busy || e.budget)) {
      await db.prepare('INSERT INTO pending_items (collection_id,item_id,trigger_type,queued_at,tries) VALUES (?,?,?,?,1) ' +
        'ON CONFLICT(collection_id,item_id) DO UPDATE SET tries=pending_items.tries+1').bind(cid, iid, trigger, now).run();
      if (log) await log(cid, iid, 'deferred', e.message);
      return 'deferred';
    }
    if (log) await log(cid, iid, 'error', (e && e.message) || String(e));
    return 'error';
  }
}

async function drainPending(db, pacer, cfg, n, report, log) {
  if (!n) return;
  const rows = await db.prepare('SELECT collection_id,item_id,trigger_type FROM pending_items ORDER BY queued_at LIMIT ?').bind(n).all();
  const list = rows.results || [];
  if (!list.length) return;
  const copied = await copiedMap(db);
  let done = 0;
  for (const p of list) {
    if (!copied.has(p.collection_id)) { await db.prepare('DELETE FROM pending_items WHERE collection_id=? AND item_id=?').bind(p.collection_id, p.item_id).run(); continue; }
    const a = await refreshOne(db, pacer, cfg, copied.get(p.collection_id), p.collection_id, p.item_id, p.trigger_type, log);
    if (a === 'deferred') break;
    done++;
  }
  if (report) report.pendingDrained = done;
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// STATUS AND HEALTH (open; D1 and KV only, never Webflow)
// ─────────────────────────────────────────────────────────────────────────────────────────
async function status(env) {
  const db = needDb(env);
  let reads = null, problems = [];
  try { reads = env.IX_KV ? await env.IX_KV.get(KV_KEYS.reads, 'json') : null; } catch (_) {}
  const now = Date.now();
  const [cols, rows, facts, nightly, backfill, running, pending, hooks, signed] = await Promise.all([
    db.prepare('SELECT * FROM collections WHERE copied=1').all(),
    db.prepare('SELECT collection_id, COUNT(*) AS n, SUM(title_admin_id IS NULL AND item_id NOT IN (SELECT item_id FROM copy_title_links l WHERE l.collection_id=copy_items.collection_id)) AS noTitle, ' +
      'SUM(publisher_id IS NULL) AS noPublisher, SUM(is_draft) AS drafts, SUM(is_archived) AS archived FROM copy_items GROUP BY collection_id').all(),
    db.prepare('SELECT k,v_json,at FROM site_facts').all(),
    db.prepare("SELECT * FROM sync_runs WHERE kind='nightly' AND status='done' ORDER BY started_at DESC LIMIT 1").first(),
    db.prepare("SELECT * FROM sync_runs WHERE kind='backfill' ORDER BY started_at DESC LIMIT 1").first(),
    db.prepare("SELECT run_id,kind,status,started_at,beat_at FROM sync_runs WHERE status IN ('running','stopped','failed') ORDER BY started_at DESC LIMIT 3").all(),
    db.prepare('SELECT COUNT(*) AS n FROM pending_items').first(),
    db.prepare('SELECT received_at,trigger_type,collection_id,item_id,signed,action,detail FROM webhook_log ORDER BY id DESC LIMIT 20').all(),
    db.prepare('SELECT MAX(received_at) AS last, SUM(signed) AS signedN, COUNT(*) AS n FROM webhook_log').first(),
  ]);
  const byCol = new Map((rows.results || []).map(r => [r.collection_id, r]));
  const fact = Object.fromEntries((facts.results || []).map(f => [f.k, { ...JSON.parse(f.v_json), at: f.at }]));
  const names = new Map((cols.results || []).map(c => [c.collection_id, c.display_name]));
  const lastRun = (r) => {
    if (!r) return null;
    const rep = r.report_json ? JSON.parse(r.report_json) : {};
    if (rep.problems && rep.problems.length) problems = rep.problems;
    const drift = { added: 0, changed: 0, removed: 0 };
    for (const pc of Object.values(rep.perCollection || {})) { drift.added += pc.added; drift.changed += pc.changed; drift.removed += pc.removed; }
    return { runId: r.run_id, status: r.status, by: r.by_who, started: r.started_at, finished: r.finished_at, drift, errors: rep.errors || [], meta: rep.meta || null };
  };
  const out = {
    ok: true, version: VERSION, at: iso(),
    site: {
      items: fact.items ? { inUse: fact.items.inUse, cap: fact.items.cap, left: fact.items.left, countedAt: fact.items.at } : 'not counted yet (first nightly or backfill run)',
      collections: fact.collections ? { inUse: fact.collections.inUse, cap: fact.collections.cap, left: fact.collections.left, countedAt: fact.collections.at } : 'not counted yet',
    },
    lastNightly: lastRun(nightly),
    lastBackfill: lastRun(backfill),
    unfinishedRuns: (running.results || []),
    webhooks: {
      registered: fact.webhooks || 'not registered yet',
      lastReceivedAt: signed && signed.last || null,
      callsLogged: signed ? signed.n : 0,
      signatureSeen: signed && signed.n ? (signed.signedN > 0) : null,
      pendingReReads: pending ? pending.n : 0,
      recent: (hooks.results || []).map(h => ({ ...h, collection: names.get(h.collection_id) || h.collection_id, signed: !!h.signed })),
    },
    collections: (cols.results || []).map(c => {
      const r = byCol.get(c.collection_id) || { n: 0, noTitle: 0, noPublisher: 0, drafts: 0, archived: 0 };
      const ten = c.tenancy_json ? JSON.parse(c.tenancy_json) : null;
      return {
        name: c.display_name, id: c.collection_id,
        d1Rows: r.n, webflowTotal: c.webflow_total, matches: c.webflow_total == null ? null : r.n === c.webflow_total,
        lastFullCheck: c.last_full_check, copyAgeMinutes: c.last_full_check ? Math.round((now - Date.parse(c.last_full_check)) / 60000) : null,
        lastWebhookChange: c.last_change,
        drafts: r.drafts || 0, archived: r.archived || 0,
        // null = this collection has no title (or publisher) link at all, so there is nothing to miss
        rowsWithoutTitle: ten && (ten.self === 'titleAdmin' || ten.titleAdmin || ten.plan || ten.self === 'plan') ? (r.noTitle || 0) : null,
        rowsWithoutPublisher: ten && (ten.self === 'publisher' || ten.publisher || ten.titleAdmin || ten.plan || ten.self === 'titleAdmin' || ten.self === 'plan') ? (r.noPublisher || 0) : null,
        tenancy: ten ? { self: ten.self, titleAdmin: ten.titleAdmin && ten.titleAdmin.slug, publisher: ten.publisher && ten.publisher.slug, plan: ten.plan && ten.plan.slug, notes: ten.notes } : null,
      };
    }).sort((a, b) => String(a.name).localeCompare(String(b.name))),
    copyListProblems: problems,
    readSwitch: reads,
  };
  return out;
}

async function health(env) {
  const out = { ok: true, version: VERSION, bindings: {
    IX_DB: !!(env.IX_DB && env.IX_DB.prepare), IX_KV: !!env.IX_KV, MEMBERS: !!(env.MEMBERS && env.MEMBERS.fetch), WEBFLOW_TOKEN: !!env.WEBFLOW_TOKEN,
  } };
  if (out.bindings.IX_DB) {
    try {
      const r = await env.IX_DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const have = new Set((r.results || []).map(x => x.name));
      const missing = SCHEMA_TABLES.filter(t => !have.has(t));
      out.schema = missing.length ? { ok: false, missing } : { ok: true, tables: SCHEMA_TABLES.length };
    } catch (e) { out.schema = { ok: false, error: e.message }; }
  }
  if (out.bindings.IX_KV) {
    out.kv = {};
    for (const [k, key] of Object.entries(KV_KEYS)) {
      try { const v = await env.IX_KV.get(key, 'json'); out.kv[key] = v == null ? 'missing' : (Array.isArray(v) ? v.length + ' entries' : 'present'); }
      catch (e) { out.kv[key] = 'not valid JSON'; }
    }
  }
  out.ok = Object.values(out.bindings).every(Boolean) && !!(out.schema && out.schema.ok) && !!out.kv && !Object.values(out.kv).some(v => v === 'missing' || v === 'not valid JSON');
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────────────────────────────────
function corsHeaders(origin, allowed) {
  const h = { 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '600' };
  if (origin && allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
function json(obj, status, extra) {
  return new Response(JSON.stringify(obj, null, 2), { status: status || 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...(extra || {}) } });
}
function httpErr(status, message) { const e = new Error(message); e.status = status; return e; }
function sleep(ms) { return new Promise(r => setTimeout(r, Math.max(0, ms))); }
function iso() { return new Date().toISOString(); }
function nn(v) { return v === undefined || v === null || v === '' ? null : v; }
function chunk(a, n) { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out; }
