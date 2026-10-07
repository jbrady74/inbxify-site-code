// ix-issue-data-v1.0.14.js
// ============================================================
// INBXIFY · Cloudflare Worker · ix-issue-data
// One call returns every record an issue needs, already joined.
// Data Worker step 1 (D152). Replaces 206's per-row Webflow lookups.
//
// v1.0.14 (7 Oct 2026) — every /plan-board allocation carries `plans`: the
//   ids of ALL the PubPlans that ALLOCATIONS row is assigned to, not just
//   this one. The Picker needs it to free an allocation when a slot is
//   emptied: it writes the row's plans minus this plan back through 103B,
//   so the Allocator shows the row unassigned. Additive; nothing removed.
// v1.0.13 (6 Oct 2026) — IPP Build S4, slice 3 (Link). Nothing is removed
//   or renamed.
//   1 · /plan-board answers
//         linkFields         { article: "asset-article", event: "asset-event",
//                              re: "asset-re", ad: "asset-ad" }
//                            The ALLOCATIONS fields 103B `link` writes, from
//                            JOIN.alloc. The IPP sends these; no slug is
//                            typed into the page.
//         loosePositionFrom  IX_CONFIG.loosePositionFrom, the one place the
//                            loose-row position lives (IA10, ruled 6 Oct:
//                            Worker only, no TA_CONFIG copy).
//   2 · NEW GET /plans?titleAdminId=<TITLES-ADMIN id>[&fresh=1]
//         -> { ok:true, plans, loosePositionFrom, meta }
//       plans  this title's PUBLICATION PLAN rows, newest date first:
//                { id, name, date, planningStatus, open }
//              planningStatus is the option's name (no hashes).
//              open is true when that name is in IX_CONFIG.openPlanStatuses
//              (e.g. ["In Progress"]), false when not, and null for every
//              plan, with a warning, when the key is not set.
//              A name in openPlanStatuses that the schema does not have is
//              named in meta.warnings.
//       The Asset Library's Assign list and the Allocator read this
//       instead of page elements and typed numbers (closure S3 §07 item 1,
//       HC-P-IPP3-8, IA10). The plan list comes from the 10-minute cache;
//       fresh=1 skips it.
//       ACCESS  Same as /plan-board: only origins in IX_CONFIG.allowedOrigins.
//   HARDCODING: none new. The planning-status slug was already in
//   JOIN.planBoard (HC-P-IPP2-1 class).
//
// v1.0.12 (6 Oct 2026) — /plan-board gives what the IPP needs to write
//   (IPP Build S3, slice 2). Nothing is removed or renamed.
//   1 · writeIds  { assetType: { article: "<option id>", ... },
//                   blockType: { EV: "<option id>", RE: "<option id>", ... } }
//       The same IX_CONFIG.assetTypes and IX_CONFIG.blockTypes, turned
//       around (key -> option id). One-tap Add writes these through
//       Scenario 124 create, so no option id is typed into the IPP.
//       A key that appears twice in IX_CONFIG is named in meta.warnings
//       and left out (never guessed).
//   2 · The Greeting row. A slot whose block type is GR also answers
//       greeting { title, paragraph, supershort } from NL-BLOCKS
//       block-greeting-title, block-greeting-paragraph and
//       block-greeting-supershort. The IPP's Greeting card reads and
//       updates THIS row, instead of a hidden list the page never
//       rendered (which made every Greeting Save create a second GR row).
//       A missing field in the NL-BLOCKS schema is named in meta.warnings.
//   3 · addTypes (optional IX_CONFIG.addTypes, HC-P-IA-10). What a one-tap
//       Add makes in each Picker section, as asset type key and block
//       type label:
//         "addTypes": { "article": "", "event": "EV", "re": "RE" }
//       "" means the block type stays empty (an Article; the Layout tab
//       types it). Answered as addTypes: { article: { assetType:
//       "article", blockType: "" }, ... }. A key with no option id in
//       writeIds is left out and named in meta.warnings. Without the key
//       the answer is addTypes: null with a warning, and the IPP shows
//       no Add tile (it never guesses what to make).
//   4 · Paid on allocation lines. Each allocation also answers
//         customer      ALLOCATIONS suggested-customer (text), or null
//         paidOverride  "paid" | "not-paid" | null (paid-override)
//         paidNote      paid-note, or null
//         paid          the rule (D-CB-7): an Article with a Customer is
//                       paid; a hand override wins either way. The same
//                       rule the Allocator and the Intake Review use.
//   HARDCODING: the new slugs join JOIN.block and JOIN.alloc
//   (HC-P-IPP2-1, same class as HC-P-DW1-2). The rule's word "article"
//   is the Allocator's own type word (HC-P-IPP3-1, by design).
//
// v1.0.11 (6 Oct 2026) — /plan-board gives the title's page slug.
//   plan gains titleSlug: the TITLES-ADMIN record's slug, which is the
//   last part of its T-A page address (/title-admin/<slug>). The IPP's
//   Close Plan and Return builds its link from it instead of guessing
//   (the old guess, /title-admin?ta=<id>, answered 404). null, with a
//   warning, when the plan has no title. Nothing else changed.
//
// v1.0.10 (6 Oct 2026) — /plan-board names the title (IPP Build S2).
//   plan gains titleName: the TITLES-ADMIN record's name, read from the
//   cached TITLES-ADMIN list (fresh=1 refreshes it). The IPP header shows
//   it instead of a name typed into the page embed (HC-P-IPP2-6). A plan
//   with no title, or one pointing at a missing record, answers
//   titleName null and says so in meta.warnings.
//   Needs IX_CONFIG.collections.titles (already set). Nothing else changed.
//
// v1.0.9 (6 Oct 2026) — GET /plan-board for the IPP Picker (IPP Build S2,
//   slice 1, IA4). Scoping: IPP-Allocations-Scoping-v0_5.md §08.
//     GET /plan-board?planId=<PUBLICATION PLAN id>[&fresh=1]
//     -> { ok:true, plan, slots, loose, allocations, accepts, meta }
//   plan         { id, name, date, titleAdminId, planningStatus }
//                planningStatus is the option's name, read from the
//                PUBLICATION PLAN schema (no hashes typed here).
//   slots        NL-BLOCKS rows of this plan below loosePositionFrom, in
//                position order:
//                  { id, position, slotKey, assetType, blockType, endGroup,
//                    blockText, asset, listCount }
//                assetType  key from IX_CONFIG.assetTypes ("article", "ad",
//                           "text-ad", "re", "event", "other"), or null.
//                           A row with none, or with an option not in
//                           IX_CONFIG.assetTypes, is null and named in
//                           meta.warnings. Nothing is guessed (v0.4).
//                blockType  label from IX_CONFIG.blockTypes (FA, TS, LBP,
//                           ...), "" when the row has none (an untyped
//                           Article), null when the option is not in
//                           IX_CONFIG.blockTypes (warned).
//                asset      { kind, id, name, customer, thumb } or null.
//                           Read from the field IX_CONFIG.slotAccepts
//                           names for the row's asset type. customer is
//                           the article's Customer (associated-business-coc)
//                           or the ad's advertiser; null when none.
//                listCount  for asset types whose slotAccepts value is
//                           "list" (Events, Real Estate, Text Ad): how many
//                           items the row's list holds. null otherwise.
//   loose        NL-BLOCKS rows of this plan at loosePositionFrom or above:
//                  { id, position, asset: {kind, id, name, customer} | null }
//   allocations  ALLOCATIONS rows whose publication-plans include this plan,
//                minus hidden dispositions, in page order:
//                  { id, printTitle, section, page, pdfPage, pdfUrl, type,
//                    disposition, asset: {kind, id, name} | null,
//                    placement: {blockId, position, loose} | null }
//                type and disposition are the option names, written as
//                the page writes them ("print-ad", "not-for-newsletter").
//                asset null means no article is linked (a salmon line).
//                placement is the NL-BLOCKS row of this plan that holds
//                the linked asset, including inside an Events or RE list.
//   accepts      IX_CONFIG.slotAccepts, as stored.
//   writeIds     (v1.0.12) { assetType: {key: option id}, blockType: {label: option id} }
//   addTypes     (v1.0.12) { section key: { assetType, blockType } } or null
//   Freshness    NL-BLOCKS and ALLOCATIONS are listed fresh on every call.
//                Articles, events and listings are read by id, fresh.
//                ADS, CUSTOMERS and the schemas come from the 10-minute
//                cache; fresh=1 skips it.
//   ACCESS       Same as /issue-check: no X-IX-Key, only origins in
//                IX_CONFIG.allowedOrigins. Answers names and ids, never
//                article bodies.
//   Two checks for the BL to LBP rename (slice 0, item 3): a block-type
//   option whose name in Webflow differs from its IX_CONFIG.blockTypes
//   label, and an asset-type option missing from IX_CONFIG.assetTypes,
//   are both named in meta.warnings.
//   /issue-data, /issue-check and /splash are unchanged.
//
// v1.0.8 (4 Oct 2026) — GET /issue-check for the Compile button (Compile
//   Control S1, Priority Work rows 53 and 55).
//   The IPP's Publish view asks this route before anyone clicks Compile:
//     GET /issue-check?contextNlId=<NEWSLETTER id>&parentId=<PLAN id>
//     -> { ok:true, wouldStop, lastCompile, unpublished, unpublishedError,
//          notes, meta }
//   wouldStop    null, or { status, message }: the exact stop 206's first
//                step would hit. It runs the same buildIssue, through the
//                same cache, with the same ids, so the answer matches the
//                next compile (D207). Template problems are only found by
//                the render Worker, at compile time.
//   lastCompile  { sizeKb, limitKb, over } from the NEWSLETTER's
//                'email-size-kb' (written by 206, D218). sizeKb null means
//                never compiled. limitKb and over come from
//                IX_CONFIG.emailLimitBytes; without it both are null.
//   unpublished  [{ kind, name, id, state, positions }] for every record
//                the issue's blocks use, in the collections named by
//                IX_CONFIG.checkPublished. readMode is 'staged', so the
//                compile INCLUDES these edits; the record's own web page
//                does not show them until it is published.
//                  state 'draft'    never published, or set to draft:
//                                   its web page does not exist yet
//                  state 'edited'   changed since it was last published
//                  state 'archived' archived but still used
//                Without IX_CONFIG.checkPublished: unpublished null and
//                unpublishedError says so (never a silent empty list).
//   notes        the build's own warnings (meta.warnings): references that
//                point at nothing, bad design-json, and so on.
//   ACCESS: no X-IX-Key (a browser page cannot hold the secret). Only
//   origins listed in IX_CONFIG.allowedOrigins are answered; anything
//   else gets 403. This stops other web pages, not someone in a terminal.
//   The answer holds record names and ids, never field content.
//   Lists are read from the 10-minute cache like a compile, so an edit to
//   an ad or a customer can take up to cacheSeconds to show here.
//   /issue-data and /splash are unchanged.
//
// v1.0.7 (4 Oct 2026) — the splash times (Clean-Up S2).
//   /splash (both routes) also answers timing { ms, msNoAd } from the same
//   tokens file: splash-ms (the whole splash with an ad) and splash-ms-no-ad
//   (with none). Platform defaults in ix/email-tokens-v18.json: 6960 and
//   3000. Each must be whole milliseconds from 1000 to 20000. A problem
//   gives timing null and timingError; colours and ads are answered as
//   before. Nothing else changed.
//
// v1.0.6 (4 Oct 2026) — the splash page's colours (Clean-Up S2, HC-P-CU1-4).
//   /splash also answers colors: the title's splash colours, read from the
//   title's tokens file (TITLES-ADMIN 'email-tokens-file', the same file the
//   render Worker reads), merged with the files it extends and with every
//   '@name' resolved, exactly as the render Worker does it:
//     colors { bg, accent, ink, tileBg, tileBorder }
//       from splash-bg, splash-accent, splash-ink, splash-tile-bg,
//       splash-tile-border (platform defaults in ix/email-tokens-v17.json)
//   Each must be a hex colour (#abc or #aabbcc). If the field is empty, a
//   file cannot be read, or a colour is missing, colors is null and
//   colorsError says why; the logo and the ad are still answered, so a sold
//   splash ad still shows (in the splash page's neutral look).
//   GET /splash?logo=<url> (no n=) answers only colors, for the long links
//   legacy 106 still writes (they carry the logo, not the issue). The logo
//   is matched to a title by its Uploadcare id against TITLES-ADMIN
//   'title-masthead-ulc-link-for-splash' (what 106 writes) and TITLES
//   'title-logo-url'. Exactly one title must match. Remove this route
//   when 106 retires.
//   Nothing else changed.
//
// v1.0.5 (4 Oct 2026) — a second splash picture for house ads (D220).
//   /splash also answers ad2: the title's Splash house ad's
//   'splash-ad-link-2---get' (empty when not set, and always empty for a
//   paid splash ad). Splash v3.4 shows the first picture, then the second,
//   for half of the ad time each. Nothing else changed.
//
// v1.0.4 (4 Oct 2026) — GET /splash for the splash page (Clean-Up S1, D219).
//   Short splash links: an email link now carries only the issue id and the
//   destination (splash.inbxify.com/?n=<NEWSLETTER id>&to=...). The splash
//   page (v3.3) asks this route what to show:
//     GET /splash?n=<NEWSLETTER id>
//     -> { ok, logo, ad, su, sn, house, source }
//   logo   the title's TITLES 'title-logo-url'
//   ad     the picture: the issue's paid splash ad (NEWSLETTER
//          'splash-ad-image') when sold; otherwise the title's Splash house
//          ad (an ADS item whose 'house-kind' is IX_CONFIG.options
//          .houseKindSplash and whose 'titles' include this title; its
//          'splash-ad-link--get'); otherwise empty (masthead only)
//   su     where a tap goes: 'splash-sponsor-go-url' (paid) or the house
//          ad's 'redirect-link'
//   sn     the paid sponsor's name, or the publisher's name for a house ad
//   house  true for a house ad, so the page never labels it "Sponsored"
//   source 'paid' | 'house' | 'none'
//   Public and read-only: no X-IX-Key, because every value here is already
//   public (it used to travel in every email link). Answers are cached per
//   issue for cacheSeconds. Drafts and archived ADS are skipped; with more
//   than one Splash house ad for a title, the most recently updated wins.
//   /issue-data is unchanged.
//
// v1.0.3 (4 Oct 2026) — the title's TITLES item (Clean-Up S1, M1).
//   context.titleSite is the TITLES item whose 'titles-admin' reference
//   points at this issue's TITLES-ADMIN record (NEWSLETTER 'sector').
//   206 reads public title fields from it, starting with 'title-logo-url'
//   for the splash link. Required (D207): no matching item, or more than
//   one, stops the run with 422. TITLES is a cached list like the others,
//   so fresh=1 refreshes it. Needs IX_CONFIG.collections.titlesSite.
//   Nothing else changed.
//
// v1.0.2 (3 Oct 2026) — a section for blocks without an article (D182).
//   Events, RE and any other block with no article now get block.section
//   from the design-json cascade, so 206 reads their section art and name
//   exactly as it does for a story:
//     block design-json   sectionId, or types.<TYPE>.sectionId
//     plan design-json    types.<TYPE>.sectionId
//     title design-json   types.<TYPE>.sectionId
//     publisher design-json (field 'design-json', when PUBLISHERS has it)
//   <TYPE> is the block's type label (EV, RE, ...), read from
//   IX_CONFIG.blockTypes: { "<NL-BLOCKS block-type option id>": "EV", ... }.
//   A block with an article keeps its article's section. A sectionId that
//   is not in SECTIONS is a warning, not a failure. block.sectionFrom says
//   which level supplied it.
//   Nothing else changed.
//
// v1.0.1 (2 Oct 2026) — paging hardened. Collection size never limits
//   what the Worker sees.
//   1 · A list no longer trusts Webflow's reported total alone. It reads
//       the pages the total implies, then keeps reading while the last
//       page came back full. Only a short page ends a list.
//   2 · The ceiling rises from 5,000 to 10,000 items per listed
//       collection. Past it, the run fails with a plain message. It
//       never answers from part of a list.
//   Nothing else changed.
//
// v1.0.0 (2 Oct 2026) — first build. Decisions D153 to D159.
//
// REQUEST
//   GET /issue-data?contextNlId=<NEWSLETTER id>&parentId=<id>[&fresh=1]
//   Header  X-IX-Key: <shared secret>
//
//   Same two ids 206's webhook receives. parentId is used exactly as
//   206 v1.29 uses it: NL-BLOCKS are kept when `publication-plan`
//   equals parentId, and the PUBLICATION PLAN is parentId unless
//   parentId is the NEWSLETTER's own id, in which case it is the
//   NEWSLETTER's `publication-plan`.
//
//   fresh=1 skips every cache and refills it. Use it on the run
//   after an edit to DESIGNS, ADS, CUSTOMERS, SECTIONS, TITLES-ADMIN,
//   TITLES, PUBLISHERS or PRODUCT LIBRARY.
//
// RESPONSE (200)
//   {
//     ok: true,
//     context: {
//       newsletter, title, publisher, plan,     // Webflow items
//       titleSite,                              // TITLES item (v1.0.3)
//       franchises: [items],                    // PRODUCT LIBRARY items named
//                                               // by any design-json in play
//       activeBannerAds: [{bannerLink, advertiserId, redirectLink}]
//                                               // same shape as 206 module 233,
//                                               // limited to this issue's payers
//     },
//     blocks: [ NL-BLOCK item, plus, one level deep:
//       design, ad, article, section, author, sponsor, payer,
//       re, reAgent, events[], reListings[] (each with .agent and ._opt),
//       txaAds[] (each with .customer) ],
//     meta: { version, readMode, webflowCalls, retries, cached, ms,
//             blockCount, warnings }
//   }
//   Every record keeps Webflow's own shape (id, fieldData, ...). Field
//   names are never changed, so 206's expressions keep their field
//   names and only change where they read from (D153).
//   A reference that is blank, or points at a deleted item, comes back
//   as null (or is left out of a list) and is named in meta.warnings.
//   Blocks keep Webflow's list order, the order 206 has always seen.
//
// FAILURE (D156)
//   Webflow refusing (429) or failing (5xx) is retried with its
//   Retry-After, up to MAX_RETRIES times. If it still fails, the whole
//   response is an error: { ok:false, error, meta }. The Worker never
//   returns an issue with a block quietly missing. Absence (a deleted
//   item) is data; refusal is failure.
//
// CONFIG (Cloudflare dashboard → Settings → Variables and Secrets)
//   WEBFLOW_TOKEN   Secret. Webflow API token, CMS read.
//   IX_KEY          Secret. The value 206 sends in X-IX-Key.
//   IX_CONFIG       Plain text, JSON. Collection ids, two ADS option
//                   ids, cache seconds, read mode. Platform values
//                   (one Webflow site serves every publisher), not
//                   tenant values. HC-P-DW1-1.
//
// HARDCODING (provisional ids, for the doc-maintenance chat)
//   HC-P-DW1-1  Collection and option ids in IX_CONFIG. By design.
//   HC-P-DW1-2  Reference field slugs in JOIN below. Open.
//   HC-P-DW1-3  Cache lifetime in IX_CONFIG.cacheSeconds. By design.
//   HC-P-CU2-1  Token file address (repo, branch, templates/) typed in
//               TOKENS_CDN, the same as the render Worker's CDN. By design
//               (one platform repo).
//   HC-P-CU2-2  The splash token names in SPLASH_COLOR_TOKENS and
//               SPLASH_TIME_TOKENS, and the 1000-20000 ms range. By design
//               (platform names; values live in the token files).
//   HC-P-CC1-8  IX_CONFIG.emailLimitBytes repeats the render Worker's
//               EMAIL_WARN_BYTES (95 KB = 97280). Must be changed in both.
//               By design until the render Worker can answer it.
//   HC-P-CC1-9  The English kind names in CHECK_KINDS. By design (copy).
//
// IX_CONFIG KEYS ADDED IN v1.0.8 (all optional; /issue-check says what
// is missing rather than guessing)
//   allowedOrigins   ["https://inbxify.com","https://www.inbxify.com"]
//                    Without it /issue-check answers 403 to everyone.
//   checkPublished   ["articles","events","re","customers","ads"]
//                    Which kinds of record are checked for unpublished
//                    edits. Any of the keys in CHECK_KINDS.
//   emailLimitBytes  97280
//
// IX_CONFIG KEYS ADDED IN v1.0.9 (for /plan-board; it says what is
// missing rather than guessing)
//   collections.allocations   ALLOCATIONS collection id. Required.
//   assetTypes        { "<NL-BLOCKS asset-type option id>": "article", ... }
//                     One line per option. Keys used by the IPP:
//                     article, ad, text-ad, re, event, other. HC-P-IA-12.
//   slotAccepts       { "article": "asset-article", "ad": "asset-ad",
//                       "text-ad": "list", "re": "list", "event": "list",
//                       "other": "" }  HC-P-IA-4.
//   loosePositionFrom 900. Rows at or above it are loose rows. HC-P-IA-3.
//   hiddenDispositions ["held", "not-for-newsletter"]. HC-P-IA-5.
//   blockTypes        existing key; should now hold every block-type
//                     option, with LBP in place of BL.
//
// IX_CONFIG KEY ADDED IN v1.0.12 (optional; /plan-board says when it is missing)
//   addTypes          { "article": "", "event": "EV", "re": "RE" }  HC-P-IA-10.
//
// HARDCODING ADDED IN v1.0.9 (provisional ids)
//   HC-P-IPP2-1  NL-BLOCKS slugs slot-key, end-group, block-text,
//                asset-type, and the ALLOCATIONS slugs in JOIN.alloc.
//                Same class as HC-P-DW1-2. Open.
//   HC-P-IPP2-2  Option names become keys by lower case and hyphens
//                ("Not for newsletter" -> "not-for-newsletter"), the way
//                the Allocator already writes them. By design.
// ============================================================

const VERSION = '1.0.14';
const WF = 'https://api.webflow.com/v2';
const PAGE = 100;          // Webflow v2 maximum per call
const MAX_PAGES = 100;     // a list past 10,000 items is an error, never a silent cap
const PARALLEL = 4;        // Webflow calls in flight at once
const MAX_RETRIES = 4;     // per call, on 429 or 5xx

// v1.0.6 — token files, read the way the render Worker reads them. HC-P-CU2-1.
const TOKENS_CDN = (file) => 'https://cdn.jsdelivr.net/gh/jbrady74/inbxify-site-code@main/templates/' +
  String(file).replace(/^\/+/, '').replace(/^templates\//, '');
// v1.0.6 — answer key -> token name. HC-P-CU2-2.
const SPLASH_COLOR_TOKENS = {
  bg: 'splash-bg', accent: 'splash-accent', ink: 'splash-ink',
  tileBg: 'splash-tile-bg', tileBorder: 'splash-tile-border',
};
// v1.0.7 — answer key -> token name, in milliseconds. HC-P-CU2-2.
const SPLASH_TIME_TOKENS = { ms: 'splash-ms', msNoAd: 'splash-ms-no-ad' };

// Which field holds which reference. Schema knowledge, read from
// 206 v1.29's own mappings on 2 Oct 2026. HC-P-DW1-2.
const JOIN = {
  block: {
    plan: 'publication-plan',
    design: 'design',
    ad: 'asset-ad',
    article: 'asset-article',
    sponsor: 'asset-ad-sponsor',
    payer: 'paid-by-customer',
    events: 'asset-event',
    re: 'asset-re',
    designJson: 'design-json',
    type: 'block-type',
    assetType: 'asset-type',     // v1.0.9
    slotKey: 'slot-key',         // v1.0.9
    endGroup: 'end-group',       // v1.0.9 (display name "end-group-here")
    blockText: 'block-text',     // v1.0.9
    greetTitle: 'block-greeting-title',           // v1.0.12
    greetParagraph: 'block-greeting-paragraph',   // v1.0.12
    greetSupershort: 'block-greeting-supershort', // v1.0.12
  },
  // v1.0.9 — ALLOCATIONS, as the Allocator writes it. HC-P-IPP2-1.
  alloc: { plans: 'publication-plans', printTitle: 'print-title', section: 'section',
           page: 'page', pdfPage: 'pdf-page', pdfUrl: 'print-pdf-url', type: 'type',
           disposition: 'disposition', article: 'asset-article', event: 'asset-event',
           re: 'asset-re', ad: 'asset-ad',
           customer: 'suggested-customer', paidOverride: 'paid-override', paidNote: 'paid-note' },   // v1.0.12
  // v1.0.9 — PUBLICATION PLAN fields the board answers.
  planBoard: { date: 'publication-date', titleAdmin: 'title-admin', status: 'planning-status' },
  newsletter: { title: 'sector', plan: 'publication-plan' },
  title: { publisher: 'associated-client', designJson: 'design-json',
           tokens: 'email-tokens-file',                                   // v1.0.6
           legacySplashLogo: 'title-masthead-ulc-link-for-splash' },      // v1.0.6, until 106 retires
  titleSite: { titleAdmin: 'titles-admin' },   // v1.0.3: TITLES -> TITLES-ADMIN
  plan: { designJson: 'design-json' },
  publisher: { designJson: 'design-json' },   // v1.0.2: read when the field exists
  article: { section: 'section', author: 'associated-business-coc' },
  re: { agent: 'listing-agent-customer' },
  ad: { customer: 'associated-advertiser', type: 'add-type', status: 'status',
        bannerLink: 'banner-ad-link', redirectLink: 'redirect-link',
        houseKind: 'house-kind', titles: 'titles', splashLink: 'splash-ad-link--get',
        splashLink2: 'splash-ad-link-2---get' },   // v1.0.4
  splash: { logo: 'title-logo-url', paidAd: 'splash-ad-image', paidGo: 'splash-sponsor-go-url',
            paidName: 'splash-sponsor-name' },                                       // v1.0.4
};

// v1.0.8 — kinds /issue-check can check, and where each sits on a joined
// block. HC-P-CC1-9 (the names are page copy).
const CHECK_KINDS = {
  articles:  { label: 'Article',    from: b => [b.article] },
  events:    { label: 'Event',      from: b => b.events || [] },
  re:        { label: 'Listing',    from: b => [b.re].concat(b.reListings || []) },
  customers: { label: 'Business',   from: b => [b.author, b.sponsor, b.payer, b.reAgent]
                 .concat((b.reListings || []).map(x => x.agent), (b.txaAds || []).map(x => x.customer)) },
  ads:       { label: 'Ad',         from: b => [b.ad].concat(b.txaAds || []) },
};

const REQUIRED_COLLECTIONS = ['newsletter', 'titles', 'titlesSite', 'publishers', 'plan', 'blocks',
  'designs', 'ads', 'articles', 'sections', 'customers', 'events', 're', 'franchises'];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ ok: true, version: VERSION }, 200);
    if (request.method !== 'GET') return fail(405, 'Only GET is supported.');
    if (url.pathname === '/splash') return splashRoute(env, ctx, url);       // v1.0.4, public
    if (url.pathname === '/issue-check') return checkRoute(env, ctx, url, request);   // v1.0.8
    if (url.pathname === '/plan-board') return boardRoute(env, ctx, url, request);    // v1.0.9
    if (url.pathname === '/plans') return plansRoute(env, ctx, url, request);         // v1.0.13
    if (url.pathname !== '/issue-data') return fail(404, 'Unknown path. Use /issue-data, /issue-check, /plan-board, /plans or /splash.');

    if (!env.IX_KEY) return fail(500, 'IX_KEY is not set on this Worker.');
    if (request.headers.get('X-IX-Key') !== env.IX_KEY) return fail(401, 'Missing or wrong X-IX-Key header.');
    if (!env.WEBFLOW_TOKEN) return fail(500, 'WEBFLOW_TOKEN is not set on this Worker.');

    let cfg;
    try { cfg = JSON.parse(env.IX_CONFIG || ''); }
    catch (e) { return fail(500, 'IX_CONFIG is missing or is not valid JSON.'); }
    const C = cfg.collections || {};
    const missing = REQUIRED_COLLECTIONS.filter(k => !/^[0-9a-f]{24}$/.test(C[k] || ''));
    if (missing.length) return fail(500, 'IX_CONFIG.collections is missing: ' + missing.join(', ') + '.');

    const nlId = (url.searchParams.get('contextNlId') || '').trim();
    const parentId = (url.searchParams.get('parentId') || '').trim();
    if (!/^[0-9a-f]{24}$/.test(nlId)) return fail(400, 'Missing or malformed contextNlId.');
    if (!/^[0-9a-f]{24}$/.test(parentId)) return fail(400, 'Missing or malformed parentId.');

    const run = new Run(env, ctx, cfg, url.searchParams.get('fresh') === '1');
    try {
      const out = await buildIssue(run, nlId, parentId);
      return json(Object.assign({ ok: true }, out, { meta: run.meta(out.blocks.length) }), 200);
    } catch (e) {
      return json({ ok: false, error: (e && e.message) || String(e), meta: run.meta(null) },
        (e && e.status) || 502);
    }
  },
};

// ── The plan board (v1.0.9) ─────────────────────────────────

const BOARD_COLLECTIONS = ['plan', 'blocks', 'articles', 'ads', 'customers', 'events', 're', 'allocations', 'titles'];
const LIST = 'list';

async function boardRoute(env, ctx, url, request) {
  const origin = request.headers.get('Origin') || '';
  let cfg = null;
  try { cfg = JSON.parse(env.IX_CONFIG || ''); } catch (e) { cfg = null; }
  const allowed = (cfg && Array.isArray(cfg.allowedOrigins)) ? cfg.allowedOrigins : [];
  const ok = !!origin && allowed.includes(origin);
  const out = (obj, status) => new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'Vary': 'Origin' }, ok ? { 'Access-Control-Allow-Origin': origin } : {}),
  });
  if (!cfg) return out({ ok: false, error: 'IX_CONFIG is missing or is not valid JSON.' }, 500);
  if (!allowed.length) return out({ ok: false, error: 'IX_CONFIG.allowedOrigins is not set, so /plan-board answers no one.' }, 403);
  if (!ok) return out({ ok: false, error: 'This origin may not call /plan-board.' }, 403);
  if (!env.WEBFLOW_TOKEN) return out({ ok: false, error: 'WEBFLOW_TOKEN is not set on this Worker.' }, 500);
  const C = cfg.collections || {};
  const missing = BOARD_COLLECTIONS.filter(k => !/^[0-9a-f]{24}$/.test(C[k] || ''));
  if (missing.length) return out({ ok: false, error: 'IX_CONFIG.collections is missing: ' + missing.join(', ') + '.' }, 500);
  const gaps = [];
  if (!cfg.assetTypes || typeof cfg.assetTypes !== 'object' || !Object.keys(cfg.assetTypes).length) gaps.push('assetTypes');
  if (!cfg.slotAccepts || typeof cfg.slotAccepts !== 'object' || !Object.keys(cfg.slotAccepts).length) gaps.push('slotAccepts');
  if (!(Number(cfg.loosePositionFrom) > 0)) gaps.push('loosePositionFrom');
  if (!Array.isArray(cfg.hiddenDispositions)) gaps.push('hiddenDispositions');
  if (gaps.length) return out({ ok: false, error: 'IX_CONFIG is missing: ' + gaps.join(', ') + '.' }, 500);

  const planId = (url.searchParams.get('planId') || '').trim();
  if (!/^[0-9a-f]{24}$/.test(planId)) return out({ ok: false, error: 'Missing or malformed planId.' }, 400);

  const run = new Run(env, ctx, cfg, url.searchParams.get('fresh') === '1');
  try {
    const board = await buildBoard(run, planId);
    return out(Object.assign({ ok: true }, board, { meta: run.meta(board.slots.length + board.loose.length) }), 200);
  } catch (e) {
    return out({ ok: false, error: (e && e.message) || String(e), meta: run.meta(null) }, (e && e.status) || 502);
  }
}

async function buildBoard(run, planId) {
  const C = run.cfg.collections;
  const cfg = run.cfg;
  const B = JOIN.block, A = JOIN.alloc;

  // 1. Plan, rows and allocations fresh; slow lists and schemas cached.
  const [plan, blocksAll, allocAll, ads, customers, blockSchema, planSchema, allocSchema, titles] = await Promise.all([
    run.getItem('PUBLICATION PLAN', C.plan, planId),
    run.listAll(C.blocks),
    run.listAll(C.allocations),
    run.cachedList('ads', C.ads),
    run.cachedList('customers', C.customers),
    run.cachedSchema('blocks', C.blocks),
    run.cachedSchema('plan', C.plan),
    run.cachedSchema('allocations', C.allocations),
    run.cachedList('titles', C.titles),                       // v1.0.10
  ]);
  if (!plan) throw httpErr(404, 'planId is not in the PUBLICATION PLAN collection.');

  const blockOpts = optionMaps(blockSchema);
  const planOpts = optionMaps(planSchema);
  const allocOpts = optionMaps(allocSchema);
  const assetTypes = cfg.assetTypes;
  const blockTypes = cfg.blockTypes || {};
  const accepts = cfg.slotAccepts;
  const looseFrom = Number(cfg.loosePositionFrom);
  const hidden = cfg.hiddenDispositions.map(keyOf);

  // 2. Config checks against Webflow's own option lists.
  configChecks(run, blockOpts, assetTypes, blockTypes, accepts);
  // v1.0.12 — the Greeting fields must exist on NL-BLOCKS.
  const blockSlugs = new Set(((blockSchema && blockSchema.fields) || []).map(f => f.slug));
  [B.greetTitle, B.greetParagraph, B.greetSupershort].forEach(slug => {
    if (!blockSlugs.has(slug)) run.warn('NL-BLOCKS has no field "' + slug + '"; the Greeting card cannot read or show it.');
  });

  // 3. This plan's rows, in position order.
  const rows = blocksAll
    .filter(b => refId((b.fieldData || {})[B.plan]) === planId)
    .sort((a, b) => num(a.fieldData.position) - num(b.fieldData.position));
  const parsed = rows.map(b => parseDJ((b.fieldData || {})[B.designJson], 'block ' + b.id, run));

  // 4. This plan's allocations, minus hidden dispositions, in page order.
  const allocs = allocAll
    .filter(a => refIds((a.fieldData || {})[A.plans]).includes(planId))
    .map(a => Object.assign({}, a, {
      _type: keyOf(optName(allocOpts, A.type, (a.fieldData || {})[A.type])),
      _disp: keyOf(optName(allocOpts, A.disposition, (a.fieldData || {})[A.disposition])),
    }))
    .filter(a => !hidden.includes(a._disp))
    .sort((a, b) => num(a.fieldData[A.page]) - num(b.fieldData[A.page]) ||
                    num(a.fieldData[A.pdfPage]) - num(b.fieldData[A.pdfPage]));

  // 5. Read every article, event and listing named anywhere, by id.
  const want = { articles: new Set(), events: new Set(), re: new Set() };
  rows.forEach(b => {
    const fd = b.fieldData || {};
    refIds(fd[B.article]).forEach(id => want.articles.add(id));
    refIds(fd[B.events]).forEach(id => want.events.add(id));
    refIds(fd[B.re]).forEach(id => want.re.add(id));
  });
  allocs.forEach(a => {
    const fd = a.fieldData || {};
    refIds(fd[A.article]).forEach(id => want.articles.add(id));
    refIds(fd[A.event]).forEach(id => want.events.add(id));
    refIds(fd[A.re]).forEach(id => want.re.add(id));
  });
  const [articles, events, reItems] = await Promise.all([
    run.getMany('ARTICLES', C.articles, [...want.articles]),
    run.getMany('EVENTS', C.events, [...want.events]),
    run.getMany('RE LISTINGS', C.re, [...want.re]),
  ]);
  const adsBy = index(ads), custBy = index(customers);

  const custName = (raw) => {
    const id = refId(Array.isArray(raw) ? raw[0] : raw);
    if (!id) return null;
    const c = custBy.get(id);
    return c ? String((c.fieldData || {}).name || '') : null;
  };
  // One asset reference, shaped for the page.
  const shape = (kind, raw, where) => {
    const id = refId(Array.isArray(raw) ? raw[0] : raw);
    if (!id) return null;
    let item = null;
    if (kind === 'article') item = articles.get(id);
    else if (kind === 'ad') item = adsBy.get(id);
    else if (kind === 'event') item = events.get(id);
    else if (kind === 're') item = reItems.get(id);
    if (!item) {
      run.warn(where + ': ' + kind + ' ' + id + ' was not found.');
      return { kind, id, name: null, customer: null, thumb: null, missing: true };
    }
    const f = item.fieldData || {};
    let customer = null, thumb = null;
    if (kind === 'article') {
      customer = custName(f[JOIN.article.author]);
      thumb = f['main-image-ulc-link---1-1-ratio'] || (f['main-image'] && f['main-image'].url) || null;
    } else if (kind === 'ad') {
      customer = custName(f[JOIN.ad.customer]);
      thumb = f[JOIN.ad.bannerLink] || null;
    } else if (kind === 're') {
      customer = custName(f[JOIN.re.agent]);
      thumb = f['property-image-link'] || null;
    } else if (kind === 'event') {
      thumb = f['event-hero-image-ulc-link-ev-1-only'] || f['event-image-url'] || null;
    }
    return { kind, id, name: String(f.name || ''), customer, thumb };
  };
  const FIELD_KIND = { [B.article]: 'article', [B.ad]: 'ad', [B.events]: 'event', [B.re]: 're' };

  // 6. Slots and loose rows.
  const slots = [], loose = [];
  const placedAt = new Map();    // asset id -> { blockId, position, loose }
  const place = (id, b, isLoose) => {
    if (!id || placedAt.has(id)) return;
    placedAt.set(id, { blockId: b.id, position: num(b.fieldData.position), loose: isLoose });
  };
  rows.forEach((b, i) => {
    const fd = b.fieldData || {};
    const pos = num(fd.position);
    const where = 'NL-BLOCKS ' + b.id + ' (position ' + fd.position + ')';
    const dj = parsed[i];

    if (pos >= looseFrom) {
      let asset = null;
      for (const field of [B.article, B.ad, B.events, B.re]) {
        const a = shape(FIELD_KIND[field], fd[field], where);
        if (a) { asset = { kind: a.kind, id: a.id, name: a.name, customer: a.customer }; break; }
      }
      if (!asset) run.warn(where + ' is a loose row with no asset.');
      else place(asset.id, b, true);
      loose.push({ id: b.id, position: pos, asset });
      return;
    }

    const atRaw = String(fd[B.assetType] || '');
    let assetType = null;
    if (!atRaw) run.warn(where + ' has no asset type.');
    else if (!assetTypes[atRaw]) run.warn(where + ': asset-type option ' + atRaw + ' (' +
      (optName(blockOpts, B.assetType, atRaw) || 'unknown') + ') is not in IX_CONFIG.assetTypes.');
    else assetType = assetTypes[atRaw];

    const btRaw = String(fd[B.type] || '');
    let blockType = '';
    if (btRaw) {
      blockType = blockTypes[btRaw] || null;
      if (!blockType) run.warn(where + ': block-type option ' + btRaw + ' (' +
        (optName(blockOpts, B.type, btRaw) || 'unknown') + ') is not in IX_CONFIG.blockTypes.');
    }

    let asset = null, listCount = null;
    const field = assetType ? accepts[assetType] : undefined;
    if (assetType && field === undefined) run.warn('IX_CONFIG.slotAccepts has no entry for "' + assetType + '".');
    if (field === LIST) {
      let ids = [];
      if (assetType === 'event') ids = eventIdsFor(fd, dj);
      else if (assetType === 're') ids = reIdsFor(fd, dj);
      else ids = idList(dj && dj.txaAds);
      listCount = ids.length;
      ids.forEach(id => place(id, b, false));
    } else if (field) {
      const kind = FIELD_KIND[field];
      if (!kind) run.warn('IX_CONFIG.slotAccepts names "' + field + '", which is not an asset field this Worker reads.');
      else {
        asset = shape(kind, fd[field], where);
        if (asset) place(asset.id, b, false);
      }
    }

    const slot = {
      id: b.id,
      position: pos,
      slotKey: String(fd[B.slotKey] || ''),
      assetType,
      blockType,
      endGroup: fd[B.endGroup] === true,
      blockText: String(fd[B.blockText] || ''),
      asset,
      listCount,
    };
    // v1.0.12 — the Greeting row carries its own words.
    if (blockType === 'GR') {
      slot.greeting = {
        title: String(fd[B.greetTitle] || ''),
        paragraph: String(fd[B.greetParagraph] || ''),
        supershort: String(fd[B.greetSupershort] || ''),
      };
    }
    slots.push(slot);
  });

  // 7. Allocations, with their linked asset and where it sits.
  const allocations = allocs.map(a => {
    const fd = a.fieldData || {};
    const where = 'ALLOCATIONS ' + a.id + ' (page ' + fd[A.page] + ')';
    let asset = null;
    for (const [field, kind] of [[A.article, 'article'], [A.event, 'event'], [A.re, 're'], [A.ad, 'ad']]) {
      const s = shape(kind, fd[field], where);
      if (s) { asset = { kind: s.kind, id: s.id, name: s.name }; break; }
    }
    // v1.0.12 — paid: the rule (Article + Customer), or the hand override.
    const customer = String(fd[A.customer] || '').trim() || null;
    const ovr = String(fd[A.paidOverride] || '').trim().toLowerCase();
    const paidOverride = (ovr === 'paid' || ovr === 'not-paid') ? ovr : null;
    if (ovr && !paidOverride) run.warn(where + ': paid-override "' + ovr + '" is not "paid" or "not-paid"; the rule decides.');
    const paid = paidOverride ? paidOverride === 'paid' : (a._type === 'article' && !!customer);
    return {
      id: a.id,
      printTitle: String(fd[A.printTitle] || fd.name || ''),
      section: String(fd[A.section] || ''),
      page: fd[A.page] == null ? null : num(fd[A.page]),
      pdfPage: fd[A.pdfPage] == null ? null : num(fd[A.pdfPage]),
      pdfUrl: String(fd[A.pdfUrl] || ''),
      type: a._type,
      disposition: a._disp,
      plans: refIds(fd[A.plans]),                              // v1.0.14
      asset,
      placement: asset ? (placedAt.get(asset.id) || null) : null,
      customer, paidOverride,                                  // v1.0.12
      paidNote: String(fd[A.paidNote] || '').trim() || null,   // v1.0.12
      paid,                                                    // v1.0.12
    };
  });

  const writeIds = writeIdsOf(run, assetTypes, blockTypes);   // v1.0.12
  const pfd = plan.fieldData || {};
  // v1.0.10 — the title's own name, never one typed into a page.
  const taId = refId(pfd[JOIN.planBoard.titleAdmin]);
  const ta = taId ? byId(titles, taId) : null;
  if (!taId) run.warn('This PUBLICATION PLAN has no title-admin set.');
  else if (!ta) run.warn('TITLES-ADMIN ' + taId + ' (this plan\'s title) was not found.');
  return {
    plan: {
      id: plan.id,
      name: String(pfd.name || ''),
      date: pfd[JOIN.planBoard.date] || null,
      titleAdminId: taId,
      titleName: ta ? (String((ta.fieldData || {}).name || '').trim() || null) : null,   // v1.0.10
      titleSlug: ta ? (String((ta.fieldData || {}).slug || '').trim() || null) : null,   // v1.0.11
      planningStatus: optName(planOpts, JOIN.planBoard.status, pfd[JOIN.planBoard.status]) || null,
    },
    slots, loose, allocations,
    accepts,
    writeIds,                                            // v1.0.12
    addTypes: addTypesOf(run, cfg.addTypes, writeIds),   // v1.0.12
    linkFields: { article: A.article, event: A.event, re: A.re, ad: A.ad },   // v1.0.13
    loosePositionFrom: Number(cfg.loosePositionFrom),                         // v1.0.13
  };
}

// ── The title's plans (v1.0.13) ─────────────────────────────

async function plansRoute(env, ctx, url, request) {
  const origin = request.headers.get('Origin') || '';
  let cfg = null;
  try { cfg = JSON.parse(env.IX_CONFIG || ''); } catch (e) { cfg = null; }
  const allowed = (cfg && Array.isArray(cfg.allowedOrigins)) ? cfg.allowedOrigins : [];
  const ok = !!origin && allowed.includes(origin);
  const out = (obj, status) => new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'Vary': 'Origin' }, ok ? { 'Access-Control-Allow-Origin': origin } : {}),
  });
  if (!cfg) return out({ ok: false, error: 'IX_CONFIG is missing or is not valid JSON.' }, 500);
  if (!allowed.length) return out({ ok: false, error: 'IX_CONFIG.allowedOrigins is not set, so /plans answers no one.' }, 403);
  if (!ok) return out({ ok: false, error: 'This origin may not call /plans.' }, 403);
  if (!env.WEBFLOW_TOKEN) return out({ ok: false, error: 'WEBFLOW_TOKEN is not set on this Worker.' }, 500);
  const C = cfg.collections || {};
  if (!/^[0-9a-f]{24}$/.test(C.plan || '')) return out({ ok: false, error: 'IX_CONFIG.collections is missing: plan.' }, 500);
  if (!(Number(cfg.loosePositionFrom) > 0)) return out({ ok: false, error: 'IX_CONFIG is missing: loosePositionFrom.' }, 500);

  const taId = (url.searchParams.get('titleAdminId') || '').trim();
  if (!/^[0-9a-f]{24}$/.test(taId)) return out({ ok: false, error: 'Missing or malformed titleAdminId.' }, 400);

  const run = new Run(env, ctx, cfg, url.searchParams.get('fresh') === '1');
  try {
    const [rows, schema] = await Promise.all([
      run.cachedList('plans', C.plan),
      run.cachedSchema('plan', C.plan),
    ]);
    const maps = optionMaps(schema);
    const P = JOIN.planBoard;
    const statusNames = new Set(Object.values(maps[P.status] || {}));
    let openSet = null;
    if (Array.isArray(cfg.openPlanStatuses)) {
      openSet = new Set(cfg.openPlanStatuses.map(String));
      openSet.forEach(n => { if (!statusNames.has(n)) run.warn('IX_CONFIG.openPlanStatuses names "' + n + '", which is not a ' + P.status + ' option.'); });
    } else {
      run.warn('IX_CONFIG.openPlanStatuses is not set, so no plan is marked open (open is null).');
    }
    const plans = rows
      .filter(r => refId((r.fieldData || {})[P.titleAdmin]) === taId)
      .map(r => {
        const fd = r.fieldData || {};
        const status = optName(maps, P.status, fd[P.status]) || null;
        return {
          id: r.id,
          name: String(fd.name || ''),
          date: fd[P.date] || null,
          planningStatus: status,
          open: openSet ? (!!status && openSet.has(status)) : null,
        };
      })
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || b.name.localeCompare(a.name));
    return out({ ok: true, plans, loosePositionFrom: Number(cfg.loosePositionFrom), meta: run.meta(plans.length) }, 200);
  } catch (e) {
    return out({ ok: false, error: (e && e.message) || String(e), meta: run.meta(null) }, (e && e.status) || 502);
  }
}

// v1.0.12 — what a one-tap Add makes in each Picker section.
function addTypesOf(run, raw, writeIds) {
  if (!raw || typeof raw !== 'object') {
    run.warn('IX_CONFIG.addTypes is not set, so the IPP cannot add slots.');
    return null;
  }
  const out = {};
  Object.keys(raw).forEach(key => {
    const label = String(raw[key] || '');
    if (!writeIds.assetType[key]) { run.warn('IX_CONFIG.addTypes names asset type "' + key + '", which has no option id in IX_CONFIG.assetTypes.'); return; }
    if (label && !writeIds.blockType[label]) { run.warn('IX_CONFIG.addTypes names block type "' + label + '" for "' + key + '", which has no option id in IX_CONFIG.blockTypes.'); return; }
    out[key] = { assetType: key, blockType: label };
  });
  return out;
}

// v1.0.12 — IX_CONFIG turned around, for the IPP's writes. A key that
// two option ids share is named and left out; nothing is guessed.
function writeIdsOf(run, assetTypes, blockTypes) {
  const flip = (map, label) => {
    const out = {}, twice = new Set();
    Object.keys(map || {}).forEach(id => {
      const k = map[id];
      if (!k) return;
      if (out[k] !== undefined) twice.add(k);
      out[k] = id;
    });
    twice.forEach(k => {
      run.warn('IX_CONFIG.' + label + ' gives "' + k + '" to more than one option id; the IPP cannot write it.');
      delete out[k];
    });
    return out;
  };
  return { assetType: flip(assetTypes, 'assetTypes'), blockType: flip(blockTypes, 'blockTypes') };
}

// v1.0.9 — the config agrees with Webflow's option lists, or says where not.
function configChecks(run, blockOpts, assetTypes, blockTypes, accepts) {
  const atOpts = blockOpts[JOIN.block.assetType];
  if (!atOpts) run.warn('NL-BLOCKS has no Option field "' + JOIN.block.assetType + '".');
  else Object.keys(atOpts).forEach(id => {
    if (!assetTypes[id]) run.warn('asset-type option "' + atOpts[id] + '" (' + id + ') is not in IX_CONFIG.assetTypes.');
  });
  Object.values(assetTypes).forEach(k => {
    if (accepts[k] === undefined) run.warn('IX_CONFIG.slotAccepts has no entry for "' + k + '".');
  });
  const btOpts = blockOpts[JOIN.block.type] || {};
  Object.keys(btOpts).forEach(id => {
    const label = blockTypes[id];
    if (!label) run.warn('block-type option "' + btOpts[id] + '" (' + id + ') is not in IX_CONFIG.blockTypes.');
    else if (String(label).toUpperCase() !== String(btOpts[id]).split(/[\s·]/)[0].toUpperCase())
      run.warn('IX_CONFIG.blockTypes says "' + label + '" for ' + id + ', but Webflow calls it "' + btOpts[id] + '".');
  });
}

function optName(maps, slug, id) {
  if (id == null || id === '') return '';
  const m = maps[slug];
  return m ? (m[id] || '') : String(id);   // not an Option field: the stored text
}
function keyOf(name) {
  return String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function num(v) { const n = Number(v); return isNaN(n) ? 0 : n; }

// ── The pre-compile check (v1.0.8) ──────────────────────────

async function checkRoute(env, ctx, url, request) {
  const origin = request.headers.get('Origin') || '';
  let cfg = null;
  try { cfg = JSON.parse(env.IX_CONFIG || ''); } catch (e) { cfg = null; }
  const allowed = (cfg && Array.isArray(cfg.allowedOrigins)) ? cfg.allowedOrigins : [];
  const ok = !!origin && allowed.includes(origin);
  const out = (obj, status) => new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'Vary': 'Origin' }, ok ? { 'Access-Control-Allow-Origin': origin } : {}),
  });
  if (!cfg) return out({ ok: false, error: 'IX_CONFIG is missing or is not valid JSON.' }, 500);
  if (!allowed.length) return out({ ok: false, error: 'IX_CONFIG.allowedOrigins is not set, so /issue-check answers no one.' }, 403);
  if (!ok) return out({ ok: false, error: 'This origin may not call /issue-check.' }, 403);
  if (!env.WEBFLOW_TOKEN) return out({ ok: false, error: 'WEBFLOW_TOKEN is not set on this Worker.' }, 500);
  const C = cfg.collections || {};
  const missing = REQUIRED_COLLECTIONS.filter(k => !/^[0-9a-f]{24}$/.test(C[k] || ''));
  if (missing.length) return out({ ok: false, error: 'IX_CONFIG.collections is missing: ' + missing.join(', ') + '.' }, 500);

  const nlId = (url.searchParams.get('contextNlId') || '').trim();
  const parentId = (url.searchParams.get('parentId') || '').trim();
  if (!/^[0-9a-f]{24}$/.test(nlId)) return out({ ok: false, error: 'Missing or malformed contextNlId.' }, 400);
  if (!/^[0-9a-f]{24}$/.test(parentId)) return out({ ok: false, error: 'Missing or malformed parentId.' }, 400);

  // Same Run, same cache, same ids as 206's first step: no fresh=1.
  const run = new Run(env, ctx, cfg, false);
  let built;
  try {
    built = await buildIssue(run, nlId, parentId);
  } catch (e) {
    const status = (e && e.status) || 502;
    const message = (e && e.message) || String(e);
    // 4xx is data 206 would stop on; 5xx is Webflow or this Worker failing.
    if (status >= 400 && status < 500) {
      const nl = await run.getItem('newsletter', C.newsletter, nlId).catch(() => null);
      return out({ ok: true, wouldStop: { status, message }, lastCompile: lastCompileOf(nl, cfg),
                   unpublished: null, unpublishedError: 'Not checked: the data stops first.',
                   notes: run.warnings, meta: run.meta(null) }, 200);
    }
    return out({ ok: false, error: message, meta: run.meta(null) }, status);
  }

  const kinds = Array.isArray(cfg.checkPublished) ? cfg.checkPublished.filter(k => CHECK_KINDS[k]) : null;
  let unpublished = null, unpublishedError = null;
  if (!kinds || !kinds.length) {
    unpublishedError = 'IX_CONFIG.checkPublished is not set, so unpublished edits were not checked.';
  } else {
    unpublished = unpublishedIn(built.blocks, kinds);
  }
  return out({ ok: true, wouldStop: null, lastCompile: lastCompileOf(built.context.newsletter, cfg),
               unpublished, unpublishedError, notes: run.warnings,
               meta: run.meta(built.blocks.length) }, 200);
}

function lastCompileOf(newsletter, cfg) {
  const raw = newsletter && newsletter.fieldData ? newsletter.fieldData['email-size-kb'] : null;
  const sizeKb = (raw === null || raw === undefined || raw === '') ? null : Number(raw);
  const limit = Number(cfg.emailLimitBytes) > 0 ? Number(cfg.emailLimitBytes) : null;
  const limitKb = limit ? Math.round(limit / 102.4) / 10 : null;
  return {
    sizeKb: (sizeKb === null || isNaN(sizeKb)) ? null : sizeKb,
    limitKb,
    over: (limitKb && sizeKb !== null && !isNaN(sizeKb)) ? sizeKb > limitKb : null,
  };
}

// A record's publish state, from Webflow's own item fields.
function publishState(item) {
  if (item.isArchived) return 'archived';
  if (item.isDraft || !item.lastPublished) return 'draft';
  const u = Date.parse(item.lastUpdated || ''), p = Date.parse(item.lastPublished || '');
  if (!isNaN(u) && !isNaN(p) && u - p > 1000) return 'edited';
  return null;
}

function unpublishedIn(blocks, kinds) {
  const byId = new Map();
  blocks.forEach(b => {
    const pos = (b.fieldData || {}).position;
    kinds.forEach(k => {
      CHECK_KINDS[k].from(b).filter(Boolean).forEach(item => {
        const state = publishState(item);
        if (!state) return;
        let row = byId.get(item.id);
        if (!row) {
          row = { kind: CHECK_KINDS[k].label, name: String((item.fieldData || {}).name || item.id),
                  id: item.id, state, positions: [] };
          byId.set(item.id, row);
        }
        if (pos !== undefined && pos !== null && !row.positions.includes(pos)) row.positions.push(pos);
      });
    });
  });
  const order = { draft: 0, archived: 1, edited: 2 };
  return [...byId.values()].sort((a, b) => order[a.state] - order[b.state] || a.kind.localeCompare(b.kind));
}

// ── The splash (v1.0.4) ─────────────────────────────────────

const SPLASH_COLLECTIONS = ['newsletter', 'titles', 'titlesSite', 'publishers', 'ads'];
const LEGACY_SPLASH_COLLECTIONS = ['titles', 'titlesSite'];   // v1.0.6

async function splashRoute(env, ctx, url) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8',
  };
  const out = (obj, status, maxAge) => new Response(JSON.stringify(obj), {
    status, headers: Object.assign({ 'Cache-Control': maxAge ? 'public, max-age=' + maxAge : 'no-store' }, cors),
  });
  if (!env.WEBFLOW_TOKEN) return out({ ok: false, error: 'WEBFLOW_TOKEN is not set on this Worker.' }, 500);
  let cfg;
  try { cfg = JSON.parse(env.IX_CONFIG || ''); }
  catch (e) { return out({ ok: false, error: 'IX_CONFIG is missing or is not valid JSON.' }, 500); }
  const C = cfg.collections || {};
  const n = (url.searchParams.get('n') || '').trim();
  const logo = (url.searchParams.get('logo') || '').trim();
  const legacy = !n && !!logo;                                            // v1.0.6
  const missing = (legacy ? LEGACY_SPLASH_COLLECTIONS : SPLASH_COLLECTIONS)
    .filter(k => !/^[0-9a-f]{24}$/.test(C[k] || ''));
  if (missing.length) return out({ ok: false, error: 'IX_CONFIG.collections is missing: ' + missing.join(', ') + '.' }, 500);
  if (!legacy && !/^[0-9a-f]{24}$/.test(n)) return out({ ok: false, error: 'Missing or malformed n (NEWSLETTER id), and no logo.' }, 400);

  const run = new Run(env, ctx, cfg, url.searchParams.get('fresh') === '1');
  try {
    const value = legacy
      ? await run.cached('splashlogo:' + (ucId(logo) || logo), () => buildLegacySplash(run, logo), 'splash')
      : await run.cached('splash:' + n, () => buildSplash(run, n), 'splash');
    return out(Object.assign({}, value, { version: VERSION }), 200, run.ttl);
  } catch (e) {
    return out({ ok: false, error: (e && e.message) || String(e), version: VERSION }, (e && e.status) || 502);
  }
}

async function buildSplash(run, n) {
  const C = run.cfg.collections;
  const o = run.cfg.options || {};
  const newsletter = await run.getItem('newsletter', C.newsletter, n);
  if (!newsletter) throw httpErr(404, 'n is not in the NEWSLETTER collection.');
  const [titles, titlesSite, publishers, ads] = await Promise.all([
    run.cachedList('titles', C.titles),
    run.cachedList('titlesSite', C.titlesSite),
    run.cachedList('publishers', C.publishers),
    run.cachedList('ads', C.ads),
  ]);
  const nfd = newsletter.fieldData || {};
  const title = byId(titles, refId(nfd[JOIN.newsletter.title]));
  if (!title) throw httpErr(422, 'This NEWSLETTER has no TITLE (sector), or it is not in TITLES-ADMIN.');
  const site = titlesSite.filter(t => refIds((t.fieldData || {})[JOIN.titleSite.titleAdmin]).includes(title.id));
  if (site.length !== 1) throw httpErr(422, (site.length ? 'More than one' : 'No') + ' TITLES item points at TITLES-ADMIN ' + title.id + '.');
  const publisher = byId(publishers, refId((title.fieldData || {})[JOIN.title.publisher]));
  const logo = String((site[0].fieldData || {})[JOIN.splash.logo] || '');
  const look = await splashColors(title);                                 // v1.0.6

  const paidAd = String(nfd[JOIN.splash.paidAd] || '');
  if (paidAd) {
    return Object.assign({ ok: true, source: 'paid', logo, ad: paidAd, ad2: '', house: false,
             su: String(nfd[JOIN.splash.paidGo] || ''), sn: String(nfd[JOIN.splash.paidName] || '') }, look);
  }

  if (!o.houseKindSplash) {
    return Object.assign({ ok: true, source: 'none', logo, ad: '', ad2: '', su: '', sn: '', house: false,
             warning: 'IX_CONFIG.options.houseKindSplash is not set.' }, look);
  }
  const houses = ads.filter(a => {
    const f = a.fieldData || {};
    return !a.isDraft && !a.isArchived &&
      f[JOIN.ad.houseKind] === o.houseKindSplash &&
      refIds(f[JOIN.ad.titles]).includes(title.id) &&
      String(f[JOIN.ad.splashLink] || '');
  }).sort((a, b) => String(b.lastUpdated || '').localeCompare(String(a.lastUpdated || '')));
  if (houses.length) {
    const f = houses[0].fieldData || {};
    return Object.assign({ ok: true, source: 'house', logo, ad: String(f[JOIN.ad.splashLink]),
             ad2: String(f[JOIN.ad.splashLink2] || ''), house: true,
             su: String(f[JOIN.ad.redirectLink] || ''),
             sn: String(((publisher && publisher.fieldData) || {}).name || '') }, look);
  }
  return Object.assign({ ok: true, source: 'none', logo, ad: '', ad2: '', su: '', sn: '', house: false }, look);
}

// v1.0.6 — legacy long links (106): colours only, matched by the logo.
async function buildLegacySplash(run, logo) {
  const C = run.cfg.collections;
  const [titles, titlesSite] = await Promise.all([
    run.cachedList('titles', C.titles),
    run.cachedList('titlesSite', C.titlesSite),
  ]);
  const want = ucId(logo) || logo;
  const same = (v) => { const s = String(v || '').trim(); return !!s && (ucId(s) || s) === want; };
  const ids = new Set();
  titles.forEach(t => { if (same((t.fieldData || {})[JOIN.title.legacySplashLogo])) ids.add(t.id); });
  titlesSite.forEach(t => {
    const f = t.fieldData || {};
    if (same(f[JOIN.splash.logo])) refIds(f[JOIN.titleSite.titleAdmin]).forEach(id => ids.add(id));
  });
  if (ids.size !== 1) throw httpErr(422, (ids.size ? 'More than one title' : 'No title') + ' has this logo.');
  const title = byId(titles, [...ids][0]);
  if (!title) throw httpErr(422, 'The TITLES item for this logo points at a TITLES-ADMIN record that does not exist.');
  return Object.assign({ ok: true, source: 'legacy' }, await splashColors(title));
}

// v1.0.6 — the title's splash colours from its tokens file chain.
// v1.0.7 — and its splash times, from the same read.
// Never throws: a problem gives colors (or timing) null with colorsError
// (or timingError), so the logo and any sold ad are still answered.
async function splashColors(title) {
  const file = String((title.fieldData || {})[JOIN.title.tokens] || '').trim();
  if (!file) {
    const why = 'TITLES-ADMIN ' + title.id + ' has no ' + JOIN.title.tokens + '.';
    return { colors: null, colorsError: why, timing: null, timingError: why };
  }
  const problems = [];
  const tokens = await loadTokens(file, problems);
  if (!tokens) return { colors: null, colorsError: problems.join(' '), timing: null, timingError: problems.join(' ') };
  const out = { colorsFrom: file };

  const colors = {}, cBad = [];
  Object.keys(SPLASH_COLOR_TOKENS).forEach(k => {
    const name = SPLASH_COLOR_TOKENS[k];
    const v = String(tokens[name] || '').trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) colors[k] = v;
    else cBad.push(name + (v ? ' is not a hex colour (' + v + ').' : ' is missing.'));
  });
  if (cBad.length) { out.colors = null; out.colorsError = file + ': ' + cBad.join(' '); }
  else out.colors = colors;

  const timing = {}, tBad = [];
  Object.keys(SPLASH_TIME_TOKENS).forEach(k => {
    const name = SPLASH_TIME_TOKENS[k];
    const v = String(tokens[name] == null ? '' : tokens[name]).trim();
    const n = Number(v);
    if (/^[0-9]+$/.test(v) && n >= 1000 && n <= 20000) timing[k] = n;
    else tBad.push(name + (v ? ' is not whole milliseconds from 1000 to 20000 (' + v + ').' : ' is missing.'));
  });
  if (tBad.length) { out.timing = null; out.timingError = file + ': ' + tBad.join(' '); }
  else out.timing = timing;
  return out;
}

// v1.0.6 — the render Worker's token merge: the title file, then each file
// it extends; merged platform, publisher, ..., title; '@name' followed.
// Any file that cannot be read: null, with the reason in problems.
async function loadTokens(titleFile, problems) {
  const get = async (f) => {
    try {
      const r = await fetch(TOKENS_CDN(f), { cf: { cacheTtl: 300, cacheEverything: true } });
      if (!r.ok) { problems.push('Token file ' + f + ' answered HTTP ' + r.status + '.'); return null; }
      return await r.json();
    } catch (e) { problems.push('Token file ' + f + ' could not be read: ' + String(e) + '.'); return null; }
  };
  const top = await get(titleFile);
  if (!top) return null;
  const parents = Array.isArray(top.extends) ? top.extends : [];
  const layers = await Promise.all(parents.map(get));
  if (layers.some(l => !l)) return null;
  const merged = {};
  [...layers, top].forEach(layer => Object.keys(layer).forEach(k => {
    if (k !== 'extends' && !k.startsWith('_')) merged[k] = layer[k];
  }));
  const out = {};
  const walk = (k, seen) => {
    if (Object.prototype.hasOwnProperty.call(out, k)) return out[k];
    const v = merged[k];
    if (typeof v !== 'string' || !v.startsWith('@')) return v;
    const ref = v.slice(1);
    if (seen.has(ref) || !Object.prototype.hasOwnProperty.call(merged, ref)) return '';
    seen.add(ref);
    return walk(ref, seen);
  };
  Object.keys(merged).forEach(k => { out[k] = walk(k, new Set([k])); });
  return out;
}

// v1.0.6 — the Uploadcare id inside a picture address, or ''.
function ucId(u) {
  const m = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(String(u || ''));
  return m ? m[1].toLowerCase() : '';
}

// ── The issue ───────────────────────────────────────────────

async function buildIssue(run, nlId, parentId) {
  const C = run.cfg.collections;

  // 1. NEWSLETTER first: it names the TITLE and, sometimes, the PLAN.
  const newsletter = await run.getItem('newsletter', C.newsletter, nlId);
  if (!newsletter) throw httpErr(404, 'contextNlId is not in the NEWSLETTER collection.');
  const nfd = newsletter.fieldData || {};
  const planId = parentId === newsletter.id ? refId(nfd[JOIN.newsletter.plan]) : parentId;
  if (!planId) throw httpErr(422, 'This NEWSLETTER has no PUBLICATION PLAN set.');

  // 2. Everything that does not depend on the blocks, at once.
  //    Per-issue reads (PLAN, NL-BLOCKS) are always fresh.
  //    Slow-changing collections are cached lists.
  const [plan, blocksAll, titles, titlesSite, publishers, designs, ads, customers, sections, franchisesAll] =
    await Promise.all([
      run.getItem('plan', C.plan, planId),
      run.listAll(C.blocks),
      run.cachedList('titles', C.titles),
      run.cachedList('titlesSite', C.titlesSite),
      run.cachedList('publishers', C.publishers),
      run.cachedList('designs', C.designs),
      run.cachedList('ads', C.ads),
      run.cachedList('customers', C.customers),
      run.cachedList('sections', C.sections),
      run.cachedList('franchises', C.franchises),
    ]);
  if (!plan) throw httpErr(404, 'The PUBLICATION PLAN ' + planId + ' is not in the PUBLICATION PLAN collection.');

  const title = byId(titles, refId(nfd[JOIN.newsletter.title]));
  if (!title) throw httpErr(422, 'This NEWSLETTER has no TITLE (sector), or it is not in TITLES-ADMIN.');
  // v1.0.3 — the TITLES item that points at this TITLES-ADMIN record.
  const siteMatches = titlesSite.filter(t => refIds((t.fieldData || {})[JOIN.titleSite.titleAdmin]).includes(title.id));
  if (siteMatches.length !== 1) throw httpErr(422, siteMatches.length
    ? 'More than one TITLES item points at TITLES-ADMIN ' + title.id + ': ' + siteMatches.map(t => t.id).join(', ') + '.'
    : 'No TITLES item points at TITLES-ADMIN ' + title.id + ' (field titles-admin).');
  const titleSite = siteMatches[0];
  const publisher = byId(publishers, refId((title.fieldData || {})[JOIN.title.publisher]));
  if (!publisher) run.warn('The TITLE has no PUBLISHER, or it is not in PUBLISHERS.');

  // 3. This issue's blocks, in Webflow's list order, as 206 filters them.
  const rows = blocksAll.filter(b => refId((b.fieldData || {})[JOIN.block.plan]) === parentId);

  // 4. Parse each block's design-json once. 206 still parses it itself;
  //    the Worker only needs the lists of ids inside it.
  const parsed = rows.map(b => parseDJ((b.fieldData || {})[JOIN.block.designJson], 'block ' + b.id, run));

  // 5. Collect the per-issue ids, then read them by id, in parallel.
  const want = { articles: new Set(), events: new Set(), re: new Set() };
  rows.forEach((b, i) => {
    const fd = b.fieldData || {};
    const dj = parsed[i];
    refIds(fd[JOIN.block.article]).forEach(id => want.articles.add(id));
    eventIdsFor(fd, dj).forEach(id => want.events.add(id));
    reIdsFor(fd, dj).forEach(id => want.re.add(id));
    refIds(fd[JOIN.block.re]).forEach(id => want.re.add(id));
  });
  const [articles, events, reItems, reSchema] = await Promise.all([
    run.getMany('articles', C.articles, [...want.articles]),
    run.getMany('events', C.events, [...want.events]),
    run.getMany('re', C.re, [...want.re]),
    want.re.size ? run.cachedSchema('re', C.re) : Promise.resolve(null),
  ]);
  const reOptions = optionMaps(reSchema);

  // 5b. v1.0.2: the design-json cascade above the block, for sections.
  const titleDJc = parseDJ((title.fieldData || {})[JOIN.title.designJson], 'TITLES-ADMIN', run);
  const planDJc = parseDJ((plan.fieldData || {})[JOIN.plan.designJson], 'PUBLICATION PLAN', run);
  const pubDJc = publisher ? parseDJ((publisher.fieldData || {})[JOIN.publisher.designJson], 'PUBLISHERS', run) : {};
  const blockTypes = run.cfg.blockTypes || {};
  if (!Object.keys(blockTypes).length) run.warn('IX_CONFIG.blockTypes is missing; blocks without an article get no section.');
  const sectionsBy = index(sections);

  // 6. Join.
  const custBy = index(customers);
  const adsBy = index(ads);
  const blocks = rows.map((b, i) => {
    const fd = b.fieldData || {};
    const dj = parsed[i];
    const where = 'block ' + b.id + ' (position ' + fd.position + ')';
    const out = Object.assign({}, b);

    out.design = pick(index(designs), fd[JOIN.block.design], 'DESIGNS', where, run);
    out.ad = pick(adsBy, fd[JOIN.block.ad], 'ADS', where, run);

    const article = pick(articles, fd[JOIN.block.article], 'ARTICLES', where, run);
    out.article = article;
    const afd = (article && article.fieldData) || {};
    out.section = article ? pick(sectionsBy, afd[JOIN.article.section], 'SECTIONS', where, run) : null;
    out.sectionFrom = out.section ? 'article' : null;
    if (!article) {
      // v1.0.2: block, plan, title, publisher
      const label = blockTypes[String(fd[JOIN.block.type] || '')] || '';
      const found = sectionIdFor(label, [['block', dj, true], ['plan', planDJc], ['title', titleDJc], ['publisher', pubDJc]]);
      if (found) {
        out.section = pick(sectionsBy, found.id, 'SECTIONS', where, run);
        out.sectionFrom = out.section ? found.level : null;
      }
    }
    out.author = article ? pick(custBy, afd[JOIN.article.author], 'CUSTOMERS', where, run) : null;

    out.sponsor = pick(custBy, fd[JOIN.block.sponsor], 'CUSTOMERS', where, run);
    out.payer = pick(custBy, fd[JOIN.block.payer], 'CUSTOMERS', where, run);

    const reOne = pick(reItems, refIds(fd[JOIN.block.re])[0], 'RE LISTINGS', where, run);
    out.re = reOne;
    out.reAgent = reOne ? pick(custBy, (reOne.fieldData || {})[JOIN.re.agent], 'CUSTOMERS', where, run) : null;

    out.events = eventIdsFor(fd, dj)
      .map(id => pick(events, id, 'EVENTS', where, run)).filter(Boolean);

    out.reListings = reIdsFor(fd, dj)
      .map(id => pick(reItems, id, 'RE LISTINGS', where, run)).filter(Boolean)
      .map(item => Object.assign({}, item, {
        agent: pick(custBy, (item.fieldData || {})[JOIN.re.agent], 'CUSTOMERS', where, run),
        _opt: optionLabels(item, reOptions),
      }));

    out.txaAds = idList(dj && dj.txaAds)
      .map(id => pick(adsBy, id, 'ADS', where, run)).filter(Boolean)
      .map(item => Object.assign({}, item, {
        customer: pick(custBy, (item.fieldData || {})[JOIN.ad.customer], 'CUSTOMERS', where, run),
      }));

    return out;
  });

  // 7. Context. PRODUCT LIBRARY items named anywhere in the design-json
  //    cascade (title, plan, blocks), so 206 can pick its franchise
  //    with the same id expression it uses today.
  const titleDJ = parseDJ((title.fieldData || {})[JOIN.title.designJson], 'TITLES-ADMIN', run);
  const planDJ = parseDJ((plan.fieldData || {})[JOIN.plan.designJson], 'PUBLICATION PLAN', run);
  const franchiseIds = new Set();
  [titleDJ, planDJ, ...parsed].forEach(dj => franchiseIdsIn(dj).forEach(id => franchiseIds.add(id)));
  const franchiseBy = index(franchisesAll);
  const franchises = [...franchiseIds].map(id => {
    const f = franchiseBy.get(id);
    if (!f) run.warn('PRODUCT LIBRARY item ' + id + ' is named in a design-json but does not exist.');
    return f;
  }).filter(Boolean);

  // Active banner ads of this issue's payers, in ADS list order, in the
  // shape of 206 module 233. Covers every ADS item, not the first 100.
  const o = run.cfg.options || {};
  const payerIds = new Set(rows.map(b => refId((b.fieldData || {})[JOIN.block.payer])).filter(Boolean));
  const activeBannerAds = (o.adTypeBanner && o.adStatusActive) ? ads
    .filter(a => {
      const f = a.fieldData || {};
      return f[JOIN.ad.type] === o.adTypeBanner && f[JOIN.ad.status] === o.adStatusActive &&
        payerIds.has(refId(f[JOIN.ad.customer]));
    })
    .map(a => ({
      bannerLink: a.fieldData[JOIN.ad.bannerLink] || '',
      advertiserId: refId(a.fieldData[JOIN.ad.customer]),
      redirectLink: a.fieldData[JOIN.ad.redirectLink] || '',
    })) : [];
  if (!(o.adTypeBanner && o.adStatusActive)) run.warn('IX_CONFIG.options is missing adTypeBanner or adStatusActive; activeBannerAds is empty.');

  return {
    context: { newsletter, title, titleSite, publisher: publisher || null, plan, franchises, activeBannerAds },
    blocks,
  };
}

// design-json lists, read the way 206 reads them:
//   events   = ifempty(designJson.evEvents; asset-event)
//   listings = ifempty(designJson.reListings; asset-re)
function eventIdsFor(fd, dj) {
  const fromDJ = idList(dj && dj.evEvents);
  return fromDJ.length ? fromDJ : refIds(fd[JOIN.block.events]);
}
function reIdsFor(fd, dj) {
  const fromDJ = idList(dj && dj.reListings);
  return fromDJ.length ? fromDJ : refIds(fd[JOIN.block.re]);
}
// v1.0.2: the first sectionId in the cascade for this block type.
// The block's own design-json may also name a plain sectionId.
function sectionIdFor(label, levels) {
  for (const [level, dj, own] of levels) {
    if (!dj || typeof dj !== 'object') continue;
    if (own && refId(dj.sectionId)) return { id: refId(dj.sectionId), level };
    const t = label && dj.types && dj.types[label];
    if (t && refId(t.sectionId)) return { id: refId(t.sectionId), level };
  }
  return null;
}

function franchiseIdsIn(dj) {
  if (!dj || typeof dj !== 'object') return [];
  const ids = [];
  if (refId(dj.franchiseId)) ids.push(refId(dj.franchiseId));
  if (dj.types && typeof dj.types === 'object') {
    Object.values(dj.types).forEach(t => { if (t && refId(t.franchiseId)) ids.push(refId(t.franchiseId)); });
  }
  return ids;
}

function parseDJ(raw, where, run) {
  if (raw == null || String(raw).trim() === '') return {};
  try {
    const v = JSON.parse(raw);
    return (v && typeof v === 'object') ? v : {};
  } catch (e) {
    run.warn('design-json on ' + where + ' is not valid JSON; 206 will fail on it too.');
    return {};
  }
}

// ── Webflow reads, paced and counted ────────────────────────

class Run {
  constructor(env, ctx, cfg, fresh) {
    this.env = env; this.ctx = ctx; this.cfg = cfg; this.fresh = fresh;
    this.live = cfg.readMode === 'live';
    this.ttl = Number(cfg.cacheSeconds) > 0 ? Number(cfg.cacheSeconds) : 600;
    this.calls = 0; this.retries = 0; this.cachedNames = []; this.warnings = [];
    this.active = 0; this.waiting = []; this.t0 = Date.now();
  }

  warn(msg) { if (!this.warnings.includes(msg)) this.warnings.push(msg); }

  meta(blockCount) {
    return {
      version: VERSION,
      readMode: this.live ? 'live' : 'staged',
      fresh: this.fresh,
      webflowCalls: this.calls,
      retries: this.retries,
      cached: this.cachedNames,
      ms: Date.now() - this.t0,
      blockCount,
      warnings: this.warnings,
    };
  }

  async slot(fn) {
    while (this.active >= PARALLEL) await new Promise(r => this.waiting.push(r));
    this.active++;
    try { return await fn(); }
    finally { this.active--; const next = this.waiting.shift(); if (next) next(); }
  }

  async wf(path, allow404) {
    for (let attempt = 0; ; attempt++) {
      const res = await this.slot(() => {
        this.calls++;
        return fetch(WF + path, {
          headers: { Authorization: 'Bearer ' + this.env.WEBFLOW_TOKEN, 'accept-version': '2.0.0' },
        });
      });
      if (res.ok) return res.json();
      if (res.status === 404 && allow404) return null;
      if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
        this.retries++;
        const ra = Number(res.headers.get('Retry-After'));
        await sleep(ra > 0 ? Math.min(ra, 60) * 1000 : 1000 * Math.pow(2, attempt));
        continue;
      }
      const body = await res.text().catch(() => '');
      throw httpErr(res.status === 429 ? 503 : 502,
        'Webflow HTTP ' + res.status + ' on ' + path +
        (res.status === 429 ? ' (rate limit, after ' + MAX_RETRIES + ' retries)' : '') +
        (body ? ' · ' + body.slice(0, 200) : ''));
    }
  }

  async getItem(label, collId, id) {
    if (!id) return null;
    const item = await this.wf('/collections/' + collId + '/items/' + id + (this.live ? '/live' : ''), true);
    if (!item) this.warn(label + ' item ' + id + ' was not found (deleted or unpublished).');
    return item;
  }

  // Map id → item for the ids that exist. Blank ids never reach Webflow.
  async getMany(label, collId, ids) {
    const uniq = [...new Set(ids.filter(Boolean))];
    const items = await Promise.all(uniq.map(id => this.getItem(label, collId, id)));
    const m = new Map();
    items.forEach(it => { if (it) m.set(it.id, it); });
    return m;
  }

  // Every page, or an error. Never a partial list.
  // Webflow's total says how many pages to read at once. A short page is
  // the only thing that ends the list, so a wrong or missing total cannot
  // cut it off.
  async listAll(collId) {
    const base = '/collections/' + collId + '/items' + (this.live ? '/live' : '') + '?limit=' + PAGE + '&offset=';
    const tooBig = () => httpErr(502, 'Collection ' + collId + ' holds more than ' +
      (PAGE * MAX_PAGES) + ' items, the most this Worker reads. Nothing was answered from part of it.');
    const first = await this.wf(base + 0);
    const pagesOut = [first.items || []];
    const total = Number(first.pagination && first.pagination.total) || 0;
    const planned = Math.ceil(total / PAGE);
    if (planned > MAX_PAGES) throw tooBig();
    const offsets = [];
    for (let p = 1; p < planned; p++) offsets.push(p * PAGE);
    const more = await Promise.all(offsets.map(off => this.wf(base + off).then(r => r.items || [])));
    more.forEach(items => pagesOut.push(items));
    while (pagesOut[pagesOut.length - 1].length === PAGE) {
      if (pagesOut.length >= MAX_PAGES) throw tooBig();
      const r = await this.wf(base + pagesOut.length * PAGE);
      pagesOut.push(r.items || []);
    }
    const seen = new Set();
    return pagesOut.flat().filter(r => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  }

  async cachedList(name, collId) {
    return this.cached('list:' + collId, () => this.listAll(collId), name);
  }

  async cachedSchema(name, collId) {
    return this.cached('schema:' + collId, () => this.wf('/collections/' + collId), name + ' schema');
  }

  // Cloudflare Cache API, per data centre (D154). fresh=1 skips the read
  // but still refills, so the next run is warm.
  async cached(key, produce, name) {
    const cache = caches.default;
    const req = new Request('https://ix-issue-data.cache/' + (this.live ? 'live/' : 'staged/') + encodeURIComponent(key));
    if (!this.fresh) {
      const hit = await cache.match(req);
      if (hit) { this.cachedNames.push(name); return hit.json(); }
    }
    const value = await produce();
    const res = new Response(JSON.stringify(value), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=' + this.ttl },
    });
    this.ctx.waitUntil(cache.put(req, res));
    return value;
  }
}

// ── Shaping ─────────────────────────────────────────────────

function optionMaps(schema) {
  const maps = {};
  ((schema && schema.fields) || []).forEach(f => {
    if (f.type === 'Option' && f.validations && Array.isArray(f.validations.options)) {
      const m = {};
      f.validations.options.forEach(o => { m[o.id] = o.name; });
      maps[f.slug] = m;
    }
  });
  return maps;
}

function optionLabels(item, maps) {
  const out = {};
  const fd = item.fieldData || {};
  Object.keys(maps).forEach(slug => {
    const v = fd[slug];
    out[slug] = (v && maps[slug][v]) || '';
  });
  return out;
}

function index(rows) {
  if (rows instanceof Map) return rows;
  const m = new Map();
  (rows || []).forEach(r => m.set(r.id, r));
  return m;
}

function byId(rows, id) { return id ? (index(rows).get(id) || null) : null; }

// Look up one reference. Blank: null, silently (an unsold slot is normal).
// Set but missing: null, and a warning naming the block.
function pick(map, raw, label, where, run) {
  const id = refId(Array.isArray(raw) ? raw[0] : raw);
  if (!id) return null;
  const hit = index(map).get(id);
  if (!hit) run.warn(where + ': ' + label + ' item ' + id + ' was not found.');
  return hit || null;
}

// A reference comes back as a bare id or an object with .id
function refId(v) {
  if (!v) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'object' && v.id) return String(v.id);
  return null;
}
function refIds(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(refId).filter(Boolean);
  const one = refId(v);
  return one ? [one] : [];
}
// design-json lists may hold ids as strings, or as a comma-separated string
function idList(v) {
  if (!v) return [];
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  return refIds(v);
}

// ── HTTP helpers ────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpErr(status, message) { const e = new Error(message); e.status = status; return e; }

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function fail(status, message) { return json({ ok: false, error: message }, status); }
