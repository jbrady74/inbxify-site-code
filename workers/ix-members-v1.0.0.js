// ix-members-v1.0.0.js
// INBXIFY · Cloudflare Worker · ix-members
// Who is logged in, and which publisher they may see. The one place the
// Memberstack secret key lives. Publisher Portal S2.
//
// v1.0.0 (2 Nov 2026, Publisher Portal S2) — FIRST BUILD.
//   WHY. Memberstack gates /publisher/ by plan, not by publisher, and its gate
//   runs in the browser. So every Worker behind the portal must check the
//   member's login token itself. ix-members does that check; ix-sales (v1.0.2)
//   and later portal Workers ask it through a Cloudflare service binding.
//
//   THE LINK. A member belongs to a publisher when their Memberstack member id
//   is listed in that PUBLISHERS item's "Portal Member IDs" (slug
//   portal-member-ids, multi-line, one id per line; commas also accepted).
//   Only inbxify edits it, in Webflow or through Add member in Quill. A
//   member's own Memberstack custom fields are never trusted for access,
//   because a member can edit those from the browser.
//
//   STAFF. Member ids in IX_CONFIG.staffMemberIds may see and act for every
//   publisher (Quill, Studio).
//
//   ROUTES
//   GET  /health                      no auth
//   GET  /whoami                      any logged-in member. Answers
//        { memberId, email, staff, publishers:[{id,name,slug,portalPath}] }
//        Portal shell: if the page's publisher is not in the list, go to the
//        first one in the list; an empty list means no portal access.
//   GET  /members?publisher=<id>      staff. The publisher's portal members.
//   POST /members                     staff. { publisher, email, firstName, lastName }
//        1. Looks the email up in Memberstack. An existing login is linked,
//           never duplicated.
//        2. Otherwise creates a passwordless member (no password is set) with
//           the portal plan and the login redirect to the publisher's page.
//        3. An existing member without the portal plan gets it added.
//        4. Writes the member id into PUBLISHERS portal-member-ids, publishes.
//        Each step is checked against what the system echoes (TOAST-TRUTH);
//        anything not echoed comes back in "unconfirmed".
//   POST /members/<mem_id>/remove     staff. { publisher }
//        Takes the id off that publisher. If the person is on no other
//        publisher and is not staff, the portal plan is removed too. The
//        Memberstack member is never deleted.
//
//   AUTH. Browser routes need an allowed Origin (IX_CONFIG.allowedOrigins)
//   AND a Memberstack login token in "Authorization: Bearer <token>". The page
//   gets the token from Memberstack's own script:
//   await window.$memberstackDom.getMemberCookie()
//   Service-binding calls (ix-sales) carry no Origin; they pass the caller's
//   Authorization header through and need nothing else.
//
//   CACHES (in this Worker's memory, per instance, IX_CONFIG.cacheSeconds,
//   default 60): verified tokens and the PUBLISHERS list. A removed member can
//   keep access for up to that many seconds on an instance that already
//   checked them. Add and remove clear the PUBLISHERS cache at once.
//
// IX_CONFIG (Plain text, JSON)
//   { "collections": { "publishers": "64e905038caaa2edd76842ba" },
//     "allowedOrigins": ["https://www.inbxify.com","https://inbxify.com","https://app.inbxify.com"],
//     "portalPlanId": "pln_publisher-dashboard-dr6w0f2j",
//     "portalPath": "/publisher/",
//     "staffMemberIds": ["mem_cmfoyx6dv00vh0xvxasskbd70"],
//     "nameFields": { "first": "first-name", "last": "last-name" },
//     "cacheSeconds": 60 }
// SECRETS  WEBFLOW_TOKEN (one Webflow token with CMS read AND write),
//          MEMBERSTACK_SECRET_KEY (live key, starts sk_, from Memberstack
//          Dev Tools → Keys & IDs; never in a repo or a chat)
//
// HARDCODING (provisional ids, for the tracker)
//   HC-P-PP2-1  portalPlanId in IX_CONFIG. Platform value, by design.
//   HC-P-PP2-2  staffMemberIds in IX_CONFIG. By design.
//   HC-P-PP2-4  portalPath "/publisher/" in IX_CONFIG: the PUBLISHERS
//               template path, a Webflow site setting.
//   HC-P-PP2-5  nameFields: the Memberstack custom-field keys for first and
//               last name, in IX_CONFIG.
//   HC-P-PP2-6  The PUBLISHERS slug portal-member-ids in JOIN (S0 contract
//               class, same as HC-S-2).
// ============================================================

const VERSION = '1.0.0';
const WF = 'https://api.webflow.com/v2';
const MS = 'https://admin.memberstack.com';
const PAGE = 100, MAX_PAGES = 50, MAX_RETRIES = 4;
const JOIN = { pub: { members: 'portal-member-ids' } };              // HC-P-PP2-6
const MEM_RE = /^mem_[A-Za-z0-9]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// per-instance caches
const TOKENS = new Map();                         // token → { id, until }
let PUBS = { at: 0, rows: null };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname.replace(/\/+$/, '') || '/';
    if (p === '/health') return json({ ok: true, version: VERSION }, 200, request, null);
    if (request.method === 'OPTIONS') return preflight(request, env);
    let run;
    try {
      const cfg = loadConfig(env);
      run = new Run(env, cfg, request);
      run.needOrigin();
      const me = await run.member();                                   // every route below needs a login
      const m = request.method;
      const rm = p.match(/^\/members\/(mem_[A-Za-z0-9]+)\/remove$/);
      if (p === '/whoami' && m === 'GET') return run.out(await whoami(run, me), 200);
      run.needStaff(me);
      if (p === '/members' && m === 'GET') return run.out(await listMembers(run, url.searchParams.get('publisher')), 200);
      if (p === '/members' && m === 'POST') return run.out(await addMember(run, me, await body(request)), 200);
      if (rm && m === 'POST') return run.out(await removeMember(run, rm[1], await body(request)), 200);
      return run.out({ ok: false, error: 'Unknown route. See the v1.0.0 header.' }, 404);
    } catch (e) {
      const status = (e && e.status) || 502;
      const payload = { ok: false, error: (e && e.message) || String(e), version: VERSION, meta: run ? run.meta() : null };
      return run ? run.out(payload, status) : json(payload, status, request, null);
    }
  },
};

// ── config, access, run ──────────────────────────────────────
function loadConfig(env) {
  let cfg; try { cfg = JSON.parse(env.IX_CONFIG || ''); } catch (e) { throw httpErr(500, 'IX_CONFIG is missing or is not valid JSON.'); }
  if (!/^[0-9a-f]{24}$/.test((cfg.collections || {}).publishers || '')) throw httpErr(500, 'IX_CONFIG.collections.publishers is missing.');
  if (!/^pln_/.test(cfg.portalPlanId || '')) throw httpErr(500, 'IX_CONFIG.portalPlanId is missing (starts pln_).');
  if (!cfg.portalPath) throw httpErr(500, 'IX_CONFIG.portalPath is missing.');
  if (!Array.isArray(cfg.staffMemberIds)) cfg.staffMemberIds = [];
  if (!cfg.nameFields) cfg.nameFields = { first: 'first-name', last: 'last-name' };
  return cfg;
}
function preflight(request, env) {
  let cfg = null; try { cfg = loadConfig(env); } catch (e) {}
  const origin = request.headers.get('Origin') || '';
  const ok = !!cfg && (cfg.allowedOrigins || []).includes(origin);
  return new Response(null, { status: 204, headers: ok ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' } : { 'Vary': 'Origin' } });
}
async function body(request) { try { return await request.json(); } catch (e) { throw httpErr(400, 'The body is not JSON.'); } }

class Run {
  constructor(env, cfg, request) {
    this.env = env; this.cfg = cfg; this.request = request;
    this.origin = request.headers.get('Origin') || '';
    this.ttl = (Number(cfg.cacheSeconds) > 0 ? Number(cfg.cacheSeconds) : 60) * 1000;
    this.wfCalls = 0; this.msCalls = 0; this.writes = 0; this.retries = 0; this.warnings = []; this.t0 = Date.now();
  }
  warn(m) { if (!this.warnings.includes(m)) this.warnings.push(m); }
  meta() { return { version: VERSION, webflowCalls: this.wfCalls, memberstackCalls: this.msCalls, writes: this.writes, retries: this.retries, ms: Date.now() - this.t0, warnings: this.warnings }; }
  needOrigin() {
    if (!this.origin) return;                         // service binding (ix-sales): no Origin, token still required
    const allowed = Array.isArray(this.cfg.allowedOrigins) ? this.cfg.allowedOrigins : [];
    if (!allowed.includes(this.origin)) throw httpErr(403, 'This origin may not call ix-members.');
  }
  needStaff(me) { if (!me.staff) throw httpErr(403, 'Only inbxify staff can manage portal members.'); }
  out(obj, status) { if (obj && obj.ok !== undefined && !obj.meta) obj.meta = this.meta(); return json(obj, status, this.request, this.cfg); }

  // ── the login check ──
  async member() {
    const h = this.request.headers.get('Authorization') || '';
    const token = (h.match(/^Bearer\s+(.+)$/i) || [])[1];
    if (!token) throw httpErr(401, 'Not logged in: no Memberstack token was sent.');
    const hit = TOKENS.get(token);
    let id = hit && hit.until > Date.now() ? hit.id : null;
    if (!id) {
      const r = await this.ms('/members/verify-token', { method: 'POST', body: { token }, allow400: true });
      const d = r && r.data;
      if (!d || !MEM_RE.test(d.id || '') || (d.exp && d.exp * 1000 < Date.now())) throw httpErr(401, 'Your login is not valid or has expired. Log in again.');
      id = d.id;
      if (TOKENS.size > 500) TOKENS.clear();
      TOKENS.set(token, { id, until: Math.min(d.exp ? d.exp * 1000 : Infinity, Date.now() + this.ttl) });
    }
    return { id, staff: this.cfg.staffMemberIds.includes(id) };
  }

  // ── Memberstack ──
  async ms(path, o) {
    o = o || {};
    if (!this.env.MEMBERSTACK_SECRET_KEY) throw httpErr(500, 'MEMBERSTACK_SECRET_KEY is not set on this Worker.');
    for (let attempt = 0; ; attempt++) {
      this.msCalls++; if (o.method && o.method !== 'GET' && path !== '/members/verify-token') this.writes++;
      const res = await fetch(MS + path, { method: o.method || 'GET', body: o.body ? JSON.stringify(o.body) : undefined,
        headers: Object.assign({ 'X-API-KEY': this.env.MEMBERSTACK_SECRET_KEY, Accept: 'application/json' }, o.body ? { 'Content-Type': 'application/json' } : {}) });
      if (res.ok) { const t = await res.text(); try { return t ? JSON.parse(t) : {}; } catch (e) { return {}; } }
      if (res.status === 400 && o.allow400) return null;
      if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) { this.retries++; await sleep(500 * Math.pow(2, attempt)); continue; }
      const txt = await res.text().catch(() => '');
      throw httpErr(502, 'Memberstack HTTP ' + res.status + ' on ' + (o.method || 'GET') + ' ' + path.replace(/\/members\/[^/]+@[^/]+/, '/members/<email>') + (txt ? ' · ' + txt.slice(0, 200) : ''));
    }
  }
  async msMember(idOrEmail) { const r = await this.ms('/members/' + encodeURIComponent(idOrEmail)); return (r && r.data) || null; }

  // ── Webflow ──
  async wf(path, o) {
    o = o || {};
    if (!this.env.WEBFLOW_TOKEN) throw httpErr(500, 'WEBFLOW_TOKEN is not set on this Worker.');
    for (let attempt = 0; ; attempt++) {
      this.wfCalls++; if (o.method && o.method !== 'GET') this.writes++;
      const res = await fetch(WF + path, { method: o.method || 'GET', body: o.body ? JSON.stringify(o.body) : undefined,
        headers: Object.assign({ Authorization: 'Bearer ' + this.env.WEBFLOW_TOKEN, 'accept-version': '2.0.0' }, o.body ? { 'Content-Type': 'application/json' } : {}) });
      if (res.ok) return res.status === 204 ? {} : res.json();
      if (res.status === 404 && o.allow404) return null;
      if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) { this.retries++;
        const ra = Number(res.headers.get('Retry-After')); await sleep(ra > 0 ? Math.min(ra, 60) * 1000 : 1000 * Math.pow(2, attempt)); continue; }
      const txt = await res.text().catch(() => '');
      throw httpErr(res.status === 429 ? 503 : 502, 'Webflow HTTP ' + res.status + ' on ' + (o.method || 'GET') + ' ' + path + (txt ? ' · ' + txt.slice(0, 240) : ''));
    }
  }
  async publishers(fresh) {
    if (!fresh && PUBS.rows && Date.now() - PUBS.at < this.ttl) return PUBS.rows;
    const coll = this.cfg.collections.publishers, base = '/collections/' + coll + '/items?limit=' + PAGE + '&offset=';
    const rows = [];
    for (let i = 0; i < MAX_PAGES; i++) {
      const r = await this.wf(base + i * PAGE); const items = (r && r.items) || [];
      rows.push(...items); if (items.length < PAGE) break;
      if (i === MAX_PAGES - 1) throw httpErr(502, 'PUBLISHERS is over the read limit.');
    }
    PUBS = { at: Date.now(), rows: rows.filter(r => !r.isArchived) };
    return PUBS.rows;
  }
  async publisher(id) {
    if (!/^[0-9a-f]{24}$/.test(id || '')) throw httpErr(400, 'Missing or malformed publisher.');
    const row = (await this.publishers(true)).find(r => r.id === id);
    if (!row) throw httpErr(404, 'No PUBLISHERS item ' + id + '.');
    return row;
  }
  async setMembers(pub, ids) {
    const coll = this.cfg.collections.publishers, value = ids.join('\n');
    const r = await this.wf('/collections/' + coll + '/items/' + pub.id, { method: 'PATCH', body: { fieldData: { [JOIN.pub.members]: value } } });
    try { await this.wf('/collections/' + coll + '/items/publish', { method: 'POST', body: { itemIds: [pub.id] } }); }
    catch (e) { this.warn('Publishing the PUBLISHERS item failed: ' + ((e && e.message) || e) + '. The staged write stands.'); }
    PUBS = { at: 0, rows: null };
    const echoed = memberIds(fd(r)[JOIN.pub.members]);
    return JSON.stringify([...echoed].sort()) === JSON.stringify([...ids].sort());
  }
}

// ── routes ───────────────────────────────────────────────────
async function whoami(run, me) {
  const rows = await run.publishers(false);
  const mine = rows.filter(r => memberIds(fd(r)[JOIN.pub.members]).includes(me.id)).map(r => pubShape(run, r));
  let email = null;
  try { const m = await run.msMember(me.id); email = m && m.auth ? m.auth.email : null; } catch (e) { run.warn('Could not read the member\'s email.'); }
  return { ok: true, memberId: me.id, email, staff: me.staff, publishers: mine };
}

async function listMembers(run, publisherId) {
  const pub = await run.publisher(publisherId);
  const ids = memberIds(fd(pub)[JOIN.pub.members]);
  const rows = await Promise.all(ids.map(async id => {
    try { const m = await run.msMember(id); return m ? memberShape(run, m) : { id, missing: true }; }
    catch (e) { run.warn('Could not read ' + id + ' from Memberstack.'); return { id, unreadable: true }; }
  }));
  return { ok: true, publisher: pubShape(run, pub), members: rows };
}

async function addMember(run, me, b) {
  const pub = await run.publisher(b.publisher);
  const email = String(b.email || '').trim().toLowerCase();
  const first = String(b.firstName || '').trim(), last = String(b.lastName || '').trim();
  if (!EMAIL_RE.test(email)) throw httpErr(400, 'A valid email is required.');
  if (!first || !last) throw httpErr(400, 'First and last name are required.');
  const plan = run.cfg.portalPlanId, path = portalPath(run, pub), unconfirmed = [];

  // 1. find or create the login
  let m = await run.msMember(email), created = false;
  if (!m) {
    const cf = {}; cf[run.cfg.nameFields.first] = first; cf[run.cfg.nameFields.last] = last;
    const r = await run.ms('/members', { method: 'POST', body: { email, plans: [{ planId: plan }], customFields: cf, loginRedirect: path } });
    m = r && r.data; if (!m || !MEM_RE.test(m.id || '')) throw httpErr(502, 'Memberstack answered the create with no member id.');
    created = true;
  }
  // 2. the portal plan
  if (!hasPlan(m, plan)) await run.ms('/members/' + m.id + '/add-plan', { method: 'POST', body: { planId: plan } });
  // 3. a redirect only when the person has none (an existing member may already belong elsewhere)
  if (!created && !m.loginRedirect) await run.ms('/members/' + m.id, { method: 'PATCH', body: { loginRedirect: path } });
  // TOAST-TRUTH on Memberstack: read the member back
  const back = await run.msMember(m.id);
  if (!back || !hasPlan(back, plan)) unconfirmed.push('memberstack-plan');
  if (created && back && String((back.auth || {}).email || '').toLowerCase() !== email) unconfirmed.push('memberstack-email');

  // 4. the link on PUBLISHERS
  const ids = memberIds(fd(pub)[JOIN.pub.members]);
  const already = ids.includes(m.id);
  if (!already && !(await run.setMembers(pub, ids.concat(m.id)))) unconfirmed.push(JOIN.pub.members);

  return { ok: unconfirmed.length === 0, created, alreadyLinked: already, enteredBy: me.id,
    member: memberShape(run, back || m), publisher: pubShape(run, pub), unconfirmed };
}

async function removeMember(run, memId, b) {
  const pub = await run.publisher(b && b.publisher);
  const ids = memberIds(fd(pub)[JOIN.pub.members]);
  if (!ids.includes(memId)) return { ok: true, removed: false, note: 'That member is not on this publisher.' };
  const unconfirmed = [];
  if (!(await run.setMembers(pub, ids.filter(x => x !== memId)))) unconfirmed.push(JOIN.pub.members);
  const elsewhere = (await run.publishers(true)).some(r => r.id !== pub.id && memberIds(fd(r)[JOIN.pub.members]).includes(memId));
  let planRemoved = false;
  if (!elsewhere && !run.cfg.staffMemberIds.includes(memId)) {
    await run.ms('/members/' + memId + '/remove-plan', { method: 'POST', body: { planId: run.cfg.portalPlanId } });
    const back = await run.msMember(memId);
    if (back && hasPlan(back, run.cfg.portalPlanId)) unconfirmed.push('memberstack-plan'); else planRemoved = true;
  }
  return { ok: unconfirmed.length === 0, removed: true, planRemoved, stillOnOtherPublishers: elsewhere, unconfirmed };
}

// ── shapes, helpers ──────────────────────────────────────────
function pubShape(run, r) { const f = fd(r); return { id: r.id, name: String(f.name || ''), slug: String(f.slug || ''), portalPath: portalPath(run, r) }; }
function portalPath(run, r) { return run.cfg.portalPath.replace(/\/?$/, '/') + String(fd(r).slug || ''); }
function memberShape(run, m) {
  const cf = m.customFields || {};
  return { id: m.id, email: (m.auth || {}).email || null, firstName: cf[run.cfg.nameFields.first] || '', lastName: cf[run.cfg.nameFields.last] || '',
    createdAt: m.createdAt || null, hasPortalPlan: hasPlan(m, run.cfg.portalPlanId), loginRedirect: m.loginRedirect || null };
}
function hasPlan(m, planId) { return ((m && m.planConnections) || []).some(c => c && c.planId === planId && (c.active !== false) && String(c.status || 'ACTIVE').toUpperCase() !== 'CANCELED'); }
function memberIds(v) { return [...new Set(String(v || '').split(/[\s,]+/).map(s => s.trim()).filter(s => MEM_RE.test(s)))]; }
function fd(item) { return (item && item.fieldData) || {}; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function httpErr(status, message) { const e = new Error(message); e.status = status; return e; }
function json(obj, status, request, cfg) {
  const h = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
  const origin = request ? (request.headers.get('Origin') || '') : '';
  if (origin && cfg && (cfg.allowedOrigins || []).includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return new Response(JSON.stringify(obj), { status, headers: h });
}
