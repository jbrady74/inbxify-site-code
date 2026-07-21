/* ============================================================
   ta-generate-v1.0.3.js
   ============================================================
   INBXIFY · Generator field-derivation helper (Part B)

   Shared client helper that turns an article body into the AI-
   derived fields. Consumed by the ASF AI-assist now, and the
   Generator tab later — one path, one prompt.

   ── v1.0.3 — Title / Subtitle / Writer extraction (May 26) ──
   Output contract extended with SIX new keys:
     title          — the article headline. If the body's opening
                      clearly IS the title, used verbatim; else a
                      concise derived headline. If a natural title
                      splits on a colon/em-dash into headline +
                      subtitle, the split is applied.
     subtitle       — ONLY from a clear split or explicit subtitle
                      in the body; null otherwise. Never invented.
     writer         — ONLY when the body names an author (byline
                      patterns: "By Jane Doe", signature lines,
                      "— Jane Doe, Staff Writer"). null otherwise.
                      NEVER invented — a wrong byline is worse
                      than an empty one.
     writerTitle    — the named author's title when stated
                      ("Editor", "Staff Writer"); null otherwise.
     cowriter       — second named author, same rules; null.
     cowriterTitle  — same rules; null.
   Existing keys (teaser / shortSummary / bodyWithHeaders) and all
   their rules are UNCHANGED. Deterministic clamps added: title
   ≤90, subtitle ≤60 (ASF field limit). Callers on the v1.0.2
   contract are unaffected — new keys are additive.
   Paired consumer: ta-asf-v1.5.22.js (fill-only-empty).

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
    '  "title": "see TITLE RULES",',
    '  "subtitle": "see TITLE RULES — string or null",',
    '  "writer": "see WRITER RULES — string or null",',
    '  "writerTitle": "string or null",',
    '  "cowriter": "string or null",',
    '  "cowriterTitle": "string or null",',
    '  "teaser": "see TEASER RULES",',
    '  "shortSummary": "see SHORT SUMMARY RULES",',
    '  "bodyWithHeaders": "see BODY RULES"',
    '}',
    '',
    'TITLE RULES:',
    '- If the body opens with what is clearly the article headline (a leading heading element, or a short standalone first line that reads as a headline), use it VERBATIM as the title.',
    '- Otherwise derive a concise, compelling headline from the article (under 90 characters).',
    '- If the natural title splits into headline + subtitle on a colon, em-dash, or similar (e.g. "Main Part: Descriptive Part"), put the main part in "title" and the descriptive part in "subtitle".',
    '- "subtitle" must come ONLY from such a split or an explicit subtitle present in the body. If there is none, set "subtitle" to null. Never invent a subtitle. Subtitle under 60 characters.',
    '',
    'WRITER RULES:',
    '- Fill "writer" ONLY if the body explicitly names an author — a byline like "By Jane Doe", a signature line, or "— Jane Doe, Staff Writer".',
    '- If an author title/role is stated with the name, put it in "writerTitle" (e.g. "Editor", "Staff Writer"). Otherwise null.',
    '- If a SECOND author is named, fill "cowriter" / "cowriterTitle" by the same rules. Otherwise null.',
    '- NEVER invent, infer, or guess an author. If no author is named in the body, "writer" is null. A wrong byline is worse than an empty one.',
    '',
    'TEASER RULES:',
    '- An engaging, standalone newsletter teaser that makes a reader want to open the full article.',
    '- Aim for 340-385 characters. NEVER exceed 400 — count carefully and stay under 400. Minimum 300.',
    '- If your draft is under 300 characters, expand it with a compelling detail. No ellipsis, no truncation.',
    '',
    'SHORT SUMMARY RULES:',
    '- A punchy one-liner capturing the essence of the article (used as a preview/subtitle).',
    '- Aim for 115-142 characters. NEVER exceed 150 — count carefully and stay under 150. Minimum 100.',
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

  // ── v1.0.1 — hard character-limit guarantee ──
  // The model can't reliably count characters, so the field ceilings are
  // enforced deterministically here: output is ALWAYS within limits. The
  // clamp ends at a sentence terminator under max when one fits, else the
  // last word boundary, else a hard cut. No ellipsis.
  var TEASER_MAX   = 400;  // matches the ASF teaser field limit
  var SUMMARY_MAX  = 150;  // matches the ASF short-summary field limit
  var TITLE_MAX    = 90;   // v1.0.3 — headline ceiling
  var SUBTITLE_MAX = 60;   // v1.0.3 — matches the ASF sub-title field limit
  function clampText(s, max) {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    if (s.length <= max) return s;
    var slice = s.slice(0, max);
    var sent = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));
    if (sent >= Math.floor(max * 0.6)) return slice.slice(0, sent + 1).trim();
    var sp = slice.lastIndexOf(' ');
    if (sp >= Math.floor(max * 0.5)) return slice.slice(0, sp).trim();
    return slice.trim();
  }

  // v1.0.2 — single proxy POST → parsed text (reused by the main call + re-ask).
  function postMessages(payload) {
    var url = proxyUrl();
    if (!url) {
      return Promise.reject(new Error('Anthropic proxy not configured — add anthropicProxy to window.TA_CONFIG in the page head.'));
    }
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
      return extractText(data);
    });
  }

  // v1.0.2 — when a field overshoots, ask the model to rewrite it complete
  // and under budget (aimed a bit below max for headroom). On ANY failure it
  // returns the original text — clampText is the final backstop either way.
  function reaskShorten(label, text, max) {
    var budget = Math.max(40, max - 15);
    var sys = 'You rewrite text to fit a strict character budget. Return ONLY the rewritten text — no quotes, no preamble, no labels, no JSON.';
    var usr = 'Rewrite this ' + label + ' so it is complete (no dangling or partial sentence) and at most ' + budget +
              ' characters. Do not exceed ' + budget + ' characters. Preserve the meaning and tone.\n\n' + text;
    return postMessages({
      model:      ANTHROPIC_MODEL,
      max_tokens: 1024,
      system:     sys,
      messages:   [{ role: 'user', content: usr }]
    }).then(function (raw) {
      var t = String(raw || '').trim().replace(/^["']+|["']+$/g, '').trim();
      return t || text;
    }).catch(function () {
      return text;
    });
  }

  function fromBody(bodyHtml) {
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

    return postMessages(payload).then(function (raw) {
      var out;
      try { out = parseJson(raw); }
      catch (e) {
        if (DEBUG) console.warn('[InbxGenerate] unparseable output:', raw);
        throw new Error('Could not parse generated fields from the model response.');
      }
      var teaser  = (out && out.teaser) || '';
      var summary = (out && out.shortSummary) || '';
      var body    = (out && out.bodyWithHeaders) || '';
      // v1.0.3 — extraction fields. Empty string and null both mean
      // "not present in the body" (the no-invention rule) — callers
      // must treat falsy as absent, not as a value to write.
      function strOrEmpty(v) { return (v == null) ? '' : String(v).trim(); }
      var title         = strOrEmpty(out && out.title);
      var subtitle      = strOrEmpty(out && out.subtitle);
      var writer        = strOrEmpty(out && out.writer);
      var writerTitle   = strOrEmpty(out && out.writerTitle);
      var cowriter      = strOrEmpty(out && out.cowriter);
      var cowriterTitle = strOrEmpty(out && out.cowriterTitle);

      // Re-ask ONLY the field(s) that ran long (usually none → no extra call),
      // then clamp as the can't-fail backstop.
      var jobs = [];
      if (teaser.length  > TEASER_MAX)  jobs.push(reaskShorten('article teaser', teaser, TEASER_MAX).then(function (t) { teaser = t; }));
      if (summary.length > SUMMARY_MAX) jobs.push(reaskShorten('short summary', summary, SUMMARY_MAX).then(function (s) { summary = s; }));

      return Promise.all(jobs).then(function () {
        return {
          title:           clampText(title, TITLE_MAX),        // v1.0.3
          subtitle:        clampText(subtitle, SUBTITLE_MAX),  // v1.0.3
          writer:          writer,                             // v1.0.3 — names never clamped
          writerTitle:     writerTitle,                        // v1.0.3
          cowriter:        cowriter,                           // v1.0.3
          cowriterTitle:   cowriterTitle,                      // v1.0.3
          teaser:          clampText(teaser, TEASER_MAX),
          shortSummary:    clampText(summary, SUMMARY_MAX),
          bodyWithHeaders: body
        };
      });
    });
  }

  window.InbxGenerate = { fromBody: fromBody, _model: ANTHROPIC_MODEL };

  if (DEBUG) console.log('[InbxGenerate] ready (model ' + ANTHROPIC_MODEL + ')');
})();
