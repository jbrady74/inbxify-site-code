// ix-issue-data-v1.0.3.js
// ============================================================
// INBXIFY · Cloudflare Worker · ix-issue-data
// One call returns every record an issue needs, already joined.
// Data Worker step 1 (D152). Replaces 206's per-row Webflow lookups.
//
// v1.0.3 (4 Oct 2026) — the title's TITLES item (Clean-Up S1, M1).
//   context.titleSite is the TITLES item whose 'titles-admin' reference
//   points at this issue's TITLES-ADMIN record (NEWSLETTER 'sector').
//   206 reads public title fields from it, starting with 'title-logo-url'
//   for the splash link. Required (D207): no matching item, or more than
//   one, stops the run with 422. TITLES is a cached list like the others,
//   so fresh=1 refreshes it. Needs IX_CONFIG.collections.titlesSite.
//   Nothing else changed.
//
// v1.0.2 (3 Oct 2026) — a section for blocks without an article (D182).
//   Events, RE and any other block with no article now get block.section
//   from the design-json cascade, so 206 reads their section art and name
//   exactly as it does for a story:
//     block design-json   sectionId, or types.<TYPE>.sectionId
//     plan design-json    types.<TYPE>.sectionId
//     title design-json   types.<TYPE>.sectionId
//     publisher design-json (field 'design-json', when PUBLISHERS has it)
//   <TYPE> is the block's type label (EV, RE, ...), read from
//   IX_CONFIG.blockTypes: { "<NL-BLOCKS block-type option id>": "EV", ... }.
//   A block with an article keeps its article's section. A sectionId that
//   is not in SECTIONS is a warning, not a failure. block.sectionFrom says
//   which level supplied it.
//   Nothing else changed.
//
// v1.0.1 (2 Oct 2026) — paging hardened. Collection size never limits
//   what the Worker sees.
//   1 · A list no longer trusts Webflow's reported total alone. It reads
//       the pages the total implies, then keeps reading while the last
//       page came back full. Only a short page ends a list.
//   2 · The ceiling rises from 5,000 to 10,000 items per listed
//       collection. Past it, the run fails with a plain message. It
//       never answers from part of a list.
//   Nothing else changed.
//
// v1.0.0 (2 Oct 2026) — first build. Decisions D153 to D159.
//
// REQUEST
//   GET /issue-data?contextNlId=<NEWSLETTER id>&parentId=<id>[&fresh=1]
//   Header  X-IX-Key: <shared secret>
//
//   Same two ids 206's webhook receives. parentId is used exactly as
//   206 v1.29 uses it: NL-BLOCKS are kept when `publication-plan`
//   equals parentId, and the PUBLICATION PLAN is parentId unless
//   parentId is the NEWSLETTER's own id, in which case it is the
//   NEWSLETTER's `publication-plan`.
//
//   fresh=1 skips every cache and refills it. Use it on the run
//   after an edit to DESIGNS, ADS, CUSTOMERS, SECTIONS, TITLES-ADMIN,
//   TITLES, PUBLISHERS or PRODUCT LIBRARY.
//
// RESPONSE (200)
//   {
//     ok: true,
//     context: {
//       newsletter, title, publisher, plan,     // Webflow items
//       titleSite,                              // TITLES item (v1.0.3)
//       franchises: [items],                    // PRODUCT LIBRARY items named
//                                               // by any design-json in play
//       activeBannerAds: [{bannerLink, advertiserId, redirectLink}]
//                                               // same shape as 206 module 233,
//                                               // limited to this issue's payers
//     },
//     blocks: [ NL-BLOCK item, plus, one level deep:
//       design, ad, article, section, author, sponsor, payer,
//       re, reAgent, events[], reListings[] (each with .agent and ._opt),
//       txaAds[] (each with .customer) ],
//     meta: { version, readMode, webflowCalls, retries, cached, ms,
//             blockCount, warnings }
//   }
//   Every record keeps Webflow's own shape (id, fieldData, ...). Field
//   names are never changed, so 206's expressions keep their field
//   names and only change where they read from (D153).
//   A reference that is blank, or points at a deleted item, comes back
//   as null (or is left out of a list) and is named in meta.warnings.
//   Blocks keep Webflow's list order, the order 206 has always seen.
//
// FAILURE (D156)
//   Webflow refusing (429) or failing (5xx) is retried with its
//   Retry-After, up to MAX_RETRIES times. If it still fails, the whole
//   response is an error: { ok:false, error, meta }. The Worker never
//   returns an issue with a block quietly missing. Absence (a deleted
//   item) is data; refusal is failure.
//
// CONFIG (Cloudflare dashboard → Settings → Variables and Secrets)
//   WEBFLOW_TOKEN   Secret. Webflow API token, CMS read.
//   IX_KEY          Secret. The value 206 sends in X-IX-Key.
//   IX_CONFIG       Plain text, JSON. Collection ids, two ADS option
//                   ids, cache seconds, read mode. Platform values
//                   (one Webflow site serves every publisher), not
//                   tenant values. HC-P-DW1-1.
//
// HARDCODING (provisional ids, for the doc-maintenance chat)
//   HC-P-DW1-1  Collection and option ids in IX_CONFIG. By design.
//   HC-P-DW1-2  Reference field slugs in JOIN below. Open.
//   HC-P-DW1-3  Cache lifetime in IX_CONFIG.cacheSeconds. By design.
// ============================================================

const VERSION = '1.0.3';
const WF = 'https://api.webflow.com/v2';
const PAGE = 100;          // Webflow v2 maximum per call
const MAX_PAGES = 100;     // a list past 10,000 items is an error, never a silent cap
const PARALLEL = 4;        // Webflow calls in flight at once
const MAX_RETRIES = 4;     // per call, on 429 or 5xx

// Which field holds which reference. Schema knowledge, read from
// 206 v1.29's own mappings on 2 Oct 2026. HC-P-DW1-2.
const JOIN = {
  block: {
    plan: 'publication-plan',
    design: 'design',
    ad: 'asset-ad',
    article: 'asset-article',
    sponsor: 'asset-ad-sponsor',
    payer: 'paid-by-customer',
    events: 'asset-event',
    re: 'asset-re',
    designJson: 'design-json',
    type: 'block-type',
  },
  newsletter: { title: 'sector', plan: 'publication-plan' },
  title: { publisher: 'associated-client', designJson: 'design-json' },
  titleSite: { titleAdmin: 'titles-admin' },   // v1.0.3: TITLES -> TITLES-ADMIN
  plan: { designJson: 'design-json' },
  publisher: { designJson: 'design-json' },   // v1.0.2: read when the field exists
  article: { section: 'section', author: 'associated-business-coc' },
  re: { agent: 'listing-agent-customer' },
  ad: { customer: 'associated-advertiser', type: 'add-type', status: 'status',
        bannerLink: 'banner-ad-link', redirectLink: 'redirect-link' },
};

const REQUIRED_COLLECTIONS = ['newsletter', 'titles', 'titlesSite', 'publishers', 'plan', 'blocks',
  'designs', 'ads', 'articles', 'sections', 'customers', 'events', 're', 'franchises'];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ ok: true, version: VERSION }, 200);
    if (request.method !== 'GET') return fail(405, 'Only GET is supported.');
    if (url.pathname !== '/issue-data') return fail(404, 'Unknown path. Use /issue-data.');

    if (!env.IX_KEY) return fail(500, 'IX_KEY is not set on this Worker.');
    if (request.headers.get('X-IX-Key') !== env.IX_KEY) return fail(401, 'Missing or wrong X-IX-Key header.');
    if (!env.WEBFLOW_TOKEN) return fail(500, 'WEBFLOW_TOKEN is not set on this Worker.');

    let cfg;
    try { cfg = JSON.parse(env.IX_CONFIG || ''); }
    catch (e) { return fail(500, 'IX_CONFIG is missing or is not valid JSON.'); }
    const C = cfg.collections || {};
    const missing = REQUIRED_COLLECTIONS.filter(k => !/^[0-9a-f]{24}$/.test(C[k] || ''));
    if (missing.length) return fail(500, 'IX_CONFIG.collections is missing: ' + missing.join(', ') + '.');

    const nlId = (url.searchParams.get('contextNlId') || '').trim();
    const parentId = (url.searchParams.get('parentId') || '').trim();
    if (!/^[0-9a-f]{24}$/.test(nlId)) return fail(400, 'Missing or malformed contextNlId.');
    if (!/^[0-9a-f]{24}$/.test(parentId)) return fail(400, 'Missing or malformed parentId.');

    const run = new Run(env, ctx, cfg, url.searchParams.get('fresh') === '1');
    try {
      const out = await buildIssue(run, nlId, parentId);
      return json(Object.assign({ ok: true }, out, { meta: run.meta(out.blocks.length) }), 200);
    } catch (e) {
      return json({ ok: false, error: (e && e.message) || String(e), meta: run.meta(null) },
        (e && e.status) || 502);
    }
  },
};

// ── The issue ───────────────────────────────────────────────

async function buildIssue(run, nlId, parentId) {
  const C = run.cfg.collections;

  // 1. NEWSLETTER first: it names the TITLE and, sometimes, the PLAN.
  const newsletter = await run.getItem('newsletter', C.newsletter, nlId);
  if (!newsletter) throw httpErr(404, 'contextNlId is not in the NEWSLETTER collection.');
  const nfd = newsletter.fieldData || {};
  const planId = parentId === newsletter.id ? refId(nfd[JOIN.newsletter.plan]) : parentId;
  if (!planId) throw httpErr(422, 'This NEWSLETTER has no PUBLICATION PLAN set.');

  // 2. Everything that does not depend on the blocks, at once.
  //    Per-issue reads (PLAN, NL-BLOCKS) are always fresh.
  //    Slow-changing collections are cached lists.
  const [plan, blocksAll, titles, titlesSite, publishers, designs, ads, customers, sections, franchisesAll] =
    await Promise.all([
      run.getItem('plan', C.plan, planId),
      run.listAll(C.blocks),
      run.cachedList('titles', C.titles),
      run.cachedList('titlesSite', C.titlesSite),
      run.cachedList('publishers', C.publishers),
      run.cachedList('designs', C.designs),
      run.cachedList('ads', C.ads),
      run.cachedList('customers', C.customers),
      run.cachedList('sections', C.sections),
      run.cachedList('franchises', C.franchises),
    ]);
  if (!plan) throw httpErr(404, 'The PUBLICATION PLAN ' + planId + ' is not in the PUBLICATION PLAN collection.');

  const title = byId(titles, refId(nfd[JOIN.newsletter.title]));
  if (!title) throw httpErr(422, 'This NEWSLETTER has no TITLE (sector), or it is not in TITLES-ADMIN.');
  // v1.0.3 — the TITLES item that points at this TITLES-ADMIN record.
  const siteMatches = titlesSite.filter(t => refIds((t.fieldData || {})[JOIN.titleSite.titleAdmin]).includes(title.id));
  if (siteMatches.length !== 1) throw httpErr(422, siteMatches.length
    ? 'More than one TITLES item points at TITLES-ADMIN ' + title.id + ': ' + siteMatches.map(t => t.id).join(', ') + '.'
    : 'No TITLES item points at TITLES-ADMIN ' + title.id + ' (field titles-admin).');
  const titleSite = siteMatches[0];
  const publisher = byId(publishers, refId((title.fieldData || {})[JOIN.title.publisher]));
  if (!publisher) run.warn('The TITLE has no PUBLISHER, or it is not in PUBLISHERS.');

  // 3. This issue's blocks, in Webflow's list order, as 206 filters them.
  const rows = blocksAll.filter(b => refId((b.fieldData || {})[JOIN.block.plan]) === parentId);

  // 4. Parse each block's design-json once. 206 still parses it itself;
  //    the Worker only needs the lists of ids inside it.
  const parsed = rows.map(b => parseDJ((b.fieldData || {})[JOIN.block.designJson], 'block ' + b.id, run));

  // 5. Collect the per-issue ids, then read them by id, in parallel.
  const want = { articles: new Set(), events: new Set(), re: new Set() };
  rows.forEach((b, i) => {
    const fd = b.fieldData || {};
    const dj = parsed[i];
    refIds(fd[JOIN.block.article]).forEach(id => want.articles.add(id));
    eventIdsFor(fd, dj).forEach(id => want.events.add(id));
    reIdsFor(fd, dj).forEach(id => want.re.add(id));
    refIds(fd[JOIN.block.re]).forEach(id => want.re.add(id));
  });
  const [articles, events, reItems, reSchema] = await Promise.all([
    run.getMany('articles', C.articles, [...want.articles]),
    run.getMany('events', C.events, [...want.events]),
    run.getMany('re', C.re, [...want.re]),
    want.re.size ? run.cachedSchema('re', C.re) : Promise.resolve(null),
  ]);
  const reOptions = optionMaps(reSchema);

  // 5b. v1.0.2: the design-json cascade above the block, for sections.
  const titleDJc = parseDJ((title.fieldData || {})[JOIN.title.designJson], 'TITLES-ADMIN', run);
  const planDJc = parseDJ((plan.fieldData || {})[JOIN.plan.designJson], 'PUBLICATION PLAN', run);
  const pubDJc = publisher ? parseDJ((publisher.fieldData || {})[JOIN.publisher.designJson], 'PUBLISHERS', run) : {};
  const blockTypes = run.cfg.blockTypes || {};
  if (!Object.keys(blockTypes).length) run.warn('IX_CONFIG.blockTypes is missing; blocks without an article get no section.');
  const sectionsBy = index(sections);

  // 6. Join.
  const custBy = index(customers);
  const adsBy = index(ads);
  const blocks = rows.map((b, i) => {
    const fd = b.fieldData || {};
    const dj = parsed[i];
    const where = 'block ' + b.id + ' (position ' + fd.position + ')';
    const out = Object.assign({}, b);

    out.design = pick(index(designs), fd[JOIN.block.design], 'DESIGNS', where, run);
    out.ad = pick(adsBy, fd[JOIN.block.ad], 'ADS', where, run);

    const article = pick(articles, fd[JOIN.block.article], 'ARTICLES', where, run);
    out.article = article;
    const afd = (article && article.fieldData) || {};
    out.section = article ? pick(sectionsBy, afd[JOIN.article.section], 'SECTIONS', where, run) : null;
    out.sectionFrom = out.section ? 'article' : null;
    if (!article) {
      // v1.0.2: block, plan, title, publisher
      const label = blockTypes[String(fd[JOIN.block.type] || '')] || '';
      const found = sectionIdFor(label, [['block', dj, true], ['plan', planDJc], ['title', titleDJc], ['publisher', pubDJc]]);
      if (found) {
        out.section = pick(sectionsBy, found.id, 'SECTIONS', where, run);
        out.sectionFrom = out.section ? found.level : null;
      }
    }
    out.author = article ? pick(custBy, afd[JOIN.article.author], 'CUSTOMERS', where, run) : null;

    out.sponsor = pick(custBy, fd[JOIN.block.sponsor], 'CUSTOMERS', where, run);
    out.payer = pick(custBy, fd[JOIN.block.payer], 'CUSTOMERS', where, run);

    const reOne = pick(reItems, refIds(fd[JOIN.block.re])[0], 'RE LISTINGS', where, run);
    out.re = reOne;
    out.reAgent = reOne ? pick(custBy, (reOne.fieldData || {})[JOIN.re.agent], 'CUSTOMERS', where, run) : null;

    out.events = eventIdsFor(fd, dj)
      .map(id => pick(events, id, 'EVENTS', where, run)).filter(Boolean);

    out.reListings = reIdsFor(fd, dj)
      .map(id => pick(reItems, id, 'RE LISTINGS', where, run)).filter(Boolean)
      .map(item => Object.assign({}, item, {
        agent: pick(custBy, (item.fieldData || {})[JOIN.re.agent], 'CUSTOMERS', where, run),
        _opt: optionLabels(item, reOptions),
      }));

    out.txaAds = idList(dj && dj.txaAds)
      .map(id => pick(adsBy, id, 'ADS', where, run)).filter(Boolean)
      .map(item => Object.assign({}, item, {
        customer: pick(custBy, (item.fieldData || {})[JOIN.ad.customer], 'CUSTOMERS', where, run),
      }));

    return out;
  });

  // 7. Context. PRODUCT LIBRARY items named anywhere in the design-json
  //    cascade (title, plan, blocks), so 206 can pick its franchise
  //    with the same id expression it uses today.
  const titleDJ = parseDJ((title.fieldData || {})[JOIN.title.designJson], 'TITLES-ADMIN', run);
  const planDJ = parseDJ((plan.fieldData || {})[JOIN.plan.designJson], 'PUBLICATION PLAN', run);
  const franchiseIds = new Set();
  [titleDJ, planDJ, ...parsed].forEach(dj => franchiseIdsIn(dj).forEach(id => franchiseIds.add(id)));
  const franchiseBy = index(franchisesAll);
  const franchises = [...franchiseIds].map(id => {
    const f = franchiseBy.get(id);
    if (!f) run.warn('PRODUCT LIBRARY item ' + id + ' is named in a design-json but does not exist.');
    return f;
  }).filter(Boolean);

  // Active banner ads of this issue's payers, in ADS list order, in the
  // shape of 206 module 233. Covers every ADS item, not the first 100.
  const o = run.cfg.options || {};
  const payerIds = new Set(rows.map(b => refId((b.fieldData || {})[JOIN.block.payer])).filter(Boolean));
  const activeBannerAds = (o.adTypeBanner && o.adStatusActive) ? ads
    .filter(a => {
      const f = a.fieldData || {};
      return f[JOIN.ad.type] === o.adTypeBanner && f[JOIN.ad.status] === o.adStatusActive &&
        payerIds.has(refId(f[JOIN.ad.customer]));
    })
    .map(a => ({
      bannerLink: a.fieldData[JOIN.ad.bannerLink] || '',
      advertiserId: refId(a.fieldData[JOIN.ad.customer]),
      redirectLink: a.fieldData[JOIN.ad.redirectLink] || '',
    })) : [];
  if (!(o.adTypeBanner && o.adStatusActive)) run.warn('IX_CONFIG.options is missing adTypeBanner or adStatusActive; activeBannerAds is empty.');

  return {
    context: { newsletter, title, titleSite, publisher: publisher || null, plan, franchises, activeBannerAds },
    blocks,
  };
}

// design-json lists, read the way 206 reads them:
//   events   = ifempty(designJson.evEvents; asset-event)
//   listings = ifempty(designJson.reListings; asset-re)
function eventIdsFor(fd, dj) {
  const fromDJ = idList(dj && dj.evEvents);
  return fromDJ.length ? fromDJ : refIds(fd[JOIN.block.events]);
}
function reIdsFor(fd, dj) {
  const fromDJ = idList(dj && dj.reListings);
  return fromDJ.length ? fromDJ : refIds(fd[JOIN.block.re]);
}
// v1.0.2: the first sectionId in the cascade for this block type.
// The block's own design-json may also name a plain sectionId.
function sectionIdFor(label, levels) {
  for (const [level, dj, own] of levels) {
    if (!dj || typeof dj !== 'object') continue;
    if (own && refId(dj.sectionId)) return { id: refId(dj.sectionId), level };
    const t = label && dj.types && dj.types[label];
    if (t && refId(t.sectionId)) return { id: refId(t.sectionId), level };
  }
  return null;
}

function franchiseIdsIn(dj) {
  if (!dj || typeof dj !== 'object') return [];
  const ids = [];
  if (refId(dj.franchiseId)) ids.push(refId(dj.franchiseId));
  if (dj.types && typeof dj.types === 'object') {
    Object.values(dj.types).forEach(t => { if (t && refId(t.franchiseId)) ids.push(refId(t.franchiseId)); });
  }
  return ids;
}

function parseDJ(raw, where, run) {
  if (raw == null || String(raw).trim() === '') return {};
  try {
    const v = JSON.parse(raw);
    return (v && typeof v === 'object') ? v : {};
  } catch (e) {
    run.warn('design-json on ' + where + ' is not valid JSON; 206 will fail on it too.');
    return {};
  }
}

// ── Webflow reads, paced and counted ────────────────────────

class Run {
  constructor(env, ctx, cfg, fresh) {
    this.env = env; this.ctx = ctx; this.cfg = cfg; this.fresh = fresh;
    this.live = cfg.readMode === 'live';
    this.ttl = Number(cfg.cacheSeconds) > 0 ? Number(cfg.cacheSeconds) : 600;
    this.calls = 0; this.retries = 0; this.cachedNames = []; this.warnings = [];
    this.active = 0; this.waiting = []; this.t0 = Date.now();
  }

  warn(msg) { if (!this.warnings.includes(msg)) this.warnings.push(msg); }

  meta(blockCount) {
    return {
      version: VERSION,
      readMode: this.live ? 'live' : 'staged',
      fresh: this.fresh,
      webflowCalls: this.calls,
      retries: this.retries,
      cached: this.cachedNames,
      ms: Date.now() - this.t0,
      blockCount,
      warnings: this.warnings,
    };
  }

  async slot(fn) {
    while (this.active >= PARALLEL) await new Promise(r => this.waiting.push(r));
    this.active++;
    try { return await fn(); }
    finally { this.active--; const next = this.waiting.shift(); if (next) next(); }
  }

  async wf(path, allow404) {
    for (let attempt = 0; ; attempt++) {
      const res = await this.slot(() => {
        this.calls++;
        return fetch(WF + path, {
          headers: { Authorization: 'Bearer ' + this.env.WEBFLOW_TOKEN, 'accept-version': '2.0.0' },
        });
      });
      if (res.ok) return res.json();
      if (res.status === 404 && allow404) return null;
      if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
        this.retries++;
        const ra = Number(res.headers.get('Retry-After'));
        await sleep(ra > 0 ? Math.min(ra, 60) * 1000 : 1000 * Math.pow(2, attempt));
        continue;
      }
      const body = await res.text().catch(() => '');
      throw httpErr(res.status === 429 ? 503 : 502,
        'Webflow HTTP ' + res.status + ' on ' + path +
        (res.status === 429 ? ' (rate limit, after ' + MAX_RETRIES + ' retries)' : '') +
        (body ? ' · ' + body.slice(0, 200) : ''));
    }
  }

  async getItem(label, collId, id) {
    if (!id) return null;
    const item = await this.wf('/collections/' + collId + '/items/' + id + (this.live ? '/live' : ''), true);
    if (!item) this.warn(label + ' item ' + id + ' was not found (deleted or unpublished).');
    return item;
  }

  // Map id → item for the ids that exist. Blank ids never reach Webflow.
  async getMany(label, collId, ids) {
    const uniq = [...new Set(ids.filter(Boolean))];
    const items = await Promise.all(uniq.map(id => this.getItem(label, collId, id)));
    const m = new Map();
    items.forEach(it => { if (it) m.set(it.id, it); });
    return m;
  }

  // Every page, or an error. Never a partial list.
  // Webflow's total says how many pages to read at once. A short page is
  // the only thing that ends the list, so a wrong or missing total cannot
  // cut it off.
  async listAll(collId) {
    const base = '/collections/' + collId + '/items' + (this.live ? '/live' : '') + '?limit=' + PAGE + '&offset=';
    const tooBig = () => httpErr(502, 'Collection ' + collId + ' holds more than ' +
      (PAGE * MAX_PAGES) + ' items, the most this Worker reads. Nothing was answered from part of it.');
    const first = await this.wf(base + 0);
    const pagesOut = [first.items || []];
    const total = Number(first.pagination && first.pagination.total) || 0;
    const planned = Math.ceil(total / PAGE);
    if (planned > MAX_PAGES) throw tooBig();
    const offsets = [];
    for (let p = 1; p < planned; p++) offsets.push(p * PAGE);
    const more = await Promise.all(offsets.map(off => this.wf(base + off).then(r => r.items || [])));
    more.forEach(items => pagesOut.push(items));
    while (pagesOut[pagesOut.length - 1].length === PAGE) {
      if (pagesOut.length >= MAX_PAGES) throw tooBig();
      const r = await this.wf(base + pagesOut.length * PAGE);
      pagesOut.push(r.items || []);
    }
    const seen = new Set();
    return pagesOut.flat().filter(r => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  }

  async cachedList(name, collId) {
    return this.cached('list:' + collId, () => this.listAll(collId), name);
  }

  async cachedSchema(name, collId) {
    return this.cached('schema:' + collId, () => this.wf('/collections/' + collId), name + ' schema');
  }

  // Cloudflare Cache API, per data centre (D154). fresh=1 skips the read
  // but still refills, so the next run is warm.
  async cached(key, produce, name) {
    const cache = caches.default;
    const req = new Request('https://ix-issue-data.cache/' + (this.live ? 'live/' : 'staged/') + encodeURIComponent(key));
    if (!this.fresh) {
      const hit = await cache.match(req);
      if (hit) { this.cachedNames.push(name); return hit.json(); }
    }
    const value = await produce();
    const res = new Response(JSON.stringify(value), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=' + this.ttl },
    });
    this.ctx.waitUntil(cache.put(req, res));
    return value;
  }
}

// ── Shaping ─────────────────────────────────────────────────

function optionMaps(schema) {
  const maps = {};
  ((schema && schema.fields) || []).forEach(f => {
    if (f.type === 'Option' && f.validations && Array.isArray(f.validations.options)) {
      const m = {};
      f.validations.options.forEach(o => { m[o.id] = o.name; });
      maps[f.slug] = m;
    }
  });
  return maps;
}

function optionLabels(item, maps) {
  const out = {};
  const fd = item.fieldData || {};
  Object.keys(maps).forEach(slug => {
    const v = fd[slug];
    out[slug] = (v && maps[slug][v]) || '';
  });
  return out;
}

function index(rows) {
  if (rows instanceof Map) return rows;
  const m = new Map();
  (rows || []).forEach(r => m.set(r.id, r));
  return m;
}

function byId(rows, id) { return id ? (index(rows).get(id) || null) : null; }

// Look up one reference. Blank: null, silently (an unsold slot is normal).
// Set but missing: null, and a warning naming the block.
function pick(map, raw, label, where, run) {
  const id = refId(Array.isArray(raw) ? raw[0] : raw);
  if (!id) return null;
  const hit = index(map).get(id);
  if (!hit) run.warn(where + ': ' + label + ' item ' + id + ' was not found.');
  return hit || null;
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
// design-json lists may hold ids as strings, or as a comma-separated string
function idList(v) {
  if (!v) return [];
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  return refIds(v);
}

// ── HTTP helpers ────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpErr(status, message) { const e = new Error(message); e.status = status; return e; }

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function fail(status, message) { return json({ ok: false, error: message }, status); }
