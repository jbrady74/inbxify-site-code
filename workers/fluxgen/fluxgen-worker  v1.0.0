/* ============================================================
   fluxgen-worker  v1.0.0
   ============================================================
   INBXIFY · Flux 2 Pro image-generation Worker

   Mirrors the upscaler Worker pattern (HC-UPS):
   vendor API key held server-side, submit-and-poll, then
   re-upload the result to Uploadcare so the existing CDN
   transform helpers work unchanged and the URL is permanent.

   ── DEPLOY ──
   wrangler deploy
   wrangler secret put BFL_API_KEY            (BFL key — never in code)
   wrangler secret put UPLOADCARE_PUB_KEY     (same pub key ASF uses)

   ── ENDPOINT ──
   POST https://fluxgen.jeff-2cd.workers.dev/
   Body (JSON): { "prompt": "...", "width": 1024, "height": 1024 }

   ── RESPONSE ──
   200  { "url": "https://uyluucdnr2.ucarecd.net/<uuid>/",
          "uuid": "<uuid>",
          "model": "flux-2-pro",
          "seconds": 7.4 }
   4xx/5xx { "error": "...", "stage": "submit|poll|download|upload" }

   ── NOTES ──
   • BFL flux-2-pro is async: POST returns { id, polling_url }.
     We poll polling_url until status === 'Ready', then the
     result.sample URL is a SIGNED, TEMPORARY URL — we download
     it inside the Worker immediately (BFL result URLs expire)
     and push the bytes to Uploadcare.
   • BFL applies C2PA provenance metadata automatically. We
     preserve the bytes as-is on re-upload.
   ============================================================ */

const BFL_SUBMIT_URL   = 'https://api.bfl.ai/v1/flux-2-pro';
const UPLOADCARE_BASE  = 'https://uyluucdnr2.ucarecd.net'; // INBXIFY CDN alias
const UC_UPLOAD_URL    = 'https://upload.uploadcare.com/base/';

// Poll discipline (mirrors upscaler HC-UPS poll window)
const POLL_INTERVAL_MS = 1500;
const POLL_MAX_MS      = 60000;  // flux-2-pro typically 5–15s; generous ceiling

// Allowed origins for CORS (ASF / Title-Admin page). '*' is fine for a
// key-less POST surface, but we keep it explicit and tight.
const ALLOW_ORIGIN = '*';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age':       '86400',
  };
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function err(stage, message, status) {
  return json({ error: message, stage: stage }, status || 500);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default {
  async fetch(request, env) {
    // ── CORS preflight ──
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return err('method', 'Use POST', 405);
    }

    // ── Secrets ──
    const BFL_KEY = env.BFL_API_KEY;
    const UC_KEY  = env.UPLOADCARE_PUB_KEY;
    if (!BFL_KEY) return err('config', 'BFL_API_KEY secret not set', 500);
    if (!UC_KEY)  return err('config', 'UPLOADCARE_PUB_KEY secret not set', 500);

    // ── Parse + validate input ──
    let payload;
    try {
      payload = await request.json();
    } catch {
      return err('input', 'Body must be JSON', 400);
    }

    const prompt = (payload && typeof payload.prompt === 'string')
      ? payload.prompt.trim() : '';
    if (!prompt) return err('input', 'prompt is required', 400);

    // Default to square hero (1024×1024). Clamp to flux-2-pro sane range.
    const clamp = (n, lo, hi, dflt) => {
      const v = Number(n);
      if (!Number.isFinite(v)) return dflt;
      return Math.min(hi, Math.max(lo, Math.round(v)));
    };
    const width  = clamp(payload && payload.width,  256, 4096, 1024);
    const height = clamp(payload && payload.height, 256, 4096, 1024);

    const started = Date.now();

    // ── 1) SUBMIT ──
    let submitJson;
    try {
      const subRes = await fetch(BFL_SUBMIT_URL, {
        method: 'POST',
        headers: {
          'accept':       'application/json',
          'x-key':        BFL_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, width, height }),
      });
      const text = await subRes.text();
      if (!subRes.ok) {
        return err('submit', 'BFL submit HTTP ' + subRes.status + ': ' + text.slice(0, 300), 502);
      }
      submitJson = JSON.parse(text);
    } catch (e) {
      return err('submit', 'BFL submit failed: ' + String(e).slice(0, 200), 502);
    }

    const pollingUrl = submitJson && submitJson.polling_url;
    if (!pollingUrl) {
      return err('submit', 'BFL returned no polling_url', 502);
    }

    // ── 2) POLL ──
    let resultUrl = '';
    const deadline = started + POLL_MAX_MS;
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);
      let pj;
      try {
        const pRes = await fetch(pollingUrl, {
          method: 'GET',
          headers: { 'accept': 'application/json', 'x-key': BFL_KEY },
        });
        pj = await pRes.json();
      } catch (e) {
        return err('poll', 'BFL poll failed: ' + String(e).slice(0, 200), 502);
      }

      const status = pj && pj.status;
      if (status === 'Ready') {
        resultUrl = pj.result && pj.result.sample;
        break;
      }
      // Terminal failure states from BFL
      if (status === 'Error' || status === 'Failed' ||
          status === 'Content Moderated' || status === 'Request Moderated') {
        return err('poll', 'BFL generation ' + status +
          (pj && pj.details ? ': ' + JSON.stringify(pj.details).slice(0, 200) : ''), 502);
      }
      // else: 'Pending' / 'Queued' / 'Processing' — keep polling
    }

    if (!resultUrl) {
      return err('poll', 'Timed out after ' + (POLL_MAX_MS / 1000) + 's waiting for image', 504);
    }

    // ── 3) DOWNLOAD (result URL is temporary — fetch bytes now) ──
    let imgBlob, contentType;
    try {
      const imgRes = await fetch(resultUrl);
      if (!imgRes.ok) {
        return err('download', 'Result download HTTP ' + imgRes.status, 502);
      }
      contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      imgBlob = await imgRes.blob();
    } catch (e) {
      return err('download', 'Result download failed: ' + String(e).slice(0, 200), 502);
    }

    // ── 4) RE-UPLOAD to Uploadcare (same convention as ASF fireUpload) ──
    let ucUuid;
    try {
      const ext = contentType.indexOf('png') !== -1 ? 'png' : 'jpg';
      const fileName = 'flux-' + Date.now() + '.' + ext;

      const form = new FormData();
      form.append('UPLOADCARE_PUB_KEY', UC_KEY);
      form.append('UPLOADCARE_STORE', 'auto');
      form.append('file', imgBlob, fileName);

      const ucRes = await fetch(UC_UPLOAD_URL, { method: 'POST', body: form });
      if (!ucRes.ok) {
        return err('upload', 'Uploadcare HTTP ' + ucRes.status, 502);
      }
      const ucJson = await ucRes.json();
      if (!ucJson || !ucJson.file) {
        return err('upload', 'Uploadcare returned no file UUID', 502);
      }
      ucUuid = ucJson.file;
    } catch (e) {
      return err('upload', 'Uploadcare upload failed: ' + String(e).slice(0, 200), 502);
    }

    const finalUrl = UPLOADCARE_BASE + '/' + ucUuid + '/';
    const seconds  = Math.round((Date.now() - started) / 100) / 10;

    return json({
      url:     finalUrl,
      uuid:    ucUuid,
      model:   'flux-2-pro',
      width:   width,
      height:  height,
      seconds: seconds,
    });
  },
};
