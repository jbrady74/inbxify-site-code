// ix-sales-v1.3.0.js
// INBXIFY · Cloudflare Worker · ix-sales
// SALES RECORDS and OBLIGATIONS: the one place the rules live. The portal
// (S2) and Studio (S3) both call this; the Revenue Picker (S4) and Scenario
// 108 (S5) call it too. Scoping: Sales-Records-Obligations-Scoping-v0_7.md.
// Since v1.3.0 also the portal's Ads tab and the advertiser review page.
//
// v1.3.0 (9 Nov 2026, Publisher Portal S8 · Ads Tab Build) — THE ADS TAB, THE REVIEW PAGE, RUN LOG.
//   READ (login + origin, publisher scoping as every other route)
//   · GET /ads?publisher=<id>  The whole Ads tab in one answer: every customer of the publisher (the v1.2.0 rule),
//     each with four shapes { sold, current, versions[] }. Versions come from ix-issue-data /customer-ads
//     (?customers=…&archived=1) through the ISSUE_DATA service binding with ix-issue-data's IX_SERVICE_KEY (secret
//     ISSUE_DATA_KEY here, the same value ix-content holds; else IX_KEY). Sold shapes come from the publisher's live sales records (product slot-shape).
//     Each version carries state: current | needs | adv (open advertiser link) | answered | back | ready (approved,
//     never ran) | earlier (ran before, or archived, or older than the pointer cutoff with no Run Log), its run
//     dates, stale (last ran staleMonths or more ago, or unknown), the last decision (who, when), the open or
//     answered link, and the last send-back note. All of that is read from PUBLISHER REVIEWS.
//   WRITE (login + origin; the customer must be the publisher's)
//   · POST /ads/<adId>/decide { publisher, shape, action, note? }  action: approve-current | approve-hold |
//     make-current | restore-hold | restore-review | send-back (note required). Approval changes go through
//     Scenario G approveAd (IX_CONFIG.webhooks.studio) and pointer changes through Scenario 114
//     (IX_CONFIG.webhooks.updateCustomer); each echo is checked (TOAST-TRUTH). A live version is refused. A stale
//     version is refused make-current and restore-hold (Restore for review instead). An Archived row coming back
//     gets ADS Status → Active written here (G has no status route; handover note). Every decision writes one
//     PUBLISHER REVIEWS row (Action = the choice, Status Done, Sent By = the login, Send-back Note, Review Data).
//   · POST /ads/ask { publisher, items:[{adId, shape}] }  One link for every ad named (same customer). Writes a
//     PUBLISHER REVIEWS row (Action Ask the advertiser, Status Open, Token, Expires = now + linkDays) and answers
//     { link, subject, message } for the publisher's own email program. inbxify never sends the email.
//   · POST /ads/<id>/default is retired (410): current ads are pointers on CUSTOMERS, set through 114.
//   SCENARIO 114 → HERE (X-IX-Key)
//   · POST /run-log { customerId, before:{currentBannerAd…}, after:{…} }  Writes ADS Run Log (run-log, JSON per
//     shape {from,to}): the outgoing version gets to = today, the incoming gets from = today. 114 v1.4 calls this
//     after every customer write, so staff, Ad Maker and the portal all log the same way.
//   THE ADVERTISER REVIEW PAGE (origin only; the token in the link is the key; no login)
//   · GET  /review/<token>                 { expired | publisher{company,person,email,logo}, title, customer, until, items[] }.
//                                          Records the first open in Review Data.
//   · POST /review/<token>/transcribe      body = the audio; Workers AI (AI binding, whisper) → transcript; Anthropic
//                                          (ANTHROPIC_API_KEY) → { like, change }. Answers { said, like, change }.
//   · POST /review/<token>/file            multipart "file" → Uploadcare (UPLOADCARE_PUB_KEY) → { url, name }.
//   · POST /review/<token>/answer          { name, items:[{adId, shape, answer, like, change, said, files}] } →
//                                          Review Data, Status Answered. The publisher's OK still decides.
//   PUBLISHER REVIEWS rows are created and patched as STAGED items only (isDraft, never published): a review has no
//   live page. The daily sweep also marks open links past Expires as Expired.
//   IX_CONFIG additions: collections.reviews "6af25a80c75922aa147e85a9"; webhooks { studio, updateCustomer } (the
//   Make webhook URLs of Scenario G and 114); review { linkDays 14, staleMonths 6, pageUrl } optional.
//   BINDINGS: MEMBERS (as before), ISSUE_DATA → ix-issue-data, AI (Workers AI). SECRETS added: ISSUE_DATA_KEY,
//   ANTHROPIC_API_KEY, UPLOADCARE_PUB_KEY.
//   HARDCODING: HC-P-PP8-3 ADS_TAB.shapes (pointer, approval, G key, 114 key, slot label per shape); HC-P-PP8-4
//   approval labels Approved / Pending / Sent back; HC-P-PP8-2 run-log; HC-P-PP8-5 pointerCutoff 2026-11-05;
//   HC-P-PP8-6 review defaults and the email words (REVIEW_DEFAULTS, REVIEW_WORDS); PUBLISHERS display names
//   Contact Name / Business Email / Publisher Logo (PUB_FIELDS, slugs read from the schema).
//
// v1.2.0 (4 Nov 2026, Publisher Portal S4) — WHAT THE PORTAL FORM NEEDS.
//   The Obligations tab's sales record form needs three lists that no
//   route answered, and one check was missing:
//   · GET /customers?publisher=<id>   { customers:[{id,name}] } by name.
//     A customer is the publisher's when CUSTOMERS associated-titles names
//     one of the publisher's TITLES-ADMIN rows, or a live ADS row of the
//     customer names one (legacy customers may have the field empty; the
//     same rule as ix-issue-data's Sponsors shelf), or one of the
//     publisher's sales records already names the customer.
//   · GET /franchises?publisher=<id>  { franchises:[{id,name,titleIds}] }.
//     PRODUCT LIBRARY rows with no slot-shape whose `titles` reference
//     names one of the publisher's TITLES-ADMIN rows. PRODUCT LIBRARY is
//     shared across publishers, so the list is scoped by those titles.
//   · GET /options                    { frequencies, weeks, types }. The
//     form's choices come from here, not from the page: frequencies are
//     the ones this code can schedule (FREQ, HC-S-8) that exist on SALES
//     RECORDS, in the order of scoping §5A; weeks and types are read from
//     the SALES RECORDS schema. Needs the login like every browser route.
//   · MULTI-TENANT CHECK. POST /sales and PATCH /sales now refuse (403) a
//     customer that is not the publisher's, and (400) a franchise that does
//     not run on the sold title. Before, a login could attach any CUSTOMERS
//     or PRODUCT LIBRARY id. On edit the check runs only when the customer
//     or franchise changes, so an older record stays editable.
// v1.1.2 (4 Nov 2026) — soft cap per title dropped from /pool (HC-P-SR-4
//   closed: softCapPerTitle and overCap are gone from the response). The
//   write check counts a blank sent as "" and returned as null as the same.
// v1.1.1 (4 Nov 2026) — Specific months entries may carry a week per send
//   ("2027-05 W1") and a month may repeat. The entry's week is written to
//   that send's OBLIGATIONS week; no week = the record's week (HC-S-10/11).
//
// v1.1.0 (3 Nov 2026, ix-sales v1.1 chat) — THE PORTAL S3 DESIGN.
//   · C1 POST /obligations is gone (405 with a plain message). A one-time
//     sale is POST /sales with frequency One time. Every obligation now
//     belongs to a sales record (scoping §9).
//   · C2 No route changes a send's customer or detaches it. assign keeps a
//     directed send on its own title (only a pool send takes a title).
//     PATCH /sales refuses a customer or product change while any send is
//     placed (Assigned): unplace it first, or cancel the record. An Ended
//     record cannot be edited.
//   · C3 Frequency gains Every other month and Specific months. Specific
//     months are stored on SALES RECORDS run-months as "2027-05,2027-06".
//     Body: months:["2027-05",...]; startMonth becomes the first month.
//   · C4 Type Trade is refused on create and edit (400). Paid or Comp.
//   · C5 GET /titles answers one alphabetical list. TITLES (and its county
//     field) is no longer read anywhere; IX_CONFIG.collections.titlesSite
//     is no longer required.
//   · C6 Behind pace is worked out here, not in the portal: GET /sales rows
//     and GET /pool both answer pace {placed, expected, behind}.
//   · C7 GET /sales rows answer qty, remaining and board counts (ran,
//     planned, due, missed, toCome), runFrom / runTo. Delivered and reached
//     stay in the payload.
//   · C8 Make good is refused when the missed send already has a live
//     make good. A month before this month is refused too.
//   FIXES found reading v1.0.2:
//   · Edit regenerated the remaining sends from the start month and reused
//     names (and slugs) of cancelled sends, so Webflow could refuse the
//     create. Now: the full schedule is worked out, sends that stand
//     (placed, ran, missed) take their own slot, the free slots are
//     created, and numbering continues after the highest number on the
//     record.
//   · Edit cancelled open make goods. A make good is owed for a miss, not
//     part of the schedule, so edit leaves it. Cancel still cancels it.
//   · Split and Pool ignored the frequency (always spread over 12 months).
//     Now the run's months come from the frequency (HC-S-5, revised).
//
// v1.0.2 (2 Nov 2026, Publisher Portal S2) — THE LOGIN CHECK.
//   v1.0.1 trusted the Origin header alone, which anyone can fake from
//   Terminal. Every browser route now also needs the caller's Memberstack
//   login token ("Authorization: Bearer <token>"). ix-sales passes it to
//   ix-members through the Cloudflare service binding MEMBERS (GET /whoami)
//   and gets back the member id, staff yes/no and the member's publishers.
//   · Staff (ix-members IX_CONFIG.staffMemberIds) may act for any publisher.
//   · Anyone else may act only for a publisher that lists them in PUBLISHERS
//     portal-member-ids. Checked in scope() and on every route that starts
//     from a record id (cancel, make good, assign, default ad), using the
//     record's own publisher, never one the page names.
//   · assign also refuses a title that is not the obligation's publisher's.
//   · entered-by is written from the login (email, else member id). A body
//     value is ignored, so the audit trail cannot be typed in.
//   · Make routes (/fulfil, /sweep by hand) are unchanged: X-IX-Key only.
//   Needs the service binding MEMBERS → ix-members on this Worker.
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
//     publisher's TITLES-ADMIN rows. Titles: one alphabetical list (v1.1.0).
//   WRITES. Webflow v2 create / PATCH / publish with WEBFLOW_WRITE_TOKEN.
//   Every create writes self-this-item-id. A write counts only when Webflow
//   echoes the value sent (TOAST-TRUTH); the answer says written and
//   unconfirmed. Option values are written by ID, read from each schema by
//   label (never typed). Reads use WEBFLOW_TOKEN, staged.
//   ACCESS. Browser routes answer only IX_CONFIG.allowedOrigins (the portal
//   and Studio pages). Make routes (/fulfil, /sweep by hand) take X-IX-Key.
//   (v1.0.2: plus the Memberstack login check through ix-members.)
//
// IX_CONFIG (Plain text, JSON) — platform values, HC-S-1 by design
//   { "collections": { "sales": "68fbca18098fd19160cfd6d7",
//       "obligations": "68fd04367a3d8ba79eb3bf6e",
//       "publishers": "64e905038caaa2edd76842ba", "customers": "6539226238805f7127e99189",
//       "titles": "64e905038caaa2edd76842bb",
//       "newsletters": "64e905038caaa2edd76842bc", "ads": "68929c45dc27b1bb31fb4404",
//       "articles": "64e905038caaa2edd76842b5", "franchises": "68fa2e3c16639f180010d514",
//       "plans": "68b1ce556019ec55bf4727f3" },
//     "allowedOrigins": ["https://www.inbxify.com","https://inbxify.com","https://app.inbxify.com"],
//     "shapeBundleDefault": "banner>sidebar",      // HC-P-SR-8
//     "noCreativeLeadDefault": 2,                   // when a title has none
//     "paceSlack": 1,                              // HC-S-7, optional
//     "cacheSeconds": 600 }
//   (a titlesSite entry left over from v1.0.x is harmless and unused)
// SECRETS  WEBFLOW_TOKEN (CMS read), WEBFLOW_WRITE_TOKEN (CMS read+write), IX_KEY
// CRON     wrangler.toml  [triggers] crons = ["30 9 * * *"]   (05:30 Eastern in winter)
//
// HARDCODING (provisional ids, for the tracker)
//   HC-S-1  Collection ids and origins in IX_CONFIG. By design.
//   HC-S-2  Field slugs in JOIN. Same class as HC-P-DW1-2. The S0 contract.
//   HC-S-3  ADS add-type label per slot shape (SHAPE_AD_TYPE). The only way
//           to know which ADS rows fit a shape until ADS carries slot-shape.
//   HC-S-4  Name pattern SR-0001 / SR-0001-01 (SR_PAD, OB_PAD).
//   HC-S-5  Split and Pool: sends spread evenly over the run's months, the
//           remainder on the earliest months. The run is one year from the
//           start month at the frequency's step (Monthly and Every edition
//           12 months, Every other month 6, Quarterly 4), or the window,
//           or the named months, or the start month for One time.
//   HC-S-7  Behind pace: placed sends trail an even spread over the run by
//           more than IX_CONFIG.paceSlack (default 1). Was HC-P-SR-10 in the
//           portal; now here so every surface reads one answer.
//   HC-S-8  Frequency labels the code understands (FREQ). A new frequency
//           is a code change by nature: the code must know what it means.
//   HC-S-2  (v1.2.0) JOIN gains CUSTOMERS associated-titles and PRODUCT
//           LIBRARY titles. Same class: the S0 contract.
//   HC-S-12 (v1.2.0) FREQ_ORDER, the order the form lists frequencies in
//           (scoping §5A). Goes with HC-S-8.
//   HC-S-6  The "last edition of the month" rule for Missed reads
//           PUBLICATION PLAN publication-date; a title with no plan in the
//           month falls back to the calendar month end.
// ============================================================

const VERSION = '1.3.0';
const WF = 'https://api.webflow.com/v2';
const PAGE = 100, MAX_PAGES = 100, PARALLEL = 4, MAX_RETRIES = 4;
const SR_PAD = 4, OB_PAD = 2;                                        // HC-S-4

// HC-S-2 · the S0 contract. Slugs confirmed by API dump 2 Nov 2026.
const JOIN = {
  sales: { publisher: 'publisher', customer: 'customer', product: 'product', franchise: 'franchise',
           titles: 'titles-sold', status: 'status', type: 'type', placement: 'placement', frequency: 'frequency',
           week: 'week', startMonth: 'start-month', windowEnd: 'window-end', sends: 'sends',
           splitCounts: 'split-counts', months: 'run-months', enteredBy: 'entered-by', self: 'self-this-item-id' },
  ob: { publisher: 'publisher', customer: 'customer', sales: 'sales-record', title: 'title-admin',
        edition: 'edition', ad: 'ad', article: 'article', type: 'type', status: 'status', shape: 'slot-shape',
        productId: 'product-id', dueMonth: 'due-month', dueBy: 'due-by', week: 'week', audience: 'audience',
        fulfilledAt: 'fulfilled-at', makeGoodOf: 'make-good-of', enteredBy: 'entered-by', self: 'self-this-item-id' },
  ta: { publisher: 'associated-client', bundles: 'shape-bundles', lead: 'no-creative-lead', volumeDefault: 'send-volume-default' },
  plan: { ta: 'title-admin', date: 'publication-date', status: 'planning-status' },
  nl: { plan: 'publication-plan', ta: 'sector', volume: 'send-volume' },
  ad: { customer: 'associated-advertiser', titles: 'titles', type: 'add-type', status: 'status', isDefault: 'default-for-shape',
        banner: 'banner-ad-link', sidebar: 'sidebar-ad-link', splash: 'splash-ad-link--get', companion: 'companion-sidebar' },
  product: { soldBy: 'sold-by', shape: 'slot-shape', titles: 'titles' },
  customer: { titles: 'associated-titles' },                            // v1.2.0, same slug ix-issue-data reads
};
// HC-S-3 · which ADS rows fit a slot shape, by the add-type LABEL.
const SHAPE_AD_TYPE = { banner: 'Banner Ad', sidebar: 'Sidebar Ad', splash: 'Splash Ad', 'sponsor band': 'Banner Ad', 'list block': 'Text Ad' };
const STATUS = { open: 'Open', assigned: 'Assigned', fulfilled: 'Fulfilled', missed: 'Missed', cancelled: 'Cancelled' };
const SR_STATUS = { active: 'Active', ended: 'Ended' };
const PLACEMENT = { single: 'Single', mirrored: 'Mirrored', split: 'Split', pool: 'Pool' };
// HC-S-8 · the frequencies this code knows how to schedule (labels on SALES RECORDS frequency)
const FREQ = { monthly: 'Monthly', everyEdition: 'Every edition', everyOther: 'Every other month', quarterly: 'Quarterly',
               specific: 'Specific months', window: 'Window', once: 'One time' };
const TYPES = ['Paid', 'Comp'];
// v1.2.0 · the order the form shows the frequencies in (scoping §5A, T1 to T7)
const FREQ_ORDER = [FREQ.everyEdition, FREQ.monthly, FREQ.everyOther, FREQ.quarterly, FREQ.specific, FREQ.window, FREQ.once];

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
      if (p === '/run-log' && m === 'POST') { run.needKey(); return run.out(await runLog(run, await body(request)), 200); }   // v1.3.0, Scenario 114
      // ── v1.3.0 · the advertiser review page: origin + the token in the link, no login ──
      const rv = p.match(/^\/review\/([0-9a-f]{32})(?:\/(answer|transcribe|file))?$/);
      if (rv) {
        run.needOrigin();
        if (!rv[2] && m === 'GET') return run.out(await reviewGet(run, rv[1]), 200);
        if (rv[2] === 'answer' && m === 'POST') return run.out(await reviewAnswer(run, rv[1], await body(request)), 200);
        if (rv[2] === 'transcribe' && m === 'POST') return run.out(await reviewTranscribe(run, rv[1], request), 200);
        if (rv[2] === 'file' && m === 'POST') return run.out(await reviewFile(run, rv[1], request), 200);
        return run.out({ ok: false, error: 'Unknown review route.' }, 404);
      }
      // ── browser routes (origin + login) ──
      run.needOrigin();
      await run.authorize();
      if (p === '/sales' && m === 'GET') return run.out(await listSales(run, url), 200);
      if (p === '/sales' && m === 'POST') return run.out(await createSale(run, await run.body()), 200);
      if (id[1] === 'sales' && !id[3] && m === 'PATCH') return run.out(await editSale(run, id[2], await run.body()), 200);
      if (id[1] === 'sales' && id[3] === 'cancel' && m === 'POST') return run.out(await cancelSale(run, id[2]), 200);
      if (p === '/obligations' && m === 'GET') return run.out(await listObligations(run, url), 200);
      if (p === '/obligations' && m === 'POST') return run.out({ ok: false, error: 'One-off obligations are gone. Create a one-time sales record instead: POST /sales with frequency One time and sends 1.' }, 405);
      if (id[1] === 'obligations' && id[3] === 'make-good' && m === 'POST') return run.out(await makeGood(run, id[2], await run.body()), 200);
      if (id[1] === 'obligations' && id[3] === 'assign' && m === 'POST') return run.out(await assign(run, id[2], await run.body(), true), 200);
      if (id[1] === 'obligations' && id[3] === 'unassign' && m === 'POST') return run.out(await assign(run, id[2], {}, false), 200);
      if (id[1] === 'ads' && id[3] === 'default' && m === 'POST') return run.out({ ok: false, error: 'Retired in v1.3.0: the current ad is a pointer on CUSTOMERS. Use POST /ads/<id>/decide with action approve-current or make-current.' }, 410);
      if (p === '/ads' && m === 'GET') return run.out(await adsTab(run, url), 200);                           // v1.3.0
      if (p === '/ads/ask' && m === 'POST') return run.out(await ask(run, await run.body()), 200);           // v1.3.0
      if (id[1] === 'ads' && id[3] === 'decide' && m === 'POST') return run.out(await decide(run, id[2], await run.body()), 200);   // v1.3.0
      if (p === '/pool' && m === 'GET') return run.out(await pool(run, url), 200);
      if (p === '/products' && m === 'GET') return run.out(await products(run, url), 200);
      if (p === '/titles' && m === 'GET') return run.out(await titles(run, url), 200);
      if (p === '/customers' && m === 'GET') return run.out(await customers(run, url), 200);
      if (p === '/franchises' && m === 'GET') return run.out(await franchises(run, url), 200);
      if (p === '/options' && m === 'GET') return run.out(await options(run), 200);
      return run.out({ ok: false, error: 'Unknown route. See the v1.3.0 header.' }, 404);
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
  const need = ['sales', 'obligations', 'publishers', 'customers', 'titles', 'newsletters', 'ads', 'franchises', 'plans'];
  const missing = need.filter(k => !/^[0-9a-f]{24}$/.test(C[k] || ''));
  if (missing.length) throw httpErr(500, 'IX_CONFIG.collections is missing: ' + missing.join(', ') + '.');
  return cfg;
}
function preflight(request, env) {
  let cfg = null; try { cfg = loadConfig(env); } catch (e) {}
  const origin = request.headers.get('Origin') || '';
  const ok = !!cfg && (cfg.allowedOrigins || []).includes(origin);
  return new Response(null, { status: 204, headers: ok ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-IX-Key, Authorization', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' } : { 'Vary': 'Origin' } });
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
  // v1.0.2 · who is calling, from ix-members through the MEMBERS service binding
  async authorize() {
    const auth = this.request.headers.get('Authorization') || '';
    if (!/^Bearer\s+\S+/i.test(auth)) throw httpErr(401, 'Not logged in: no Memberstack token was sent.');
    if (!this.env.MEMBERS || typeof this.env.MEMBERS.fetch !== 'function') throw httpErr(500, 'The MEMBERS service binding (to ix-members) is not set on this Worker.');
    let res, j = null;
    try { res = await this.env.MEMBERS.fetch(new Request('https://ix-members/whoami', { headers: { Authorization: auth } })); j = await res.json().catch(() => null); }
    catch (e) { throw httpErr(502, 'ix-members did not answer: ' + ((e && e.message) || e)); }
    if (!res.ok || !j || !j.ok) throw httpErr(res && res.status === 401 ? 401 : 403, (j && j.error) || 'The login check failed.');
    this.who = { memberId: j.memberId, email: j.email || null, staff: !!j.staff, publishers: new Set((j.publishers || []).map(p => p.id)) };
    if (!this.who.staff && !this.who.publishers.size) throw httpErr(403, 'This login has no publisher portal access.');
  }
  allow(publisherId) {                                                // no-op on Make routes (no login)
    if (!this.who || this.who.staff) return;
    if (!publisherId || !this.who.publishers.has(publisherId)) throw httpErr(403, 'This login may not act for that publisher.');
  }
  actor() { return this.who ? String(this.who.email || this.who.memberId || '').slice(0, 120) : ''; }
  async body() { const b = await body(this.request); if (b && typeof b === 'object') b.enteredBy = this.actor(); return b; }
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
  async optMap(collId, slug) {                                        // option id → label, one schema read
    const s = await this.schema(collId);
    const f = ((s && s.fields) || []).find(x => x.slug === slug && x.type === 'Option');
    return new Map((((f || {}).validations || {}).options || []).map(o => [o.id, o.name]));
  }
  async optLabels(collId, slug) { return [...(await this.optMap(collId, slug)).values()]; }
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
      : ((b == null || b === '') ? (a == null || a === '') : String(refId(a) || a) === String(refId(b) || b));
    if (!same) bad.push(k); });
  return bad;
}

// ── sales records ────────────────────────────────────────────
async function scope(run, publisherId) {
  if (!/^[0-9a-f]{24}$/.test(publisherId || '')) throw httpErr(400, 'Missing or malformed publisher.');
  run.allow(publisherId);
  const C = run.cfg.collections;
  const tas = await run.listAll(C.titles);
  const mine = tas.filter(t => !t.isArchived && refId(fd(t)[JOIN.ta.publisher]) === publisherId);
  if (!mine.length) throw httpErr(404, 'No TITLES-ADMIN row belongs to publisher ' + publisherId + '.');
  const taIds = new Set(mine.map(t => t.id));
  return { publisherId, tas: mine, taIds, taById: new Map(mine.map(t => [t.id, t])) };
}
async function listSales(run, url) {
  const C = run.cfg.collections, S = JOIN.sales, O = JOIN.ob;
  const sc = await scope(run, url.searchParams.get('publisher'));
  const [sales, obs, custs, prods] = await Promise.all([run.listAll(C.sales), run.listAll(C.obligations), run.listAll(C.customers), run.listAll(C.franchises)]);
  const custBy = index(custs), prodBy = index(prods), taById = sc.taById;
  const obStatus = await run.optMap(C.obligations, O.status);
  const obsBySale = new Map(); obs.forEach(o => { if (o.isArchived) return; const s = refId(fd(o)[O.sales]); if (s) { if (!obsBySale.has(s)) obsBySale.set(s, []); obsBySale.get(s).push(o); } });
  const rows = [];
  for (const s of sales) {
    const f = fd(s); if (s.isArchived || refId(f[S.publisher]) !== sc.publisherId) continue;
    const mine = obsBySale.get(s.id) || [];
    const st = {}; mine.forEach(o => { const l = obStatus.get(fd(o)[O.status]) || ''; st[l] = (st[l] || 0) + 1; });
    const reached = mine.reduce((a, o) => a + (Number(fd(o)[O.audience]) || 0), 0);
    const shape = await saleShape(run, s, custBy, prodBy, taById);
    const b = boardOf(mine, obStatus);
    const live = mine.filter(o => obStatus.get(fd(o)[O.status]) !== STATUS.cancelled);
    const months = live.map(o => String(fd(o)[O.dueMonth] || '')).filter(Boolean).sort();
    rows.push(Object.assign(shape, {
      qty: b.qty, remaining: b.remaining, missedOwed: b.missed, board: b.counts,
      pace: paceOf(run, shape, mine, obStatus),
      runFrom: months[0] || shape.startMonth || null, runTo: f[S.windowEnd] ? ym(f[S.windowEnd]) : (months[months.length - 1] || null),
      sends: mine.length, delivered: st[STATUS.fulfilled] || 0, missed: st[STATUS.missed] || 0, open: st[STATUS.open] || 0,
      assigned: st[STATUS.assigned] || 0, cancelled: st[STATUS.cancelled] || 0, reached,
      endsMonth: f[S.windowEnd] ? ym(f[S.windowEnd]) : (months[months.length - 1] || null) }));
  }
  rows.sort((a, b) => b.name.localeCompare(a.name));
  return { ok: true, publisher: sc.publisherId, sales: rows };
}
// The green board (scoping §10). A slot is one send sold: not cancelled, not
// a make good. A missed send with a live make good takes the make good's
// state. qty = slots; remaining = slots not yet run (a miss counts until it
// has a make good).
function stateOf(o, obStatus, mgOf, nowYm) {
  const O = JOIN.ob, f = fd(o), l = obStatus.get(f[O.status]) || '';
  if (l === STATUS.fulfilled) return 'ran';
  if (l === STATUS.assigned) return 'planned';
  if (l === STATUS.cancelled) return 'cancelled';
  if (l === STATUS.missed) { const mg = mgOf.get(o.id); return mg ? stateOf(mg, obStatus, mgOf, nowYm) : 'missed'; }
  const due = f[O.dueBy] ? ym(f[O.dueBy]) : String(f[O.dueMonth] || '');
  return due && due <= nowYm ? 'due' : 'toCome';
}
function liveMakeGoods(obs, obStatus) {                                 // missed id → its live make good
  const O = JOIN.ob, m = new Map();
  obs.forEach(o => { const of = String(fd(o)[O.makeGoodOf] || ''); if (of && obStatus.get(fd(o)[O.status]) !== STATUS.cancelled && !o.isArchived) m.set(of, o); });
  return m;
}
function boardOf(obs, obStatus) {
  const O = JOIN.ob, nowYm = ym(new Date().toISOString()), mgOf = liveMakeGoods(obs, obStatus);
  const slots = obs.filter(o => !o.isArchived && !fd(o)[O.makeGoodOf] && obStatus.get(fd(o)[O.status]) !== STATUS.cancelled);
  const counts = { ran: 0, planned: 0, due: 0, missed: 0, toCome: 0 };
  slots.forEach(o => { const s = stateOf(o, obStatus, mgOf, nowYm); if (counts[s] !== undefined) counts[s]++; });
  return { qty: slots.length, remaining: counts.planned + counts.due + counts.missed + counts.toCome, missed: counts.missed, counts };
}
// Behind pace (HC-S-7): pool records only, Active only. Placed = ran or
// planned. Expected = slots × months elapsed ÷ months in the run.
function paceOf(run, sale, obs, obStatus) {
  const O = JOIN.ob;
  if (sale.placement !== PLACEMENT.pool || sale.status !== SR_STATUS.active) return null;
  const slots = obs.filter(o => !o.isArchived && !fd(o)[O.makeGoodOf] && obStatus.get(fd(o)[O.status]) !== STATUS.cancelled);
  if (!slots.length) return null;
  const s0 = sale.frequency === FREQ.specific && sale.months.length ? sale.months[0] : sale.startMonth;
  if (!/^\d{4}-\d{2}$/.test(s0 || '')) return null;
  const e0 = sale.windowEnd ? ym(sale.windowEnd) : slots.map(o => String(fd(o)[O.dueMonth] || '')).filter(Boolean).sort().slice(-1)[0] || s0;
  const span = Math.max(1, monthsBetween(s0, e0) + 1);
  const el = Math.min(span, Math.max(0, monthsBetween(s0, ym(new Date().toISOString())) + 1));
  const placed = slots.filter(o => [STATUS.fulfilled, STATUS.assigned].includes(obStatus.get(fd(o)[O.status]))).length;
  const expected = Math.round(slots.length * el / span);
  const slack = Number.isFinite(Number(run.cfg.paceSlack)) ? Number(run.cfg.paceSlack) : 1;
  return { placed, expected, behind: placed < expected - slack };
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
    months: parseMonths(f[S.months]), sendsBought: Number(f[S.sends]) || 0, splitCounts: parseSplit(f[S.splitCounts]), enteredBy: String(f[S.enteredBy] || '') };
}
function parseSplit(v) { if (!v) return null; try { const o = JSON.parse(v); return o && typeof o === 'object' ? o : null; } catch (e) { return null; } }
// Specific months entries: "YYYY-MM" or "YYYY-MM W1".."W4". A month may repeat
// (two sends in one month). "2027-05 W1,2027-05 W3" or ["2027-05 W1"] -> sorted list.
function parseMonths(v) {
  const list = Array.isArray(v) ? v : String(v || '').split(/[,;\n]+/);
  return list.map(x => String(x).trim().replace(/\s+/g, ' ').toUpperCase().replace(/^(\d{4}-\d{2})\s*(W[1-4])$/, '$1 $2'))
    .filter(x => /^\d{4}-(0[1-9]|1[0-2])( W[1-4])?$/.test(x)).sort();
}
const entMonth = e => String(e).slice(0, 7);
const entWeek = e => { const m = / W([1-4])$/.exec(String(e)); return m ? 'Week ' + m[1] : null; };

// The request body for create and edit:
// { publisher, customer, product, franchise?, titles:[TITLES-ADMIN ids], placement, type, frequency,
//   startMonth:"YYYY-MM", windowEnd?:"YYYY-MM-DD", months?:["YYYY-MM"], sends, week?, splitCounts?:{taId:n} }
// entered-by comes from the login, never the body.
async function validateSale(run, b, sc, cur) {
  const C = run.cfg.collections, S = JOIN.sales;
  const err = m => { throw httpErr(400, m); };
  if (!/^[0-9a-f]{24}$/.test(b.customer || '')) err('customer is required.');
  // v1.2.0 · the customer must be this publisher's (checked on create, and on edit when it changes)
  if (!cur || cur.customer !== b.customer) {
    const mine = await customerIds(run, sc);
    if (!mine.has(b.customer)) throw httpErr(403, 'That customer is not one of this publisher\'s customers.');
  }
  if (!/^[0-9a-f]{24}$/.test(b.product || '')) err('product is required.');
  const titles = [...new Set((Array.isArray(b.titles) ? b.titles : []).filter(id => /^[0-9a-f]{24}$/.test(id)))];
  if (!titles.length) err('At least one title is required.');
  const bad = titles.filter(id => !sc.taIds.has(id)); if (bad.length) err('Titles not owned by this publisher: ' + bad.join(', ') + '.');
  // type (C4)
  const type = String(b.type || 'Paid').trim();
  if (keyOf(type) === 'trade') err('Trade is no longer a sale type. Use Paid or Comp.');
  const typeLabel = TYPES.find(t => keyOf(t) === keyOf(type)); if (!typeLabel) err('type must be Paid or Comp.');
  if (!(await run.optLabels(C.sales, S.type)).some(l => keyOf(l) === keyOf(typeLabel))) throw httpErr(500, 'SALES RECORDS type has no "' + typeLabel + '" option.');
  // frequency (C3)
  const frequency = Object.values(FREQ).find(x => keyOf(x) === keyOf(b.frequency || FREQ.monthly));
  if (!frequency) err('frequency must be one of: ' + Object.values(FREQ).join(', ') + '.');
  if (!(await run.optLabels(C.sales, S.frequency)).some(l => keyOf(l) === keyOf(frequency))) throw httpErr(500, 'SALES RECORDS frequency has no "' + frequency + '" option yet. Add it in Webflow.');
  const placement = titles.length === 1 ? PLACEMENT.single : String(b.placement || PLACEMENT.mirrored);
  if (!Object.values(PLACEMENT).includes(placement)) err('placement must be Single, Mirrored, Split or Pool.');
  let months = [], startMonth = String(b.startMonth || '');
  let sends = Number(b.sends);
  if (frequency === FREQ.specific) {
    months = parseMonths(b.months);
    if (!months.length) err('Specific months needs months: a list of YYYY-MM.');
    startMonth = entMonth(months[0]);
    // Single and Mirrored: one send per named month on each title
    if (placement === PLACEMENT.single || placement === PLACEMENT.mirrored) {
      if (b.sends == null || b.sends === '') sends = months.length;
      if (sends !== months.length) err('Specific months: ' + months.length + (months.length === 1 ? ' month' : ' months') + ' named, sends is ' + sends + '. They must match.');
    }
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(startMonth)) err('startMonth must be YYYY-MM.');
  if (!Number.isInteger(sends) || sends < 1) err('sends must be a whole number, 1 or more.');
  if (frequency === FREQ.window) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.windowEnd || '')) err('windowEnd (YYYY-MM-DD) is required for a Window.');
    if (ym(b.windowEnd) < startMonth) err('windowEnd is before the start month.');
  }
  let split = null;
  if (placement === PLACEMENT.split) {
    split = b.splitCounts && typeof b.splitCounts === 'object' ? b.splitCounts : null;
    if (!split) err('splitCounts {titleId: n} is required for Split.');
    const sum = titles.reduce((a, id) => a + (Number(split[id]) || 0), 0);
    if (sum !== sends) err('splitCounts add up to ' + sum + ', sends is ' + sends + '.');
    split = Object.fromEntries(titles.map(id => [id, Number(split[id]) || 0]));
  }
  const prod = await run.getItem(C.franchises, b.product); if (!prod) err('product is not a PRODUCT LIBRARY row.');
  const soldBy = refIds(fd(prod)[JOIN.product.soldBy]);
  if (!soldBy.some(id => sc.taIds.has(id))) err('This publisher does not sell "' + fd(prod).name + '" (sold-by).');
  const shape = await run.optLabel(C.franchises, JOIN.product.shape, fd(prod)[JOIN.product.shape]);
  if (!shape) run.warn('PRODUCT LIBRARY "' + fd(prod).name + '" has no slot-shape; its obligations carry none.');
  if (shape === 'sponsor band' && !/^[0-9a-f]{24}$/.test(b.franchise || '')) err('A franchise sponsor needs a franchise.');
  if (b.franchise && placement !== PLACEMENT.single) err('A franchise sponsor is sold on one title.');
  // v1.2.0 · the franchise must run on the sold title (checked on create, and on edit when it or the title changes)
  if (b.franchise && (!cur || cur.franchise !== b.franchise || cur.title !== titles[0])) {
    const fr = await run.getItem(C.franchises, b.franchise);
    if (!fr) err('franchise is not a PRODUCT LIBRARY row.');
    if (!refIds(fd(fr)[JOIN.product.titles]).includes(titles[0])) err('"' + fd(fr).name + '" does not run on that title (PRODUCT LIBRARY titles).');
  }
  return { titles, sends, placement, frequency, type: typeLabel, months, startMonth, split, shape, prod };
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
    [S.status]: await run.optId(C.sales, S.status, SR_STATUS.active), [S.type]: await run.optId(C.sales, S.type, v.type),
    [S.placement]: await run.optId(C.sales, S.placement, v.placement), [S.frequency]: await run.optId(C.sales, S.frequency, v.frequency),
    [S.week]: await run.optId(C.sales, S.week, b.week || 'Any week'), [S.startMonth]: v.startMonth, [S.sends]: v.sends,
    [S.enteredBy]: String(b.enteredBy || '').slice(0, 120),
  };
  if (b.franchise) fields[S.franchise] = b.franchise;
  if (v.frequency === FREQ.window) fields[S.windowEnd] = b.windowEnd + 'T00:00:00.000Z';
  if (v.frequency === FREQ.specific) fields[S.months] = v.months.join(',');
  if (v.split) fields[S.splitCounts] = JSON.stringify(v.split);
  const w = await run.create(C.sales, fields);
  const gen = await generate(run, w.id, name, Object.assign({}, b, v, { publisher: sc.publisherId }), [], 0);
  return { ok: true, id: w.id, name, unconfirmed: w.unconfirmed, obligations: gen };
}
async function editSale(run, id, b) {
  const C = run.cfg.collections, S = JOIN.sales, O = JOIN.ob;
  const s = await run.getItem(C.sales, id); if (!s) throw httpErr(404, 'Sales record not found.');
  const sc = await scope(run, refId(fd(s)[S.publisher]));               // the record's own publisher, never the page's
  if (b.publisher && b.publisher !== sc.publisherId) throw httpErr(403, 'This sales record belongs to another publisher.');
  const cur = fd(s);
  if ((await run.optLabel(C.sales, S.status, cur[S.status])) === SR_STATUS.ended) throw httpErr(409, 'This sales record has ended. Start a new one.');
  const curFreq = await run.optLabel(C.sales, S.frequency, cur[S.frequency]);
  const merged = Object.assign({
    customer: refId(cur[S.customer]), product: refId(cur[S.product]), franchise: refId(cur[S.franchise]) || '', titles: refIds(cur[S.titles]),
    placement: await run.optLabel(C.sales, S.placement, cur[S.placement]), type: await run.optLabel(C.sales, S.type, cur[S.type]),
    frequency: curFreq, week: await run.optLabel(C.sales, S.week, cur[S.week]),
    startMonth: cur[S.startMonth], windowEnd: cur[S.windowEnd] ? String(cur[S.windowEnd]).slice(0, 10) : '', sends: cur[S.sends],
    months: parseMonths(cur[S.months]), splitCounts: parseSplit(cur[S.splitCounts]),
  }, b);
  if (Array.isArray(b.months) && (b.sends == null || b.sends === '')) merged.sends = null;   // Specific months: sends follows the months
  const v = await validateSale(run, merged, sc, { customer: refId(cur[S.customer]), franchise: refId(cur[S.franchise]) || '', title: refIds(cur[S.titles])[0] || null });
  const obStatus = await run.optMap(C.obligations, O.status);
  const obs = (await run.listAll(C.obligations)).filter(o => !o.isArchived && refId(fd(o)[O.sales]) === id);
  // C2: a placed send keeps its customer and product, so neither changes while one is placed
  const placed = obs.filter(o => obStatus.get(fd(o)[O.status]) === STATUS.assigned);
  if (placed.length && (merged.customer !== refId(cur[S.customer]) || merged.product !== refId(cur[S.product])))
    throw httpErr(409, placed.length + ' send' + (placed.length === 1 ? ' is' : 's are') + ' placed in an edition (' + placed.map(o => fd(o).name).join(', ') +
      '). The customer and product cannot change while a send is placed. Unplace it in the Revenue Picker, or cancel this record and start a new one.');
  const fields = {
    [S.customer]: merged.customer, [S.product]: merged.product, [S.titles]: v.titles, [S.franchise]: merged.franchise || null,
    [S.type]: await run.optId(C.sales, S.type, v.type), [S.placement]: await run.optId(C.sales, S.placement, v.placement),
    [S.frequency]: await run.optId(C.sales, S.frequency, v.frequency), [S.week]: await run.optId(C.sales, S.week, merged.week || 'Any week'),
    [S.startMonth]: v.startMonth, [S.sends]: v.sends, [S.splitCounts]: v.split ? JSON.stringify(v.split) : '',
    [S.months]: v.frequency === FREQ.specific ? v.months.join(',') : '',
    [S.windowEnd]: v.frequency === FREQ.window ? merged.windowEnd + 'T00:00:00.000Z' : null,
  };
  const w = await run.patch(C.sales, id, fields);
  // Open schedule sends go (SR-10). Make goods stay: they are owed for a miss, not part of the schedule.
  const cancelledId = await run.optId(C.obligations, O.status, STATUS.cancelled);
  let dropped = 0;
  for (const o of obs) if (obStatus.get(fd(o)[O.status]) === STATUS.open && !fd(o)[O.makeGoodOf]) {
    await run.patch(C.obligations, o.id, { [O.status]: cancelledId }); dropped++; }
  // Standing sends (placed, ran, missed) keep their slot in the new schedule.
  const standing = obs.filter(o => !fd(o)[O.makeGoodOf] && [STATUS.assigned, STATUS.fulfilled, STATUS.missed].includes(obStatus.get(fd(o)[O.status])));
  const gen = await generate(run, id, String(cur.name || ''), Object.assign({}, merged, v, { publisher: sc.publisherId, enteredBy: b.enteredBy }), standing, maxSeq(obs, String(cur.name || '')));
  return { ok: true, id, unconfirmed: w.unconfirmed, keptStanding: standing.length, openCancelled: dropped, obligations: gen };
}
function maxSeq(obs, saleName) {                                        // highest -NN on this record, so names never repeat
  const re = new RegExp('^' + saleName.replace(/[-]/g, '\\-') + '-(\\d+)$');
  return obs.reduce((m, o) => { const x = re.exec(String(fd(o).name || '')); return x ? Math.max(m, Number(x[1])) : m; }, 0);
}
async function cancelSale(run, id) {
  const C = run.cfg.collections, S = JOIN.sales, O = JOIN.ob;
  const s = await run.getItem(C.sales, id); if (!s) throw httpErr(404, 'Sales record not found.');
  run.allow(refId(fd(s)[S.publisher]));
  const openId = await run.optId(C.obligations, O.status, STATUS.open), asgId = await run.optId(C.obligations, O.status, STATUS.assigned);
  const cancelledId = await run.optId(C.obligations, O.status, STATUS.cancelled);
  const obs = (await run.listAll(C.obligations)).filter(o => refId(fd(o)[O.sales]) === id);
  let n = 0;
  for (const o of obs) if ([openId, asgId].includes(fd(o)[O.status])) { await run.patch(C.obligations, o.id, { [O.status]: cancelledId }); n++; }
  const w = await run.patch(C.sales, id, { [S.status]: await run.optId(C.sales, S.status, SR_STATUS.ended) });
  return { ok: true, id, cancelled: n, unconfirmed: w.unconfirmed };
}

// ── generation ───────────────────────────────────────────────
// The schedule: every send sold as a slot {title, dueMonth}. Pool slots
// have no title until placed.
async function schedule(run, v) {
  const C = run.cfg.collections;
  const [y, m] = v.startMonth.split('-').map(Number);
  const monthAt = i => { const d = new Date(Date.UTC(y, m - 1 + i, 1)); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'); };
  const step = { [FREQ.everyOther]: 2, [FREQ.quarterly]: 3 }[v.frequency] || 1;
  const windowMonths = v.frequency === FREQ.window ? Math.max(1, monthsBetween(v.startMonth, ym(v.windowEnd)) + 1) : null;
  let plans = null;
  const plansOf = async taId => { if (!plans) plans = (await run.listAll(C.plans)).filter(p => !p.isArchived);
    return plans.filter(p => refId(fd(p)[JOIN.plan.ta]) === taId && ym(fd(p)[JOIN.plan.date]) >= v.startMonth)
      .sort((a, b) => String(fd(a)[JOIN.plan.date]).localeCompare(String(fd(b)[JOIN.plan.date]))); };
  // one title's own series of n sends (Single, Mirrored)
  const series = async (taId, n) => {
    const out = [];
    const mine = v.frequency === FREQ.everyEdition ? await plansOf(taId) : null;
    for (let i = 0; i < n; i++) {
      let due;
      if (v.frequency === FREQ.once) due = v.startMonth;
      else if (v.frequency === FREQ.specific) due = v.months[i] || v.months[v.months.length - 1];
      else if (v.frequency === FREQ.window) due = monthAt(Math.floor(i * windowMonths / n));
      else if (v.frequency === FREQ.everyEdition) {
        if (mine[i]) due = ym(fd(mine[i])[JOIN.plan.date]);
        else { run.warn('Every edition: a title has fewer planned editions than sends; the rest fall monthly.'); due = monthAt(i); }
      } else due = monthAt(i * step);
      out.push(due);
    }
    return out;
  };
  // the run's months for a spread (Split, Pool), HC-S-5
  const runMonths = () => {
    if (v.frequency === FREQ.once) return [v.startMonth];
    if (v.frequency === FREQ.specific) return v.months.slice();
    if (v.frequency === FREQ.window) return Array.from({ length: windowMonths }, (_, i) => monthAt(i));
    return Array.from({ length: Math.ceil(12 / step) }, (_, i) => monthAt(i * step));
  };
  const spread = n => { const r = runMonths(); return Array.from({ length: n }, (_, i) => r[Math.floor(i * r.length / n)]); };
  const slots = [];
  if (v.placement === PLACEMENT.single || v.placement === PLACEMENT.mirrored) {
    const ts = v.placement === PLACEMENT.single ? [v.titles[0]] : v.titles;
    for (const t of ts) (await series(t, v.sends)).forEach(d => slots.push({ title: t, dueMonth: d }));
  } else if (v.placement === PLACEMENT.split) {
    v.titles.forEach(t => spread(Number(v.split[t]) || 0).forEach(d => slots.push({ title: t, dueMonth: d })));
  } else spread(v.sends).forEach(d => slots.push({ title: null, dueMonth: d }));
  slots.forEach(s => { s.week = entWeek(s.dueMonth); s.dueMonth = entMonth(s.dueMonth); });   // a per-send week overrides the record's week
  slots.sort((a, b) => a.dueMonth.localeCompare(b.dueMonth) || String(a.week || '').localeCompare(String(b.week || '')) || String(a.title || '').localeCompare(String(b.title || '')));
  return slots;
}
// Creates the slots not already held by a standing send. seq = the highest
// number already used on the record.
async function generate(run, saleId, saleName, v, standing, seq) {
  const C = run.cfg.collections, O = JOIN.ob;
  const slots = await schedule(run, v);
  const pool = v.placement === PLACEMENT.pool;
  const free = slots.map(s => Object.assign({ taken: false }, s));
  for (const s of free) s.weekId = s.week ? await run.optId(C.obligations, O.week, s.week) : null;
  const keyOfSlot = t => pool ? '' : (t || '');
  standing.slice().sort((a, b) => String(fd(a)[O.dueMonth] || '').localeCompare(String(fd(b)[O.dueMonth] || ''))).forEach(o => {
    const k = keyOfSlot(refId(fd(o)[O.title])), d = String(fd(o)[O.dueMonth] || '');
    const cands = free.filter(s => !s.taken && keyOfSlot(s.title) === k);
    if (!cands.length) return;                                         // a send on a title no longer sold: history, holds no slot
    const w = String(fd(o)[O.week] || '');
    let best = cands.find(s => s.dueMonth === d && s.weekId && s.weekId === w) || cands.find(s => s.dueMonth === d);
    if (!best) best = cands.slice().sort((a, b) => Math.abs(monthsBetween(a.dueMonth, d)) - Math.abs(monthsBetween(b.dueMonth, d)) || a.dueMonth.localeCompare(b.dueMonth))[0];
    best.taken = true;
  });
  const todo = free.filter(s => !s.taken);
  if (!todo.length) return [];
  const ids = {
    type: await run.optId(C.obligations, O.type, v.type || 'Paid'), open: await run.optId(C.obligations, O.status, STATUS.open),
    week: await run.optId(C.obligations, O.week, v.week || 'Any week'),
    shape: v.shape ? await run.optId(C.obligations, O.shape, v.shape) : null,
  };
  const out = []; let n = seq || 0;
  for (const r of todo) {
    n++;
    const name = saleName + '-' + String(n).padStart(OB_PAD, '0');
    const fields = { name, slug: name.toLowerCase(), [O.publisher]: v.publisher, [O.customer]: v.customer, [O.sales]: saleId,
      [O.type]: ids.type, [O.status]: ids.open, [O.week]: r.weekId || ids.week, [O.productId]: v.product, [O.enteredBy]: String(v.enteredBy || '').slice(0, 120),
      [O.dueMonth]: r.dueMonth };
    if (r.title) fields[O.title] = r.title;
    if (ids.shape) fields[O.shape] = ids.shape;
    if (v.frequency === FREQ.window) fields[O.dueBy] = v.windowEnd + 'T00:00:00.000Z';
    const w = await run.create(C.obligations, fields);
    out.push({ id: w.id, name, title: r.title, dueMonth: r.dueMonth, unconfirmed: w.unconfirmed });
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
  const obStatus = await run.optMap(C.obligations, O.status);
  const mine = obs.filter(o => !o.isArchived && refId(fd(o)[O.publisher]) === sc.publisherId);
  const mgOf = liveMakeGoods(mine, obStatus), nowYm = ym(new Date().toISOString());
  const flags = await noCreativeFlags(run, sc, obs, ads);
  const out = [];
  for (const o of mine) {
    const s = await obShape(run, o, custBy, sc.taById, nlBy);
    if (q('title') && s.titleId !== q('title')) continue;
    if (q('month') && s.dueMonth !== q('month')) continue;
    if (q('customer') && s.customerId !== q('customer')) continue;
    if (q('sales') && s.salesId !== q('sales')) continue;
    if (q('status') && keyOf(s.status) !== keyOf(q('status'))) continue;
    s.state = stateOf(o, obStatus, mgOf, nowYm);                       // ran | planned | due | missed | toCome | cancelled (a made-good miss takes its make good's state)
    s.madeGoodBy = mgOf.has(o.id) ? mgOf.get(o.id).id : null;
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
// Make good (C8): one live make good per missed send. If the earlier make
// good was cancelled, a new one is allowed and is named -MG2, -MG3, …
async function makeGood(run, id, b) {
  const C = run.cfg.collections, O = JOIN.ob;
  const o = await run.getItem(C.obligations, id); if (!o) throw httpErr(404, 'Obligation not found.');
  const f = fd(o);
  run.allow(refId(f[O.publisher]));
  if (f[O.status] !== await run.optId(C.obligations, O.status, STATUS.missed)) throw httpErr(409, 'Only a Missed send can be made good.');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(b.dueMonth || '')) throw httpErr(400, 'dueMonth must be YYYY-MM.');
  if (b.dueMonth < ym(new Date().toISOString())) throw httpErr(400, 'A make good cannot be due in a month that has already passed.');
  const obStatus = await run.optMap(C.obligations, O.status);
  const all = (await run.listAll(C.obligations)).filter(x => !x.isArchived && String(fd(x)[O.makeGoodOf] || '') === id);
  const live = all.find(x => obStatus.get(fd(x)[O.status]) !== STATUS.cancelled);
  if (live) throw httpErr(409, String(f.name || id) + ' already has a make good (' + String(fd(live).name || live.id) + ').');
  const base = String(f.name || id) + '-MG';
  const used = new Set(all.map(x => String(fd(x).name || '')));
  let name = base, k = 1; while (used.has(name)) { k++; name = base + k; }
  const fields = { name, slug: name.toLowerCase(), [O.publisher]: refId(f[O.publisher]), [O.customer]: refId(f[O.customer]), [O.title]: refId(f[O.title]) || null,
    [O.type]: f[O.type], [O.status]: await run.optId(C.obligations, O.status, STATUS.open), [O.shape]: f[O.shape] || null, [O.week]: f[O.week],
    [O.productId]: f[O.productId] || '', [O.dueMonth]: b.dueMonth, [O.makeGoodOf]: id, [O.enteredBy]: String(b.enteredBy || '').slice(0, 120) };
  if (refId(f[O.sales])) fields[O.sales] = refId(f[O.sales]);
  const w = await run.create(C.obligations, fields);
  return { ok: true, id: w.id, name, replaces: id, unconfirmed: w.unconfirmed };
}
// assign: { title, edition?, ad?, article? }   unassign: nothing
// A directed send (Single, Mirrored, Split) stays on its own title; only a
// pool send takes a title here.
async function assign(run, id, b, on) {
  const C = run.cfg.collections, O = JOIN.ob, S = JOIN.sales;
  const o = await run.getItem(C.obligations, id); if (!o) throw httpErr(404, 'Obligation not found.');
  const f = fd(o);
  run.allow(refId(f[O.publisher]));
  const openId = await run.optId(C.obligations, O.status, STATUS.open), asgId = await run.optId(C.obligations, O.status, STATUS.assigned);
  const s = await run.getItem(C.sales, refId(f[O.sales]));
  const pool = !!s && (await run.optLabel(C.sales, S.placement, fd(s)[S.placement])) === PLACEMENT.pool;
  if (on) {
    if (f[O.status] !== openId && f[O.status] !== asgId) throw httpErr(409, 'Only an Open obligation can be assigned.');
    const own = refId(f[O.title]);
    if (!pool && own && b.title && b.title !== own) throw httpErr(409, 'This send was sold for one title and cannot move to another. Edit the sales record to change titles.');
    const title = pool ? (b.title || own) : (own || b.title);
    if (!/^[0-9a-f]{24}$/.test(title || '')) throw httpErr(400, 'A pool send needs a title when it is assigned.');
    if (run.who) { const sc = await scope(run, refId(f[O.publisher])); if (!sc.taIds.has(title)) throw httpErr(400, 'That title does not belong to this obligation\'s publisher.'); }
    const fields = { [O.status]: asgId, [O.title]: title };
    if (b.edition) fields[O.edition] = b.edition; if (b.ad) fields[O.ad] = b.ad; if (b.article) fields[O.article] = b.article;
    const w = await run.patch(C.obligations, id, fields);
    return { ok: true, id, status: STATUS.assigned, unconfirmed: w.unconfirmed };
  }
  if (f[O.status] !== asgId) throw httpErr(409, 'Only an Assigned obligation can be unassigned.');
  const fields = { [O.status]: openId, [O.edition]: null, [O.ad]: null, [O.article]: null };
  if (pool) fields[O.title] = null;                                    // a pool send loses its title again; a directed one keeps it
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
  const reviews = await expireReviews(run).catch(e => { run.warn('Review expiry failed: ' + e.message); return null; });   // v1.3.0
  return { ok: true, at: new Date().toISOString(), missed, noCreative: flags.length, reviews };
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
// setDefaultAd removed in v1.3.0 (route retired, see header)
async function pool(run, url) {
  const C = run.cfg.collections, O = JOIN.ob, S = JOIN.sales;
  const id = (url.searchParams.get('sales') || '').trim(); if (!/^[0-9a-f]{24}$/.test(id)) throw httpErr(400, 'Missing sales (SALES RECORD id).');
  const s = await run.getItem(C.sales, id); if (!s) throw httpErr(404, 'Sales record not found.');
  const sc = await scope(run, refId(fd(s)[S.publisher]));
  const [custs, prods] = await Promise.all([run.listAll(C.customers), run.listAll(C.franchises)]);
  const sale = await saleShape(run, s, index(custs), index(prods), sc.taById);
  const obStatus = await run.optMap(C.obligations, O.status);
  const obs = (await run.listAll(C.obligations)).filter(o => refId(fd(o)[O.sales]) === id && !o.isArchived);
  const live = obs.filter(o => obStatus.get(fd(o)[O.status]) !== STATUS.cancelled);
  const left = live.filter(o => obStatus.get(fd(o)[O.status]) === STATUS.open).length;
  const months = live.map(o => String(fd(o)[O.dueMonth] || '')).filter(Boolean).sort();
  const endMonth = fd(s)[S.windowEnd] ? ym(fd(s)[S.windowEnd]) : months[months.length - 1];
  const monthsLeft = endMonth ? Math.max(1, monthsBetween(ym(new Date().toISOString()), endMonth) + 1) : 1;
  const spread = {}; refIds(fd(s)[S.titles]).forEach(t => { spread[t] = 0; });
  live.forEach(o => { const t = refId(fd(o)[O.title]); if (t && obStatus.get(fd(o)[O.status]) !== STATUS.open) spread[t] = (spread[t] || 0) + 1; });
  // HC-P-SR-4 · soft cap per title dropped 4 Nov (v1.1.2): Behind pace and the spread show lopsided placement
  return { ok: true, sales: id, sends: live.length, left, monthsLeft, perMonthNeeded: Math.round(left / monthsLeft * 10) / 10, endMonth,
    pace: paceOf(run, sale, obs, obStatus),
    spread: Object.keys(spread).map(t => ({ titleId: t, title: sc.taById.get(t) ? String(fd(sc.taById.get(t)).name || '') : null, placed: spread[t] })) };
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
async function titles(run, url) {                                     // C5 · one alphabetical list, no grouping (SR-7)
  const sc = await scope(run, url.searchParams.get('publisher'));
  const list = sc.tas.map(t => ({ id: t.id, name: String(fd(t).name || '') })).sort((a, b) => a.name.localeCompare(b.name));
  return { ok: true, publisher: sc.publisherId, titleCount: list.length, titles: list };
}

// ── v1.2.0 · the form's lists ────────────────────────────────
// A customer is the publisher's when CUSTOMERS associated-titles names one
// of its titles, a live ADS row of the customer names one, or one of its
// sales records names the customer.
async function customerIds(run, sc) {
  const C = run.cfg.collections, A = JOIN.ad;
  const [custs, ads, sales] = await Promise.all([run.listAll(C.customers), run.listAll(C.ads), run.listAll(C.sales)]);
  const ids = new Set();
  custs.forEach(c => { if (!c.isArchived && refIds(fd(c)[JOIN.customer.titles]).some(t => sc.taIds.has(t))) ids.add(c.id); });
  ads.forEach(a => { if (a.isDraft || a.isArchived) return; const f = fd(a);
    if (refIds(f[A.titles]).some(t => sc.taIds.has(t))) { const c = refIds(f[A.customer])[0]; if (c) ids.add(c); } });
  sales.forEach(s => { const f = fd(s); if (!s.isArchived && refId(f[JOIN.sales.publisher]) === sc.publisherId && refId(f[JOIN.sales.customer])) ids.add(refId(f[JOIN.sales.customer])); });
  return ids;
}
async function customers(run, url) {
  const C = run.cfg.collections;
  const sc = await scope(run, url.searchParams.get('publisher'));
  const ids = await customerIds(run, sc);
  const rows = (await run.listAll(C.customers)).filter(c => ids.has(c.id) && !c.isArchived && !c.isDraft)
    .map(c => ({ id: c.id, name: String(fd(c).name || '') })).sort((a, b) => a.name.localeCompare(b.name));
  if (!rows.length) run.warn('No CUSTOMERS row is linked to this publisher\'s titles (associated-titles), its ads or its sales records.');
  return { ok: true, publisher: sc.publisherId, customers: rows };
}
async function franchises(run, url) {
  const C = run.cfg.collections;
  const sc = await scope(run, url.searchParams.get('publisher'));
  const rows = (await run.listAll(C.franchises)).filter(p => !p.isArchived && !p.isDraft && !fd(p)[JOIN.product.shape])
    .map(p => ({ p, t: refIds(fd(p)[JOIN.product.titles]).filter(id => sc.taIds.has(id)) })).filter(x => x.t.length)
    .map(x => ({ id: x.p.id, name: String(fd(x.p).name || ''), titleIds: x.t })).sort((a, b) => a.name.localeCompare(b.name));
  if (!rows.length) run.warn('No PRODUCT LIBRARY franchise row names any of this publisher\'s titles in titles.');
  return { ok: true, publisher: sc.publisherId, franchises: rows };
}
async function options(run) {
  const C = run.cfg.collections, S = JOIN.sales;
  const haveF = await run.optLabels(C.sales, S.frequency), haveT = await run.optLabels(C.sales, S.type);
  const frequencies = FREQ_ORDER.filter(f => haveF.some(l => keyOf(l) === keyOf(f)));
  const missing = FREQ_ORDER.filter(f => !frequencies.includes(f));
  if (missing.length) run.warn('SALES RECORDS frequency has no option for: ' + missing.join(', ') + '.');
  return { ok: true, frequencies, weeks: await run.optLabels(C.sales, S.week), types: TYPES.filter(t => haveT.some(l => keyOf(l) === keyOf(t))) };
}

// ════════════════════════════════════════════════════════════════
// v1.3.0 · THE PORTAL'S ADS TAB, THE ADVERTISER REVIEW PAGE, RUN LOG
// ════════════════════════════════════════════════════════════════
// HC-P-PP8-3 · the four portal shapes: CUSTOMERS pointer, ADS approval field, the key Scenario G's approveAd
//              takes (client-manager HC-P-CM124-3), the key Scenario 114 takes, and the PRODUCT LIBRARY slot-shape label.
const ADS_TAB = {
  shapes: {
    banner:  { label: 'Banner',   pointer: 'current-banner-ad',  approval: 'banner-approval',  gKey: 'bannerApproval',  k114: 'currentBannerAd',  slot: 'banner' },
    sidebar: { label: 'Sidebar',  pointer: 'current-sidebar-ad', approval: 'sidebar-approval', gKey: 'sidebarApproval', k114: 'currentSidebarAd', slot: 'sidebar' },
    splash:  { label: 'Splash',   pointer: 'current-splash-ad',  approval: 'splash-approval',  gKey: 'splashApproval',  k114: 'currentSplashAd',  slot: 'splash' },
    text:    { label: 'Text ad',  pointer: 'current-text-ad',    approval: 'text-ad-approval', gKey: 'textAdApproval',  k114: 'currentTextAd',    slot: 'list block' },
  },
  approval: { approved: 'Approved', pending: 'Pending', sentBack: 'Sent back' },     // HC-P-PP8-4 · ADS approval option labels
  runLog: 'run-log',                                                                  // HC-P-PP8-2 · ADS Run Log (JSON per shape)
  pointerCutoff: '2026-11-05',                                                        // HC-P-PP8-5 · rows older than this with no Run Log ran before the log existed
};
const SHAPE_KEYS = Object.keys(ADS_TAB.shapes);
// PUBLISHER REVIEWS (6af25a80c75922aa147e85a9, created 9 Nov 2026). The two Reference slugs are read from the schema.
const RV = { action: 'action', status: 'status', token: 'token', expires: 'expires', sentBy: 'sent-by', note: 'send-back-note', data: 'review-data', self: 'self-this-item-id' };
const RV_ACTION = { ask: 'Ask the advertiser', back: 'Send back', approveCurrent: 'Approve and make current', approveHold: 'Approve and hold',
                    makeCurrent: 'Make current', restoreHold: 'Restore and hold', restoreReview: 'Restore for review' };
const RV_STATUS = { open: 'Open', answered: 'Answered', expired: 'Expired', done: 'Done' };
const DECIDE = { 'approve-current': RV_ACTION.approveCurrent, 'approve-hold': RV_ACTION.approveHold, 'make-current': RV_ACTION.makeCurrent,
                 'restore-hold': RV_ACTION.restoreHold, 'restore-review': RV_ACTION.restoreReview, 'send-back': RV_ACTION.back };
// HC-P-PP8-6 · the review link's settings and words. IX_CONFIG.review may override linkDays, staleMonths, pageUrl.
const REVIEW_DEFAULTS = { linkDays: 14, staleMonths: 6, pageUrl: 'https://www.inbxify.com/review', maxAudioBytes: 8 * 1024 * 1024, maxFileBytes: 20 * 1024 * 1024,
  transcribeModel: '@cf/openai/whisper-large-v3-turbo', summaryModel: 'claude-haiku-4-5' };
const REVIEW_WORDS = {
  subject: (title) => 'Please take a look at your ads for ' + title,
  message: (o) => 'Hi,\n\nYour ' + (o.count === 1 ? 'ad' : o.count + ' ads') + ' for ' + o.customer + ' ' + (o.count === 1 ? 'is' : 'are') + ' ready for your OK. Open this link, approve each one or tell me what to change:\n\n' + o.link +
                  '\n\nThe link works until ' + o.until + '.\n\nThanks,\n' + o.person + '\n' + o.company,
};
const PUB_FIELDS = { person: 'Contact Name', email: 'Business Email', logo: 'Publisher Logo' };       // PUBLISHERS display names, slugs read from the schema

function reviewCfg(run) { return Object.assign({}, REVIEW_DEFAULTS, (run.cfg.review && typeof run.cfg.review === 'object') ? run.cfg.review : {}); }
function needCollection(run, key, what) {
  const id = (run.cfg.collections || {})[key];
  if (!/^[0-9a-f]{24}$/.test(id || '')) throw httpErr(500, 'IX_CONFIG.collections.' + key + ' is missing (' + what + ').');
  return id;
}
function needHook(run, key, what) {
  const u = ((run.cfg.webhooks || {})[key] || '').trim();
  if (!/^https:\/\/hook\./.test(u)) throw httpErr(500, 'IX_CONFIG.webhooks.' + key + ' is missing (' + what + ').');
  return u;
}
async function slugByName(run, collId, displayName, type) {
  const s = await run.schema(collId);
  const f = ((s && s.fields) || []).find(x => keyOf(x.displayName) === keyOf(displayName) && (!type || x.type === type));
  if (!f) throw httpErr(500, 'Collection ' + collId + ' has no field named "' + displayName + '".');
  return f.slug;
}
async function refSlugTo(run, collId, targetCollId) {                 // the Reference field on collId that points at targetCollId
  const s = await run.schema(collId);
  const f = ((s && s.fields) || []).find(x => x.type === 'Reference' && ((x.validations || {}).collectionId === targetCollId));
  if (!f) throw httpErr(500, 'Collection ' + collId + ' has no Reference field to ' + targetCollId + '.');
  return f.slug;
}
function parseData(v) { if (!v) return {}; try { const o = JSON.parse(v); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
function iso(d) { return (d || new Date()).toISOString(); }
function dayOf(v) { return String(v || '').slice(0, 10); }
function monthsAgo(day) { if (!/^\d{4}-\d{2}-\d{2}/.test(day || '')) return null; return monthsBetween(day.slice(0, 7), new Date().toISOString().slice(0, 7)); }
function randomToken() { const b = new Uint8Array(16); crypto.getRandomValues(b); return [...b].map(x => x.toString(16).padStart(2, '0')).join(''); }

// ── reading ix-issue-data through the ISSUE_DATA service binding ──
async function issueData(run, path) {
  const key = run.env.ISSUE_DATA_KEY || run.env.IX_KEY;
  if (!run.env.ISSUE_DATA || typeof run.env.ISSUE_DATA.fetch !== 'function') throw httpErr(500, 'The ISSUE_DATA service binding (to ix-issue-data) is not set on this Worker.');
  if (!key) throw httpErr(500, 'ISSUE_DATA_KEY (ix-issue-data\'s IX_SERVICE_KEY) is not set on this Worker.');
  let res, j = null;
  try { res = await run.env.ISSUE_DATA.fetch(new Request('https://ix-issue-data' + path, { headers: { 'X-IX-Key': key } })); j = await res.json().catch(() => null); }
  catch (e) { throw httpErr(502, 'ix-issue-data did not answer: ' + ((e && e.message) || e)); }
  if (!res.ok || !j || !j.ok) throw httpErr(502, 'ix-issue-data said: ' + ((j && j.error) || ('HTTP ' + res.status)));
  (j.problems || []).forEach(p => run.warn('ix-issue-data: ' + p));
  return j;
}
async function versionsFor(run, customerIds) {                        // { customerId: answer } for many customers, 200 per call
  const ids = [...customerIds], out = {};
  for (let i = 0; i < ids.length; i += 200) {
    const j = await issueData(run, '/customer-ads?archived=1&customers=' + ids.slice(i, i + 200).join(','));
    Object.assign(out, j.customers || {});
  }
  return out;
}

// ── PUBLISHER REVIEWS rows ──
async function reviewRows(run) {
  const C = run.cfg.collections, coll = needCollection(run, 'reviews', 'PUBLISHER REVIEWS');
  const [rows, pubSlug, custSlug, actions, statuses] = await Promise.all([run.listAll(coll), refSlugTo(run, coll, C.publishers), refSlugTo(run, coll, C.customers),
    run.optMap(coll, RV.action), run.optMap(coll, RV.status)]);
  return rows.filter(r => !r.isArchived).map(r => { const f = fd(r); return { id: r.id, createdOn: r.createdOn, publisher: refId(f[pubSlug]), customer: refId(f[custSlug]),
    action: actions.get(f[RV.action]) || '', status: statuses.get(f[RV.status]) || '', token: String(f[RV.token] || ''), expires: f[RV.expires] || null,
    sentBy: String(f[RV.sentBy] || ''), note: String(f[RV.note] || ''), data: parseData(f[RV.data]) }; });
}
async function createReview(run, o) {                                 // staged only, never published (S8: no review ever gets a live page)
  const C = run.cfg.collections, coll = needCollection(run, 'reviews', 'PUBLISHER REVIEWS');
  const [pubSlug, custSlug] = await Promise.all([refSlugTo(run, coll, C.publishers), refSlugTo(run, coll, C.customers)]);
  const name = (o.action + ' · ' + (o.customerName || o.customer) + ' · ' + dayOf(iso())).slice(0, 250);
  const fields = { name, slug: keyOf(o.action) + '-' + Date.now().toString(36) + '-' + randomToken().slice(0, 6), [pubSlug]: o.publisher, [custSlug]: o.customer,
    [RV.action]: await run.optId(coll, RV.action, o.action), [RV.status]: await run.optId(coll, RV.status, o.status || RV_STATUS.done),
    [RV.token]: o.token || '', [RV.expires]: o.expires || null, [RV.sentBy]: (o.sentBy || '').slice(0, 250), [RV.note]: o.note || '', [RV.data]: JSON.stringify(o.data || {}) };
  const r = await run.wf('/collections/' + coll + '/items', { method: 'POST', body: { isArchived: false, isDraft: true, fieldData: fields } });
  const id = r && r.id; if (!id) throw httpErr(502, 'Webflow answered the review create with no id.');
  const r2 = await run.wf('/collections/' + coll + '/items/' + id, { method: 'PATCH', body: { isDraft: true, fieldData: { [RV.self]: id } } });
  return { id, unconfirmed: echoes(r2, Object.assign({}, fields, { [RV.self]: id })) };
}
async function patchReview(run, id, fields) {                         // staged only
  const coll = needCollection(run, 'reviews', 'PUBLISHER REVIEWS');
  const r = await run.wf('/collections/' + coll + '/items/' + id, { method: 'PATCH', body: { isDraft: true, fieldData: fields } });
  return { id, unconfirmed: echoes(r, fields) };
}

// ── sold shapes per customer, from the publisher's live sales records ──
async function soldShapes(run, sc) {
  const C = run.cfg.collections, S = JOIN.sales;
  const [sales, prods, srStatus, shapeOf] = await Promise.all([run.listAll(C.sales), run.listAll(C.franchises), run.optMap(C.sales, S.status), run.optMap(C.franchises, JOIN.product.shape)]);
  const prodShape = new Map(prods.map(p => [p.id, keyOf(shapeOf.get(fd(p)[JOIN.product.shape]) || '')]));
  const slotToShape = {}; SHAPE_KEYS.forEach(k => { slotToShape[keyOf(ADS_TAB.shapes[k].slot)] = k; });
  const out = {};
  sales.forEach(s => { const f = fd(s);
    if (s.isArchived || refId(f[S.publisher]) !== sc.publisherId || srStatus.get(f[S.status]) === SR_STATUS.ended) return;
    const cust = refId(f[S.customer]), shape = slotToShape[prodShape.get(refId(f[S.product])) || ''];
    if (!cust || !shape) return; (out[cust] = out[cust] || {})[shape] = true; });
  return out;
}

// ── GET /ads?publisher= · the whole tab in one answer ──
async function adsTab(run, url) {
  const C = run.cfg.collections, cfg = reviewCfg(run);
  const sc = await scope(run, url.searchParams.get('publisher'));
  const ids = await customerIds(run, sc);
  const [custRows, versions, sold, reviews] = await Promise.all([run.listAll(C.customers), versionsFor(run, ids), soldShapes(run, sc), reviewRows(run)]);
  const mine = reviews.filter(r => r.publisher === sc.publisherId);
  // per ad+shape: the open or answered link item, the last decision, the last send-back note
  const link = {}, decided = {}, backNote = {};
  mine.slice().sort((a, b) => String(a.createdOn).localeCompare(String(b.createdOn))).forEach(r => {
    const items = Array.isArray(r.data.items) ? r.data.items : [];
    items.forEach(it => { const k = it.adId + '|' + it.shape;
      if (r.action === RV_ACTION.ask && (r.status === RV_STATUS.open || r.status === RV_STATUS.answered))
        link[k] = { reviewId: r.id, status: r.status, sentBy: r.sentBy, sentAt: r.data.sentAt || r.createdOn, openedAt: r.data.openedAt || null, until: r.expires,
          answeredAt: r.data.answeredAt || null, answeredBy: r.data.answeredBy || null, answer: it.answer || null, like: it.like || '', change: it.change || '', files: it.files || [] };
      if (r.action !== RV_ACTION.ask) decided[k] = { action: r.action, by: r.sentBy, at: r.createdOn };
      if (r.action === RV_ACTION.back) backNote[k] = { note: r.note, by: r.sentBy, at: r.createdOn }; });
  });
  const customers = custRows.filter(c => ids.has(c.id) && !c.isArchived && !c.isDraft).map(c => {
    const v = versions[c.id] || { current: {}, versions: {}, problems: ['ix-issue-data had no answer for this customer.'] };
    const shapes = {};
    SHAPE_KEYS.forEach(shape => {
      const cur = (v.current || {})[shape] || null, list = ((v.versions || {})[shape] || []).map(x => {
        const k = x.id + '|' + shape, ap = keyOf(x.approval || ''), rl = x.runLog || {}, ranTo = rl.to || null, ranFrom = rl.from || null;
        let state;
        if (x.id === cur) state = 'current';
        else if (ap === keyOf(ADS_TAB.approval.sentBack)) state = 'back';
        else if (ap === keyOf(ADS_TAB.approval.approved)) {
          if (x.archived || ranTo || ranFrom) state = 'earlier';
          else if (dayOf(x.createdOn) < ADS_TAB.pointerCutoff) state = 'earlier';   // ran before the log existed; dates unknown
          else state = 'ready';
        } else state = link[k] ? (link[k].status === RV_STATUS.answered ? 'answered' : 'adv') : 'needs';
        const ago = ranTo ? monthsAgo(dayOf(ranTo)) : null;
        const stale = state === 'earlier' && (ago === null || ago >= cfg.staleMonths);
        return { id: x.id, name: x.name, picture: x.picture, approval: x.approval || '', archived: !!x.archived, createdOn: x.createdOn, state,
          ranFrom, ranTo, monthsAgo: ago, stale, decided: decided[k] || null, link: link[k] || null, sentBack: backNote[k] || null };
      });
      shapes[shape] = { sold: !!((sold[c.id] || {})[shape]), current: cur, versions: list };
    });
    return { id: c.id, name: String(fd(c).name || ''), shapes, problems: v.problems || [] };
  }).sort((a, b) => a.name.localeCompare(b.name));
  return { ok: true, publisher: sc.publisherId, shapes: SHAPE_KEYS.map(k => ({ key: k, label: ADS_TAB.shapes[k].label })),
    staleMonths: cfg.staleMonths, linkDays: cfg.linkDays, customers };
}

// ── POST /ads/<adId>/decide · one choice on one version, through Scenario G and 114, logged ──
async function hook(run, url, bodyObj) {
  let res, j = null, txt = '';
  try { res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyObj) }); txt = await res.text(); j = JSON.parse(txt); }
  catch (e) { if (!res) throw httpErr(502, 'Make did not answer: ' + ((e && e.message) || e)); }
  if (!res.ok || !j || j.ok === false) throw httpErr(502, 'Make answered ' + (res ? res.status : '?') + (j && j.error ? ': ' + j.error : txt ? ': ' + txt.slice(0, 200) : '.'));
  return j;
}
async function adContext(run, adId, publisherId) {
  const C = run.cfg.collections, A = JOIN.ad;
  const ad = await run.getItem(C.ads, adId); if (!ad) throw httpErr(404, 'Ad not found.');
  const cust = refId(fd(ad)[A.customer]); if (!cust) throw httpErr(400, 'That ad has no customer.');
  const sc = await scope(run, publisherId);
  const ids = await customerIds(run, sc); if (!ids.has(cust)) throw httpErr(403, 'That ad\'s customer is not this publisher\'s.');
  const custRow = await run.getItem(C.customers, cust); if (!custRow) throw httpErr(404, 'The ad\'s customer was not found.');
  const custTitles = refIds(fd(custRow)[JOIN.customer.titles]).filter(t => sc.taIds.has(t));
  const ta = sc.taById.get(custTitles[0]) || sc.tas[0];
  return { ad, cust, custRow, sc, titleSlug: String(fd(ta).slug || ''), titleName: String(fd(ta).name || '') };
}
async function decide(run, adId, b) {
  const C = run.cfg.collections, A = JOIN.ad;
  const shape = String(b.shape || ''), action = String(b.action || ''), note = String(b.note || '').trim();
  if (!ADS_TAB.shapes[shape]) throw httpErr(400, 'Unknown shape.');
  if (!DECIDE[action]) throw httpErr(400, 'Unknown action.');
  if (action === 'send-back' && !note) throw httpErr(400, 'A send-back needs a note: say what to change.');
  const X = await adContext(run, adId, b.publisher), S = ADS_TAB.shapes[shape], f = fd(X.ad);
  const apMap = await run.optMap(C.ads, S.approval), cur = keyOf(apMap.get(f[S.approval]) || '');
  const isCurrent = refId(fd(X.custRow)[S.pointer]) === adId;
  const archivedRow = keyOf(await run.optLabel(C.ads, A.status, f[A.status])) === 'archived';
  const rl = parseData(f[ADS_TAB.runLog])[shape] || {}, ago = rl.to ? monthsAgo(dayOf(rl.to)) : null;
  const ranBefore = !!(rl.to || rl.from) || archivedRow || dayOf(X.ad.createdOn) < ADS_TAB.pointerCutoff;
  const stale = ranBefore && (ago === null || ago >= reviewCfg(run).staleMonths);
  if (isCurrent) throw httpErr(400, 'That version is live now. Make another version current first.');
  if ((action === 'make-current' || action === 'restore-hold') && cur !== keyOf(ADS_TAB.approval.approved)) throw httpErr(400, 'Only an approved version can be made current or held.');
  if ((action === 'make-current' || action === 'restore-hold') && stale) throw httpErr(400, 'That version last ran ' + (ago === null ? 'at an unknown date' : ago + ' months ago') + '. Use Restore for review so it gets a fresh OK first.');
  // 1 · approval, through Scenario G (approveAd)
  let unconfirmed = [];
  const want = action === 'send-back' ? ADS_TAB.approval.sentBack : action === 'restore-review' ? ADS_TAB.approval.pending
             : (action === 'approve-current' || action === 'approve-hold') ? ADS_TAB.approval.approved : null;
  if (want && cur !== keyOf(want)) {
    const optId = await run.optId(C.ads, S.approval, want), g = needHook(run, 'studio', 'Scenario G');
    const body = { action: 'approveAd', titleSlug: X.titleSlug, adItemId: adId };
    SHAPE_KEYS.forEach(k => { body[ADS_TAB.shapes[k].gKey] = k === shape ? optId : ''; });
    const j = await hook(run, g, body);
    if (refId((j.fieldData || {})[S.approval]) !== optId) unconfirmed.push(S.approval);
    run.writes++;
  }
  // 2 · an archived row coming back: Status → Active (ix-sales writes this one field; G has no status route — S8 handover note)
  if (archivedRow && (action === 'restore-hold' || action === 'restore-review' || action === 'make-current')) {
    const active = await run.optId(C.ads, A.status, 'Active');
    const w = await run.patch(C.ads, adId, { [A.status]: active }); unconfirmed = unconfirmed.concat(w.unconfirmed);
  }
  // 3 · the pointer, through Scenario 114 (which then calls /run-log here)
  if (action === 'approve-current' || action === 'make-current') {
    const h = needHook(run, 'updateCustomer', 'Scenario 114');
    const j = await hook(run, h, { customerId: X.cust, [S.k114]: adId, publish: true });
    if (refId((j.fieldData || {})[S.pointer]) !== adId) unconfirmed.push(S.pointer);
    run.writes++;
  }
  // 4 · the log row
  const log = await createReview(run, { action: DECIDE[action], status: RV_STATUS.done, publisher: X.sc.publisherId, customer: X.cust, customerName: String(fd(X.custRow).name || ''),
    sentBy: run.actor(), note: action === 'send-back' ? note : '', data: { at: iso(), items: [{ adId, shape, name: String(f.name || ''), from: apMap.get(f[S.approval]) || '', to: want || apMap.get(f[S.approval]) || '', madeCurrent: action === 'approve-current' || action === 'make-current' }] } });
  return { ok: true, ad: adId, shape, action, logged: log.id, unconfirmed: unconfirmed.concat(log.unconfirmed.map(k => 'log:' + k)) };
}

// ── POST /ads/ask · one link for every ad the publisher marked for a customer ──
async function ask(run, b) {
  const C = run.cfg.collections, cfg = reviewCfg(run);
  const items = Array.isArray(b.items) ? b.items.filter(i => i && /^[0-9a-f]{24}$/.test(i.adId || '') && ADS_TAB.shapes[i.shape]) : [];
  if (!items.length) throw httpErr(400, 'Name at least one ad and shape.');
  const first = await adContext(run, items[0].adId, b.publisher);
  const A = JOIN.ad, named = [];
  for (const it of items) {
    const ad = it.adId === first.ad.id ? first.ad : await run.getItem(C.ads, it.adId);
    if (!ad || refId(fd(ad)[A.customer]) !== first.cust) throw httpErr(400, 'Every ad in one link must belong to the same customer.');
    named.push({ adId: it.adId, shape: it.shape, name: String(fd(ad).name || ''), answer: null, like: '', change: '', said: '', files: [] });
  }
  const token = randomToken(), expires = new Date(Date.now() + cfg.linkDays * 86400000);
  const link = cfg.pageUrl + (cfg.pageUrl.includes('?') ? '&' : '?') + 't=' + token;
  const pub = await run.getItem(C.publishers, first.sc.publisherId), pf = fd(pub || {});
  const personSlug = await slugByName(run, C.publishers, PUB_FIELDS.person).catch(() => null);
  const person = personSlug ? String(pf[personSlug] || '').trim() : '', company = String(pf.name || '').trim();
  const until = expires.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const row = await createReview(run, { action: RV_ACTION.ask, status: RV_STATUS.open, publisher: first.sc.publisherId, customer: first.cust, customerName: String(fd(first.custRow).name || ''),
    token, expires: expires.toISOString(), sentBy: run.actor(), data: { sentAt: iso(), openedAt: null, answeredAt: null, answeredBy: null, title: first.titleName, items: named } });
  return { ok: true, reviewId: row.id, token, link, until: expires.toISOString(), subject: REVIEW_WORDS.subject(first.titleName || company),
    message: REVIEW_WORDS.message({ count: named.length, customer: String(fd(first.custRow).name || ''), link, until, person: person || company, company }), unconfirmed: row.unconfirmed };
}

// ── POST /run-log (X-IX-Key) · Scenario 114 reports a customer's pointers before and after its write ──
async function runLog(run, b) {
  const C = run.cfg.collections, before = b.before || {}, after = b.after || {}, today = dayOf(iso()), changed = [];
  if (!/^[0-9a-f]{24}$/.test(b.customerId || '')) throw httpErr(400, 'Missing customerId.');
  const touch = {};                                                   // adId → { shape: {from,to} patch }
  SHAPE_KEYS.forEach(shape => { const S = ADS_TAB.shapes[shape], was = refId(before[S.k114] || before[S.pointer]), now = refId(after[S.k114] || after[S.pointer]);
    if (was === now) return; changed.push(shape);
    if (was) (touch[was] = touch[was] || {})[shape] = { to: today };
    if (now) (touch[now] = touch[now] || {})[shape] = { from: today, to: null }; });
  const results = [];
  for (const adId of Object.keys(touch)) {
    const ad = await run.getItem(C.ads, adId); if (!ad) { run.warn('Run Log: ADS ' + adId + ' was not found.'); continue; }
    const log = parseData(fd(ad)[ADS_TAB.runLog]);
    Object.keys(touch[adId]).forEach(shape => { const cur = log[shape] || {}, p = touch[adId][shape];
      log[shape] = p.from ? { from: p.from, to: null } : { from: cur.from || null, to: p.to }; });
    const w = await run.patch(C.ads, adId, { [ADS_TAB.runLog]: JSON.stringify(log) });
    results.push({ ad: adId, runLog: log, unconfirmed: w.unconfirmed });
  }
  return { ok: true, customer: b.customerId, changed, written: results };
}

// ── the advertiser review page (no login; the token is the key) ──
async function reviewByToken(run, token) {
  if (!/^[0-9a-f]{32}$/.test(token || '')) throw httpErr(404, 'This link is not one we made.');
  const r = (await reviewRows(run)).find(x => x.token === token && x.action === RV_ACTION.ask);
  if (!r) throw httpErr(404, 'This link is not one we made.');
  const expired = r.status === RV_STATUS.expired || (r.expires && new Date(r.expires).getTime() < Date.now());
  return { r, expired };
}
async function publisherCard(run, publisherId) {
  const C = run.cfg.collections, pub = await run.getItem(C.publishers, publisherId), pf = fd(pub || {});
  const slug = async n => await slugByName(run, C.publishers, n).catch(() => null);
  const [ps, es, ls] = await Promise.all([slug(PUB_FIELDS.person), slug(PUB_FIELDS.email), slug(PUB_FIELDS.logo)]);
  const logo = ls ? pf[ls] : null;
  return { id: publisherId, company: String(pf.name || '').trim(), person: ps ? String(pf[ps] || '').trim() : '', email: es ? String(pf[es] || '').trim() : '',
    logo: logo && typeof logo === 'object' ? (logo.url || null) : (typeof logo === 'string' ? logo : null) };
}
async function reviewGet(run, token) {
  const { r, expired } = await reviewByToken(run, token);
  const pub = await publisherCard(run, r.publisher);
  if (expired) return { ok: true, expired: true, publisher: pub, linkDays: reviewCfg(run).linkDays };
  const C = run.cfg.collections, cust = await run.getItem(C.customers, r.customer);
  const v = (await issueData(run, '/customer-ads?archived=1&customer=' + r.customer));
  const items = (r.data.items || []).map(it => { const row = (((v.versions || {})[it.shape]) || []).find(x => x.id === it.adId);
    return { adId: it.adId, shape: it.shape, label: (ADS_TAB.shapes[it.shape] || {}).label || it.shape, name: it.name || (row && row.name) || '', picture: row ? row.picture : null,
      answer: it.answer || null, like: it.like || '', change: it.change || '', files: it.files || [] }; });
  if (!r.data.openedAt) { r.data.openedAt = iso(); await patchReview(run, r.id, { [RV.data]: JSON.stringify(r.data) }).catch(e => run.warn('Could not record the open: ' + e.message)); }
  return { ok: true, expired: false, publisher: pub, title: r.data.title || pub.company, customer: String(fd(cust || {}).name || ''), until: r.expires,
    answered: r.status === RV_STATUS.answered, answeredBy: r.data.answeredBy || null, items };
}
async function reviewAnswer(run, token, b) {
  const { r, expired } = await reviewByToken(run, token);
  if (expired) throw httpErr(410, 'This link has expired.');
  const name = String(b.name || '').trim().slice(0, 120); if (!name) throw httpErr(400, 'Your name is needed.');
  const sent = Array.isArray(b.items) ? b.items : [];
  const items = (r.data.items || []).map(it => { const a = sent.find(x => x && x.adId === it.adId && x.shape === it.shape); if (!a) return it;
    const answer = a.answer === 'approve' ? 'approve' : a.answer === 'change' ? 'change' : null;
    return Object.assign({}, it, { answer, like: String(a.like || '').slice(0, 4000), change: String(a.change || '').slice(0, 4000), said: String(a.said || '').slice(0, 20000),
      files: (Array.isArray(a.files) ? a.files : []).filter(f => f && /^https:\/\//.test(f.url || '')).slice(0, 20).map(f => ({ name: String(f.name || '').slice(0, 200), url: f.url })) }); });
  if (!items.some(it => it.answer)) throw httpErr(400, 'Answer at least one ad.');
  const coll = needCollection(run, 'reviews', 'PUBLISHER REVIEWS');
  const data = Object.assign({}, r.data, { items, answeredAt: iso(), answeredBy: name });
  const w = await patchReview(run, r.id, { [RV.data]: JSON.stringify(data), [RV.status]: await run.optId(coll, RV.status, RV_STATUS.answered) });
  return { ok: true, answered: items.filter(i => i.answer).length, unconfirmed: w.unconfirmed };
}
async function reviewTranscribe(run, token, request) {
  const { expired } = await reviewByToken(run, token); if (expired) throw httpErr(410, 'This link has expired.');
  const cfg = reviewCfg(run);
  if (!run.env.AI || typeof run.env.AI.run !== 'function') throw httpErr(500, 'The AI binding (Workers AI) is not set on this Worker.');
  const buf = await request.arrayBuffer();
  if (!buf.byteLength) throw httpErr(400, 'No audio was sent.');
  if (buf.byteLength > cfg.maxAudioBytes) throw httpErr(413, 'That recording is too long. Keep it under a few minutes.');
  let b64 = ''; const bytes = new Uint8Array(buf); for (let i = 0; i < bytes.length; i += 0x8000) b64 += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); b64 = btoa(b64);
  let said = '';
  try { const r = await run.env.AI.run(cfg.transcribeModel, { audio: b64 }); said = String((r && (r.text || (r.result && r.result.text))) || '').trim(); }
  catch (e) { throw httpErr(502, 'Transcription failed: ' + ((e && e.message) || e)); }
  if (!said) return { ok: true, said: '', like: '', change: '', note: 'We could not hear anything. Try again, or type instead.' };
  const sum = await summarize(run, said, String(request.headers.get('X-Ad-Label') || 'ad')).catch(e => { run.warn('Summary failed: ' + e.message); return null; });
  return { ok: true, said, like: sum ? sum.like : '', change: sum ? sum.change : said };
}
async function summarize(run, said, label) {
  const key = run.env.ANTHROPIC_API_KEY; if (!key) throw httpErr(500, 'ANTHROPIC_API_KEY is not set on this Worker.');
  const prompt = 'An advertiser just spoke about their ' + label + ' for a local newsletter. Here is the transcript:\n\n"""' + said.slice(0, 6000) + '"""\n\n' +
    'Write two short plain-English notes for the publisher, in the advertiser\'s own words where possible: what they like, and what to change. Keep every specific (hours, phone numbers, names, colours, photos). ' +
    'Answer with JSON only, no preamble, exactly {"like":"...","change":"..."}. Use an empty string when they said nothing on that side.';
  const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: reviewCfg(run).summaryModel, max_tokens: 600, messages: [{ role: 'user', content: prompt }] }) });
  const j = await res.json().catch(() => null);
  if (!res.ok || !j) throw httpErr(502, 'Anthropic answered ' + res.status + '.');
  const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('').replace(/```json|```/g, '').trim();
  const o = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  return { like: String(o.like || '').trim(), change: String(o.change || '').trim() };
}
async function reviewFile(run, token, request) {
  const { expired } = await reviewByToken(run, token); if (expired) throw httpErr(410, 'This link has expired.');
  const cfg = reviewCfg(run), key = run.env.UPLOADCARE_PUB_KEY;
  if (!key) throw httpErr(500, 'UPLOADCARE_PUB_KEY is not set on this Worker.');
  let form; try { form = await request.formData(); } catch (e) { throw httpErr(400, 'Send the file as multipart form data, field "file".'); }
  const file = form.get('file'); if (!file || typeof file === 'string') throw httpErr(400, 'No file was sent.');
  if (file.size > cfg.maxFileBytes) throw httpErr(413, 'That file is too big (20 MB at most).');
  const up = new FormData(); up.append('UPLOADCARE_PUB_KEY', key); up.append('UPLOADCARE_STORE', 'auto'); up.append('file', file, file.name || 'file');
  const res = await fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: up });
  const j = await res.json().catch(() => null);
  if (!res.ok || !j || !j.file) throw httpErr(502, 'The upload did not land (Uploadcare ' + res.status + ').');
  return { ok: true, name: file.name || 'file', url: 'https://ucarecdn.com/' + j.file + '/', size: file.size };
}
async function expireReviews(run) {                                   // part of the daily sweep
  const coll = (run.cfg.collections || {}).reviews; if (!/^[0-9a-f]{24}$/.test(coll || '')) return { skipped: 'no reviews collection' };
  const rows = await reviewRows(run), now = Date.now(), done = [];
  for (const r of rows) {
    if (r.action !== RV_ACTION.ask || r.status !== RV_STATUS.open || !r.expires || new Date(r.expires).getTime() >= now) continue;
    await patchReview(run, r.id, { [RV.status]: await run.optId(coll, RV.status, RV_STATUS.expired) }); done.push(r.id);
  }
  return { expired: done };
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
