// extract-client-v1.3.0.js
/* ============================================================
   extract-client-worker.js  (v1.3)
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

   ── v1.3.0 changes (SS-Fork B · Creative S5, 6 Nov 2026) ──
   1. BRAND FONTS. POST /brand-colours now also answers
        fonts: { heading: { family, weight } | null,
                 body:    { family, weight } | null,
                 seen: ['Roboto', …],        families on the site NOT on the list
                 evidence: 'one plain sentence' }
      Read deterministically from the website (no model call): the
      Google Fonts <link> families and their weights, then the CSS rules
      for h1/h2/h3 (heading) and body/p/html (body). A font is kept ONLY
      when it is on the platform font list (FONT_LIST below, the list
      that was HC-ARF-FONTS-01 in ta-adreformat v0.6.0; it moves here
      because the Worker is the one place that decides what is saved).
      A family not on the list, or none found, answers null and names
      the family in `seen`, so the Add Client form can say why.
      Weight: the rule's font-weight, else the heaviest weight the
      Google Fonts link declares for that family (heading) or 400 (body),
      else 700 / 400. Add Client (client-manager v1.4.11) saves the pair
      to CUSTOMERS Brand Font Heading / Brand Font Body as
      "<Family> <weight>", e.g. "Playfair Display 700".
   2. GET /health answers { ok, version, models }, like ix-adreformat.
   Nothing else changes: the colour answer and the website read are as
   v1.2.0.
   HARDCODED (provisional ids, S5 HC delta):
     HC-ARF-FONTS-01  FONT_LIST moves here from ta-adreformat v0.6.0
                      (mirrors the Webflow project fonts; update when
                      the project's fonts change).
     HC-P-SSB5-2      HEAD_SEL / BODY_SEL: which CSS selectors count as
                      heading and body rules. Platform rule.
     HC-P-SSB5-3      default weights 700 (heading) / 400 (body).

   ── v1.2.0 changes (SS-Fork B · Creative S2, 5 Nov 2026) ──
   1. NEW ROUTE  POST /brand-colours  { url, logoUrl?, name? }
      Reads the customer's website and logo and recommends two brand
      colours for the Ad Maker layouts:
        main   = the colour the brand panels are painted in
        accent = the button colour
      Signals, strongest first: logo colours (Claude vision on the
      logo image), CSS custom properties named brand/primary/accent,
      colours on buttons / header / nav, meta theme-color, then the
      most-used non-neutral colours across inline and linked CSS.
      Returns
        { ok:true, found:true,  main:'#346667', accent:'#F0E095', evidence:'…' }
        { ok:true, found:false, evidence:'why not' }
      Claude may only choose colours that appear in the candidate list
      or are plainly visible in the logo; it never invents one.
      found:false whenever the site gives no clear brand colour, so
      Jeff is asked (ruling 5 Nov: he steps in only when none is found).
   2. MODEL FROM CONFIG (HC-P-SSB-4 pattern): env.EXTRACT_MODEL and
      env.BRAND_MODEL override the built-in defaults. No redeploy to
      change model.
   The original route (any other path) is unchanged.

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

const VERSION = '1.3.0';
const MODEL = 'claude-haiku-4-5-20251001';        // default; env.EXTRACT_MODEL overrides (v1.2.0)
const BRAND_MODEL = 'claude-sonnet-4-5';          // default; env.BRAND_MODEL overrides (v1.2.0)
const ALLOW_ORIGINS = ['*']; // tighten to your Webflow origin(s) if desired

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '*';
    const allow = ALLOW_ORIGINS.includes('*') ? (origin || '*')
                : (ALLOW_ORIGINS.includes(origin) ? origin : ALLOW_ORIGINS[0]);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(allow) });
    if (request.method === 'GET' && /\/health\/?$/.test(new URL(request.url).pathname)) {   // v1.3.0
      return json({ ok:true, version: VERSION, models: { extract: env.EXTRACT_MODEL || MODEL, brand: env.BRAND_MODEL || BRAND_MODEL } }, 200, allow);
    }
    if (request.method !== 'POST')    return json({ ok:false, error:'POST only' }, 405, allow);

    let body;
    try { body = await request.json(); } catch { return json({ ok:false, error:'Invalid JSON body' }, 400, allow); }

    // v1.2.0 — brand colour route
    if (/\/brand-colou?rs\/?$/.test(new URL(request.url).pathname)) return brandColours(body, env, allow);
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
    try { fields = await callClaude(key, { jsonld, og, text, categories }, env.EXTRACT_MODEL || MODEL); }
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

async function callClaude(key, signals, model) {
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
      model: model || MODEL,
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


/* =================================================================
   v1.2.0 — BRAND COLOURS
   ================================================================= */

const UA = 'INBXIFY-ClientExtractor/1.2 (+https://inbxify.com)';
const CSS_MAX_FILES = 4;          // linked stylesheets read per site
const CSS_MAX_BYTES = 400000;     // per stylesheet
const TOP_CANDIDATES = 24;        // colours handed to the model

async function brandColours(body, env, allow) {
  const url = String((body && body.url) || '').trim();
  const logoUrl = String((body && body.logoUrl) || '').trim();
  const name = String((body && body.name) || '').trim();
  let fonts = emptyFonts('No website to read fonts from.');   // v1.3.0
  const notFound = (why) => json({ ok:true, found:false, main:'', accent:'', evidence: why, fonts }, 200, allow);

  const key = env.ANTHROPIC_API_KEY;
  if (!key) return json({ ok:false, error:'ANTHROPIC_API_KEY not configured' }, 500, allow);

  // ---- website ----
  let html = '', base = null, siteNote = '';
  if (url) {
    let u = null;
    try { u = new URL(/^https?:\/\//i.test(url) ? url : 'https://' + url); } catch { u = null; }
    if (u && (u.protocol === 'http:' || u.protocol === 'https:') && !isBlockedHost(u.hostname)) {
      try {
        const res = await fetch(u.toString(), { headers: { 'User-Agent': UA, 'Accept': 'text/html,*/*' }, redirect: 'follow' });
        if (res.ok) { html = await res.text(); base = new URL(res.url || u.toString()); }
        else siteNote = 'Website returned HTTP ' + res.status + '.';
      } catch { siteNote = 'Website could not be reached.'; }
    } else siteNote = 'Website address is not usable.';
  } else siteNote = 'No website on the customer.';

  // ---- colour candidates from the site ----
  let cands = [], theme = '';
  if (html) {
    const css = [];
    (html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).forEach(b => css.push(b.replace(/<\/?style[^>]*>/gi, '')));
    const inline = (html.match(/style=["'][^"']*["']/gi) || []).join(';');
    const links = [];
    (html.match(/<link[^>]+>/gi) || []).forEach(tag => {
      if (!/rel=["'][^"']*stylesheet/i.test(tag)) return;
      const m = tag.match(/href=["']([^"']+)["']/i); if (!m) return;
      try { const h = new URL(decodeEntities(m[1]), base); if (!isBlockedHost(h.hostname)) links.push(h.toString()); } catch {}
    });
    // site's own stylesheets first, framework CDNs last
    links.sort((a, b) => cdnScore(a) - cdnScore(b));
    for (const href of links.slice(0, CSS_MAX_FILES)) {
      try {
        const r = await fetch(href, { headers: { 'User-Agent': UA, 'Accept': 'text/css,*/*' } });
        if (r.ok) css.push((await r.text()).slice(0, CSS_MAX_BYTES));
      } catch {}
    }
    const tm = html.match(/<meta[^>]+name=["'](?:theme-color|msapplication-TileColor)["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["'](?:theme-color|msapplication-TileColor)["']/i);
    theme = tm ? normHex(tm[1]) : '';
    cands = scoreColours(css.join('\n'), inline, theme);
    fonts = siteFonts(html, css.join('\n'));   // v1.3.0
  }

  // ---- logo ----
  let logo = logoUrl;
  if (!logo && html) {
    const jl = extractJsonLdOrg(html);
    const lg = jl && jl.logo ? (typeof jl.logo === 'string' ? jl.logo : (jl.logo.url || '')) : '';
    if (lg) { try { logo = new URL(lg, base).toString(); } catch {} }
  }
  if (logo && /\.svg(\?|$)/i.test(logo)) logo = '';   // vision cannot read SVG

  if (!cands.length && !logo) return notFound((siteNote ? siteNote + ' ' : '') + 'No colours to read and no logo image.');

  // ---- model ----
  const model = env.BRAND_MODEL || BRAND_MODEL;
  let out;
  try { out = await askBrandModel(key, model, { name, cands, theme, siteNote, logo }); }
  catch (e) {
    if (logo) { try { out = await askBrandModel(key, model, { name, cands, theme, siteNote, logo: '' }); } catch (e2) { out = null; } }
    if (!out) return json({ ok:false, error:'Brand colour model error: ' + (e && e.message ? e.message : 'unknown') }, 502, allow);
  }

  const main = normHex(out.main), accent = normHex(out.accent);
  const evidence = String(out.evidence || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (!out.found || !main) return notFound(evidence || 'No clear brand colour on the website or logo.');
  return json({ ok:true, found:true, main, accent: accent || '', evidence, fonts }, 200, allow);
}

// ── v1.3.0 — brand fonts, read from the site without a model ──────────────
// HC-ARF-FONTS-01: the platform font list (the Webflow project's loaded
// Google fonts plus installed custom fonts). Only these can be saved.
const FONT_LIST = [
  'Abril Fatface', 'Bebas Neue', 'Bevan', 'Castoro', 'CastoroTitling',
  'DM Mono', 'DM Sans', 'DM Serif Display', 'DM Serif Text', 'EB Garamond',
  'Francois One', 'Fraunces', 'Graduate', 'Hammersmith One',
  'Instrument Sans', 'Instrument Serif', 'Inter', 'Kaushan Script',
  'Libre Baskerville', 'Libre Caslon Display', 'Libre Caslon Text',
  'Manrope', 'Montecarlo', 'Neuemontreal', 'Nunito', 'Oxford Laqy',
  'Parisienne', 'Playfair Display', 'Playfair Display SC', 'Poppins',
  'Roboto Serif', 'Rosarivo', 'Sedgwick Ave', 'SF Pro Display',
  'Spectral', 'Spectral SC', 'Tenor Sans', 'Work Sans'
];
const FONT_KEY = new Map(FONT_LIST.map(f => [f.toLowerCase().replace(/\s+/g, ''), f]));
const HEAD_SEL = /(^|[\s,>+~])(h1|h2|h3|\.h1|\.h2|\.h3|\.heading[\w-]*|\.title[\w-]*|\.display[\w-]*)(\b|[\s,.:>#[{])/i;   // HC-P-SSB5-2
const BODY_SEL = /(^|[\s,>+~])(html|body|p|\.body[\w-]*|\.paragraph[\w-]*|\.text[\w-]*)(\b|[\s,.:>#[{])/i;
const HEAD_WEIGHT_DEFAULT = 700, BODY_WEIGHT_DEFAULT = 400;                   // HC-P-SSB5-3
const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'inherit', 'initial', 'unset']);

function emptyFonts(why) { return { heading: null, body: null, seen: [], evidence: why }; }
function listedFont(fam) { return FONT_KEY.get(String(fam || '').toLowerCase().replace(/\s+/g, '')) || null; }
function familiesOf(decl) {
  return String(decl || '').split(',').map(f => f.trim().replace(/^["']|["']$/g, '').replace(/\s*!important/i, '').trim())
    .filter(f => f && !GENERIC.has(f.toLowerCase()) && !/^var\(/i.test(f));
}
function weightOf(v) {
  const t = String(v || '').trim().toLowerCase();
  if (!t) return 0;
  if (t === 'bold') return 700; if (t === 'normal') return 400; if (t === 'bolder') return 800; if (t === 'lighter') return 300;
  const n = parseInt(t, 10); return (n >= 100 && n <= 900) ? n : 0;
}
// Google Fonts links: family=Playfair+Display:wght@400;700&family=DM+Sans:ital,wght@0,400;0,700
function googleFonts(html) {
  const out = new Map();   // family -> Set(weights)
  (html.match(/fonts\.googleapis\.com\/css2?\?[^"'\s>]+/gi) || []).forEach(u => {
    const q = decodeEntities(u).replace(/\+/g, ' ');
    (q.match(/family=([^&]+)/gi) || []).forEach(part => {
      const spec = decodeURIComponent(part.slice(7));
      const [fam, axes] = spec.split(':');
      const ws = new Set();
      (String(axes || '').match(/\d{3}/g) || []).forEach(w => ws.add(+w));
      const key = fam.trim();
      if (!out.has(key)) out.set(key, new Set());
      ws.forEach(w => out.get(key).add(w));
    });
  });
  return out;
}
// Rules in the CSS: { selector, family: decl, weight }
function cssRules(css) {
  const rules = [];
  const clean = String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /([^{}]+)\{([^{}]*)\}/g; let m;
  while ((m = re.exec(clean))) {
    const sel = m[1].trim(), body = m[2];
    if (/^@/.test(sel)) continue;
    const ff = /font-family\s*:\s*([^;]+)/i.exec(body);
    const fw = /font-weight\s*:\s*([^;]+)/i.exec(body);
    const fs = /\bfont\s*:\s*([^;]+)/i.exec(body);   // shorthand: weight … family
    let family = ff ? ff[1] : '';
    let weight = fw ? weightOf(fw[1]) : 0;
    if (!family && fs) { const parts = fs[1].split('/').pop().split(/\s+(?=[^,]*$)/); family = parts[parts.length - 1]; if (!weight) { const w = fs[1].match(/\b(bold|[1-9]00)\b/i); if (w) weight = weightOf(w[1]); } }
    if (family) rules.push({ sel, families: familiesOf(family), weight });
  }
  return rules;
}
function siteFonts(html, css) {
  const g = googleFonts(html), rules = cssRules(css + '\n' + ((html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).join('\n')));
  const seen = new Set();
  // A rule that names a font NOT on the list answers null for that slot (the
  // site chose a font the platform cannot draw); only a site whose CSS says
  // nothing falls back to the Google Fonts link.
  const pick = (selRx, defWeight, heaviest) => {
    let saidSomething = false;
    for (const r of rules) {
      if (!selRx.test(r.sel)) continue;
      if (r.families.length) saidSomething = true;
      for (const fam of r.families) {
        const listed = listedFont(fam);
        if (!listed) { seen.add(fam); continue; }
        let weight = r.weight;
        if (!weight && heaviest && g.has(fam)) { const ws = [...g.get(fam)].filter(w => w >= 600); if (ws.length) weight = Math.max(...ws); }
        if (!weight && g.has(fam) && g.get(fam).size) { const ws = [...g.get(fam)]; weight = heaviest ? Math.max(...ws) : (ws.includes(400) ? 400 : Math.min(...ws)); }
        return { family: listed, weight: weight || defWeight, from: 'css' };
      }
    }
    return saidSomething ? { miss: true } : null;
  };
  let heading = pick(HEAD_SEL, HEAD_WEIGHT_DEFAULT, true);
  let body = pick(BODY_SEL, BODY_WEIGHT_DEFAULT, false);
  // Fall back to the Google Fonts link alone when the CSS names no listed font.
  const gl = [...g.keys()].map(f => ({ raw: f, listed: listedFont(f) }));
  gl.forEach(x => { if (!x.listed) seen.add(x.raw); });
  const listedG = gl.filter(x => x.listed);
  if (body && body.miss) body = null; else if (!body && listedG.length) { const x = listedG[0]; body = { family: x.listed, weight: 400, from: 'link' }; }
  if (heading && heading.miss) heading = null; else if (!heading && listedG.length) {
    const other = listedG.find(x => !body || x.listed !== body.family) || listedG[0];
    const ws = [...g.get(other.raw)].filter(w => w >= 600);
    heading = { family: other.listed, weight: ws.length ? Math.max(...ws) : HEAD_WEIGHT_DEFAULT, from: 'link' };
  }
  const say = f => f ? f.family + ' ' + f.weight + (f.from === 'link' ? ' (from the font link)' : '') : 'none on the platform list';
  const evidence = ('Heading ' + say(heading) + '; body ' + say(body) + (seen.size ? '; not on the list: ' + [...seen].slice(0, 6).join(', ') : '') + '.').slice(0, 300);
  return { heading: heading ? { family: heading.family, weight: heading.weight } : null,
           body: body ? { family: body.family, weight: body.weight } : null,
           seen: [...seen].slice(0, 12), evidence };
}

function cdnScore(href) {
  return /(googleapis|gstatic|bootstrapcdn|jsdelivr|cdnjs|unpkg|fontawesome|wp-includes|elementor\/assets|squarespace-cdn\.com\/universal|parastorage)/i.test(href) ? 1 : 0;
}

function normHex(v) {
  v = String(v || '').trim();
  let m = v.match(/^#?([0-9a-f]{6})$/i);
  if (m) return '#' + m[1].toUpperCase();
  m = v.match(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (m) return ('#' + m[1] + m[1] + m[2] + m[2] + m[3] + m[3]).toUpperCase();
  m = v.match(/^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i);
  if (m) return '#' + [m[1], m[2], m[3]].map(n => Math.max(0, Math.min(255, +n)).toString(16).padStart(2, '0')).join('').toUpperCase();
  return '';
}
function hsl(hex) {
  const r = parseInt(hex.substr(1, 2), 16) / 255, g = parseInt(hex.substr(3, 2), 16) / 255, b = parseInt(hex.substr(5, 2), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s, l };
}
function isNeutral(hex) { const { s, l } = hsl(hex); return s < 0.12 || l > 0.94 || l < 0.06; }

// Counts every colour in the CSS, with where it was used. Neutrals
// (greys, near-white, near-black) are dropped: they are never a brand.
function scoreColours(css, inline, theme) {
  const map = {};
  const add = (hex, ctx, w) => {
    if (!hex || isNeutral(hex)) return;
    const c = map[hex] || (map[hex] = { hex, uses: 0, score: 0, where: {} });
    c.uses++; c.score += w; if (ctx) c.where[ctx] = (c.where[ctx] || 0) + 1;
  };
  const colourRe = /#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgba?\([^)]*\)/gi;
  // custom properties
  (css.match(/--[\w-]+\s*:\s*[^;}{]+/g) || []).forEach(decl => {
    const nm = decl.split(':')[0].toLowerCase();
    const brandish = /(brand|primary|accent|secondary|main|theme|color-?1|color_?1[0-9]?)/.test(nm);
    (decl.match(colourRe) || []).forEach(c => add(normHex(c), brandish ? 'brand variable ' + nm.trim() : '', brandish ? 6 : 1));
  });
  // rules: selector-aware
  const ruleRe = /([^{}@]+)\{([^{}]*)\}/g; let m, n = 0;
  while ((m = ruleRe.exec(css)) && n < 20000) {
    n++;
    const sel = m[1].toLowerCase(), body = m[2];
    const ctx = /(btn|button|cta|wp-block-button)/.test(sel) ? 'buttons'
              : /(header|nav|menu|topbar|masthead)/.test(sel) ? 'header'
              : /(^|[\s,])a([\s:,.]|$)|link/.test(sel) ? 'links'
              : /(h1|h2|h3|heading|title)/.test(sel) ? 'headings'
              : /footer/.test(sel) ? 'footer' : '';
    const w = ctx === 'buttons' ? 5 : ctx === 'header' ? 4 : ctx === 'headings' ? 3 : ctx === 'links' ? 2 : 1;
    (body.match(/(?:^|;)\s*(?:background(?:-color)?|color|border(?:-color)?|fill)\s*:[^;]+/gi) || []).forEach(d => {
      (d.match(colourRe) || []).forEach(c => add(normHex(c), ctx, w));
    });
  }
  (inline.match(colourRe) || []).forEach(c => add(normHex(c), 'inline styles', 1));
  if (theme) add(theme, 'theme-color meta', 6);
  return Object.values(map).sort((a, b) => b.score - a.score).slice(0, TOP_CANDIDATES)
    .map(c => ({ hex: c.hex, uses: c.uses, where: Object.keys(c.where).sort((a, b) => c.where[b] - c.where[a]).slice(0, 3) }));
}

async function askBrandModel(key, model, sig) {
  const system =
    'You choose two brand colours for a small local business, for newsletter ads. ' +
    'MAIN is painted as a large panel behind white or dark text, so it should be the strongest, most recognisable brand colour (usually from the logo or the site header/buttons). ' +
    'ACCENT is a button colour that stands out against MAIN (often a lighter or contrasting brand colour). ' +
    'Rules: choose only colours that appear in the CANDIDATES list or are plainly visible in the LOGO image. Never invent a colour. ' +
    'Ignore colours that look like a website template or plugin default rather than the brand (for example a stock link blue used once). ' +
    'If there is no clear brand colour, return found:false. If there is a clear MAIN but no sensible ACCENT, return accent as "". ' +
    'EVIDENCE: one plain sentence, under 200 characters, saying where each colour came from (for example "Logo teal #346667 also on header and buttons (14 uses); accent #F0E095 on the call-to-action button"). ' +
    'Reply with JSON only: {"found":true|false,"main":"#RRGGBB","accent":"#RRGGBB","evidence":"..."}';
  const text =
    'Business: ' + (sig.name || '(unknown)') + '\n' +
    (sig.siteNote ? 'Website note: ' + sig.siteNote + '\n' : '') +
    (sig.theme ? 'theme-color meta: ' + sig.theme + '\n' : '') +
    'CANDIDATES (non-neutral colours from the website CSS, strongest first; uses = times used; where = where used):\n' +
    JSON.stringify(sig.cands) + '\n' +
    (sig.logo ? 'The LOGO image is attached.' : 'No logo image is available.');
  const content = [];
  if (sig.logo) content.push({ type: 'image', source: { type: 'url', url: sig.logo } });
  content.push({ type: 'text', text });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 400, system, messages: [{ role: 'user', content }] })
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const txt = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  const clean = txt.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  const j = JSON.parse(clean.slice(clean.indexOf('{'), clean.lastIndexOf('}') + 1));
  // Guard: a chosen colour must be a candidate or come with a logo.
  const ok = (h) => !h || sig.logo || sig.cands.some(c => c.hex === normHex(h)) || normHex(h) === sig.theme;
  if (!ok(j.main)) return { found:false, evidence:'The suggested colour was not found on the website.' };
  if (!ok(j.accent)) j.accent = '';
  return j;
}
