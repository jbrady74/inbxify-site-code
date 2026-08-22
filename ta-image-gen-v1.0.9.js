/* ta-image-gen-v1.0.9.js
   ============================================================
   ── v1.0.9 — THE CRITIQUE LOOP. (Aug 22) ──
   Every bump through v1.0.8 tried to make the FIRST prompt better.
   None of them gave the operator a way to act on a bad RESULT. The
   observed loop was: generate, dislike, press "Discard & redraw",
   regenerate against a prompt that had learned nothing, repeat 3–4
   times. Each cycle spent a Flux credit and the rejection was thrown
   away. That is not a prompting problem; it is a missing feedback path.

   WHAT CHANGES:
   · CRITIQUE field. The operator types a plain complaint ("hair too
     dark, background too busy"). It goes to the model WITH THE CURRENT
     PROMPT and comes back as an AMENDED prompt — minimal edit, not a
     redraft. Everything not complained about survives verbatim. This
     is the whole point: runDraft() rewrites from the article and
     destroys the parts you liked; amendPrompt() does not.
   · AMEND and GENERATE are separate buttons. Amend is a text call and
     spends no image credit. Generate is the ONLY action that spends
     one. The operator reads the amended words BEFORE paying. This is
     the mechanism that ends the blind credit burn.
   · HISTORY. s.history keeps every generated attempt with the prompt
     that produced it. "Discard & redraw" no longer destroys the prior
     image — previous and current render side by side, same size, so
     the operator compares rather than remembers. Any attempt can be
     kept, not just the newest.
   · TWO-PANE LAYOUT. Images left (~40%), prompt right (~60%). The
     prompt is the artifact under edit and gets real estate: ~14 rows
     visible, no scrolling for a normal prompt. Replaces the 560px
     centre-modal with a full-height working surface.
   · CHANGED-WORDS strip. A textarea cannot render coloured spans (the
     same constraint that put publisher notes ABOVE the box in v1.0.3),
     so the amendment diff surfaces as its own chip row directly above
     the prompt. You can see what the amendment did without diffing by
     eye.

   UNCHANGED: SYSTEM_PROMPT and the register it establishes, BANNED[]
   and the validator, the people control, publisher-notes handling,
   the decline branch, Scenario L create, the ASF hand-off, and the
   no-re-render-while-typing rule. No new config keys, no Worker
   change, no new HC entries. HC-IMG-001..005 unchanged.

   DEFERRED to v1.0.10 (was scoped for this bump, deliberately held):
   structured drafter output + deterministic assembly + the automated
   golden-set runner. The critique loop is the measured bottleneck and
   ships alone so it can be judged alone. GOLDEN-SET-v0_1.md still
   governs: no SYSTEM_PROMPT change ships without all 7 passing — and
   this bump does not touch SYSTEM_PROMPT.
   ============================================================
   ── v1.0.8 — Register fix + prompt validator. (Aug 18) ──
   v1.0.7's realism push aimed at the wrong register: "imperfection"
   plus a wear/clutter menu produced distressed-property photos in a
   product whose whole job is making the town look worth living in.
   REGISTER now: upscale community lifestyle magazine — well-kept,
   inviting, bright natural light. "Lived-in, not sterile": evidence
   of life (coffee cup, keys in a dish, dog bed), never evidence of
   decay. Camera block, people rules, decline logic, notes handling
   all unchanged from v1.0.7.
   NEW: client-side prompt validator (TOAST-TRUTH for the drafter).
   Banned vocabulary is data (BANNED[]); every prompt — drafted or
   hand-edited — is checked before generation. Violations render as
   red chips under the textarea, live per keystroke; a clean prompt
   shows "passes house rules". Generate soft-gates via confirm() on
   violations — override allowed, blind spend not.
   v1.0.9 (scoped): structured drafter output + deterministic
   assembly + golden-set fixtures (7 frozen WLN articles).
   ============================================================
   ── v1.0.7 — PHOTOGRAPHIC REALISM + people control. (Aug 18) ──

   THE POINT OF THIS BUMP: make the output stop looking generated.
   Every prior bump either ignored image quality or attacked it only
   by BANNING things (v1.0.6). This one says what a real photograph
   looks like: named consumer gear and film stock, deep focus, flat
   ambient light, ordinary eye-level vantage, honest unretouched
   colour, and at least one piece of real clutter that a careful
   photographer would have moved and a local reporter did not. Plus a
   hard ban on the render vocabulary ("stunning", "8k", "cinematic",
   "highly detailed") that summons the look directly.
   See the comment block above SYSTEM_PROMPT for the full reasoning.

   ALSO IN THIS BUMP:
   · PEOPLE control on the modal — three-state segmented control
     (None / One, working / A few, mid-distance) above the prompt box.
     The drafter never invents a figure; the operator adds them.
     Selecting a state REDRAFTS via Haiku rather than appending a
     clause, because Flux reads a bolted-on "add a person" as an
     afterthought and pastes a figure into a scene not composed for
     one. Defaults to None on EVERY open — no session persistence,
     since the right answer is per-article.
   · Decline branch scoped to safety ONLY. A v1.0.6 regression had
     Haiku reading drafting guidance as eligibility criteria and
     refusing abstract articles ("no concrete physical subject").
     Section 8 now states the single legitimate ground and forbids
     the rest by name; section 6 tells it to infer a setting from the
     subject domain.

   No new config keys, no Worker change, no new HC entries.
   HC-IMG-001..005 unchanged.
   ============================================================
   ── v1.0.3 — Publisher notes feed the image prompt (July 22) ──
   The upload metadata table's Notes cell is often the only place
   anyone states what the picture should show. Notes are read from
   ta-asf's parsed S.sourceMetadata and passed to the drafter as a
   client brief, with instructions to use only text describing SUBJECT
   MATTER and to ignore layout/production directions entirely.
   New JSON key "usedNotes" reports whether the notes shaped the draft.

   INBXIFY · ASF main-image generation (Flux 2 Pro)

   Companion module — does NOT edit ta-asf. It self-wires to the
   existing "✨ Generate" button (data-asf-action="generate-main")
   by intercepting the click in the capture phase.

   ── FLOW ──
   1. Click "✨ Generate" on the main-image zone (Article, create or edit).
   2. Claude Haiku drafts an image prompt via the Anthropic proxy.
   3. Modal shows the prompt, EDITABLE, with the gold dirty border and a
      Cancel link, plus the People control and the collapsed
      "what was sent to the drafter" panel.
   4. "Generate image" → POST { prompt, width, height } to the fluxgen
      Worker → permanent Uploadcare UUID + URL.
   5. "Use as main image" → Scenario L creates an Available MEDIA row and
      returns its mediaId → handed to the ASF's own setMainImageFromMedia
      so the slot goes dirty and SAVE assigns it. Assignment stays the
      ASF's job. Scenario B is NOT involved: the Worker already
      conditioned the image onto Uploadcare.

   ── CONFIG (TA_CONFIG) ──
     anthropicProxy     already present — used by ta-rte / ta-generate
     fluxGen            'https://fluxgen.jeff-2cd.workers.dev'
     makeGenerateMedia  the Scenario L webhook URL

   ── HARDCODING ──
     HC-IMG-001  fluxGen Worker URL read from TA_CONFIG.fluxGen
     HC-IMG-002  model 'flux-2-pro' (Worker-side; client sends none)
     HC-IMG-003  default 1024×1024 square — SEE DELIVERY NOTE: square is
                 itself a realism tell; 3:2 is the editorial-photo shape
     HC-IMG-004  prompt model 'claude-haiku-4-5' (matches ta-generate)
     HC-IMG-005  dirty/selected border token --ipp-edit-dirty-border
     HC-IMG-006  NEW v1.0.7 — house style note key `imageStyleNote` inside
                 TITLES-ADMIN `default-layout-json`, read via [data-tdl-json];
                 TA_CONFIG.imageStyleNote overrides. Absent = no injection.
                 No town/county/state string lives in this file.
     (component-role intentionally NOT written — see TD-IMG-ROLE)
   ============================================================ */
(function () {
  'use strict';

  var VERSION = '1.0.9';
  // HC-IMG-004 — Sonnet, not Haiku. Writing photographic direction is a
  // craft task; Haiku summarises well but drafts flat, generic prompts.
  var PROMPT_MODEL = 'claude-sonnet-4-6';
  // HC-IMG-003 — 1440 square, was 1024 square.
  // Square is the platform intake convention (publisher spec is 1400px
  // square JPEG; the RE field slug is literally
  // main-image-ulc-link---1-1-ratio) and Uploadcare crops per slot from
  // one source — 16:9 for FA-1/FA-2, 1:1 for FA-3/FA-4.
  // 1440 not 1024 because HC-025 badges anything under 1400px as
  // LOW-RES in the ASF picker, Workbench and Intake Manager. At 1024
  // every generated image tripped that gate and offered an Upscale for
  // an image that was born clean. 1440 clears the threshold with margin.
  var DEFAULT_W = 1440, DEFAULT_H = 1440;

  function cfg() { return window.TA_CONFIG || {}; }
  function proxyUrl() { return cfg().anthropicProxy || ''; }
  function fluxUrl()  { return cfg().fluxGen || ''; }   // HC-IMG-001
  function log() { if (cfg().debug) try { console.log.apply(console, ['[img-gen v' + VERSION + ']'].concat([].slice.call(arguments))); } catch (e) {} }

  /* ── Prompt-drafting via the Anthropic proxy ──
     Mirrors ta-generate: build the full Messages request client-side,
     POST to the transparent proxy. Returns { generate, prompt, reason }. */
  /* ── v1.0.7 — PHOTOGRAPHIC REALISM. ──
     Audit of every bump to date: v1.0.6 was the ONLY one that touched
     image quality, and everything in it was SUBTRACTIVE. It banned
     vitality words, golden hour and stock staging. It never told the
     drafter what a real photograph looks like, so Flux removed one
     cliche and reached for the next glossy default.

     This bump is the positive half. The core insight is that the
     "AI-generated" look is not a rendering artefact — it is a
     COMPOSITIONAL and LIGHTING signature: too clean, too centred, too
     well lit, too pretty, nothing out of place. Every counter below
     targets that signature directly:

       · named CONSUMER gear + film stock  -> anchors the model in
         photographic training data rather than render/illustration data
       · DEEP focus, f/8                   -> blurred backgrounds read as
         stock photography or AI; deep focus reads as press photography
       · FLAT ambient light, on-camera     -> dramatic light is the second
         flash                                biggest tell after clean
                                              composition
       · one piece of REAL CLUTTER         -> the highest-leverage single
                                              instruction in this prompt
       · banned RENDER VOCABULARY          -> "stunning", "8k", "highly
                                              detailed", "cinematic" and
                                              friends summon the look
                                              directly

     Word budget went 20-40 -> 45-75 because camera, light and clutter
     specifics cost words and are the whole point.

     ALSO FIXED HERE — a v1.0.6 regression of mine. Haiku read the
     v1.0.6 drafting rules ("build from one concrete thing",
     "specific beats generic") as ELIGIBILITY criteria and started
     declining on abstract articles: a real-estate negotiation piece
     was refused for having "no concrete physical subject" and because
     any image would be "generic stock photography (empty house, for
     sale sign)". Those are not safety grounds. The decline branch is
     now explicitly scoped to the sensitive-subject rule ONLY, and an
     ABSTRACT ARTICLES section tells the drafter to infer a physical
     setting from the subject domain.

     v1.0.0 prompt preserved for A/B:
       'You write image-generation prompts for a LOCAL COMMUNITY NEWSLETTER.',
       'You are given the HTML body of one article. Produce a single complementary',
       'hero image prompt for a text-to-image model (Flux). Rules:',
       '- Describe scene, setting, mood, lighting, composition. Photographic by default.',
       '- NEVER depict real, named, identifiable people. NO text, logos, watermarks, signage.',
       '- Keep it concise: one paragraph, ~25-45 words, details ordered by priority.',
       '- If the article centers on a SPECIFIC real named person, a tragedy, crime,',
       '  death, medical detail, or other sensitive event where a generated image',
       '  would be inappropriate, DO NOT write a prompt.'                              */
  var SYSTEM_PROMPT = [
    'You write image-generation prompts for a LOCAL COMMUNITY NEWSLETTER.',
    'You are given the HTML body of one article. Produce ONE hero image prompt',
    'for Flux 2 Pro.',
    '',
    'THE REGISTER. This is an upscale community lifestyle magazine. Every',
    'image should make the town look like a place worth living: homes are',
    'WELL-KEPT, businesses are inviting, streets are pleasant. Editorial',
    'photography for a quality regional magazine \u2014 never a distressed',
    'property, never grime, never disrepair, and never a sterile render.',
    'NEVER write: worn, scuffed, faded, chipped, peeling, cluttered, dusty,',
    'dingy, curling, stained, cracked, grimy, dated, shabby. No extension',
    'cords, no mop buckets, no water damage, nothing broken or neglected.',
    '',
    'ALWAYS SPECIFY THE CAMERA. Non-negotiable, every prompt.',
    'Flux defaults to a rendered look when no photographic terms are present.',
    'Name a focal length and an aperture. Pick from:',
    '- 35mm, f/5.6, deep focus \u2014 rooms, streets, general scenes (default choice)',
    '- 50mm, f/2.8 \u2014 a single object or a person at mid-distance',
    '- 24mm, f/8 \u2014 wide interiors, storefronts, anything architectural',
    'Add one of: editorial photograph, magazine interior photograph,',
    'natural light photography.',
    '',
    'LIVED-IN, NOT STERILE. What separates a photograph from a render is',
    'evidence of life, not evidence of decay. Include one or two natural',
    'touches suggesting people were just here \u2014 pick ones that belong in the',
    'specific scene: a coffee cup by the sink, a folded newspaper on the',
    'island, keys in a dish by the door, a coat on a hook, herbs on the',
    'windowsill, a dog bed in the corner, a bicycle leaning by a porch.',
    'Attractive props in an attractive space. Composition may be relaxed \u2014',
    'an off-centre subject or a doorway framing the view \u2014 but the space',
    'itself is always in good condition.',
    '',
    'LIGHT. Bright and natural. Choose one:',
    '- bright natural daylight through windows (the default choice)',
    '- soft morning light in a clean, airy room',
    '- pleasant overcast daylight outdoors',
    '- warm interior lighting in the evening, fixtures on',
    'If the ARTICLE establishes a time or condition \u2014 an evening meeting, a',
    'snowstorm, a Saturday morning market \u2014 use that instead.',
    'NEVER write: golden hour, golden glow, warm golden light, sun-drenched,',
    'sunkissed, lens flare, god rays, bokeh, dreamy, hazy, ethereal, cinematic,',
    'moody, atmospheric. These are the single most recognisable AI tell.',
    '',
    'PEOPLE. Do not invent them. Include a figure ONLY if the article requires',
    'one or an operator directive below asks for one. When you do:',
    '- mid-distance or further, from behind or in profile, no face, occupied',
    '  with a task. Ordinary body, ordinary clothes, ordinary posture.',
    '- NEVER use vitality words: energetic, vibrant, active, radiant, lively,',
    '  glowing, fit, youthful, spry. Flux reads these as fitness photography',
    '  and returns bodybuilders, including for people in their seventies.',
    '- Never describe physique, muscle, tone or build in any way.',
    '- NEVER depict a real, named, identifiable person.',
    '',
    'BANNED STAGING. Never write any of these:',
    '- couples holding hands, arms around shoulders, walking and laughing',
    '- handshakes, high-fives, thumbs up, arms folded confidently',
    '- pointing at a laptop, gathered around a screen, laughing at nothing',
    '- "diverse group", "happy family", "smiling professional", "candid moment"',
    '- no text, lettering, logos, watermarks or legible signage anywhere',
    '',
    'BUILD FROM ONE CONCRETE THING. Pull a specific noun from the article \u2014',
    'the actual trade, crop, room, building, object, season. Specific beats',
    'generic every time: "a folding table of zucchini outside a firehouse",',
    'not "a community gathering".',
    '',
    'ABSTRACT ARTICLES. Many articles are about strategy, advice, process or',
    'trends and name no physical thing at all. These are NORMAL and they always',
    'get a prompt. Infer the setting from the subject domain:',
    '- real estate negotiation -> an empty kitchen with the cabinets open, a',
    '  lockbox hanging on a front door, a driveway, paperwork fanned on a counter',
    '- household budgeting     -> a kitchen table, envelopes, a calculator',
    '- school board policy      -> an empty classroom, folding chairs in a gym',
    '- local business trends    -> a storefront at closing, a stockroom, a till',
    'A quiet, ordinary, faintly unremarkable photograph is the CORRECT outcome',
    'here. This is a newsletter hero, not a magazine cover.',
    '',
    'FORM. One paragraph, 60\u201390 words. Plain declarative noun phrases separated',
    'by commas. Subject first, then the setting, then the imperfections, then the',
    'light, then the camera. No stacked adjectives. No "capturing the spirit of".',
    '',
    'WORKED EXAMPLE \u2014 article about real estate negotiation tactics:',
    '"A bright, well-kept suburban kitchen with white cabinets and a wide',
    'island, a folder of paperwork and a set of house keys resting on the',
    'counter, a coffee cup by the sink and fresh flowers near the window.',
    'Bright natural daylight through the window over the sink. 35mm, f/5.6,',
    'deep focus, editorial photograph, magazine interior photograph."',
    '',
    'WHEN TO DECLINE. There is exactly ONE reason to set generate:false:',
    '- the article centres on a SPECIFIC real named person, a tragedy, crime,',
    '  death, medical detail, or other sensitive event where a generated image',
    '  would be inappropriate.',
    'That is the ONLY ground. Everything above is DRAFTING GUIDANCE, not',
    'eligibility criteria. You may NEVER decline because the article is abstract,',
    'names no place, establishes no concrete subject, or would only produce an',
    'ordinary image. Those are yours to solve, not reasons to stop. If you find',
    'yourself about to decline for any reason other than the sensitive-subject',
    'rule, draft the prompt instead.',
    '',
    'PUBLISHER NOTES (when present):',
    '- The request may include a PUBLISHER NOTES section: free text the publisher',
    '  typed into their upload metadata table. Treat it as the closest thing you',
    '  have to a client brief, and honour it over your own reading of the body',
    '  when the two disagree about subject matter.',
    '- Notes are a MIXED BAG. They routinely blend an image brief with print',
    '  production and layout instructions. Use ONLY the parts describing what the',
    '  picture should SHOW \u2014 subject, setting, season, action.',
    '- IGNORE production/layout directions entirely. Text to ignore includes:',
    '  "run copy along the bottom", "spread across two pages", "corner banner",',
    '  "put headshot by his byline", "if the photo resolution is good enough",',
    '  page counts, column widths, placement, cropping and file-format notes.',
    '  These describe the printed page, not the image.',
    '- Notes asking for a person DO override the no-invented-people rule, but',
    '  every figure rule above still binds: no face, no portrait, no vitality',
    '  words.',
    '- Example: notes reading "use before and after photos. run copy along the',
    '  bottom as these spread out across two pages" contain NO usable image brief',
    '  for a single hero \u2014 ignore them and draft from the body.',
    '- Example: notes reading "Image of someone drinking water in the heat of',
    '  summer" ARE a direct brief \u2014 build the prompt around exactly that.',
    '- If the notes carry no usable image guidance, silently ignore them. Never',
    '  mention them, never apologise for them, never let layout words leak in.',
    '- Report whether the notes shaped your prompt in "usedNotes".',
    '',
    'Respond with ONLY a JSON object, no markdown, no preamble:',
    '{"generate": true|false, "prompt": "<prompt or empty>", "reason": "<if false, why>", "usedNotes": true|false}'
  ].join('\n');

  /* ── v1.0.8 — PROMPT VALIDATOR ──
     TOAST-TRUTH applied to the drafter: never trust that the model
     obeyed the rules, verify the text mechanically before a Flux run
     is spent on it. The same banned vocabulary that lives in
     SYSTEM_PROMPT as instructions lives here as data, and every
     prompt — drafted OR hand-edited — is checked client-side.

     Violations render as red chips under the textarea BEFORE
     generation; a clean prompt shows a quiet "passes house rules"
     line. Generate is not hard-blocked: the operator can override via
     confirm(), because the lists are heuristic (substring match) and
     must never hold a correct prompt hostage. Zero API cost.

     Word-boundary matching, case-insensitive. "worn" must not flag
     "sworn"; "dated" must not flag "updated". Multi-word phrases
     match as phrases. */
  var BANNED = [
    { cat: 'decay',    terms: ['worn','scuffed','faded','chipped','peeling','cluttered',
                               'dusty','dingy','curling','stained','cracked','grimy',
                               'shabby','mop bucket','extension cord','water damage',
                               'boxes stacked','unopened mail'] },
    { cat: 'vitality', terms: ['energetic','vibrant','radiant','lively','glowing',
                               'youthful','spry','muscular','toned','athletic build'] },
    { cat: 'cliche light', terms: ['golden hour','golden glow','golden light','sun-drenched',
                               'sunkissed','sun-kissed','lens flare','god rays','bokeh',
                               'dreamy','hazy','ethereal','cinematic','moody','atmospheric'] },
    { cat: 'stock staging', terms: ['holding hands','arms around','high-five','high five',
                               'thumbs up','arms folded','pointing at a laptop',
                               'gathered around a screen','diverse group','happy family',
                               'smiling professional','candid moment'] }
  ];

  function validatePrompt(text) {
    var hits = [], low = ' ' + String(text || '').toLowerCase() + ' ';
    for (var i = 0; i < BANNED.length; i++) {
      var g = BANNED[i];
      for (var k = 0; k < g.terms.length; k++) {
        var t = g.terms[k];
        var re = new RegExp('(^|[^a-z])' + t.replace(/[-\s]+/g, '[-\\s]+') + '($|[^a-z])', 'i');
        if (re.test(low)) hits.push({ term: t, cat: g.cat });
      }
    }
    return hits;
  }

  function validationHtml(text) {
    if (!String(text || '').trim()) return '';
    var hits = validatePrompt(text);
    if (!hits.length) {
      return '<div class="ixig-val ok">\u2713 Passes house rules</div>';
    }
    var chips = '';
    for (var i = 0; i < hits.length; i++) {
      chips += '<span class="ixig-val-chip">' + esc(hits[i].term) +
               '<i>' + esc(hits[i].cat) + '</i></span>';
    }
    return '<div class="ixig-val bad"><b>House-rule violations \u2014 fix before generating:</b>' +
           '<div class="ixig-val-chips">' + chips + '</div></div>';
  }

  /* ── v1.0.7 — HOUSE STYLE NOTE (HC-IMG-006) ──
     Without a locality the drafter writes Anywhere, USA. A one-line
     description of the title's actual place is the difference between a
     generic empty kitchen and one that reads as Wyckoff.

     TITLES-ADMIN is at the Webflow field cap, so this does NOT get its
     own field. It rides as a key inside the existing
     `default-layout-json` blob — exactly the extension path that field
     was designed for ("new switches added later as JSON keys, no schema
     migration", data-ref v1.25 §2). Scenario 131 already writes there.

     Read order, first non-empty wins:
       1. TA_CONFIG.imageStyleNote        (direct override, any surface)
       2. default-layout-json .imageStyleNote  (per-title, the real home)
     Absent or empty  ->  no injection at all, behaviour identical to
     v1.0.6. No publisher ever inherits another title's locale.

     MULTI-TENANT: nothing here names a title, a town or a state. The
     string is authored per-title in CMS. Bergen County is NOT in this
     file. */
  function houseStyleNote() {
    try {
      var direct = cfg().imageStyleNote;
      if (direct && String(direct).trim()) return String(direct).trim();
    } catch (e) {}
    // The T-A page binds default-layout-json to [data-tdl-json] (picker
    // binding — CMS tokens resolve only in real bindings, never in
    // hand-typed {{wf}} strings, per data-ref v1.28 §12). Read the same
    // element ta-default-layout reads, so there is one source of truth.
    try {
      var el = document.querySelector('[data-tdl-json]');
      var raw = el ? (el.getAttribute('data-tdl-json') || el.textContent || '') : '';
      if (!raw || !String(raw).trim()) return '';
      var j = JSON.parse(raw);
      var n = j && (j.imageStyleNote || j.imagestylenote);
      return n ? String(n).trim() : '';
    } catch (e) { return ''; }
  }

  /* ── v1.0.7 — PEOPLE control ──
     v1.0.6 defaulted to no people, which fixed the anatomy failures but
     over-corrected: local newsletters need people. So the SYSTEM_PROMPT
     keeps no-people as its default (the drafter never INVENTS a figure)
     and the operator adds them deliberately from the modal.

     The directive rides in the USER message, not the system prompt —
     same shape as ignoreNotes. SYSTEM_PROMPT stays static and
     cacheable; only the per-request instruction varies.

     'none' contributes NO directive at all. The system prompt already
     says no people, so adding a redundant line would only spend tokens
     and risk the model over-reading the emphasis.

     Every figure rule in SYSTEM_PROMPT still binds in both non-none
     modes — the directive restates the load-bearing ones because a
     late user-message instruction can otherwise read as a licence to
     drop the earlier constraints. */
  var PEOPLE_MODES = [
    { id: 'none', label: 'None',                directive: '' },
    { id: 'one',  label: 'One, working',        directive: [
        'OPERATOR DIRECTIVE \u2014 people in this image:',
        'Compose the scene AROUND one person engaged in the work or activity',
        'this article describes. Mid-distance or further, from behind or in',
        'profile, no face, ordinary body and ordinary clothing. The person is',
        'the subject, not an afterthought placed into an empty scene.',
        'Every figure rule in your instructions still applies in full \u2014 no',
        'vitality words, no physique or build description, no named or',
        'identifiable real person, no banned staging.'
      ].join('\n') },
    { id: 'few',  label: 'A few, mid-distance', directive: [
        'OPERATOR DIRECTIVE \u2014 people in this image:',
        'Compose the scene AROUND two or three people occupied with the',
        'activity this article describes. All at mid-distance or further,',
        'from behind or in profile, no faces, ordinary bodies and ordinary',
        'clothing. Do not stage them interacting with each other \u2014 they are',
        'each busy with the thing, not with the camera.',
        'Every figure rule in your instructions still applies in full \u2014 no',
        'vitality words, no physique or build description, no named or',
        'identifiable real person, no banned staging.'
      ].join('\n') }
  ];

  function peopleMode(id) {
    for (var i = 0; i < PEOPLE_MODES.length; i++) if (PEOPLE_MODES[i].id === id) return PEOPLE_MODES[i];
    return PEOPLE_MODES[0];
  }

  // v1.0.3 — Publisher notes from the upload metadata table.
  // ta-asf v1.5.27+ parses the html-clean Worker's sidecar into
  // S.sourceMetadata ({pairs:[{key,label,value}], map:{…}}). The Notes
  // cell is the publisher's own brief — often the only place anyone
  // says what the picture should show. Read-only; absent on uploads
  // with no table, in which case everything behaves exactly as v1.0.2.
  function publisherNotes() {
    try {
      var I = window.InbxASF && window.InbxASF._internal;
      var meta = I && I.state && I.state.sourceMetadata;
      if (!meta) return '';
      if (meta.map && meta.map.notes) return String(meta.map.notes).trim();
      if (Array.isArray(meta.pairs)) {
        for (var i = 0; i < meta.pairs.length; i++) {
          if (meta.pairs[i] && meta.pairs[i].key === 'notes') {
            return String(meta.pairs[i].value || '').trim();
          }
        }
      }
    } catch (e) {}
    return '';
  }

  /* v1.0.4 — the exact user message sent to the prompt drafter.
     ignoreNotes drops the publisher notes block, which is the escape
     hatch when the NOTES are what got the request refused (e.g. notes
     asking for a photograph of a named person) while the article body
     is perfectly generatable on its own. */
  function buildUserContent(bodyHtml, ignoreNotes, people) {
    var body  = String(bodyHtml || '').trim();
    var notes = ignoreNotes ? '' : publisherNotes();
    var base  = notes
      ? ('PUBLISHER NOTES (from the upload metadata table \u2014 use only the parts\n' +
         'that describe what the image should SHOW; ignore layout/production text):\n\n' +
         notes + '\n\n---\n\nARTICLE BODY (HTML):\n\n' + body)
      : ('ARTICLE BODY (HTML):\n\n' + body);
    // v1.0.7 — house style note, then the people directive LAST so the
    // people instruction is the most recent thing the model reads.
    var style = houseStyleNote();
    if (style) {
      base += '\n\n---\n\nHOUSE STYLE \u2014 the place this newsletter covers.\n' +
              'Let it shape architecture, vegetation, season and vernacular detail.\n' +
              'Do NOT name the town, county or state in the prompt:\n\n' + style;
    }
    var d = peopleMode(people).directive;
    return d ? (base + '\n\n---\n\n' + d) : base;
  }

  function draftPrompt(bodyHtml, opts) {
    var proxy = proxyUrl();
    if (!proxy) return Promise.reject(new Error('anthropicProxy not configured in TA_CONFIG'));
    var body = String(bodyHtml || '').trim();
    if (!body) return Promise.reject(new Error('No article body to read — add a body first.'));

    // v1.0.4 — built by a named helper so the modal can SHOW the operator
    // exactly what was sent. Previously this string existed only inside
    // the request and was invisible when the drafter declined.
    var userContent = buildUserContent(body, opts && opts.ignoreNotes, opts && opts.people);

    var req = {
      model: PROMPT_MODEL,
      max_tokens: 1400,   // v1.0.7 — prompts are 60-90 words now, plus JSON envelope
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }]
    };

    return fetch(proxy, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error('Proxy HTTP ' + r.status + ': ' + t.slice(0, 200)); });
      return r.json();
    }).then(function (data) {
      var text = '';
      if (data && Array.isArray(data.content)) {
        text = data.content.filter(function (b) { return b && b.type === 'text'; })
                           .map(function (b) { return b.text; }).join('\n');
      }
      var clean = text.replace(/```json|```/g, '').trim();
      var parsed;
      try { parsed = JSON.parse(clean); }
      catch (e) { throw new Error('Could not parse prompt response.'); }
      if (!parsed || typeof parsed.generate !== 'boolean') throw new Error('Malformed prompt response.');
      return parsed;
    });
  }

  /* ── Worker call ── */
  /* ── v1.0.9 — AMEND: the critique loop ──
     The distinction that matters: runDraft() reads the ARTICLE and
     writes a fresh prompt, discarding whatever the operator liked
     about the current one. amendPrompt() reads the CURRENT PROMPT and
     applies one complaint to it. Redrafting after a small objection
     ("her hair is too dark") throws away a composition that was 90%
     right, which is exactly how the old loop burned credits.

     Same model as the drafter, deliberately. This call is measured in
     fractions of a cent against a Flux run; buying a cheaper edit of
     the one artifact that determines image quality is a false economy.
     Change AMEND_MODEL below if that trade ever shifts. */
  var AMEND_MODEL = PROMPT_MODEL;

  var AMEND_SYSTEM = [
    'You edit image-generation prompts. You do not write new ones.',
    '',
    'You will be given a CURRENT PROMPT that produced an image, and a',
    'CRITIQUE describing what the operator disliked about that image.',
    '',
    'Your job is to return the current prompt with the SMALLEST change',
    'that addresses the critique. This is an edit, not a rewrite.',
    '',
    'RULES',
    '1. Preserve every clause the critique does not object to, verbatim',
    '   where possible. The operator kept this prompt because most of it',
    '   is working. Rewriting it loses that work.',
    '2. Translate plain complaints into photographic direction. "Too',
    '   posed" is a direction about posture and gaze, not a word to',
    '   insert. "Background too busy" is a direction about depth of',
    '   field and what occupies the frame behind the subject.',
    '3. Never negate. Flux does not reliably honour "no X" or "without',
    '   X" — it often renders X. Replace the unwanted element with the',
    '   wanted one instead. "Not a busy background" becomes a specific',
    '   quiet background.',
    '4. Keep the register established by the current prompt: an upscale',
    '   community lifestyle magazine. Well-kept, inviting, natural light.',
    '5. Never introduce: real or named people, readable text or signage,',
    '   logos, or the render vocabulary (stunning, 8k, cinematic, hyper-',
    '   detailed, masterpiece, award-winning).',
    '6. Do not change the number of people in the scene unless the',
    '   critique explicitly asks for that. The people count is set by a',
    '   separate control the operator owns.',
    '',
    'Return ONLY a JSON object, no preamble and no markdown fences:',
    '{"prompt": "<the amended prompt>", "note": "<one short clause',
    'naming what you changed, for the operator>"}'
  ].join('\n');

  function amendPrompt(currentPrompt, critique) {
    var proxy = proxyUrl();
    if (!proxy) return Promise.reject(new Error('TA_CONFIG.anthropicProxy is not set.'));
    var cur = String(currentPrompt || '').trim();
    var crit = String(critique || '').trim();
    if (!cur)  return Promise.reject(new Error('No prompt to amend.'));
    if (!crit) return Promise.reject(new Error('Say what you want changed first.'));

    var req = {
      model: AMEND_MODEL,
      max_tokens: 1000,
      system: AMEND_SYSTEM,
      messages: [{ role: 'user', content:
        'CURRENT PROMPT:\n' + cur + '\n\nCRITIQUE:\n' + crit }]
    };
    log('amend →', crit);
    return fetch(proxy, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    }).then(function (r) {
      if (!r.ok) throw new Error('Amend call failed (' + r.status + ').');
      return r.json();
    }).then(function (data) {
      var text = '';
      try {
        (data.content || []).forEach(function (b) { if (b.type === 'text') text += b.text; });
      } catch (e) {}
      var clean = String(text).replace(/```json|```/g, '').trim();
      var parsed;
      try { parsed = JSON.parse(clean); }
      catch (e) { throw new Error('Could not read the amended prompt.'); }
      if (!parsed || !parsed.prompt) throw new Error('The amendment came back empty.');
      return { prompt: String(parsed.prompt).trim(), note: String(parsed.note || '').trim() };
    });
  }

  /* Word-level diff for the changed-words strip. A <textarea> cannot
     render highlighted spans, so — exactly as v1.0.3 did for publisher
     notes — the information surfaces in its own block above the box
     rather than inside it. Only ADDED words are shown: those are what
     the amendment introduced, and they are what the operator needs to
     approve before spending a credit. */
  var DIFF_SKIP = (' a an and the of in on at to with for from by is are be ' +
                   'as or its it this that their his her hers he she they ' +
                   'not no into over under near ').split(/\s+/);

  function wordSet(text) {
    var out = {}, toks = String(text || '').toLowerCase().match(/[a-z][a-z'-]*/g) || [];
    for (var i = 0; i < toks.length; i++) out[toks[i]] = true;
    return out;
  }

  function diffAdded(oldText, newText) {
    var was = wordSet(oldText), added = [], seen = {};
    var toks = String(newText || '').match(/[A-Za-z][A-Za-z'-]*/g) || [];
    for (var i = 0; i < toks.length; i++) {
      var w = toks[i], lw = w.toLowerCase();
      if (was[lw] || seen[lw]) continue;
      if (DIFF_SKIP.indexOf(lw) !== -1) continue;
      if (lw.length < 3) continue;
      seen[lw] = true;
      added.push(w);
      if (added.length >= 18) break;
    }
    return added;
  }

  function generateImage(prompt) {
    var url = fluxUrl();
    if (!url) return Promise.reject(new Error('fluxGen Worker URL not configured in TA_CONFIG.'));
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt, width: DEFAULT_W, height: DEFAULT_H })
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || !j || !j.url) {
          throw new Error((j && j.error ? j.error : 'Worker HTTP ' + r.status) +
                          (j && j.stage ? ' [' + j.stage + ']' : ''));
        }
        return j;   // { url, uuid, model, width, height, seconds }
      });
    });
  }

  /* ── Attach via Scenario L — Generate Media ──
     Architectural rule (Jeff): Scenario B is a CONDITIONER only — it
     does not assign assets. Generated images are ALREADY conditioned
     (the fluxgen Worker did the Uploadcare upload), so they bypass B
     Architectural rule (Jeff): generation and assignment stay separate.
     Scenario L CREATES + PUBLISHES the MEDIA row only (status Available)
     and returns its mediaId. It does NOT assign. The module then hands
     that MEDIA item to the ASF's OWN setMainImageFromMedia — the exact
     path used when picking an existing library image — so the ASF marks
     the slot dirty and ASSIGNS it on Save. No assignment logic here, no
     behind-the-back article write, no Scenario B.

     Endpoint: TA_CONFIG.makeGenerateMedia  (Scenario L webhook)
     Contract: { action:'createGeneratedMedia', uploadcareUrl, ... } →
               creates MEDIA (Media Type=image, status=Available, NO
               component-role — see TD-IMG-ROLE), publishes it, returns
               { ok:true, mediaId, imageUrl, name }.

     Returns to caller: { ok, media:{ mediaId, imageUrl, name } } so the
     click handler can call setMainImageFromMedia and let the ASF finish. */
  function createMedia(j, prompt) {
    var asf = window.InbxASF;
    var I   = asf && asf._internal;
    if (!I || !I.cfg || !I.state) {
      return Promise.resolve({ fallback: true, url: j.url });   // graceful: manual Replace
    }
    var CFG = I.cfg, S = I.state;
    var tenant = CFG.tenant;
    var url = (tenant.makeGenerateMedia && tenant.makeGenerateMedia())
              || (window.TA_CONFIG && window.TA_CONFIG.makeGenerateMedia)
              || '';
    if (!url) return Promise.resolve({ fallback: true, url: j.url });

    // Per convention (TD-IMG-ROLE): Available MEDIA does NOT carry a
    // Component Role. Role is a TYPE/usage sub-classifier assigned at
    // ATTACH time, not at creation — and for a plain image it would only
    // duplicate Media Type = image. So we do NOT send componentRole here.
    // Scenario L's Create-MEDIA module leaves Component Role empty;
    // Media Type = image is the real classifier.
    var fname = 'flux-' + String(j.uuid).slice(0, 8) + '.jpg';
    var payload = {
      action:           'createGeneratedMedia',
      uploadcareUuid:   j.uuid,
      uploadcareUrl:    j.url,
      originalFilename: fname,
      mimeType:         'image/jpeg',
      width:            j.width || 1024,
      height:           j.height || 1024,
      titleSlug:        tenant.titleSlug(),
      taItemId:         tenant.taItemId(),
      imageSource:      'ai-flux-2-pro',        // provenance
      generationPrompt: prompt,                 // provenance
      source:           'image-gen-v' + VERSION
    };
    return fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error('Scenario L HTTP ' + r.status);
      return r.text();
    }).then(function (body) {
      var p = null;
      try { p = JSON.parse(body); } catch (e) {}
      if (!p || p.ok !== true || !p.mediaId) {
        throw new Error('Scenario L did not confirm (createGeneratedMedia route).');
      }
      return {
        ok: true,
        media: {
          mediaId:  p.mediaId,
          imageUrl: p.imageUrl || j.url,
          name:     p.name || fname
        }
      };
    });
  }

  // Hand the new MEDIA to the ASF's own main-image setter, exactly as if
  // the operator had picked it from the library. The ASF marks it dirty
  // and assigns it on Save — assignment stays the ASF's job.
  function handToAsf(media) {
    var I = window.InbxASF && window.InbxASF._internal;
    var fn = I && (I.setMainImageFromMedia || (I.api && I.api.setMainImageFromMedia));
    if (typeof fn === 'function') { fn(media); return true; }
    // Fallback: write state directly the way setMainImageFromMedia does,
    // then re-render — covers the case where it isn't exposed on _internal.
    if (I && I.state) {
      var S = I.state;
      if (!S.article) S.article = {};
      if (!S.dirtyFields) S.dirtyFields = {};
      if (!S.originalValues) S.originalValues = {};
      var prior = S.originalValues.mainImageSrc || '';
      S.article.mainImageSrc     = media.imageUrl;
      S.article.mainImageMediaId = media.mediaId || '';
      if (!S.article.mainImageAlt && media.name) S.article.mainImageAlt = media.name;
      if (!Array.isArray(S.media)) S.media = [];
      S.media = S.media.filter(function (m) { return m.role !== 'main-image'; });
      S.media.push({ mediaId: media.mediaId, imageUrl: media.imageUrl, name: media.name, role: 'main-image' });
      S.dirtyFields.mainImageSrc     = { from: prior, to: media.imageUrl };
      S.dirtyFields.mainImageMediaId = { from: '', to: media.mediaId || '' };
      try { I.render(); } catch (e) {}
      return true;
    }
    return false;
  }

  /* ── Modal UI ── */
  var modalEl = null, state = null;

  // v1.0.3 — Show the publisher's Notes verbatim above the prompt box.
  // Jeff asked for notes-derived text to be visually distinguished; a
  // <textarea> can only hold plain text, and converting it to a
  // contenteditable would break the uncontrolled-input typing fix. So
  // the notes are shown as their own gold-railed block instead — same
  // treatment they get in the ASF Source-metadata panel, so the two
  // surfaces read as one system. You can see exactly what the model was
  // given, and edit the resulting prompt freely.
  function notesBlock() {
    var n = publisherNotes();
    if (!n) return '';
    var off = state && state.ignoreNotes;
    return '<div class="ixig-notes' + (off ? ' is-off' : '') + '">' +
             '<span class="ixig-notes-h">Publisher notes \u00b7 ' +
               (off ? 'IGNORED for this draft' : 'fed to the prompt') + '</span>' +
             '<div class="ixig-notes-b">' + esc(n) + '</div>' +
           '</div>';
  }

  /* v1.0.7 — the PEOPLE segmented control. Sits directly above the
     prompt box, below the notes block, so the three inputs to the draft
     read top-to-bottom in the order the model receives them: notes,
     people directive, then the prompt they produced.

     Active segment carries the gold --ipp-edit-dirty-border, the same
     token the dirty textarea uses (HC-IMG-005) — house convention is
     that a gold rail means "this selection is in force".

     Disabled while drafting or generating: a redraft mid-flight would
     race the in-flight request and the later response could clobber the
     earlier one's state. */
  function peopleBlock() {
    var s = state; if (!s) return '';
    var busy = s.phase === 'drafting' || s.phase === 'generating';
    var cur  = s.people || 'none';
    var segs = '';
    for (var i = 0; i < PEOPLE_MODES.length; i++) {
      var m = PEOPLE_MODES[i];
      segs += '<button type="button" class="ixig-seg' + (m.id === cur ? ' is-on' : '') + '"' +
                ' data-ixig="people" data-people="' + m.id + '"' +
                (busy ? ' disabled' : '') + '>' + esc(m.label) + '</button>';
    }
    return '<div class="ixig-people">' +
             '<span class="ixig-people-h">People</span>' +
             '<div class="ixig-seg-b">' + segs + '</div>' +
             '<div class="ixig-people-f">Changing this redraws the prompt.</div>' +
           '</div>';
  }

  /* v1.0.4 — collapsed view of everything handed to the drafter. Jeff
     asked to see the prompt; when the drafter DECLINES there is no
     drafted prompt to show, so show the inputs instead. Without this the
     refusal was unactionable: no way to tell whether the notes, the
     body, or the system rules caused it. */
  function sentBlock() {
    var s = state; if (!s) return '';
    try { return sentBlockInner(s); }
    catch (e) {
      // v1.0.5 — the disclosure panel is a convenience. If it cannot be
      // built it degrades to nothing; it does not take the modal with it.
      try { console.error('[img-gen v' + VERSION + '] sentBlock failed', e); } catch (e2) {}
      return '';
    }
  }

  function sentBlockInner(s) {
    // v1.0.5 — SYSTEM_PROMPT is ALREADY a joined string (see its
    // definition: the array is .join('\\n')-ed inline). v1.0.4 called
    // .join on it again, which threw TypeError inside render(). Because
    // render() runs BEFORE generateImage() in the generate handler, the
    // throw escaped the click handler, the fetch never fired, and the
    // button sat on "Generating..." forever.
    var sys  = String(SYSTEM_PROMPT);
    var user = buildUserContent(s.bodyHtml || '', s.ignoreNotes, s.people);
    if (user.length > 4000) user = user.slice(0, 4000) + '\n\n\u2026 [body truncated for display]';
    return '<details class="ixig-dbg">' +
             '<summary>What was sent to the drafter</summary>' +
             '<div class="ixig-dbg-h">SYSTEM INSTRUCTIONS</div>' +
             '<pre class="ixig-dbg-p">' + esc(sys) + '</pre>' +
             '<div class="ixig-dbg-h">MESSAGE</div>' +
             '<pre class="ixig-dbg-p">' + esc(user) + '</pre>' +
           '</details>';
  }

  function styleTag() {
    if (document.getElementById('ix-imggen-styles')) return;
    var s = document.createElement('style');
    s.id = 'ix-imggen-styles';
    s.textContent = [
      '.ixig-backdrop{position:fixed;inset:0;background:rgba(26,58,58,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px}',
      '.ixig-modal{background:#FAF9F5;border-radius:14px;max-width:560px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.28);font-family:"DM Sans",system-ui,sans-serif;overflow:hidden}',
      '.ixig-head{padding:18px 22px;border-bottom:1px solid #e7e4da;display:flex;align-items:center;gap:10px}',
      '.ixig-head b{font-size:16px;color:#1A3A3A;font-weight:600}',
      '.ixig-body{padding:20px 22px}',
      '.ixig-label{display:block;font-size:12px;font-weight:600;color:#1A3A3A;margin:0 0 6px}',
      '.ixig-ta{width:100%;min-height:96px;resize:vertical;border:2px solid #e0ddd2;border-radius:9px;padding:11px 13px;font:14px/1.5 "DM Sans",sans-serif;color:#243;background:#fff;box-sizing:border-box}',
      '.ixig-ta:focus{outline:none;border-color:#5B7FFF}',
      '.ixig-ta.dirty{border-color:var(--ipp-edit-dirty-border,#C4A35A) !important}',   /* HC-IMG-005 */
      '.ixig-sub{font-size:12px;color:#7a7766;margin:8px 2px 0}',
      /* v1.0.3 — publisher-notes provenance. The prompt lives in a plain
         <textarea>, which cannot render coloured/bold spans, so the notes
         are surfaced ABOVE it instead of highlighted inside it. */
      '.ixig-notes{margin:0 0 10px;padding:9px 11px;background:rgba(196,163,90,.12);border:1px solid rgba(196,163,90,.32);border-left:3px solid #C4A35A;border-radius:7px}',
      '.ixig-notes-h{display:block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8a6d2f;margin:0 0 4px}',
      '.ixig-notes-b{font-size:12px;line-height:1.5;color:#5c4a22;white-space:pre-wrap;word-break:break-word}',
      '.ixig-preview{margin-top:14px;border-radius:10px;overflow:hidden;background:#eee;aspect-ratio:1/1;display:none}',
      '.ixig-preview img{width:100%;height:100%;object-fit:cover;display:block}',
      '.ixig-foot{padding:14px 22px;border-top:1px solid #e7e4da;display:flex;align-items:center;justify-content:space-between;gap:12px}',
      '.ixig-cancel{background:none;border:none;color:#7a7766;font-size:13px;text-decoration:underline;cursor:pointer;padding:6px}',
      '.ixig-cancel:hover{color:#1A3A3A}',
      '.ixig-btn{background:#C4A35A;color:#1A3A3A;border:none;border-radius:9px;padding:11px 20px;font-weight:600;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}',
      '.ixig-btn:disabled{opacity:.55;cursor:default}',
      '.ixig-btn.secondary{background:#5B7FFF;color:#fff}',
      '.ixig-spin{width:15px;height:15px;border:2px solid rgba(26,58,58,.3);border-top-color:#1A3A3A;border-radius:50%;animation:ixigspin .7s linear infinite}',
      '@keyframes ixigspin{to{transform:rotate(360deg)}}',
      '.ixig-err{color:#b3261e;font-size:13px;margin-top:10px}',
      // v1.0.4 — refusal banner. Amber, not red: nothing failed and
      // nothing was lost, the operator simply has to steer.
      '.ixig-warn{margin:0 0 12px;padding:11px 13px;background:rgba(196,163,90,.14);border:1px solid rgba(196,163,90,.42);border-left:3px solid #C4A35A;border-radius:7px}',
      '.ixig-warn-h{display:block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8a6d2f;margin:0 0 5px}',
      '.ixig-warn-b{font-size:13px;line-height:1.5;color:#4a3c1c;margin:0 0 6px}',
      '.ixig-warn-f{font-size:12px;line-height:1.5;color:#6b5c33}',
      '.ixig-notes.is-off{opacity:.55}',
      '.ixig-notes.is-off .ixig-notes-b{text-decoration:line-through}',
      '.ixig-foot-spacer{flex:1}',
      // v1.0.4 — the inputs, on demand. Collapsed so it never competes
      // with the prompt box, but always one click away.
      '.ixig-dbg{margin:12px 0 0;border-top:1px solid #e7e4da;padding-top:10px}',
      '.ixig-dbg summary{cursor:pointer;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#6b6558;list-style:none}',
      '.ixig-dbg summary::-webkit-details-marker{display:none}',
      '.ixig-dbg summary:before{content:"\\25B8 ";color:#9a927f}',
      '.ixig-dbg[open] summary:before{content:"\\25BE "}',
      '.ixig-dbg-h{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8a8372;margin:10px 0 3px}',
      '.ixig-dbg-p{margin:0;padding:8px 10px;background:#FDFCF8;border:1px solid #e7e4da;border-radius:6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;line-height:1.45;color:#3d3a33;white-space:pre-wrap;word-break:break-word;max-height:200px;overflow:auto}',
      /* v1.0.7 — PEOPLE segmented control. Active segment gets the gold
         rail (HC-IMG-005 token) so "in force" reads at a glance, matching
         the dirty-textarea treatment. */
      '.ixig-people{margin:0 0 14px}',
      '.ixig-people-h{display:block;font-size:12px;font-weight:600;color:#1A3A3A;margin:0 0 6px}',
      '.ixig-seg-b{display:flex;gap:6px;flex-wrap:wrap}',
      '.ixig-seg{flex:1 1 auto;min-width:92px;padding:8px 10px;background:#fff;border:2px solid #e0ddd2;border-radius:8px;font:13px/1.2 "DM Sans",sans-serif;color:#3d3a33;cursor:pointer;text-align:center;transition:border-color .12s,background .12s}',
      '.ixig-seg:hover:not(:disabled){border-color:#c9c5b6}',
      '.ixig-seg.is-on{border-color:var(--ipp-edit-dirty-border,#C4A35A) !important;background:#FDFCF8;font-weight:600;color:#1A3A3A}',
      '.ixig-seg:disabled{opacity:.5;cursor:default}',
      '.ixig-people-f{font-size:11px;color:#8a8372;margin:5px 2px 0}',
      /* v1.0.8 — validator row */
      '.ixig-val{margin:6px 0 0;font:12px/1.5 "DM Sans",sans-serif}',
      '.ixig-val.ok{color:#3d7a4a}',
      '.ixig-val.bad{color:#8a3232;background:#fdf3f2;border:1px solid #eccfcb;border-radius:8px;padding:8px 10px}',
      '.ixig-val.bad b{display:block;margin-bottom:5px;font-size:12px}',
      '.ixig-val-chips{display:flex;flex-wrap:wrap;gap:5px}',
      '.ixig-val-chip{display:inline-flex;align-items:baseline;gap:5px;background:#fff;border:1px solid #e2b8b2;border-radius:6px;padding:2px 8px;font-size:12px;color:#7a2d2d}',
      '.ixig-val-chip i{font-style:normal;font-size:10px;color:#a98a86}',
      '.ixig-x{margin-left:auto;background:none;border:none;font-size:20px;color:#7a7766;cursor:pointer;line-height:1}',
      /* ── v1.0.9 — two-pane working surface ──
         The 560px centre-modal was sized for a form. This is a
         comparison surface: images must be seen side by side at a
         useful size, and the prompt — the artifact actually being
         edited — needs enough rows that a normal prompt never
         scrolls. Both panes scroll independently so a long prompt
         never pushes the images off screen. */
      '.ixig-modal.wide{max-width:1180px;width:100%;height:min(92vh,900px);display:flex;flex-direction:column}',
      '.ixig-panes{flex:1;display:grid;grid-template-columns:minmax(300px,40%) 1fr;min-height:0}',
      '.ixig-pane-l{border-right:1px solid #e7e4da;padding:16px 18px;overflow:auto;background:#FDFCF8}',
      '.ixig-pane-r{padding:16px 20px;overflow:auto;display:flex;flex-direction:column;min-height:0}',
      '@media (max-width:900px){.ixig-panes{grid-template-columns:1fr}.ixig-pane-l{border-right:none;border-bottom:1px solid #e7e4da}}',
      /* Attempt cards — newest first, previous kept alive for comparison */
      '.ixig-att{margin:0 0 14px}',
      '.ixig-att-h{display:flex;align-items:baseline;gap:8px;margin:0 0 6px}',
      '.ixig-att-n{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#8a8372}',
      '.ixig-att-n.is-new{color:#8a6d2f}',
      '.ixig-att-img{border-radius:10px;overflow:hidden;background:#eee;aspect-ratio:1/1;border:2px solid #e7e4da}',
      '.ixig-att.is-new .ixig-att-img{border-color:var(--ipp-edit-dirty-border,#C4A35A)}',
      '.ixig-att-img img{width:100%;height:100%;object-fit:cover;display:block}',
      '.ixig-att-f{display:flex;align-items:center;gap:10px;margin:6px 0 0}',
      '.ixig-keep{background:#C4A35A;color:#1A3A3A;border:none;border-radius:7px;padding:6px 12px;font:600 12px \"DM Sans\",sans-serif;cursor:pointer}',
      '.ixig-keep.ghost{background:none;color:#7a7766;text-decoration:underline;padding:6px 2px;font-weight:400}',
      '.ixig-keep:disabled{opacity:.55;cursor:default}',
      '.ixig-att-p{font-size:11px;line-height:1.45;color:#8a8372;margin:5px 0 0;max-height:44px;overflow:hidden}',
      '.ixig-empty{padding:26px 14px;text-align:center;color:#9a927f;font-size:12.5px;line-height:1.6;border:1px dashed #ded9cc;border-radius:10px;background:#fff}',
      /* Critique — the field that closes the loop */
      '.ixig-crit{margin:14px 0 0;padding-top:13px;border-top:1px solid #e7e4da}',
      '.ixig-crit-ta{width:100%;min-height:62px;resize:vertical;border:2px solid #e0ddd2;border-radius:9px;padding:10px 12px;font:13.5px/1.5 \"DM Sans\",sans-serif;color:#243;background:#fff;box-sizing:border-box}',
      '.ixig-crit-ta:focus{outline:none;border-color:#5B7FFF}',
      '.ixig-crit-ta.dirty{border-color:var(--ipp-edit-dirty-border,#C4A35A) !important}',
      '.ixig-crit-f{font-size:11px;color:#8a8372;margin:5px 2px 0}',
      /* Changed-words strip */
      '.ixig-diff{margin:0 0 8px;padding:8px 11px;background:rgba(91,127,255,.08);border:1px solid rgba(91,127,255,.26);border-left:3px solid #5B7FFF;border-radius:7px}',
      '.ixig-diff-h{display:block;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#3f57b0;margin:0 0 5px}',
      '.ixig-diff-b{display:flex;flex-wrap:wrap;gap:5px}',
      '.ixig-diff-w{background:#fff;border:1px solid #c3cdf3;border-radius:6px;padding:2px 8px;font-size:12px;color:#31408a}',
      '.ixig-diff-n{font-size:11.5px;line-height:1.5;color:#41508f;margin:6px 0 0}',
      '.ixig-ta.tall{min-height:230px}',
      '.ixig-btn.amend{background:#5B7FFF;color:#fff}',
      '.ixig-foot .ixig-btn+.ixig-btn{margin-left:10px}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function close() {
    if (modalEl) { modalEl.remove(); modalEl = null; }
    state = null;
    document.removeEventListener('keydown', onKey, true);
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  /* v1.0.9 — LEFT PANE. Newest attempt first, with its own gold rail;
     prior attempts stay live beneath it. Keeping the previous image on
     screen is the difference between comparing and remembering, and it
     is why "Discard & redraw" no longer destroys anything. */
  function attemptsPane() {
    var s = state; if (!s) return '';
    var h = s.history || [];
    if (!h.length) {
      return '<div class="ixig-empty">No image yet.<br>Read the prompt, then generate.<br><br>' +
             'Attempts collect here so you can compare them<br>side by side instead of from memory.</div>';
    }
    var busy = s.phase === 'generating' || s.phase === 'amending';
    var out = '';
    for (var i = h.length - 1; i >= 0; i--) {
      var a = h[i], isNew = (i === h.length - 1);
      out +=
        '<div class="ixig-att' + (isNew ? ' is-new' : '') + '">' +
          '<div class="ixig-att-h">' +
            '<span class="ixig-att-n' + (isNew ? ' is-new' : '') + '">' +
              (isNew ? 'Latest \u00b7 attempt ' + (i + 1) : 'Attempt ' + (i + 1)) + '</span>' +
          '</div>' +
          '<div class="ixig-att-img"><img src="' + esc(a.url) + '" alt="Attempt ' + (i + 1) + '"></div>' +
          '<div class="ixig-att-f">' +
            '<button type="button" class="ixig-keep' + (isNew ? '' : ' ghost') + '"' +
              (busy ? ' disabled' : '') + ' data-ixig="keep" data-idx="' + i + '">Keep this one</button>' +
            '<button type="button" class="ixig-keep ghost"' + (busy ? ' disabled' : '') +
              ' data-ixig="restore" data-idx="' + i + '">Use its prompt</button>' +
          '</div>' +
          '<div class="ixig-att-p">' + esc(a.prompt) + '</div>' +
        '</div>';
    }
    return out;
  }

  /* v1.0.9 — what the amendment actually changed. Added words only:
     those are what was introduced on your behalf, and they are what
     you are approving before a credit is spent. */
  function diffBlock() {
    var s = state; if (!s || !s.changed || !s.changed.length) return '';
    var chips = '';
    for (var i = 0; i < s.changed.length; i++) {
      chips += '<span class="ixig-diff-w">' + esc(s.changed[i]) + '</span>';
    }
    return '<div class="ixig-diff">' +
             '<span class="ixig-diff-h">Amended \u00b7 new wording</span>' +
             '<div class="ixig-diff-b">' + chips + '</div>' +
             (s.amendNote ? '<div class="ixig-diff-n">' + esc(s.amendNote) + '</div>' : '') +
           '</div>';
  }

  /* v1.0.9 — the critique field. Placeholder carries real examples so
     the operator is never staring at an empty box wondering what kind
     of sentence belongs here. Translating a plain complaint into
     photographic direction is the model's job, not the operator's. */
  function critiqueBlock() {
    var s = state; if (!s) return '';
    var busy = s.phase === 'drafting' || s.phase === 'generating' || s.phase === 'amending';
    var dirty = !!(s.critique && s.critique.trim());
    return '<div class="ixig-crit">' +
             '<label class="ixig-label" for="ixig-crit">What should change?</label>' +
             '<textarea id="ixig-crit" class="ixig-crit-ta' + (dirty ? ' dirty' : '') + '"' +
               ' placeholder="hair too dark \u00b7 background too busy \u00b7 she looks too posed \u00b7 shoot it from further back"' +
               (busy ? ' disabled' : '') + '>' + esc(s.critique || '') + '</textarea>' +
             '<div class="ixig-crit-f">Amend rewrites only what you name here. Everything else in the prompt survives. No image credit is spent.</div>' +
           '</div>';
  }

  function render() {
    if (!modalEl || !state) return;
    var s = state;
    var dirty = s.prompt !== s.drafted;
    var busy = s.phase === 'drafting' || s.phase === 'generating';

    var inner;
    if (s.phase === 'drafting') {
      inner = '<div class="ixig-body"><div class="ixig-sub">Reading the article and drafting an image prompt…</div></div>';
    } else {
      /* v1.0.4 — a declined draft now lands in the SAME editable surface
         as a successful one. It used to render the refusal text and a
         Close button and nothing else, so the operator could not see the
         prompt, could not edit it, and could not retry: the only move
         was to give up. The refusal is now a banner over a working form. */
      var warn = (s.phase === 'blocked')
        ? '<div class="ixig-warn">' +
            '<span class="ixig-warn-h">The drafter declined to write a prompt</span>' +
            '<div class="ixig-warn-b">' + esc(s.reason || 'This article isn\u2019t a good fit for a generated image.') + '</div>' +
            '<div class="ixig-warn-f">Write your own prompt below, or redraft without the publisher notes. ' +
              'Nothing has been generated and nothing has been saved.</div>' +
          '</div>'
        : '';
      var lbl = (s.phase === 'blocked' && !s.prompt)
        ? 'Image prompt \u00b7 write your own'
        : ('Image prompt' + (dirty ? ' \u00b7 edited' : ''));
      /* v1.0.9 — two panes. Left: every attempt, newest first, so the
         comparison is visual rather than remembered. Right: the prompt
         at working size with the critique field directly beneath it,
         because those two are edited together. */
      inner =
        '<div class="ixig-panes">' +
          '<div class="ixig-pane-l">' + attemptsPane() + '</div>' +
          '<div class="ixig-pane-r">' +
            warn +
            notesBlock() +
            peopleBlock() +
            diffBlock() +
            '<label class="ixig-label" for="ixig-prompt">' + lbl + '</label>' +
            '<textarea id="ixig-prompt" class="ixig-ta tall' + (dirty ? ' dirty' : '') + '"' +
              ' placeholder="Describe the image you want. No real or named people, no text in the image."' +
              (busy ? ' disabled' : '') + '>' + esc(s.prompt) + '</textarea>' +
            '<div id="ixig-val-row">' + validationHtml(s.prompt) + '</div>' +
            '<div class="ixig-sub">Flux 2 Pro \u00b7 ' + DEFAULT_W + '\u00d7' + DEFAULT_H + ' \u00b7 ~12\u201315s \u00b7 no real people, no text</div>' +
            critiqueBlock() +
            (s.error ? '<div class="ixig-err">' + esc(s.error) + '</div>' : '') +
            sentBlock() +
          '</div>' +
        '</div>';
    }

    /* v1.0.9 — the two-button rule. Amend is a text call and spends
       nothing; Generate is the only control that spends a Flux credit.
       They are deliberately separate so the amended wording is read
       before it is paid for. "Discard & redraw" is gone: nothing is
       discarded any more, the attempt simply joins the history. */
    var foot;
    var hasCrit = !!(s.critique && s.critique.trim());
    var hasImg  = !!(s.history && s.history.length);
    {
      // v1.0.4 — offer a redraft with the notes dropped whenever notes
      // exist and are currently in play. This is the one-click answer to
      // "the notes asked for a photo of a named person".
      var redraft = (publisherNotes() && !s.ignoreNotes && !busy)
        ? '<button type="button" class="ixig-cancel" data-ixig="renotes">Draft again without notes</button>'
        : '';
      foot = '<div class="ixig-foot">' +
               '<button type="button" class="ixig-cancel" data-ixig="cancel">' + (dirty ? 'Revert prompt' : 'Cancel') + '</button>' +
               redraft +
               '<div class="ixig-foot-spacer"></div>' +
               '<button type="button" class="ixig-btn amend"' + ((busy || !hasCrit) ? ' disabled' : '') + ' data-ixig="amend">' +
                 (s.phase === 'amending' ? '<span class="ixig-spin"></span>Amending…' : 'Amend prompt') +
               '</button>' +
               '<button type="button" class="ixig-btn"' + (busy ? ' disabled' : '') + ' data-ixig="generate">' +
                 (s.phase === 'generating' ? '<span class="ixig-spin"></span>Generating…'
                   : (hasImg ? '\u2728 Generate again' : '\u2728 Generate image')) +
               '</button>' +
             '</div>';
    }

    modalEl.querySelector('.ixig-modal').innerHTML =
      '<div class="ixig-head"><span>\u2728</span><b>Generate main image</b>' +
        '<button type="button" class="ixig-x" data-ixig="close">\u00d7</button></div>' +
      inner + foot;

    var ta = modalEl.querySelector('#ixig-prompt');
    if (ta && !busy) {
      // Do NOT re-render on input — re-rendering rebuilds the textarea
      // and kills typing (one char at a time). Just store the value and
      // update the dirty affordances in place. The textarea is an
      // uncontrolled input; the browser owns its text while typing.
      ta.addEventListener('input', function () {
        s.prompt = ta.value;
        var isDirty = s.prompt !== s.drafted;
        ta.classList.toggle('dirty', isDirty);
        // Update the Cancel/Revert label + the "· edited" hint without
        // a full re-render.
        var cancelBtn = modalEl.querySelector('[data-ixig="cancel"]');
        if (cancelBtn) cancelBtn.textContent = isDirty ? 'Revert prompt' : 'Cancel';
        var lbl = modalEl.querySelector('.ixig-label');
        if (lbl) lbl.textContent = 'Image prompt' + (isDirty ? ' \u00b7 edited' : '');
        // v1.0.8 — re-validate in place on every keystroke. Same
        // no-re-render rule as above: swap innerHTML of the row only,
        // never rebuild the textarea mid-typing.
        var vr = modalEl.querySelector('#ixig-val-row');
        if (vr) vr.innerHTML = validationHtml(s.prompt);
      });
      // Restore focus once after a (re)render that wasn't caused by typing
      // — e.g. arriving from the drafting phase — so the operator can type
      // immediately. Guarded so we only autofocus when the field is empty
      // of a selection.
      if (s._focusOnRender) { s._focusOnRender = false; try { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {} }
    }

    /* v1.0.9 — critique box follows the SAME uncontrolled-input rule as
       the prompt box: store the value, toggle affordances in place,
       never re-render mid-typing. The only live dependency is the Amend
       button's disabled state, which is flipped directly. */
    var ct = modalEl.querySelector('#ixig-crit');
    if (ct && !busy) {
      ct.addEventListener('input', function () {
        s.critique = ct.value;
        var on = !!ct.value.trim();
        ct.classList.toggle('dirty', on);
        var ab = modalEl.querySelector('[data-ixig="amend"]');
        if (ab) ab.disabled = !on;
      });
      if (s._focusCritique) { s._focusCritique = false; try { ct.focus(); ct.setSelectionRange(ct.value.length, ct.value.length); } catch (e) {} }
    }
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* v1.0.5 — render() is now called through this wherever a throw
     would strand an in-flight or about-to-fly request. The modal is a
     diagnostic surface; a fault in the diagnostics must never break the
     thing being diagnosed. */
  function safeRender() {
    try { render(); }
    catch (e) {
      try { console.error('[img-gen v' + VERSION + '] render failed', e); } catch (e2) {}
    }
  }

  function onModalClick(e) {
    var t = e.target.closest('[data-ixig]'); if (!t) {
      if (e.target.classList && e.target.classList.contains('ixig-backdrop')) close();
      return;
    }
    var act = t.getAttribute('data-ixig');
    var s = state; if (!s) return;
    if (act === 'close') return close();
    if (act === 'cancel') {
      // v1.0.4 — after a refusal there is no drafted prompt to revert TO,
      // so Cancel must close rather than silently wiping what the
      // operator just typed back to an empty string.
      if (s.phase === 'blocked' && !s.drafted) { close(); return; }
      if (s.prompt !== s.drafted) { s.prompt = s.drafted; s._focusOnRender = true; render(); }   // revert
      else close();
      return;
    }
    /* v1.0.9 — AMEND. Reads both live textareas first so nothing typed
       in the last keystroke is lost, then sends the CURRENT prompt plus
       the critique. On return the prior prompt is remembered so the
       changed-words strip has something to diff against. No Flux call,
       no credit. */
    if (act === 'amend') {
      var pLive = modalEl.querySelector('#ixig-prompt');
      var cLive = modalEl.querySelector('#ixig-crit');
      if (pLive) s.prompt = pLive.value;
      if (cLive) s.critique = cLive.value;
      if (!s.critique || !s.critique.trim()) { s.error = 'Say what you want changed first.'; render(); return; }
      if (!s.prompt || !s.prompt.trim()) { s.error = 'There is no prompt to amend.'; render(); return; }
      var before = s.prompt;
      s.phase = 'amending'; s.error = '';
      safeRender();
      amendPrompt(before, s.critique).then(function (out) {
        if (!state) return;
        state.priorPrompt = before;
        state.prompt      = out.prompt;
        state.drafted     = out.prompt;   // amended text is the new baseline for "edited"
        state.amendNote   = out.note;
        state.changed     = diffAdded(before, out.prompt);
        state.critique    = '';           // consumed — it lives in the prompt now
        state.phase       = 'ready';
        state._focusOnRender = true;
        safeRender();
      }).catch(function (err) {
        if (!state) return;
        state.phase = 'ready';
        state.error = (err && err.message) || 'Could not amend the prompt.';
        safeRender();
      });
      return;
    }
    /* v1.0.9 — keep any attempt, not only the newest. */
    if (act === 'keep') {
      var ki = parseInt(t.getAttribute('data-idx'), 10);
      var att = (s.history || [])[ki];
      if (!att) return;
      s.result = att.result; s.resultUrl = att.url;
      useResult(t, att.prompt);
      return;
    }
    /* v1.0.9 — pull an earlier attempt's prompt back into the editor
       without regenerating. Lets the operator branch from a good
       ancestor after an amendment went the wrong way. */
    if (act === 'restore') {
      var ri = parseInt(t.getAttribute('data-idx'), 10);
      var ra = (s.history || [])[ri];
      if (!ra) return;
      s.priorPrompt = s.prompt;
      s.prompt = ra.prompt; s.drafted = ra.prompt;
      s.changed = []; s.amendNote = '';
      s._focusOnRender = true;
      render();
      return;
    }
    // v1.0.4 — redraft with the publisher notes dropped.
    if (act === 'renotes') { s.ignoreNotes = true; runDraft(); return; }
    /* v1.0.7 — people segment. A redraft REPLACES the prompt, so an
       operator who has hand-edited it would silently lose that work.
       Confirm first. Re-selecting the mode already in force is a no-op
       rather than a pointless round-trip. */
    if (act === 'people') {
      var want = t.getAttribute('data-people') || 'none';
      if (want === (s.people || 'none')) return;
      var edited = s.prompt && s.prompt !== s.drafted;
      if (edited && !window.confirm('Redraw the prompt for "' + peopleMode(want).label +
            '"? Your edits to the current prompt will be discarded.')) return;
      s.people   = want;
      s.resultUrl = ''; s.result = null;   // any preview belongs to the old prompt
      runDraft();
      return;
    }
    if (act === 'generate') {
      // Read the LIVE textarea value so the final state is captured even
      // if the last input event hasn't flushed.
      var taLive = modalEl.querySelector('#ixig-prompt');
      if (taLive) s.prompt = taLive.value;
      if (!s.prompt.trim()) { s.error = 'Prompt is empty.'; render(); return; }
      // v1.0.8 — soft gate, not a hard block. The lists are heuristic;
      // the operator can override, but never spends a Flux run blind.
      var viol = validatePrompt(s.prompt);
      if (viol.length) {
        var names = [];
        for (var vi = 0; vi < viol.length && vi < 6; vi++) names.push('\u201c' + viol[vi].term + '\u201d');
        if (!window.confirm('This prompt breaks house rules: ' + names.join(', ') +
              '. Generate anyway?')) return;
      }
      s.phase = 'generating'; s.error = '';
      // v1.0.5 — render() must not be able to strand the operation. A
      // throw in the pre-flight render used to abort the handler before
      // the fetch was issued, leaving the modal stuck on "Generating...".
      // The request now goes out regardless; a render fault is logged,
      // not fatal.
      safeRender();
      var usedPrompt = s.prompt;
      generateImage(usedPrompt).then(function (j) {
        if (!state) return;
        state.result = j; state.resultUrl = j.url;
        /* v1.0.9 — every attempt is kept WITH the prompt that made it.
           Without the pairing the history is just pictures; with it the
           operator can see which wording produced which result, and
           branch from any of them. */
        state.history = state.history || [];
        state.history.push({ url: j.url, result: j, prompt: usedPrompt });
        state.phase = 'done';
        state.changed = []; state.amendNote = '';
        state._focusCritique = true;   // the next move is almost always a critique
        safeRender();
      }).catch(function (err) {
        if (!state) return;
        state.phase = 'ready'; state.error = (err && err.message) || 'Generation failed.'; safeRender();
      });
      return;
    }
    /* v1.0.9 — no footer "Use as main image" any more: with several
       attempts on screen a single footer button is ambiguous about
       WHICH image it accepts, so acceptance moved onto the cards. This
       branch is retained as a stable entry point for any caller still
       dispatching 'use', and takes the current editor prompt. */
    if (act === 'use') { useResult(t, s.prompt); return; }
  }

  /* v1.0.9 — extracted from the 'use' handler so "Keep this one" on any
     attempt card runs the identical path. The prompt passed in is the
     one that PRODUCED that image, not whatever is currently in the
     editor — otherwise a kept older attempt would be filed under a
     prompt it never came from. */
  function useResult(btn, promptUsed) {
    var s = state; if (!s) return;
    {
      btn.disabled = true; btn.innerHTML = '<span class="ixig-spin"></span>Adding…';
      createMedia(s.result, promptUsed).then(function (res) {
        if (res && res.fallback) {
          asfToast('Image generated. Scenario L not wired — copy the URL and use Replace.', 'info');
          close();
          return;
        }
        // Hand the new Available MEDIA to the ASF's own main-image setter.
        // The slot goes dirty; the operator's Save assigns it (ASF's job).
        var ok = handToAsf(res.media);
        if (ok) {
          asfToast('Image added to the main-image slot — Save to assign it.', 'success');
        } else {
          asfToast('MEDIA created. Pick it from the library to attach.', 'info');
        }
        close();
      }).catch(function (err) {
        if (!state) return;
        state.error = 'Could not add image: ' + ((err && err.message) || 'unknown');
        state.phase = 'done'; safeRender();
      });
    }
  }

  function asfToast(msg, kind) {
    var I = window.InbxASF && window.InbxASF._internal;
    if (I && typeof I.toast === 'function') return I.toast(msg, kind);
    log(kind, msg);
  }

  function open(bodyHtml) {
    styleTag();
    // v1.0.4 — bodyHtml is kept so the draft can be re-run (with or
    // without the notes) without reopening the modal.
    state = { phase: 'drafting', drafted: '', prompt: '', resultUrl: '', result: null,
              error: '', reason: '', bodyHtml: String(bodyHtml || ''), ignoreNotes: false,
              // v1.0.9 — the critique loop's state. history holds every
              // attempt paired with the prompt that produced it; changed
              // holds the words the last amendment introduced.
              critique: '', history: [], changed: [], amendNote: '', priorPrompt: '',
              // v1.0.7 — module-scoped persistence deliberately NOT used.
              // People are contextual per article; inheriting the last
              // article's choice would be a wrong answer most of the time.
              people: 'none' };
    modalEl = document.createElement('div');
    modalEl.className = 'ixig-backdrop';
    modalEl.innerHTML = '<div class="ixig-modal wide"></div>';
    modalEl.addEventListener('click', onModalClick);
    document.body.appendChild(modalEl);
    document.addEventListener('keydown', onKey, true);
    render();

    runDraft();
  }

  /* v1.0.4 — extracted from open() so "Draft again without notes" can
     re-enter it. A refusal now sets phase 'blocked' but leaves the whole
     editable surface live underneath. */
  function runDraft() {
    var s = state; if (!s) return;
    s.phase = 'drafting'; s.error = ''; s.reason = '';
    render();
    draftPrompt(s.bodyHtml, { ignoreNotes: s.ignoreNotes, people: s.people }).then(function (out) {
      if (!state) return;   // closed mid-flight
      if (!out.generate) {
        state.phase   = 'blocked';
        state.reason  = out.reason || '';
        state.drafted = '';
        state.prompt  = '';
        state._focusOnRender = true;
        render();
        return;
      }
      state.drafted = out.prompt || '';
      state.prompt  = state.drafted;
      state.phase   = 'ready';
      state._focusOnRender = true;
      render();
    }).catch(function (err) {
      if (!state) return;
      state.phase = 'ready'; state.drafted = ''; state.prompt = '';
      state.error = (err && err.message) || 'Could not draft a prompt.';
      state._focusOnRender = true;
      render();
    });
  }

  /* ── Self-wire to the existing generate-main button ──
     Capture-phase listener intercepts BEFORE the ASF delegated click
     router shows its "coming soon" toast. We read the body from the
     ASF bridge if present, else from the live state hook. */
  function getBodyHtml() {
    var I = window.InbxASF && window.InbxASF._internal;
    if (I && I.state && I.state.article && I.state.article.bodyHtml) {
      return I.state.article.bodyHtml;
    }
    // Fallback: read from the live Trix editor if mounted
    var trix = document.querySelector('trix-editor');
    if (trix && trix.innerHTML) return trix.innerHTML;
    return '';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-asf-action="generate-main"]');
    if (!btn) return;
    e.stopPropagation();   // pre-empt the ASF stub toast
    e.preventDefault();
    open(getBodyHtml());
  }, true);  // capture phase

  window.InbxImageGen = { open: open, version: VERSION };
  log('ready');
})();
