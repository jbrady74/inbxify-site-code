/* ix-transcribe-v1.0.0.js
   ════════════════════════════════════════════════════════════════
   INBXIFY · ix-transcribe — the Transcriber engine, shared
   ── v1.0.0 (17 Nov 2026, Content Home S12) ──
   Jeff (17 Nov): Create from print should use the Transcriber engine to
   build an article with text only. The engine (prompt, AI call, field
   parse) lived inside ta-page-body (Section 5, the Screenshot
   Transcriber). It moves here, word for word, so the Transcriber and
   Create from print use the one engine and cannot drift apart.

   API
     IxTranscribe.read({
       images:   [{ mime: 'image/jpeg', base64: '…' }],   // required, in page order
       focus:    'A Peek Into Peptides',  // optional: the headline of the one
                                          // article to take when the page holds
                                          // several (Create from print)
       pageText: '…',                     // optional: the PDF text layer, used
                                          // only to spell the words exactly
       proxyUrl: '…'                      // optional: default TA_CONFIG.anthropicProxy
     }) → Promise<{ title, subtitle, writername, writertitle, cowritername,
                    cowritertitle, teaser, shortsummary, body }>
     Rejects with a sentence saying what went wrong. An empty tag stays
     empty (TD-186 rule: no field is invented).
     IxTranscribe.fromDataUrl(dataUrl) → { mime, base64 } for a rendered page.

   HARDCODING: HC-IXT-1 the model, claude-opus-4-5 (moved unchanged from
   ta-page-body v1.2.29); HC-IXT-2 max_tokens 4000 (same). The prompt is
   the Transcriber prompt unchanged; focus and pageText add one
   paragraph each to the user message, never to the prompt.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.IxTranscribe) return;
  var VERSION = '1.0.0';
  var MODEL = 'claude-opus-4-5';   /* HC-IXT-1 */
  var MAX_TOKENS = 4000;           /* HC-IXT-2 */

  var SYSTEM = "You are an expert article transcriber and editor for a local community newsletter publishing platform.\n\nReturn your response using XML tags — one tag per field. Do not use JSON. Do not add any text outside the tags.\n\nUse exactly these tags:\n<title>Article headline</title>\n<subtitle>Sub-title if visible, else leave empty</subtitle>\n<writername>Primary writer name if visible, else leave empty</writername>\n<writertitle>Primary writer title/role if visible, else leave empty</writertitle>\n<cowritername>Co-writer name if visible, else leave empty</cowritername>\n<cowritertitle>Co-writer title if visible, else leave empty</cowritertitle>\n<teaser>Newsletter teaser here</teaser>\n<shortsummary>Short summary here</shortsummary>\n<body>Full article HTML here</body>\n\nTEASER RULES:\n- Target length: 350–400 characters. Write enough to fill this range.\n- Minimum: 300 characters. If under 300, expand with a compelling detail.\n- Maximum: 400 characters hard limit.\n- Write a complete, engaging teaser — no truncation, no ellipsis.\n\nSHORT SUMMARY RULES:\n- Target length: 120–150 characters. Write to fill this range.\n- Minimum: 100 characters. If under 100, add a key detail.\n- Maximum: 150 characters hard limit.\n\nBODY RULES:\n- Transcribe all visible article text accurately and completely.\n- SECTION HEADERS: If the article has visible section headers, use <h2 class=\"sct-transcribed\">Header</h2>\n- LONG-RUN BREAKS: Within any stretch of body text that runs more than 6 paragraphs without an H2 — including the lede before the first source header — generate an interior <h2 class=\"sct-generated\">Header</h2> at a natural topical seam to break it. Apply this rule even when other parts of the article have visible source headers (mixed mode is allowed and expected: sct-transcribed and sct-generated H2s can coexist in the same article).\n- AUTO-SECTIONALIZE: If the article has NO visible section headers, divide into 2–5 logical sections and create descriptive H2 headers. Mark these as <h2 class=\"sct-generated\">Header</h2>\n- QUESTION AND ANSWER: in an interview or Q&A, a question and the answer that follows it are ONE unit. Never put a header (sct-generated or any other) between a question and its answer. If a generated header belongs near a Q&A pair, put it ABOVE the question.\n- Use <p> for paragraphs. Use <ul><li> for bullets. Use <ol><li> for numbered lists.\n- No inline styles. No wrapper divs. Start directly with content.\n- Do not summarize or cut the body — preserve all substantive content.\n\nIf any field is not visible or not applicable, leave the tag empty. Never omit a tag.";

  var TAGS = ['title', 'subtitle', 'writername', 'writertitle', 'cowritername',
              'cowritertitle', 'teaser', 'shortsummary', 'body'];

  function userText(n, focus, pageText) {
    var t = n > 1
      ? 'This article spans ' + n + ' pages in order. Treat as one continuous article. Transcribe it now.'
      : 'Transcribe this article screenshot.';
    if (focus) t += '\n\nThis page holds more than one item. Transcribe ONLY the article headed “' + focus +
      '” (the headline may differ slightly on the page). Leave out every other article, ad, caption and page furniture.';
    if (pageText) t += '\n\nThe page’s own text layer follows. Use it only to spell names and words exactly; take the article’s text and order from the image.\n<pagetext>\n' + pageText + '\n</pagetext>';
    return t;
  }

  function extract(raw, tag) {
    var m = raw.match(new RegExp('<' + tag + '>([\\s\\S]*?)<\\/' + tag + '>'));
    return m ? m[1].trim() : '';
  }

  function read(o) {
    o = o || {};
    var proxy = o.proxyUrl || (window.TA_CONFIG && window.TA_CONFIG.anthropicProxy) || '';
    if (!proxy) return Promise.reject(new Error('The AI is not set up on this page (no TA_CONFIG.anthropicProxy), so nothing was read.'));
    var imgs = (o.images || []).filter(function (i) { return i && i.base64; });
    if (!imgs.length) return Promise.reject(new Error('There is no page picture to read.'));
    var content = imgs.map(function (img) {
      return { type: 'image', source: { type: 'base64', media_type: img.mime || 'image/jpeg', data: img.base64 } };
    });
    content.push({ type: 'text', text: userText(imgs.length, String(o.focus || '').trim(), String(o.pageText || '').trim()) });
    return fetch(proxy, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system: SYSTEM, messages: [{ role: 'user', content: content }] })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error((data && data.error && data.error.message) || ('The AI answered HTTP ' + res.status + ', so nothing was read.'));
        var raw = ((data.content || []).filter(function (b) { return b.type === 'text'; })[0] || {}).text || '';
        if (!raw) throw new Error('The AI answered with no text, so nothing was read.');
        var out = {};
        TAGS.forEach(function (tag) { out[tag] = extract(raw, tag); });
        return out;
      });
    });
  }

  function fromDataUrl(u) {
    var m = String(u || '').match(/^data:([^;]+);base64,(.*)$/);
    return m ? { mime: m[1], base64: m[2] } : null;
  }

  window.IxTranscribe = { version: VERSION, read: read, fromDataUrl: fromDataUrl, system: SYSTEM };
})();
