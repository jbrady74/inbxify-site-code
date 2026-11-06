// ix-adreformat-v1.2.0.js
/**
 * ix-adreformat-v1.2.0.js
 * INBXIFY — Ad Maker read Worker (Cloudflare)
 * Host: ix-adreformat.jeff-2cd.workers.dev
 *
 * One job: read one print ad and return (a) its parts, as before, and
 * (b) a READ PLAN: the wording for each slot of a banner and sidebar,
 * each line labelled with where its words came from.
 *
 * ── v1.2.0 (6 Nov 2026, SS-Fork B · Creative S3) ──
 *   1. READ PLAN. The answer gains `plan`: one line per slot, always in
 *      this order: headline, headline2, supporting, button, phone,
 *      website, small_print. Each line:
 *        { slot, words, source, read, runs, label }
 *        source  how the words relate to the print ad:
 *                print      the ad's own wording, unchanged
 *                shortened  the ad's wording, cut down
 *                joined     two or more of the ad's pieces joined
 *                written    new words (only for the button, or a
 *                           headline when the ad has none)
 *        read    how the print words were read:
 *                pdf        PDF text, exact (from the text layer)
 *                vision     read from the picture
 *                null       for a written line
 *        runs    the PDF text runs the line came from (pdf only)
 *        label   ready to show, e.g. "Print wording · PDF text exact"
 *      An empty slot comes back with words "" and source "none".
 *   2. NO INVENTED CLAIMS. The Worker checks every line: any number,
 *      price, percent or money amount must appear in the ad's own words.
 *      A line that brings in one that does not is emptied, and a warning
 *      names it. Copy may shorten and rephrase; it never adds a claim.
 *   3. REAL PDF TEXT. The request may carry the PDF's text layer for the
 *      boxed ad (from IxPdfPager.text in the browser, ix-pdf-pager
 *      v1.1.0). When it does, every print line is built from those runs,
 *      by the Worker, character for character: the model only says which
 *      runs a line uses. `read.method` says which way the ad was read:
 *        { method:'pdf',    runs:n, note }
 *        { method:'vision', runs:0, note }   with the reason the PDF
 *                                            text was not used
 *      No silent fallback: a vision read always says why.
 *   4. MODEL FROM CONFIGURATION (HC-P-SSB-4). env.READ_MODEL, else the
 *      built-in default. Changing the model needs no redeploy.
 *   5. GET /health answers { ok, version, model }.
 *   `parts` and `diagnostics` are unchanged, so ta-adreformat v0.6.0
 *   keeps working until Ad Maker replaces it.
 *
 * Request (POST /):
 *   { image: { media_type, data },          required: the boxed ad, base64
 *     pdfText?: { method:'pdf'|'none',      from IxPdfPager.text()
 *                 reason, runs:[{id,str,x,y,w,h}] },
 *     customer?: { name } }                 helps pick the business name
 *
 * Response (200):
 *   { ok:true,
 *     parts:{ business_name, texts:[{role,value,verify?}],
 *             images:[{label,kind,bbox}], brand_colors:[] },
 *     plan:[ …seven lines… ],
 *     read:{ method, runs, note },
 *     warnings:[ '…' ],
 *     diagnostics:{ …, model, version } }
 *
 * Secrets (env): ANTHROPIC_API_KEY
 * Variables (env, optional): READ_MODEL
 *
 * HARDCODED (provisional ids, for the S3 HC delta):
 *   HC-P-SSB3-1  SLOTS: the seven slot names and their order. Platform-
 *                wide by the 3 Nov ruling (one set of layouts for every
 *                client). Mirrors the slots the layout module fills (S4).
 *   HC-P-SSB3-2  SOURCE_LABEL / READ_LABEL: the words shown for each
 *                source and read. Platform words, one place.
 *   HC-P-SSB3-3  MAX_RUNS 400: the most PDF runs sent to the model.
 *                Platform constant.
 *   (existing)   LOGO_PAD 0.04, ALLOWED_ORIGINS: unchanged from v1.1.0.
 */

const VERSION = '1.2.0';
const ALLOWED_ORIGINS = [
  'https://inbxify.com',
  'https://www.inbxify.com'
];
const ALLOWED_SUFFIX = '.webflow.io';
const DEFAULT_MODEL = 'claude-sonnet-4-5';   // env.READ_MODEL overrides (v1.2.0, HC-P-SSB-4)

// v1.1.0 — outward pad applied to logo/badge boxes (fraction of image).
const LOGO_PAD = 0.04;
const LOGO_KINDS = new Set(['logo', 'badge']);

// v1.2.0
const SLOTS = ['headline', 'headline2', 'supporting', 'button', 'phone', 'website', 'small_print'];   // HC-P-SSB3-1
const SOURCES = new Set(['print', 'shortened', 'joined', 'written']);
const SOURCE_LABEL = { print: 'Print wording', shortened: 'Shortened', joined: 'Joined', written: 'Written', none: 'Empty' };   // HC-P-SSB3-2
const READ_LABEL = { pdf: 'PDF text exact', vision: 'read by vision' };
const MAX_RUNS = 400;                                                                                 // HC-P-SSB3-3

const PARTS_SPEC = `PARTS (as before):
  "business_name": "string (the advertiser's name)",
  "texts": [ { "role": "headline|tagline|offer|promo_code|services|phone|web|address|license|person|other", "value": "string" } ],
  "images": [ { "label": "short human label e.g. 'logo','mascot','vehicle photo','QR code','coupon'", "kind": "logo|mascot|photo|graphic|qr|coupon|badge|other", "bbox": [x, y, w, h] } ],
  "brand_colors": [ "#hex", ... up to 4, ordered most-prominent first ]

Rules for parts:
- bbox values are FRACTIONS of image dimensions (0.0-1.0): x,y = top-left corner, w,h = width,height.
- Return EVERY distinct image region you can identify (logos, mascots, photos, QR codes, coupon blocks, partner logos, review badges) - do not limit to one.
- Return EVERY distinct text snippet, each with its best role label.
- brand_colors = the ad's actual brand palette (the dominant non-white, non-black colors used in the design).
- Be literal. Do not invent text that is not in the ad. If the same text appears more than once, you may return it once.

LOGO / BADGE BOUNDING BOXES — read carefully:
- For any logo, badge, seal, or emblem, the bbox MUST enclose the COMPLETE mark: the full outer ring or circle, every letter, the registered-trademark or copyright symbol (® / ©), AND any tagline or company-name lock-up that sits directly under or beside the mark as part of the logo.
- Do NOT tightly crop to just the central glyph or monogram. Include the entire emblem and its immediate lock-up text.
- When uncertain, err on the side of a SLIGHTLY LARGER box. A logo box that is a little too big is fine; one that clips the ring, the ®, or the tagline is NOT acceptable.
- A logo is a single region. Return one bbox that covers the whole logo lock-up, not separate boxes for the ring and the text.`;

const PLAN_SPEC = `PLAN (new): the wording for a small newsletter banner (700x235) and sidebar (480x400) made from this ad.
  "plan": [ { "slot": "headline|headline2|supporting|button|phone|website|small_print",
              "words": "string",
              "source": "print|shortened|joined|written",
              "runs": ["r1","r2"] } ]

Slots:
- headline: the main message, at most 7 words. Prefer the ad's own headline.
- headline2: a second headline choice, at most 7 words, different from the first. Empty if the ad has only one strong line.
- supporting: one short line under the headline, at most 12 words (the offer, the service list, or the tagline).
- button: a call to action, at most 3 words (e.g. "Call today", "Book now", "Get a quote"). Use the ad's own words when it has one.
- phone: the phone number exactly as printed.
- website: the web address exactly as printed.
- small_print: licence numbers, offer expiry, conditions. Exactly as printed. Empty when there is none.

Source:
- print: the words are exactly the ad's own words.
- shortened: the ad's own words with some left out. Nothing added except joining punctuation.
- joined: two or more of the ad's own pieces put together.
- written: new words. Allowed only for the button, or for the headline when the ad has no usable headline.

HARD RULES:
- Never invent a claim, a price, a percentage, a discount, a date, a number or an offer. Every number in a line must be in the ad.
- phone, website and small_print are always "print" or empty.
- Leave a slot out, or give it empty words, rather than guess.`;

function pdfBlock(runs) {
  return `PDF TEXT: this ad's real text, read from the PDF's text layer. Each run is { id, str, x, y, w, h } with positions as fractions of the image, in reading order.
${JSON.stringify(runs.map(r => ({ id: r.id, str: r.str, x: r.x, y: r.y, w: r.w, h: r.h })))}

Rules when PDF TEXT is given:
- The runs are the true words. Use them; do not re-read the words from the picture.
- For every plan line with source print, shortened or joined, list in "runs" the ids of the runs its words come from, in the order used.
- A print line's words must be exactly its runs joined with single spaces.
- Use the picture only to see layout, emphasis and images.`;
}

function buildPrompt(runs, customerName) {
  return `You are reading a print advertisement so it can be rebuilt into a small web banner and sidebar for an email newsletter.

Return ONLY valid JSON, no markdown fences, no preamble. One object with five keys: business_name, texts, images, brand_colors, plan.
${customerName ? '\nThe advertiser is: ' + customerName + '\n' : ''}
${PARTS_SPEC}

${PLAN_SPEC}
${runs.length ? '\n' + pdfBlock(runs) : ''}`;
}

function corsHeaders(origin) {
  const ok = origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(ALLOWED_SUFFIX));
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  // Bboxes: pad logos/badges outward (v1.1.0), then clamp to [0,1].
  const clamp = n => Math.max(0, Math.min(1, Number(n) || 0));
  (Array.isArray(parsed.images) ? parsed.images : []).forEach(im => {
    if (!im || !Array.isArray(im.bbox) || im.bbox.length !== 4) return;
    let [x, y, w, h] = im.bbox.map(clamp);
    const kind = (im.kind || 'other').toLowerCase();
    if (LOGO_KINDS.has(kind)) {
      x = clamp(x - LOGO_PAD);
      y = clamp(y - LOGO_PAD);
      w = w + LOGO_PAD * 2;
      h = h + LOGO_PAD * 2;
    }
    if (x + w > 1) w = 1 - x;
    if (y + h > 1) h = 1 - y;
    w = Math.max(0, w); h = Math.max(0, h);
    out.images.push({ label: im.label || im.kind || 'image', kind: im.kind || 'other', bbox: [x, y, w, h] });
  });

  return out;
}

// ── v1.2.0: the plan ──────────────────────────────────────────

// The PDF runs the request carried, cleaned and capped.
function cleanRuns(pdfText) {
  if (!pdfText || pdfText.method !== 'pdf' || !Array.isArray(pdfText.runs)) return [];
  const num = v => Math.round((Number(v) || 0) * 10000) / 10000;
  return pdfText.runs
    .filter(r => r && typeof r.str === 'string' && r.str.trim())
    .slice(0, MAX_RUNS)
    .map((r, i) => ({ id: String(r.id || 'r' + (i + 1)), str: r.str.replace(/\s+/g, ' ').trim(), x: num(r.x), y: num(r.y), w: num(r.w), h: num(r.h) }));
}

// Why the PDF text was not used, in plain words.
function visionNote(pdfText) {
  if (!pdfText) return 'No PDF text came with this ad (a picture, or a file that is not a PDF). Read from the picture.';
  const why = {
    'no-text': 'This PDF page has no text layer (a flat picture). Read from the picture.',
    'none-in-box': 'The PDF has text, but none inside the boxed ad (the ad is a flat picture). Read from the picture.',
    'unreadable': 'The PDF text inside the ad is unreadable (its font has no character map). Read from the picture.'
  };
  return why[pdfText.reason] || 'The PDF text could not be used. Read from the picture.';
}

// Numbers, prices, percents and money words: these must come from the ad.
function claimTokens(s) {
  const t = String(s || '').toLowerCase();
  const out = new Set();
  (t.match(/\d[\d,.]*/g) || []).forEach(n => out.add(n.replace(/[,.]+$/, '').replace(/,/g, '')));
  if (/%|\bpercent\b/.test(t)) out.add('%');
  if (/\$/.test(t)) out.add('$');
  if (/\bfree\b/.test(t)) out.add('free');
  if (/\bhalf\b/.test(t)) out.add('half');
  return out;
}
function digitsOnly(s) { return String(s || '').replace(/\D/g, ''); }

// The model's words as they actually appear in the source text, character
// for character (case, hyphens and spacing as printed). Phone: matched on its
// digits. Returns '' when not found.
function findExact(words, text, isPhone) {
  if (!words || !text) return '';
  let re;
  if (isPhone) {
    const d = digitsOnly(words);
    if (d.length < 7) return '';
    re = new RegExp('\\(?' + d.split('').join('[^0-9A-Za-z]{0,3}'));
  } else {
    const parts = words.toLowerCase().split(/\s+/).filter(Boolean)
      .map(w => w.replace(/[-\u2010-\u2014]/g, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').split('').join('[-\u2010-\u2014]?'));
    if (!parts.length) return '';
    re = new RegExp(parts.join('[\\s\u00a0]+'), 'i');
  }
  const m = text.match(re);
  return m ? m[0].replace(/\s+/g, ' ').trim() : '';
}

function buildPlan(parsed, parts, runs) {
  const warnings = [];
  const byId = new Map(runs.map(r => [r.id, r]));
  const pdfMode = runs.length > 0;

  // Everything the ad itself says, for the claim check.
  const adText = (pdfMode ? runs.map(r => r.str) : parts.texts.map(t => t.value)).join(' \n ');
  const adClaims = claimTokens(adText);
  const adDigits = digitsOnly(adText);

  const raw = new Map();
  (Array.isArray(parsed.plan) ? parsed.plan : []).forEach(l => {
    if (!l || !SLOTS.includes(l.slot) || raw.has(l.slot)) return;
    raw.set(l.slot, l);
  });

  const plan = SLOTS.map(slot => {
    const l = raw.get(slot) || {};
    let words = String(l.words || '').replace(/\s+/g, ' ').trim();
    let source = SOURCES.has(l.source) ? l.source : (words ? 'print' : 'none');
    let read = null;
    let lineRuns = [];

    if (!words) return line(slot, '', 'none', null, []);

    // Exact-only slots.
    if ((slot === 'phone' || slot === 'website' || slot === 'small_print') && source !== 'print') source = 'print';
    if (source === 'written' && slot !== 'button' && slot !== 'headline' && slot !== 'headline2') {
      warnings.push(SOURCE_LABEL.written + ' words are not allowed for ' + slot + '; emptied ("' + words + '").');
      return line(slot, '', 'none', null, []);
    }

    if (source !== 'written') {
      if (pdfMode) {
        lineRuns = (Array.isArray(l.runs) ? l.runs : []).map(String).filter(id => byId.has(id));
        if (source === 'print') {
          // The exact characters, taken from the PDF text by the Worker:
          // first the model's words found inside its runs (so "Call 973-838-3200"
          // gives the phone "973-838-3200"), else inside all the ad's text,
          // else the whole runs it named.
          const runText = lineRuns.map(id => byId.get(id).str).join(' ');
          const hit = findExact(words, runText, slot === 'phone') || findExact(words, adText, slot === 'phone');
          if (hit) {
            words = hit;
            read = 'pdf';
            if (!lineRuns.length) lineRuns = runs.filter(r => hit.indexOf(r.str) > -1 || r.str.indexOf(hit) > -1).map(r => r.id);
          } else if (lineRuns.length) {
            words = runText.replace(/\s+/g, ' ').trim();
            read = 'pdf';
          } else {
            read = 'vision';
            warnings.push(slot + ': "' + words + '" is not in the PDF text; check it.');
          }
        } else {
          read = lineRuns.length ? 'pdf' : 'vision';
        }
      } else {
        read = 'vision';
      }
    }

    // No invented claims: every number, price or percent must be in the ad.
    if (slot === 'phone') {
      const d = digitsOnly(words);
      if (d && adDigits.indexOf(d) < 0) {
        warnings.push('phone: "' + words + '" is not in the ad; emptied.');
        return line(slot, '', 'none', null, []);
      }
    } else {
      const extra = [...claimTokens(words)].filter(tok => !adClaims.has(tok) && !(/^\d+$/.test(tok) && adDigits.indexOf(tok) > -1));
      if (extra.length) {
        warnings.push(slot + ': "' + words + '" brings in ' + extra.join(', ') + ', which the ad does not say; emptied.');
        return line(slot, '', 'none', null, []);
      }
    }
    return line(slot, words, source, read, read === 'pdf' ? lineRuns : []);
  });

  return { plan, warnings };
}

function line(slot, words, source, read, runs) {
  const label = source === 'none' ? SOURCE_LABEL.none
    : SOURCE_LABEL[source] + (read ? ' \u00b7 ' + READ_LABEL[read] : '');
  return { slot, words, source, read, runs, label };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const model = (env && env.READ_MODEL) || DEFAULT_MODEL;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method === 'GET' && /\/health\/?$/.test(new URL(request.url).pathname)) {
      return json({ ok: true, version: VERSION, model }, 200, origin);
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
    if (!env.ANTHROPIC_API_KEY) {
      return json({ ok: false, error: 'ANTHROPIC_API_KEY not configured' }, 500, origin);
    }

    const runs = cleanRuns(body.pdfText);
    const customerName = body.customer && typeof body.customer.name === 'string' ? body.customer.name.trim().slice(0, 120) : '';
    const read = runs.length
      ? { method: 'pdf', runs: runs.length, note: 'Words taken exactly from the PDF text (' + runs.length + ' runs).' +
          (body.pdfText.runs.length > MAX_RUNS ? ' Only the first ' + MAX_RUNS + ' runs were used.' : '') }
      : { method: 'vision', runs: 0, note: visionNote(body.pdfText) };

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
          model,
          max_tokens: 3000,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } },
              { type: 'text', text: buildPrompt(runs, customerName) }
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

    const cleaned = raw.replace(/^```json\s*|^```\s*|\s*```$/g, '').trim();
    let parsed;
    try { parsed = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1)); }
    catch (e) {
      return json({ ok: false, error: 'Model did not return clean JSON', raw: raw.slice(0, 500) }, 422, origin);
    }

    const rawCount = Array.isArray(parsed.texts) ? parsed.texts.length : 0;
    const parts = cleanParts(parsed);
    const { plan, warnings } = buildPlan(parsed, parts, runs);

    return json({
      ok: true,
      parts,
      plan,
      read,
      warnings,
      diagnostics: {
        raw_text_count: rawCount,
        deduped_text_count: parts.texts.length,
        image_count: parts.images.length,
        logo_pad: LOGO_PAD,
        model,
        version: VERSION
      }
    }, 200, origin);
  }
};
