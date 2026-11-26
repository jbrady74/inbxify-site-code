// ix-splash-v1.0.0.js
// INBXIFY · ix-splash Worker · v1.0.0 (26 Nov 2026, Image Links S4)
//
// Serves splash.inbxify.com. Jeff, 26 Nov: the black screen before the title's colours "must be eradicated".
// The splash page (splash/splash-v3_8.html, uploaded to the Cloudflare Pages project inbxify-splash as
// index.html) used to arrive black and ask the Data Worker for the title's look. This Worker asks first:
//   1 · reads the link's n= (or, on old long links, logo=), as the page does (&amp; normalised, &to= kept whole);
//   2 · in parallel, gets the page from the Pages project (TEMPLATE_URL, cached 10 minutes) and the Data
//       Worker's /splash answer (the DATA service binding to ix-issue-data, else DATA_URL), waiting at most
//       WAIT_MS (1000 ms) for the answer;
//   3 · writes into the page's head: a style block with the title's colours (validated hex only), a preload of
//       the logo and the first picture, and window.__IX_SPLASH = the answer. Splash v3.8 starts at once from it.
//   If the answer is late or fails, the page goes out as it is and asks for itself (v3.7 behaviour), so a reader
//   is never held back. Any other path (favicon, assets) is passed to the Pages project as it is.
// Environment (Worker settings → Variables and Secrets / Bindings; none are secrets):
//   DATA          service binding to the Worker ix-issue-data (preferred)
//   DATA_URL      optional, default https://ix-issue-data.jeff-2cd.workers.dev/splash (used without DATA)
//   TEMPLATE_URL  optional, default https://inbxify-splash.pages.dev/
//   WAIT_MS       optional, default 1000
// Nothing here is per publisher or per title: the look comes from the title's tokens through the Data Worker.
// HARDCODING (provisional): HC-P-IL4-4 the two default addresses and WAIT_MS above.

const VERSION = '1.0.0';
const DEFAULT_DATA_URL = 'https://ix-issue-data.jeff-2cd.workers.dev/splash';
const DEFAULT_TEMPLATE_URL = 'https://inbxify-splash.pages.dev/';
const TEMPLATE_TTL = 600;   // seconds

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const templateBase = String(env.TEMPLATE_URL || DEFAULT_TEMPLATE_URL).replace(/\/?$/, '/');
    if (url.pathname === '/health') return new Response(JSON.stringify({ ok: true, worker: 'ix-splash', version: VERSION }),
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    if (url.pathname !== '/' && url.pathname !== '/index.html') {
      return fetch(new URL(url.pathname.replace(/^\//, '') + url.search, templateBase).toString(), request);
    }
    const q = linkQuery(url.search);
    const [tpl, data] = await Promise.all([template(templateBase, ctx), q ? answer(env, q) : Promise.resolve(null)]);
    if (!tpl) return fetch(templateBase + url.search);                      // last resort: the page as Pages has it
    const html = data ? inject(tpl, data) : tpl;
    return new Response(html, { status: 200, headers: {
      'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-IX-Splash': VERSION + (data ? ' given' : ' plain') } });
  },
};

// The same reading of the link as the page: everything after &to= is the destination, not a parameter.
function linkQuery(search) {
  const s = String(search || '').replace(/&amp;/g, '&');
  const toIdx = s.indexOf('&to=');
  const p = new URLSearchParams(toIdx >= 0 ? s.substring(0, toIdx) : s);
  const n = p.get('n') || '';
  if (/^[0-9a-f]{24}$/.test(n)) return '?n=' + n;
  const logo = p.get('logo') || '';
  if (logo) return '?logo=' + encodeURIComponent(logo);
  return '';
}

async function template(base, ctx) {
  const key = new Request(base + '__ix_splash_template');
  const cache = caches.default;
  try { const hit = await cache.match(key); if (hit) return await hit.text(); } catch (e) {}
  try {
    const res = await fetch(base, { cf: { cacheTtl: TEMPLATE_TTL } });
    if (!res.ok) return null;
    const text = await res.text();
    if (!/__IX_SPLASH/.test(text)) return text;                                // an older page: serve it, no caching
    ctx.waitUntil(cache.put(key, new Response(text, { headers: { 'Cache-Control': 'max-age=' + TEMPLATE_TTL } })));
    return text;
  } catch (e) { return null; }
}

async function answer(env, q) {
  const wait = Number(env.WAIT_MS) > 0 ? Number(env.WAIT_MS) : 1000;
  const ask = (async () => {
    const res = env.DATA && typeof env.DATA.fetch === 'function'
      ? await env.DATA.fetch('https://ix-issue-data/splash' + q)
      : await fetch(String(env.DATA_URL || DEFAULT_DATA_URL) + q);
    if (!res.ok) return null;
    const d = await res.json();
    return d && d.ok ? d : null;
  })().catch(() => null);
  const late = new Promise(r => setTimeout(() => r(null), wait));
  return Promise.race([ask, late]);
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
function rgba(hex, a) {
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + a + ')';
}
function sharpLogo(u) {   // as the page's sharpLogo(): an Uploadcare logo at 920px wide
  const m = /^(https:\/\/[^\/]*(?:ucarecdn\.com|ucarecd\.net)\/[0-9a-f-]{36}\/)/i.exec(u || '');
  return m ? m[1] + '-/resize/920x/-/format/auto/-/quality/smart/' : '';
}
const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function inject(tpl, d) {
  const parts = [];
  const c = d.colors || {};
  if (['bg', 'accent', 'ink', 'tileBg', 'tileBorder'].every(k => HEX.test(String(c[k] || '')))) {
    parts.push('<style id="ix-splash-look">:root{--sp-bg:' + c.bg + ';--sp-accent:' + c.accent + ';--sp-ink:' + c.ink +
      ';--sp-tile-bg:' + c.tileBg + ';--sp-tile-border:' + c.tileBorder + ';--sp-accent-40:' + rgba(c.accent, 0.4) +
      ';--sp-accent-30:' + rgba(c.accent, 0.3) + ';--sp-ink-07:' + rgba(c.ink, 0.07) + '}html,body{background:' + c.bg + '}</style>');
  }
  const logo = sharpLogo(d.logo);
  if (logo) parts.push('<link rel="preload" as="image" href="' + attr(logo) + '">');
  const first = Array.isArray(d.ads) ? d.ads[0] : d.ad;
  if (first && /^https:\/\//.test(first)) parts.push('<link rel="preload" as="image" href="' + attr(first) + '">');
  parts.push('<script>window.__IX_SPLASH=' + JSON.stringify(d).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '') + ';</script>');
  const block = parts.join('');
  return /<\/head>/i.test(tpl) ? tpl.replace(/<\/head>/i, block + '</head>') : block + tpl;
}
