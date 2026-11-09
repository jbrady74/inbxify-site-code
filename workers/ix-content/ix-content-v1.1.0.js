// ix-content-v1.1.0.js
// INBXIFY · Cloudflare Worker · ix-content
// The home of working data (D1) and the keeper of a full, current copy of every Webflow collection
// that stays in Webflow. Content Home phase 1 (Content-Home-Scoping-v0_2, rulings 1 to 9) and phase 2, first part.
//
// v1.1.0 (9 Nov 2026, Content Home S3 · ALLOCATIONS home) — ALLOCATIONS MOVE OFF SCENARIO 103B.
//   Rulings this session (Jeff, 9 Nov): MAKE BEFORE BREAK. Until the last Make writer of a collection is gone, WEBFLOW
//   STAYS THE MASTER: the Worker writes Webflow first, publishes, and stores what Webflow answered in D1. A new row
//   takes Webflow's id. One batch save route per table. No true delete of an ALLOCATIONS row: Remove sets Webflow's
//   own Archived flag and takes the row off the live site; the row stays in Webflow and D1. Pages get each row's
//   version from this Worker, and a save against an older version is refused.
//   What follows from Webflow being the master (told to Jeff, not a choice): a batch cannot be undone halfway, so
//   every op is checked before anything is sent, and if Webflow refuses a write partway the reply names which ops
//   landed and which were not sent. True all-or-nothing arrives at the cutover, when D1 becomes first.
//
//   8 · HOME TABLES (new). KV contentHome.home names each moved collection (today: allocations) and the few field
//       slugs that become real D1 columns. Title and plans are found from the collection's schema, the same way the
//       copy finds tenancy. The publisher comes from the title's row in the copy. Option fields are written by name
//       (e.g. disposition "undecided"): the Worker reads the option ids from Webflow's schema, never typed (103B had
//       the four disposition ids typed in; that hardcode is gone).
//   9 · VERSION. A row's version goes up only when its content changes (fields, plans, draft, archived), whoever
//       changed it: this Worker, Make through Webflow, or someone in the Webflow editor. A publish that changes nothing
//       else does not move it, so a page's own save never makes its version stale.
//  10 · FOLLOWING WEBFLOW. Webhook hints for a home collection re-read the row and store it (a 404 removes it, logged
//       in change_log). The nightly check and POST /admin/backfill-home list the whole collection and repair D1.
//       Before every update or remove, the save route re-reads the row from Webflow itself: if Webflow differs from
//       D1, D1 is brought up to date, the version moves, and that op is refused as stale. So a write made through
//       103B (the Editorial Picker's link) is always caught, whether or not Make's writes fire webhooks.
//  11 · WRITES ARE NEVER RESENT. A Webflow write that fails with a 5xx or no answer is not retried (it may have landed);
//       the reply says so and names it. A 429 is retried after Retry-After, because Webflow refused it unread.
//       Page saves run in burst mode (no spacing), on ix-content's own token, so they never spend the IPP's budget.
//
//   WHAT IT DOES (phase 1, unchanged)
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
//       removed), then every home table (v1.1.0), recomputes derived tenancy, counts every collection's items
//       against the caps, prunes the log. It reports what it fixed. On an empty database the first nightly run IS
//       the backfill.
//   5 · BACKFILL (POST /admin/backfill). The same list pass without the webhook step. Resumable: a run stops at its
//       time or call limit, saves where it was, and the next call carries on (?fresh=1 starts over).
//   6 · PACER. Every Webflow call goes through class Pacer: spaced to settings.pace.perMinute, honours Retry-After
//       on a 429 (capped), retries 5xx on reads only, slows when X-RateLimit-Remaining runs low.
//   7 · STATUS (GET /status, open). Copy age per collection, D1 rows against Webflow's total, rows with no title
//       or publisher, last nightly and backfill results, webhook registrations and the latest webhook calls,
//       Webflow items in use against the item cap, collections against the collection cap, and (v1.1.0) each home
//       table's rows. Reads D1 only; it never calls Webflow, so opening it costs nothing.
//
//   ONE SHARED PERMISSION CHECK. permit(env, request, action, row) asks ix-members (service binding MEMBERS,
//   GET /whoami) who is calling and answers through RULES. Every action is staff-only today. Publisher rules go in
//   RULES later (a member's publishers against the row's publisher_id), never by adding publishers to the staff list.
//
//   ROUTES
//   GET  /health                 open. Version, bindings, schema present (with v1.1.0 columns), KV keys present.
//   GET  /status                 open. See 7.
//   POST /webhook                open. Webflow hints. See 3 and 10.
//   POST /admin/backfill         staff. ?fresh=1 starts a new run instead of resuming.
//   POST /admin/nightly          staff. Runs the nightly check now. ?fresh=1 as above.
//   POST /admin/register         staff. Lists the site's webhooks and creates the missing ones.
//   POST /admin/backfill-home    staff. ?table=allocations. Lists that collection from Webflow and repairs D1.
//   GET  /allocations?taId=      staff (allocations.read). This title's rows with versions, page order.
//                                &printIssue=<name> narrows to one print issue; &archived=1 includes removed rows.
//   POST /allocations/batch      staff (allocations.create / .update / .remove). JSON body:
//        { "taId": "<TITLES-ADMIN id>", "ops": [
//            { "op": "create", "fields": { "<slug>": value, ... } },
//            { "op": "update", "id": "<row id>", "version": 3, "fields": { "<slug>": value, ... } },
//            { "op": "remove", "id": "<row id>", "version": 3 } ] }
//        Fields are Webflow slugs. An Option field takes the option's name (any case, spaces or hyphens) or its id.
//        A Reference takes an id, or "" / null to clear it. A MultiReference takes the full list of ids.
//        Each plan named must belong to taId. The title field is set to taId on create and may not be changed.
//        The self-id field (contentHome.home.allocations.selfIdField) is written by the Worker, never by a page.
//        Reply: { ok, taId, results: [ { i, op, ok, id, row?, error?, stale?, sent } ], published, meta }.
//        ok is true only when every op landed and was published. row is the row as stored in D1 after the write.
//        Nothing is sent when any op fails its check; the reply names each failing op.
//   Staff calls: from a page on an allowed origin, signed in to Memberstack as staff:
//     const t = await window.$memberstackDom.getMemberCookie();
//     fetch('https://ix-content.jeff-2cd.workers.dev/admin/backfill-home?table=allocations', { method:'POST', headers:{ Authorization:'Bearer '+t } })
//
//   BINDINGS (Cloudflare dashboard, never in the repo)
//   IX_DB          D1 database "ix-content" (HC-P-CH1-1). Schema: ix-content-schema-v1.1.0.sql.
//   IX_KV          KV namespace "ix-config" (shared with ix-issue-data; this Worker reads only contentHome.* keys).
//   MEMBERS        Service binding to ix-members.
//   WEBFLOW_TOKEN  Secret. ix-content's own site token. v1.1.0 needs CMS read AND WRITE, Sites read and write.
//   Cron Trigger   The nightly check's time (HC-P-CH1-4), set in Settings > Triggers.
//
//   KV KEYS (namespace ix-config)
//   contentHome.copy      [ { id?, name?, tenancy?: { titleAdmin?, publisher?, plan? } } ]  (HC-P-CH1-2)
//   contentHome.events    [ "collection_item_created", ... ]  webhook trigger types (HC-P-CH1-3)
//   contentHome.reads     { route: "webflow" | "d1" }  read switch, used from phase 3 (HC-P-CH1-5)
//   contentHome.settings  siteId, selfUrl, allowedOrigins, tenancy ids, caps (HC-P-CH1-6), pace and run
//                         limits (HC-P-CH1-4), webhook options. Defaults below fill anything left out.
//   contentHome.home      (v1.1.0) { "allocations": { "collectionId", "selfIdField", "pageField", "printIssueField",
//                         "createDefaults": { "<slug>": "<option name or value>" }, "tenancy"?: { titleAdmin?, plan? } } }
//
//   HARDCODING (provisional ids, for the tracker): HC-P-CH1-7 binding names and KV key names (KV_KEYS);
//   HC-P-CH1-8 Webflow API base and page size 100; HC-P-CH1-9 the staff-only RULES; HC-P-CH1-10 DEFAULTS;
//   HC-P-CH1-11 tenancy target ids in contentHome.settings.tenancy. New in v1.1.0: HC-P-CH3-1 the home table names
//   (HOME_TABLES, code: a table name is how code reaches D1); HC-P-CH3-2 batch size cap 50 ops (BATCH_MAX);
//   HC-P-CH3-3 burst 429 wait cap 20 s (DEFAULTS.burst). Field slugs and create defaults live in KV, not code.

const VERSION = '1.1.0';
const WF = 'https://api.webflow.com/v2';                         // HC-P-CH1-8
const PAGE = 100;                                                // HC-P-CH1-8 · Webflow lists at most 100 a request
const KV_KEYS = {                                                // HC-P-CH1-7
  copy: 'contentHome.copy',
  events: 'contentHome.events',
  reads: 'contentHome.reads',
  settings: 'contentHome.settings',
  home: 'contentHome.home',                                      // v1.1.0
};
const HOME_TABLES = ['allocations'];                             // HC-P-CH3-1 · nl_blocks joins in a later session
const BATCH_MAX = 50;                                            // HC-P-CH3-2
const DEFAULTS = {                                               // HC-P-CH1-10 · only where settings leave a value out
  allowedOrigins: ['https://www.inbxify.com', 'https://inbxify.com'],
  caps: { items: 20000, collections: 40 },
  pace: { perMinute: 100, maxRetries: 4, retryAfterCapMs: 65000, lowWater: 5, lowWaterPauseMs: 3000 },
  runs: { maxCalls: 800, maxQueries: 800, adminBudgetMs: 90000, cronBudgetMs: 600000, resumeWithinHours: 24, busyIfBeatWithinMs: 120000 },
  webhooks: { autoRegister: true, dedupeMs: 5000, logDays: 30, drainPerHint: 3, maxHintsPerCall: 50 },
  burst: { retryAfterCapMs: 20000, maxRetries: 2 },              // HC-P-CH3-3 · page saves
};
const SCHEMA_TABLES = ['copy_items', 'copy_title_links', 'nl_blocks', 'allocations', 'allocation_plans', 'change_log',
  'collections', 'sync_runs', 'pending_items', 'webhook_log', 'site_facts'];
const SCHEMA_COLUMNS = { allocations: ['is_draft', 'is_archived', 'wf_updated'] };   // v1.1.0 (schema v1.1.0)
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
      if (p === '/allocations' && m === 'GET') return json(await homeListRoute(request, env, url, 'allocations'), 200, cors);
      if (p === '/allocations/batch' && m === 'POST') {
        if (origin && !allowed.includes(origin)) return json({ ok: false, error: 'This origin may not call ix-content.' }, 403, cors);
        const out = await homeBatchRoute(request, env, 'allocations');
        return json(out.body, out.status, cors);
      }
      if (p.startsWith('/admin/')) {
        if (m !== 'POST') return json({ ok: false, error: 'Admin routes take POST.' }, 405, cors);
        if (origin && !allowed.includes(origin)) return json({ ok: false, error: 'This origin may not call ix-content.' }, 403, cors);
        const gate = await permit(env, request, 'content.admin', null);
        if (!gate.ok) return json({ ok: false, error: gate.why }, gate.status, cors);
        const by = gate.who.email || gate.who.memberId;
        const fresh = url.searchParams.get('fresh') === '1';
        if (p === '/admin/backfill') return json(await runCheck(env, { kind: 'backfill', by, fresh, budget: 'admin' }), 200, cors);
        if (p === '/admin/nightly') return json(await runCheck(env, { kind: 'nightly', by, fresh, budget: 'admin' }), 200, cors);
        if (p === '/admin/backfill-home') {
          const table = url.searchParams.get('table') || '';
          if (!HOME_TABLES.includes(table)) return json({ ok: false, error: 'table must be one of: ' + HOME_TABLES.join(', ') + '.' }, 400, cors);
          const cfg = await loadConfig(env);
          const pacer = new Pacer(env, cfg.s, { maxCalls: cfg.s.runs.maxCalls });
          return json(await syncHome(env, cfg, pacer, table, by), 200, cors);
        }
        if (p === '/admin/register') {
          const cfg = await loadConfig(env);
          const pacer = new Pacer(env, cfg.s, { maxCalls: 20 });
          return json({ ok: true, by, webhooks: await ensureWebhooks(needDb(env), pacer, cfg), meta: pacer.meta() }, 200, cors);
        }
      }
      return json({ ok: false, error: 'Unknown route. See the v1.1.0 header.' }, 404, cors);
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
const RULES = {                                                  // HC-P-CH1-9 · publisher rules join here later
  'content.admin': (who /*, row */) => who.staff,
  'allocations.read': (who /*, row */) => who.staff,             // v1.1.0
  'allocations.create': (who /*, row */) => who.staff,
  'allocations.update': (who /*, row */) => who.staff,
  'allocations.remove': (who /*, row */) => who.staff,
};

// Who is calling (one ix-members call), then each action is judged by allowed() without asking again.
async function permit(env, request, action, row) {
  const rule = RULES[action];
  if (!rule) return { ok: false, status: 500, why: 'No permission rule for action "' + action + '".' };
  const id = await identify(env, request);
  if (!id.ok) return id;
  if (!rule(id.who, row)) return { ok: false, status: 403, who: id.who, why: 'This login may not do that (' + action + ').' };
  return { ok: true, who: id.who };
}

function allowed(who, action, row) {
  const rule = RULES[action];
  return !!(rule && rule(who, row));
}

async function identify(env, request) {
  const auth = request.headers.get('Authorization') || '';
  if (!/^Bearer\s+\S+/i.test(auth)) return { ok: false, status: 401, why: 'Not signed in: no Memberstack token was sent.' };
  if (!env.MEMBERS || typeof env.MEMBERS.fetch !== 'function') return { ok: false, status: 500, why: 'The MEMBERS service binding (to ix-members) is not set on this Worker.' };
  let res, j = null;
  try { res = await env.MEMBERS.fetch(new Request('https://ix-members/whoami', { headers: { Authorization: auth } })); j = await res.json().catch(() => null); }
  catch (e) { return { ok: false, status: 502, why: 'ix-members did not answer: ' + ((e && e.message) || e) }; }
  if (!res.ok || !j || !j.ok) return { ok: false, status: res && res.status === 401 ? 401 : 403, why: (j && j.error) || 'The login check failed.' };
  const who = { memberId: j.memberId, email: j.email || null, staff: !!j.staff, publishers: (j.publishers || []).map(p => p.id) };
  return { ok: true, who };
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// CONFIG (KV only; nothing here is typed per publisher or title)
// ─────────────────────────────────────────────────────────────────────────────────────────
async function loadConfig(env) {
  if (!env.IX_KV) throw httpErr(500, 'The IX_KV binding (KV namespace ix-config) is not set on this Worker.');
  const [copy, events, reads, settings, home] = await Promise.all([
    env.IX_KV.get(KV_KEYS.copy, 'json'), env.IX_KV.get(KV_KEYS.events, 'json'),
    env.IX_KV.get(KV_KEYS.reads, 'json'), env.IX_KV.get(KV_KEYS.settings, 'json'),
    env.IX_KV.get(KV_KEYS.home, 'json'),
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
    burst: { ...DEFAULTS.burst, ...(settings.burst || {}) },
  };
  if (!ID24.test(s.siteId || '')) throw httpErr(500, KV_KEYS.settings + '.siteId is missing.');
  const t = s.tenancy || {};
  for (const k of ['titlesAdmin', 'publishers', 'plans']) if (!ID24.test(t[k] || '')) throw httpErr(500, KV_KEYS.settings + '.tenancy.' + k + ' is missing.');
  return { copy, events, reads: reads || {}, s, home: home && typeof home === 'object' ? home : {} };
}

// The home config for one table, checked. Throws a plain message when KV is incomplete.
function homeCfg(cfg, table) {
  const h = cfg.home[table];
  if (!h || typeof h !== 'object') throw httpErr(500, KV_KEYS.home + '.' + table + ' is missing.');
  if (!ID24.test(h.collectionId || '')) throw httpErr(500, KV_KEYS.home + '.' + table + '.collectionId is missing.');
  for (const k of ['selfIdField', 'pageField', 'printIssueField']) if (!h[k]) throw httpErr(500, KV_KEYS.home + '.' + table + '.' + k + ' is missing.');
  return h;
}

// Which home table a Webflow collection id belongs to, or null.
function homeTableOf(cfg, cid) {
  for (const t of HOME_TABLES) { const h = cfg.home[t]; if (h && h.collectionId === cid) return t; }
  return null;
}

function needDb(env) {
  if (!env.IX_DB || typeof env.IX_DB.prepare !== 'function') throw httpErr(500, 'The IX_DB binding (D1 database ix-content) is not set on this Worker.');
  return env.IX_DB;
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// PACER — every Webflow call goes through here
// ─────────────────────────────────────────────────────────────────────────────────────────
class Pacer {
  // opts.burst (v1.1.0, page saves): no spacing; a 429 waits Retry-After (capped by settings.burst) and tries again.
  // A write (anything but GET) is never resent after a 5xx or no answer: it may have landed. The error says so (unsure).
  constructor(env, s, opts) {
    if (!env.WEBFLOW_TOKEN) throw httpErr(500, 'The WEBFLOW_TOKEN secret is not set on this Worker.');
    this.token = env.WEBFLOW_TOKEN;
    this.p = s.pace;
    this.b = s.burst || DEFAULTS.burst;
    this.gap = Math.ceil(60000 / Math.max(1, Number(this.p.perMinute) || 100));
    this.maxCalls = (opts && opts.maxCalls) || s.runs.maxCalls;
    this.noWait = !!(opts && opts.noWait);
    this.burst = !!(opts && opts.burst);
    this.last = 0; this.calls = 0; this.waitedMs = 0; this.r429 = 0; this.retries = 0;
  }
  meta() { return { webflowCalls: this.calls, waitedMs: this.waitedMs, got429: this.r429, retries: this.retries }; }
  budgetLeft() { return this.maxCalls - this.calls; }
  async call(path, opts) {
    const method = (opts && opts.method) || 'GET';
    const body = opts && opts.body;
    const isWrite = method !== 'GET';
    const maxRetries = this.burst ? this.b.maxRetries : this.p.maxRetries;
    for (let attempt = 0; ; attempt++) {
      if (this.calls >= this.maxCalls) { const e = httpErr(503, 'This run has used its Webflow call budget.'); e.budget = true; throw e; }
      const wait = this.last + this.gap - Date.now();
      if (wait > 0 && !this.noWait && !this.burst) await sleep(wait);
      this.last = Date.now(); this.calls++;
      let res;
      try {
        res = await fetch(WF + path, {
          method,
          headers: { Authorization: 'Bearer ' + this.token, accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch (e) {
        if (!isWrite && !this.noWait && attempt < maxRetries) { this.retries++; await this.nap(2000 * (attempt + 1)); continue; }
        const x = httpErr(502, 'Webflow did not answer (' + method + ' ' + path + '): ' + ((e && e.message) || e)); x.busy = true; x.unsure = isWrite; throw x;
      }
      if (res.status === 429 || res.status >= 500) {
        if (res.status === 429) this.r429++;
        const canRetry = res.status === 429 ? (this.burst || !this.noWait) : (!isWrite && !this.noWait && !this.burst);
        if (!canRetry || attempt >= maxRetries) {
          const x = httpErr(res.status === 429 ? 503 : 502, 'Webflow answered ' + res.status + ' on ' + method + ' ' + path +
            (res.status === 429 ? ' (rate limit)' : '') + '.'); x.busy = true; x.unsure = isWrite && res.status !== 429; throw x;
        }
        const ra = Number(res.headers.get('Retry-After'));
        const cap = this.burst ? this.b.retryAfterCapMs : this.p.retryAfterCapMs;
        this.retries++;
        await this.nap(Math.min(cap, Number.isFinite(ra) && ra > 0 ? ra * 1000 : 2000 * (attempt + 1)));
        continue;
      }
      const remaining = Number(res.headers.get('X-RateLimit-Remaining'));
      if (!this.noWait && !this.burst && Number.isFinite(remaining) && remaining <= this.p.lowWater) await this.nap(this.p.lowWaterPauseMs);
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
      state.phase = 'home';
    }
    if (state.phase === 'home') {                          // v1.1.0 · each home table, whole list, D1 repaired
      report.home = report.home || {};
      for (const t of HOME_TABLES) {
        if (!cfg.home[t] || report.home[t]) continue;
        if (outOfTime(20)) { await save('stopped'); return summary(run, report, state, false); }
        try { report.home[t] = await syncHome(env, cfg, pacer, t, opts.by); }
        catch (e) { if (e && e.budget) throw e; report.home[t] = { ok: false, error: e.message }; report.errors.push(t + ': ' + e.message); }
        await save('running');
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
    home: report.home || null,
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
    if (!cid) cid = await homeCidOfItem(db, cfg, h.itemId);                       // v1.1.0
    const homeT = cid ? homeTableOf(cfg, cid) : null;                              // v1.1.0
    if (homeT) {
      work.push(coalesced(cfg, cid, h.itemId, () => refreshHomeOne(env, db, pacer, cfg, homeT, h.itemId, trigger, log, 'webhook'))
        .then(a => a === 'folded' ? log(cid, h.itemId, 'folded', 'a re-read for this item is already queued') : null));
      continue;
    }
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
    const homeT = homeTableOf(cfg, p.collection_id);                                 // v1.1.0
    if (homeT) {
      const a = await refreshHomeOne(null, db, pacer, cfg, homeT, p.item_id, p.trigger_type, log, 'pending');
      if (a === 'deferred') break;
      done++; continue;
    }
    if (!copied.has(p.collection_id)) { await db.prepare('DELETE FROM pending_items WHERE collection_id=? AND item_id=?').bind(p.collection_id, p.item_id).run(); continue; }
    const a = await refreshOne(db, pacer, cfg, copied.get(p.collection_id), p.collection_id, p.item_id, p.trigger_type, log);
    if (a === 'deferred') break;
    done++;
  }
  if (report) report.pendingDrained = done;
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// HOME TABLES (v1.1.0) — rows whose home moves to D1. While Webflow is the master (make before break), every row
// here is exactly what Webflow last answered for that item, plus a version that moves when the content changes.
// ─────────────────────────────────────────────────────────────────────────────────────────

// The one place a home table's own columns are named (HC-P-CH3-1). Only allocations today.
const HOME_COLS = {
  allocations: { plansTable: 'allocation_plans', plansKey: 'allocation_id' },
};

const SCHEMA_TTL_MS = 120000;
const SCHEMA_MEMO = new Map();   // per instance: collectionId -> { at, sch }

// The collection's schema, shaped for writing: every field by slug with its type and options; the title and plans
// fields found the way the copy finds tenancy (KV contentHome.home.<table>.tenancy overrides).
async function homeSchema(pacer, cfg, table, fresh) {
  const h = homeCfg(cfg, table);
  const memo = SCHEMA_MEMO.get(h.collectionId);
  if (!fresh && memo && Date.now() - memo.at < SCHEMA_TTL_MS) return memo.sch;
  const r = await pacer.call('/collections/' + h.collectionId);
  if (!r.data || !Array.isArray(r.data.fields)) throw httpErr(502, 'Webflow did not answer the ' + table + ' schema.');
  const fields = {};
  for (const f of r.data.fields) fields[f.slug] = { type: f.type, required: !!f.isRequired, editable: f.isEditable !== false,
    options: f.validations && Array.isArray(f.validations.options) ? f.validations.options.map(o => ({ id: o.id, name: o.name })) : null };
  const ten = tenancyOf(h.collectionId, r.data, cfg.s.tenancy, h.tenancy || null);
  if (!ten.titleAdmin) throw httpErr(500, table + ': no single field points at TITLES-ADMIN (' + ten.notes.join('; ') + '). Name it in ' + KV_KEYS.home + '.' + table + '.tenancy.titleAdmin.');
  for (const k of ['selfIdField', 'pageField', 'printIssueField'])
    if (!fields[h[k]]) throw httpErr(500, KV_KEYS.home + '.' + table + '.' + k + ' names "' + h[k] + '", which ' + table + ' does not have.');
  const sch = { table, collectionId: h.collectionId, fields, titleSlug: ten.titleAdmin.slug,
    plansSlug: ten.plan && ten.plan.multi ? ten.plan.slug : null, notes: ten.notes, h };
  SCHEMA_MEMO.set(h.collectionId, { at: Date.now(), sch });
  return sch;
}

// Option labels kept in D1 so the read route answers names without calling Webflow.
function schemaFactStmt(db, sch) {
  const labels = {};
  for (const [slug, f] of Object.entries(sch.fields)) if (f.options) labels[slug] = Object.fromEntries(f.options.map(o => [o.id, o.name]));
  return db.prepare('INSERT OR REPLACE INTO site_facts (k,v_json,at) VALUES (?,?,?)')
    .bind('schema:' + sch.table, JSON.stringify({ titleSlug: sch.titleSlug, plansSlug: sch.plansSlug, labels }), iso());
}

async function homeCidOfItem(db, cfg, itemId) {
  for (const t of HOME_TABLES) {
    if (!cfg.home[t]) continue;
    const r = await db.prepare('SELECT 1 AS y FROM ' + t + ' WHERE id=?').bind(itemId).first();
    if (r) return cfg.home[t].collectionId;
  }
  return null;
}

async function publisherOfTitle(db, cfg, titleId) {
  if (!titleId) return '';
  const r = await db.prepare('SELECT publisher_id FROM copy_items WHERE collection_id=? AND item_id=?').bind(cfg.s.tenancy.titlesAdmin, titleId).first();
  return (r && r.publisher_id) || '';
}

// Sorted-key JSON, so two reads of the same item compare equal whatever order Webflow lists the fields in.
function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
function contentKey(fields, draft, archived) { return canon(fields || {}) + '|' + (draft ? 1 : 0) + '|' + (archived ? 1 : 0); }

// A Webflow item as a home row (no version yet).
function homeRowOf(item, sch, publisherId) {
  const fd = item.fieldData || {}, h = sch.h;
  const title = refValues(fd[sch.titleSlug])[0] || '';
  const pageN = Number(fd[h.pageField]);
  return {
    id: item.id, publisher_id: publisherId || '', title_admin_id: title,
    print_issue: nn(fd[h.printIssueField]), page: Number.isFinite(pageN) && fd[h.pageField] !== '' && fd[h.pageField] != null ? Math.trunc(pageN) : null,
    is_draft: item.isDraft ? 1 : 0, is_archived: item.isArchived ? 1 : 0, wf_updated: nn(item.lastUpdated),
    created_at: item.createdOn || iso(), fields: fd, plans: sch.plansSlug ? refValues(fd[sch.plansSlug]) : [],
  };
}

function parseRow(r) {
  if (!r) return null;
  return { ...r, fields: r.fields ? JSON.parse(r.fields) : {}, plans: r.plans ? String(r.plans).split(',').filter(Boolean) : [] };
}

async function readHomeRows(db, table, where, binds) {
  const c = HOME_COLS[table];
  const sql = 'SELECT t.*, (SELECT GROUP_CONCAT(plan_id) FROM ' + c.plansTable + ' p WHERE p.' + c.plansKey + '=t.id) AS plans FROM ' + table + ' t ' + where;
  const r = await db.prepare(sql).bind(...binds).all();
  return (r.results || []).map(parseRow);
}

// The statements that store one row: new content moves the version; same content only refreshes wf_updated.
// before is the D1 row as read (or null). Returns { stmts, row, changed }.
function storeHomeStmts(db, table, row, before, by, action, now) {
  const c = HOME_COLS[table];
  const same = before && contentKey(before.fields, before.is_draft, before.is_archived) === contentKey(row.fields, row.is_draft, row.is_archived) &&
    before.title_admin_id === row.title_admin_id && before.publisher_id === row.publisher_id;
  if (same) {
    const stmts = before.wf_updated === row.wf_updated ? [] : [db.prepare('UPDATE ' + table + ' SET wf_updated=? WHERE id=?').bind(row.wf_updated, row.id)];
    return { stmts, row: { ...before, wf_updated: row.wf_updated }, changed: false };
  }
  const version = before ? before.version + 1 : 1;
  const stored = { ...row, version, updated_at: now, updated_by: by };
  const stmts = [
    db.prepare('INSERT INTO ' + table + ' (id,publisher_id,title_admin_id,print_issue,page,version,fields,created_at,updated_at,updated_by,is_draft,is_archived,wf_updated) ' +
      'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET publisher_id=excluded.publisher_id,title_admin_id=excluded.title_admin_id,' +
      'print_issue=excluded.print_issue,page=excluded.page,version=excluded.version,fields=excluded.fields,updated_at=excluded.updated_at,' +
      'updated_by=excluded.updated_by,is_draft=excluded.is_draft,is_archived=excluded.is_archived,wf_updated=excluded.wf_updated')
      .bind(row.id, row.publisher_id, row.title_admin_id, row.print_issue, row.page, version, JSON.stringify(row.fields), row.created_at, now, by,
        row.is_draft, row.is_archived, row.wf_updated),
    db.prepare('DELETE FROM ' + c.plansTable + ' WHERE ' + c.plansKey + '=?').bind(row.id),
  ];
  if (row.plans.length) stmts.push(db.prepare('INSERT OR IGNORE INTO ' + c.plansTable + ' (' + c.plansKey + ',plan_id) SELECT ?,value FROM json_each(?)')
    .bind(row.id, JSON.stringify(row.plans)));
  stmts.push(changeLogStmt(db, table, row.id, action, before, stored, by, now));
  return { stmts, row: stored, changed: true };
}

function changeLogStmt(db, table, id, action, before, after, by, now) {
  const slim = r => r ? JSON.stringify({ version: r.version, title_admin_id: r.title_admin_id, publisher_id: r.publisher_id, print_issue: r.print_issue,
    page: r.page, is_draft: r.is_draft, is_archived: r.is_archived, plans: r.plans, fields: r.fields }) : null;
  return db.prepare('INSERT INTO change_log (table_name,row_id,action,before_json,after_json,by_member,at) VALUES (?,?,?,?,?,?,?)')
    .bind(table, id, action, slim(before), slim(after), by || null, now);
}

function homeDeleteStmts(db, table, before, by, action, now) {
  const c = HOME_COLS[table];
  return [
    db.prepare('DELETE FROM ' + table + ' WHERE id=?').bind(before.id),
    db.prepare('DELETE FROM ' + c.plansTable + ' WHERE ' + c.plansKey + '=?').bind(before.id),
    changeLogStmt(db, table, before.id, action, before, null, by, now),
  ];
}

// Store one Webflow item (already read) into its home table. Returns the stored row.
async function storeHomeItem(db, cfg, sch, item, by, action) {
  const now = iso();
  const pub = await publisherOfTitle(db, cfg, refValues((item.fieldData || {})[sch.titleSlug])[0]);
  const row = homeRowOf(item, sch, pub);
  const before = (await readHomeRows(db, sch.table, 'WHERE t.id=?', [item.id]))[0] || null;
  const s = storeHomeStmts(db, sch.table, row, before, by, action, now);
  if (s.stmts.length) await db.batch(s.stmts);
  return { row: s.row, changed: s.changed, before };
}

// One item, re-read from Webflow (webhook hint, pending drain).
async function refreshHomeOne(env, db, pacer, cfg, table, iid, trigger, log, by) {
  const h = cfg.home[table], cid = h.collectionId, now = iso();
  try {
    const sch = await homeSchema(pacer, cfg, table, false);
    const r = await pacer.call('/collections/' + cid + '/items/' + iid);
    if (r.status === 404) {
      const before = (await readHomeRows(db, table, 'WHERE t.id=?', [iid]))[0] || null;
      const stmts = [db.prepare('DELETE FROM pending_items WHERE collection_id=? AND item_id=?').bind(cid, iid)];
      if (before) stmts.push(...homeDeleteStmts(db, table, before, by, 'deleted-in-webflow', now));
      await db.batch(stmts);
      if (log) await log(cid, iid, 'removed', before ? table + ': not in Webflow; row removed (change_log keeps it)' : table + ': not in Webflow; no row held');
      return 'removed';
    }
    const item = r.data && r.data.id ? r.data : null;
    if (!item) { if (log) await log(cid, iid, 'error', 'Webflow answered without an item'); return 'error'; }
    const s = await storeHomeItem(db, cfg, sch, item, by, 'follow');
    await db.prepare('DELETE FROM pending_items WHERE collection_id=? AND item_id=?').bind(cid, iid).run();
    if (log) await log(cid, iid, 'stored', table + (s.changed ? ': version ' + s.row.version : ': no change'));
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

// The whole collection from Webflow into its home table (backfill-home, nightly). Rows Webflow no longer holds are
// removed only when the whole list was read; change_log keeps what they held.
async function syncHome(env, cfg, pacer, table, by) {
  const db = needDb(env);
  const sch = await homeSchema(pacer, cfg, table, true);
  const cid = sch.collectionId, now = iso(), tag = 'sync' + (by ? ' · ' + by : '');
  const items = [];
  let total = null;
  for (let offset = 0; ; offset += PAGE) {
    const r = await pacer.call('/collections/' + cid + '/items?limit=' + PAGE + '&offset=' + offset);
    const got = (r.data && r.data.items) || [];
    total = r.data && r.data.pagination ? r.data.pagination.total : null;
    items.push(...got);
    if (got.length < PAGE || (total != null && items.length >= total)) break;
  }
  const have = new Map((await readHomeRows(db, table, '', [])).map(x => [x.id, x]));
  const pubR = await db.prepare('SELECT item_id,publisher_id FROM copy_items WHERE collection_id=?').bind(cfg.s.tenancy.titlesAdmin).all();
  const pubOf = new Map((pubR.results || []).map(x => [x.item_id, x.publisher_id || '']));
  const rep = { ok: true, table, webflowTotal: total, added: 0, changed: 0, unchanged: 0, removed: 0, rowsWithoutTitle: 0, rowsWithoutPublisher: 0,
    notes: sch.notes.slice(), titleField: sch.titleSlug, plansField: sch.plansSlug };
  const stmts = [schemaFactStmt(db, sch)], seen = new Set();
  for (const it of items) {
    seen.add(it.id);
    const row = homeRowOf(it, sch, pubOf.get(refValues((it.fieldData || {})[sch.titleSlug])[0]) || '');
    if (!row.title_admin_id) rep.rowsWithoutTitle++;
    else if (!row.publisher_id) rep.rowsWithoutPublisher++;
    const before = have.get(it.id) || null;
    const s = storeHomeStmts(db, table, row, before, tag, 'follow', now);
    if (!before) rep.added++; else if (s.changed) rep.changed++; else rep.unchanged++;
    stmts.push(...s.stmts);
  }
  if (total != null && seen.size >= total) {
    for (const [id, before] of have) if (!seen.has(id)) { stmts.push(...homeDeleteStmts(db, table, before, tag, 'deleted-in-webflow', now)); rep.removed++; }
  } else rep.notes.push('The list changed while it was read (' + seen.size + ' of ' + total + '), so nothing was removed this time.');
  for (const part of chunk(stmts, 100)) await db.batch(part);
  rep.d1Rows = (await db.prepare('SELECT COUNT(*) AS n FROM ' + table).first()).n;
  rep.matches = total == null ? null : rep.d1Rows === total;
  rep.meta = pacer.meta();
  return rep;
}

// A row as pages see it: real columns named plainly, every field by slug, and each Option field's name.
function shapeHome(r, labels) {
  const names = {};
  for (const [slug, map] of Object.entries(labels || {})) { const v = r.fields[slug]; if (v != null && map[v]) names[slug] = map[v]; }
  return { id: r.id, version: r.version, titleAdminId: r.title_admin_id, publisherId: r.publisher_id, printIssue: r.print_issue, page: r.page,
    removed: !!r.is_archived, draft: !!r.is_draft, plans: r.plans, fields: r.fields, labels: names, updatedAt: r.updated_at, updatedBy: r.updated_by };
}

async function labelsOf(db, table) {
  const f = await db.prepare('SELECT v_json FROM site_facts WHERE k=?').bind('schema:' + table).first();
  return f ? (JSON.parse(f.v_json).labels || {}) : {};
}

// GET /<table>?taId= — this title's rows with versions. D1 only.
async function homeListRoute(request, env, url, table) {
  const gate = await permit(env, request, table + '.read', null);
  if (!gate.ok) { const e = httpErr(gate.status, gate.why); throw e; }
  const taId = url.searchParams.get('taId') || '';
  if (!ID24.test(taId)) throw httpErr(400, 'taId (a TITLES-ADMIN id) is required.');
  const db = needDb(env);
  const binds = [taId];
  let where = 'WHERE t.title_admin_id=?';
  const pi = url.searchParams.get('printIssue');
  if (pi) { where += ' AND t.print_issue=?'; binds.push(pi); }
  if (url.searchParams.get('archived') !== '1') where += ' AND t.is_archived=0';
  const rows = await readHomeRows(db, table, where + ' ORDER BY t.print_issue, t.page, t.created_at', binds);
  const labels = await labelsOf(db, table);
  return { ok: true, table, taId, count: rows.length, rows: rows.map(r => shapeHome(r, labels)), meta: { version: VERSION, source: 'd1' } };
}

// A value for one field, checked against its type. Returns { v } or { err }.
function fieldValue(slug, f, raw) {
  const t = f.type;
  if (t === 'Option') {
    if (raw === '' || raw == null) return { v: null };
    const s = String(raw), norm = x => String(x).trim().toLowerCase().replace(/[\s_]+/g, '-');
    const hit = (f.options || []).find(o => o.id === s || norm(o.name) === norm(s));
    return hit ? { v: hit.id } : { err: slug + ': "' + s + '" is not one of its options (' + (f.options || []).map(o => o.name).join(', ') + ')' };
  }
  if (t === 'Reference') {
    if (raw === '' || raw == null) return { v: null };
    return ID24.test(String(raw)) ? { v: String(raw) } : { err: slug + ': not an item id' };
  }
  if (t === 'MultiReference') {
    if (raw == null || raw === '') return { v: [] };
    if (!Array.isArray(raw) || raw.some(x => !ID24.test(String(x)))) return { err: slug + ': must be a list of item ids' };
    return { v: [...new Set(raw.map(String))] };
  }
  if (t === 'Number') {
    if (raw === '' || raw == null) return { v: null };
    const n = Number(raw); return Number.isFinite(n) ? { v: n } : { err: slug + ': not a number' };
  }
  if (t === 'Switch') return typeof raw === 'boolean' ? { v: raw } : (raw === 'true' || raw === 'false' ? { v: raw === 'true' } : { err: slug + ': must be true or false' });
  if (t === 'Image' || t === 'File') {
    if (raw === '' || raw == null) return { v: null };
    if (typeof raw === 'string') return { v: { url: raw } };
    return raw && typeof raw === 'object' && raw.url ? { v: raw } : { err: slug + ': must be a URL' };
  }
  if (raw == null) return { v: null };
  if (typeof raw === 'object') return { err: slug + ': must be text' };
  return { v: String(raw) };
}

// One op's fields, checked. Plans must belong to the title. The self id is the Worker's; the title is taId.
async function checkFields(db, cfg, sch, taId, fields, planOk) {
  const out = {}, errs = [];
  if (fields == null) return { fd: out, errs };
  if (typeof fields !== 'object' || Array.isArray(fields)) return { fd: out, errs: ['fields must be an object of slug: value'] };
  for (const [slug, raw] of Object.entries(fields)) {
    const f = sch.fields[slug];
    if (!f) { errs.push(slug + ': ' + sch.table + ' has no such field'); continue; }
    if (slug === sch.h.selfIdField) { errs.push(slug + ': written by the Worker, not by a page'); continue; }
    if (slug === sch.titleSlug) { if (raw !== taId) errs.push(slug + ': must be this title (' + taId + ')'); continue; }
    const r = fieldValue(slug, f, raw);
    if (r.err) { errs.push(r.err); continue; }
    if (slug === sch.plansSlug) {
      const bad = [];
      for (const pid of r.v) if (!(await planOk(pid))) bad.push(pid);
      if (bad.length) { errs.push(slug + ': not a plan of this title: ' + bad.join(', ')); continue; }
    }
    out[slug] = r.v;
  }
  return { fd: out, errs };
}

// POST /<table>/batch. Every op is checked before anything is sent. Then ops go to Webflow in order; the first
// Webflow refusal stops the rest (named "not sent"). Written items are published together, then stored in D1.
async function homeBatchRoute(request, env, table) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return { status: 400, body: { ok: false, error: 'The body must be JSON.' } };
  const taId = String(body.taId || '');
  const ops = Array.isArray(body.ops) ? body.ops : null;
  if (!ID24.test(taId)) return { status: 400, body: { ok: false, error: 'taId (a TITLES-ADMIN id) is required.' } };
  if (!ops || !ops.length) return { status: 400, body: { ok: false, error: 'ops must be a list with at least one op.' } };
  if (ops.length > BATCH_MAX) return { status: 400, body: { ok: false, error: 'At most ' + BATCH_MAX + ' ops in one batch; this one has ' + ops.length + '.' } };

  const id = await identify(env, request);
  if (!id.ok) return { status: id.status, body: { ok: false, error: id.why } };
  const who = id.who, by = who.email || who.memberId;
  const db = needDb(env);
  const cfg = await loadConfig(env);
  const h = homeCfg(cfg, table);
  const pacer = new Pacer(env, cfg.s, { burst: true, maxCalls: ops.length * 4 + 10 });
  const sch = await homeSchema(pacer, cfg, table, true);
  const cid = sch.collectionId;

  const pub = await publisherOfTitle(db, cfg, taId);
  if (!pub) return { status: 400, body: { ok: false, error: 'taId is not a TITLES-ADMIN item with a publisher in the copy. Nothing was sent.' } };
  const planMemo = new Map();
  const planOk = async (pid) => {
    if (!planMemo.has(pid)) {
      const r = await db.prepare('SELECT title_admin_id FROM copy_items WHERE collection_id=? AND item_id=?').bind(cfg.s.tenancy.plans, pid).first();
      planMemo.set(pid, !!r && r.title_admin_id === taId);
    }
    return planMemo.get(pid);
  };

  // 1 · CHECK EVERY OP. Nothing is sent unless all pass.
  const results = ops.map((o, i) => ({ i, op: o && o.op, ok: false, id: (o && o.id) || null, sent: false }));
  const plan = [];
  const seenIds = new Set();
  for (let i = 0; i < ops.length; i++) {
    const o = ops[i] || {}, res = results[i], errs = [];
    if (!['create', 'update', 'remove'].includes(o.op)) { res.error = 'op must be create, update or remove'; continue; }
    if (!allowed(who, table + '.' + o.op, null)) { res.error = 'This login may not do that (' + table + '.' + o.op + ').'; continue; }
    if (o.op === 'create') {
      const def = await checkFields(db, cfg, sch, taId, h.createDefaults || {}, planOk);
      if (def.errs.length) { res.error = 'contentHome.home.' + table + '.createDefaults: ' + def.errs.join('; '); continue; }
      const c = await checkFields(db, cfg, sch, taId, o.fields, planOk);
      if (c.errs.length) { res.error = c.errs.join('; '); continue; }
      const fd = { ...def.fd, ...c.fd, [sch.titleSlug]: taId };
      for (const [slug, f] of Object.entries(sch.fields))
        if (f.required && f.editable && slug !== 'slug' && slug !== sch.h.selfIdField && (fd[slug] == null || fd[slug] === '')) errs.push(slug + ' is required');
      if (errs.length) { res.error = errs.join('; '); continue; }
      plan.push({ i, op: 'create', fd });
      continue;
    }
    if (!ID24.test(String(o.id || ''))) { res.error = 'id is required'; continue; }
    if (seenIds.has(o.id)) { res.error = 'this row is named twice in one batch'; continue; }
    seenIds.add(o.id);
    if (!Number.isInteger(o.version)) { res.error = 'version is required (the version this page read)'; continue; }
    let before = (await readHomeRows(db, table, 'WHERE t.id=?', [o.id]))[0] || null;
    if (!before) { res.error = 'not in ' + table + ' (reload the page)'; continue; }
    if (before.title_admin_id !== taId) { res.error = 'this row belongs to another title'; continue; }
    if (before.version !== o.version) { res.error = 'changed since this page read it (now version ' + before.version + '); reload it'; res.stale = true; res.row = shapeHome(before, await labelsOf(db, table)); continue; }
    // Webflow is the master: re-read it, so a change made through Make or the Webflow editor is caught here.
    const wf = await pacer.call('/collections/' + cid + '/items/' + o.id);
    if (wf.status === 404) {
      await db.batch(homeDeleteStmts(db, table, before, 'check · ' + by, 'deleted-in-webflow', iso()));
      res.error = 'no longer in Webflow; it was removed from D1 too'; res.stale = true; continue;
    }
    const fresh = homeRowOf(wf.data, sch, pub);
    if (contentKey(fresh.fields, fresh.is_draft, fresh.is_archived) !== contentKey(before.fields, before.is_draft, before.is_archived)) {
      const s = storeHomeStmts(db, table, fresh, before, 'check · ' + by, 'follow', iso());
      if (s.stmts.length) await db.batch(s.stmts);
      res.error = 'changed in Webflow since this page read it (now version ' + s.row.version + '); reload it'; res.stale = true;
      res.row = shapeHome(s.row, await labelsOf(db, table)); continue;
    }
    if (before.is_archived) { res.error = 'this row is removed; unarchive it in the Webflow editor first'; continue; }
    if (o.op === 'remove') { plan.push({ i, op: 'remove', id: o.id, before }); continue; }
    const c = await checkFields(db, cfg, sch, taId, o.fields, planOk);
    if (c.errs.length) { res.error = c.errs.join('; '); continue; }
    if (!Object.keys(c.fd).length) { res.error = 'no fields to change'; continue; }
    plan.push({ i, op: 'update', id: o.id, fd: c.fd, before });
  }
  if (results.some(r => r.error)) {
    return { status: 409, body: { ok: false, taId, error: 'Nothing was sent: ' + results.filter(r => r.error).length + ' of ' + ops.length + ' ops failed their check.',
      results, meta: { version: VERSION, ...pacer.meta() } } };
  }

  // 2 · SEND, in order. The first Webflow refusal stops the rest.
  const written = [];
  let stopped = null;
  for (const p of plan) {
    const res = results[p.i];
    if (stopped) { res.error = 'not sent: an earlier op failed (' + stopped + ')'; continue; }
    try {
      if (p.op === 'create') {
        res.sent = true;
        const c = await pacer.call('/collections/' + cid + '/items', { method: 'POST', body: { isDraft: false, isArchived: false, fieldData: p.fd } });
        const newId = c.data && c.data.id;
        if (!newId) throw httpErr(502, 'Webflow created nothing (no id came back).');
        res.id = newId;
        const s = await pacer.call('/collections/' + cid + '/items/' + newId, { method: 'PATCH', body: { fieldData: { [sch.h.selfIdField]: newId } } });
        written.push({ p, item: s.data && s.data.id ? s.data : c.data, publish: true });
      } else if (p.op === 'update') {
        res.sent = true;
        const u = await pacer.call('/collections/' + cid + '/items/' + p.id, { method: 'PATCH', body: { fieldData: p.fd } });
        written.push({ p, item: u.data, publish: true });
      } else {
        res.sent = true;
        const u = await pacer.call('/collections/' + cid + '/items/' + p.id, { method: 'PATCH', body: { isArchived: true } });
        let offLive = true;
        try { await pacer.call('/collections/' + cid + '/items/' + p.id + '/live', { method: 'DELETE' }); }
        catch (e) { offLive = false; res.note = 'Archived, but Webflow did not take it off the live site: ' + e.message; }
        written.push({ p, item: u.data, publish: false, offLive });
      }
    } catch (e) {
      res.error = (e && e.unsure) ? 'Webflow gave no clear answer; this op may or may not have landed. Reload before trying again. (' + e.message + ')' : e.message;
      stopped = 'op ' + p.i;
    }
  }

  // 3 · PUBLISH what was created or changed, in one call.
  const toPublish = written.filter(w => w.publish && w.item && w.item.id).map(w => w.item.id);
  let published = { asked: toPublish.length, done: 0, error: null };
  if (toPublish.length) {
    try {
      const r = await pacer.call('/collections/' + cid + '/items/publish', { method: 'POST', body: { itemIds: toPublish } });
      const ids = (r.data && r.data.publishedItemIds) || [];
      published.done = ids.length;
      const errs = (r.data && r.data.errors) || [];
      if (errs.length) published.error = JSON.stringify(errs).slice(0, 300);
      written.forEach(w => { if (w.publish && w.item && w.item.id && !ids.includes(w.item.id)) w.unpublished = true; });
    } catch (e) {
      published.error = e.message;
      written.forEach(w => { if (w.publish) w.unpublished = true; });
    }
  }

  // 4 · STORE what Webflow answered, and answer with the rows as stored.
  const labelsFresh = {};
  for (const [slug, f] of Object.entries(sch.fields)) if (f.options) labelsFresh[slug] = Object.fromEntries(f.options.map(o => [o.id, o.name]));
  await db.batch([schemaFactStmt(db, sch)]);
  for (const w of written) {
    const res = results[w.p.i];
    if (!w.item || !w.item.id) { res.error = 'Webflow answered without the item'; continue; }
    const s = await storeHomeItem(db, cfg, sch, w.item, by, w.p.op);
    res.row = shapeHome(s.row, labelsFresh);
    res.id = w.item.id;
    if (w.unpublished) res.error = 'saved in Webflow but not published' + (published.error ? ' (' + published.error + ')' : '');
    else if (w.p.op === 'remove' && !w.offLive) res.error = res.note;
    else res.ok = true;
  }
  const allOk = results.every(r => r.ok);
  return { status: allOk ? 200 : 207, body: { ok: allOk, taId, results, published, meta: { version: VERSION, by, source: 'webflow, then d1', ...pacer.meta() } } };
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
  const home = {};                                                                     // v1.1.0
  for (const t of HOME_TABLES) {
    try {
      const r = await db.prepare("SELECT COUNT(*) AS n, SUM(is_archived) AS removed, SUM(publisher_id='') AS noPublisher, SUM(title_admin_id='') AS noTitle, " +
        'MAX(updated_at) AS lastChange FROM ' + t).first();
      const c = await db.prepare('SELECT COUNT(*) AS n, MAX(at) AS last FROM change_log WHERE table_name=?').bind(t).first();
      home[t] = { rows: r.n, removed: r.removed || 0, rowsWithoutTitle: r.noTitle || 0, rowsWithoutPublisher: r.noPublisher || 0,
        lastChange: r.lastChange, changeLog: { entries: c.n, last: c.last } };
    } catch (e) { home[t] = { error: e.message }; }
  }
  const out = {
    ok: true, version: VERSION, at: iso(),
    home,
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
      const missingColumns = [];                                                     // v1.1.0
      for (const [t, cols] of Object.entries(SCHEMA_COLUMNS)) {
        if (!have.has(t)) continue;
        const c = await env.IX_DB.prepare('SELECT name FROM pragma_table_info(?)').bind(t).all();
        const hc = new Set((c.results || []).map(x => x.name));
        cols.forEach(k => { if (!hc.has(k)) missingColumns.push(t + '.' + k); });
      }
      out.schema = missing.length || missingColumns.length ? { ok: false, missing, missingColumns } : { ok: true, tables: SCHEMA_TABLES.length };
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
