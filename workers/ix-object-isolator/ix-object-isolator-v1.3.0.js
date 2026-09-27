/**
 * ix-object-isolator-worker-v1.3.0.js
 * INBXIFY — Object Isolator (Cloudflare Worker)
 *
 * v1.3.0 — RETURN_BASE64: pass { return_base64: true } and the worker
 *   fetches the finished PNG server-side and returns its bytes as base64
 *   in `data` (with media_type) alongside the url. Needed because the
 *   browser draws the cut-out onto a canvas it must later EXPORT
 *   (toBlob) — a cross-origin image without CORS headers taints the
 *   canvas and breaks export. Server-side bytes are deterministic;
 *   no dependency on the vendor CDN's CORS policy.
 *
 * v1.2.0 — TWO FIXES from live smoke test (2026-07-08):
 *   1. MEDIA UPLOAD: base64 path now posts multipart/form-data to
 *      /api/v3/media/upload/binary (v1.1.0 posted JSON to /media/upload,
 *      which WaveSpeed routed as a model name -> 400 "Model not found").
 *      Hosted URL is read from data.download_url.
 *      NOTE: WaveSpeed-hosted uploads self-delete after ~7 days. Fine for
 *      isolation (SAM3 reads it within seconds) — NEVER treat a WaveSpeed
 *      media URL as durable storage.
 *   2. PROMPT SHAPES: SAM3 rejects [x,y,w,h] / [x,y] arrays ("please send
 *      an object"). Confirmed shapes from the playground schema:
 *        box item:   { x_min, y_min, x_max, y_max }
 *        point item: { label, x, y }   (label 1 = foreground/include)
 *      The worker now translates: browser may send simple arrays
 *      ([x,y,w,h] boxes, [x,y] points) OR pre-shaped objects; either way
 *      WaveSpeed receives the object shape. Vendor quirk stays server-side.
 *
 * v1.1.0 — FLEX INPUT: accepts a public URL OR base64 image bytes. Base64
 *   (from a pasted ad / a canvas) is uploaded to WaveSpeed's media endpoint
 *   inside the worker, so the common "copy ad -> paste into reformatter ->
 *   isolate" path needs NO Uploadcare round-trip. URL still works too.
 *
 * Fronts WaveSpeed SAM3 Image Segmentation so the browser never sees the
 * WaveSpeed key and CORS/origin is enforced. Operator points/boxes/types
 * at an object in an ad; SAM3 returns that object cut onto transparency
 * (background removed). Used by the Ad Reformat + Generate editors to
 * "Isolate object".
 *
 * Pattern mirrors ix-adreformat / the upscaler proxy:
 *   - server-side WAVESPEED_API_KEY (env secret; never in frontend)
 *   - origin allow-list (inbxify.com / www.inbxify.com / *.webflow.io)
 *   - CORS preflight handled
 *
 * WaveSpeed SAM3 is ASYNC (submit -> prediction id -> poll result). This
 * worker hides that: it submits, polls until completed, and returns the
 * final PNG URL in one response, so the browser makes a single call.
 *
 * Request (POST /):
 *   {
 *     image: "<https url>"                 // public URL (Uploadcare etc.)
 *       | "data:image/png;base64,..."      // data URI (paste/canvas)
 *       | { data:"<base64>", media_type }  // raw base64 + mime
 *     point_prompts?: [[x,y], ...]              // simple arrays, PIXEL coords
 *                   | [{label,x,y}, ...]        // or pre-shaped objects
 *     box_prompts?:   [[x,y,w,h], ...]          // simple arrays, PIXEL coords
 *                   | [{x_min,y_min,x_max,y_max}, ...]
 *     prompt?: "the truck"                      // optional text prompt
 *     return_base64?: true                      // also return PNG bytes (v1.3.0)
 *     // at least one of point_prompts / box_prompts / prompt required
 *   }
 *
 * Response (200):
 *   { ok:true, url:"<transparent png url>", predictionId, ms }
 *   ...with return_base64: adds data:"<base64 png>", media_type:"image/png"
 * Error:
 *   { ok:false, error, detail? }
 *
 * Secrets (env): WAVESPEED_API_KEY
 * Host: ix-object-isolator.jeff-2cd.workers.dev
 */

const ALLOWED_ORIGINS = [
  'https://inbxify.com',
  'https://www.inbxify.com'
];
const ALLOWED_SUFFIX = '.webflow.io';

// HC: WaveSpeed endpoints + shapes (see Hardcoding Tracker — isolator worker entry)
const SAM3_SUBMIT = 'https://api.wavespeed.ai/api/v3/wavespeed-ai/sam3-image';
const SAM3_RESULT = 'https://api.wavespeed.ai/api/v3/predictions/'; // + {id}/result
const WS_MEDIA_UPLOAD_BINARY = 'https://api.wavespeed.ai/api/v3/media/upload/binary'; // multipart; ~7-day retention

// Poll config — SAM3 is fast but async; cap the wait so a stuck job
// doesn't hang the worker. ~30s ceiling (60 * 500ms).
const POLL_INTERVAL_MS = 500;
const POLL_MAX_TRIES = 60;

// ── Prompt shape translation (v1.2.0) ──
// Boxes: accept [x,y,w,h] arrays or {x_min,...} objects -> {x_min,y_min,x_max,y_max}
function normalizeBoxes(list) {
  const out = [];
  for (const b of list) {
    if (Array.isArray(b) && b.length === 4) {
      const x = Number(b[0]), y = Number(b[1]), w = Number(b[2]), h = Number(b[3]);
      out.push({ x_min: x, y_min: y, x_max: x + w, y_max: y + h });
    } else if (b && typeof b === 'object' && 'x_min' in b) {
      out.push({
        x_min: Number(b.x_min), y_min: Number(b.y_min),
        x_max: Number(b.x_max), y_max: Number(b.y_max)
      });
    }
    // silently skip malformed entries — validation happens on count below
  }
  return out;
}
// Points: accept [x,y] arrays or {label,x,y} objects -> {label,x,y}, label default 1 (foreground)
function normalizePoints(list) {
  const out = [];
  for (const p of list) {
    if (Array.isArray(p) && p.length >= 2) {
      out.push({ label: 1, x: Number(p[0]), y: Number(p[1]) });
    } else if (p && typeof p === 'object' && 'x' in p && 'y' in p) {
      out.push({ label: ('label' in p) ? Number(p.label) : 1, x: Number(p.x), y: Number(p.y) });
    }
  }
  return out;
}

// Resolve the caller's image into a URL WaveSpeed can fetch. Accepts EITHER
// a public URL string (e.g. Uploadcare) OR base64 bytes (from a paste /
// canvas). Base64 is uploaded to WaveSpeed's binary media endpoint as
// multipart/form-data (v1.2.0 fix) so the tool never needs its own
// Uploadcare round-trip.
async function resolveImageUrl(image, key) {
  // already a URL
  if (typeof image === 'string' && /^https?:\/\//i.test(image)) return image;

  // pull out mime + raw base64 from a data URI or { data, media_type }
  let mediaType = 'image/png', rawB64 = null;
  if (typeof image === 'string' && /^data:/i.test(image)) {
    const m = image.match(/^data:([^;,]+)?(;base64)?,(.*)$/i);
    if (m) { if (m[1]) mediaType = m[1]; rawB64 = m[3]; }
  } else if (image && image.data) {
    mediaType = image.media_type || 'image/png';
    rawB64 = String(image.data).replace(/^data:[^,]+,/, '');
  }
  if (!rawB64) return null;

  // base64 -> bytes
  let bytes;
  try {
    const bin = atob(rawB64);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } catch (e) {
    throw new Error('base64 decode failed');
  }

  // multipart upload to WaveSpeed binary media endpoint
  const ext = (mediaType.split('/')[1] || 'png').replace(/[^a-z0-9]/gi, '') || 'png';
  const fd = new FormData();
  fd.append('file', new Blob([bytes], { type: mediaType }), 'isolate-src.' + ext);

  const up = await fetch(WS_MEDIA_UPLOAD_BINARY, {
    method: 'POST',
    // NOTE: do NOT set Content-Type — fetch sets the multipart boundary
    headers: { 'Authorization': 'Bearer ' + key },
    body: fd
  });
  const txt = await up.text();
  if (!up.ok) throw new Error('WaveSpeed media upload ' + up.status + ': ' + txt.slice(0, 200));
  let j; try { j = JSON.parse(txt); } catch (e) { throw new Error('media upload non-JSON'); }
  const url = (j.data && (j.data.download_url || j.data.url)) || j.download_url || j.url || null;
  if (!url) throw new Error('media upload returned no url: ' + txt.slice(0, 200));
  return url; // WaveSpeed-hosted; ~7-day retention — transient use only
}

function corsHeaders(origin) {
  const ok = origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(ALLOWED_SUFFIX));
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}
function json(body, status, origin) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Chunked base64 encode — String.fromCharCode.apply on a huge array blows
// the stack; 32KB chunks keep it safe for multi-MB PNGs. v1.3.0
function bytesToBase64(bytes) {
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  }
  return btoa(bin);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'POST') {
      return json({ ok: false, error: 'POST only' }, 405, origin);
    }
    if (!env.WAVESPEED_API_KEY) {
      return json({ ok: false, error: 'WAVESPEED_API_KEY not configured' }, 500, origin);
    }

    let body;
    try { body = await request.json(); }
    catch (e) { return json({ ok: false, error: 'Body must be JSON' }, 400, origin); }

    // Resolve the image to a WaveSpeed-fetchable URL (URL pass-through, or
    // base64 -> multipart upload to WaveSpeed media). v1.2.0
    let image;
    try {
      image = await resolveImageUrl(body.image, env.WAVESPEED_API_KEY);
    } catch (e) {
      return json({ ok: false, error: 'Image hosting failed: ' + (e.message || e) }, 502, origin);
    }
    if (!image) {
      return json({ ok: false, error: 'image must be a public URL or base64 { data, media_type }' }, 400, origin);
    }

    // Normalize prompts to WaveSpeed object shapes. v1.2.0
    const point_prompts = normalizePoints(Array.isArray(body.point_prompts) ? body.point_prompts : []);
    const box_prompts   = normalizeBoxes(Array.isArray(body.box_prompts) ? body.box_prompts : []);
    const textPrompt    = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (!point_prompts.length && !box_prompts.length && !textPrompt) {
      return json({ ok: false, error: 'Provide at least one prompt: point_prompts, box_prompts, or prompt (text).' }, 400, origin);
    }

    const submitPayload = {
      image: image,
      point_prompts: point_prompts,
      box_prompts: box_prompts,
      // apply_mask true + png => transparent cut-out of the target object
      apply_mask: true,
      output_format: 'png'
    };
    if (textPrompt) submitPayload.prompt = textPrompt;

    const started = Date.now();

    // ── 1. Submit ──
    let subRes, subText;
    try {
      subRes = await fetch(SAM3_SUBMIT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + env.WAVESPEED_API_KEY
        },
        body: JSON.stringify(submitPayload)
      });
      subText = await subRes.text();
    } catch (e) {
      return json({ ok: false, error: 'Submit to WaveSpeed failed: ' + (e.message || e) }, 502, origin);
    }
    if (!subRes.ok) {
      return json({ ok: false, error: 'WaveSpeed submit ' + subRes.status, detail: subText.slice(0, 400) }, 502, origin);
    }

    let subData;
    try { subData = JSON.parse(subText); } catch (e) {
      return json({ ok: false, error: 'WaveSpeed submit returned non-JSON' }, 502, origin);
    }
    // prediction id lives under data.id (WaveSpeed v3 shape — confirmed live 2026-07-08)
    const predictionId = (subData && subData.data && subData.data.id) || subData.id || null;
    if (!predictionId) {
      return json({ ok: false, error: 'No prediction id in WaveSpeed response', detail: subText.slice(0, 300) }, 502, origin);
    }

    // ── 2. Poll until completed ──
    let outUrl = null, lastStatus = '';
    for (let i = 0; i < POLL_MAX_TRIES; i++) {
      await sleep(POLL_INTERVAL_MS);
      let pollRes, pollText;
      try {
        pollRes = await fetch(SAM3_RESULT + predictionId + '/result', {
          headers: { 'Authorization': 'Bearer ' + env.WAVESPEED_API_KEY }
        });
        pollText = await pollRes.text();
      } catch (e) { continue; } // transient — keep polling
      if (!pollRes.ok) continue;

      let pollData;
      try { pollData = JSON.parse(pollText); } catch (e) { continue; }
      const d = pollData.data || pollData;
      lastStatus = d.status || '';
      if (lastStatus === 'completed') {
        // outputs is an array of URLs (confirmed live 2026-07-08)
        outUrl = (Array.isArray(d.outputs) && d.outputs[0]) || (d.output && d.output.url) || null;
        break;
      }
      if (lastStatus === 'failed' || lastStatus === 'error') {
        return json({ ok: false, error: 'WaveSpeed segmentation failed', detail: (d.error || '').toString().slice(0, 300) }, 502, origin);
      }
      // else: still queued/processing — keep polling
    }

    if (!outUrl) {
      return json({ ok: false, error: 'Timed out waiting for segmentation (last status: ' + (lastStatus || 'unknown') + ')' }, 504, origin);
    }

    const result = { ok: true, url: outUrl, predictionId: predictionId, ms: Date.now() - started };

    // v1.3.0 — optionally return the PNG bytes so the browser gets an
    // untainted canvas regardless of the output CDN's CORS policy.
    if (body.return_base64 === true) {
      try {
        const imgRes = await fetch(outUrl);
        if (imgRes.ok) {
          const buf = new Uint8Array(await imgRes.arrayBuffer());
          result.data = bytesToBase64(buf);
          result.media_type = imgRes.headers.get('Content-Type') || 'image/png';
          result.ms = Date.now() - started;
        } else {
          result.base64_error = 'output fetch ' + imgRes.status; // url still usable
        }
      } catch (e) {
        result.base64_error = 'output fetch failed: ' + (e.message || e);
      }
    }

    return json(result, 200, origin);
  }
};
