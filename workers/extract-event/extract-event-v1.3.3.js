// extract-event-v1.3.3.js
/* ============================================================
   INBXIFY — Cloudflare Worker: POST /extract-event

   v1.3.3 (26 Oct 2026, November Build) — LISTING PAGES TOO.
     Jeff: the Real Estate form needs the same paste-a-URL fill as
     events. POST { url, kind:'listing', phases:[...] } reads one home's
     listing page. Same rules as events: the page's own words only,
     description checked word for word, icons and logos dropped from
     the images. kind omitted = event, exactly as before.
       • fields: propertyAddress, propertyPrice, bedrooms, bathrooms,
         sqFt, propertyMls, brokerage, propertyFeatures (the listing's
         description, paragraphs joined by a blank line, plain text),
         listingPhase (one of the caller's live Listing Phase labels, or
         ""), statusPrinted (the status words as the page shows them),
         propertyLink (the pasted URL).
       • The phase labels come from the caller (the title's live
         options); no word list lives here.
     Big portals (Zillow, Realtor.com) often refuse plain reads; the
     browser second read (CF secrets) is what gets past that.

   v1.3.2 (26 Oct 2026, November Build) — same as v1.3.1, renumbered so
     the deployed copy is unambiguous. v1.3.1 = the page's own words plus
     the image clean-up below.

   v1.3.1 (26 Oct 2026, November Build) — THE PAGE'S OWN WORDS.
     Jeff: the extractor must grab exactly what is on the page. v1.2/1.3
     asked the model for "1-3 plain-text sentences", so the description
     was a rewrite (the YMCA pickleball page came back paraphrased).
       • Every field is copied as the page writes it; nothing is
         summarised, shortened, reordered or reworded.
       • The description is the page's own description text, every
         sentence and detail line (fee, ages, what to bring) in page
         order. Headings that only repeat the name or date, button
         labels, navigation and the contact block are left out.
       • Checked after the model answers: each paragraph must appear in
         the page text (spacing, case and curly quotes aside). One that
         does not is dropped, and note says so.
       • Returned as HTML paragraphs (<p>…</p>) for the form's rich-text
         description field.
       • eventName: the page's own wording, title-case version when the
         page also shows it in capitals.
       • Images: icons, logos, social buttons, SVGs, tracking pixels and
         broken links are dropped, and the rest are ordered biggest file
         first, so the event photo usually leads (YMCA page: 10 → 1–3).
         Each candidate is checked with a quick HEAD request (4 s);
         one the server will not answer for is kept, ranked last.
     HARDCODING (provisional)
       HC-W-EE131-1  image skip words (icon, logo, social names, pixel…),
                     8 KB minimum file, 60 px minimum declared size,
                     4 s check timeout.
     Includes v1.3.0 (never deployed): the browser second read still
     needs CF_ACCOUNT_ID / CF_BROWSER_TOKEN and is skipped without them.

   Purpose: the Create Event ASF posts { url, tz? }. This worker reads
   the page, pulls the best signal it can (JSON-LD schema.org/Event →
   OpenGraph meta → cleaned body text), hands it to Claude for
   structured extraction, and returns event fields the ASF drops
   straight into the form.

   v1.3.0 (24 Oct 2026) — make thin pages work:
     • Second try in a real browser. When the plain read comes back
       thin (no JSON-LD Event and little text), or the model fills
       fewer than three of name / start date / venue / description,
       the page is read again through Cloudflare Browser Rendering
       (/content), which runs the page's JavaScript, and extracted
       again. At most one render per request.
     • Normal browser identity instead of "INBXIFY-EventExtractor".
     • Stronger model, set by env.EXTRACT_MODEL, default Sonnet.
     • Text budget 6,000 → 20,000 characters, and whitespace, nav,
       svg and footer are stripped first, so the budget holds words.
     • Time zone comes from the request's tz (the title's zone) when
       the ASF sends it; America/New_York only as the fallback.
     • Today's date goes to the model, so "Sat, Nov 21" with no year
       becomes the next Nov 21, not a guess.
     • Response adds rendered, filled and note.

   Deploy:
     • wrangler deploy (module worker)
     • Secrets: ANTHROPIC_API_KEY (existing)
                CF_ACCOUNT_ID, CF_BROWSER_TOKEN (new; an API token
                with "Browser Rendering - Edit")
     • Optional var: EXTRACT_MODEL
     Without the two new secrets the worker still runs, does no
     second try, and says so in note.

   Response shape:
     { ok:true, source:'json-ld'|'og+text'|'text', rendered:bool,
       filled:n, note:'',
       fields:{ eventName, eventDescription, eventLocation,
                eventVenueRoom, eventVenueStreetAddress, eventVenueCity,
                eventVenueState, eventVenueZip,
                eventStartDate, eventStartTime,
                eventEndDate, eventEndTime, eventRedirectLink },
       images:[], imageUrl:'' }
   Dates are YYYY-MM-DD, times HH:mm (24h), wall-clock in tz.

   Hardcoding (for the doc-maintenance chat):
     HC-W-EE13-1  DEFAULT_MODEL
     HC-W-EE13-2  DEFAULT_TZ fallback when the request sends no tz
     HC-W-EE13-3  thin thresholds (THIN_TEXT, CORE_MIN) and TEXT_BUDGET
     HC-W-EE13-4  BROWSER_UA string
   ============================================================ */

const DEFAULT_MODEL = 'claude-sonnet-5-5';                 // HC-W-EE13-1
const DEFAULT_TZ    = 'America/New_York';                  // HC-W-EE13-2
const TEXT_BUDGET   = 20000;                               // HC-W-EE13-3
const THIN_TEXT     = 1500;                                // HC-W-EE13-3
const CORE_MIN      = 3;                                   // HC-W-EE13-3
const BROWSER_UA    = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
                      '(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';   // HC-W-EE13-4
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

    const tz    = validTz(body && body.tz) ? String(body.tz) : DEFAULT_TZ;
    const kind  = (body && body.kind === 'listing') ? 'listing' : 'event';                       // v1.3.3
    const phases = Array.isArray(body && body.phases) ? body.phases.map(String).filter(Boolean).slice(0, 30) : [];
    const model = (env.EXTRACT_MODEL && String(env.EXTRACT_MODEL).trim()) || DEFAULT_MODEL;
    const key = env.ANTHROPIC_API_KEY;
    if (!key) return json({ ok:false, error:'ANTHROPIC_API_KEY not configured' }, 500, allow);
    const canRender = !!(env.CF_ACCOUNT_ID && env.CF_BROWSER_TOKEN);

    // ---- first read: plain fetch, as a normal browser ----
    let html = '', fetchErr = '';
    try {
      const res = await fetch(u.toString(), {
        headers: { 'User-Agent': BROWSER_UA,
                   'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
                   'Accept-Language': 'en-US,en;q=0.9' },
        redirect: 'follow'
      });
      if (res.ok) html = await res.text();
      else fetchErr = 'Page returned HTTP ' + res.status;
    } catch { fetchErr = 'Could not fetch the page'; }

    let rendered = false, note = '';
    const render = async () => {
      if (!canRender) { note = 'Page looked thin and the browser read is not set up (CF_ACCOUNT_ID / CF_BROWSER_TOKEN).'; return false; }
      try {
        const r = await renderPage(env, u.toString());
        if (r) { html = r; rendered = true; return true; }
        note = 'Browser read returned nothing.';
      } catch (e) { note = 'Browser read failed: ' + (e && e.message ? e.message : 'unknown'); }
      return false;
    };

    // Blocked or failed plain read: go straight to the browser.
    if (!html) {
      if (!(await render())) return json({ ok:false, error: fetchErr || 'Could not read the page', note }, 502, allow);
    }

    let sig = signalsFrom(html, u);
    if (!rendered && isThin(sig) && await render()) sig = signalsFrom(html, u);

    let fields;
    const extract = (sg) => kind === 'listing' ? callClaudeListing(key, model, phases, sg) : callClaude(key, model, tz, sg);   // v1.3.3
    try { fields = await extract(sig); }
    catch (e) { return json({ ok:false, error:'Extraction model error: ' + (e && e.message ? e.message : 'unknown') }, 502, allow); }

    // Model still came back short and we haven't rendered yet: one more try.
    if (!rendered && coreFilled(fields, kind) < CORE_MIN && await render()) {
      const sig2 = signalsFrom(html, u);
      try {
        const f2 = await extract(sig2);
        if (filledCount(f2) >= filledCount(fields)) { fields = f2; sig = mergeImages(sig2, sig); }
      } catch (e) { note = 'Browser read worked but the second extraction failed.'; }
    }

    // v1.3.3 — a listing page: link, verbatim description as plain text.
    if (kind === 'listing') {
      fields.propertyLink = u.toString();
      try { sig = Object.assign({}, sig, { images: await screenImages(sig.images) }); } catch (e) {}
      const vl = verbatimDescription(fields.propertyFeatures, sig);
      fields.propertyFeatures = vl.kept.join('\n\n');
      if (vl.dropped) note = (note ? note + ' ' : '') + vl.dropped + ' description paragraph' + (vl.dropped === 1 ? ' was' : 's were') + ' not found word for word on the page and left out.';
      if (fields.listingPhase && phases.indexOf(fields.listingPhase) === -1) fields.listingPhase = '';
      return json({ ok: true, kind, source: sig.jsonld ? 'json-ld' : (sig.og.title ? 'og+text' : 'text'), rendered,
                    filled: filledCount(fields), note, fields, images: sig.images, imageUrl: sig.images[0] || '' }, 200, allow);
    }

    // v1.2 — always force the operator-pasted URL as the redirect link.
    fields.eventRedirectLink = u.toString();

    // v1.3.1 — drop icons, logos and broken images; biggest first.
    try { sig = Object.assign({}, sig, { images: await screenImages(sig.images) }); } catch (e) { /* keep the raw list */ }

    // v1.3.1 — the description must be the page's own words.
    const vd = verbatimDescription(fields.eventDescription, sig);
    fields.eventDescription = vd.html;
    if (vd.dropped) note = (note ? note + ' ' : '') + vd.dropped + ' description paragraph' + (vd.dropped === 1 ? ' was' : 's were') + ' not found word for word on the page and left out.';

    return json({
      ok: true,
      source: sig.jsonld ? 'json-ld' : (sig.og.title ? 'og+text' : 'text'),
      rendered,
      filled: filledCount(fields),
      note,
      fields,
      images: sig.images,             // v1.1 — ALL candidate images, best guess first
      imageUrl: sig.images[0] || ''   // back-compat
    }, 200, allow);
  }
};

/* ---------------- v1.3 helpers ---------------- */

function signalsFrom(html, baseUrl) {
  const jsonld = extractJsonLdEvent(html);
  const og     = extractMeta(html);
  const text   = htmlToText(html);
  return { jsonld, og, text: text.slice(0, TEXT_BUDGET), textLen: text.length,
           images: collectImages(html, jsonld, og, baseUrl) };
}
function isThin(sig) { return !sig.jsonld && sig.textLen < THIN_TEXT; }

const CORE_KEYS = ['eventName', 'eventStartDate', 'eventLocation', 'eventDescription'];
const CORE_KEYS_LISTING = ['propertyAddress', 'propertyPrice', 'bedrooms', 'propertyFeatures'];   // v1.3.3
function coreFilled(f, kind) { return (kind === 'listing' ? CORE_KEYS_LISTING : CORE_KEYS).filter(k => String(f[k] || '').trim()).length; }
function filledCount(f) {
  return Object.keys(f).filter(k => k !== 'eventRedirectLink' && String(f[k] || '').trim()).length;
}
function mergeImages(a, b) {
  const seen = new Set(), out = [];
  a.images.concat(b.images).forEach(x => { if (!seen.has(x)) { seen.add(x); out.push(x); } });
  return Object.assign({}, a, { images: out.slice(0, 16) });
}

function validTz(tz) {
  if (!tz || typeof tz !== 'string') return false;
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
}
function todayIn(tz) {
  const p = {};
  new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
  return p.year + '-' + p.month + '-' + p.day;
}

// Cloudflare Browser Rendering REST API, /content: the page's HTML
// after its JavaScript has run.
async function renderPage(env, url) {
  const res = await fetch('https://api.cloudflare.com/client/v4/accounts/' +
      encodeURIComponent(env.CF_ACCOUNT_ID) + '/browser-rendering/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + env.CF_BROWSER_TOKEN },
    body: JSON.stringify({
      url,
      userAgent: BROWSER_UA,
      gotoOptions: { waitUntil: 'networkidle2', timeout: 30000 },
      rejectResourceTypes: ['media', 'font']
    })
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (!data || data.success === false) throw new Error('render not successful');
  return typeof data.result === 'string' ? data.result : '';
}

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
    if (imgTagIsChrome(tag)) continue;   // v1.3.1
    add((tag.match(/\bsrc=["']([^"']+)["']/i) || [])[1]);
    add((tag.match(/\bdata-src=["']([^"']+)["']/i) || [])[1]);
    add((tag.match(/\bdata-lazy-src=["']([^"']+)["']/i) || [])[1]);
    const ss = (tag.match(/\bsrcset=["']([^"']+)["']/i) || [])[1];
    if (ss) add(ss.split(',')[0].trim().split(/\s+/)[0]);
    if (out.length >= 24) break;
  }
  return out.slice(0, 16);
}

/* v1.3.1 — image clean-up (HC-W-EE131-1). */
const IMG_SKIP = /(icon|logo|sprite|social|facebook|twitter|instagram|linkedin|youtube|pinterest|tiktok|whatsapp|pixel|spacer|blank|badge|avatar|emoji|placeholder|loader|spinner)/i;
const IMG_MIN_BYTES = 8000, IMG_MIN_PX = 60, IMG_CHECK_MS = 4000;
function imgTagIsChrome(tag) {
  const attr = (n) => (tag.match(new RegExp('\\b' + n + '=["\']([^"\']*)["\']', 'i')) || [])[1] || '';
  const src = attr('src') || attr('data-src');
  if (/\.svg(\?|#|$)/i.test(src)) return true;
  if (IMG_SKIP.test(src) || IMG_SKIP.test(attr('class')) || IMG_SKIP.test(attr('alt')) || IMG_SKIP.test(attr('id'))) return true;
  const w = parseInt(attr('width'), 10), h = parseInt(attr('height'), 10);
  if ((w && w < IMG_MIN_PX) || (h && h < IMG_MIN_PX)) return true;
  return false;
}
async function screenImages(urls) {
  const list = (urls || []).filter(u => !/\.svg(\?|#|$)/i.test(u) && !IMG_SKIP.test(u.split('?')[0].split('/').pop()));
  const checked = await Promise.all(list.map(async (u, i) => {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), IMG_CHECK_MS);
    try {
      const r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': BROWSER_UA } });
      clearTimeout(t);
      if (r.status === 405 || r.status === 403) return { u, i, size: -1 };       // will not say: keep, rank last
      if (!r.ok) return null;                                                     // broken
      const ct = (r.headers.get('content-type') || '').toLowerCase();
      if (ct && (!/^image\//.test(ct) || /svg/.test(ct))) return null;
      const len = parseInt(r.headers.get('content-length') || '', 10);
      if (len && len < IMG_MIN_BYTES) return null;                                // icon-sized file
      return { u, i, size: len || -1 };
    } catch (e) { clearTimeout(t); return { u, i, size: -1 }; }
  }));
  return checked.filter(Boolean).sort((a, b) => (b.size - a.size) || (a.i - b.i)).map(x => x.u);
}

function htmlToText(html) {
  // v1.3 — strip more chrome and collapse whitespace, so the text
  // budget holds words rather than indentation.
  return decodeEntities(String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' '))
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/gi, "'");
}

async function callClaude(key, model, tz, signals) {
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
    'Interpret ALL dates and times as ' + tz + ' wall-clock; do not convert to UTC. ' +
    'Today is ' + todayIn(tz) + ' in that zone. If a date has no year, use the next occurrence on or after today. ' +
    'If no end date is given, leave eventEndDate as "". Never invent a time the page does not state. ' +
    'COPY, NEVER WRITE: every value must be the page\'s own words, character for character. ' +
    'Never summarise, shorten, reorder, rephrase, correct or improve anything. ' +
    'eventName = the event\'s name exactly as the page writes it; when the page shows it both in capitals and in normal case, use the normal-case one. ' +
    'eventDescription = a JSON ARRAY of strings, one per paragraph or detail line of the event\'s own description, in page order, ' +
    'copied word for word: include every sentence of the description and lines such as fees, ages, what to bring, registration terms. ' +
    'Leave out headings that only repeat the name, date or time, button labels (e.g. "Register Today"), navigation, ' +
    'the contact/phone/email block, "Get Directions" and site boilerplate. Use [] when the page has no description. ' +
    'Prefer the JSON-LD Event object for dates, times and venue; take the description from the page text when it holds more of it than the JSON-LD.';

  const user =
    'JSON-LD Event (may be null):\n' + JSON.stringify(signals.jsonld) + '\n\n' +
    'OpenGraph/meta:\n' + JSON.stringify(signals.og) + '\n\n' +
    'Page text' + (signals.textLen > TEXT_BUDGET ? ' (truncated)' : '') + ':\n' + signals.text;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 2048,   // v1.3.1: whole descriptions
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
  keys.forEach(k => {
    if (k === 'eventDescription') { out[k] = parsed[k]; return; }   // v1.3.1: array, checked by the caller
    out[k] = (parsed[k] == null) ? '' : String(parsed[k]);
  });
  return out;
}

/* v1.3.3 — one home's listing page. Same copy-never-write rule. */
async function callClaudeListing(key, model, phases, signals) {
  const system =
    'You extract one real-estate listing from a web page for a local community newsletter. ' +
    'Output ONLY a JSON object, no prose, no markdown, no code fences. Keys (all required, use "" when the page does not show it): ' +
    'propertyAddress, propertyPrice, bedrooms, bathrooms, sqFt, propertyMls, brokerage, propertyFeatures, listingPhase, statusPrinted. ' +
    'COPY, NEVER WRITE: every value must be the page\'s own words, character for character. Never summarise, shorten, reorder, rephrase, correct or improve anything. ' +
    'propertyAddress = the home\'s street address and town as the page writes them, joined by a comma (e.g. "381 Pinewood Dr, Wyckoff"); add the state and zip only if the page shows them with the address. ' +
    'propertyPrice = the asking or sold price exactly as shown (e.g. "$1,149,000"). ' +
    'bedrooms, bathrooms = as the page writes them (e.g. "4", "3 Full, 1 Half"). sqFt = the living-area square feet as shown. ' +
    'propertyMls = the MLS number. brokerage = the listing brokerage\'s name. ' +
    'propertyFeatures = a JSON ARRAY of strings, one per paragraph of the listing\'s own description (the remarks about the home), in page order, word for word. ' +
    'Leave out agent bios, mortgage calculators, school ratings, neighbourhood boilerplate, disclaimers and navigation. Use [] when there is no description. ' +
    'statusPrinted = the listing status words as the page shows them (e.g. "Under Contract", "For Sale", "Sold"). ' +
    'listingPhase = the ONE label from this list that means the same as the printed status, copied exactly, or "" when none does or the page shows no status: ' +
    JSON.stringify(phases) + '. ' +
    'Prefer the JSON-LD object for numbers when present; take the description from the page text when it holds more of it.';
  const user =
    'JSON-LD (may be null):\n' + JSON.stringify(signals.jsonld) + '\n\n' +
    'OpenGraph/meta:\n' + JSON.stringify(signals.og) + '\n\n' +
    'Page text' + (signals.textLen > TEXT_BUDGET ? ' (truncated)' : '') + ':\n' + signals.text;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: model, max_tokens: 2048, system: system, messages: [{ role: 'user', content: user }] })
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const txt = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  const clean = txt.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  let parsed;
  try { parsed = JSON.parse(clean); } catch { throw new Error('model did not return valid JSON'); }
  const keys = ['propertyAddress','propertyPrice','bedrooms','bathrooms','sqFt','propertyMls','brokerage','propertyFeatures','listingPhase','statusPrinted'];
  const out = {};
  keys.forEach(k => {
    if (k === 'propertyFeatures') { out[k] = parsed[k]; return; }
    out[k] = (parsed[k] == null) ? '' : String(parsed[k]);
  });
  return out;
}

/* v1.3.1 — keep only description paragraphs the page really holds. */
function normVerb(s) {
  return String(s || '').toLowerCase()
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'").replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}
function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function verbatimDescription(paras, sig) {
  if (typeof paras === 'string') paras = paras.split(/\n\s*\n|\n/);
  if (!Array.isArray(paras)) paras = [];
  const hay = normVerb([sig.text, sig.jsonld && sig.jsonld.description, sig.og && sig.og.description].filter(Boolean).join(' \n '));
  const kept = [], dropped = [];
  paras.map(p => String(p == null ? '' : p).trim()).filter(Boolean).forEach(p => {
    (hay.indexOf(normVerb(p)) !== -1 ? kept : dropped).push(p);
  });
  return { html: kept.map(p => '<p>' + escHtml(p) + '</p>').join(''), kept, dropped: dropped.length };
}
