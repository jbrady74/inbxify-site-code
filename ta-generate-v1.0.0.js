/* ============================================================
   ta-generate-v1.0.0.js
   ============================================================
   INBXIFY · Generator field-derivation helper (Part B)

   Shared client helper that turns an article body into the three
   AI-derived fields: teaser, short summary, and a copy of the body
   with section headers inserted. Consumed by the ASF AI-assist now,
   and the Generator tab later — one path, one prompt.

   ── ARCHITECTURE ──
   • The inbxify-anthropic-proxy Cloudflare Worker is a TRANSPARENT
     forwarder to Anthropic /v1/messages. No worker change is needed:
     this file builds the full Messages request (model + system +
     messages) and POSTs it to window.TA_CONFIG.anthropicProxy. The
     API key never touches the client. (Same convention as ta-rte's
     assessment call and ta-page-body's proxy call.)
   • Pure generation. It does NOT decide which fields to fill — the
     caller (ASF) applies the result, e.g. only-empty-fields + an
     undoable body rewrite.

   ── PUBLIC API ──
     window.InbxGenerate.fromBody(bodyHtml)
       → Promise<{ teaser, shortSummary, bodyWithHeaders }>
       Rejects on: proxy URL missing, empty body, API error,
       or unparseable model output.

   ── RULES (locked) ──
     teaser           350–400 chars (min 300)
     shortSummary     120–150 chars (min 100)
     bodyWithHeaders  same body, plain <h2> headers inserted for
                      2–5 logical sections, existing text untouched,
                      NO sct-* classes (markers dropped per Jeff).
   ============================================================ */
(function () {
  'use strict';

  /* ── Config — swap if your account/model strings differ ──
     ta-rte uses the undated alias style ('claude-sonnet-4-5'); this
     mirrors it for Haiku 4.5 (the locked model). Confirm the exact
     string is valid for your account, or set the dated form. */
  var ANTHROPIC_MODEL      = 'claude-haiku-4-5';
  var ANTHROPIC_MAX_TOKENS = 8192;   // body is re-emitted in full — headroom for long articles
  var DEBUG                = false;

  function proxyUrl() {
    return (window.TA_CONFIG && window.TA_CONFIG.anthropicProxy) || '';
  }

  var SYSTEM_PROMPT = [
    'You are an editor for a local community newsletter. You are given the HTML body of one article.',
    '',
    'Return ONLY valid JSON — no preamble, no backticks, no markdown:',
    '{',
    '  "teaser": "see TEASER RULES",',
    '  "shortSummary": "see SHORT SUMMARY RULES",',
    '  "bodyWithHeaders": "see BODY RULES"',
    '}',
    '',
    'TEASER RULES:',
    '- An engaging, standalone newsletter teaser that makes a reader want to open the full article.',
    '- Target 350-400 characters. Minimum 300. Hard maximum 400.',
    '- If your draft is under 300 characters, expand it with a compelling detail. No ellipsis, no truncation.',
    '',
    'SHORT SUMMARY RULES:',
    '- A punchy one-liner capturing the essence of the article (used as a preview/subtitle).',
    '- Target 120-150 characters. Minimum 100. Hard maximum 150.',
    '',
    'BODY RULES:',
    '- Return the article body HTML UNCHANGED except for inserting section headers.',
    '- Divide the article into 2-5 logical sections and insert a concise, descriptive <h2> header before each section.',
    '- If the body already contains <h2> headers, keep them; only add headers where a section clearly lacks one (still 2-5 total).',
    '- Do NOT rewrite, summarize, shorten, reorder, or otherwise change the existing text. Insert headers only.',
    '- Headers must be plain <h2> with no class and no style attribute.',
    '- Preserve existing markup: <p> for paragraphs, <ul>/<li> and <ol>/<li> for lists. No inline styles, no wrapper divs.'
  ].join('\n');

  function extractText(data) {
    // Anthropic Messages response: data.content is an array of blocks.
    if (!data || !Array.isArray(data.content)) return '';
    return data.content
      .filter(function (b) { return b && b.type === 'text' && typeof b.text === 'string'; })
      .map(function (b) { return b.text; })
      .join('\n');
  }

  function parseJson(text) {
    var clean = String(text || '').replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }

  function fromBody(bodyHtml) {
    var url = proxyUrl();
    if (!url) {
      return Promise.reject(new Error('Anthropic proxy not configured — add anthropicProxy to window.TA_CONFIG in the page head.'));
    }
    var html = (bodyHtml == null ? '' : String(bodyHtml)).trim();
    if (!html) {
      return Promise.reject(new Error('No body content to generate from.'));
    }

    var payload = {
      model:      ANTHROPIC_MODEL,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: 'ARTICLE BODY HTML:\n\n' + html }]
    };

    if (DEBUG) console.log('[InbxGenerate] POST to anthropicProxy', payload);

    return fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.error) {
        throw new Error('Anthropic API error: ' + (data.error.message || JSON.stringify(data.error)));
      }
      var raw = extractText(data);
      var out;
      try { out = parseJson(raw); }
      catch (e) {
        if (DEBUG) console.warn('[InbxGenerate] unparseable output:', raw);
        throw new Error('Could not parse generated fields from the model response.');
      }
      return {
        teaser:          (out && out.teaser) || '',
        shortSummary:    (out && out.shortSummary) || '',
        bodyWithHeaders: (out && out.bodyWithHeaders) || ''
      };
    });
  }

  window.InbxGenerate = { fromBody: fromBody, _model: ANTHROPIC_MODEL };

  if (DEBUG) console.log('[InbxGenerate] ready (model ' + ANTHROPIC_MODEL + ')');
})();
