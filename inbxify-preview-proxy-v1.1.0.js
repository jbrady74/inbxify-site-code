/* ============================================================
   inbxify-preview-proxy-v1.1.0.js
   Cloudflare Worker — Asset Workbench LEFT-pane preview proxy

   v1.1.0 (29 Oct 2026, Image Fields S1) — THE WORKBENCH CAN READ THE ANSWER.
     The Asset Workbench (ta-asset-workbench v0.8.8+) asks this proxy
     whether an article's page exists, so it can show a local render for a
     draft (404) instead of a blank frame. The proxy answered without an
     Access-Control-Allow-Origin header, so the browser blocked T-A from
     reading the answer ("blocked by CORS policy") and the Workbench could
     never tell a draft from a published page. Every answer, errors
     included, now carries that header when the asking page's origin is one
     of CALLER_ORIGINS. Nothing else changes: same allow-list for what may
     be proxied, same framing-header strip, same <base href>.
     Hardcoded: CALLER_ORIGINS (HC-P-IF1-5), the sites T-A runs on.
   v1.0.0 (unversioned until now) — first build, below.

   PURPOSE
   Webflow-published pages send  Content-Security-Policy: frame-ancestors 'self'
   (and sometimes X-Frame-Options), which blocks the Asset Workbench from
   embedding the published asset page in its LEFT <iframe>. This Worker
   fetches the published page server-side, STRIPS the framing restrictions,
   injects a <base href> so root-relative sub-resources (CSS/JS/images) still
   resolve against the real origin, and returns the page so it can be framed.

   USAGE
     https://inbxify-preview-proxy.jeff-2cd.workers.dev/?url=<encoded published URL>
   The Workbench iframe src points here; the visible URL bar + "Open ↗" link
   keep pointing at the real www.inbxify.com URL.

   SECURITY
   Only proxies URLs whose origin is in ALLOWED_ORIGINS. Anything else → 403.
   This prevents the Worker being used as an open proxy. Only pages whose
   origin is in CALLER_ORIGINS may read the proxy's answers from script.
   ============================================================ */

const ALLOWED_ORIGINS = [
  'https://www.inbxify.com',
  'https://inbxify.com',
];

// HC-P-IF1-5 · v1.1.0: the sites T-A runs on, allowed to read answers from script.
const CALLER_ORIGINS = [
  'https://www.inbxify.com',
  'https://inbxify.com',
];

export default {
  async fetch(request) {
    const res = await handle(request);
    return withCors(res, request.headers.get('Origin'));   // v1.1.0
  },
};

async function handle(request) {
  const reqUrl = new URL(request.url);
  const target = reqUrl.searchParams.get('url');

  if (!target) {
    return new Response('Missing ?url= parameter', { status: 400 });
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return new Response('Malformed ?url= parameter', { status: 400 });
  }

  // Allow-list guard — never act as an open proxy.
  if (!ALLOWED_ORIGINS.includes(targetUrl.origin)) {
    return new Response('Origin not allowed', { status: 403 });
  }

  // Fetch the published page server-side.
  let upstream;
  try {
    upstream = await fetch(targetUrl.toString(), {
      headers: { 'User-Agent': 'inbxify-preview-proxy' },
      redirect: 'follow',
    });
  } catch (err) {
    return new Response('Upstream fetch failed: ' + err, { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') || '';

  // Non-HTML responses (shouldn't normally hit here, but be safe): pass
  // through unmodified except for the framing headers.
  if (!contentType.includes('text/html')) {
    const passHeaders = new Headers(upstream.headers);
    stripFramingHeaders(passHeaders);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: passHeaders,
    });
  }

  // HTML: read, inject <base href>, rewrite headers.
  let html = await upstream.text();

  // Inject <base href> right after <head> so root-relative and relative
  // sub-resources resolve against the REAL origin, not the proxy origin.
  // (Option B — base-href injection.) Only inject if not already present.
  if (!/<base\s/i.test(html)) {
    const baseTag = '<base href="' + targetUrl.origin + '/">';
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, function (m) { return m + baseTag; });
    } else {
      // No <head> (unlikely for Webflow) — prepend.
      html = baseTag + html;
    }
  }

  const outHeaders = new Headers(upstream.headers);
  stripFramingHeaders(outHeaders);
  // Content length changed after injection — let the platform recompute.
  outHeaders.delete('content-length');
  // Don't let upstream caching mask edits during testing.
  outHeaders.set('cache-control', 'no-store');

  return new Response(html, {
    status: upstream.status,
    headers: outHeaders,
  });
}

/* v1.1.0 — let T-A read the answer (status included) from script.
   Only the calling origins in CALLER_ORIGINS are named; Vary: Origin keeps
   any cache from handing one origin's header to another. */
function withCors(res, origin) {
  if (!origin || !CALLER_ORIGINS.includes(origin)) return res;
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.append('Vary', 'Origin');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

/* Remove every header that can block framing. CSP may carry directives other
   than frame-ancestors, so we surgically drop only frame-ancestors rather
   than nuking the whole policy — keeps the rest of the page's protections. */
function stripFramingHeaders(headers) {
  headers.delete('x-frame-options');

  const csp = headers.get('content-security-policy');
  if (csp) {
    const cleaned = csp
      .split(';')
      .map(function (d) { return d.trim(); })
      .filter(function (d) { return d && !/^frame-ancestors/i.test(d); })
      .join('; ');
    if (cleaned) {
      headers.set('content-security-policy', cleaned);
    } else {
      headers.delete('content-security-policy');
    }
  }

  // Report-Only variant can also surface a frame-ancestors violation in console.
  const cspRO = headers.get('content-security-policy-report-only');
  if (cspRO) {
    const cleanedRO = cspRO
      .split(';')
      .map(function (d) { return d.trim(); })
      .filter(function (d) { return d && !/^frame-ancestors/i.test(d); })
      .join('; ');
    if (cleanedRO) {
      headers.set('content-security-policy-report-only', cleanedRO);
    } else {
      headers.delete('content-security-policy-report-only');
    }
  }
}
