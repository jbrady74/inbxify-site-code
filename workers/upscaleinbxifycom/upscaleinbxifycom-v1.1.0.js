/* ===================================================================
   upscaleinbxifycom — Cloudflare Worker
   INBXIFY ix-upscale backend · v1.1.0

   v1.1.0 (submit/poll modes — removes the 25s hard ceiling):
     The v1.0.x flow did submit + poll + finalize inside one request,
     capped at POLL_MAX_MS = 25s (HC-UPS-006). A queued/slow WaveSpeed
     job died with VENDOR_TIMEOUT even when the vendor job later
     completed fine — observed on a 702×438 / 660KB PNG.

     New request modes (body.mode):
       (absent)   Legacy blocking flow. UNCHANGED — any other caller
                  of this Worker keeps working exactly as before.
       "submit"   Steps 1–2 only (resolve source, submit to vendor).
                  Returns immediately:
                    { ok:true, phase:"submitted",
                      vendor_request_id, worker_version }
       "poll"     ONE vendor status check (no sleep — the browser
                  owns the cadence). Requires body.vendor_request_id.
                  Still processing:
                    { ok:true, phase:"processing", vendor_status }
                  Completed → runs finalize (fetch vendor bytes,
                  re-upload to Uploadcare) and returns the SAME
                  success payload shape as the legacy flow, plus
                  phase:"completed". Client code downstream of the
                  legacy call needs zero changes.
                  Failed → VENDOR_FAILURE error, as before.

     The browser polls "poll" until phase flips. No Worker-side
     ceiling exists on the new path; each poll request is a fast
     single round-trip well under Cloudflare limits.

     Hardcoding updates:
       HC-UPS-006  poll window 25_000 ms — LEGACY PATH ONLY now.
                   The submit/poll path has no Worker-side window.
       HC-UPS-007  poll interval 750 ms — legacy path only.
       HC-UPS-015  client-side cadence + runaway cap live in
                   ta-converter (1500 ms / 180 s) — see that file.

     Deploy: paste over the existing Worker in the Cloudflare
     dashboard (or wrangler deploy). Secrets unchanged. Verify with
     GET / — health string reports v1.1.0.

   v1.0.1 (patch)
     - VENDOR_SUBMIT / VENDOR_POLL bumped to WaveSpeed v3 wavespeed-ai
       namespace. v2 nightmareai/real-esrgan path returns "Model not
       found" — WaveSpeed consolidated the model under v3.
     - Submit body shrunk to just `image`. v3 model page documents only
       `image` as input; guidance_scale and face_enhance are not
       surfaced by the v3 wrapper. The caller still sends scale +
       face_restore (for forward compatibility); the Worker logs them
       and echoes them back as *_requested, but does not forward.
     - HC-UPS-005 updated.
     - Response fields renamed scale_applied → scale_requested and
       face_restore_applied → face_restore_requested so the response
       doesn't claim a vendor outcome the v3 endpoint never confirmed.
     - Health response and diagnostics include worker_version + active
       vendor endpoint so post-deploy verification doesn't depend on
       reading the deploy hash.

   v1.0.0
     Initial cut. POST → WaveSpeed → poll → re-upload to Uploadcare on
     the inbxify CDN alias.

   Endpoints
     POST  /            JSON in/out (see "Request body" below)
     OPTIONS /          CORS preflight
     GET  /             Plain-text health string

   Required Worker Secrets (set in dashboard → Settings → Variables)
     WAVESPEED_API_KEY        Bearer token for WaveSpeed
     UPLOADCARE_PUBLIC_KEY    Uploadcare public key (matches TA_CONFIG)

   Hardcoding (HC-UPS series — see Studio MR / Platform Roadmap)
     HC-UPS-002  default scale = 2 (caller intent only; v3 ignores)
     HC-UPS-003  default face_restore = false (caller intent only; v3 ignores)
     HC-UPS-004  max base64 input = 10 MB
     HC-UPS-005  vendor = WaveSpeed v3 wavespeed-ai/real-esrgan
     HC-UPS-006  poll window = 25_000 ms — LEGACY blocking path only
     HC-UPS-007  poll interval = 750 ms — legacy blocking path only
     HC-UPS-010  source URL allowlist (ucarecdn.com, ucarecd.net, webflow)

   Request body
     {
       "mode":         "submit" | "poll",  // optional; absent = legacy blocking
       "vendor_request_id": "...",         // required when mode = "poll"
       "source":       { "type": "url" | "base64", "data": "..." },  // submit/legacy
       "scale":        2 | 4,            // optional, default 2 (caller intent only)
       "face_restore": boolean,          // optional, default false (caller intent only)
       "context":      { ... }           // optional, surface metadata
     }

   Success response (200) — legacy flow and poll-completed
     {
       "ok": true,
       "phase": "completed",             // poll-completed only
       "upscaled":    { uploadcare_uuid, url, scale_requested, face_restore_requested, size_bytes },
       "diagnostics": { vendor, vendor_request_id, duration_ms, worker_version }
     }

   Error response (4xx / 5xx — always JSON body)
     {
       "ok": false,
       "error": { "code": "...", "message": "...", ...extras }
     }
   =================================================================== */

const VERSION = '1.1.0';

const VENDOR_SUBMIT = 'https://api.wavespeed.ai/api/v3/wavespeed-ai/real-esrgan';
const VENDOR_POLL   = id => `https://api.wavespeed.ai/api/v3/predictions/${id}/result`;
const POLL_INTERVAL_MS = 750;     // HC-UPS-007 — legacy path only
const POLL_MAX_MS      = 25_000;  // HC-UPS-006 — legacy path only

const UC_UPLOAD = 'https://upload.uploadcare.com/base/';
const CDN_HOST  = 'uyluucdnr2.ucarecd.net';

const MAX_BASE64_BYTES = 10 * 1024 * 1024;  // HC-UPS-004

// HC-UPS-010 — source URL allowlist. Anything not from these hosts is
// rejected before we burn a WaveSpeed credit on it.
const ALLOWED_SOURCE_HOSTS = [
  'ucarecdn.com',
  'ucarecd.net',
  'webflow.com',
  'website-files.com',  // Webflow's asset CDN
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age':       '86400',
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function errorResponse(status, code, message, extras = {}) {
  return jsonResponse(status, { ok: false, error: { code, message, ...extras } });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function isAllowedSourceUrl(url) {
  try {
    const u = new URL(url);
    return ALLOWED_SOURCE_HOSTS.some(h => u.hostname === h || u.hostname.endsWith('.' + h));
  } catch {
    return false;
  }
}

function tryHost(url) {
  try { return new URL(url).hostname; } catch { return null; }
}

// Vendor response shapes vary across versions. Pull the id / status /
// outputs out defensively so a small WaveSpeed change doesn't take
// the Worker offline.
function extractRequestId(j) {
  return (j && j.data && j.data.id) || (j && j.id) || (j && j.request_id) || null;
}
function extractStatus(j) {
  return (j && j.data && j.data.status) || (j && j.status) || null;
}
function extractOutputs(j) {
  const d = (j && j.data) || j || {};
  if (Array.isArray(d.outputs) && d.outputs.length) return d.outputs;
  if (typeof d.output === 'string') return [d.output];
  if (Array.isArray(d.output))     return d.output;
  return [];
}
function extractVendorError(j) {
  const d = (j && j.data) || j || {};
  return d.error || d.message || 'unknown vendor error';
}

function base64ToBlob(dataUrl) {
  const m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  let mime = 'application/octet-stream';
  let b64;
  if (m) { mime = m[1]; b64 = m[2]; }
  else   { b64 = String(dataUrl); }
  try {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

async function uploadToUploadcare(blob, filename, publicKey) {
  const fd = new FormData();
  fd.append('UPLOADCARE_PUB_KEY', publicKey);
  fd.append('UPLOADCARE_STORE',   '1');
  fd.append('file', blob, filename);
  const res = await fetch(UC_UPLOAD, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(`Uploadcare upload failed: HTTP ${res.status}`);
  const j = await res.json();
  if (!j || !j.file) throw new Error('Uploadcare returned no UUID.');
  const safeName = (filename || 'upscaled').replace(/[^a-zA-Z0-9._-]/g, '_');
  return {
    uuid: j.file,
    url:  `https://${CDN_HOST}/${j.file}/${safeName}`,
  };
}

function filenameForContext(context, suffix) {
  const surface = (context && context.source_surface) || 'upscale';
  const ts = Date.now();
  return `${suffix || 'upscaled'}-${surface}-${ts}.jpg`;
}

// ── Shared: resolve body.source to a fetchable URL (steps 1) ──
// Returns { sourceUrl } or { error: Response }.
async function resolveSource(source, context, env) {
  if (source.type === 'url') {
    if (!isAllowedSourceUrl(source.data)) {
      return { error: errorResponse(400, 'INVALID_SOURCE',
        'source URL not on allowlist (Uploadcare/Webflow only).',
        { source_url_host: tryHost(source.data) }) };
    }
    return { sourceUrl: source.data };
  }

  if (source.type === 'base64') {
    const blob = base64ToBlob(source.data);
    if (!blob) {
      return { error: errorResponse(400, 'INVALID_SOURCE', 'Could not parse base64 data URL.') };
    }
    if (blob.size > MAX_BASE64_BYTES) {
      return { error: errorResponse(413, 'INVALID_SOURCE',
        `Source exceeds ${MAX_BASE64_BYTES} bytes.`,
        { received_bytes: blob.size }) };
    }
    const sourceName = filenameForContext(context, 'upscale-src');
    const up = await uploadToUploadcare(blob, sourceName, env.UPLOADCARE_PUBLIC_KEY);
    return { sourceUrl: up.url };
  }

  return { error: errorResponse(400, 'INVALID_SOURCE', `Unknown source.type "${source.type}".`) };
}

// ── Shared: submit to WaveSpeed (step 2) ──
// Returns { requestId } or { error: Response }.
async function submitToVendor(sourceUrl, env) {
  const submitRes = await fetch(VENDOR_SUBMIT, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${env.WAVESPEED_API_KEY}`,
    },
    body: JSON.stringify({ image: sourceUrl }),
  });

  if (!submitRes.ok) {
    const text = await submitRes.text().catch(() => '');
    console.error('submit failed', submitRes.status, text.slice(0, 500));
    return { error: errorResponse(502, 'VENDOR_FAILURE',
      `Submit failed: HTTP ${submitRes.status}`,
      { vendor_status: submitRes.status, vendor_body_preview: text.slice(0, 500) }) };
  }

  const submitJson = await submitRes.json();
  console.log('submit response', JSON.stringify(submitJson).slice(0, 500));

  const requestId = extractRequestId(submitJson);
  if (!requestId) {
    return { error: errorResponse(502, 'VENDOR_FAILURE',
      'Submit returned no request id.',
      { vendor_body: submitJson }) };
  }
  return { requestId };
}

// ── Shared: finalize (steps 4–6) ──
// Fetch vendor output bytes, re-upload to Uploadcare, build success body.
async function finalize(outputUrl, requestId, scale, face_restore, context, env, t0, phase) {
  const vendorImgRes = await fetch(outputUrl);
  if (!vendorImgRes.ok) {
    return errorResponse(502, 'VENDOR_FAILURE',
      `Could not fetch upscaled image: HTTP ${vendorImgRes.status}`,
      { vendor_request_id: requestId, output_url: outputUrl });
  }
  const vendorBlob = await vendorImgRes.blob();

  const finalName = filenameForContext(context, 'upscaled');
  const finalUpload = await uploadToUploadcare(
    vendorBlob, finalName, env.UPLOADCARE_PUBLIC_KEY
  );

  const body = {
    ok: true,
    upscaled: {
      uploadcare_uuid:        finalUpload.uuid,
      url:                    finalUpload.url,
      scale_requested:        scale,
      face_restore_requested: face_restore,
      size_bytes:             vendorBlob.size,
    },
    diagnostics: {
      vendor:             'wavespeed/wavespeed-ai-real-esrgan-v3',
      vendor_request_id:  requestId,
      duration_ms:        Date.now() - t0,
      worker_version:     VERSION,
    },
  };
  if (phase) body.phase = phase;
  return jsonResponse(200, body);
}

export default {
  async fetch(request, env, _ctx) {

    // ── CORS preflight ──
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ── Health check ──
    if (request.method === 'GET') {
      return new Response(
        `INBXIFY upscale worker v${VERSION}\n` +
        `vendor: ${VENDOR_SUBMIT}\n` +
        `modes: (legacy blocking) | submit | poll\n` +
        `POST JSON: { mode?, vendor_request_id?, source:{type,data}, scale, face_restore, context }\n`,
        { status: 200, headers: { 'Content-Type': 'text/plain', ...CORS_HEADERS } }
      );
    }

    if (request.method !== 'POST') {
      return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Use POST.');
    }

    // ── Env sanity ──
    if (!env.WAVESPEED_API_KEY) {
      return errorResponse(500, 'INTERNAL', 'WAVESPEED_API_KEY not configured.');
    }
    if (!env.UPLOADCARE_PUBLIC_KEY) {
      return errorResponse(500, 'INTERNAL', 'UPLOADCARE_PUBLIC_KEY not configured.');
    }

    // ── Parse body ──
    let body;
    try { body = await request.json(); }
    catch { return errorResponse(400, 'INVALID_SOURCE', 'Body must be JSON.'); }

    const mode         = body.mode || null;
    const scale        = (body.scale === 4) ? 4 : 2;
    const face_restore = body.face_restore === true;
    const context      = body.context || {};

    const t0 = Date.now();

    try {

      // ═════════════════════════════════════════════════════════
      // MODE: "poll" — one status check, finalize on completion.
      // No source needed; requires vendor_request_id.
      // ═════════════════════════════════════════════════════════
      if (mode === 'poll') {
        const requestId = body.vendor_request_id;
        if (!requestId) {
          return errorResponse(400, 'INVALID_SOURCE', 'vendor_request_id required for mode "poll".');
        }

        const pollRes = await fetch(VENDOR_POLL(requestId), {
          headers: { 'Authorization': `Bearer ${env.WAVESPEED_API_KEY}` },
        });
        if (!pollRes.ok) {
          // Transient vendor blip — tell the client to keep polling.
          return jsonResponse(200, {
            ok: true, phase: 'processing',
            vendor_status: `poll HTTP ${pollRes.status}`,
            worker_version: VERSION,
          });
        }

        const pollJson = await pollRes.json();
        const status = extractStatus(pollJson);
        console.log('poll(mode)', requestId, status);

        if (status === 'completed' || status === 'success') {
          const outputs = extractOutputs(pollJson);
          const outputUrl = outputs[0] || null;
          if (!outputUrl) {
            return errorResponse(502, 'VENDOR_FAILURE',
              'Completed but no output URL.',
              { vendor_body: pollJson, vendor_request_id: requestId });
          }
          return await finalize(outputUrl, requestId, scale, face_restore, context, env, t0, 'completed');
        }

        if (status === 'failed' || status === 'error') {
          return errorResponse(502, 'VENDOR_FAILURE',
            `Vendor reported failure: ${extractVendorError(pollJson)}`,
            { vendor_request_id: requestId });
        }

        return jsonResponse(200, {
          ok: true, phase: 'processing',
          vendor_status: status || 'unknown',
          worker_version: VERSION,
        });
      }

      // ═════════════════════════════════════════════════════════
      // Source required from here down (submit + legacy).
      // ═════════════════════════════════════════════════════════
      const source = body.source;
      if (!source || !source.type || !source.data) {
        return errorResponse(400, 'INVALID_SOURCE', 'source.{type,data} required.');
      }

      console.log('caller intent', { mode, scale, face_restore, surface: context.source_surface });

      const resolved = await resolveSource(source, context, env);
      if (resolved.error) return resolved.error;
      const sourceUrl = resolved.sourceUrl;

      const submitted = await submitToVendor(sourceUrl, env);
      if (submitted.error) return submitted.error;
      const requestId = submitted.requestId;

      // ═════════════════════════════════════════════════════════
      // MODE: "submit" — return the job id immediately.
      // ═════════════════════════════════════════════════════════
      if (mode === 'submit') {
        return jsonResponse(200, {
          ok: true,
          phase: 'submitted',
          vendor_request_id: requestId,
          worker_version: VERSION,
        });
      }

      // ═════════════════════════════════════════════════════════
      // LEGACY blocking flow (no mode) — unchanged behavior.
      // Poll inside this request up to POLL_MAX_MS, then finalize.
      // ═════════════════════════════════════════════════════════
      const tPollStart = Date.now();
      let outputUrl = null;
      let lastStatus = null;

      while (Date.now() - tPollStart < POLL_MAX_MS) {
        await sleep(POLL_INTERVAL_MS);

        const pollRes = await fetch(VENDOR_POLL(requestId), {
          headers: { 'Authorization': `Bearer ${env.WAVESPEED_API_KEY}` },
        });
        if (!pollRes.ok) continue;  // transient — keep trying within the window

        const pollJson = await pollRes.json();
        lastStatus = extractStatus(pollJson);
        console.log('poll', lastStatus, Date.now() - tPollStart, 'ms');

        if (lastStatus === 'completed' || lastStatus === 'success') {
          const outputs = extractOutputs(pollJson);
          outputUrl = outputs[0] || null;
          if (!outputUrl) {
            return errorResponse(502, 'VENDOR_FAILURE',
              'Completed but no output URL.',
              { vendor_body: pollJson, vendor_request_id: requestId });
          }
          break;
        }
        if (lastStatus === 'failed' || lastStatus === 'error') {
          return errorResponse(502, 'VENDOR_FAILURE',
            `Vendor reported failure: ${extractVendorError(pollJson)}`,
            { vendor_request_id: requestId });
        }
      }

      if (!outputUrl) {
        return errorResponse(504, 'VENDOR_TIMEOUT',
          `Polled ${POLL_MAX_MS}ms, last status: ${lastStatus || 'none'}`,
          { vendor_request_id: requestId });
      }

      return await finalize(outputUrl, requestId, scale, face_restore, context, env, t0, null);

    } catch (err) {
      console.error('unhandled', err && err.stack || err);
      return errorResponse(500, 'INTERNAL',
        err && err.message ? err.message : 'Unknown failure',
        { duration_ms: Date.now() - t0 });
    }
  },
};
