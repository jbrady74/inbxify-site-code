/* ============================================================
   ta-generate-v1.0.9.js
   ============================================================
   INBXIFY · Generator field-derivation helper (Part B)

   Shared client helper that turns an article body into the AI-
   derived fields. Consumed by the ASF AI-assist now, and the
   Generator tab later — one path, one prompt.

   ── v1.0.9 — Length caps on table values (July 22) ──
   Pairs with ta-asf v1.5.29 + ix-ai-badge-v1.0.0.css.

   PROBLEM: the metadata table is authoritative and used verbatim,
   but the CMS caps title and subtitle at 60 characters. A live
   upload carried a 78-char subtitle. Verbatim would silently
   overflow the input's maxlength and truncate mid-word.

   RULE ADDED — the single permitted edit to a table value:
     Shorten to <=60 using ONLY words already present in that value.
     Drop words. Never add one. Never substitute a synonym. Never
     rephrase or re-order. Preserve the opening words so the
     author's framing survives.

   NEW JSON KEY — "altered": [] — the model reports which table
   values it shortened. The ASF uses that to badge the field, so an
   AI edit is never invisible to the operator. Values that fit the
   cap are direct-filled by the ASF and never reach this prompt,
   so they stay unbadged: author's words, unmarked.

   ── v1.0.8 — writerTitle rule simplified (July 22) ──
   REVERSES the conditional company-vs-job-title rule shipped in
   v1.0.7. New rule, unconditional:

     Whatever follows the separator after the author's name is
     written to writerTitle VERBATIM. No comparison against the
     Client cell. No judgement about what kind of thing it is.

   WHY the reversal (Jeff): the v1.0.7 rule required predicting
   which tails are job titles and which are companies — across
   publisher templates that are NOT fixed and NOT knowable in
   advance. It was an invented rule dressed as a heuristic, and
   it had a silent failure mode: the tail was compared to the
   Client cell, so a legal-name / trading-name mismatch ("Carbon
   Health & Wellness" vs "Carbon Health and Wellness, Inc.")
   would write the company into writerTitle anyway — inconsistently,
   depending on string luck. Predictable-and-faithful beats
   clever-and-conditional.

   KNOWN CONSEQUENCE, accepted: for paid Expert Contributor
   articles the company will appear BOTH in writerTitle and on the
   customer link. That reads correctly in most bylines; where it
   looks redundant on the rendered TS tile, the operator clears
   the field in one click. The Source-metadata panel (ta-asf
   v1.5.27) makes the value visible before save either way.

   UNCHANGED from v1.0.7 — no re-ship of ta-asf/CSS needed:
     · Client → CUSTOMERS best-effort match + dropdown fill
       (ASF-side, reads the Client cell independently)
     · Content Type "Expert Contributor" → expert-contributor
       switch (ASF-side)
     · Name extraction, honorifics, dash/comma/whitespace
       tolerance, cowriter splitting, no-invention guarantee

   ── v1.0.7 — Source-metadata interrogation (July 22) ──
   Pairs with ta-asf v1.5.27 + the Scenario B mapper change that
   finally carries the html-clean Worker's X-Inbxify-Metadata
   header onto MEDIA.source-metadata.

   WHY: publisher uploads lead with a labelled metadata TABLE
   (Title / Subtitle / By Line / Client / Notes…). Until now that
   table never reached the ASF, so the model was asked to infer a
   title from headless prose — and invented one. Now the parsed
   pairs are handed to the model as AUTHORITATIVE source.

   fromBody(bodyHtml, sourceMeta) — second arg optional and
   backward compatible; omitting it reproduces v1.0.6 behaviour
   exactly.

   The model's job on those pairs is SPLITTING, not composing:
     By Line  "By  Dr. Jeffrey A. Pammer - Carbon Health & Wellness"
              → writer "Dr. Jeffrey A. Pammer"
              → writerTitle per the company rule below
     By Line  "By Doug Drohan, Publisher"
              → writer "Doug Drohan" · writerTitle "Publisher"
     By Line  "By Doug Drohan and Jane Smith"
              → writer "Doug Drohan" · cowriter "Jane Smith"
   Separator is comma OR dash (-, –, —). Leading "By"/"By:" is
   stripped along with any whitespace run (real uploads carry a
   double space after "By").

   (v1.0.7's conditional company rule is SUPERSEDED by v1.0.8 —
   see the v1.0.8 note above.)

   Title/Subtitle are NOT re-derived when the table supplies them
   (the ASF direct-fills those verbatim); the model is told to
   echo the table values so its output can never contradict them.
   Teaser, short summary, and section headers are still written
   from the prose as before — those are genuinely generative.

   ── v1.0.6 — Model bump Haiku 4.5 → Sonnet 4.6 (July 21) ──
   Live symptom: with claude-haiku-4-5, verbatim title extraction
   was being embellished ("Rotary Awards Scholarship" came back as
   "Rotary Honors 2026 Scholarship") and a one-word subtitle
   ("Recipients") was fabricated where the body had none — both
   direct violations of the v1.0.4 verbatim/no-invention rules,
   which were already present and correct in the prompt. Root cause
   was model compliance, not prompt content: Haiku pattern-completes
   toward "better copy" instead of obeying a hard extract-or-null
   constraint. Fix: (1) ANTHROPIC_MODEL → claude-sonnet-4-6, which
   follows the constraint reliably; (2) belt-and-suspenders prompt
   reinforcement — a top-line CRITICAL directive naming the exact
   observed failures as forbidden. No output-contract or API-shape
   change; the proxy and all callers are untouched. ASF consumer
   unchanged (still v1.5.26 — no ASF bump needed).

   ── v1.0.5 — Photographer extraction (July 21) ──
   New output key: photographer. Looks for photo-credit language
   in the body ("Photos by …", "Photo credit: …", "Photography
   by …", "Photos courtesy of …", credit lines under images) and
   extracts the photographer's name or business name VERBATIM.
   Same no-invention rule as writers: null when no credit language
   exists — a wrong photo credit is the same class of error as a
   wrong byline. Names never clamped.
   Paired consumer: ta-asf-v1.5.24 — on non-empty photographer,
   fills the S3 Photographer field AND flips Show photo credits
   ON (both dirty-tracked; Scenario 104 mapping already live).

   ── v1.0.4 — Title/Subtitle: verbatim-only, length-driven split ──
   Closed a loophole in v1.0.3: the prompt allowed the model to
   "derive a concise headline" when the body didn't obviously open
   with one — that's invention, which Jeff's rule forbids. Title
   must now ALWAYS come verbatim from the body, or be null.
   Also fixed TITLE_MAX (was 90, doesn't match the ASF title
   field's real 60-char limit — now 60).
   New behavior: when the real verbatim title is longer than 60
   chars and no explicit subtitle exists, the ACTUAL overflow text
   (not invented content) is moved into "subtitle" — word-boundary
   split, deterministic backstop in splitTitleOverflow() so this
   holds even if the model doesn't count characters correctly.
   Edge case: if the title overflows AND the body already has its
   own explicit subtitle, the real subtitle is never overwritten —
   title is truncated instead and a console warning fires so the
   operator can verify against source (see ASF "See raw text").

   ── v1.0.3 — Title / Subtitle / Writer extraction (May 26) ──
   Output contract extended with SIX new keys:
     title          — the article headline, verbatim from the body.
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
   their rules are UNCHANGED.

   ── ARCHITECTURE ──
   • The inbxify-anthropic-proxy Cloudflare Worker is a TRANSPARENT
     forwarder to Anthropic /v1/messages. No worker change is needed:
     this file builds the full Messages request (model + system +
     messages) and POSTs it to window.TA_CONFIG.anthropicProxy. The
     API key never touches the client.
   • Pure generation. It does NOT decide which fields to fill — the
     caller (ASF) applies the result, e.g. only-empty-fields + an
     undoable body rewrite.

   ── PUBLIC API ──
     window.InbxGenerate.fromBody(bodyHtml)
       → Promise<{ title, subtitle, writer, writerTitle, cowriter,
                   cowriterTitle, photographer, teaser, shortSummary,
                   bodyWithHeaders }>
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

  // v1.0.6 — model bumped Haiku 4.5 → Sonnet 4.6. Haiku was
  // embellishing verbatim titles ("Awards" → "Honors 2026") and
  // fabricating subtitles despite the explicit no-invention prompt —
  // a known small-model weakness on strict extract-or-null tasks.
  // Sonnet 4.6 follows the verbatim/no-invention rules reliably. This
  // is field extraction, not bulk generation, so the per-call cost
  // difference is small and accuracy is what matters here.
  var ANTHROPIC_MODEL      = 'claude-sonnet-4-6';
  var ANTHROPIC_MAX_TOKENS = 8192;   // body is re-emitted in full — headroom for long articles
  var DEBUG                = false;

  function proxyUrl() {
    return (window.TA_CONFIG && window.TA_CONFIG.anthropicProxy) || '';
  }

  var SYSTEM_PROMPT = [
    'You are an editor for a local community newsletter. You are given the HTML body of one article.',
    '',
    'CRITICAL — VERBATIM EXTRACTION, NOT WRITING: For title, subtitle, writer, and photographer you are EXTRACTING text that already exists in the body, character-for-character. You are NOT composing, improving, summarizing, or completing anything. If the exact text is not present in the body, return null for that field. Adding a single word the author did not write is a failure. Example of a FORBIDDEN edit: body says "Rotary Awards Scholarship" and you return "Rotary Honors 2026 Scholarship" — that changed the author\'s words and invented "2026", which is not allowed. Another FORBIDDEN move: inventing a one-word subtitle like "Recipients" when the body has no subtitle. When in doubt, return the exact body text or null — never your own words.',
    '',
    'Return ONLY valid JSON — no preamble, no backticks, no markdown:',
    '{',
    '  "title": "see TITLE RULES",',
    '  "subtitle": "see TITLE RULES — string or null",',
    '  "writer": "see WRITER RULES — string or null",',
    '  "writerTitle": "string or null",',
    '  "cowriter": "string or null",',
    '  "cowriterTitle": "string or null",',
    '  "photographer": "see PHOTO CREDIT RULES — string or null",',
    '  "teaser": "see TEASER RULES",',
    '  "shortSummary": "see SHORT SUMMARY RULES",',
    '  "bodyWithHeaders": "see BODY RULES",',
    '  "altered": ["field names you SHORTENED from their table values — e.g. [\'subtitle\'] — or [] if none"]',
    '}',
    '',
    'TITLE RULES:',
    '- The title must come from the article body EXACTLY as written. NEVER invent, rephrase, compose, or "improve" a headline — extract the real title verbatim from the body\'s own opening headline/title line.',
    '- If the body does not contain a clear headline, set "title" to null. Do NOT create one.',
    '- If the natural title splits on a colon, em-dash, or similar (e.g. "Main Part: Descriptive Part"), put the main part in "title" and the descriptive part in "subtitle" — both VERBATIM, no rewording.',
    '- If the verbatim title (with no natural split) is longer than 60 characters, split it at a word boundary: put as much of the ACTUAL title text as fits (60 characters or fewer) into "title", and put the remaining ACTUAL title text into "subtitle". Both pieces must be exact substrings of the real title — never paraphrase either one.',
    '- "subtitle" must come ONLY from an explicit subtitle in the body, a natural title split, or overflow from a too-long title as described above. If none of those apply, set "subtitle" to null. Never invent a subtitle. Subtitle must be 60 characters or fewer.',
    '',
    'SOURCE METADATA TABLE (highest authority when present):',
    '- The user message may include a "SOURCE METADATA TABLE" section: label/value pairs the publisher typed into a metadata table at the top of their document. These are the author\'s OWN declarations and they OUTRANK anything you infer from the prose.',
    '- When a table value exists for a field, use it VERBATIM. Do not re-derive that field from the body. Do not "improve" it. If the table says the Title is "Home Inspiration", the title is exactly "Home Inspiration" — not a headline you found in the prose, not a longer version.',
    '- LENGTH CAPS — the ONE case where you may alter a table value: "title" and "subtitle" must each be 60 characters or fewer. If a table value is longer, SHORTEN it to fit using ONLY words that already appear in that value. Drop words; never add, never substitute a synonym, never rephrase, never re-order. Keep the opening words wherever possible so the author\'s framing survives. Example: "Turning an aging swing set area into a striking outdoor living space" (68) → "Turning a swing set area into a striking outdoor space" (54) — every word retained is one the author wrote. FORBIDDEN: "Backyard Playground Becomes Stunning Pergola Retreat" — those are your words, not theirs.',
    '- Report every table value you shortened in the "altered" array (see the JSON shape). If you did not shorten anything, return an empty array. This is how the interface knows to mark the field for human review — omitting it hides your edit from the operator.',
    '- Your job on these pairs is SPLITTING and TRIMMING ONLY — never composing. Every character you output for these fields must already appear in the table value.',
    '- Labels vary between publishers. Match on meaning, not exact spelling: "Title"/"Headline" → title; "Subtitle"/"Sub-head"/"Deck" → subtitle; "By Line"/"Byline"/"Author"/"By" → writer fields; "Photo Credit"/"Photographer"/"Photos" → photographer.',
    '- Ignore table rows that are not article fields (Word Count, Agreement #, Notes, Content Type, Client). Notes are instructions for the human operator — never fold Notes text into any field you return.',
    '',
    'WRITER RULES:',
    '- PREFERRED SOURCE: the By Line value from the SOURCE METADATA TABLE when present. Only fall back to scanning the body when the table has no byline row.',
    '- Strip a leading "By" or "By:" and any following whitespace (uploads often contain a double space) before extracting the name.',
    '- SPLIT on a comma OR a dash (-, \\u2013, \\u2014). The part BEFORE the separator is the person\'s name → "writer". The part AFTER is the tail.',
    '- TAIL HANDLING — SIMPLE AND UNCONDITIONAL: whatever text follows the separator goes into "writerTitle" VERBATIM. Do not judge whether it is a job title, a company, a department, or anything else. Do not compare it against any other field. Do not suppress it. If text is there, it is returned exactly as written; if there is no separator and no trailing text, "writerTitle" is null. Examples: "By Doug Drohan, Publisher" → writer "Doug Drohan", writerTitle "Publisher". "By  Dr. Jeffrey A. Pammer - Carbon Health & Wellness" → writer "Dr. Jeffrey A. Pammer", writerTitle "Carbon Health & Wellness". Both are correct — the field carries whatever the author wrote after their name.',
    '- TWO AUTHORS: if the name portion contains "and" or "&" joining two people, the first is "writer" and the second is "cowriter". Apply the same tail rules for "cowriterTitle". If only one author is named, "cowriter" and "cowriterTitle" are null.',
    '- Preserve honorifics and middle initials exactly as written ("Dr. Jeffrey A. Pammer" stays complete).',
    '- NEVER invent, infer, or guess an author or a job title. If no author is named, "writer" is null. If no job title is stated, "writerTitle" is null. A wrong byline is worse than an empty one.',
    '',
    'PHOTO CREDIT RULES:',
    '- PREFERRED SOURCE: a photo-credit row in the SOURCE METADATA TABLE (label matching Photo Credit / Photographer / Photos). Take the bare name from that cell. A By Line row is NOT a photo credit — never copy the writer into "photographer".',
    '- Fill "photographer" ONLY if the body contains explicit photo-credit language — e.g. "Photos by Jane Doe", "Photo credit: Doe Studios", "Photography by …", "Photos courtesy of …", or a credit line attached to an image.',
    '- Extract the photographer\'s name or business name EXACTLY as written. Do not include the credit prefix itself ("Photos by" etc.) — only the name.',
    '- If multiple photo credits name the same photographer, return the name once. If credits name different photographers, return the most prominent one (typically the first).',
    '- NEVER invent, infer, or guess a photographer. If no photo-credit language exists in the body, "photographer" is null. Do NOT assume the writer took the photos.',
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

  var TEASER_MAX   = 400;  // matches the ASF teaser field limit
  var SUMMARY_MAX  = 150;  // matches the ASF short-summary field limit
  var TITLE_MAX    = 60;   // v1.0.4 — fixed to match the ASF title field limit
                           // (was 90 in v1.0.3 — a mismatch that let titles
                           // overshoot the field the ASF actually enforces).
  var SUBTITLE_MAX = 60;   // matches the ASF sub-title field limit
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

  // v1.0.4 — deterministic backstop for the verbatim-title-overflow rule.
  // The model is instructed to do this split itself, but character counting
  // by a model is never guaranteed, so this is the can't-fail fallback:
  //   • If title fits within TITLE_MAX, nothing changes.
  //   • If title overflows AND no explicit subtitle was extracted, the
  //     overflow tail (the REAL title text, not invented) becomes the
  //     subtitle — word-boundary split, no ellipsis.
  //   • If title overflows AND an explicit subtitle was ALSO extracted
  //     (both slots already spoken for by real body content), we do NOT
  //     clobber the real subtitle — title is word-boundary truncated
  //     instead and a console warning is raised so the operator notices
  //     via the ASF's "See raw text" source check.
  function splitTitleOverflow(title, subtitle) {
    title = String(title || '').replace(/\s+/g, ' ').trim();
    subtitle = String(subtitle || '').trim();
    if (title.length <= TITLE_MAX) return { title: title, subtitle: subtitle };

    var slice = title.slice(0, TITLE_MAX);
    var sp = slice.lastIndexOf(' ');
    var cut = sp >= Math.floor(TITLE_MAX * 0.5) ? sp : TITLE_MAX;
    var head = title.slice(0, cut).trim();
    var tail = title.slice(cut).trim();

    if (!subtitle) {
      return { title: head, subtitle: clampText(tail, SUBTITLE_MAX) };
    }
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[InbxGenerate] title overflowed ' + TITLE_MAX +
        ' chars AND an explicit subtitle was already extracted — ' +
        'truncating title instead of overwriting the real subtitle. ' +
        'Check the source text to confirm.');
    }
    return { title: head, subtitle: subtitle };
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

  // v1.0.7 — Render the parsed metadata pairs as a plain label/value
  // block for the user message. Accepts either the ASF's parsed object
  // ({pairs:[{label,value}], map:{}}), a raw map, or a JSON string —
  // whichever the caller has. Returns '' when there is nothing to send,
  // which makes the whole feature a no-op on uploads with no table.
  function formatSourceMeta(sourceMeta) {
    if (!sourceMeta) return '';
    var meta = sourceMeta;
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch (e) { return ''; }
    }
    var lines = [];
    if (meta && Array.isArray(meta.pairs) && meta.pairs.length) {
      for (var i = 0; i < meta.pairs.length; i++) {
        var p = meta.pairs[i] || {};
        if (p.label && p.value) lines.push(String(p.label) + ': ' + String(p.value));
      }
    } else {
      var src = (meta && meta.map && typeof meta.map === 'object') ? meta.map : meta;
      if (!src || typeof src !== 'object') return '';
      for (var k in src) {
        if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
        var v = src[k];
        if (v == null || !String(v).trim()) continue;
        lines.push(prettyMetaKey(k) + ': ' + String(v).trim());
      }
    }
    return lines.length ? lines.join('\n') : '';
  }

  function prettyMetaKey(k) {
    return String(k)
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  // fromBody(bodyHtml [, sourceMeta])
  //   sourceMeta is OPTIONAL. Omitting it reproduces v1.0.6 behaviour
  //   exactly, so existing callers keep working untouched.
  function fromBody(bodyHtml, sourceMeta) {
    var html = (bodyHtml == null ? '' : String(bodyHtml)).trim();
    if (!html) {
      return Promise.reject(new Error('No body content to generate from.'));
    }

    var metaBlock = formatSourceMeta(sourceMeta);
    var userContent = metaBlock
      ? ('SOURCE METADATA TABLE (author\'s own declarations — highest authority):\n\n' +
         metaBlock +
         '\n\n---\n\nARTICLE BODY HTML:\n\n' + html)
      : ('ARTICLE BODY HTML:\n\n' + html);

    var payload = {
      model:      ANTHROPIC_MODEL,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: userContent }]
    };

    if (DEBUG && metaBlock) console.log('[InbxGenerate] source metadata supplied:\n' + metaBlock);

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
      var photographer  = strOrEmpty(out && out.photographer);   // v1.0.5

      // Re-ask ONLY the field(s) that ran long (usually none → no extra call),
      // then clamp as the can't-fail backstop.
      var jobs = [];
      if (teaser.length  > TEASER_MAX)  jobs.push(reaskShorten('article teaser', teaser, TEASER_MAX).then(function (t) { teaser = t; }));
      if (summary.length > SUMMARY_MAX) jobs.push(reaskShorten('short summary', summary, SUMMARY_MAX).then(function (s) { summary = s; }));

      return Promise.all(jobs).then(function () {
        // v1.0.4 — subtitle clamped first (explicit/split subtitle from the
        // model), THEN title overflow is checked against it so a too-long
        // verbatim title can donate its own overflow into an empty subtitle
        // slot without ever inventing text.
        var ts = splitTitleOverflow(title, clampText(subtitle, SUBTITLE_MAX));
        return {
          title:           ts.title,                           // v1.0.4
          subtitle:        ts.subtitle,                        // v1.0.4
          writer:          writer,                             // v1.0.3 — names never clamped
          writerTitle:     writerTitle,                        // v1.0.3
          cowriter:        cowriter,                           // v1.0.3
          cowriterTitle:   cowriterTitle,                      // v1.0.3
          photographer:    photographer,                       // v1.0.5 — names never clamped
          teaser:          clampText(teaser, TEASER_MAX),
          shortSummary:    clampText(summary, SUMMARY_MAX),
          bodyWithHeaders: body
        };
      });
    });
  }

  window.InbxGenerate = { fromBody: fromBody, _model: ANTHROPIC_MODEL, _version: '1.0.9' };

  if (DEBUG) console.log('[InbxGenerate] ready (model ' + ANTHROPIC_MODEL + ')');
})();
