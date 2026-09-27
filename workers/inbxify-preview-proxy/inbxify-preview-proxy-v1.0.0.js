// inbxify-preview-proxy-v1.0.0.js
/* ============================================================
   inbxify-preview-proxy
   Cloudflare Worker — Asset Workbench LEFT-pane preview proxy

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
   This prevents the Worker being used as an open proxy.
   ============================================================ */

const ALLOWED_ORIGINS = [
  'https://www.inbxify.com',
  'https://inbxify.com',
];

export default {
  async fetch(request) {
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
  },
};

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
