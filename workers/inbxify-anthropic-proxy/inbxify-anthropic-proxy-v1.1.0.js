// inbxify-anthropic-proxy-v1.1.0.js
/**
 * INBXIFY — Anthropic API Proxy Worker
 * Repo:   workers/inbxify-anthropic-proxy/inbxify-anthropic-proxy-v1.1.0.js
 * Deploy: Cloudflare Workers → inbxify-anthropic-proxy (paste, Deploy)
 *
 * Purpose: forwards Anthropic /v1/messages calls from the T-A and IPP
 *          pages so the API key never reaches the browser. Used by
 *          ta-generate, ta-asf (Words, re-transcribe), ta-create-from-print
 *          (picture pass, image prompts), ta-image-gen, ix-ai.
 *
 * v1.1.0 (8 Nov 2026) — "Failed to fetch" on every AI call from
 *   https://www.inbxify.com. Three faults in v1.0.0, all fixed here:
 *   1. ONE ORIGIN ONLY. v1.0.0 answered every request, including the CORS
 *      preflight, with Access-Control-Allow-Origin set to the single
 *      ALLOWED_ORIGIN (https://inbxify.com). A page on www.inbxify.com got
 *      an answer it was not allowed to read, so the browser reported
 *      "Failed to fetch" and hid the real status. Now a LIST of origins is
 *      allowed (ALLOWED_ORIGINS, comma-separated) and the caller's own
 *      origin is echoed back, with Vary: Origin.
 *   2. NO ERROR HANDLING. An exception anywhere (JSON parse of a large
 *      body, Anthropic answering non-JSON, missing key) threw out of the
 *      Worker; Cloudflare's error page carries no CORS headers, so the
 *      browser again said "Failed to fetch". Every path now returns JSON
 *      with CORS headers and a plain reason (TOAST-TRUTH).
 *   3. BODY PARSED TWICE. v1.0.0 did request.json() then JSON.stringify on
 *      bodies that can carry a dozen images. The body is now passed through
 *      as bytes, untouched.
 *   Also: GET /health answers { ok, version, origins } so a deploy can be
 *   confirmed from Terminal without an API call.
 *
 * Environment variables (Worker → Settings → Variables and Secrets):
 *   ANTHROPIC_API_KEY   Secret. Unchanged from v1.0.0.
 *   ALLOWED_ORIGINS     Plain text, comma-separated, no spaces needed:
 *                       https://inbxify.com,https://www.inbxify.com
 *                       (ALLOWED_ORIGIN, singular, is still read as a
 *                       fallback so nothing breaks before the variable is
 *                       added.)
 *   ANTHROPIC_VERSION   Optional. Defaults to 2023-06-01.
 *
 * HARDCODING (provisional, for the Tracker)
 *   HC-P-PROXY-1  Default origin list https://inbxify.com and
 *                 https://www.inbxify.com, plus any origin ending in
 *                 .webflow.io (Webflow staging). Platform level: every T-A
 *                 and IPP page lives on inbxify.com. Override with the
 *                 ALLOWED_ORIGINS variable; no code change needed to add a
 *                 custom domain later.
 */

const VERSION = '1.1.0';
const DEFAULT_ORIGINS = ['https://inbxify.com', 'https://www.inbxify.com'];   // HC-P-PROXY-1
const STAGING_SUFFIX = '.webflow.io';                                           // HC-P-PROXY-1
const UPSTREAM = 'https://api.anthropic.com/v1/messages';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const okOrigin = originAllowed(origin, env);

    try {
      // ── CORS preflight ──
      if (request.method === 'OPTIONS') {
        if (!okOrigin) return json({ error: { type: 'forbidden', message: 'Origin not allowed: ' + (origin || '(none)') } }, 403, origin, env);
        return new Response(null, { status: 204, headers: corsHeaders(origin) });
      }

      // ── Health check (GET /health) ──
      if (request.method === 'GET') {
        return json({ ok: true, worker: 'inbxify-anthropic-proxy', version: VERSION, origins: allowedList(env), hasKey: !!env.ANTHROPIC_API_KEY }, 200, okOrigin ? origin : '', env);
      }

      if (request.method !== 'POST') {
        return json({ error: { type: 'method_not_allowed', message: 'Use POST' } }, 405, okOrigin ? origin : '', env);
      }

      if (!okOrigin) {
        return json({ error: { type: 'forbidden', message: 'Origin not allowed: ' + (origin || '(none)') } }, 403, origin, env);
      }

      if (!env.ANTHROPIC_API_KEY) {
        return json({ error: { type: 'misconfigured', message: 'ANTHROPIC_API_KEY is not set on the Worker' } }, 500, origin, env);
      }

      // ── Forward to Anthropic, body untouched ──
      const body = await request.arrayBuffer();
      if (!body || body.byteLength === 0) {
        return json({ error: { type: 'bad_request', message: 'Empty request body' } }, 400, origin, env);
      }

      let upstream;
      try {
        upstream = await fetch(UPSTREAM, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': env.ANTHROPIC_VERSION || '2023-06-01',
          },
          body: body,
        });
      } catch (e) {
        return json({ error: { type: 'upstream_unreachable', message: 'Could not reach api.anthropic.com: ' + msg(e) } }, 502, origin, env);
      }

      const text = await upstream.text();
      const ctype = upstream.headers.get('Content-Type') || '';
      if (ctype.indexOf('application/json') === 0 || looksJson(text)) {
        return new Response(text, { status: upstream.status, headers: corsHeaders(origin, { 'Content-Type': 'application/json' }) });
      }
      // Anthropic (or a gateway in front of it) answered something that is not JSON.
      return json({
        error: { type: 'upstream_non_json', message: 'Anthropic answered HTTP ' + upstream.status + ' without JSON: ' + text.slice(0, 500) }
      }, upstream.status >= 400 ? upstream.status : 502, origin, env);

    } catch (e) {
      // Last resort: never let an exception leave without CORS headers.
      return json({ error: { type: 'proxy_error', message: msg(e) } }, 500, okOrigin ? origin : '', env);
    }
  }
};

// ── Helpers ──
function allowedList(env) {
  const raw = (env && (env.ALLOWED_ORIGINS || env.ALLOWED_ORIGIN)) || '';
  const list = raw.split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);
  return list.length ? list : DEFAULT_ORIGINS.slice();
}
function originAllowed(origin, env) {
  if (!origin) return false;
  const o = origin.replace(/\/+$/, '');
  if (allowedList(env).indexOf(o) >= 0) return true;
  try { return new URL(o).hostname.endsWith(STAGING_SUFFIX); } catch (e) { return false; }
}
function corsHeaders(origin, extra) {
  const h = {
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, anthropic-version',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  if (origin) h['Access-Control-Allow-Origin'] = origin;
  if (extra) for (const k in extra) h[k] = extra[k];
  return h;
}
function json(obj, status, origin, env) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: corsHeaders(origin, { 'Content-Type': 'application/json' }) });
}
function looksJson(t) {
  const s = (t || '').trim();
  return (s[0] === '{' && s[s.length - 1] === '}') || (s[0] === '[' && s[s.length - 1] === ']');
}
function msg(e) { return (e && e.message) || String(e); }
