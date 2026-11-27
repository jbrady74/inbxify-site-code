// ix-domains-v1.0.2.js
// v1.0.2 (27 Nov 2026, Local Domains S1): A HOSTNAME NOT ON THE KEPT LIST IS LOOKED UP AGAIN, AND A CHECK PAGE.
//   v1.0.1 answered "This site is not set up." for www.wyckoffliving.com while /domains?fresh=1 listed it: the
//   list ix-domains received was an older kept copy (made before Site Domain was filled).
//   1 · When the hostname is not on the kept list, the list is read once more with ?fresh=1 (at most once a minute
//       per Worker copy), so a new or just-filled Site Domain works at once instead of after cacheSeconds.
//   2 · /ix-domains-check (workers.dev only): which hostname this browser is previewing, whether it is on the list,
//       every listed hostname and the list's problems. For testing; no title content.
//   Nothing else changed.
//
// v1.0.1 header follows.
// v1.0.1 (27 Nov 2026, Local Domains S1): THE DATA WORKER IS REACHED THROUGH A SERVICE BINDING.
//   v1.0.0 answered "not available" on every page: Cloudflare does not let one Worker fetch another Worker's
//   workers.dev address on the same account. The two Data Worker reads (/domains and /site) now go through a
//   service binding named DATA (Settings > Bindings > Service binding > DATA = ix-issue-data). Without the binding
//   the Worker falls back to a plain fetch, as before.
//   /health also answers dataBinding (true when DATA is set). When the domain list cannot be read, the reason goes
//   in an X-IX-Domains-Error header (the reader still sees the short message). Nothing else changed.
//
// v1.0.0 header follows.
// v1.0.0 (27 Nov 2026, Local Domains S1): A TITLE'S OWN DOMAIN, SERVED FROM THE ONE inbxify SITE.
//
//   WHAT IT DOES
//   A reader asks for www.wyckoffliving.com/<path>. Cloudflare for SaaS sends the request here (route */* on the
//   inbxify.com zone). This Worker:
//     1 · finds the title that owns the hostname: GET <dataWorker>/domains (TITLES "Site Domain", ix-issue-data
//         v1.0.221+), kept cacheSeconds. Unknown hostname: 404. Never another title's content.
//     2 · "/" sends the reader to the title home, /titles/<TITLES slug> (302), which opens the current issue.
//     3 · /robots.txt is answered here, one per domain.
//     4 · only the title page types in /domains paths[] are served (allow list, Data Worker HC-P-LD1-1). Anything
//         else (Quill, T-A, Portal, marketing pages) goes to the same address on www.inbxify.com (302).
//     5 · fetches the page from www.inbxify.com and reads its #ix-page tag (data-kind, data-title) to learn which
//         title the page belongs to, asking <dataWorker>/site the same question the page's own ix-shell asks
//         (issue=, article=, franchise=&title=, else title=), kept cacheSeconds. A page of another title goes to
//         that title's home: its own domain if it has one, else www.inbxify.com (302). A page with no #ix-page, or
//         whose owner cannot be read, also goes to www.inbxify.com: when in doubt, never serve it here.
//     6 · rewrites the page on the way out: canonical and og:url set to the local address; absolute links to
//         www.inbxify.com (or inbxify.com) title pages made relative, so they stay on this domain (a link that
//         belongs to another title is bounced by step 5 when clicked).
//     7 · a franchise page (/product-library/<slug>) with no ?title= is sent to the same page with
//         ?title=<TITLES-ADMIN slug>, so the page cannot fall back to another title.
//   Redirects are 302 (temporary) in S1. The 301s from inbxify.com to title domains are S2.
//
//   SAFETY
//   · Requests whose hostname is the origin's own (www.inbxify.com, inbxify.com) are passed straight through,
//     untouched, in case this Worker's route ever matches them.
//   · Only GET and HEAD. Site forms post to the Data Worker, never to a page.
//   · The reader's cookies are not sent to www.inbxify.com.
//
//   PREVIEW (no DNS needed)
//   On its workers.dev address: open /?ix-host=www.wyckoffliving.com once. A cookie (ix-host) keeps the chosen
//   hostname for the next pages; ?ix-host= (empty) clears it. /health answers { ok, version } on any hostname.
//   Expected in preview only: ix-perf refuses the counts (its origin list) and Turnstile forms do not start.
//
//   CONFIG (Worker variable IX_CONFIG, JSON, never committed). Every key optional:
//     { "origin": "https://www.inbxify.com",                          default HC-P-LD1-2
//       "dataWorker": "https://ix-issue-data.jeff-2cd.workers.dev",   default HC-P-LD1-3
//       "cacheSeconds": 300 }                                         default HC-P-LD1-4
//   No hostname of any title is in this file. The domain list is TITLES "Site Domain".

const VERSION = '1.0.2';
let lastFreshAt = 0;                                        // v1.0.2: last ?fresh=1 read of /domains
const DEFAULTS = {
  origin: 'https://www.inbxify.com',                       // HC-P-LD1-2
  dataWorker: 'https://ix-issue-data.jeff-2cd.workers.dev', // HC-P-LD1-3
  cacheSeconds: 300,                                        // HC-P-LD1-4
};
const PREVIEW_PARAM = 'ix-host';
const PREVIEW_COOKIE = 'ix-host';
const FRANCHISE_PREFIX = '/product-library/';               // the franchise template (PRODUCT LIBRARY), HC-P-LD1-5
const memo = new Map();                                     // per isolate: key -> { at, value }

export default {
  async fetch(request, env, ctx) {
    const cfg = config(env);
    const url = new URL(request.url);
    const originUrl = new URL(cfg.origin);
    const originHosts = [originUrl.hostname, originUrl.hostname.replace(/^www\./, '')];

    if (url.pathname === '/health') return json({ ok: true, version: VERSION, dataBinding: !!(env.DATA && env.DATA.fetch) }, 200);
    if (originHosts.includes(url.hostname)) return fetch(request);   // never touch inbxify.com itself

    // Which hostname is being asked for (preview on workers.dev, else the real one).
    let host = url.hostname, setCookie = null;
    const preview = /\.workers\.dev$/i.test(url.hostname);
    if (preview) {
      if (url.searchParams.has(PREVIEW_PARAM)) {
        const want = cleanHost(url.searchParams.get(PREVIEW_PARAM));
        url.searchParams.delete(PREVIEW_PARAM);
        const back = url.pathname + (url.search || '');
        const c = want ? PREVIEW_COOKIE + '=' + want + '; Path=/; Secure; SameSite=Lax'
                       : PREVIEW_COOKIE + '=; Path=/; Max-Age=0; Secure; SameSite=Lax';
        return new Response(null, { status: 302, headers: { Location: back, 'Set-Cookie': c, 'Cache-Control': 'no-store' } });
      }
      host = cookieOf(request, PREVIEW_COOKIE);
      if (url.pathname === '/ix-domains-check') {                    // v1.0.2
        let d = null, err = '';
        try { d = await domains(cfg, ctx, env, host); } catch (e) { err = String((e && e.message) || e); }
        return json({ ok: !err, version: VERSION, previewing: host || null,
          listed: !!(d && d.domains.some(x => x.host === host)),
          hosts: d ? d.domains.map(x => x.host + ' -> ' + x.titleSlug) : [], problems: d ? d.problems || [] : [],
          dataVersion: d ? d.version || null : null, error: err || undefined }, 200);
      }
      if (!host) return text('ix-domains ' + VERSION + ' preview. Open /?' + PREVIEW_PARAM + '=<title hostname> to choose a title domain.', 200);
    }

    // 1 · the title that owns the hostname
    let dom;
    try { dom = await domains(cfg, ctx, env, host); }
    catch (e) { return text('This site is not available right now. Please try again in a moment.', 503,
      { 'X-IX-Domains-Error': String((e && e.message) || e).slice(0, 200) }); }
    let entry = dom.domains.find(d => d.host === host);
    if (!entry) {
      const www = dom.domains.find(d => d.host === 'www.' + host);   // bare name of a listed www. domain
      if (www) return redirect('https://' + www.host + url.pathname + url.search, 301);
      return text('This site is not set up.', 404);
    }
    const local = preview ? url.origin : 'https://' + entry.host;

    if (request.method !== 'GET' && request.method !== 'HEAD') return text('Only GET is supported.', 405);

    // 2 · 3 · 4 · 7
    const path = url.pathname;
    if (path === '/robots.txt') return text('User-agent: *\nAllow: /\n', 200, { 'Cache-Control': 'public, max-age=3600' });
    if (path === '/' || path === '') return redirect(local + '/titles/' + encodeURIComponent(entry.titleSlug), 302);
    const paths = Array.isArray(dom.paths) ? dom.paths : [];
    const prefix = paths.find(p => path.toLowerCase().startsWith(p));
    if (!prefix) return redirect(cfg.origin + path + url.search, 302);
    if (prefix === FRANCHISE_PREFIX && !url.searchParams.get('title')) {
      url.searchParams.set('title', entry.adminSlug || entry.titleSlug);
      return redirect(local + path + url.search, 302);
    }

    // 5 · fetch the page and check who owns it
    const res = await fetch(cfg.origin + path + url.search, {
      method: 'GET', redirect: 'manual',
      headers: pick(request.headers, ['accept', 'accept-language', 'user-agent']),
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('Location');
      return redirect(loc ? localise(loc, cfg.origin, originHosts, paths, local) : cfg.origin + path + url.search, res.status);
    }
    const type = res.headers.get('Content-Type') || '';
    if (!/text\/html/i.test(type) || res.status !== 200) return passOn(res, request.method);

    const html = await res.text();
    const tag = (html.match(/<[a-z][^>]*\bid\s*=\s*["']ix-page["'][^>]*>/i) || [''])[0];
    if (!tag) return redirect(cfg.origin + path + url.search, 302);
    const kind = attr(tag, 'data-kind').toLowerCase();
    const key = (attr(tag, 'data-title') || path.split('/').filter(Boolean).pop() || '').trim().toLowerCase();
    const titleParam = (url.searchParams.get('title') || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!key) return redirect(cfg.origin + path + url.search, 302);
    const q = (kind === 'issue' ? 'issue=' : kind === 'article' ? 'article=' : kind === 'franchise' ? 'franchise=' : 'title=')
      + encodeURIComponent(key) + (kind === 'franchise' && titleParam ? '&title=' + encodeURIComponent(titleParam) : '');
    const owner = await ownerOf(cfg, ctx, env, q);
    if (!owner) return redirect(cfg.origin + path + url.search, 302);
    if (owner !== entry.titleSlug) {
      const theirs = dom.domains.find(d => d.titleSlug === owner);
      return redirect((theirs ? 'https://' + theirs.host : cfg.origin) + path + url.search, 302);
    }

    // 6 · rewrite on the way out
    const canonical = 'https://' + entry.host + path + (kind === 'franchise' && titleParam ? '?title=' + encodeURIComponent(titleParam) : '');
    const headers = new Headers(res.headers);
    ['content-length', 'content-encoding', 'etag', 'last-modified'].forEach(h => headers.delete(h));
    headers.set('X-IX-Domains', VERSION);
    if (request.method === 'HEAD') return new Response(null, { status: 200, headers });
    const out = new HTMLRewriter()
      .on('link[rel="canonical"]', { element(el) { el.remove(); } })
      .on('meta[property="og:url"]', { element(el) { el.remove(); } })
      .on('head', { element(el) {
        el.append('<link rel="canonical" href="' + esc(canonical) + '">', { html: true });
        el.append('<meta property="og:url" content="' + esc(canonical) + '">', { html: true });
      } })
      .on('a[href]', { element(el) {
        const h = el.getAttribute('href');
        const r = relative(h, originHosts, paths);
        if (r !== null) el.setAttribute('href', r);
      } })
      .transform(new Response(html, { status: 200, headers }));
    return out;
  },
};

// ---- the two Data Worker reads, kept cacheSeconds --------------------------------------------------------------

async function domains(cfg, ctx, env, host) {
  let v = await kept(cfg, ctx, env, 'domains', cfg.dataWorker + '/domains');
  if (!v || v.ok !== true || !Array.isArray(v.domains)) throw new Error('No domain list from the Data Worker.');
  const listed = h => v.domains.some(d => d.host === h || d.host === 'www.' + h);
  if (host && !listed(host) && Date.now() - lastFreshAt > 60000) {   // v1.0.2: not on the kept list, read once more
    lastFreshAt = Date.now();
    memo.delete('domains');
    try {
      const f = await kept(cfg, ctx, env, 'domains', cfg.dataWorker + '/domains?fresh=1', true);
      if (f && f.ok === true && Array.isArray(f.domains)) v = f;
    } catch (e) { /* keep the list we have */ }
  }
  return v;
}

async function ownerOf(cfg, ctx, env, q) {
  let v = null;
  try { v = await kept(cfg, ctx, env, 'site:' + q, cfg.dataWorker + '/site?' + q); } catch (e) { return null; }
  const slug = v && v.ok === true && v.title && v.title.slug;
  return slug ? String(slug).toLowerCase() : null;
}

async function kept(cfg, ctx, env, key, address, skipCache) {
  const now = Date.now(), ttl = cfg.cacheSeconds * 1000;
  const m = memo.get(key);
  if (m && now - m.at < ttl && !skipCache) return m.value;
  const cache = caches.default;
  const req = new Request('https://ix-domains.cache/' + VERSION + '/' + encodeURIComponent(key));
  const hit = skipCache ? null : await cache.match(req);
  if (hit) { const value = await hit.json(); memo.set(key, { at: now, value }); return value; }
  let value;
  try {
    const req = new Request(address, { headers: { Accept: 'application/json' } });
    const r = (env.DATA && env.DATA.fetch) ? await env.DATA.fetch(req) : await fetch(req);   // v1.0.1: service binding
    const body = await r.text();
    try { value = JSON.parse(body); } catch (x) { throw new Error('Data Worker answered ' + r.status + ', not JSON: ' + body.slice(0, 80)); }
    if (!r.ok || !value || value.ok !== true) throw new Error('Data Worker answered ' + r.status + (value && value.error ? ': ' + value.error : ''));
  } catch (e) {
    if (m) return m.value;   // an older copy beats no answer
    throw e;
  }
  memo.set(key, { at: now, value });
  ctx.waitUntil(cache.put(req, new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=' + cfg.cacheSeconds } })).catch(() => {}));
  return value;
}

// ---- helpers -----------------------------------------------------------------------------------------------

function config(env) {
  let c = {};
  try { c = env.IX_CONFIG ? (typeof env.IX_CONFIG === 'string' ? JSON.parse(env.IX_CONFIG) : env.IX_CONFIG) : {}; } catch (e) { c = {}; }
  const origin = /^https:\/\/[a-z0-9.-]+$/i.test(String(c.origin || '')) ? String(c.origin) : DEFAULTS.origin;
  const dataWorker = /^https:\/\/[a-z0-9.-]+$/i.test(String(c.dataWorker || '')) ? String(c.dataWorker) : DEFAULTS.dataWorker;
  const cacheSeconds = Number(c.cacheSeconds) > 0 ? Number(c.cacheSeconds) : DEFAULTS.cacheSeconds;
  return { origin, dataWorker, cacheSeconds };
}

function cleanHost(v) {
  let h = String(v == null ? '' : v).trim().toLowerCase();
  h = h.replace(/^[a-z][a-z0-9+.-]*:\/\//, '').split(/[\/?#]/)[0].replace(/:\d+$/, '').replace(/\.$/, '');
  return /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(h) ? h : '';
}

function cookieOf(request, name) {
  const all = request.headers.get('Cookie') || '';
  const hit = all.split(/;\s*/).find(p => p.startsWith(name + '='));
  return hit ? cleanHost(decodeURIComponent(hit.slice(name.length + 1))) : '';
}

function attr(tag, name) {
  const m = tag.match(new RegExp('\\s' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i'));
  return m ? (m[2] !== undefined ? m[2] : m[3] || '') : '';
}

// An absolute link to a title page on the origin becomes a relative path; anything else returns null (unchanged).
function relative(href, originHosts, paths) {
  if (!href || !/^https?:\/\//i.test(href)) return null;
  let u;
  try { u = new URL(href); } catch (e) { return null; }
  if (!originHosts.includes(u.hostname.toLowerCase())) return null;
  if (!paths.some(p => u.pathname.toLowerCase().startsWith(p))) return null;
  return u.pathname + u.search + u.hash;
}

// An origin redirect: kept on this domain when it points at a title page on the origin.
function localise(loc, origin, originHosts, paths, local) {
  try {
    const u = new URL(loc, origin);
    if (originHosts.includes(u.hostname.toLowerCase()) && paths.some(p => u.pathname.toLowerCase().startsWith(p))) {
      return local + u.pathname + u.search + u.hash;
    }
    return u.toString();
  } catch (e) { return origin; }
}

function pick(h, names) {
  const out = new Headers();
  names.forEach(n => { const v = h.get(n); if (v) out.set(n, v); });
  return out;
}

function passOn(res, method) {
  const headers = new Headers(res.headers);
  headers.set('X-IX-Domains', VERSION);
  return new Response(method === 'HEAD' ? null : res.body, { status: res.status, headers });
}

function redirect(to, status) {
  return new Response(null, { status: status || 302, headers: { Location: to, 'Cache-Control': 'no-store', 'X-IX-Domains': VERSION } });
}

function text(body, status, extra) {
  return new Response(body, { status, headers: Object.assign({ 'Content-Type': 'text/plain; charset=utf-8', 'X-IX-Domains': VERSION }, extra || {}) });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
