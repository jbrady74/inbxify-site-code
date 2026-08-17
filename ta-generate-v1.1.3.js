/* ta-generate-v1.1.3.js
   ============================================================
   ta-generate-v1.1.1.js
   ============================================================
   INBXIFY · Generator field-derivation helper (Part B)

   Shared client helper that turns an article body into the AI-
   derived fields. Consumed by the ASF AI-assist now, and the
   Generator tab later — one path, one prompt.

   ── v1.1.1 — The model may no longer alter a title or subtitle ──
   LIVE BUG: a Wyckoff Living NOW upload declared, in its own metadata
   table, Title "Home Inspiration" and Subtitle "Turning an aging swing
   set area into a striking outdoor living space". What reached the ASF
   was neither. The publisher's own words came back rewritten.

   CAUSE: the prompt gave permission. Two lines did it.
     1. TITLE RULES — a >60-char title must be SPLIT across title and
        subtitle at a word boundary.
     2. SOURCE METADATA TABLE — "LENGTH CAPS — the ONE case where you
        may alter a table value": shorten it by dropping words. The
        worked example in that line was this exact headline.
   No amount of "NEVER invent" elsewhere outranks an explicit, exampled
   licence to edit. The model followed its instructions.

   FIX: the licence is gone. title and subtitle are extract-or-null with
   no exception for length. An over-limit value comes back in full;
   ta-asf v1.5.37 writes it verbatim, flags it over-limit, and the
   operator trims their own words.

   "altered" is kept for contract compatibility and is now always [].
   Nothing is alterable. ta-asf v1.5.36 also refuses engine writes to
   title / subtitle / writer at aiSetField, so this is defence in depth
   rather than the only guard.

   NOT CHANGED: teaser, shortSummary, headers. Those are the model's to
   write, and it should keep writing them.

   ── v1.1.0 — Body leaves the JSON (anchor-based headers) ──
   LIVE BUG this fixes: "Generation failed — Could not parse
   generated fields" survived the v1.0.10 hardening. That hardening
   repairs malformation AROUND the object (fences, preamble,
   trailing commas). It cannot repair malformation INSIDE it — an
   unescaped " or a raw newline in "bodyWithHeaders" still kills the
   parse, and the carve fallback hands JSON.parse the same broken
   string. Trigger case: a 6.3KB library article carrying 106 double
   quotes (39 class="", 14 style="background-color: #ffff00;") and
   20 literal newlines, every one of which the model had to escape
   perfectly while also inserting <h2>s.

   FIX — the body no longer travels inside JSON at all.
     The model now returns:
       "headers": [{ "text": "...", "anchorAfter": "first 8-12 words
                     of the paragraph this header goes before" }]
     insertHeaders() parses the ORIGINAL body into a DOM, matches
     each anchor against block-level textContent, and inserts plain
     <h2> nodes. The article is never re-emitted, never re-escaped,
     never round-tripped.

   THREE CONSEQUENCES:
   (1) The dominant parse-failure mode is structurally gone. What
       crosses the wire is short plain text.
   (2) The model has no channel to alter article text. The old BODY
       RULES could only ASK it not to rewrite, with no detection if
       it did. Now it is impossible.
   (3) Failure is partial, not total. A bad anchor costs ONE header;
       the operator still gets 3 of 4 plus every other field. A
       parse failure used to wipe the whole auto-fill.

   ALSO FIXED — "altered" passthrough (silent since v1.0.9):
     ta-asf v1.5.29+ reads out.altered to badge AI-shortened table
     values, but fromBody() never included "altered" in its return
     object. The model reported it, the prompt specified it, and it
     was dropped on the floor — so the badge has never fired. Now
     passed through. No ASF change needed.

   max_tokens 8192 → 2048. The body was the only thing that needed
   headroom. Truncation risk on long articles goes to nil.

   DEBUG is now runtime-switchable: set window.TA_CONFIG.generateDebug
   = true in the console to trace without a redeploy.

   CONTRACT UNCHANGED for consumers. bodyWithHeaders is still
   returned — synthesized client-side after insertion. ta-asf
   v1.5.34 consumes it at ONE site (line 6290) and needs no change.
   New non-breaking keys: altered, headersInserted, headersMissed.

   ── v1.0.10 — Parse-failure fix (July 22, same day as 1.0.9) ──
   LIVE BUG: v1.0.9 produced "Generation failed — Could not parse
   generated fields from the model response" on first use, wiping
   the whole auto-fill.

   Cause was mine, in the v1.0.9 prompt. The JSON template line for
   the new "altered" key embedded a quoted example INSIDE the value
   description:
       "altered": ["field names … e.g. ['subtitle'] … "]
   Every other key in that template carries a plain "see X RULES"
   pointer. The nested quotes/brackets invited the model to echo
   that shape literally, producing malformed JSON.

   FIX (two parts):
   (1) The template line now reads   "altered": "see ALTERED RULES"
       matching every sibling key, with a dedicated ALTERED RULES
       block at the end of the prompt spelling out the exact shape
       ([] · ["subtitle"] · ["title","subtitle"]) and forbidding
       objects/nested arrays.
   (2) parseJson() is no longer all-or-nothing. It now strips fences,
       falls back to carving the outermost {...} out of any
       surrounding prose, and finally repairs trailing commas before
       giving up. A single stray character no longer costs the
       operator the entire generation.

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
  var ANTHROPIC_MAX_TOKENS = 2048;   // v1.1.0 — body no longer re-emitted; output is short fields + header specs
  var DEBUG                = false;

  // v1.1.0 — runtime-switchable. window.TA_CONFIG.generateDebug = true
  // traces a live generation with no file edit, no push, no CDN purge.
  function dbg() {
    return DEBUG || !!(window.TA_CONFIG && window.TA_CONFIG.generateDebug);
  }

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
    '  "headers": "see HEADER RULES",',
    '  "altered": "see ALTERED RULES"',
    '}',
    '',
    'TITLE RULES:',
    '- The title must come from the article body EXACTLY as written. NEVER invent, rephrase, compose, or "improve" a headline — extract the real title verbatim from the body\'s own opening headline/title line.',
    '- If the body does not contain a clear headline, set "title" to null. Do NOT create one.',
    '- If the natural title splits on a colon, em-dash, or similar (e.g. "Main Part: Descriptive Part"), put the main part in "title" and the descriptive part in "subtitle" — both VERBATIM, no rewording.',
    '- LENGTH IS NOT YOUR PROBLEM. There is no character limit on what you return for "title" or "subtitle". If the real title runs 200 characters, return all 200. Do NOT split it, do NOT trim it, do NOT move its tail into "subtitle" to make it fit. The form downstream flags an over-length value and a human trims it. A shortened headline is a failure even when every word you kept was the author\'s.',
    '- "subtitle" must come ONLY from an explicit subtitle in the body or a natural colon/dash split as described above. If neither applies, set "subtitle" to null. Never invent a subtitle, and never manufacture one out of an over-long title.',
    '',
    'SOURCE METADATA TABLE (highest authority when present):',
    '- The user message may include a "SOURCE METADATA TABLE" section: label/value pairs the publisher typed into a metadata table at the top of their document. These are the author\'s OWN declarations and they OUTRANK anything you infer from the prose.',
    '- When a table value exists for a field, use it VERBATIM. Do not re-derive that field from the body. Do not "improve" it. If the table says the Title is "Home Inspiration", the title is exactly "Home Inspiration" — not a headline you found in the prose, not a longer version.',
    '- THERE IS NO EXCEPTION FOR LENGTH. A table value is returned character-for-character however long it is. You may not shorten it, split it, drop words from it, or move part of it into another field. Worked example — the table says Title: "Home Inspiration" and Subtitle: "Turning an aging swing set area into a striking outdoor living space". CORRECT: title "Home Inspiration", subtitle "Turning an aging swing set area into a striking outdoor living space", both complete, both untouched. FORBIDDEN: "Turning a swing set area into a striking outdoor space" — shorter, every word the author\'s, and still wrong, because the author did not write that sentence.',
    '- Your job on these pairs is COPYING. Not splitting, not trimming, not composing. If you find yourself deciding which words to keep, you have already made a mistake.',
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
    'HEADER RULES:',
    '- "headers" is a JSON array of 2 to 5 objects. Each object has EXACTLY two string keys: "text" and "anchorAfter".',
    '- "text" is a concise descriptive section header you write. Under 60 characters. Plain text only \u2014 no HTML, no quotation marks, no colons at the end.',
    '- "anchorAfter" is the FIRST 8 TO 12 WORDS, VERBATIM, of the paragraph that the header should be placed IMMEDIATELY BEFORE.',
    '- Write anchorAfter as PLAIN TEXT: strip all HTML tags, and write characters literally \u2014 an apostrophe is an apostrophe, never &rsquo; or &amp;. It is a lookup key, not markup.',
    '- Copy the anchor words exactly as the author wrote them. Do not paraphrase, do not shorten a word, do not correct a typo, do not skip a word. If the anchor does not match the real paragraph, that header is silently dropped.',
    '- Anchors must appear in document order, first to last, and no paragraph may be anchored twice.',
    '- Never anchor to the very first paragraph of the article.',
    '- Do NOT return the article body. Do NOT return any HTML at all. The headers are inserted into the author\'s original markup automatically \u2014 your job is the header text and the lookup key, nothing else.',
    '- Whether this article needs headers at all has ALREADY been decided before you were called. If the user message contains a NO HEADERS instruction, return an empty array and nothing else on this subject. Otherwise the article has NO headers of its own and you must return them.',
    '- Any <h2> you see in the body is a header from an earlier pass of this same tool, not the author\'s. It is about to be removed and replaced by what you return. Do not treat it as a reason to return fewer headers, and do not reuse its wording.',
    '- Cover the WHOLE article. Walk it start to finish and give every stretch of consecutive paragraphs its own header. Any run of roughly 200 words or more without a header above it needs one. An empty array on an article with unheaded stretches is a failure.',
    '',
    'ALTERED RULES:',
    '- "altered" is a JSON array and it is ALWAYS empty: []',
    '- It exists only for backward compatibility. You may not alter any field, so there is never anything to report here.',
    '- If you are about to put a field name in this array, stop — it means you were about to shorten something you must return in full.'
  ].join('\n');

  function extractText(data) {
    if (!data || !Array.isArray(data.content)) return '';
    return data.content
      .filter(function (b) { return b && b.type === 'text' && typeof b.text === 'string'; })
      .map(function (b) { return b.text; })
      .join('\n');
  }

  // v1.0.10 — Resilient parse. The model occasionally wraps its JSON in
  // prose, fences it inconsistently, or emits a trailing comma. Previously
  // ANY of those threw and the operator lost the whole generation with
  // "Could not parse generated fields from the model response." Now we
  // recover where the payload is obviously present and only fail when
  // there is genuinely no JSON object to read.
  function parseJson(text) {
    var raw = String(text || '');
    // v1.1.0 — an empty extract is a PROXY/response-shape failure, not a
    // model-formatting one. It used to surface as the same parse error,
    // which sent every diagnosis down the wrong path.
    if (!raw.trim()) {
      throw new Error('The AI proxy returned an empty response \u2014 no content to read.');
    }
    // 1 — strip code fences (```json … ``` or bare ```)
    var clean = raw.replace(/```[a-zA-Z]*\s*/g, '').replace(/```/g, '').trim();

    // 2 — straight parse
    try { return JSON.parse(clean); } catch (e) {}

    // 3 — carve out the outermost {...} in case the model added a preamble
    //     or a sign-off around the object.
    var first = clean.indexOf('{');
    var last  = clean.lastIndexOf('}');
    if (first !== -1 && last > first) {
      var carved = clean.slice(first, last + 1);
      try { return JSON.parse(carved); } catch (e2) {
        // 4 — last resort: drop trailing commas before } or ], which are
        //     the single most common malformation in generated JSON.
        var repaired = carved.replace(/,\s*([}\]])/g, '$1');
        try { return JSON.parse(repaired); } catch (e3) {}
      }
    }
    if (dbg()) console.warn('[InbxGenerate] unparseable model output:', raw);
    throw new Error('Could not parse generated fields from the model response.');
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

  // ── v1.1.0 — client-side header insertion ─────────────────
  // Matches each anchor phrase against the block-level children of the
  // ORIGINAL body and inserts a plain <h2> before the matched block.
  // Three-tier match (prefix → contains → 5-word probe) because the
  // model may normalise whitespace or entities in the anchor even when
  // told not to. Anchors are consumed once each and searched forward
  // from the last match, so a phrase repeated in the article cannot
  // double-insert or scramble document order.
  //
  // If NOTHING is inserted the caller gets the original string back
  // byte-for-byte — important, because DOMParser round-tripping
  // normalises markup (<br /> → <br>, &rsquo; → ’) and ta-asf treats
  // any difference as a body rewrite worth an Undo.
  var MAX_HEADERS = 5;

  // v1.1.2 — block-level selector. Word/DOCX uploads arrive wrapped:
  // a whole section is ONE top-level <div> with the real paragraphs
  // nested inside it, or separated only by <br>. v1.1.1 walked
  // root.children and nothing else, so a 6.3KB article presented as
  // seven top-level nodes offered seven insertion points — three of
  // them already <h2> — and headers had nowhere legal to land.
  var BLOCK_SEL = 'p,h1,h2,h3,h4,h5,h6,li,blockquote,pre,div';

  function isLeafBlock(el) {
    // A container that holds other blocks is not itself a target —
    // its children are. This keeps us on the leaves.
    try { return !el.querySelector(BLOCK_SEL); } catch (e) { return true; }
  }

  function inTable(el) {
    try { return !!(el.closest && el.closest('table')); } catch (e) { return false; }
  }

  // v1.1.2 — <br><br> between paragraphs is a real paragraph
  // boundary. Promote those runs to sibling blocks so each one can
  // carry a header. Mutates the parsed DOM only; the caller still
  // returns the original string byte-for-byte when nothing is added.
  function splitOnBreaks(root) {
    var all, i, list = [];
    try { all = root.querySelectorAll(BLOCK_SEL); } catch (e) { return; }
    for (i = 0; i < all.length; i++) {
      if (!isLeafBlock(all[i])) continue;
      if (inTable(all[i])) continue;
      if (all[i].querySelector('br')) list.push(all[i]);
    }
    for (i = 0; i < list.length; i++) {
      var el = list[i], doc2 = el.ownerDocument;
      var kids = Array.prototype.slice.call(el.childNodes);
      var groups = [[]], n, k;
      for (n = 0; n < kids.length; n++) {
        k = kids[n];
        if (k.nodeType === 1 && String(k.tagName).toLowerCase() === 'br') {
          if (groups[groups.length - 1].length) groups.push([]);
          continue;
        }
        groups[groups.length - 1].push(k);
      }
      var keep = [], m, txt;
      for (n = 0; n < groups.length; n++) {
        txt = '';
        for (m = 0; m < groups[n].length; m++) txt += groups[n][m].textContent || '';
        if (String(txt).replace(/\u00a0/g, ' ').trim()) keep.push(groups[n]);
      }
      if (keep.length < 2) continue;
      var tag  = String(el.tagName || 'p').toLowerCase();
      var outT = (tag === 'div' || tag === 'pre') ? 'p' : tag;
      var frag = doc2.createDocumentFragment();
      for (n = 0; n < keep.length; n++) {
        var np = doc2.createElement(outT);
        for (m = 0; m < keep[n].length; m++) np.appendChild(keep[n][m]);
        frag.appendChild(np);
      }
      if (el.parentNode) el.parentNode.replaceChild(frag, el);
    }
  }

  function collectBlocks(root) {
    var out = [], all, i, el, t;
    try { all = root.querySelectorAll(BLOCK_SEL); } catch (e) { all = []; }
    for (i = 0; i < all.length; i++) {
      el = all[i];
      if (!isLeafBlock(el)) continue;
      if (inTable(el)) continue;
      t = normText(el.textContent);
      if (!t) continue;
      out.push({ el: el, tag: String(el.tagName || '').toLowerCase(), text: t });
    }
    if (out.length) return out;
    // Last resort — the v1.1.1 behaviour, so a body with no
    // recognised block markup at least degrades the way it used to
    // instead of returning nothing.
    for (i = 0; i < root.children.length; i++) {
      out.push({
        el:   root.children[i],
        tag:  String(root.children[i].tagName || '').toLowerCase(),
        text: normText(root.children[i].textContent)
      });
    }
    return out;
  }

  function normText(s) {
    var t = String(s == null ? '' : s)
      .replace(/<[^>]*>/g, ' ')                    // model leaked markup into the anchor
      .replace(/&[a-zA-Z]+[0-9]*;|&#[0-9]+;/g, ' ')  // ...or an unresolved entity (&rsquo;)
      .replace(/\u00a0/g, ' ');
    // v1.1.3 - fold accents BEFORE the a-z filter. Without this the
    // filter turned the source's "quinceanera" (with tilde) into
    // "quincea era" while the model's anchor stayed "quinceanera",
    // so the two could never match and the header vanished. Live case
    // in the Rojas article.
    if (t.normalize) {
      try { t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
    }
    return t
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function findBlock(blocks, anchor, from, used) {
    var i, probe;
    for (i = from; i < blocks.length; i++) {              // 1 — prefix
      if (used[i] || !blocks[i].text) continue;
      if (blocks[i].text.indexOf(anchor) === 0) return i;
    }
    for (i = from; i < blocks.length; i++) {              // 2 — contains
      if (used[i] || !blocks[i].text) continue;
      if (blocks[i].text.indexOf(anchor) !== -1) return i;
    }
    probe = anchor.split(' ').slice(0, 5).join(' ');      // 3 — short probe
    if (probe) {
      for (i = from; i < blocks.length; i++) {
        if (used[i] || !blocks[i].text) continue;
        if (blocks[i].text.indexOf(probe) === 0) return i;
      }
    }
    return -1;
  }

  // v1.1.3 — remove the <h2>s THIS tool inserted on a previous pass,
  // matched by their normalised text. Text is used rather than a
  // marker attribute because Trix does not preserve attributes on
  // heading blocks: a data-* marker is gone the moment the operator
  // clicks into the editor. Text survives.
  // Without this, Regenerate stacked a second set of headers beside
  // the first instead of replacing them.
  function stripPriorHeaders(root, texts) {
    if (!texts || !texts.length) return 0;
    var want = {}, i, k;
    for (i = 0; i < texts.length; i++) {
      k = normText(texts[i]);
      if (k) want[k] = true;
    }
    var hs, kill = [], n = 0;
    try { hs = root.querySelectorAll('h2'); } catch (e) { return 0; }
    for (i = 0; i < hs.length; i++) {
      if (want[normText(hs[i].textContent)]) kill.push(hs[i]);
    }
    for (i = 0; i < kill.length; i++) {
      if (kill[i].parentNode) { kill[i].parentNode.removeChild(kill[i]); n++; }
    }
    return n;
  }

  // headers      — [{text, anchorAfter}] from the model
  // priorTexts   — header texts inserted on the previous pass, removed first
  function insertHeaders(html, headers, priorTexts) {
    var out = { html: html, inserted: 0, missed: [], candidates: 0,
                texts: [], stripped: 0 };
    var hasNew = Array.isArray(headers) && headers.length;
    var hasOld = Array.isArray(priorTexts) && priorTexts.length;
    if (!hasNew && !hasOld) return out;
    if (typeof DOMParser === 'undefined') return out;

    var doc, root;
    try {
      doc  = new DOMParser().parseFromString('<div id="ixgen-root">' + html + '</div>', 'text/html');
      root = doc.getElementById('ixgen-root');
    } catch (e) { return out; }
    if (!root || !root.children.length) return out;

    // v1.1.3 — clear last pass's headers BEFORE anything else, so the
    // block walk sees the article as it was, not as we left it.
    out.stripped = stripPriorHeaders(root, priorTexts);

    // v1.1.2 — promote <br>-separated paragraphs to real blocks, THEN
    // collect leaf blocks anywhere in the subtree. Both steps are new;
    // v1.1.1 saw only the top level.
    splitOnBreaks(root);
    var blocks = collectBlocks(root);
    out.candidates = blocks.length;
    if (!blocks.length) return out;

    var used = {}, cursor = 0, added = 0;

    for (var h = 0; h < headers.length && added < MAX_HEADERS; h++) {
      var spec = headers[h] || {};
      var text = String(spec.text == null ? '' : spec.text).trim();
      var anch = normText(spec.anchorAfter);
      if (!text || !anch) { out.missed.push(text || '(no text)'); continue; }

      var idx = findBlock(blocks, anch, cursor, used);
      if (idx === -1) idx = findBlock(blocks, anch, 0, used);   // out-of-order rescue
      if (idx === -1) { out.missed.push(text + ' \u2014 no anchor match'); continue; }

      used[idx] = true;
      cursor    = idx + 1;

      // Skip if that spot is already headed — honours existing <h2>s
      // without the model having to reason about them.
      // v1.1.2 — this used to `continue` silently, so a header lost here
      // was invisible in BOTH the inserted count and the missed list.
      // The 0-inserted / 0-missed signature was unreadable as a result.
      var prev = blocks[idx].el.previousElementSibling;
      if (blocks[idx].tag === 'h2' || (prev && String(prev.tagName).toLowerCase() === 'h2')) {
        out.missed.push(text + ' \u2014 that spot is already headed');
        continue;
      }

      var h2 = doc.createElement('h2');
      h2.textContent = text;
      blocks[idx].el.parentNode.insertBefore(h2, blocks[idx].el);
      out.texts.push(text);          // v1.1.3 — remembered for the next pass
      added++;
    }

    // v1.1.3 — a pass that only REMOVED stale headers still changed the
    // document and must return the changed markup.
    if (added || out.stripped) { out.html = root.innerHTML; }
    out.inserted = added;
    return out;
  }

  // fromBody(bodyHtml [, sourceMeta])
  //   sourceMeta is OPTIONAL. Omitting it reproduces v1.0.6 behaviour
  //   exactly, so existing callers keep working untouched.
  // opts (all optional):
  //   hasAuthorHeaders  true  → the AUTHOR sectioned this article. Do not
  //                             generate headers at all. Decided by the
  //                             caller against the pristine upload, NOT
  //                             guessed here and NOT guessed by the model.
  //   priorHeaderTexts  header texts inserted on the previous pass;
  //                             removed before new ones go in.
  function fromBody(bodyHtml, sourceMeta, opts) {
    opts = opts || {};
    var skipHeaders = !!opts.hasAuthorHeaders;
    var priorTexts  = Array.isArray(opts.priorHeaderTexts) ? opts.priorHeaderTexts : [];
    var html = (bodyHtml == null ? '' : String(bodyHtml)).trim();
    if (!html) {
      return Promise.reject(new Error('No body content to generate from.'));
    }

    // v1.1.3 — the stand-down instruction, when it applies. Stated in
    // the user message rather than the system prompt because it is a
    // per-document fact, not a standing rule.
    var hdrNote = skipHeaders
      ? 'NO HEADERS: this article already carries the author\'s own section headers. Return "headers": [] and propose none.\n\n'
      : '';

    var metaBlock = formatSourceMeta(sourceMeta);
    var userContent = metaBlock
      ? (hdrNote + 'SOURCE METADATA TABLE (author\'s own declarations — highest authority):\n\n' +
         metaBlock +
         '\n\n---\n\nARTICLE BODY HTML:\n\n' + html)
      : (hdrNote + 'ARTICLE BODY HTML:\n\n' + html);

    var payload = {
      model:      ANTHROPIC_MODEL,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: userContent }]
    };

    if (dbg() && metaBlock) console.log('[InbxGenerate] source metadata supplied:\n' + metaBlock);

    if (dbg()) console.log('[InbxGenerate] POST to anthropicProxy', payload);

    return postMessages(payload).then(function (raw) {
      // v1.1.0 — parseJson now throws its own specific message (empty
      // proxy response vs malformed JSON). The old blanket re-throw
      // collapsed both into one string and hid which had happened.
      var out = parseJson(raw);

      var teaser  = (out && out.teaser) || '';
      var summary = (out && out.shortSummary) || '';

      // v1.1.0 — headers arrive as {text, anchorAfter} specs; the <h2>s
      // go into the author's ORIGINAL markup here. Zero insertions
      // returns the caller's exact input string, untouched.
      // v1.1.2 — log the MODEL's own output before insertion. Without
      // this, "inserted: 0" could not be told apart from "the model
      // returned nothing", which is the whole diagnosis.
      if (dbg()) {
        var hs = (out && out.headers);
        console.log('[InbxGenerate] model returned ' +
          (Array.isArray(hs) ? hs.length + ' header spec(s)' : 'NO headers array'), hs || null);
      }
      // v1.1.3 — the switch wins over whatever the model returned.
      var specs = skipHeaders ? [] : ((out && out.headers) || []);
      var ins   = insertHeaders(html, specs, priorTexts);
      // v1.1.3 — also take the rebuilt markup when the pass only removed
      // stale headers (Regenerate on an article that now needs none).
      var body = (ins.inserted || ins.stripped) ? ins.html
               : String(bodyHtml == null ? '' : bodyHtml);
      if (dbg()) {
        console.log('[InbxGenerate] headers ' +
                    (skipHeaders ? 'SKIPPED (author headers present)'
                                 : 'inserted: ' + ins.inserted +
                                   ' of ' + ins.candidates + ' candidate blocks') +
                    (ins.stripped ? ' \u00b7 stripped ' + ins.stripped + ' from prior pass' : '') +
                    (ins.missed.length ? ' \u00b7 missed: ' + ins.missed.join(' | ') : ''));
      }

      // v1.1.0 — restored passthrough. ta-asf reads this to badge any
      // table value the model shortened; it has been dropped since 1.0.9.
      var altered = (out && Array.isArray(out.altered)) ? out.altered : [];
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
          bodyWithHeaders: body,             // v1.1.0 — synthesized client-side
          altered:         altered,          // v1.1.0 — passthrough restored
          headersInserted: ins.inserted,     // v1.1.0 — diagnostics, additive
          headersMissed:   ins.missed,       // v1.1.0 — anchors that found no match
          headerCandidates: ins.candidates,  // v1.1.2 — insertable blocks found
          headerTexts:     ins.texts,        // v1.1.3 — pass back on the NEXT call
          headersStripped: ins.stripped,     // v1.1.3 — prior-pass headers removed
          headersSkipped:  skipHeaders       // v1.1.3 — author sectioned it themselves
        };
      });
    });
  }

  window.InbxGenerate = { fromBody: fromBody, _model: ANTHROPIC_MODEL, _version: '1.1.3' };

  if (dbg()) console.log('[InbxGenerate] ready (model ' + ANTHROPIC_MODEL + ')');
})();
