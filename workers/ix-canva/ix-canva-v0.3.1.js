// workers/ix-canva/ix-canva-v0.3.1.js
// ============================================================
// INBXIFY · Cloudflare Worker · ix-canva
// Host: ix-canva.jeff-2cd.workers.dev
//
// v0.3.1 (18 Nov 2026, Ad Maker Build S3) — DRAFTS THAT STAY, APPROVED ADS FROZEN.
//   Rulings (Jeff, 18 Nov): a draft stays in Canva and is listed under its customer; an approved ad is frozen, so
//   Edit in Canva on it starts a copy; approved designs are marked in Canva. Canva's API cannot rename a design
//   (checked 18 Nov: the Designs group has create, list, get, pages, export formats, dataset), so the mark is an
//   "Approved" subfolder inside the customer's folder. Edit in Canva works from the design id, so the move hides nothing.
//   · One DRAFT RECORD per design (KV draft:<customer id>:<design id>, no expiry): { designId, customer, shape, title,
//     state draft | sent | approved, adId, made, updated, exportedAt, folderId, copiedFrom }. Jobs still lapse after
//     30 days; the record does not, so a draft never drops off the list on its own. Written when a job is made,
//     opened again or exported. Jobs from before v0.3.1 are read into records once (the first GET /drafts).
//   · GET  /drafts?customer=<id>[,<id>…]   the records of those customers, newest first, each with Canva's thumbnail
//                                          (15-minute link) and current title. A design deleted in Canva drops off.
//          /drafts (no customer)           every record, no thumbnails (the Ads tab's counts).
//   · POST /design/state { designId, customer{id,name}, shape?, state, adId? }   Ad Maker records what became of a
//     design: sent (it has an ADS row, Pending or Sent back) or approved. approved moves the design into the
//     customer's "Approved" subfolder (made on first use). Answers { draft, moved }.
//   · POST /draft/remove { designId, customerId }   takes a draft off the list. The design stays in Canva (Canva's API
//     has no delete). Only a draft: a sent or approved design keeps its record.
//   · POST /job/from-design   an approved design is never opened for editing: the Worker copies it (Canva "copy of an
//     existing design", a preview API), files the copy in the customer's folder and opens the copy as a new draft.
//     { copy:true } asks for a copy of any design. Answers copied:true and copiedFrom.
//   · POST /design/link       refuses an approved design (409) unless { view:true }.
//   · api() errors carry Canva's status (canvaStatus), so a 404 on a design reads as "deleted in Canva".
//   HARDCODING: HC-P-CANVA1-12 APPROVED_FOLDER "Approved"; HC-P-CANVA1-13 DRAFT_THUMBS 24 (designs looked up per call);
//   HC-P-CANVA1-14 DRAFT_STATES draft / sent / approved.
// v0.3.0 (18 Nov 2026, Ad Maker Build S1) — THE INBXIFY APP INSIDE CANVA.
//   The inbxify Canva app (side panel, canva-app/ in the repo) shows the match sheet for the design that is open: the
//   colours with hex codes, each line of text with the closest Canva font, weight, size and colour, and Add buttons
//   that place the text on the design. This Worker serves it:
//   · GET  /app/job          the job for the design the app is open on. Proof of who and which design: the Canva user
//                            token (Authorization: Bearer) and the design token (X-Design-Token), both verified against
//                            the app's public keys with aud = CANVA_APP_ID. The design id finds the job (design→job map,
//                            or a scan of the jobs for designs sent before v0.3.0).
//   · POST /job/<id>/sheet   Ad Maker stores the match sheet it read off the ad (staff login). {failed:"why"} records
//                            a failed read so the app stops waiting.
//   · POST /job              now also keeps Ad Maker's words list and the colours, and sheetPending:true marks the
//                            sheet as on its way.
//   · CORS: the app's own origin (https://app-<app id lower-case>.canva-apps.com) is allowed without a setting, with
//     the X-Design-Token header.
//   · verifyJwt takes the audience it must match (client id for Canva's Return token, app id for app tokens).
//   HARDCODING: HC-P-CANVA1-9 the app origin pattern; HC-P-CANVA1-10 SHEET_MAX 64 KB; HC-P-CANVA1-11 job scan limit 1000.
// v0.2.1 (18 Nov 2026, Ad Maker Build S1, test 1) — NAMES CANVA ACCEPTS, AND THE CUSTOMER'S OWN FOLDER NAME.
//   · Canva refuses an asset name over 50 characters ("Invalid upload metadata header", 400). Every uploaded
//     piece's name is now cut to 50, keeping the extension (found on Senior Care Authority - Northern & Central
//     New Jersey; the Graze Craze test names were short).
//   · The Projects folder is named for the customer alone, no "inbxify · " in front (Jeff, 18 Nov). Folders made
//     by v0.2.0 keep their old name and are left alone; the next job for that customer makes the new one.
//   · A remembered folder is checked before use: if it was deleted in Canva, the Worker forgets it and finds or
//     makes the folder again instead of leaving the pieces loose. A renamed folder keeps receiving (matched by id).
// v0.2.0 (18 Nov 2026, Ad Maker Build S1) — THE JOB API FOR AD MAKER.
//   The test Worker (v0.1.x) proved the trip. This version is what the T-A Ads tab talks to:
//   · POST /job                 Ad Maker sends the pieces of one ad (PNGs as data URLs), the customer, the shape
//                               and the T-A page address. The Worker files the pieces in the customer's Projects
//                               folder in Canva, makes a blank design at the shape's size, and answers with the job
//                               id, the design id and an Edit in Canva link carrying the job id.
//   · POST /job/from-design     The same, for a design that already exists (Edit in Canva again on a saved version).
//   · GET  /job/<id>            Where the job stands: open · exported (with the export's time) · failed.
//   · GET  /job/<id>/png        The exported PNG itself, proxied with CORS so the page can upload it to Uploadcare.
//                               Exports again when Canva's 24-hour link has lapsed.
//   · POST /job/<id>/export     Export now, without Canva's Return button (the page's "Fetch from Canva").
//   · POST /design/link         A fresh Edit in Canva link for a design id (links last 30 days; one per click).
//   · GET  /return              Canva's Return button lands here. The token is verified against the app's public
//                               keys (JWKS, aud = client id); the job named in it is exported at 2× and marked
//                               exported; the page says to go back to the inbxify tab and shows the picture.
//   · GET  /connect, /oauth/callback, /test, /health as before (the test page stays for diagnosis).
//   Who may call: every /job, /design route needs the T-A page's Memberstack login, checked through the MEMBERS
//   service binding to ix-members, staff only (the same check ix-sales makes). Browser calls come only from the
//   origins in ALLOWED_ORIGINS. /return is Canva's and is public; it trusts only a verified token.
//
//   Cloudflare settings (Settings → Variables and Secrets, Bindings)
//   · CANVA_CLIENT_ID      text    the app's Client ID (OC-…)
//   · CANVA_APP_ID         text    the app's App ID (AAHOGMgrrlE), for the JWKS address
//   · CANVA_CLIENT_SECRET  secret
//   · ALLOWED_ORIGINS      text    comma-separated, e.g. https://www.inbxify.com,https://inbxify.webflow.io
//   · CANVA_KV             KV namespace binding (login tokens, jobs)
//   · MEMBERS              service binding → ix-members (the login check)
//   · BASE_URL             text, optional; default https://ix-canva.jeff-2cd.workers.dev
//   · TEST_PAGE            text, optional; "on" shows /test (off by default: the page needs no login)
//
//   HARDCODING (provisional ids for the HC delta)
//   · HC-P-CANVA1-1  SHAPES banner 700×235, sidebar 480×400, splash 1080×1280 (TA_CONFIG.elementTypes.ads has the same)
//   · HC-P-CANVA1-2  SCOPES asked for on /connect
//   · HC-P-CANVA1-3  POLL 1.5 s × 60 for Canva jobs
//   · HC-P-CANVA1-4  EXPORT_SCALE 2 (PNG at twice the ad size, for phones)
//   · HC-P-CANVA1-5  JOB_TTL 30 days; a job and its export note live that long in KV
//   · HC-P-CANVA1-6  FOLDER_PREFIX "inbxify · " on the Projects folder name
// v0.1.3 (18 Nov 2026) — the test Worker: /connect, /test, /return; see the git history for its notes.
// ============================================================

const VERSION = '0.3.1';
const SHEET_MAX = 65536;   // HC-P-CANVA1-10
const APPROVED_FOLDER = 'Approved';   // HC-P-CANVA1-12 · v0.3.1: the subfolder approved designs move to
const DRAFT_THUMBS = 24;              // HC-P-CANVA1-13 · v0.3.1: designs looked up in Canva per GET /drafts
const DRAFT_STATES = ['draft', 'sent', 'approved'];   // HC-P-CANVA1-14
const SCAN_MAX = 1000;     // HC-P-CANVA1-11
const CANVA_API = 'https://api.canva.com/rest/v1';
const CANVA_AUTH = 'https://www.canva.com/api/oauth/authorize';
const SCOPES = ['asset:read', 'asset:write', 'design:content:read', 'design:content:write', 'design:meta:read', 'design:meta:write', 'folder:read', 'folder:write', 'profile:read'];   // HC-P-CANVA1-2
const SHAPES = { banner: { w: 700, h: 235, label: 'Banner' }, sidebar: { w: 480, h: 400, label: 'Sidebar' }, splash: { w: 1080, h: 1280, label: 'Splash' } };   // HC-P-CANVA1-1
const POLL_MS = 1500, POLL_MAX = 60;   // HC-P-CANVA1-3
const EXPORT_SCALE = 2;                // HC-P-CANVA1-4
const JOB_TTL = 86400 * 30;            // HC-P-CANVA1-5
const FOLDER_PREFIX = '';   // HC-P-CANVA1-6 · v0.2.1: none (Jeff, 18 Nov); the folder carries the customer's name alone
const NAME_MAX = 50;       // HC-P-CANVA1-8 · Canva's limit on an asset name (unencoded)
function canvaName(n) { n = String(n || 'piece.png').trim(); if (n.length <= NAME_MAX) return n; const m = n.match(/(\.[A-Za-z0-9]{2,5})$/), ext = m ? m[1] : ''; return n.slice(0, NAME_MAX - ext.length).replace(/[\s.\-\u00b7]+$/, '') + ext; }
function dot(x, delay) { return { ddd: 0, ind: 1, ty: 4, nm: 'dot', sr: 1, ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [x, 80, 0] }, a: { a: 0, k: [0, 0, 0] },
  s: { a: 1, k: [{ i: { x: [.4, .4, .4], y: [1, 1, 1] }, o: { x: [.6, .6, .6], y: [0, 0, 0] }, t: delay, s: [60, 60, 100] }, { i: { x: [.4, .4, .4], y: [1, 1, 1] }, o: { x: [.6, .6, .6], y: [0, 0, 0] }, t: delay + 15, s: [130, 130, 100] }, { t: delay + 30, s: [60, 60, 100] }] } },
  ao: 0, shapes: [{ ty: 'gr', it: [{ ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [22, 22] } }, { ty: 'fl', c: { a: 0, k: [0.133, 0.145, 0.169, 1] }, o: { a: 0, k: 100 } }, { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }] }], ip: 0, op: 60, st: 0, bm: 0 }; }
const LOTTIE = { v: '5.7.4', fr: 30, ip: 0, op: 60, w: 160, h: 160, nm: 'ix-wait', ddd: 0, assets: [], layers: [dot(44, 0), dot(80, 8), dot(116, 16)] };

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const p = url.pathname.replace(/\/+$/, '') || '/';
    const origin = req.headers.get('Origin') || '';
    if (req.method === 'OPTIONS') return preflight(env, origin);
    try {
      if (p === '/health') return json(env, origin, { ok: true, version: VERSION, connected: !!(await env.CANVA_KV.get('tokens')) });
      if (p === '/' || p === '/test' || p === '/test/edit') { if (String(env.TEST_PAGE || '') !== 'on') return json(env, origin, { ok: false, error: 'The test page is off (set TEST_PAGE=on on the Worker to use it).' }, 404); if (p === '/test/edit') return testEdit(env, url); return html(await testPage(env, url)); }
      if (p === '/connect') return connect(env, url);
      if (p === '/oauth/callback') return callback(env, url);
      if (p === '/test/start' && req.method === 'POST') { if (String(env.TEST_PAGE || '') !== 'on') return json(env, origin, { ok: false, error: 'The test page is off.' }, 404); return startTest(env, url, await req.formData()); }
      if (p === '/return') return html(returnShell(url));
      if (p === '/return/run') return returned(env, url);
      // ── the job API (Ad Maker) ──
      if (p === '/job' && req.method === 'POST') { const who = await authorize(env, req, origin); return json(env, origin, await jobCreate(env, await readJson(req), who)); }
      if (p === '/job/from-design' && req.method === 'POST') { const who = await authorize(env, req, origin); return json(env, origin, await jobFromDesign(env, await readJson(req), who)); }
      let m = p.match(/^\/job\/([A-Za-z0-9_-]+)$/);
      if (m && req.method === 'GET') { await authorize(env, req, origin); return json(env, origin, await jobGet(env, m[1])); }
      m = p.match(/^\/job\/([A-Za-z0-9_-]+)\/png$/);
      if (m && req.method === 'GET') { await authorize(env, req, origin); return jobPng(env, origin, m[1]); }
      m = p.match(/^\/job\/([A-Za-z0-9_-]+)\/export$/);
      if (m && req.method === 'POST') { await authorize(env, req, origin); return json(env, origin, await jobExport(env, m[1], 'page')); }
      m = p.match(/^\/job\/([A-Za-z0-9_-]+)\/sheet$/);
      if (m && req.method === 'POST') { await authorize(env, req, origin); return json(env, origin, await jobSheet(env, m[1], await readJson(req))); }   // v0.3.0
      if (p === '/app/job' && req.method === 'GET') return json(env, origin, await appJob(env, req));   // v0.3.0: the Canva app
      if (p === '/drafts' && req.method === 'GET') { await authorize(env, req, origin); return json(env, origin, await draftsList(env, url)); }   // v0.3.1
      if (p === '/design/state' && req.method === 'POST') { const who = await authorize(env, req, origin); return json(env, origin, await designState(env, await readJson(req), who)); }   // v0.3.1
      if (p === '/draft/remove' && req.method === 'POST') { await authorize(env, req, origin); return json(env, origin, await draftRemove(env, await readJson(req))); }   // v0.3.1
      if (p === '/design/link' && req.method === 'POST') { await authorize(env, req, origin); return json(env, origin, await designLink(env, await readJson(req))); }
      return json(env, origin, { ok: false, error: 'Not found' }, 404);
    } catch (e) {
      const status = e && e.status ? e.status : 500, msg = (e && e.message) || String(e);
      if (req.headers.get('Accept') && /text\/html/.test(req.headers.get('Accept')) && !p.startsWith('/job') && !p.startsWith('/design') && !p.startsWith('/app') && !p.startsWith('/draft')) return html(page('Something went wrong', `<p class="bad">${esc(msg)}</p><p><a href="/test">Back to the test page</a></p>`), status);
      return json(env, origin, { ok: false, error: msg }, status);
    }
  }
};

// ── helpers ───────────────────────────────────────────────────────────────
function httpErr(status, msg) { const e = new Error(msg); e.status = status; return e; }
function base(env) { return String(env.BASE_URL || 'https://ix-canva.jeff-2cd.workers.dev').replace(/\/$/, ''); }
function appOrigin(env) { return env.CANVA_APP_ID ? 'https://app-' + String(env.CANVA_APP_ID).toLowerCase() + '.canva-apps.com' : ''; }   // HC-P-CANVA1-9
function origins(env) { return String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean).concat(appOrigin(env) ? [appOrigin(env)] : []); }
function corsHeaders(env, origin) { const h = { 'Vary': 'Origin' }; if (origin && origins(env).includes(origin)) { h['Access-Control-Allow-Origin'] = origin; h['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Design-Token'; h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'; } return h; }
function preflight(env, origin) { return new Response(null, { status: 204, headers: Object.assign({ 'Access-Control-Max-Age': '86400' }, corsHeaders(env, origin)) }); }
function json(env, origin, o, status) { return new Response(JSON.stringify(o), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, corsHeaders(env, origin)) }); }
function html(s, status) { return new Response(s, { status: status || 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function b64url(bytes) { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function b64urlDecode(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
function rnd(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return b64url(a); }
async function sha256(s) { return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function readJson(req) { try { return await req.json(); } catch (e) { throw httpErr(400, 'The body is not JSON.'); } }
function dataUrlBytes(d) {   // "data:image/png;base64,…" → { bytes, type }
  const m = String(d || '').match(/^data:([^;,]+)?(;base64)?,(.*)$/s); if (!m) throw httpErr(400, 'A piece is not a data URL.');
  const type = m[1] || 'application/octet-stream'; if (!m[2]) return { bytes: new TextEncoder().encode(decodeURIComponent(m[3])).buffer, type };
  const bin = atob(m[3]); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return { bytes: out.buffer, type };
}

// ── who is calling (the T-A page's login, through ix-members, staff only) ──
async function authorize(env, req, origin) {
  if (!origin || !origins(env).includes(origin)) throw httpErr(403, 'This origin may not call ix-canva (ALLOWED_ORIGINS).');
  const auth = req.headers.get('Authorization') || '';
  if (!/^Bearer\s+\S+/i.test(auth)) throw httpErr(401, 'Not logged in: no Memberstack token was sent.');
  if (!env.MEMBERS || typeof env.MEMBERS.fetch !== 'function') throw httpErr(500, 'The MEMBERS service binding (to ix-members) is not set on this Worker.');
  let res, j = null;
  try { res = await env.MEMBERS.fetch(new Request('https://ix-members/whoami', { headers: { Authorization: auth } })); j = await res.json().catch(() => null); }
  catch (e) { throw httpErr(502, 'ix-members did not answer: ' + ((e && e.message) || e)); }
  if (!res.ok || !j || !j.ok) throw httpErr(res && res.status === 401 ? 401 : 403, (j && j.error) || 'The login check failed.');
  if (!j.staff) throw httpErr(403, 'Only inbxify staff can send ads to Canva.');
  return { memberId: j.memberId, email: j.email || '' };
}

// ── page shell (test and return pages) ────────────────────────────────────
function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>ix-canva · ${esc(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;background:#FAF6EE;color:#22252B;font:14px/1.45 Sen,system-ui,sans-serif}
main{max-width:860px;margin:0 auto;padding:32px 24px 64px}
h1{font:400 34px/1.1 Newsreader,Georgia,serif;margin:0 0 6px;letter-spacing:-.3px}
h2{font:600 12px/1 'Josefin Sans',system-ui,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#5A5E66;margin:28px 0 8px}
.sub{color:#5A5E66;margin:0 0 20px}
.card{background:#fff;border:1px solid #D9D2C3;border-radius:3px;padding:18px 20px}
label{display:block;font-weight:700;margin:14px 0 6px}
input[type=text],textarea,select{width:100%;box-sizing:border-box;border:1px solid #D9D2C3;border-radius:3px;padding:8px 10px;font:inherit;background:#fff}
textarea{min-height:110px}
.btn{display:inline-block;height:36px;line-height:36px;padding:0 18px;border:0;border-radius:3px;background:#22252B;color:#fff;font:600 13px Sen,system-ui,sans-serif;cursor:pointer;text-decoration:none}
.btn.sec{background:#fff;color:#22252B;border:1px solid #22252B;line-height:34px}
.ok{color:#0F5C3F}.bad{color:#C2271A}.quiet{color:#5A5E66;font-size:12px}
.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.pill{display:inline-block;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:700;background:#E2F1E9;color:#0F5C3F}
.pill.off{background:#FBE3DD;color:#C2271A}
code{background:#F1ECE2;padding:1px 5px;border-radius:2px}
img.ad{max-width:100%;border:1px solid #D9D2C3;background:#fff}
ul.steps{padding-left:18px}ul.steps li{margin:4px 0}
#ix-wait{position:fixed;inset:0;background:rgba(250,246,238,.92);display:none;align-items:center;justify-content:center;flex-direction:column;gap:6px;z-index:50}
#ix-wait.on{display:flex}
#ix-wait .lot{width:160px;height:160px}
#ix-wait .w1{font:400 22px/1.2 Newsreader,Georgia,serif}
#ix-wait .w2{color:#5A5E66;font-size:13px}
</style></head><body><main>${body}</main>
<div id="ix-wait" role="status" aria-live="polite"><div class="lot" id="ix-lot"></div><div class="w1" id="ix-w1">Working</div><div class="w2" id="ix-w2"></div></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
<script>
(function(){
  var ANIM=${JSON.stringify(LOTTIE)};
  var box=document.getElementById('ix-wait'), lot=document.getElementById('ix-lot'), w1=document.getElementById('ix-w1'), w2=document.getElementById('ix-w2'), started=false;
  window.ixWait=function(t1,t2){ box.classList.add('on'); w1.textContent=t1||'Working'; w2.textContent=t2||'';
    if(!started){ started=true; try{ if(window.lottie) lottie.loadAnimation({container:lot,renderer:'svg',loop:true,autoplay:true,animationData:ANIM}); else lot.innerHTML='<div style="width:48px;height:48px;border:4px solid #D9D2C3;border-top-color:#22252B;border-radius:50%;animation:ixspin 1s linear infinite;margin:56px auto"></div><style>@keyframes ixspin{to{transform:rotate(360deg)}}</style>'; }catch(e){} } };
  window.ixWaitOff=function(){ box.classList.remove('on'); };
  var f=document.querySelector('form[action="/test/start"]');
  if(f) f.addEventListener('submit',function(){ var r=(f.querySelector('input[name=route]:checked')||{}).value; ixWait('Sending to Canva', r==='layers'?'Uploading the picture, then Canva splits it into layers. Up to a minute.':'Uploading the pieces into the customer\\'s folder, then making the blank design. A few seconds.'); });
})();
</script></body></html>`;
}

// ── Canva tokens and calls ────────────────────────────────────────────────
async function tokens(env) {
  const t = await env.CANVA_KV.get('tokens', 'json');
  if (!t) return null;
  if (Date.now() < (t.expires_at || 0) - 60000) return t;
  const r = await fetch(CANVA_API + '/oauth/token', { method: 'POST', headers: authBasic(env, { 'Content-Type': 'application/x-www-form-urlencoded' }),
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: t.refresh_token }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) { await env.CANVA_KV.delete('tokens'); throw httpErr(502, 'Canva refused to refresh the login (' + r.status + '). Open ' + base(env) + '/connect and approve the app again.'); }
  const nt = { access_token: j.access_token, refresh_token: j.refresh_token || t.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, name: t.name };
  await env.CANVA_KV.put('tokens', JSON.stringify(nt));
  return nt;
}
function authBasic(env, extra) { return Object.assign({ Authorization: 'Basic ' + btoa(env.CANVA_CLIENT_ID + ':' + env.CANVA_CLIENT_SECRET) }, extra || {}); }
async function api(env, path, opts) {
  const t = await tokens(env); if (!t) throw httpErr(503, 'ix-canva is not connected to a Canva account. Open ' + base(env) + '/connect first.');
  opts = opts || {};
  const headers = Object.assign({ Authorization: 'Bearer ' + t.access_token }, opts.headers || {});
  let body = opts.body;
  if (body && typeof body === 'object' && !(body instanceof ArrayBuffer) && !(body instanceof Uint8Array)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
  const r = await fetch(CANVA_API + path, { method: opts.method || 'GET', headers, body });
  const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch (e) {}
  if (!r.ok) { const e = httpErr(502, 'Canva ' + (opts.method || 'GET') + ' ' + path + ' answered ' + r.status + (j && (j.message || j.code) ? ': ' + (j.code ? j.code + ' · ' : '') + (j.message || '') : txt ? ': ' + txt.slice(0, 300) : '')); e.canvaStatus = r.status; throw e; }   // v0.3.1: the status travels
  return j;
}
async function poll(env, path, pick) {
  for (let i = 0; i < POLL_MAX; i++) {
    const j = await api(env, path), job = j.job || {};
    if (job.status === 'success') return pick ? pick(job) : job;
    if (job.status === 'failed') throw httpErr(502, 'Canva job failed: ' + ((job.error && (job.error.code + ' · ' + job.error.message)) || 'no reason given'));
    await sleep(POLL_MS);
  }
  throw httpErr(504, 'Canva job did not finish in time (' + path + ').');
}

// ── OAuth ─────────────────────────────────────────────────────────────────
async function connect(env, url) {
  if (!env.CANVA_CLIENT_ID || !env.CANVA_CLIENT_SECRET) return html(page('Not set up', '<p class="bad">CANVA_CLIENT_ID or CANVA_CLIENT_SECRET is missing on the Worker.</p>'));
  const verifier = rnd(48), state = rnd(16), challenge = b64url(await sha256(verifier));
  await env.CANVA_KV.put('pkce:' + state, verifier, { expirationTtl: 600 });
  const q = new URLSearchParams({ code_challenge_method: 's256', response_type: 'code', client_id: env.CANVA_CLIENT_ID, scope: SCOPES.join(' '), code_challenge: challenge, state, redirect_uri: base(env) + '/oauth/callback' });
  return Response.redirect(CANVA_AUTH + '?' + q.toString(), 302);
}
async function callback(env, url) {
  const code = url.searchParams.get('code'), state = url.searchParams.get('state'), err = url.searchParams.get('error');
  if (err) return html(page('Canva said no', `<p class="bad">Canva answered: ${esc(err)} ${esc(url.searchParams.get('error_description') || '')}</p><p><a class="btn" href="/connect">Try again</a></p>`));
  const verifier = state && await env.CANVA_KV.get('pkce:' + state);
  if (!code || !verifier) return html(page('Login expired', '<p class="bad">The sign-in took too long or the state did not match.</p><p><a class="btn" href="/connect">Start again</a></p>'));
  await env.CANVA_KV.delete('pkce:' + state);
  const r = await fetch(CANVA_API + '/oauth/token', { method: 'POST', headers: authBasic(env, { 'Content-Type': 'application/x-www-form-urlencoded' }),
    body: new URLSearchParams({ grant_type: 'authorization_code', code, code_verifier: verifier, redirect_uri: base(env) + '/oauth/callback' }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) return html(page('Token refused', `<p class="bad">Canva did not give a token (${r.status}): ${esc(JSON.stringify(j))}</p>`));
  const t = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, name: '' };
  await env.CANVA_KV.put('tokens', JSON.stringify(t));
  try { const me = await api(env, '/users/me/profile'); t.name = (me.profile && me.profile.display_name) || ''; await env.CANVA_KV.put('tokens', JSON.stringify(t)); } catch (e) {}
  return Response.redirect(base(env) + '/test?connected=1', 302);
}

// ── Canva pieces: folders, uploads, designs, exports ──────────────────────
async function folderFor(env, customer) {
  const want = FOLDER_PREFIX + customer;
  const key = 'folder:' + want; const known = await env.CANVA_KV.get(key);
  if (known) { try { await api(env, '/folders/' + encodeURIComponent(known)); return known; } catch (e) { await env.CANVA_KV.delete(key); } }   // v0.2.1: deleted in Canva → find or make it again
  try {
    const list = await api(env, '/folders/root/items?item_types=folder&limit=100');
    const hit = (list.items || []).find(it => it.folder && it.folder.name === want);
    if (hit) { await env.CANVA_KV.put(key, hit.folder.id); return hit.folder.id; }
  } catch (e) { /* listing is best effort */ }
  const f = await api(env, '/folders', { method: 'POST', body: { name: want, parent_folder_id: 'root' } });
  await env.CANVA_KV.put(key, f.folder.id);
  return f.folder.id;
}
async function moveTo(env, folderId, itemId) { try { await api(env, '/folders/move', { method: 'POST', body: { to_folder_id: folderId, item_id: itemId } }); return true; } catch (e) { return false; } }
async function uploadBytes(env, bytes, name) {
  name = canvaName(name);   // v0.2.1
  const meta = JSON.stringify({ name_base64: btoa(unescape(encodeURIComponent(name))) });
  const j = await api(env, '/asset-uploads', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'Asset-Upload-Metadata': meta }, body: bytes });
  const asset = await poll(env, '/asset-uploads/' + j.job.id, job => job.asset);
  return { id: asset.id, name };
}
async function fetchBytes(link) {
  const r = await fetch(link, { headers: { 'User-Agent': 'ix-canva/' + VERSION } });
  if (!r.ok) throw httpErr(502, 'Could not fetch ' + link + ' (' + r.status + ')');
  return { bytes: await r.arrayBuffer(), type: (r.headers.get('content-type') || '').split(';')[0].trim() };
}
function nameFrom(link, i, type) {
  let n = ''; try { n = decodeURIComponent(new URL(link).pathname.split('/').filter(Boolean).pop() || ''); } catch (e) {}
  if (!/\.(png|jpe?g|gif|webp)$/i.test(n)) n = 'piece-' + (i + 1) + (type === 'image/jpeg' ? '.jpg' : '.png');
  return n;
}
function editUrlWithState(editUrl, state) { return editUrl + (editUrl.includes('?') ? '&' : '?') + 'correlation_state=' + encodeURIComponent(state); }
async function exportPng(env, designId, shape) {
  const S = SHAPES[shape] || null, fmt = { type: 'png' };
  if (S) { fmt.width = S.w * EXPORT_SCALE; fmt.height = S.h * EXPORT_SCALE; }
  const j = await api(env, '/exports', { method: 'POST', body: { design_id: designId, format: fmt } });
  const urls = await poll(env, '/exports/' + j.job.id, job => job.urls || []);
  if (!urls.length) throw httpErr(502, 'Canva exported nothing.');
  return urls[0];
}

// ── jobs ──────────────────────────────────────────────────────────────────
function jobKey(id) { return 'job:' + id; }
async function loadJob(env, id) { const j = await env.CANVA_KV.get(jobKey(id), 'json'); if (!j) throw httpErr(404, 'No job ' + id + ' (jobs are kept 30 days).'); return j; }
async function saveJob(env, j) { await env.CANVA_KV.put(jobKey(j.id), JSON.stringify(j), { expirationTtl: JOB_TTL }); if (j.designId) await env.CANVA_KV.put('design:' + j.designId, j.id, { expirationTtl: JOB_TTL }); return j; }   // v0.3.0: design → newest job
function jobOut(j) { return { id: j.id, designId: j.designId, customer: j.customer, shape: j.shape, title: j.title, status: j.status, exportedAt: j.exportedAt || null, exportFrom: j.exportFrom || '', folderId: j.folderId || '', notes: j.notes || [], error: j.error || '', taUrl: j.taUrl || '' }; }
async function jobCreate(env, b, who) {
  const customer = b.customer && typeof b.customer === 'object' ? { id: String(b.customer.id || ''), name: String(b.customer.name || '').trim() } : null;
  if (!customer || !customer.name) throw httpErr(400, 'customer.name is required.');
  const shape = SHAPES[String(b.shape)] ? String(b.shape) : null; if (!shape) throw httpErr(400, 'shape must be banner, sidebar or splash.');
  const S = SHAPES[shape], title = String(b.title || '').trim() || (customer.name + ' · ' + S.label + ' · ' + new Date().toISOString().slice(0, 10));
  const pieces = Array.isArray(b.pieces) ? b.pieces.slice(0, 40) : [];
  const links = Array.isArray(b.links) ? b.links.filter(s => /^https?:\/\//.test(String(s))).slice(0, 20) : [];
  const notes = [], t0 = Date.now();
  const folderId = await folderFor(env, customer.name); notes.push('Folder: ' + FOLDER_PREFIX + customer.name);
  const assets = [];
  for (let i = 0; i < pieces.length; i++) {
    const pc = pieces[i] || {}, name = String(pc.name || ('piece-' + (i + 1) + '.png')).replace(/[^\w .()\-·]+/g, '-');
    const d = dataUrlBytes(pc.dataUrl); const a = await uploadBytes(env, d.bytes, name); assets.push(a); await moveTo(env, folderId, a.id); notes.push('Piece: ' + name);
  }
  for (let i = 0; i < links.length; i++) {
    const f = await fetchBytes(links[i]); const a = await uploadBytes(env, f.bytes, nameFrom(links[i], i, f.type)); assets.push(a); await moveTo(env, folderId, a.id); notes.push('Picture: ' + a.name);
  }
  const d = await api(env, '/designs', { method: 'POST', body: { design_type: { type: 'custom', width: S.w, height: S.h }, title } });
  const design = d.design; await moveTo(env, folderId, design.id); notes.push('Blank ' + S.label + ' design, ' + S.w + ' × ' + S.h);
  const id = rnd(9);
  const job = { id, designId: design.id, customer, shape, title, taUrl: String(b.taUrl || ''), folderId, assets: assets.map(a => a.id), status: 'open', notes, by: who.email || who.memberId, made: new Date().toISOString(), ms: Date.now() - t0,
    words: cleanWords(b.words), colours: cleanColours(b.colours), sheetState: b.sheetPending ? 'pending' : 'none' };   // v0.3.0
  await saveJob(env, job);
  await draftTouch(env, job, { folderId });   // v0.3.1
  return { ok: true, job: jobOut(job), editUrl: editUrlWithState(design.urls.edit_url, id) };
}
async function carry(env, designId) {   // v0.3.0: a later job on the same design keeps the words and the sheet
  const prev = await jobForDesign(env, designId).catch(() => null);
  return prev ? { words: prev.words || [], colours: prev.colours || [], sheet: prev.sheet || null, sheetState: prev.sheet ? 'ready' : 'none' } : {};
}
async function jobFromDesign(env, b, who) {
  let designId = String(b.designId || '').trim(); if (!designId) throw httpErr(400, 'designId is required.');
  const customer = b.customer && typeof b.customer === 'object' ? { id: String(b.customer.id || ''), name: String(b.customer.name || '').trim() } : { id: '', name: '' };
  let d = await api(env, '/designs/' + encodeURIComponent(designId));
  const rec = await draftGet(env, customer.id, designId);
  const shape = SHAPES[String(b.shape)] ? String(b.shape) : (rec && rec.shape) || '';
  const carried = await carry(env, designId), notes = ['Opened again from a saved version'];
  let copiedFrom = '', folderId = (rec && rec.folderId) || '';
  if (b.copy || (rec && rec.state === 'approved')) {   // v0.3.1: an approved ad is frozen; the work goes on in a copy
    const c = await api(env, '/designs', { method: 'POST', body: { type: 'design', design_id: designId } });
    if (!c || !c.design || !c.design.id) throw httpErr(502, 'Canva did not answer with the copy.');
    copiedFrom = designId; designId = c.design.id; d = c;
    if (customer.name) { folderId = await folderFor(env, customer.name); await moveTo(env, folderId, designId); }
    notes[0] = 'A copy of ' + copiedFrom + (rec && rec.state === 'approved' ? ' (approved, so it stays as it is)' : '');
  }
  const id = rnd(9);
  const job = { ...carried, id, designId, customer, shape, title: (d.design && d.design.title) || designId, taUrl: String(b.taUrl || ''), status: 'open', notes, by: who.email || who.memberId, made: new Date().toISOString() };
  if (folderId) job.folderId = folderId;
  await saveJob(env, job);
  if (copiedFrom) await env.CANVA_KV.put('design:' + designId, id, { expirationTtl: JOB_TTL });
  const draft = await draftTouch(env, job, copiedFrom ? { state: 'draft', adId: '', copiedFrom, folderId } : (folderId ? { folderId } : {}));
  return { ok: true, job: jobOut(job), editUrl: editUrlWithState(d.design.urls.edit_url, id), copied: !!copiedFrom, copiedFrom, draft };
}
async function jobGet(env, id) { return { ok: true, job: jobOut(await loadJob(env, id)) }; }
async function jobExport(env, id, from) {
  const job = await loadJob(env, id);
  const url = await exportPng(env, job.designId, job.shape);
  job.status = 'exported'; job.exportUrl = url; job.exportedAt = new Date().toISOString(); job.exportFrom = from || 'page'; job.error = '';
  await saveJob(env, job);
  await draftTouch(env, job, { exportedAt: job.exportedAt });   // v0.3.1
  return { ok: true, job: jobOut(job) };
}
async function jobPng(env, origin, id) {
  const job = await loadJob(env, id);
  if (!job.exportUrl) throw httpErr(409, 'This job has not been exported yet. Press Return to inbxify in Canva, or Fetch from Canva here.');
  let r = await fetch(job.exportUrl);
  if (!r.ok) { await jobExport(env, id, job.exportFrom || 'page'); const j2 = await loadJob(env, id); r = await fetch(j2.exportUrl); if (!r.ok) throw httpErr(502, 'Canva’s export file could not be fetched (' + r.status + ').'); }
  const h = Object.assign({ 'Content-Type': 'image/png', 'Cache-Control': 'no-store', 'Content-Disposition': 'inline; filename="' + (job.title || 'ad').replace(/[^\w .\-]+/g, '-') + '.png"' }, corsHeaders(env, origin));
  return new Response(r.body, { status: 200, headers: h });
}
async function designLink(env, b) {
  const designId = String(b.designId || '').trim(); if (!designId) throw httpErr(400, 'designId is required.');
  const cust = b.customer && typeof b.customer === 'object' ? { id: String(b.customer.id || ''), name: String(b.customer.name || '').trim() } : { id: '', name: '' };
  const rec = await draftGet(env, cust.id, designId);
  if (rec && rec.state === 'approved' && !b.view) throw httpErr(409, 'That design is an approved ad, so it stays as it is. Edit in Canva starts a copy (POST /job/from-design).');   // v0.3.1
  const d = await api(env, '/designs/' + encodeURIComponent(designId));
  let state = String(b.jobId || '');
  if (!state) { const id = rnd(9); const job = { ...(await carry(env, designId)), id, designId, customer: cust, shape: SHAPES[String(b.shape)] ? String(b.shape) : (rec && rec.shape) || '', title: (d.design && d.design.title) || designId, taUrl: String(b.taUrl || ''), status: 'open', notes: ['Edit link'], made: new Date().toISOString() }; await saveJob(env, job); if (!b.view) await draftTouch(env, job); state = id; }
  return { ok: true, jobId: state, editUrl: editUrlWithState(d.design.urls.edit_url, state), viewUrl: (d.design.urls && d.design.urls.view_url) || '', title: (d.design && d.design.title) || '' };
}

// ── v0.3.1 · drafts: one record per design, kept until it is removed ──────
function draftKey(custId, designId) { return 'draft:' + custId + ':' + designId; }
async function draftGet(env, custId, designId) { return custId && designId ? await env.CANVA_KV.get(draftKey(custId, designId), 'json') : null; }
async function draftTouch(env, job, patch) {   // makes or updates the record of a job's design; a job with no customer id (the test page) keeps none
  const c = job.customer || {}; if (!c.id || !job.designId) return null;
  const now = new Date().toISOString(), prev = await draftGet(env, c.id, job.designId);
  const d = Object.assign({ designId: job.designId, customer: { id: c.id, name: c.name || '' }, shape: job.shape || '', title: job.title || '', state: 'draft', adId: '', made: job.made || now, by: job.by || '', folderId: job.folderId || '', exportedAt: '', copiedFrom: '' }, prev || {}, patch || {}, { updated: now, jobId: job.id || (prev && prev.jobId) || '' });
  if (!d.shape && job.shape) d.shape = job.shape;
  if (!d.customer.name && c.name) d.customer.name = c.name;
  await env.CANVA_KV.put(draftKey(c.id, job.designId), JSON.stringify(d));   // no expirationTtl: a draft stays until it is removed
  return d;
}
async function draftBackfill(env) {   // once: the jobs made before v0.3.1 become records (newest job per design wins)
  if (await env.CANVA_KV.get('draftscan')) return 0;
  let cursor, seen = 0; const best = new Map();
  do {
    const page = await env.CANVA_KV.list({ prefix: 'job:', cursor, limit: 1000 }); cursor = page.list_complete ? null : page.cursor;
    for (const k of page.keys) { if (++seen > SCAN_MAX) break; const j = await env.CANVA_KV.get(k.name, 'json'); if (!j || !j.designId || !j.customer || !j.customer.id) continue; const key = j.customer.id + ':' + j.designId, b = best.get(key); if (!b || String(j.made) > String(b.made)) best.set(key, Object.assign({}, j, { exportedAt: (b && b.exportedAt) || j.exportedAt || '' })); else if (j.exportedAt && !b.exportedAt) b.exportedAt = j.exportedAt; }
  } while (cursor && seen < SCAN_MAX);
  let n = 0;
  for (const j of best.values()) { if (await draftGet(env, j.customer.id, j.designId)) continue; await draftTouch(env, j, { exportedAt: j.exportedAt || '', folderId: j.folderId || '' }); n++; }
  await env.CANVA_KV.put('draftscan', new Date().toISOString());
  return n;
}
async function draftRecords(env, prefix) {
  const out = []; let cursor;
  do {
    const page = await env.CANVA_KV.list({ prefix, cursor, limit: 1000 }); cursor = page.list_complete ? null : page.cursor;
    const got = await Promise.all(page.keys.map(k => env.CANVA_KV.get(k.name, 'json'))); got.forEach(d => { if (d && d.designId) out.push(d); });
  } while (cursor && out.length < SCAN_MAX);
  return out;
}
async function draftsList(env, url) {
  const backfilled = await draftBackfill(env);
  const ids = String(url.searchParams.get('customer') || '').split(',').map(x => x.trim()).filter(x => /^[A-Za-z0-9_-]{6,40}$/.test(x)).slice(0, 50);
  let recs = [];
  if (ids.length) for (const id of ids) recs = recs.concat(await draftRecords(env, 'draft:' + id + ':'));
  else recs = await draftRecords(env, 'draft:');
  recs.sort((a, b) => String(b.updated || b.made).localeCompare(String(a.updated || a.made)));
  let looked = 0;
  if (ids.length) {   // with a customer named: Canva's thumbnail and title, and a design deleted in Canva drops off
    const head = recs.slice(0, DRAFT_THUMBS); looked = head.length;
    await Promise.all(head.map(async r => {
      try { const d = (await api(env, '/designs/' + encodeURIComponent(r.designId))).design || {}; r.thumb = (d.thumbnail && d.thumbnail.url) || ''; if (d.title) r.title = d.title; r.canvaUpdated = d.updated_at ? new Date(d.updated_at * 1000).toISOString() : ''; }
      catch (e) { if (e && e.canvaStatus === 404) { r.gone = true; await env.CANVA_KV.delete(draftKey(r.customer.id, r.designId)); } else r.thumbError = (e && e.message) || String(e); }
    }));
    recs = recs.filter(r => !r.gone);
  }
  return { ok: true, drafts: recs.map(draftOut), looked, backfilled };
}
function draftOut(d) { return { designId: d.designId, customer: d.customer, shape: d.shape || '', title: d.title || '', state: DRAFT_STATES.includes(d.state) ? d.state : 'draft', adId: d.adId || '', made: d.made || '', updated: d.updated || '', exportedAt: d.exportedAt || '', copiedFrom: d.copiedFrom || '', thumb: d.thumb || '', canvaUpdated: d.canvaUpdated || '', thumbError: d.thumbError || '' }; }
async function approvedFolder(env, parentId) {   // the customer's "Approved" subfolder: remembered, else found, else made
  const key = 'folder-approved:' + parentId, known = await env.CANVA_KV.get(key);
  if (known) { try { await api(env, '/folders/' + encodeURIComponent(known)); return known; } catch (e) { await env.CANVA_KV.delete(key); } }
  try {
    const list = await api(env, '/folders/' + encodeURIComponent(parentId) + '/items?item_types=folder&limit=100');
    const hit = (list.items || []).find(it => it.folder && it.folder.name === APPROVED_FOLDER);
    if (hit) { await env.CANVA_KV.put(key, hit.folder.id); return hit.folder.id; }
  } catch (e) { /* listing is best effort */ }
  const f = await api(env, '/folders', { method: 'POST', body: { name: APPROVED_FOLDER, parent_folder_id: parentId } });
  await env.CANVA_KV.put(key, f.folder.id);
  return f.folder.id;
}
async function designState(env, b, who) {
  const designId = String(b.designId || '').trim(), state = String(b.state || '');
  const customer = b.customer && typeof b.customer === 'object' ? { id: String(b.customer.id || ''), name: String(b.customer.name || '').trim() } : { id: '', name: '' };
  if (!designId) throw httpErr(400, 'designId is required.');
  if (!customer.id) throw httpErr(400, 'customer.id is required.');
  if (!DRAFT_STATES.includes(state)) throw httpErr(400, 'state must be draft, sent or approved.');
  const prev = await draftGet(env, customer.id, designId);
  if (prev && prev.state === 'approved' && state !== 'approved') throw httpErr(409, 'That design is an approved ad. It keeps that mark.');
  const patch = { state }; if (b.adId) patch.adId = String(b.adId).slice(0, 40);
  let moved = false, moveNote = '';
  if (state === 'approved' && !(prev && prev.state === 'approved' && prev.approvedFolderId)) {
    try {
      const parent = (prev && prev.folderId) || (customer.name || (prev && prev.customer.name) ? await folderFor(env, customer.name || prev.customer.name) : '');
      if (!parent) throw new Error('the customer has no folder name to file under');
      const fid = await approvedFolder(env, parent);
      await api(env, '/folders/move', { method: 'POST', body: { to_folder_id: fid, item_id: designId } });
      moved = true; patch.folderId = parent; patch.approvedFolderId = fid; patch.approvedAt = new Date().toISOString();
    } catch (e) { moveNote = 'The design was marked approved here, but Canva did not move it into "' + APPROVED_FOLDER + '": ' + ((e && e.message) || e); }
  }
  const draft = await draftTouch(env, { designId, customer, shape: SHAPES[String(b.shape)] ? String(b.shape) : '', title: (prev && prev.title) || '', by: who.email || who.memberId }, patch);
  return { ok: true, draft: draftOut(draft), moved, moveNote };
}
async function draftRemove(env, b) {
  const designId = String(b.designId || '').trim(), custId = String(b.customerId || '').trim();
  if (!designId || !custId) throw httpErr(400, 'designId and customerId are required.');
  const d = await draftGet(env, custId, designId); if (!d) return { ok: true, removed: false };
  if (d.state !== 'draft') throw httpErr(409, 'Only a draft comes off the list. This design is ' + d.state + '.');
  await env.CANVA_KV.delete(draftKey(custId, designId));
  return { ok: true, removed: true };
}

// ── v0.3.0 · the match sheet and the app ──────────────────────────────────
function cleanHex(c) { const m = String(c || '').trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i); if (!m) return ''; const g = m[1].length === 3 ? m[1].split('').map(x => x + x).join('') : m[1]; return '#' + g.toUpperCase(); }
function cleanWords(a) { return (Array.isArray(a) ? a : []).slice(0, 30).map(w => ({ slot: String(w.slot || '').slice(0, 40), text: String(w.text || '').slice(0, 400), font: String(w.font || '').slice(0, 60), weight: +w.weight || 400, size: +w.size || 0, colour: cleanHex(w.colour) })).filter(w => w.text); }
function cleanColours(a) { return (Array.isArray(a) ? a : []).slice(0, 16).map(c => ({ hex: cleanHex(c.hex || c), where: String(c.where || '').slice(0, 60) })).filter(c => c.hex); }
function cleanSheet(x) {
  if (!x || typeof x !== 'object') throw httpErr(400, 'sheet must be an object.');
  const num = (v, d) => (isFinite(+v) && +v >= 0 ? +v : d), frac = v => Math.max(0, Math.min(1, +v || 0));
  const lines = (Array.isArray(x.lines) ? x.lines : []).slice(0, 30).map(l => ({
    text: String(l.text || '').slice(0, 400), role: String(l.role || '').slice(0, 40), font: String(l.font || '').slice(0, 60),
    alts: (Array.isArray(l.alts) ? l.alts : []).slice(0, 4).map(a => String(a).slice(0, 60)), weight: l.weight == null ? 400 : (isFinite(+l.weight) ? +l.weight : String(l.weight).slice(0, 20)),
    sizePx: num(l.sizePx, 16), colour: cleanHex(l.colour) || '#000000', align: ['start', 'center', 'end'].includes(l.align) ? l.align : 'start',
    box: l.box && typeof l.box === 'object' ? { x: frac(l.box.x), y: frac(l.box.y), w: frac(l.box.w), h: frac(l.box.h) } : null
  })).filter(l => l.text);
  return { srcW: num(x.srcW, 0), srcH: num(x.srcH, 0), background: cleanHex(x.background), colours: cleanColours(x.colours), lines, made: new Date().toISOString(), by: String(x.by || '').slice(0, 60) };
}
async function jobSheet(env, id, b) {
  const job = await loadJob(env, id);
  if (b && b.failed) { job.sheetState = 'failed'; job.sheetError = String(b.failed).slice(0, 300); await saveJob(env, job); return { ok: true, sheetState: 'failed' }; }
  const raw = JSON.stringify((b && b.sheet) || b || {}); if (raw.length > SHEET_MAX) throw httpErr(413, 'The sheet is over ' + SHEET_MAX + ' bytes.');
  job.sheet = cleanSheet((b && b.sheet) || b); job.sheetState = 'ready'; job.sheetError = '';
  await saveJob(env, job);
  return { ok: true, sheetState: 'ready', lines: job.sheet.lines.length, colours: job.sheet.colours.length };
}
async function jobForDesign(env, designId) {
  const id = await env.CANVA_KV.get('design:' + designId);
  if (id) { const j = await env.CANVA_KV.get(jobKey(id), 'json'); if (j) return j; }
  let cursor, best = null, seen = 0;   // designs sent before v0.3.0: scan the jobs once, then remember
  do {
    const page = await env.CANVA_KV.list({ prefix: 'job:', cursor, limit: 1000 }); cursor = page.list_complete ? null : page.cursor;
    for (const k of page.keys) { if (++seen > SCAN_MAX) break; const j = await env.CANVA_KV.get(k.name, 'json'); if (j && j.designId === designId && (!best || String(j.made) > String(best.made))) best = j; }
  } while (cursor && seen < SCAN_MAX);
  if (best) await env.CANVA_KV.put('design:' + designId, best.id, { expirationTtl: JOB_TTL });
  return best;
}
async function appJob(env, req) {
  if (!env.CANVA_APP_ID) throw httpErr(500, 'CANVA_APP_ID is not set on ix-canva.');
  const auth = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const dt = req.headers.get('X-Design-Token') || '';
  if (!auth || !dt) throw httpErr(401, 'The app sent no Canva user token or design token.');
  await verifyJwt(env, auth, env.CANVA_APP_ID);
  const d = await verifyJwt(env, dt, env.CANVA_APP_ID);
  const designId = String(d.designId || d.design_id || '');
  if (!designId) throw httpErr(400, 'The design token named no design.');
  const job = await jobForDesign(env, designId);
  if (!job) return { ok: false, error: 'This design was not opened from inbxify Ad Maker (design ' + designId + '). Open it with Edit in Canva in the Ads tab.', designId };
  const S = SHAPES[job.shape] || null;
  return { ok: true, job: { id: job.id, designId: job.designId, customer: job.customer, shape: job.shape, title: job.title, w: S ? S.w : 0, h: S ? S.h : 0 },
    words: job.words || [], colours: job.colours || [], sheet: job.sheet || null, sheetState: job.sheetState || (job.sheet ? 'ready' : 'none'), sheetError: job.sheetError || '' };
}

// ── the test page (kept for diagnosis) ────────────────────────────────────
async function testPage(env, url) {
  const t = await env.CANVA_KV.get('tokens', 'json');
  const status = t ? `<span class="pill">Connected${t.name ? ' as ' + esc(t.name) : ''}</span> <a class="quiet" href="/connect">reconnect</a>` : `<span class="pill off">Not connected</span> <a class="btn" href="/connect" style="margin-left:10px">Connect Canva</a>`;
  const last = await env.CANVA_KV.get('last', 'json');
  return page('Canva round-trip test', `
<h1>Canva round-trip test</h1>
<p class="sub">ix-canva v${VERSION} · inbxify → Canva → inbxify · the Ads tab uses the job API; this page is for checking the connection</p>
<div class="row">${status}</div>
${url.searchParams.get('connected') ? '<p class="ok">Canva approved the inbxify app. The login is kept on the Worker; you will not be asked again.</p>' : ''}
<h2>1 · What goes to Canva</h2>
<form class="card" method="post" action="/test/start">
  <label for="cust">Customer name (becomes the Projects folder in Canva)</label>
  <input type="text" id="cust" name="customer" value="Graze Craze" required>
  <label for="shape">Shape</label>
  <select id="shape" name="shape">${Object.keys(SHAPES).map(k => `<option value="${k}">${SHAPES[k].label} · ${SHAPES[k].w} × ${SHAPES[k].h}</option>`).join('')}</select>
  <label>Route</label>
  <div class="row"><label style="font-weight:400;margin:0"><input type="radio" name="route" value="pieces" checked> <b>A · Pieces.</b> Every link below goes into the folder as its own picture; the design opens blank at the shape's size.</label></div>
  <div class="row"><label style="font-weight:400;margin:0"><input type="radio" name="route" value="layers"> <b>B · Layers.</b> Only the first link is used: Canva splits that one flat picture into layers itself (preview; uses Canva AI credits).</label></div>
  <label for="urls">Picture links, one per line (PNG or JPG; Uploadcare links are fine)</label>
  <textarea id="urls" name="urls" required></textarea>
  <button class="btn" type="submit">Send to Canva</button>
</form>
${last ? `<h2>Last design</h2><div class="card"><div class="row"><b>${esc(last.title)}</b><span class="quiet">design ${esc(last.id)}</span><a class="btn sec" href="/test/edit?design=${esc(last.id)}">Edit in Canva</a></div></div>` : ''}`);
}
async function startTest(env, url, form) {
  const customer = String(form.get('customer') || '').trim() || 'Test';
  const shape = SHAPES[String(form.get('shape'))] ? String(form.get('shape')) : 'sidebar';
  const route = String(form.get('route')) === 'layers' ? 'layers' : 'pieces';
  const links = String(form.get('urls') || '').split(/\r?\n/).map(s => s.trim()).filter(s => /^https?:\/\//.test(s));
  if (!links.length) throw httpErr(400, 'Paste at least one picture link.');
  const S = SHAPES[shape], title = customer + ' · ' + S.label + ' · ' + new Date().toISOString().slice(0, 10);
  const notes = [], t0 = Date.now();
  const folderId = await folderFor(env, customer); notes.push('Folder ready: ' + FOLDER_PREFIX + customer);
  let design;
  if (route === 'pieces') {
    for (let i = 0; i < links.length; i++) { const f = await fetchBytes(links[i]); const a = await uploadBytes(env, f.bytes, nameFrom(links[i], i, f.type)); const moved = await moveTo(env, folderId, a.id); notes.push('Uploaded ' + a.name + (moved ? ' → folder' : ' (left in Uploads root)')); }
    const d = await api(env, '/designs', { method: 'POST', body: { design_type: { type: 'custom', width: S.w, height: S.h }, title } });
    design = d.design; notes.push('Blank ' + S.label + ' design made, ' + S.w + ' × ' + S.h);
  } else {
    const f = await fetchBytes(links[0]); const a = await uploadBytes(env, f.bytes, nameFrom(links[0], 0, f.type)); notes.push('Uploaded ' + a.name); await moveTo(env, folderId, a.id);
    const j = await api(env, '/image-to-design-imports', { method: 'POST', body: { image: { asset_id: a.id }, title } });
    design = await poll(env, '/image-to-design-imports/' + j.job.id, job => job.result && job.result.design);
    notes.push('Canva split the picture into layers (design ' + design.id + ')');
  }
  if (await moveTo(env, folderId, design.id)) notes.push('Design filed in the folder');
  const id = rnd(9);
  await saveJob(env, { id, designId: design.id, customer: { id: '', name: customer }, shape, title, taUrl: '', folderId, status: 'open', notes: ['test page, route ' + route], made: new Date().toISOString() });
  await env.CANVA_KV.put('last', JSON.stringify({ id: design.id, title }));
  const edit = editUrlWithState(design.urls.edit_url, id);
  return html(page('Ready in Canva', `
<h1>Ready in Canva</h1>
<p class="sub">${esc(title)} · route ${route === 'pieces' ? 'A · pieces' : 'B · layers'} · ${Math.round((Date.now() - t0) / 100) / 10} s</p>
<div class="card"><ul class="steps">${notes.map(n => '<li>' + esc(n) + '</li>').join('')}</ul>
<p><a class="btn" href="${esc(edit)}" target="_blank" rel="noopener">Edit in Canva</a></p>
<p class="quiet">Your pieces are in the Projects panel (left rail) → folder ${esc(FOLDER_PREFIX + customer)}, beside this design. When you are done, click Canva's <b>Return to inbxify</b> button.</p></div>
<p><a href="/test">Back to the test page</a></p>`));
}

async function testEdit(env, url) {
  const designId = String(url.searchParams.get('design') || ''); if (!designId) return html(page('No design', '<p class="bad">No design id.</p>'), 400);
  const r = await designLink(env, { designId });
  return Response.redirect(r.editUrl, 302);
}

// ── return navigation ─────────────────────────────────────────────────────
async function jwks(env) {
  const key = 'jwks', c = await env.CANVA_KV.get(key, 'json');
  if (c && c.at && Date.now() - c.at < 3600000) return c.keys;
  const r = await fetch(CANVA_API + '/apps/' + encodeURIComponent(env.CANVA_APP_ID || '') + '/jwks');
  if (!r.ok) throw httpErr(502, 'Canva’s public keys could not be fetched (' + r.status + '). Is CANVA_APP_ID set?');
  const j = await r.json(); const keys = j.keys || [];
  await env.CANVA_KV.put(key, JSON.stringify({ at: Date.now(), keys }), { expirationTtl: 86400 });
  return keys;
}
async function verifyJwt(env, jwt, aud) {   // v0.3.0: aud is the id the token must be for
  const parts = String(jwt || '').split('.'); if (parts.length !== 3) throw httpErr(400, 'The return token is not in the shape Canva documents.');
  const header = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0])));
  const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1])));
  let keys = await jwks(env), k = keys.find(x => x.kid === header.kid);
  if (!k) { await env.CANVA_KV.delete('jwks'); keys = await jwks(env); k = keys.find(x => x.kid === header.kid); }
  if (!k) throw httpErr(403, 'The return token was signed with a key Canva no longer publishes.');
  const alg = (header.alg || 'RS256').toUpperCase();
  const algo = alg === 'RS256' ? { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } : alg === 'ES256' ? { name: 'ECDSA', namedCurve: 'P-256' } : null;
  if (!algo) throw httpErr(403, 'The return token uses an algorithm this Worker does not check (' + alg + ').');
  const pub = await crypto.subtle.importKey('jwk', k, algo, false, ['verify']);
  const sigAlgo = alg === 'ES256' ? { name: 'ECDSA', hash: 'SHA-256' } : algo;
  const ok = await crypto.subtle.verify(sigAlgo, pub, b64urlDecode(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
  if (!ok) throw httpErr(403, 'The return token’s signature did not verify.');
  const want = aud === undefined ? env.CANVA_CLIENT_ID : aud;
  if (!want) throw httpErr(500, 'The Worker does not know which app id the token must be for (CANVA_APP_ID / CANVA_CLIENT_ID).');
  if (String(payload.aud || '') !== String(want)) throw httpErr(403, 'The token is for another app.');
  if (payload.exp && Date.now() / 1000 > payload.exp) throw httpErr(403, 'The token has expired.');
  return payload;
}
function returnShell(url) {
  const q = url.search || '';
  const body = `<h1>Back from Canva</h1><p class="sub">Fetching the finished picture</p>
<div id="rt-wait" style="margin-top:24px;background:#fff;border:1px solid #D9D2C3;border-radius:3px;padding:24px;display:flex;gap:20px;align-items:center">
  <div id="rt-lot" style="width:96px;height:96px;flex:none"><div style="display:flex;gap:8px;justify-content:center;align-items:center;height:96px"><i class="rt-dot"></i><i class="rt-dot" style="animation-delay:.2s"></i><i class="rt-dot" style="animation-delay:.4s"></i></div></div>
  <div><div style="font:400 22px/1.2 Newsreader,Georgia,serif" id="rt-w1">Exporting from Canva</div><div class="quiet" id="rt-w2">Asking Canva for the PNG at twice the ad size.</div><div class="quiet" style="margin-top:6px"><span id="rt-sec">0</span> s</div></div>
</div>
<style>.rt-dot{width:16px;height:16px;border-radius:50%;background:#22252B;display:inline-block;animation:rtb 1s ease-in-out infinite}@keyframes rtb{0%,100%{transform:scale(.6);opacity:.5}50%{transform:scale(1.2);opacity:1}}</style>
<div id="rt-out"></div>
<script>
(function(){
  var t0=Date.now(), sec=document.getElementById('rt-sec'), w2=document.getElementById('rt-w2');
  var tick=setInterval(function(){ var n=Math.round((Date.now()-t0)/1000); sec.textContent=n; if(n===4) w2.textContent='Canva is rendering. Usually done within fifteen seconds.'; if(n===20) w2.textContent='Still waiting on Canva. The Worker gives up at 90 seconds and says so.'; },500);
  try { var sc=document.createElement('script'); sc.src='https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js'; sc.onload=function(){ try{ var h=document.getElementById('rt-lot'); h.innerHTML=''; lottie.loadAnimation({container:h,renderer:'svg',loop:true,autoplay:true,animationData:${JSON.stringify(LOTTIE)}}); }catch(e){} }; document.head.appendChild(sc); } catch(e){}
  var run='/return/run' + ${JSON.stringify(q)};
  fetch(run).then(function(r){ return r.text().then(function(t){ return {ok:r.ok,status:r.status,text:t}; }); }).then(function(res){
    clearInterval(tick); document.getElementById('rt-wait').style.display='none';
    var d=document.createElement('div'); d.innerHTML=res.text; var m=d.querySelector('main');
    document.getElementById('rt-out').innerHTML = (m ? m.innerHTML : res.text) + (res.ok ? '' : '<p class="bad">(Worker answered ' + res.status + ')</p>');
  }).catch(function(e){ clearInterval(tick); document.getElementById('rt-w1').textContent='The export call failed'; w2.innerHTML='<span class="bad">'+e+'</span> · <a href="'+run+'">open the call directly</a>'; });
})();
</script>`;
  return page('Back from Canva', body);
}
async function returned(env, url) {
  const jwt = url.searchParams.get('correlation_jwt');
  if (!jwt) return html(page('Nothing came back', '<p class="bad">Canva sent no return token. Open the design from inbxify’s Edit in Canva button, then use Canva’s Return button.</p>'), 400);
  let payload; try { payload = await verifyJwt(env, jwt); } catch (e) { return html(page('Return refused', `<p class="bad">${esc(e.message)}</p><p class="quiet">Nothing was exported. Go back to the inbxify tab and use Fetch from Canva there, which needs your inbxify login.</p>`), e.status || 403); }
  const state = String(payload.correlation_state || ''), designId = String(payload.design_id || '');
  let job = null; try { job = state ? await loadJob(env, state) : null; } catch (e) { job = null; }
  if (job && designId && job.designId !== designId) job = null;
  const t0 = Date.now(); let err = '', pngUrl = '';
  try {
    if (job) { await jobExport(env, job.id, 'return'); job = await loadJob(env, job.id); pngUrl = job.exportUrl; }
    else if (designId) { pngUrl = await exportPng(env, designId, ''); }
  } catch (e) { err = e.message; }
  const back = job && job.taUrl ? job.taUrl : '';
  return html(page('Back from Canva', `
<h1>${job ? esc(job.title) : 'Back from Canva'}</h1>
<p class="sub">${job ? 'Exported and ready in inbxify.' : 'This design was not opened from a job inbxify knows; it was exported anyway.'}</p>
<div class="card">
${pngUrl ? `<p><img class="ad" src="${esc(pngUrl)}" alt="Exported ad"></p><p class="quiet">Export took ${Math.round((Date.now() - t0) / 100) / 10} s${job && SHAPES[job.shape] ? ' · PNG at ' + SHAPES[job.shape].w * EXPORT_SCALE + ' × ' + SHAPES[job.shape].h * EXPORT_SCALE : ''}</p>` : `<p class="bad">Export did not come back: ${esc(err || 'no URL')}</p>`}
${back ? `<p><a class="btn" href="${esc(back)}">Back to inbxify</a> <span class="quiet">or switch to the inbxify tab you left open: it has already picked this up.</span></p>` : `<p class="quiet">design id <code>${esc(designId)}</code></p>`}
</div>`));
}
