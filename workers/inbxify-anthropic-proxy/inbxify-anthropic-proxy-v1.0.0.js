// inbxify-anthropic-proxy-v1.0.0.js
/**
 * INBXIFY — Anthropic API Proxy Worker
 * File: inbxify-anthropic-proxy.js
 * Deploy to: Cloudflare Workers
 *
 * Purpose: Proxies Anthropic API calls from the T-A page browser
 *          so the API key never touches the client.
 *
 * Environment variables (set in Cloudflare Dashboard → Worker → Settings → Variables):
 *   ANTHROPIC_API_KEY   — your Anthropic API key (sk-ant-...)
 *   ALLOWED_ORIGIN      — your site origin, e.g. https://inbxify.com
 *
 * Deploy steps — see bottom of file.
 */

export default {
  async fetch(request, env) {

    // ── CORS preflight ──
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204, env);
    }

    // ── Only accept POST ──
    if (request.method !== 'POST') {
      return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405, env);
    }

    // ── Only accept requests from your site ──
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || 'https://inbxify.com';
    if (origin !== allowed && !origin.endsWith('.webflow.io')) {
      // Also allow Webflow staging previews during dev
      return corsResponse(JSON.stringify({ error: 'Forbidden' }), 403, env);
    }

    // ── Forward to Anthropic ──
    let body;
    try {
      body = await request.json();
    } catch {
      return corsResponse(JSON.stringify({ error: 'Invalid JSON body' }), 400, env);
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await anthropicRes.json();

    return corsResponse(JSON.stringify(data), anthropicRes.status, env);
  }
};

// ── Helpers ──
function corsResponse(body, status, env) {
  const allowed = env?.ALLOWED_ORIGIN || 'https://inbxify.com';
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  return new Response(body, { status: status || 200, headers });
}


/* ════════════════════════════════════════════════════════════
   DEPLOY INSTRUCTIONS — one-time setup, ~10 minutes
   ════════════════════════════════════════════════════════════

   1. LOG IN TO CLOUDFLARE DASHBOARD
      https://dash.cloudflare.com → Workers & Pages → Create

   2. CREATE THE WORKER
      - Click "Create Worker"
      - Name it: inbxify-anthropic-proxy
      - Click "Deploy" (ignore the default code for now)

   3. PASTE THIS CODE
      - Click "Edit code"
      - Delete all default code
      - Paste the entire contents of this file
      - Click "Deploy"

   4. SET ENVIRONMENT VARIABLES
      Worker Settings → Variables and Secrets → Add:

      Variable name        | Value
      ---------------------|----------------------------------
      ANTHROPIC_API_KEY    | sk-ant-api03-...  (your key)
      ALLOWED_ORIGIN       | https://inbxify.com

      Set ANTHROPIC_API_KEY as a SECRET (not plain text).
      ALLOWED_ORIGIN can be plain text.

   5. NOTE YOUR WORKER URL
      It will look like:
      https://inbxify-anthropic-proxy.YOUR-SUBDOMAIN.workers.dev

      Put that URL in window.PP_WEBHOOKS on the T-A page head:
      window.PP_WEBHOOKS = {
        ...existing keys...
        anthropicProxy: 'https://inbxify-anthropic-proxy.YOUR-SUBDOMAIN.workers.dev'
      }

   6. CUSTOM DOMAIN (optional, cleaner)
      Worker Settings → Triggers → Add Custom Domain
      e.g. api.inbxify.com → maps to this worker
      Then use https://api.inbxify.com as the proxy URL.

   RATE LIMITING (recommended, free):
      Cloudflare Dashboard → Workers → your worker → Rate Limiting
      Add rule: 10 requests per minute per IP
      This prevents runaway usage if something goes wrong.

   FREE TIER LIMITS:
      100,000 requests/day — more than enough for this use case.
      No charge until you exceed that.

   ════════════════════════════════════════════════════════════ */
