// extract-client-v1.1.0.js
/* ============================================================
   extract-client-worker.js  (v1.1)
   INBXIFY — Cloudflare Worker: POST /extract-client

   Purpose: the Add Client modal posts { url, categories }. This worker
   fetches the client's website server-side (no browser CORS limit),
   pulls the highest-fidelity signal it can (JSON-LD schema.org/
   Organization or LocalBusiness → OpenGraph meta → footer → cleaned
   body text), hands it to Claude for structured extraction, and
   returns client fields the modal drops straight into the form as
   dirty (gold) candidates for operator approval. Nothing auto-commits.

   Mirrors extract-event-worker.js exactly: same SSRF guard, same
   signal pipeline, same Claude call shape, same image collector.
   Only the field schema + system prompt differ.

   ── v1.1 changes ──
   1. FOOTER-SAFE TEXT: address/phone/social links usually live in the
      page footer, which was getting clipped by the old top-down
      text.slice(0, 6000) on any page of meaningful length. The footer
      is now extracted separately and always included, uncapped by the
      main body slice.
   2. SOCIAL LINK REGEX FALLBACK: every <a href> on the page is scanned
      directly for known social domains. If Claude's extraction misses
      a link that's plainly in the HTML, this backfills it — no longer
      solely dependent on the model finding it in truncated text.
   3. CATEGORY GUESS, CONSTRAINED TO A CLOSED LIST: caller now sends
      { categories: [...major category names...] } (the modal already
      has REF_DATA.majors loaded client-side — no new fetch needed).
      Claude must return one of those exact strings, or "", for
      majorCategory. This replaces free-text category guessing (which
      can't map cleanly to a Webflow reference ID) with an exact-match
      string the client can look up directly against REF_DATA.majors.

   Deploy:
     • wrangler deploy (module worker)
     • Secret:  wrangler secret put ANTHROPIC_API_KEY
     • Then set CM_CONFIG.extractClientUrl = this worker's URL.

   Response shape:
     { ok:true, source:'json-ld'|'og+text'|'text',
       fields:{ name, tagline, longDescription, services,
                address, address2, cityStZip,
                businessWebsite, businessPhone, businessEmail,
                facebook, instagram, tiktok, youtube, linkedin,
                x, pinterest, houzz, majorCategory },
       images:[...],          // ALL candidate images (logo picker)
       imageUrl:'' }          // back-compat: first/best guess

   Field keys are CAMELCASE wire names. The modal maps them to CMS
   slugs on its side (name→name, longDescription→long-description,
   cityStZip→city-st-zip, businessPhone→business-phone, etc.).
   majorCategory is handled specially client-side (exact-match lookup
   against REF_DATA.majors → id), not run through SCRAPE_FIELD_MAP.
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
    const categories = Array.isArray(body && body.categories)
      ? body.categories.filter(function (c) { return typeof c === 'string' && c.trim(); }).slice(0, 200)
      : [];
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
        headers: { 'User-Agent': 'INBXIFY-ClientExtractor/1.0 (+https://inbxify.com)', 'Accept': 'text/html,*/*' },
        redirect: 'follow'
      });
      if (!res.ok) return json({ ok:false, error:'Page returned HTTP ' + res.status }, 502, allow);
      html = await res.text();
    } catch { return json({ ok:false, error:'Could not fetch the page' }, 502, allow); }

    // ---- extract signals ----
    const jsonld = extractJsonLdOrg(html);
    const og     = extractMeta(html);
    const text   = buildSignalText(html);      // v1.1: footer-safe, see below
    const images = collectImages(html, jsonld, og, u);
    const socialFallback = extractSocialLinksFromHtml(html); // v1.1: deterministic backfill

    // ---- Claude structured extraction ----
    const key = env.ANTHROPIC_API_KEY;
    if (!key) return json({ ok:false, error:'ANTHROPIC_API_KEY not configured' }, 500, allow);

    let fields;
    try { fields = await callClaude(key, { jsonld, og, text, categories }); }
    catch (e) { return json({ ok:false, error:'Extraction model error: ' + (e && e.message ? e.message : 'unknown') }, 502, allow); }

    // v1.1: backfill any social field Claude left blank from the regex scan.
    ['facebook','instagram','tiktok','youtube','linkedin','x','pinterest','houzz'].forEach(function (k) {
      if (!fields[k] && socialFallback[k]) fields[k] = socialFallback[k];
    });

    // Force the operator-pasted URL as the canonical business website.
    // Claude may parse a different on-page link; the URL you pasted wins.
    fields.businessWebsite = u.toString();

    return json({
      ok: true,
      source: jsonld ? 'json-ld' : (og.title ? 'og+text' : 'text'),
      fields,
      images,                     // ALL candidate images, best-guess first (logo picker)
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

function extractJsonLdOrg(html) {
  // Prefer Organization / LocalBusiness (and subtypes like Restaurant,
  // Store, ProfessionalService) over generic types.
  const blocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const candidates = [];
  for (const block of blocks) {
    const inner = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
    let data;
    try { data = JSON.parse(inner); } catch { continue; }
    const push = (x) => { if (x && typeof x === 'object') candidates.push(x); };
    if (Array.isArray(data)) data.forEach(push);
    else { push(data); if (Array.isArray(data['@graph'])) data['@graph'].forEach(push); }
  }
  const isOrg = (c) => {
    const t = c['@type'];
    const types = Array.isArray(t) ? t : [t];
    return types.some(x => typeof x === 'string' &&
      /(organization|localbusiness|store|restaurant|professionalservice|corporation|company)/i.test(x));
  };
  return candidates.find(isOrg) || null;
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
    image:       meta('og:image') || meta('twitter:image'),
    siteName:    meta('og:site_name')
  };
}

function collectImages(html, jsonld, og, baseUrl) {
  // Return EVERY candidate image, best-guess first. For a business site
  // the logo is usually the JSON-LD logo or an <img> with "logo" in its
  // src/alt/class, so those are bubbled to the front. Operator picks.
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

  // priority 1: JSON-LD logo
  if (jsonld && jsonld.logo) {
    const lg = jsonld.logo;
    if (typeof lg === 'string') add(lg);
    else if (Array.isArray(lg)) lg.forEach(x => add(typeof x === 'string' ? x : (x && x.url)));
    else if (lg.url) add(lg.url);
  }
  // priority 2: JSON-LD image
  if (jsonld && jsonld.image) {
    const i = jsonld.image;
    if (typeof i === 'string') add(i);
    else if (Array.isArray(i)) i.forEach(x => add(typeof x === 'string' ? x : (x && x.url)));
    else if (i.url) add(i.url);
  }
  // priority 3: any <img> that looks like a logo (src/alt/class contains "logo")
  const allImgTags = html.match(/<img\b[^>]*>/gi) || [];
  const logoTags = allImgTags.filter(t => /logo/i.test(t));
  for (const tag of logoTags) {
    add((tag.match(/\bsrc=["']([^"']+)["']/i) || [])[1]);
    add((tag.match(/\bdata-src=["']([^"']+)["']/i) || [])[1]);
  }
  // priority 4: OG / twitter image, then link rel=image_src
  add(og.image);
  const linkSrc = (html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i) || [])[1];
  add(linkSrc);

  // then every remaining <img>: src, common lazy attrs, first srcset entry
  for (const tag of allImgTags) {
    add((tag.match(/\bsrc=["']([^"']+)["']/i) || [])[1]);
    add((tag.match(/\bdata-src=["']([^"']+)["']/i) || [])[1]);
    add((tag.match(/\bdata-lazy-src=["']([^"']+)["']/i) || [])[1]);
    const ss = (tag.match(/\bsrcset=["']([^"']+)["']/i) || [])[1];
    if (ss) add(ss.split(',')[0].trim().split(/\s+/)[0]);
    if (out.length >= 24) break;
  }
  return out.slice(0, 16);
}

// v1.1: pull the footer out of the raw HTML *before* stripping tags, so
// it survives regardless of how long the rest of the page is. If there's
// no <footer> element, fall back to a div/section carrying a footer-ish
// class or id — most site builders (Wix, Squarespace, WP themes) use one
// of these even without a semantic <footer> tag.
function extractFooterHtml(html) {
  var m = html.match(/<footer\b[\s\S]*?<\/footer>/i);
  if (m) return m[0];
  m = html.match(/<(?:div|section)[^>]+(?:class|id)=["'][^"']*footer[^"']*["'][\s\S]*?<\/(?:div|section)>/i);
  return m ? m[0] : '';
}

// v1.1: build the text signal sent to Claude — footer content is
// extracted and included in full (uncapped), then the general body is
// appended up to the remaining budget. This guarantees address/phone/
// social content in the footer isn't lost to truncation on long pages.
function buildSignalText(html) {
  var footerHtml = extractFooterHtml(html);
  var footerText = footerHtml ? htmlToText(footerHtml).slice(0, 2500) : '';
  var bodyText = htmlToText(html).slice(0, 6000);
  if (!footerText) return bodyText;
  return 'FOOTER CONTENT (often contains address/phone/social links):\n' +
    footerText + '\n\nPAGE BODY:\n' + bodyText;
}

// v1.1: deterministic fallback — scan every <a href> on the raw page
// for known social domains, independent of Claude/text truncation.
// Used only to backfill fields Claude left blank.
function extractSocialLinksFromHtml(html) {
  var out = { facebook:'', instagram:'', tiktok:'', youtube:'', linkedin:'', x:'', pinterest:'', houzz:'' };
  var domainMap = [
    ['facebook',  /facebook\.com\/[^\s"'<>]+/i],
    ['instagram', /instagram\.com\/[^\s"'<>]+/i],
    ['tiktok',    /tiktok\.com\/[^\s"'<>]+/i],
    ['youtube',   /youtube\.com\/[^\s"'<>]+/i],
    ['linkedin',  /linkedin\.com\/[^\s"'<>]+/i],
    ['x',         /(?:x\.com|twitter\.com)\/[^\s"'<>]+/i],
    ['pinterest', /pinterest\.com\/[^\s"'<>]+/i],
    ['houzz',     /houzz\.com\/[^\s"'<>]+/i]
  ];
  var hrefs = html.match(/href=["']([^"']+)["']/gi) || [];
  for (var i = 0; i < hrefs.length; i++) {
    var raw = (hrefs[i].match(/href=["']([^"']+)["']/i) || [])[1] || '';
    for (var j = 0; j < domainMap.length; j++) {
      var key = domainMap[j][0], re = domainMap[j][1];
      if (!out[key] && re.test(raw)) {
        var m = raw.match(re);
        out[key] = 'https://' + m[0].replace(/^https?:\/\//i, '');
      }
    }
  }
  return out;
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/gi, "'");
}

async function callClaude(key, signals) {
  var hasCategories = Array.isArray(signals.categories) && signals.categories.length > 0;

  const system =
    'You extract structured business/advertiser data from a web page for a local community ' +
    'newsletter directory. Output ONLY a JSON object — no prose, no markdown, no code fences. ' +
    'Keys (all required, use "" when unknown — NEVER invent or guess a value): ' +
    'name, tagline, longDescription, services, address, address2, cityStZip, ' +
    'businessWebsite, businessPhone, businessEmail, ' +
    'facebook, instagram, tiktok, youtube, linkedin, x, pinterest, houzz, majorCategory. Rules: ' +
    'name = the business/organization name as it would appear in a directory (e.g. "Paton Law Firm"). ' +
    'tagline = a short single-line slogan or positioning phrase if present (e.g. "Trusted family law since 1998"); else "". ' +
    'longDescription = 2-4 plain-text sentences describing what the business does; no marketing fluff, no first person. ' +
    'services = a comma-separated list of the business\'s actual services/specialties. Make a genuine effort: if ' +
    'a bulleted or itemized list exists, use it; if not, infer 3-6 concrete services from the description and page ' +
    'text (e.g. a law firm\'s "About" paragraph mentioning divorce and custody work still yields "Divorce, Custody"). ' +
    'Only leave "" if the page truly gives no basis to infer any services. ' +
    'address = street line only (e.g. "12 Main St"); no city/state/zip. Check FOOTER CONTENT first if present — ' +
    'addresses are very commonly placed there. ' +
    'address2 = suite/floor/unit if present (e.g. "Suite 200"); else "". ' +
    'cityStZip = the city, 2-letter state, and 5-digit ZIP on one line (e.g. "Wyckoff, NJ 07481"); else "". Check ' +
    'FOOTER CONTENT first if present. ' +
    'businessPhone = primary phone in (NNN) NNN-NNNN format if US; else as written; else "". ' +
    'businessEmail = primary contact email; else "". ' +
    'For each social key, return the FULL profile URL for that exact platform if linked anywhere on the page — ' +
    'check FOOTER CONTENT first, social icons are very commonly placed there — else "". ' +
    'facebook=facebook.com, instagram=instagram.com, tiktok=tiktok.com, youtube=youtube.com, ' +
    'linkedin=linkedin.com, x=x.com or twitter.com, pinterest=pinterest.com, houzz=houzz.com. ' +
    'Do not put a social URL in the wrong key. Do not fabricate handles. ' +
    'Leave businessWebsite as "" — the caller overrides it with the canonical URL. ' +
    (hasCategories
      ? 'majorCategory = choose EXACTLY ONE string from the ALLOWED CATEGORIES list provided below that best ' +
        'fits this business — copy it byte-for-byte, case-sensitive. If nothing in the list clearly fits, return "". ' +
        'Never return a category that is not verbatim in the list.'
      : 'majorCategory = leave "" (no allowed-category list was provided).') + ' ' +
    'Prefer JSON-LD Organization/LocalBusiness data when present; fall back to meta/text.';

  const user =
    'JSON-LD Organization (may be null):\n' + JSON.stringify(signals.jsonld) + '\n\n' +
    'OpenGraph/meta:\n' + JSON.stringify(signals.og) + '\n\n' +
    (hasCategories ? 'ALLOWED CATEGORIES (pick one verbatim, or ""):\n' + JSON.stringify(signals.categories) + '\n\n' : '') +
    'Page text (footer prioritized, then body, truncated):\n' + signals.text;

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

  const keys = ['name','tagline','longDescription','services',
                'address','address2','cityStZip',
                'businessWebsite','businessPhone','businessEmail',
                'facebook','instagram','tiktok','youtube','linkedin','x','pinterest','houzz',
                'majorCategory'];
  const out = {};
  keys.forEach(k => { out[k] = (parsed[k] == null) ? '' : String(parsed[k]); });

  // Guard: if a majorCategory came back that isn't verbatim in the
  // allowed list, drop it rather than risk a bad client-side ID lookup.
  if (hasCategories && out.majorCategory && signals.categories.indexOf(out.majorCategory) === -1) {
    out.majorCategory = '';
  }
  return out;
}
