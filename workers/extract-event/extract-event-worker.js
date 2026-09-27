/* ============================================================
   extract-event-worker.js
   INBXIFY — Cloudflare Worker: POST /extract-event

   Purpose: the Create Event ASF posts { url }. This worker fetches
   the page server-side (no browser CORS limit), pulls the highest-
   fidelity signal it can (JSON-LD schema.org/Event → OpenGraph meta
   → cleaned body text), hands it to Claude for structured extraction,
   and returns event fields the ASF drops straight into the form.

   Deploy:
     • wrangler deploy (module worker)
     • Secret:  wrangler secret put ANTHROPIC_API_KEY
     • Then set TA_CONFIG.makeExtractEvent = this worker's URL.

   Response shape:
     { ok:true, source:'json-ld'|'og+text'|'text',
       fields:{ eventName, eventDescription, eventLocation,
                eventVenueRoom, eventVenueStreetAddress, eventVenueCity,
                eventVenueState, eventVenueZip,
                eventStartDate, eventStartTime,
                eventEndDate, eventEndTime, eventRedirectLink },
       imageUrl:'' }
   Dates are YYYY-MM-DD, times HH:mm (24h), normalized to America/New_York.
   ============================================================ */

const MODEL = 'claude-haiku-4-5-20251001';
const ALLOW_ORIGINS = ['*']; // tighten to your Webflow origin(s) if desired

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '*';
    const allow = ALLOW_ORIGINS.includes('*') ? (origin || '*')
                : (ALLOW_ORIGINS.includes(origin) ? origin : ALLOW_ORIGINS[0]);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(allow) });
    if (request.method !== 'POST')    return json({ ok:false, error:'POST only' }, 405, allow);

    let body;
    try { body = await request.json(); } catch { return json({ ok:false, error:'Invalid JSON body' }, 400, allow); }
    const url = (body && body.url ? String(body.url) : '').trim();
    if (!url) return json({ ok:false, error:'Missing url' }, 400, allow);

    // ---- SSRF guard ----
    let u;
    try { u = new URL(url); } catch { return json({ ok:false, error:'Invalid URL' }, 400, allow); }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return json({ ok:false, error:'URL must be http(s)' }, 400, allow);
    if (isBlockedHost(u.hostname)) return json({ ok:false, error:'Host not allowed' }, 400, allow);

    // ---- fetch the page ----
    let html;
    try {
      const res = await fetch(u.toString(), {
        headers: { 'User-Agent': 'INBXIFY-EventExtractor/1.0 (+https://inbxify.com)', 'Accept': 'text/html,*/*' },
        redirect: 'follow'
      });
      if (!res.ok) return json({ ok:false, error:'Page returned HTTP ' + res.status }, 502, allow);
      html = await res.text();
    } catch { return json({ ok:false, error:'Could not fetch the page' }, 502, allow); }

    // ---- extract signals ----
    const jsonld = extractJsonLdEvent(html);
    const og     = extractMeta(html);
    const text   = htmlToText(html).slice(0, 6000);
    const images = collectImages(html, jsonld, og, u);

    // ---- Claude structured extraction ----
    const key = env.ANTHROPIC_API_KEY;
    if (!key) return json({ ok:false, error:'ANTHROPIC_API_KEY not configured' }, 500, allow);

    let fields;
    try { fields = await callClaude(key, { jsonld, og, text }); }
    catch (e) { return json({ ok:false, error:'Extraction model error: ' + (e && e.message ? e.message : 'unknown') }, 502, allow); }

    // v1.2 — always force the operator-pasted URL as the redirect link.
    // Claude sometimes parses a different on-page URL (tickets/sub-page);
    // the URL you pasted is the canonical event page, period.
    fields.eventRedirectLink = u.toString();

    return json({
      ok: true,
      source: jsonld ? 'json-ld' : (og.title ? 'og+text' : 'text'),
      fields,
      images,                 // v1.1 — ALL candidate images, ordered best-guess first
      imageUrl: images[0] || ''   // back-compat: first/best guess
    }, 200, allow);
  }
};

/* ---------------- helpers ---------------- */

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}
function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, cors(origin))
  });
}

function isBlockedHost(host) {
  host = (host || '').toLowerCase();
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return true;
  // literal IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const p = host.split('.').map(Number);
    if (p[0] === 10) return true;
    if (p[0] === 127) return true;
    if (p[0] === 0) return true;
    if (p[0] === 169 && p[1] === 254) return true;          // link-local / cloud metadata
    if (p[0] === 192 && p[1] === 168) return true;
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
  }
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd')) return true; // IPv6 loopback / ULA
  return false;
}

function extractJsonLdEvent(html) {
  const blocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of blocks) {
    const inner = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
    let data;
    try { data = JSON.parse(inner); } catch { continue; }
    const candidates = [];
    const push = (x) => { if (x && typeof x === 'object') candidates.push(x); };
    if (Array.isArray(data)) data.forEach(push);
    else { push(data); if (Array.isArray(data['@graph'])) data['@graph'].forEach(push); }
    for (const c of candidates) {
      const t = c['@type'];
      const types = Array.isArray(t) ? t : [t];
      if (types.some(x => typeof x === 'string' && /event/i.test(x))) return c;
    }
  }
  return null;
}

function extractMeta(html) {
  const meta = (prop) => {
    const re = new RegExp('<meta[^>]+(?:property|name)=["\']' + prop + '["\'][^>]+content=["\']([^"\']*)["\']', 'i');
    const m = html.match(re); if (m) return decodeEntities(m[1]);
    const re2 = new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]+(?:property|name)=["\']' + prop + '["\']', 'i');
    const m2 = html.match(re2); return m2 ? decodeEntities(m2[1]) : '';
  };
  const titleTag = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
  return {
    title:       meta('og:title') || decodeEntities(titleTag).trim(),
    description: meta('og:description') || meta('description'),
    image:       meta('og:image') || meta('twitter:image')
  };
}

function collectImages(html, jsonld, og, baseUrl) {
  // v1.1 — return EVERY candidate image, not just the first. The event
  // photo is often NOT the JSON-LD/OG image (those skew to logos), so we
  // gather priority sources first, then every <img> on the page, dedupe,
  // resolve to absolute, and let the operator pick in the form.
  const out = [];
  const seen = new Set();
  const add = (raw) => {
    if (!raw || typeof raw !== 'string') return;
    raw = raw.trim();
    if (!raw || /^data:/i.test(raw)) return;          // skip inline data URIs
    let abs;
    try { abs = new URL(raw, baseUrl).toString(); } catch { return; }
    if (seen.has(abs)) return;
    seen.add(abs);
    out.push(abs);
  };

  // priority: JSON-LD Event image(s)
  if (jsonld && jsonld.image) {
    const i = jsonld.image;
    if (typeof i === 'string') add(i);
    else if (Array.isArray(i)) i.forEach(x => add(typeof x === 'string' ? x : (x && x.url)));
    else if (i.url) add(i.url);
  }
  // then OG / twitter image
  add(og.image);
  // then <link rel="image_src">
  const linkSrc = (html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i) || [])[1];
  add(linkSrc);

  // then every <img> on the page: src, common lazy attrs, first srcset entry
  const tags = html.match(/<img\b[^>]*>/gi) || [];
  for (const tag of tags) {
    add((tag.match(/\bsrc=["']([^"']+)["']/i) || [])[1]);
    add((tag.match(/\bdata-src=["']([^"']+)["']/i) || [])[1]);
    add((tag.match(/\bdata-lazy-src=["']([^"']+)["']/i) || [])[1]);
    const ss = (tag.match(/\bsrcset=["']([^"']+)["']/i) || [])[1];
    if (ss) add(ss.split(',')[0].trim().split(/\s+/)[0]);
    if (out.length >= 24) break;
  }
  return out.slice(0, 16);
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ');
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/gi, "'");
}

async function callClaude(key, signals) {
  const system =
    'You extract structured event data from a web page for a local community newsletter. ' +
    'Output ONLY a JSON object — no prose, no markdown, no code fences. Keys (all required, use "" when unknown): ' +
    'eventName, eventDescription, eventLocation, eventVenueRoom, eventVenueStreetAddress, ' +
    'eventVenueCity, eventVenueState, eventVenueZip, eventStartDate, eventStartTime, ' +
    'eventEndDate, eventEndTime, eventRedirectLink. Rules: ' +
    'eventLocation = venue NAME only (e.g. "Memorial Hall"). ' +
    'eventVenueRoom = room/suite within the venue if specified (e.g. "Banquet Room A"); else "". ' +
    'eventVenueStreetAddress = street line only (e.g. "12 Main St"); no city/state/zip. ' +
    'eventVenueCity = city name only. ' +
    'eventVenueState = 2-letter US state abbreviation (e.g. "NJ"); else "". ' +
    'eventVenueZip = 5-digit US ZIP code; else "". ' +
    'Split US-style addresses cleanly into the parts above; if a part is not present, use "". ' +
    'eventStartDate / eventEndDate = YYYY-MM-DD. eventStartTime / eventEndTime = HH:mm 24-hour. ' +
    'Interpret ALL dates and times as America/New_York wall-clock; do not convert to UTC. ' +
    'eventDescription = 1-3 plain-text sentences. ' +
    'Prefer the JSON-LD Event object when present; fall back to the meta/text.';

  const user =
    'JSON-LD Event (may be null):\n' + JSON.stringify(signals.jsonld) + '\n\n' +
    'OpenGraph/meta:\n' + JSON.stringify(signals.og) + '\n\n' +
    'Page text (truncated):\n' + signals.text;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: system,
      messages: [{ role: 'user', content: user }]
    })
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const txt = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  const clean = txt.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  let parsed;
  try { parsed = JSON.parse(clean); } catch { throw new Error('model did not return valid JSON'); }

  const keys = ['eventName','eventDescription','eventLocation',
                'eventVenueRoom','eventVenueStreetAddress','eventVenueCity',
                'eventVenueState','eventVenueZip',
                'eventStartDate','eventStartTime','eventEndDate','eventEndTime',
                'eventRedirectLink'];
  const out = {};
  keys.forEach(k => { out[k] = (parsed[k] == null) ? '' : String(parsed[k]); });
  return out;
}
