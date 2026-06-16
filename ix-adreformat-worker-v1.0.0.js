/**
 * ix-adreformat-worker-v1.0.0.js
 * INBXIFY — Ad Reformatter extraction Worker (Cloudflare)
 *
 * One job: take a source ad image, ask Claude vision to decompose it
 * into reusable parts, and return a CLEAN parts contract for the
 * Ad Reformatter UI (Generator tab).
 *
 * Pattern mirrors inbxify-anthropic-proxy / fluxgen:
 *   - server-side ANTHROPIC_API_KEY (env secret; never in frontend)
 *   - origin allow-list (inbxify.com / www.inbxify.com / *.webflow.io)
 *   - CORS preflight handled
 *
 * Request  (POST /):
 *   { image: { media_type: "image/jpeg"|"image/png"|"image/webp",
 *              data: "<base64, no data: prefix>" } }
 *
 * Response (200):
 *   { ok:true, parts: {
 *       business_name, texts:[{role,value,verify?}],
 *       images:[{label,kind,bbox:[x,y,w,h]}],
 *       brand_colors:[hex,...]
 *   }, diagnostics:{ raw_text_count, deduped_text_count, model } }
 *
 * Worker does (beyond the raw Claude call):
 *   1. DEDUPE texts — normalize case + strip punctuation/space; collapse
 *      duplicates (e.g. "climateplus.com" / "ClimatePlus.com" → one;
 *      "973-838-3200" / "(973) 838-3200" → one by digit-equality).
 *   2. FINE-PRINT FLAG — mark license / promo_code / address / "other"
 *      roles with verify:true so the UI can cue "small text — confirm"
 *      (OCR slips on fine print; observed 19HC→19HG in testing).
 *   3. Bbox clamp to [0,1] so a loose box never breaks the browser crop.
 *
 * Secrets (env): ANTHROPIC_API_KEY
 * Host: ix-adreformat.jeff-2cd.workers.dev
 */

const ALLOWED_ORIGINS = [
  'https://inbxify.com',
  'https://www.inbxify.com'
];
const ALLOWED_SUFFIX = '.webflow.io';
const ANTHROPIC_MODEL = 'claude-sonnet-4-5';

const EXTRACT_PROMPT = `You are extracting reusable parts from a print advertisement so they can be rebuilt into a small web banner (700x235) for an email newsletter.

Return ONLY valid JSON, no markdown fences, no preamble. Shape:
{
  "business_name": "string (the advertiser's name)",
  "texts": [ { "role": "headline|tagline|offer|promo_code|services|phone|web|address|license|person|other", "value": "string" } ],
  "images": [ { "label": "short human label e.g. 'logo','mascot','vehicle photo','QR code','coupon'", "kind": "logo|mascot|photo|graphic|qr|coupon|badge|other", "bbox": [x, y, w, h] } ],
  "brand_colors": [ "#hex", ... up to 4, ordered most-prominent first ]
}

Rules:
- bbox values are FRACTIONS of image dimensions (0.0-1.0): x,y = top-left corner, w,h = width,height.
- Return EVERY distinct image region you can identify (logos, mascots, photos, QR codes, coupon blocks, partner logos, review badges) - do not limit to one.
- Return EVERY distinct text snippet, each with its best role label.
- brand_colors = the ad's actual brand palette (the dominant non-white, non-black colors used in the design).
- Be literal. Do not invent text that is not in the ad. If the same text appears more than once, you may return it once.`;

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

// Normalize a text value for dedupe comparison.
function normKey(role, value) {
  const v = String(value || '').toLowerCase().trim();
  if (role === 'phone') return 'phone:' + v.replace(/\D/g, '');      // digits only
  if (role === 'web')   return 'web:' + v.replace(/[^a-z0-9.]/g, ''); // strip case/punct
  return role + ':' + v.replace(/[^a-z0-9]/g, '');                    // generic
}

const FINEPRINT_ROLES = new Set(['license', 'promo_code', 'address', 'other']);

function cleanParts(parsed) {
  const out = {
    business_name: typeof parsed.business_name === 'string' ? parsed.business_name : '',
    texts: [],
    images: [],
    brand_colors: Array.isArray(parsed.brand_colors) ? parsed.brand_colors.slice(0, 4) : []
  };

  // DEDUPE texts (keep first occurrence; longer value wins on collision)
  const seen = new Map();
  (Array.isArray(parsed.texts) ? parsed.texts : []).forEach(t => {
    if (!t || !t.value) return;
    const role = t.role || 'other';
    const key = normKey(role, t.value);
    const entry = { role, value: String(t.value).trim() };
    if (FINEPRINT_ROLES.has(role)) entry.verify = true; // cue UI: small text, confirm
    const prev = seen.get(key);
    if (!prev) seen.set(key, entry);
    else if (entry.value.length > prev.value.length) seen.set(key, entry); // prefer fuller form
  });
  out.texts = Array.from(seen.values());

  // Clamp bboxes to [0,1] so a loose box never breaks the browser crop.
  (Array.isArray(parsed.images) ? parsed.images : []).forEach(im => {
    if (!im || !Array.isArray(im.bbox) || im.bbox.length !== 4) return;
    const clamp = n => Math.max(0, Math.min(1, Number(n) || 0));
    let [x, y, w, h] = im.bbox.map(clamp);
    if (x + w > 1) w = 1 - x;
    if (y + h > 1) h = 1 - y;
    out.images.push({ label: im.label || im.kind || 'image', kind: im.kind || 'other', bbox: [x, y, w, h] });
  });

  return out;
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

    let body;
    try { body = await request.json(); }
    catch (e) { return json({ ok: false, error: 'Body must be JSON' }, 400, origin); }

    const img = body && body.image;
    if (!img || !img.data || !img.media_type) {
      return json({ ok: false, error: 'Missing image { media_type, data }' }, 400, origin);
    }

    let claudeRes, claudeText;
    try {
      claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } },
              { type: 'text', text: EXTRACT_PROMPT }
            ]
          }]
        })
      });
      claudeText = await claudeRes.text();
    } catch (e) {
      return json({ ok: false, error: 'Upstream call failed: ' + (e.message || e) }, 502, origin);
    }

    if (!claudeRes.ok) {
      return json({ ok: false, error: 'Anthropic ' + claudeRes.status, detail: claudeText.slice(0, 400) }, 502, origin);
    }

    let data, raw;
    try {
      data = JSON.parse(claudeText);
      raw = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    } catch (e) {
      return json({ ok: false, error: 'Could not parse Anthropic response' }, 502, origin);
    }

    // Strip any stray markdown fences, then parse the model's JSON.
    const cleaned = raw.replace(/^```json\s*|^```\s*|\s*```$/g, '').trim();
    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch (e) {
      return json({ ok: false, error: 'Model did not return clean JSON', raw: raw.slice(0, 500) }, 422, origin);
    }

    const rawCount = Array.isArray(parsed.texts) ? parsed.texts.length : 0;
    const parts = cleanParts(parsed);

    return json({
      ok: true,
      parts,
      diagnostics: {
        raw_text_count: rawCount,
        deduped_text_count: parts.texts.length,
        image_count: parts.images.length,
        model: ANTHROPIC_MODEL
      }
    }, 200, origin);
  }
};
