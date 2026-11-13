// ix-content-v1.2.2.js
// INBXIFY · Cloudflare Worker · ix-content
//
// v1.2.2 (13 Nov 2026, Content Home S8, Test 2) — A PUBLISH WEBFLOW DID NOT ANSWER IS TRIED AGAIN.
//   Found live on WLN-910A (Revenue Picker v1.9.0): a Lead banner change was written to Webflow and stored in D1, but
//   Webflow answered 504 to POST /collections/<NL-BLOCKS>/items/publish, so the reply said "saved in Webflow but not
//   published" and the page showed the change as not saved. The Pacer never resends a write after a 5xx, because a
//   create or update may have landed. A publish is different: sending it again only makes the live copy match the
//   saved one. Now every publish (batch, hydrate, refresh, clone) goes through publishItems(): a 5xx, a 429 or no
//   answer is tried again, up to 3 tries, 3 s then 8 s apart. Only when all 3 fail does the reply say "not
//   published", naming "(tried 3 times)". A refusal Webflow read (a 4xx) is not tried again. Nothing else changed:
//   no route, schema, KV key, permission or reply shape. HARDCODING: HC-P-CH8-1 the 3 tries and the 3 s / 8 s waits.
//
// v1.2.1 (10 Nov 2026, Content Home S5, Test 1) — A SENT ISSUE IS NAMED AS SENT IN THE REPLY.
//   Found live: a batch on sent WLN-123A was refused correctly (409, "WLN-123A has been sent. It cannot be changed.",
//   ix-issue-data v1.0.171+), but the reply said released:false, hold:false and carried no flag for "sent", because the
//   release gate copied only released and hold from ix-issue-data's 409. A page reading the flags could not tell a sent
//   issue from any other refusal. Now the gate also copies ix-issue-data's sent:true, and every reply that carries
//   released and hold also carries issueSent (top level, and on each result of a refused batch).
//   Why issueSent and not sent: results[].sent already means "this op went to Webflow", and a refused op has sent:false.
//   Two meanings under one name would mislead the page.
//   Routes touched: POST /nl-blocks/batch and POST /nl-blocks/hydrate (refresh). Nothing else changed: no route, schema,
//   KV or binding change.
//   HARDCODING (provisional): HC-P-CH5-1 the reply field name issueSent.
//
// v1.2.0 header follows.
//
// INBXIFY · Cloudflare Worker · ix-content
// The home of working data (D1) and the keeper of a full, current copy of every Webflow collection
// that stays in Webflow. Content Home phase 1, phase 2 (ALLOCATIONS, v1.1.x) and phase 2 (NL-BLOCKS, v1.2.0).
//
// v1.2.0 (9 Nov 2026, Content Home S4 · NL-BLOCKS home, Worker side) — NL-BLOCKS BECOMES A HOME TABLE.
//   Same rules as ALLOCATIONS (v1.1.0/v1.1.1): make before break, Webflow is the master, the Worker writes Webflow
//   first, publishes, and stores what Webflow answered in D1; a new row takes Webflow's id; every row carries a
//   version; a save against an older version is refused; the save route re-reads Webflow before every update or
//   delete, so a write made through Make (124, 122, 127, 126, still live until the pages move) is always caught.
//   Rulings this session (Jeff, 9 Nov): (1) a Layout Remove TRULY DELETES the NL-BLOCKS row (live, then staged), as
//   124's delete op does; change_log keeps the whole row. (2) /nl-blocks/hydrate and /nl-blocks/clone take over the
//   WHOLE of Scenario 126: the PUBLICATION PLAN, the NEWSLETTER and the rows, in one call; what a call made is
//   deleted again if a later step fails, so the result is all or nothing in effect.
//
//   WHAT MOVES HERE (from the live blueprints, read 9 Nov)
//   · 124 create                                  → POST /nl-blocks/batch  op create
//   · 124 update, reorder, fill, clear, layout, flag → POST /nl-blocks/batch  op update (field writes)
//   · 124 delete (Layout Remove)                  → POST /nl-blocks/batch  op delete
//   · 124 clone, 126 Add / Clone / Refresh        → POST /nl-blocks/hydrate (add, refresh), POST /nl-blocks/clone
//   · 122 block-save (greeting row)               → create or update
//   · 127 level block (design-json)               → update
//   Stay where they are: 124 nlmeta and splash (NEWSLETTERS), 124 article-section (ARTICLES), 127 title, franchise,
//   issue and theme-save. 124's typed option ids (Sponsored true/false, stage Planning) and 122's (greeting block
//   type, stage) are gone: options are written by name, read from the NL-BLOCKS schema.
//
//   TENANCY THROUGH THE PLAN. NL-BLOCKS has no title field: its publication-plan (found from the schema as the one
//   Reference to PUBLICATION PLANS) gives the title through the plan's row in the copy, and the title gives the
//   publisher. A row whose plan is not on the page's title is refused. The plan may be set on create and never changed.
//
//   THE RELEASE LOCK STAYS IN ONE PLACE. Before anything is sent, each plan a batch touches is checked with
//   ix-issue-data POST /release-check (the same call 124 makes), once per op kind the batch holds (create, fill,
//   clear, other), so the released-plan lock and the Reserved Tiles hold refusals keep one rule set. A 409 refuses
//   the whole batch and names the reason; a 503 (Webflow busy, checked:false) lets the batch through, as 124 does,
//   and the reply's meta says so. ix-issue-data is reached through the ISSUE_DATA service binding (else
//   settings.issueDataUrl) with the X-IX-Key header from the ISSUE_DATA_KEY secret (ix-issue-data v1.0.170 accepts
//   it as its service key).
//
//   NEW ROUTES (staff; see the route list below for bodies)
//   GET  /nl-blocks?taId=&planId=     this plan's rows with versions, position order. &archived=1 includes archived rows.
//   POST /nl-blocks/batch             { taId, ops:[ create | update | delete ] }, at most BATCH_MAX ops.
//   POST /nl-blocks/hydrate           Add (plan + NEWSLETTER + Default Layout rows) or Refresh (op:"refresh": the plan's
//                                     rows replaced by the Default Layout; new rows first, old rows deleted after).
//   POST /nl-blocks/clone             Plan + NEWSLETTER + the source issue's rows from ix-issue-data /clone-rows.
//   POST /admin/backfill-home?table=nl_blocks
//
//   KV contentHome.home.nl_blocks (new): { collectionId, selfIdField, positionField, blockTypeField, createDefaults,
//   hydrate: { newsletterCollectionId, nlBaseUrl, planStatusOnCreate, nlStatusOnCreate, planFields{...}, nlFields{...},
//   taFields{...} } }. Field slugs live there, not in code. See the KV KEYS section.
//
//   SCHEMA v1.2.0: nl_blocks gains is_draft, is_archived, wf_updated (one line in the D1 Console; see the schema file).
//
//   HARDCODING (provisional, for the tracker): HC-P-CH4-1 the nl_blocks column list and op names (HOME_COLS, code);
//   HC-P-CH4-2 delete order live then staged; HC-P-CH4-3 the release-check op kinds (create, fill, clear, other) and
//   fail-open on 503; HC-P-CH4-4 the NEWSLETTER slug pattern YY-MMDD<issueLabel>-<title slug> (as 126 v2.14 built it);
//   HC-P-CH4-5 the hydrate body field names, kept the same as 126's webhook so the Pub Plans page swaps 1:1;
//   HC-P-CH4-6 ISSUE_DATA binding name and ISSUE_DATA_KEY secret name.
//
// v1.1.1 header follows.
//
// The home of working data (D1) and the keeper of a full, current copy of every Webflow collection
// that stays in Webflow. Content Home phase 1 (Content-Home-Scoping-v0_2, rulings 1 to 9) and phase 2, first part.
//
// v1.1.1 (9 Nov 2026, Content Home S3, test 2) — A SAVE AND ITS OWN WEBHOOK NO LONGER RACE.
//   Found live: Webflow fires a webhook for a row within a second of this Worker's own PATCH. The webhook's re-read and
//   the save both stored the row, whichever came first. Entry 152: the save stored first and the webhook logged a
//   second copy at the same version. Entry 154: the webhook stored first, so Jeff's unhide was logged as
//   "follow · webhook" and the save then found nothing to log. Data and versions were right; the change log's who was
//   wrong. Two fixes, both needed:
//   · SETTLE. A webhook hint for a home table waits contentHome.settings.webhooks.homeSettleMs (default 20 s) before
//     its re-read, so the save that caused it has stored the row first and the re-read finds no change. Changes made
//     elsewhere (Make, the Webflow editor) are still caught, 20 s later.
//   · ONE WRITER WINS, CLEANLY. Storing a changed row is now conditional on the version it started from; its plans and
//     its change_log entry are written only if that store won. A store that lost re-reads D1 and tries again (3 times),
//     so two stores at once can never both write the same version or both log.
//   No route, schema or KV change. HC-P-CH3-4: homeSettleMs default 20000 (DEFAULTS.webhooks; KV overrides).
//
// v1.1.0 header follows.
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

const VERSION = '1.2.2';
const WF = 'https://api.webflow.com/v2';                         // HC-P-CH1-8
const PAGE = 100;                                                // HC-P-CH1-8 · Webflow lists at most 100 a request
const KV_KEYS = {                                                // HC-P-CH1-7
  copy: 'contentHome.copy',
  events: 'contentHome.events',
  reads: 'contentHome.reads',
  settings: 'contentHome.settings',
  home: 'contentHome.home',                                      // v1.1.0
};
const HOME_TABLES = ['allocations', 'nl_blocks'];                // HC-P-CH3-1, HC-P-CH4-1
const BATCH_MAX = 50;                                            // HC-P-CH3-2
const DEFAULTS = {                                               // HC-P-CH1-10 · only where settings leave a value out
  allowedOrigins: ['https://www.inbxify.com', 'https://inbxify.com'],
  caps: { items: 20000, collections: 40 },
  pace: { perMinute: 100, maxRetries: 4, retryAfterCapMs: 65000, lowWater: 5, lowWaterPauseMs: 3000 },
  runs: { maxCalls: 800, maxQueries: 800, adminBudgetMs: 90000, cronBudgetMs: 600000, resumeWithinHours: 24, busyIfBeatWithinMs: 120000 },
  webhooks: { autoRegister: true, dedupeMs: 5000, logDays: 30, drainPerHint: 3, maxHintsPerCall: 50, homeSettleMs: 20000 },   // homeSettleMs v1.1.1, HC-P-CH3-4
  burst: { retryAfterCapMs: 20000, maxRetries: 2 },              // HC-P-CH3-3 · page saves
};
const SCHEMA_TABLES = ['copy_items', 'copy_title_links', 'nl_blocks', 'allocations', 'allocation_plans', 'change_log',
  'collections', 'sync_runs', 'pending_items', 'webhook_log', 'site_facts'];
const SCHEMA_COLUMNS = { allocations: ['is_draft', 'is_archived', 'wf_updated'], nl_blocks: ['is_draft', 'is_archived', 'wf_updated'] };   // schema v1.1.0, v1.2.0
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
      if (p === '/nl-blocks' && m === 'GET') return json(await homeListRoute(request, env, url, 'nl_blocks'), 200, cors);   // v1.2.0
      if ((p === '/allocations/batch' || p === '/nl-blocks/batch') && m === 'POST') {
        if (origin && !allowed.includes(origin)) return json({ ok: false, error: 'This origin may not call ix-content.' }, 403, cors);
        const out = await homeBatchRoute(request, env, p === '/nl-blocks/batch' ? 'nl_blocks' : 'allocations');
        return json(out.body, out.status, cors);
      }
      if ((p === '/nl-blocks/hydrate' || p === '/nl-blocks/clone') && m === 'POST') {                          // v1.2.0
        if (origin && !allowed.includes(origin)) return json({ ok: false, error: 'This origin may not call ix-content.' }, 403, cors);
        const out = await hydrateRoute(request, env, p === '/nl-blocks/clone' ? 'clone' : 'hydrate');
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
      return json({ ok: false, error: 'Unknown route. See the v1.2.0 header.' }, 404, cors);
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
  'nl_blocks.read': (who /*, row */) => who.staff,               // v1.2.0
  'nl_blocks.create': (who /*, row */) => who.staff,
  'nl_blocks.update': (who /*, row */) => who.staff,
  'nl_blocks.delete': (who /*, row */) => who.staff,
  'nl_blocks.hydrate': (who /*, row */) => who.staff,            // Add, Refresh, Clone: writes PUBLICATION PLANS and NEWSLETTERS too
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
  for (const k of HOME_COLS[table].cfgKeys) if (!h[k]) throw httpErr(500, KV_KEYS.home + '.' + table + '.' + k + ' is missing.');   // v1.2.0: per table
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
      // v1.1.1 · settle first: the save that caused this hint stores the row before the re-read looks.
      const settle = Math.max(0, Number(cfg.s.webhooks.homeSettleMs) || 0);
      work.push(sleep(settle).then(() => coalesced(cfg, cid, h.itemId, () => refreshHomeOne(env, db, pacer, cfg, homeT, h.itemId, trigger, log, 'webhook')))
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

// The one place a home table's own columns are named (HC-P-CH3-1, HC-P-CH4-1).
//   cfgKeys   the KV keys contentHome.home.<table> must hold (field slugs that become real columns)
//   cols      the table's own real columns beyond the shared ones (id, publisher_id, title_admin_id, version, fields, ...)
//   tenancy   'title' = the row names its title directly; 'plan' = the row names a plan, and the plan gives the title
//   ops       the batch ops the table takes; removeOp = the op that takes a row off (archive for allocations, true delete for nl_blocks)
//   plansTable/plansKey  the link table of a MultiReference to plans (allocations only)
const HOME_COLS = {
  allocations: { cfgKeys: ['selfIdField', 'pageField', 'printIssueField'], cols: ['print_issue', 'page'], tenancy: 'title',
    ops: ['create', 'update', 'remove'], removeOp: 'remove', plansTable: 'allocation_plans', plansKey: 'allocation_id',
    order: 't.print_issue, t.page, t.created_at' },
  nl_blocks: { cfgKeys: ['selfIdField', 'positionField', 'blockTypeField'], cols: ['plan_id', 'position', 'block_type'], tenancy: 'plan',
    ops: ['create', 'update', 'delete'], removeOp: 'delete', plansTable: null, plansKey: null,
    order: 't.position, t.created_at' },
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
  const hc = HOME_COLS[table];
  if (hc.tenancy === 'title' && !ten.titleAdmin) throw httpErr(500, table + ': no single field points at TITLES-ADMIN (' + ten.notes.join('; ') + '). Name it in ' + KV_KEYS.home + '.' + table + '.tenancy.titleAdmin.');
  if (hc.tenancy === 'plan' && !(ten.plan && !ten.plan.multi)) throw httpErr(500, table + ': no single Reference field points at PUBLICATION PLANS (' + ten.notes.join('; ') + '). Name it in ' + KV_KEYS.home + '.' + table + '.tenancy.plan.');
  for (const k of hc.cfgKeys)
    if (!fields[h[k]]) throw httpErr(500, KV_KEYS.home + '.' + table + '.' + k + ' names "' + h[k] + '", which ' + table + ' does not have.');
  const sch = { table, collectionId: h.collectionId, fields, titleSlug: ten.titleAdmin ? ten.titleAdmin.slug : null,
    planSlug: ten.plan && !ten.plan.multi ? ten.plan.slug : null,                      // v1.2.0: single Reference to a plan (nl_blocks)
    plansSlug: ten.plan && ten.plan.multi ? ten.plan.slug : null, notes: ten.notes, h, hc };
  SCHEMA_MEMO.set(h.collectionId, { at: Date.now(), sch });
  return sch;
}

// Option labels kept in D1 so the read route answers names without calling Webflow.
function schemaFactStmt(db, sch) {
  const labels = {};
  for (const [slug, f] of Object.entries(sch.fields)) if (f.options) labels[slug] = Object.fromEntries(f.options.map(o => [o.id, o.name]));
  return db.prepare('INSERT OR REPLACE INTO site_facts (k,v_json,at) VALUES (?,?,?)')
    .bind('schema:' + sch.table, JSON.stringify({ titleSlug: sch.titleSlug, planSlug: sch.planSlug, plansSlug: sch.plansSlug, labels }), iso());
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

// v1.2.0 · The title a plan belongs to, from the copy of PUBLICATION PLANS.
async function titleOfPlan(db, cfg, planId) {
  if (!planId) return '';
  const r = await db.prepare('SELECT title_admin_id FROM copy_items WHERE collection_id=? AND item_id=?').bind(cfg.s.tenancy.plans, planId).first();
  return (r && r.title_admin_id) || '';
}

// v1.2.0 · { title, publisher } for one Webflow item of a home table: the title named on the row (allocations), or the
// title of the plan named on the row (nl_blocks); the publisher from the title's row in the copy.
async function tenancyOfItem(db, cfg, sch, item) {
  const fd = (item && item.fieldData) || {};
  let title = '';
  if (sch.hc.tenancy === 'title') title = refValues(fd[sch.titleSlug])[0] || '';
  else title = await titleOfPlan(db, cfg, refValues(fd[sch.planSlug])[0] || '');
  return { title, publisher: await publisherOfTitle(db, cfg, title) };
}

// Sorted-key JSON, so two reads of the same item compare equal whatever order Webflow lists the fields in.
function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
function contentKey(fields, draft, archived) { return canon(fields || {}) + '|' + (draft ? 1 : 0) + '|' + (archived ? 1 : 0); }

// A Webflow item as a home row (no version yet). ten = { title, publisher } from tenancyOfItem (v1.2.0).
function homeRowOf(item, sch, ten) {
  const fd = item.fieldData || {}, h = sch.h;
  const row = {
    id: item.id, publisher_id: (ten && ten.publisher) || '', title_admin_id: (ten && ten.title) || '',
    is_draft: item.isDraft ? 1 : 0, is_archived: item.isArchived ? 1 : 0, wf_updated: nn(item.lastUpdated),
    created_at: item.createdOn || iso(), fields: fd, plans: sch.plansSlug ? refValues(fd[sch.plansSlug]) : [],
  };
  if (sch.table === 'allocations') {
    const pageN = Number(fd[h.pageField]);
    row.print_issue = nn(fd[h.printIssueField]);
    row.page = Number.isFinite(pageN) && fd[h.pageField] !== '' && fd[h.pageField] != null ? Math.trunc(pageN) : null;
  } else if (sch.table === 'nl_blocks') {                                              // v1.2.0
    const posN = Number(fd[h.positionField]);
    row.plan_id = refValues(fd[sch.planSlug])[0] || '';
    row.position = Number.isFinite(posN) && fd[h.positionField] !== '' && fd[h.positionField] != null ? Math.trunc(posN) : null;
    row.block_type = nn(fd[h.blockTypeField]);
  }
  return row;
}
// The table's own columns as a list of values, in HOME_COLS[table].cols order (v1.2.0).
function extraVals(table, row) { return HOME_COLS[table].cols.map(c => row[c] === undefined ? null : row[c]); }

function parseRow(r) {
  if (!r) return null;
  return { ...r, fields: r.fields ? JSON.parse(r.fields) : {}, plans: r.plans ? String(r.plans).split(',').filter(Boolean) : [] };
}

async function readHomeRows(db, table, where, binds) {
  const c = HOME_COLS[table];
  const plansSel = c.plansTable ? '(SELECT GROUP_CONCAT(plan_id) FROM ' + c.plansTable + ' p WHERE p.' + c.plansKey + '=t.id)' : 'NULL';   // v1.2.0
  const sql = 'SELECT t.*, ' + plansSel + ' AS plans FROM ' + table + ' t ' + where;
  const r = await db.prepare(sql).bind(...binds).all();
  return (r.results || []).map(parseRow);
}

// The statements that store one row: new content moves the version; same content only refreshes wf_updated.
// before is the D1 row as read (or null). Returns { stmts, row, changed, stamp }.
// v1.1.1 · CONDITIONAL. A changed row is written only if D1 still holds the version it started from (or, for a new row,
// no row yet). Its plans and its change_log entry are written only if that write won, found by its stamp
// (version + updated_at + updated_by). storeHomeItem checks the stamp afterwards and tries again if it lost.
function storeHomeStmts(db, table, row, before, by, action, now) {
  const c = HOME_COLS[table];
  const same = before && contentKey(before.fields, before.is_draft, before.is_archived) === contentKey(row.fields, row.is_draft, row.is_archived) &&
    before.title_admin_id === row.title_admin_id && before.publisher_id === row.publisher_id &&
    canon(extraVals(table, before)) === canon(extraVals(table, row));                   // v1.2.0: the table's own columns too
  if (same) {
    const stmts = before.wf_updated === row.wf_updated ? [] : [db.prepare('UPDATE ' + table + ' SET wf_updated=? WHERE id=?').bind(row.wf_updated, row.id)];
    return { stmts, row: { ...before, wf_updated: row.wf_updated }, changed: false, stamp: null };
  }
  const version = before ? before.version + 1 : 1;
  const stored = { ...row, version, updated_at: now, updated_by: by };
  const won = 'EXISTS (SELECT 1 FROM ' + table + ' WHERE id=? AND version=? AND updated_at=? AND updated_by IS ?)';
  const wonB = [row.id, version, now, by];
  const stmts = [];
  const cols = c.cols, ex = extraVals(table, row);                                      // v1.2.0: columns from HOME_COLS
  if (before) {
    stmts.push(db.prepare('UPDATE ' + table + ' SET publisher_id=?,title_admin_id=?,' + cols.map(k => k + '=?').join(',') + ',version=?,fields=?,updated_at=?,updated_by=?,' +
      'is_draft=?,is_archived=?,wf_updated=? WHERE id=? AND version=?')
      .bind(row.publisher_id, row.title_admin_id, ...ex, version, JSON.stringify(row.fields), now, by,
        row.is_draft, row.is_archived, row.wf_updated, row.id, before.version));
  } else {
    stmts.push(db.prepare('INSERT INTO ' + table + ' (id,publisher_id,title_admin_id,' + cols.join(',') + ',version,fields,created_at,updated_at,updated_by,is_draft,is_archived,wf_updated) ' +
      'VALUES (?,?,?,' + cols.map(() => '?').join(',') + ',?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING')
      .bind(row.id, row.publisher_id, row.title_admin_id, ...ex, version, JSON.stringify(row.fields), row.created_at, now, by,
        row.is_draft, row.is_archived, row.wf_updated));
  }
  if (c.plansTable) {
    stmts.push(db.prepare('DELETE FROM ' + c.plansTable + ' WHERE ' + c.plansKey + '=? AND ' + won).bind(row.id, ...wonB));
    if (row.plans.length) stmts.push(db.prepare('INSERT OR IGNORE INTO ' + c.plansTable + ' (' + c.plansKey + ',plan_id) SELECT ?,value FROM json_each(?) WHERE ' + won)
      .bind(row.id, JSON.stringify(row.plans), ...wonB));
  }
  stmts.push(changeLogStmt(db, table, row.id, action, before, stored, by, now, { won, wonB }));
  return { stmts, row: stored, changed: true, stamp: { version, now, by } };
}

function changeLogStmt(db, table, id, action, before, after, by, now, guard) {
  const slim = r => {
    if (!r) return null;
    const o = { version: r.version, title_admin_id: r.title_admin_id, publisher_id: r.publisher_id, is_draft: r.is_draft, is_archived: r.is_archived, plans: r.plans, fields: r.fields };
    for (const k of HOME_COLS[table].cols) o[k] = r[k] === undefined ? null : r[k];      // v1.2.0: the table's own columns
    return JSON.stringify(o);
  };
  if (guard) return db.prepare('INSERT INTO change_log (table_name,row_id,action,before_json,after_json,by_member,at) SELECT ?,?,?,?,?,?,? WHERE ' + guard.won)
    .bind(table, id, action, slim(before), slim(after), by || null, now, ...guard.wonB);
  return db.prepare('INSERT INTO change_log (table_name,row_id,action,before_json,after_json,by_member,at) VALUES (?,?,?,?,?,?,?)')
    .bind(table, id, action, slim(before), slim(after), by || null, now);
}

// v1.1.1 · did this store win? (the row carries its stamp)
async function storeWon(db, table, id, stamp) {
  const r = await db.prepare('SELECT version,updated_at,updated_by FROM ' + table + ' WHERE id=?').bind(id).first();
  return !!r && r.version === stamp.version && r.updated_at === stamp.now && r.updated_by === stamp.by;
}

function homeDeleteStmts(db, table, before, by, action, now) {
  const c = HOME_COLS[table];
  const out = [db.prepare('DELETE FROM ' + table + ' WHERE id=?').bind(before.id)];
  if (c.plansTable) out.push(db.prepare('DELETE FROM ' + c.plansTable + ' WHERE ' + c.plansKey + '=?').bind(before.id));
  out.push(changeLogStmt(db, table, before.id, action, before, null, by, now));
  return out;
}

// Store one Webflow item (already read) into its home table. Returns the stored row.
// v1.1.1 · a store that lost to another store at the same moment re-reads D1 and tries again.
async function storeHomeItem(db, cfg, sch, item, by, action) {
  const ten = await tenancyOfItem(db, cfg, sch, item);                                 // v1.2.0
  const row = homeRowOf(item, sch, ten);
  for (let attempt = 0; attempt < 3; attempt++) {
    const now = iso();
    const before = (await readHomeRows(db, sch.table, 'WHERE t.id=?', [item.id]))[0] || null;
    const s = storeHomeStmts(db, sch.table, row, before, by, action, now);
    if (s.stmts.length) await db.batch(s.stmts);
    if (!s.changed || await storeWon(db, sch.table, item.id, s.stamp)) return { row: s.row, changed: s.changed, before };
  }
  const now = (await readHomeRows(db, sch.table, 'WHERE t.id=?', [item.id]))[0] || null;
  return { row: now || homeRowOf(item, sch, ten), changed: false, before: now, lostRace: true };
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
  const planR = sch.hc.tenancy === 'plan' ? await db.prepare('SELECT item_id,title_admin_id FROM copy_items WHERE collection_id=?').bind(cfg.s.tenancy.plans).all() : { results: [] };
  const titleOfPlanMap = new Map((planR.results || []).map(x => [x.item_id, x.title_admin_id || '']));   // v1.2.0
  const rep = { ok: true, table, webflowTotal: total, added: 0, changed: 0, unchanged: 0, removed: 0, rowsWithoutTitle: 0, rowsWithoutPublisher: 0,
    notes: sch.notes.slice(), titleField: sch.titleSlug, planField: sch.planSlug, plansField: sch.plansSlug };
  const stmts = [schemaFactStmt(db, sch)], seen = new Set();
  for (const it of items) {
    seen.add(it.id);
    const fdi = it.fieldData || {};
    const title = sch.hc.tenancy === 'title' ? (refValues(fdi[sch.titleSlug])[0] || '') : (titleOfPlanMap.get(refValues(fdi[sch.planSlug])[0] || '') || '');
    const row = homeRowOf(it, sch, { title, publisher: pubOf.get(title) || '' });     // v1.2.0
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
  const out = { id: r.id, version: r.version, titleAdminId: r.title_admin_id, publisherId: r.publisher_id,
    removed: !!r.is_archived, draft: !!r.is_draft, plans: r.plans, fields: r.fields, labels: names, updatedAt: r.updated_at, updatedBy: r.updated_by };
  if (r.print_issue !== undefined) out.printIssue = r.print_issue;                        // allocations
  if (r.page !== undefined) out.page = r.page;
  if (r.plan_id !== undefined) { out.planId = r.plan_id; out.position = r.position; out.blockType = r.block_type; }   // v1.2.0 nl_blocks
  return out;
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
  if (table === 'allocations' && pi) { where += ' AND t.print_issue=?'; binds.push(pi); }
  const planId = url.searchParams.get('planId') || '';                                   // v1.2.0 nl_blocks
  if (table === 'nl_blocks') {
    if (planId && !ID24.test(planId)) throw httpErr(400, 'planId must be a PUBLICATION PLANS id.');
    if (planId) { where += ' AND t.plan_id=?'; binds.push(planId); }
  }
  if (url.searchParams.get('archived') !== '1') where += ' AND t.is_archived=0';
  const rows = await readHomeRows(db, table, where + ' ORDER BY ' + HOME_COLS[table].order, binds);
  const labels = await labelsOf(db, table);
  return { ok: true, table, taId, planId: planId || undefined, count: rows.length, rows: rows.map(r => shapeHome(r, labels)), meta: { version: VERSION, source: 'd1' } };
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
// v1.2.0 · lockPlan (nl_blocks update): the row's plan may not change. A single plan Reference must be a plan of taId.
async function checkFields(db, cfg, sch, taId, fields, planOk, lockPlan) {
  const out = {}, errs = [];
  if (fields == null) return { fd: out, errs };
  if (typeof fields !== 'object' || Array.isArray(fields)) return { fd: out, errs: ['fields must be an object of slug: value'] };
  for (const [slug, raw] of Object.entries(fields)) {
    const f = sch.fields[slug];
    if (!f) { errs.push(slug + ': ' + sch.table + ' has no such field'); continue; }
    if (slug === sch.h.selfIdField) { errs.push(slug + ': written by the Worker, not by a page'); continue; }
    if (sch.titleSlug && slug === sch.titleSlug) { if (raw !== taId) errs.push(slug + ': must be this title (' + taId + ')'); continue; }
    const r = fieldValue(slug, f, raw);
    if (r.err) { errs.push(r.err); continue; }
    if (sch.planSlug && slug === sch.planSlug) {
      if (lockPlan) { if (r.v !== lockPlan) errs.push(slug + ': the plan of a row cannot be changed'); continue; }
      if (!r.v) { errs.push(slug + ': a plan is required'); continue; }
      if (!(await planOk(r.v))) { errs.push(slug + ': not a plan of this title: ' + r.v); continue; }
    }
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
  const hc = HOME_COLS[table];
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
    if (!hc.ops.includes(o.op)) { res.error = 'op must be ' + hc.ops.join(', '); continue; }
    if (!allowed(who, table + '.' + o.op, null)) { res.error = 'This login may not do that (' + table + '.' + o.op + ').'; continue; }
    if (o.op === 'create') {
      const def = await checkFields(db, cfg, sch, taId, h.createDefaults || {}, planOk);
      if (def.errs.length) { res.error = 'contentHome.home.' + table + '.createDefaults: ' + def.errs.join('; '); continue; }
      const c = await checkFields(db, cfg, sch, taId, o.fields, planOk);
      if (c.errs.length) { res.error = c.errs.join('; '); continue; }
      const fd = { ...def.fd, ...c.fd };
      if (sch.titleSlug) fd[sch.titleSlug] = taId;
      if (sch.planSlug && !fd[sch.planSlug]) errs.push(sch.planSlug + ' is required (the plan this row belongs to)');   // v1.2.0
      for (const [slug, f] of Object.entries(sch.fields))
        if (f.required && f.editable && slug !== 'slug' && slug !== sch.h.selfIdField && (fd[slug] == null || fd[slug] === '')) errs.push(slug + ' is required');
      if (errs.length) { res.error = errs.join('; '); continue; }
      plan.push({ i, op: 'create', fd, planId: sch.planSlug ? fd[sch.planSlug] : null });
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
    const fresh = homeRowOf(wf.data, sch, await tenancyOfItem(db, cfg, sch, wf.data));   // v1.2.0
    if (contentKey(fresh.fields, fresh.is_draft, fresh.is_archived) !== contentKey(before.fields, before.is_draft, before.is_archived)) {
      const s = await storeHomeItem(db, cfg, sch, wf.data, 'check · ' + by, 'follow');   // v1.1.1: conditional store
      res.error = 'changed in Webflow since this page read it (now version ' + s.row.version + '); reload it'; res.stale = true;
      res.row = shapeHome(s.row, await labelsOf(db, table)); continue;
    }
    if (before.is_archived && o.op !== 'delete') { res.error = 'this row is archived; unarchive it in the Webflow editor first'; continue; }
    if (o.op === 'remove') { plan.push({ i, op: 'remove', id: o.id, before }); continue; }
    if (o.op === 'delete') { plan.push({ i, op: 'delete', id: o.id, before, planId: before.plan_id || null }); continue; }   // v1.2.0: true delete
    const c = await checkFields(db, cfg, sch, taId, o.fields, planOk, sch.planSlug ? (before.plan_id || null) : null);
    if (c.errs.length) { res.error = c.errs.join('; '); continue; }
    if (!Object.keys(c.fd).length) { res.error = 'no fields to change'; continue; }
    plan.push({ i, op: 'update', id: o.id, fd: c.fd, before, planId: before.plan_id || null });
  }
  if (results.some(r => r.error)) {
    return { status: 409, body: { ok: false, taId, error: 'Nothing was sent: ' + results.filter(r => r.error).length + ' of ' + ops.length + ' ops failed their check.',
      results, meta: { version: VERSION, ...pacer.meta() } } };
  }

  // 1b · THE RELEASE LOCK (v1.2.0, nl_blocks): each plan the batch touches is checked with ix-issue-data before anything is sent.
  let releaseMeta = null;
  if (table === 'nl_blocks') {
    const gate = await releaseGateForPlan(env, cfg, sch, plan);
    releaseMeta = gate.meta;
    if (!gate.ok) {
      results.forEach(r => { r.error = gate.error; if (gate.released) r.released = true; if (gate.hold) r.hold = true; if (gate.issueSent) r.issueSent = true; });   // v1.2.1 issueSent
      return { status: gate.status || 409, body: { ok: false, taId, error: gate.error, released: !!gate.released, hold: !!gate.hold, issueSent: !!gate.issueSent, results,
        meta: { version: VERSION, releaseCheck: releaseMeta, ...pacer.meta() } } };
    }
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
      } else if (p.op === 'delete') {                                                   // v1.2.0 · true delete: live, then staged (HC-P-CH4-2)
        res.sent = true;
        await deleteItemBoth(pacer, cid, p.id);
        written.push({ p, item: { id: p.id }, publish: false, deleted: true });
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
      const r = await publishItems(pacer, cid, toPublish);
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
    if (w.deleted) {                                                                     // v1.2.0: the row is gone; change_log keeps it
      const before = (await readHomeRows(db, table, 'WHERE t.id=?', [w.item.id]))[0] || w.p.before;
      if (before) await db.batch(homeDeleteStmts(db, table, before, by, 'delete', iso()));
      res.ok = true; res.deleted = true; res.id = w.item.id;
      continue;
    }
    const s = await storeHomeItem(db, cfg, sch, w.item, by, w.p.op);
    res.row = shapeHome(s.row, labelsFresh);
    res.id = w.item.id;
    if (w.unpublished) res.error = 'saved in Webflow but not published' + (published.error ? ' (' + published.error + ')' : '');
    else if (w.p.op === 'remove' && !w.offLive) res.error = res.note;
    else res.ok = true;
  }
  const allOk = results.every(r => r.ok);
  return { status: allOk ? 200 : 207, body: { ok: allOk, taId, results, published,
    meta: { version: VERSION, by, source: 'webflow, then d1', ...(releaseMeta ? { releaseCheck: releaseMeta } : {}), ...pacer.meta() } } };
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// IX-ISSUE-DATA (v1.2.0) — the release lock, the Default Layout catalog and the clone batch stay in ix-issue-data.
// Reached through the ISSUE_DATA service binding, else contentHome.settings.issueDataUrl, always with X-IX-Key from
// the ISSUE_DATA_KEY secret (ix-issue-data v1.0.170 takes it as its service key). HC-P-CH4-6.
// ─────────────────────────────────────────────────────────────────────────────────────────
async function issueData(env, cfg, path, opts) {
  if (!env.ISSUE_DATA_KEY) throw httpErr(500, 'The ISSUE_DATA_KEY secret is not set on this Worker (the key ix-issue-data accepts in X-IX-Key).');
  const method = (opts && opts.method) || 'GET';
  const headers = { 'X-IX-Key': env.ISSUE_DATA_KEY, accept: 'application/json', ...(opts && opts.body ? { 'content-type': 'application/json' } : {}) };
  const init = { method, headers, body: opts && opts.body ? JSON.stringify(opts.body) : undefined, signal: AbortSignal.timeout((opts && opts.timeoutMs) || 30000) };
  let res;
  try {
    if (env.ISSUE_DATA && typeof env.ISSUE_DATA.fetch === 'function') res = await env.ISSUE_DATA.fetch(new Request('https://ix-issue-data' + path, init));
    else if (cfg.s.issueDataUrl) res = await fetch(String(cfg.s.issueDataUrl).replace(/\/+$/, '') + path, init);
    else throw httpErr(500, 'ix-issue-data is not reachable: set the ISSUE_DATA service binding or ' + KV_KEYS.settings + '.issueDataUrl.');
  } catch (e) {
    if (e && e.status) throw e;
    const x = httpErr(502, 'ix-issue-data did not answer (' + method + ' ' + path.split('?')[0] + '): ' + ((e && e.message) || e)); x.busy = true; throw x;
  }
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch (_) {}
  return { status: res.status, data, text };
}

// The release lock and the Reserved Tiles holds, for every plan a batch touches (HC-P-CH4-3).
// plan = the checked ops (homeBatchRoute's plan list). Each nl_blocks op names its planId.
// One call per plan and op kind the batch holds: create, fill (a field set), clear (a field emptied), other (the lock alone).
// 409 refuses; 503 / checked:false lets the batch through (as 124 v2.27 does) and is named in meta; 401 / 500 is a set-up fault and refuses.
async function releaseGateForPlan(env, cfg, sch, plan) {
  const byPlan = new Map();
  for (const p of plan) {
    const pid = p.planId;
    if (!pid) continue;
    const g = byPlan.get(pid) || byPlan.set(pid, { create: [], fill: [], clear: [], other: [] }).get(pid);
    if (p.op === 'create') { for (const [slug, v] of Object.entries(p.fd)) if (slug !== sch.planSlug && v != null && v !== '' && !(Array.isArray(v) && !v.length)) g.create.push({ field: slug }); if (!g.create.length) g.other.push({ id: null }); }
    else if (p.op === 'update') { for (const [slug, v] of Object.entries(p.fd)) { const empty = v == null || v === '' || (Array.isArray(v) && !v.length); (empty ? g.clear : g.fill).push({ id: p.id, field: slug }); } }
    else g.other.push({ id: p.id });
  }
  const meta = { plans: byPlan.size, calls: 0, notChecked: 0 };
  for (const [pid, g] of byPlan) {
    const kinds = [['create', g.create], ['fill', g.fill], ['clear', g.clear]].filter(([, ops]) => ops.length);
    if (!kinds.length) kinds.push(['update', g.other.length ? g.other : [{ id: null }]]);
    for (const [kind, ops] of kinds) {
      meta.calls++;
      let r;
      try { r = await issueData(env, cfg, '/release-check?planId=' + pid, { method: 'POST', body: { op: kind, batch: { ops } }, timeoutMs: 25000 }); }
      catch (e) { meta.notChecked++; meta.note = 'ix-issue-data did not answer; the lock was not checked (' + e.message + ')'; continue; }
      const d = r.data || {};
      if (r.status === 401 || r.status === 500) return { ok: false, status: 500, error: 'The release check could not run: ix-issue-data answered ' + r.status + ' (' + (d.error || r.text.slice(0, 120)) + '). Check ISSUE_DATA_KEY on ix-content and IX_SERVICE_KEY on ix-issue-data.', meta };
      if (r.status === 409) return { ok: false, status: 409, error: d.error || 'This plan is released.', released: !!d.released, hold: !!d.hold, issueSent: !!d.sent, meta };   // v1.2.1 issueSent from ix-issue-data's sent
      if (r.status === 503 || d.checked === false) { meta.notChecked++; meta.note = 'Webflow was busy; the lock was not checked'; continue; }
      if (r.status !== 200) return { ok: false, status: 502, error: 'The release check failed: ix-issue-data answered ' + r.status + '.', meta };
    }
  }
  return { ok: true, meta };
}

// Delete one Webflow item: the live copy first (ignored when there is none), then the staged item (HC-P-CH4-2).
async function deleteItemBoth(pacer, cid, id) {
  try { await pacer.call('/collections/' + cid + '/items/' + id + '/live', { method: 'DELETE' }); }
  catch (e) { if (e && (e.unsure || e.busy)) throw e; /* 4xx: not live */ }
  await pacer.call('/collections/' + cid + '/items/' + id, { method: 'DELETE' });
}

// Store one item of a copied collection into copy_items at once (hydrate: the new plan and NEWSLETTER must be in the
// copy before any row names them, and before the Pub Plans list is read). The webhook that follows finds no change.
async function copyStoreItem(db, pacer, cfg, cid, item) {
  const copied = await copiedMap(db);
  if (!copied.has(cid)) return false;
  const ten = await tenancyFor(db, pacer, cfg, cid, copied.get(cid));
  const now = iso();
  await db.batch([...upsertStmts(db, cid, item, ten, null, now, false), db.prepare('UPDATE collections SET last_change=? WHERE collection_id=?').bind(now, cid)]);
  await derivePass(db, cfg.s.tenancy, (cid === cfg.s.tenancy.plans || cid === cfg.s.tenancy.titlesAdmin) ? null : item.id);
  return true;
}
async function copyDropItem(db, cid, id) {
  await db.batch([db.prepare('DELETE FROM copy_items WHERE collection_id=? AND item_id=?').bind(cid, id),
    db.prepare('DELETE FROM copy_title_links WHERE collection_id=? AND item_id=?').bind(cid, id)]);
}

// A collection's schema as fields-by-slug (plans and NEWSLETTERS for hydrate). Memoised per instance.
async function collectionSchema(pacer, cid) {
  const memo = SCHEMA_MEMO.get('col:' + cid);
  if (memo && Date.now() - memo.at < SCHEMA_TTL_MS) return memo.sch;
  const r = await pacer.call('/collections/' + cid);
  if (!r.data || !Array.isArray(r.data.fields)) throw httpErr(502, 'Webflow did not answer the schema of collection ' + cid + '.');
  const fields = {};
  for (const f of r.data.fields) fields[f.slug] = { type: f.type, required: !!f.isRequired, editable: f.isEditable !== false,
    options: f.validations && Array.isArray(f.validations.options) ? f.validations.options.map(o => ({ id: o.id, name: o.name })) : null };
  const sch = { collectionId: cid, fields, name: r.data.displayName || cid };
  SCHEMA_MEMO.set('col:' + cid, { at: Date.now(), sch });
  return sch;
}

// Values for a collection, from { slug: raw }, each checked against the schema (options by name). Throws on the first fault.
function fieldsFor(sch, raw, where) {
  const fd = {};
  for (const [slug, v] of Object.entries(raw)) {
    if (v === undefined) continue;
    const f = sch.fields[slug];
    if (!f) throw httpErr(500, where + ': ' + sch.name + ' has no field "' + slug + '". Fix the slug in ' + KV_KEYS.home + '.nl_blocks.hydrate.');
    const r = fieldValue(slug, f, v);
    if (r.err) throw httpErr(400, where + ': ' + r.err);
    if (r.v !== null && r.v !== undefined) fd[slug] = r.v;
  }
  return fd;
}

function slugify(s) { return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'plan'; }
function dayOf(v) { const s = String(v || '').trim(); const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : ''; }

// The hydrate config, checked once. Field slugs live in KV, never in code (HC-P-CH4-4 names only the slug pattern).
function hydrateCfg(h) {
  const y = h.hydrate;
  if (!y || typeof y !== 'object') throw httpErr(500, KV_KEYS.home + '.nl_blocks.hydrate is missing.');
  if (!ID24.test(y.newsletterCollectionId || '')) throw httpErr(500, KV_KEYS.home + '.nl_blocks.hydrate.newsletterCollectionId is missing.');
  const need = (o, keys, name) => { for (const k of keys) if (!o || !o[k]) throw httpErr(500, KV_KEYS.home + '.nl_blocks.hydrate.' + name + '.' + k + ' is missing.'); };
  need(y.planFields, ['name', 'slug', 'titleAdmin', 'issueNumber', 'issueNumberDisplay', 'publicationDate', 'planningStatus', 'editionLetter', 'taThreeDigitId', 'selfId', 'newsletterItemId', 'newsletterLink', 'designJson'], 'planFields');
  need(y.nlFields, ['name', 'slug', 'title', 'sector', 'issueNo', 'publishDate', 'plan', 'sendZipCodes', 'status', 'selfId'], 'nlFields');
  need(y.taFields, ['title', 'threeDigit'], 'taFields');
  need(y.rowFields, ['name', 'slotKey', 'planningNote', 'assetType', 'endGroup', 'design', 'designId'], 'rowFields');
  if (!y.planStatusOnCreate || !y.nlStatusOnCreate) throw httpErr(500, KV_KEYS.home + '.nl_blocks.hydrate.planStatusOnCreate and nlStatusOnCreate are required (option names).');
  if (!y.nlBaseUrl) throw httpErr(500, KV_KEYS.home + '.nl_blocks.hydrate.nlBaseUrl is missing.');
  return y;
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// HYDRATE, REFRESH, CLONE (v1.2.0) — the whole of Scenario 126 in one Worker call (Jeff, 9 Nov).
//   POST /nl-blocks/hydrate  { taId, issueName, issueNumber, issueLabel, publicationDate, editionLetter, edition?, sendZipCodes? }
//                            → Add: the PUBLICATION PLAN, its NEWSLETTER, and one NL-BLOCKS row per Default Layout row.
//   POST /nl-blocks/hydrate  { taId, op:"refresh", pubplanId, rowIds:[...] }
//                            → Refresh: the plan's rows replaced by the Default Layout. New rows first; the old rows are
//                              deleted only once every new row landed.
//   POST /nl-blocks/clone    { taId, sourcePubplanId, issueName, issueNumber, issueLabel, publicationDate, editionLetter, edition? }
//                            → Clone: the plan and NEWSLETTER, then the source issue's rows from ix-issue-data /clone-rows.
//   The body's field names are 126's webhook names (HC-P-CH4-5), so the Pub Plans page swaps its address 1:1.
//   What a call made is deleted again if a later step fails: the reply says what was undone. Webflow is the master,
//   so the undo is a best effort named in the reply, never assumed.
// ─────────────────────────────────────────────────────────────────────────────────────────
async function hydrateRoute(request, env, mode) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return { status: 400, body: { ok: false, error: 'The body must be JSON.' } };
  const taId = String(body.taId || '');
  if (!ID24.test(taId)) return { status: 400, body: { ok: false, error: 'taId (a TITLES-ADMIN id) is required.' } };
  const gate = await permit(env, request, 'nl_blocks.hydrate', null);
  if (!gate.ok) return { status: gate.status, body: { ok: false, error: gate.why } };
  const by = gate.who.email || gate.who.memberId;
  const db = needDb(env);
  const cfg = await loadConfig(env);
  const h = homeCfg(cfg, 'nl_blocks');
  const y = hydrateCfg(h);
  const pacer = new Pacer(env, cfg.s, { burst: true, maxCalls: 400 });
  const sch = await homeSchema(pacer, cfg, 'nl_blocks', true);
  const cid = sch.collectionId;
  const pub = await publisherOfTitle(db, cfg, taId);
  if (!pub) return { status: 400, body: { ok: false, error: 'taId is not a TITLES-ADMIN item with a publisher in the copy. Nothing was created.' } };
  const T = cfg.s.tenancy;
  const tag = mode;
  const op = String(body.op || '').trim();
  try {
    if (op === 'refresh') return await refreshPlan(db, env, cfg, pacer, sch, y, taId, body, by);
    if (mode === 'clone' && !ID24.test(String(body.sourcePubplanId || ''))) return { status: 400, body: { ok: false, error: 'sourcePubplanId (the plan to copy) is required.' } };
    if (mode === 'hydrate' && body.sourcePubplanId) return { status: 400, body: { ok: false, error: 'A clone goes to /nl-blocks/clone.' } };
    return await addOrClone(db, env, cfg, pacer, sch, y, taId, body, by, mode === 'clone' ? 'clone' : 'add');
  } catch (e) {
    return { status: (e && e.status) || 500, body: { ok: false, error: (e && e.message) || String(e), detail: (e && e.detail) || undefined, meta: { version: VERSION, by, tag, ...pacer.meta() } } };
  }
}

// One NL-BLOCKS row from a Default Layout row (ix-issue-data /catalog layout.rows), the way 124 create built it.
function rowFromLayout(sch, y, planId, planName, lr) {
  const rf = y.rowFields, h = sch.h;
  const pos = Number(lr.position);
  const raw = {
    [rf.name]: String(planName) + '-b' + pos,
    [h.blockTypeField]: lr.blockTypeHash || null,
    [rf.slotKey]: 'slot-' + pos,
    [h.positionField]: pos,
    [rf.planningNote]: '',
    [sch.planSlug]: planId,
    [rf.assetType]: lr.assetTypeHash || null,
    [rf.endGroup]: !!lr.endGroup,
  };
  if (lr.designId) { raw[rf.design] = lr.designId; raw[rf.designId] = lr.designId; }
  if (lr.assetField && lr.assetId && sch.fields[lr.assetField]) raw[lr.assetField] = lr.assetId;
  return raw;
}

// Create rows in Webflow (create, self-id), publish them together, store them in D1. Returns { items, results }.
// Throws after undoing every row it made when a create fails.
async function createRows(db, cfg, pacer, sch, rawRows, by, action, undo) {
  const cid = sch.collectionId, items = [], results = [];
  for (let i = 0; i < rawRows.length; i++) {
    const fd = fieldsFor(sch, rawRows[i], 'row ' + (i + 1));
    for (const [slug, f] of Object.entries(sch.fields))
      if (f.required && f.editable && slug !== 'slug' && slug !== sch.h.selfIdField && (fd[slug] == null || fd[slug] === '')) throw httpErr(400, 'row ' + (i + 1) + ': ' + slug + ' is required');
    const c = await pacer.call('/collections/' + cid + '/items', { method: 'POST', body: { isDraft: false, isArchived: false, fieldData: fd } });
    const newId = c.data && c.data.id;
    if (!newId) throw httpErr(502, 'Webflow created nothing for row ' + (i + 1) + ' (no id came back).');
    undo.rows.push(newId);
    const s = await pacer.call('/collections/' + cid + '/items/' + newId, { method: 'PATCH', body: { fieldData: { [sch.h.selfIdField]: newId } } });
    items.push(s.data && s.data.id ? s.data : c.data);
  }
  let published = { asked: items.length, done: 0, error: null };
  if (items.length) {
    try {
      const r = await publishItems(pacer, cid, items.map(x => x.id));
      published.done = ((r.data && r.data.publishedItemIds) || []).length;
      const errs = (r.data && r.data.errors) || []; if (errs.length) published.error = JSON.stringify(errs).slice(0, 300);
    } catch (e) { published.error = e.message; }
  }
  const labels = {};
  for (const [slug, f] of Object.entries(sch.fields)) if (f.options) labels[slug] = Object.fromEntries(f.options.map(o => [o.id, o.name]));
  await db.batch([schemaFactStmt(db, sch)]);
  for (const it of items) {
    const s = await storeHomeItem(db, cfg, sch, it, by, action);
    results.push({ ok: true, id: it.id, row: shapeHome(s.row, labels) });
  }
  return { items, results, published };
}

// Undo what a hydrate or clone made, in reverse order: rows, NEWSLETTER, plan. Best effort; every miss is named.
async function undoCreated(db, cfg, pacer, sch, y, undo) {
  const out = { rows: 0, newsletter: false, plan: false, errors: [] };
  const un = new Pacer({ WEBFLOW_TOKEN: pacer.token }, cfg.s, { burst: true, maxCalls: undo.rows.length * 2 + 8 });
  for (const id of undo.rows) {
    try { await deleteItemBoth(un, sch.collectionId, id); out.rows++; } catch (e) { out.errors.push('row ' + id + ': ' + e.message); }
    try { const before = (await readHomeRows(db, 'nl_blocks', 'WHERE t.id=?', [id]))[0]; if (before) await db.batch(homeDeleteStmts(db, 'nl_blocks', before, 'undo', 'undo', iso())); } catch (_) {}
  }
  if (undo.nlId) {
    try { await deleteItemBoth(un, y.newsletterCollectionId, undo.nlId); out.newsletter = true; } catch (e) { out.errors.push('NEWSLETTER ' + undo.nlId + ': ' + e.message); }
    try { await copyDropItem(db, y.newsletterCollectionId, undo.nlId); } catch (_) {}
  }
  if (undo.planId) {
    try { await deleteItemBoth(un, cfg.s.tenancy.plans, undo.planId); out.plan = true; } catch (e) { out.errors.push('PUBLICATION PLAN ' + undo.planId + ': ' + e.message); }
    try { await copyDropItem(db, cfg.s.tenancy.plans, undo.planId); } catch (_) {}
  }
  return out;
}

async function catalogRows(env, cfg, taId) {
  const r = await issueData(env, cfg, '/catalog?taId=' + taId, { timeoutMs: 60000 });
  const d = r.data || {};
  if (r.status !== 200 || !d.ok) throw httpErr(502, 'ix-issue-data /catalog refused (' + r.status + '): ' + (d.error || r.text.slice(0, 200)));
  const rows = d.layout && Array.isArray(d.layout.rows) ? d.layout.rows : [];
  if (!rows.length) throw httpErr(409, 'This title has no Default Layout rows, so there is nothing to put on the plan. Set the Default Layout first.');
  return rows;
}

// Add (Default Layout rows) or Clone (the source issue's rows): plan, NEWSLETTER, rows.
async function addOrClone(db, env, cfg, pacer, sch, y, taId, body, by, mode) {
  const T = cfg.s.tenancy, planCid = T.plans, nlCid = y.newsletterCollectionId;
  const issueName = String(body.issueName || '').trim();
  const day = dayOf(body.publicationDate);
  const issueNumber = Number(body.issueNumber);
  const issueLabel = String(body.issueLabel == null ? '' : body.issueLabel).trim();
  const editionLetter = String(body.editionLetter == null ? '' : body.editionLetter).trim();
  const edition = body.edition == null ? '' : String(body.edition);
  if (!issueName) throw httpErr(400, 'issueName is required.');
  if (!day) throw httpErr(400, 'publicationDate must be a date (YYYY-MM-DD).');
  if (!Number.isInteger(issueNumber)) throw httpErr(400, 'issueNumber must be a whole number.');
  const ta = await db.prepare('SELECT field_data FROM copy_items WHERE collection_id=? AND item_id=?').bind(T.titlesAdmin, taId).first();
  if (!ta) throw httpErr(400, 'taId is not in the copy of TITLES-ADMIN.');
  const taFd = JSON.parse(ta.field_data || '{}');
  const taTitle = String(taFd[y.taFields.title] || taFd.name || ''), taSlug = String(taFd.slug || ''), taThree = String(taFd[y.taFields.threeDigit] || '');

  // Clone: is there anything to copy? (ix-issue-data refuses a source that is not the first, compiled edition.)
  let pre = null;
  if (mode === 'clone') {
    const r = await issueData(env, cfg, '/clone-rows?sourcePlanId=' + body.sourcePubplanId + '&newName=' + encodeURIComponent(issueName) + '&newDate=' + day + (edition ? '&edition=' + encodeURIComponent(edition) : ''), { timeoutMs: 60000 });
    pre = r.data || {};
    if (r.status === 409) throw Object.assign(httpErr(409, pre.error || 'The source issue cannot be cloned.'), { detail: pre });
    if (r.status !== 200 || !pre.ok) throw httpErr(502, 'ix-issue-data /clone-rows refused (' + r.status + '): ' + (pre.error || r.text.slice(0, 200)));
    if (!Number(pre.rowCount)) throw Object.assign(httpErr(422, 'Nothing was cloned and nothing was created: the source issue has no slots to copy, or the copy could not be read.'), { detail: { workerError: pre.error || null } });
  }

  // The name must be new (Webflow is the master for plans).
  const dup = await pacer.call('/collections/' + planCid + '/items?name=' + encodeURIComponent(issueName));
  const dupItems = (dup.data && dup.data.items) || [];
  const exists = dupItems.find(it => String((it.fieldData || {}).name || '').trim().toLowerCase() === issueName.toLowerCase());
  if (exists) return { status: 409, body: { ok: false, error: 'A plan with this name already exists. Nothing was created.', name: issueName, existingId: exists.id } };

  const planSch = await collectionSchema(pacer, planCid), nlSch = await collectionSchema(pacer, nlCid);
  const pf = y.planFields, nf = y.nlFields;
  const undo = { rows: [], nlId: null, planId: null };
  try {
    // 1 · PUBLICATION PLAN
    const planFd = fieldsFor(planSch, {
      [pf.name]: issueName, [pf.slug]: slugify(issueName), [pf.titleAdmin]: taId, [pf.issueNumber]: issueNumber, [pf.issueNumberDisplay]: issueLabel,
      [pf.publicationDate]: day, [pf.planningStatus]: y.planStatusOnCreate, [pf.editionLetter]: editionLetter, [pf.taThreeDigitId]: taThree,
    }, 'plan');
    const pc = await pacer.call('/collections/' + planCid + '/items', { method: 'POST', body: { isArchived: false, isDraft: false, fieldData: planFd } });
    const planId = pc.data && pc.data.id;
    if (!planId) throw httpErr(502, 'Plan not created: Webflow answered without an id.');
    undo.planId = planId;
    const planName = String((pc.data.fieldData || {}).name || issueName), planSlug = String((pc.data.fieldData || {}).slug || '');

    // 2 · NEWSLETTER (slug YY-MMDD<label>-<title slug>, as 126 built it: HC-P-CH4-4)
    const nlSlug = day.slice(2, 4) + '-' + day.slice(5, 7) + day.slice(8, 10) + issueLabel + '-' + taSlug;
    const nlFd = fieldsFor(nlSch, {
      [nf.name]: planName, [nf.slug]: slugify(nlSlug), [nf.title]: taTitle, [nf.sector]: taId, [nf.issueNo]: nlSch.fields[nf.issueNo] && nlSch.fields[nf.issueNo].type === 'Number' ? issueNumber : String(issueNumber),
      [nf.publishDate]: day, [nf.plan]: planId, [nf.sendZipCodes]: body.sendZipCodes == null ? undefined : String(body.sendZipCodes), [nf.status]: y.nlStatusOnCreate,
    }, 'newsletter');
    const nc = await pacer.call('/collections/' + nlCid + '/items', { method: 'POST', body: { isArchived: false, isDraft: false, fieldData: nlFd } });
    const nlId = nc.data && nc.data.id;
    if (!nlId) throw httpErr(502, 'NEWSLETTER not created: Webflow answered without an id.');
    undo.nlId = nlId;
    const nlSlugFinal = String((nc.data.fieldData || {}).slug || slugify(nlSlug));
    const n2 = await pacer.call('/collections/' + nlCid + '/items/' + nlId, { method: 'PATCH', body: { fieldData: { [nf.selfId]: nlId } } });
    const p2 = await pacer.call('/collections/' + planCid + '/items/' + planId, { method: 'PATCH', body: { fieldData: {
      [pf.selfId]: planId, [pf.newsletterItemId]: nlId, [pf.newsletterLink]: String(y.nlBaseUrl).replace(/\/+$/, '') + '/' + nlSlugFinal } } });
    await publishItems(pacer, planCid, [planId]);
    await publishItems(pacer, nlCid, [nlId]);
    // Into the copy now, so the rows find their title through the plan and the Pub Plans list sees the new plan.
    await copyStoreItem(db, pacer, cfg, planCid, p2.data && p2.data.id ? p2.data : pc.data);
    await copyStoreItem(db, pacer, cfg, nlCid, n2.data && n2.data.id ? n2.data : nc.data);

    // 3 · ROWS
    let made, extra = {};
    if (mode === 'add') {
      const layout = await catalogRows(env, cfg, taId);
      made = await createRows(db, cfg, pacer, sch, layout.map(lr => rowFromLayout(sch, y, planId, planName, lr)), by, 'hydrate', undo);
      extra = { blockCount: layout.length, designLookup: true };
    } else {
      const r = await issueData(env, cfg, '/clone-rows?sourcePlanId=' + body.sourcePubplanId + '&newName=' + encodeURIComponent(issueName) + '&newDate=' + day +
        '&newPlanId=' + planId + '&newNlId=' + nlId + (edition ? '&edition=' + encodeURIComponent(edition) : ''), { timeoutMs: 60000 });
      const cl = r.data || {};
      if (r.status !== 200 || !cl.ok) throw httpErr(502, 'ix-issue-data /clone-rows refused (' + r.status + '): ' + (cl.error || r.text.slice(0, 200)));
      let batch;
      try { batch = JSON.parse(JSON.parse('"' + cl.batchLiteral + '"')); } catch (e) { throw httpErr(502, 'The clone batch from ix-issue-data could not be read.'); }
      const rawRows = (batch.ops || []).map(o => { const b = typeof o.body === 'string' ? JSON.parse(o.body) : (o.body || {}); return b.fieldData || {}; });
      if (!rawRows.length) throw httpErr(422, 'The source issue has no rows to copy.');
      made = await createRows(db, cfg, pacer, sch, rawRows, by, 'clone', undo);
      if (cl.planDesignJson) await pacer.call('/collections/' + planCid + '/items/' + planId, { method: 'PATCH', body: { fieldData: { [pf.designJson]: String(cl.planDesignJson) } } });
      let nlCarried = [];
      try {
        const nlFields = cl.nlFieldDataJson ? JSON.parse(cl.nlFieldDataJson) : null;
        if (nlFields && Object.keys(nlFields).length) {
          const n3 = await pacer.call('/collections/' + nlCid + '/items/' + nlId, { method: 'PATCH', body: { fieldData: nlFields } });
          await publishItems(pacer, nlCid, [nlId]);
          if (n3.data && n3.data.id) await copyStoreItem(db, pacer, cfg, nlCid, n3.data);
        }
        nlCarried = cl.nlCarriedJson ? JSON.parse(cl.nlCarriedJson) : (cl.nlCarried || []);
      } catch (e) { extra.nlWarning = 'The NEWSLETTER fields were not all carried: ' + e.message; }
      if (cl.planDesignJson) { await publishItems(pacer, planCid, [planId]); }
      extra = { ...extra, source: pre.sourcePlan || null, blockCount: Number(pre.rowCount) || rawRows.length, ackCount: pre.ackCount || 0, pendingCount: cl.pendingCount || 0,
        nlCarried, dropped: pre.dropped || [], undated: pre.undated || [] };
    }
    return { status: 200, body: { ok: true, mode, pubplanId: planId, pubplanSlug: planSlug, name: planName,
      fieldData: { name: planName, 'issue-number': issueNumber, 'issue-number-display': issueLabel },
      newsletterId: nlId, newsletterSlug: nlSlugFinal, rows: made.results, published: made.published, ...extra,
      meta: { version: VERSION, by, source: 'webflow, then d1', ...pacer.meta() } } };
  } catch (e) {
    const undone = await undoCreated(db, cfg, pacer, sch, y, undo);
    return { status: (e && e.status) || 502, body: { ok: false, mode, error: (e && e.message) || String(e), detail: (e && e.detail) || undefined,
      undone, nothingKept: !undone.errors.length, meta: { version: VERSION, by, ...pacer.meta() } } };
  }
}

// Refresh: the plan's rows replaced by the Default Layout. New rows first, old rows deleted after; a failed create undoes the new rows.
async function refreshPlan(db, env, cfg, pacer, sch, y, taId, body, by) {
  const planId = String(body.pubplanId || '');
  if (!ID24.test(planId)) throw httpErr(400, 'pubplanId is required for a refresh.');
  if ((await titleOfPlan(db, cfg, planId)) !== taId) throw httpErr(403, 'This plan is not on this title.');
  const sent = Array.isArray(body.rowIds) ? body.rowIds.map(String) : String(body.rowIds || '').split(',').map(s => s.trim()).filter(Boolean);
  const have = await readHomeRows(db, 'nl_blocks', 'WHERE t.plan_id=? AND t.is_archived=0', [planId]);
  const haveIds = new Set(have.map(r => r.id)), sentIds = new Set(sent);
  const whole = haveIds.size === sentIds.size && [...haveIds].every(id => sentIds.has(id));
  if (!whole) return { status: 400, body: { ok: false, error: 'The list of blocks did not arrive whole, so nothing was changed. Reload the tab and try again.',
    expected: haveIds.size, got: sentIds.size } };
  const gate = await releaseGateForPlan(env, cfg, sch, [{ op: 'delete', id: planId, planId }]);
  if (!gate.ok) return { status: gate.status || 409, body: { ok: false, error: gate.error, released: !!gate.released, hold: !!gate.hold, issueSent: !!gate.issueSent, meta: gate.meta } };   // v1.2.1
  const planRow = await db.prepare('SELECT field_data FROM copy_items WHERE collection_id=? AND item_id=?').bind(cfg.s.tenancy.plans, planId).first();
  const planName = String((planRow ? JSON.parse(planRow.field_data || '{}') : {}).name || body.planName || planId);
  const layout = await catalogRows(env, cfg, taId);
  const undo = { rows: [], nlId: null, planId: null };
  let made;
  try { made = await createRows(db, cfg, pacer, sch, layout.map(lr => rowFromLayout(sch, y, planId, planName, lr)), by, 'refresh', undo); }
  catch (e) {
    const undone = await undoCreated(db, cfg, pacer, sch, y, undo);
    return { status: (e && e.status) || 502, body: { ok: false, op: 'refresh', pubplanId: planId, error: 'The Default Layout did not go down fully; the old blocks were kept. ' + ((e && e.message) || e),
      undone, meta: { version: VERSION, by, ...pacer.meta() } } };
  }
  // The old rows, now that every new row stands.
  const deleted = [], kept = [];
  for (const r of have) {
    try { await deleteItemBoth(pacer, sch.collectionId, r.id); await db.batch(homeDeleteStmts(db, 'nl_blocks', r, by, 'refresh-delete', iso())); deleted.push(r.id); }
    catch (e) { kept.push({ id: r.id, error: e.message }); }
  }
  const ok = !kept.length;
  return { status: ok ? 200 : 207, body: { ok, op: 'refresh', pubplanId: planId, created: made.results.length, deleted: deleted.length, rows: made.results, published: made.published,
    ...(kept.length ? { error: 'The new blocks are in place, but ' + kept.length + ' old block(s) could not be deleted. Open the plan and check its slots.', kept } : {}),
    meta: { version: VERSION, by, source: 'webflow, then d1', releaseCheck: gate.meta, ...pacer.meta() } } };
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
    ISSUE_DATA: !!(env.ISSUE_DATA && env.ISSUE_DATA.fetch), ISSUE_DATA_KEY: !!env.ISSUE_DATA_KEY,          // v1.2.0 (HC-P-CH4-6)
  } };
  // ISSUE_DATA may be replaced by contentHome.settings.issueDataUrl; the key is always needed.
  let issueDataUrl = null;
  try { const s = env.IX_KV ? await env.IX_KV.get(KV_KEYS.settings, 'json') : null; issueDataUrl = s && s.issueDataUrl ? String(s.issueDataUrl) : null; } catch (_) {}
  out.issueData = out.bindings.ISSUE_DATA ? 'service binding' : (issueDataUrl ? 'url ' + issueDataUrl : 'missing: set the ISSUE_DATA binding or contentHome.settings.issueDataUrl');
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
  const need = ['IX_DB', 'IX_KV', 'MEMBERS', 'WEBFLOW_TOKEN', 'ISSUE_DATA_KEY'];
  out.ok = need.every(k => out.bindings[k]) && !out.issueData.startsWith('missing') && !!(out.schema && out.schema.ok) && !!out.kv && !Object.values(out.kv).some(v => v === 'missing' || v === 'not valid JSON');
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
// v1.2.2 — publish with retries. Publishing the same items again is safe (it only makes the live copy match the
// saved one), so a 5xx, a 429 or no answer on POST /items/publish is tried again: up to PUBLISH_TRIES in all,
// PUBLISH_WAITS_MS apart (HC-P-CH8-1). Every other write keeps the Pacer's rule: never resent after a 5xx.
const PUBLISH_TRIES = 3, PUBLISH_WAITS_MS = [3000, 8000];
async function publishItems(pacer, cid, itemIds) {
  let last = null;
  for (let t = 0; t < PUBLISH_TRIES; t++) {
    if (t) await sleep(PUBLISH_WAITS_MS[Math.min(t - 1, PUBLISH_WAITS_MS.length - 1)]);
    try {
      const r = await pacer.call('/collections/' + cid + '/items/publish', { method: 'POST', body: { itemIds } });
      if (t) r.publishTries = t + 1;
      return r;
    } catch (e) {
      last = e;
      if (!(e && (e.busy || e.unsure)) || (e && e.budget)) throw e;     // a refusal Webflow read: trying again will not help
    }
  }
  if (last) last.message = last.message + ' (tried ' + PUBLISH_TRIES + ' times)';
  throw last;
}

function sleep(ms) { return new Promise(r => setTimeout(r, Math.max(0, ms))); }
function iso() { return new Date().toISOString(); }
function nn(v) { return v === undefined || v === null || v === '' ? null : v; }
function chunk(a, n) { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out; }
