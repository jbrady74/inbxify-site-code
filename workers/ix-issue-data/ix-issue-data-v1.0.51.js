// ix-issue-data-v1.0.51.js
// ============================================================
// v1.0.51 (13 Oct 2026) — A PLAN SEES ONLY ITS OWN TITLE'S ALLOCATIONS
//   Fixes the cross-title read introduced in v1.0.15 (found in IPP Build
//   S4, 7 Oct; planned for v1.0.16 and never done). /plan-board counted an
//   ALLOCATIONS row as in the plan whenever its article, event or listing
//   sat in this plan's NL-BLOCKS, whatever title the row belonged to. So
//   when Title A's article was placed on Title B's plan, Title A's print
//   allocation showed on Title B's Picker, and emptying that slot made the
//   Picker write to Title A's ALLOCATIONS row through 103B.
//   Now, on /plan-board:
//     · The row's title is read from the ALLOCATIONS Reference field that
//       points at IX_CONFIG.collections.titles, found from the schema (the
//       field the Allocator's page list filters on). IX_CONFIG.
//       allocationsTitleField (a slug) overrides.
//     · A row whose title is set and is not this plan's title is left out,
//       on every path (recorded on the plan, held by a tile, or matched by
//       its asset). meta.warnings names how many were left out.
//     · A row with no title counts only when it is linked explicitly
//       (recorded on the plan, or held by a tile by its id). It is never
//       pulled in by its asset alone, because its owner cannot be proved.
//     · If ALLOCATIONS has no such field, nothing is matched by asset
//       alone, and meta.warnings says so. Explicit links still count.
//   The plan's own title is its title-admin (JOIN.planBoard.titleAdmin).
//   A plan with no title matches no row by asset.
//   No new hardcoding: the field is found from the schema.
//   Includes all of v1.0.50.
// ============================================================
//
// ix-issue-data-v1.0.50.js
// ============================================================
// v1.0.50 (ASF Where it runs, 13 Oct 2026) — A SECTION NAMES ITS
// OLD-PAGE PRODUCT AND MNLS
//   Ruled by Jeff (ASF mockup v0.1, all five accepted): the Article form
//   has one choice, the Section. Product Library and MNLS are filled
//   from it, only for the old newsletter page, and shown read-only.
//   GET /sections: each item gains
//     product  { id, name } or null   the PRODUCT LIBRARY row the Section
//                                     points at
//     mnls     { id, name } or null   that row's MNLS
//   and the answer gains legacy: { productField, mnlsField } (slugs, or
//   null when the link does not exist yet). The form fills Product
//   Library and MNLS only when productField is set, so nothing is
//   cleared before the SECTIONS field exists.
//   Found from the schema, not typed in: the SECTIONS Reference that
//   points at IX_CONFIG.collections.franchises (PRODUCT LIBRARY).
//   IX_CONFIG.sectionsProductField (a slug) overrides; two such fields
//   are named in meta.warnings and the first is used. MNLS is read from
//   that PRODUCT LIBRARY row's JOIN.franchise.mnls reference, and its
//   collection id comes from that field's own validation.
//   Retires with the old newsletter page, together with the SECTIONS
//   field.
//   HARDCODING
//     HC-P-ASF-1  JOIN.franchise.mnls = 'nl-section' (PRODUCT LIBRARY's
//                 MNLS reference). Retires with MNLS.
//   Includes all of v1.0.49.
// ============================================================
//
// ix-issue-data-v1.0.49.js
// ============================================================
// v1.0.49 (Controls Parity · S2, 12 Oct 2026) — TYPE COMES ONLY FROM THE SECTION
//   Ruled by Jeff: an article references a Section and its type always
//   comes from that Section. The ARTICLES block-type field is deleted, so
//   nothing on the article can disagree with its Section.
//   1 · slot.asset.type is gone. slot.asset.sectionType stays (the
//       Section's block-type label, or null).
//   2 · slot.typeCheck: { block, article, from, sectionType, ok, reason }.
//       article = the Section's type; from = 'section' or null; disagree
//       is gone. reason 'untyped-article' now means "no Section, or a
//       Section with no type".
//   3 · The ARTICLES schema is no longer read; no warning about its
//       block-type field.
//   HARDCODING: HC-P-CP-1 narrows to JOIN.sections.type ('block-type');
//   JOIN.article.type is removed.
//   Includes all of v1.0.48 otherwise.
// ============================================================
//
// ix-issue-data-v1.0.48.js
// ============================================================
// v1.0.48 (Controls Parity · S2 step 3, 12 Oct 2026) — article type.
//   Scoping: Controls-Parity-Scoping v0.4. Rulings of 12 Oct (Jeff):
//   the SECTION carries the block type (FA, TS, LBP); the article holds
//   its decided type; Layout never changes it; a mismatch is flagged.
//   Schema done the same day: SECTIONS block-type, ARTICLES block-type
//   (both Option fields, options FA, TS, LBP). Read-only, as always.
//
//   1 · /plan-board, article slots: slot.asset gains
//         type         the article's own block-type label, or null
//         sectionType  its Section's block-type label, or null
//       and the slot gains typeCheck (article slots holding an article):
//         { block, article, from, sectionType, ok, reason, disagree }
//         block     the block's type label ('' when untyped)
//         article   the decided type: the article's own, else its
//                   Section's (until the backfill writes every article)
//         from      'article' | 'section' | null
//         ok        true when article equals block; false when both are
//                   set and differ; null when either is missing
//         reason    null | 'mismatch' | 'untyped-article' | 'untyped-block'
//         disagree  true when the article's own type and its Section's
//                   type are both set and differ (shown, never decided)
//       Board gains typeMismatches: [block ids] where ok is false.
//       Labels are read by name, never by option id. A label that is not
//       in IX_CONFIG.layout.articleTypes is named in meta.warnings and
//       treated as missing, so a new option cannot slip through unseen.
//   2 · GET /sections: each item gains blockType (label or null), so the
//       Article form can set the type from the Section it picks.
//   3 · GET /sections, tenancy fix. A row with no title was shared by
//       EVERY title on the platform (HC-P-S11-2), so a second publisher
//       would have seen Bergen's Recipe Corner. SECTIONS now has a
//       publisher reference. A row whose publisher is set and is not
//       this title's publisher (TITLES-ADMIN associated-client) is left
//       out. The publisher field is found from the SECTIONS schema (the
//       Reference pointing at IX_CONFIG.collections.publishers), not
//       typed in. A row with no title and no publisher stays shared, and
//       meta.warnings names it.
//   HARDCODING
//     HC-P-CP-1  JOIN.article.type and JOIN.sections.type, both
//                'block-type'. Same class as HC-P-DW1-2 (slugs in JOIN).
//     HC-P-S11-2 amended: blank title = shared within the row's publisher.
//   Includes all of v1.0.47.
// ============================================================
//
// ix-issue-data-v1.0.47.js
// ============================================================
// v1.0.47 (Layout Preview · S2, 12 Oct 2026) — GET /preview
//   Layout's Preview ("Compile light", ruled 12 Oct): assemble and render
//   the issue exactly as Compile does, and save nothing.
//   GET /preview?contextNlId=&parentId=   Same origin rule as /plan-board
//   (IX_CONFIG.allowedOrigins); no key, because it writes nothing.
//   1 · Assembles with the same code /assemble gives 206, then renders
//       email and web through the RENDER binding with markBlocks on
//       (newsletter-render v1.19.0+), so the page can find each block.
//   2 · Answers { ok, version, at, email: { status, html, bytes, error },
//       web: { status, html, error }, weather, counts, skipped, meta }.
//       weather is newsletter-render's X-IX-Weather report for the email.
//       skipped lists the blocks Compile leaves out, with the reason.
//   3 · Always fresh plan and block reads (per-issue reads already are);
//       slow lists use the usual cache.
//   Writes nothing: no NEWSLETTER fields, no GitHub file, no archive.
//   Includes all of v1.0.46.
// ============================================================
//
// ix-issue-data-v1.0.46.js
// ============================================================
// v1.0.46 (Layout tiles · S1, 12 Oct 2026) — what you check when you open a tile.
//   Jeff, on Layout v1.0.9: an opened tile is for reviewing the content,
//   not the layout. For an event: the date and start time as a double
//   check, the venue, the first words of the description, the picture.
//   /plan-board now answers those facts, read and formatted exactly as
//   206 prints them, so what Layout shows is what the email will say.
//   Added, nothing removed or renamed:
//   1 · slots[].items[] for events: when ("Wed, Oct 21, 2026" in the
//       title's time zone), time ("7:00 PM"), endTime (dt-end-time as
//       typed), venue (built as 206 builds it), teaser (the first 24
//       words of event-description), hasLink.
//   2 · slots[].items[] for listings: price ("$849,000", or null when
//       hide-price is on or there is no price), priceHidden, beds,
//       baths, sqft, agent (CUSTOMERS name), brokerage, teaser (first
//       24 words of property-description), hasLink.
//   3 · slots[].asset for articles: dek (the first 24 words of
//       post-summary). For ads: hasLink (redirect-link is set).
//   4 · slots[].greeting.paragraph is already there; nothing new.
//   The time zone is TITLES-ADMIN title-timezone, else ASM.tzDefault,
//   the same rule /issue-data uses (HC-P-M206-5).
//   Includes all of v1.0.45.
// ============================================================
//
// v1.0.45 (Layout tiles · S1, 12 Oct 2026) — what a Layout tile shows.
//   Frame 6 v3 of the canvas "PubPlan Layout tab · S12 mockup" was
//   accepted on 12 Oct. Layout v1.0.8 draws each block as a tile with
//   art, an Expert Contributor badge and a strip for the ad inside an
//   article. Three facts it needs were not on /plan-board. All are
//   added; nothing is removed or renamed.
//   1 · slots[].asset.ec (articles only): true when the article's
//       business is a CUSTOMERS record with expert-contributor on. The
//       same EC_RULE 206 prints x_isEC from (v1.0.40), so the badge on
//       Layout and the badge in the email cannot disagree.
//       slots[].asset.writer (articles only): the writer's name, the
//       same field 206 prints as f_author. null when blank.
//   2 · slots[].items[].thumb (events and listings): the item's picture
//       link, read from the same fields shape() already reads for a
//       single asset. null when there is none.
//   3 · slots[].inside (article slots only): the ads that print inside
//       the article, in the order 206 prints them, or [] for none.
//         { kind: 'paid',    customer, thumb, prints }
//             is-paid is yes and paid-by-customer names someone. thumb
//             is that customer's first active banner (ADS list order),
//             as 206 module 233 finds it. prints is false when 206
//             will leave the ad out: no active banner with a redirect.
//         { kind: 'sponsor', customer, thumb, prints: true }
//             asset-ad-sponsor names someone. thumb is the sponsor's
//             first active banner, else the customer's
//             default-paid-ad-ulc-link, as f_sponsorAd.
//       Rules are read from IX_CONFIG.options (adTypeBanner,
//       adStatusActive) and the NL-BLOCKS is-paid option named
//       ASM.yesLabel, exactly as /issue-data reads them. No new ids.
//   HARDCODING: none new. HC-P-M206-11 (the yes label) and
//   HC-P-M206-12 (the is-paid slug) are reused.
//   Includes all of v1.0.44.
// ============================================================
//
// v1.0.44 (Block Catalog · S1, 12 Oct 2026) — Splash in the catalog.
//   Jeff, 12 Oct: Splash is another revenue entry. Splash is not an
//   NL-BLOCKS row (it lives on the NEWSLETTER items and ADS; /plan-board
//   already answers it as splash), so a catalog entry may now say
//   blocks: false:
//     labels must be empty and add must be "" (else named and left out)
//     assetType is not checked
//     on /plan-board its plan is null; Revenue keeps reading splash
//   An entry without blocks is true by default, so v1.0.43 entries are
//   read the same way. Includes all of v1.0.43.
// ============================================================
//
// ---- v1.0.43 header follows ----
// ix-issue-data-v1.0.43.js
// ============================================================
// v1.0.43 (Block Catalog · S1, 12 Oct 2026) — the block catalog.
//   Scoping: IPP-Block-Catalog-Scoping v0.2. Rulings BC-1 to BC-7 and
//   the four of 12 Oct (catalog in IX_CONFIG; untick with content
//   refuses; weather strip movable; Greeting is an ordinary catalog
//   entry, ticked per title through its Default Layout).
//   No page reads this yet. ipp-picker S2 is the first reader.
//
//   1 · NEW IX_CONFIG KEY catalog: one entry per kind of block, the one
//       list every page reads instead of typing its own. Platform level.
//         key            unique, lower case ("events")
//         name           plain name when the title's SECTIONS has none
//         side           editorial | revenue | fixed (fixed: never on
//                        the Picker; Divider, Spacer)
//         controller     true: a tick in the Content Controller
//         labels         the NL-BLOCKS block-type labels it covers
//                        (Articles covers FA, TS and LBP)
//         add            the block-type label a tick creates; "" for
//                        an article block, which is typed on Layout
//                        (Scenario 126 does the same, IA rule)
//         assetType      IX_CONFIG.assetTypes key for a new block
//         content        none | one | list
//         perIssue       one | many
//         defaultLayout  the Default Layout's names for it, until that
//                        tab uses labels (S3)
//       Keyed by key, not label: one Content Controller tick (Articles)
//       covers several labels, and a new article block has no label
//       until Layout types it.
//   2 · CHECKED, never guessed. Each entry is checked against
//       IX_CONFIG.blockTypes and .assetTypes (themselves checked against
//       the NL-BLOCKS option lists). A bad entry is named in
//       meta.warnings and left out. A block-type label no entry covers
//       is named, so a new type added to NL-BLOCKS is loud until it has
//       a catalog line. A label in two entries is named and left with
//       the first.
//   3 · /plan-board answers catalog: [ entry + {
//         sectionName   the title's SECTIONS name for its first label
//                       (plan, then title, then publisher design-json)
//         design        { id, name } a ticked-on block is born with,
//                       same rule as addTypes (title override, else the
//                       one design that fits); null when none or
//                       several, or when controller is false
//         plan          { blockIds, count, filledIds, ticked }
//       } ]. ticked is count > 0: the tick is read from the blocks, not
//       from an include-* field (BC-2). filledIds are the blocks holding
//       something (an asset, a list item, a print item, or Greeting
//       words); the Picker refuses an untick while any exist.
//       A plan block no entry covers is named in meta.warnings.
//       No catalog key: catalog is null and a warning says so.
//   HARDCODING
//     HC-P-BC-1  The catalog's field names and the values of side,
//                content and perIssue. Platform level. The entries
//                themselves are config (IX_CONFIG.catalog), not code.
//   Includes all of v1.0.42.
// ============================================================
//
// ---- v1.0.42 header follows ----
// ============================================================
// v1.0.42 (Modular 206 · S3, 12 Oct 2026) — the LW block is the switch.
//   Pairs ipp-layout v1.0.5 and ipp-publish v2.12. newsletter-render
//   v1.18.2 unchanged.
//   Before: the weather strip printed on every email whose title had a
//   location, whether or not the plan had an LW block; the block did
//   nothing. Jeff's design: pulling the LW block in puts weather in the
//   issue; removing it takes weather out.
//   1 · /assemble sends weather-lat and weather-lon only when the plan has
//       a block whose type is the weather block (WEATHER_LABEL, below).
//       Without one, both are blank and context.weather-off is 1, so
//       newsletter-render prints no strip (its X-IX-Weather header then
//       says no-place; the board's "off" is the true reason).
//   2 · /plan-board answers weather { label, blockIds, inPlan }. Each
//       publish.newsletters[].weather is { state: "off" } when the plan
//       has no weather block (nothing is fetched), else as in v1.0.41.
//   HARDCODING
//     HC-P-M206-14  WEATHER_LABEL: the weather block's NL-BLOCKS type is
//                   "LW", unless IX_CONFIG.weatherBlock names another.
//                   Platform level, same class as HC-P-S12-3 ('GR').
//   Includes all of v1.0.41.
// ============================================================
//
// ---- v1.0.41 header follows ----
// ============================================================
// v1.0.41 (Modular 206 · S3, 12 Oct 2026) — weather state and event dates.
//   Pairs newsletter-render v1.18.2 (v1.18.1 or later for weather).
//
//   1 · WEATHER STATE ON THE BOARD. /plan-board now answers, for each of
//       this plan's NEWSLETTER items (publish.newsletters[].weather), the
//       same weather state Compile will get: ready, too-far (with
//       availableOn, the first day the forecast can be fetched), past,
//       no-date, no-place or failed. Layout's weather tile and Publish's
//       Weather check read it. One rule in one place: the Worker asks
//       newsletter-render's /weather route (RENDER binding) with the
//       NEWSLETTER publish-date, the TITLES-ADMIN weather-lat, weather-lon
//       and title-timezone, and the title's token weather-days, the same
//       values a Compile sends. It never works the rule out itself.
//       Missing RENDER binding: state "unknown" with the reason.
//   2 · EVENT DATE ON EVERY EVENT. Each event in a block's list now
//       carries dtSort, the event-start as a full ISO time (blank when the
//       EVENTS item has no event-start). newsletter-render v1.18.2 sorts
//       the events of contiguous Events blocks by it (Jeff, 12 Oct 2026).
//       /assemble-diff will show dtSort as a difference against older
//       saves; that is this field, not drift.
//   Nothing else changed. Includes all of v1.0.40.
// ============================================================
//
// ---- v1.0.40 header follows ----
// ============================================================
// v1.0.40 (Modular 206 · S3, 12 Oct 2026) — the F-fixes.
//   206 v1.45 builds nothing itself now; it asks /assemble. So each fix
//   below is a Worker change only. 206 needs no edit.
//
//   F-1  RE photos. The listing photo now uses the same file-name strip
//        as article photos (RX.photo). 206's doubled-backslash version
//        never fired. Listing links with a file name now get a clean
//        Uploadcare size.
//   F-2  Sponsor flag. Reads show-as-sponsored, the live slug (data
//        reference §CORRECTIONS), not show-as-sponsored-2. Blocks marked
//        sponsored now show "Sponsored by" and the sponsor creative. If
//        NL-BLOCKS has no field by that slug, meta.warnings says so.
//   F-3  TXA and event cards. Nothing to change here: the Worker joins
//        the two lists as a real list. The missing comma lived only in
//        206's typed JSON, which v1.45 no longer builds. Closed.
//   F-4  Share title date. Formatted in the title's time zone, like
//        every other date in the issue (was UTC).
//   F-5  Expert Contributor badge. Customer-determined: shows only when
//        the article's business (associated-business-coc, a CUSTOMERS
//        record) has expert-contributor on. Was on every story.
//
//   /assemble-diff will now report these as differences against any
//   copy 206 v1.44 saved. That is the fixes showing, not drift.
//   Includes all of v1.0.39.
// ============================================================
//
// ---- v1.0.39 header follows ----
// ============================================================
// v1.0.39 (Modular 206 · Assembler port S2, 12 Oct 2026) — /assemble
//   answers in the shape 206 v1.45 posts and writes. Read-only.
//
//   WHY. Parity proven on WLN-998B: /assemble-diff found the Worker's
//   email, web, 12 blocks, share title and share image identical to what
//   206 v1.44 saved a minute earlier. 206 v1.45 drops its ~30 building
//   modules and calls /assemble instead. Make has no tidy way to turn a
//   parsed object back into JSON text, so the Worker hands over the two
//   render bodies as ready text.
//
//   1 · GET /assemble now answers
//         { ok, emailBody, webBody, og, counts, skipped, issue, meta }
//       emailBody, webBody  the bodies 206 posts to newsletter-render, as
//                           JSON text (were the objects email and web)
//       issue               the few facts 206's writing half reads:
//                           { nlId, name, publishDate, slug, titleName,
//                             githubPath } from the NEWSLETTER and
//                           TITLES-ADMIN records already read
//       og, counts, skipped unchanged.
//       Nothing else calls /assemble. /assemble-diff is unchanged.
//   2 · The F-fixes (F-1 to F-5) are still held back. Each now ships as a
//       Worker change alone; 206 needs no edit for any of them.
//   Includes all of v1.0.38.
// ============================================================
//
// ---- v1.0.38 header follows ----
// ============================================================
// v1.0.38 (Modular 206 · Assembler port S1, 12 Oct 2026) — first diff
//   result, and the link checker stops blaming good links.
//   Read-only, as always.
//
//   1 · F-5 found by /assemble-diff on WLN-999 (web identical, share
//       title and image identical, 20 of 20 blocks with the same
//       templates). The only difference besides the weather strip: 206
//       prints the "Expert Contributor" badge on every story, writers
//       who are not expert contributors included (Cathy Pecorelli, with
//       no business at all, has it). Module 201 writes
//         if(length(associated-business-coc) > 0 and
//            author.expert-contributor = true; 1; 0)
//       and Make answers 1 every time. Ported as it behaves, for parity:
//       x_isEC is 1 on every heavy block. The intended rule is kept in
//       EC_RULE below and goes live with the F-fixes after switch-over.
//       No reader is affected yet: 206 does not send real issues.
//   2 · Link check (/links and /link-check). A probe that fails because
//       of Cloudflare itself (the subrequest limit, seen on WLN-999 on
//       12 Oct as "Too many subrequests by single Worker invocation") is
//       the checker failing, not the site. It now answers
//         cls 'unchecked'   the checker could not open it
//       instead of 'dead'. The page offers It works on it.
//       /links also answers webflowCalls and probes, so the next time the
//       limit is hit the count says where the calls went.
//   HARDCODING
//     HC-P-M206-13  The text Cloudflare uses for its own limit errors,
//                   matched in CF_LIMIT_RX. Platform level.
//   Includes all of v1.0.37.
// ============================================================
//
// ---- v1.0.37 header follows ----
// ============================================================
// v1.0.37 (Modular 206 · Assembler port S1, 12 Oct 2026) — 206's
//   building half, ported. Read-only, as always: nothing here writes a
//   record, an image or a file.
//
//   WHY. Scenario 206 does two jobs: it builds each block's render payload
//   (the design merge, the event dates, the links, the guards) and it
//   writes the results (NEWSLETTER fields, publish, the GitHub archive).
//   The building moves here so the Layout tab can preview an unsaved
//   layout and 206 can shrink to receive, assemble, render, write. The
//   writing stays in 206.
//
//   1 · assemble(): 206 v1.44 modules 25320 to 213, in JavaScript. A
//       faithful port. Each line names the 206 module it mirrors. Lanes,
//       template codes and type labels come from IX_CONFIG.compile and the
//       NL-BLOCKS schema, the same source /plan-board's Compile tiles use,
//       so the pre-check and the assembler cannot disagree. No block-type,
//       is-paid or house-kind option id is typed in: options are read by
//       label from each collection's schema.
//   2 · NEW GET /assemble?contextNlId=&parentId=[&fresh=1]
//       Header X-IX-Key (the same key 206 sends to /issue-data).
//       Answers { ok, email, web, og, counts, skipped, meta }:
//         email, web  the exact bodies 206 posts to newsletter-render
//         og          { ogImage, ogTitle, archiveImage } (206 module 25321)
//         counts      { blocks, heavy, light, blocksInPlan, skipped }
//         skipped     [{ id, position, type, why }] blocks 206 leaves out,
//                     with the reason in plain words (206 drops them
//                     without saying)
//       206 does not call it yet. It switches over once /assemble-diff
//       says Identical (next session).
//   3 · NEW GET /assemble-diff?contextNlId=&parentId=[&fresh=1][&show=payload]
//       Same origin rule as /plan-board. The proof harness. Assembles,
//       renders email and web through the render Worker, and compares with
//       what 206 last saved on the NEWSLETTER:
//         web          byte for byte against web-render-html
//         email        byte for byte against email-render-html (the
//                      weather strip can differ if the forecast moved)
//         emailBlocks  per-block template and size against
//                      email-size-report (no weather in it)
//         og           share title and image against og-title and
//                      main-image-for-og
//       Each difference comes back as the text on both sides, line by line
//       (webHunks, emailHunks), up to 12 places. verdict says it in a line.
//       show=payload adds the assembled email body.
//       Run it right after a Compile of the same issue, with fresh=1.
//   NEEDS (dashboard, once)
//     Service binding RENDER → newsletter-render (Settings → Bindings).
//     A Worker cannot fetch another Worker on the same workers.dev
//     subdomain by address. /assemble does not need it; /assemble-diff
//     does, and says so plainly if it is missing.
//
//   FOUND IN 206 v1.44 (ported as they are, for parity; each gets its own
//   fix after parity, so the fix is a visible one-line change)
//     F-1  RE photos: modules 201 (f_rePhoto) and 259 (listing photo) write
//          the file-name regex with doubled backslashes. Make takes them
//          literally, so the regex looks for a backslash and never strips
//          a file name. Harmless while listing links have no file name.
//          Modules 227 and 248 write it correctly.
//     F-2  Sponsor flag: module 227 reads show-as-sponsored-2. The live
//          slug is show-as-sponsored (data reference §CORRECTIONS), so
//          x_sponsored is 0 on every block today.
//     F-3  Module 201 joins the TXA card list and the event card list with
//          no comma between them. A block with both would break 206's
//          JSON. Here they simply join.
//     F-4  Module 25321 formats the share title's date in UTC; every other
//          date uses the title's time zone. An issue dated near midnight
//          UTC can show different days in the title and the email.
//   WATCH (the diff settles these)
//     W-1  The share image is built with split(...; "/") and get(...; 2),
//          get(...; 3). Ported as host and uuid. og.image compares it.
//     W-2  Make's map() is read as leaving empty values out. Touches the
//          share image source and the banner-ad lookups.
//   DEVIATIONS (only where 206 itself would fail)
//     Unreadable design-json or skin JSON, raw backslashes or line breaks
//     in fields 206 does not escape: 206 stops or the render refuses the
//     JSON; here the value is kept and meta.warnings names it.
//
//   HARDCODING (provisional ids, for the doc-maintenance chat)
//     HC-P-M206-1   Site and splash addresses (206 module 25310). Same
//                   values 206 types today. Platform level.
//     HC-P-M206-2   Paths /articles-blog-posts/ and /nl/.
//     HC-P-M206-3   UTM medium and utm_content tags (FA-b, TXA-b, EV-b,
//                   PA-b, BA-b, HA-b).
//     HC-P-M206-4   Uploadcare sizes for share, photo, tall photo, event
//                   and listing images.
//     HC-P-M206-5   Default time zone America/New_York when a title has
//                   none. A title should always have one (candidate for
//                   required-at-source).
//     HC-P-M206-6   TXA kicker default "This Week" when no design-json
//                   names one.
//     HC-P-M206-7   Teaser cut at 400 characters (397 plus an ellipsis).
//     HC-P-M206-8   The share image is the first FA block's picture.
//     HC-P-M206-9   List guard codes ev, txa, re (206 module 201).
//     HC-P-M206-10  House-ad kinds subscribe, bookmark, advertise: the
//                   payload's own flag names. Read by ADS option label.
//     HC-P-M206-11  The yes option on is-paid and show-as-sponsored is the
//                   one labelled "true".
//     HC-P-M206-12  Field slugs in assemble(), copied from 206 v1.44's
//                   mappings. Same class as HC-P-DW1-2.
//     Retired by this port once 206 switches: 206's typed block-type ids
//     (modules 165, 231, 280, 301, 25320), is-paid id (227, 201) and
//     house-kind ids (301, HC-P-DP2S2-3).
//   Includes all of v1.0.36.
// ============================================================
//
// ix-issue-data-v1.0.36.js
// ============================================================
// v1.0.36 (IPP Build S12, 11 Oct 2026) — facts for the Layout tab.
//   Read-only, as always. Layout writes through Scenario 124 v2.20
//   (ops reorder, layout, fill).
//
//   1 · /plan-board plan gains issueNumber: the PUBLICATION PLAN's
//       issue-number, as text ('' when blank).
//   2 · /plan-board gains editions: the other plans of the same issue.
//       Same title (title-admin) and the same issue-number, this plan left
//       out. Ruled 11 Oct (Jeff): Layout changes to articles and sections
//       copy to every open edition of the issue; banner spots belong to
//       each edition and are never copied.
//         editions [{ id, name, date, planningStatus, locked,
//                     rows:[{ id, position, slotKey, assetType, blockType,
//                             design, endGroup, blockText }] }]
//       rows are that plan's NL-BLOCKS below loosePositionFrom, in position
//       order, shaped like slots (labels from IX_CONFIG, never ids).
//       editions is [] when the plan has no issue-number (meta.warnings
//       says so) or no other plan shares it. The plan list is the
//       10-minute cache; fresh=1 skips it. NL-BLOCKS is fresh, as before.
//   3 · /plan-board gains layout { articleTypes }: the block types an
//       article block may take, from IX_CONFIG.layout.articleTypes
//       (labels as in IX_CONFIG.blockTypes, e.g. ["FA","TS","LBP"]).
//       Without the key: [] and meta.warnings says so; Layout then shows
//       the type but cannot change it. A label with no option id in
//       IX_CONFIG.blockTypes is named in meta.warnings and left out.
//   4 · designChoices also answers every layout.articleTypes label, so a
//       block changed to TS can be offered the TS designs even when no TS
//       block is in the plan yet.
//   HARDCODING
//     HC-P-S12-1  JOIN.planBoard.issueNumber 'issue-number'. Same class as
//                 HC-P-DW1-2 (slugs in JOIN).
//     HC-P-S12-2  Siblings are matched by title + issue-number (the rule in
//                 the Issue + Edition model, 10 Oct). Written once, here.
//   Includes all of v1.0.35.
// ============================================================
//
// ix-issue-data-v1.0.35.js
// ============================================================
// v1.0.35 (IPP Build S11, 11 Oct 2026) — the ASF Section list.
//   Read-only, as always.
//
//   NEW GET /sections?taId=<TITLES-ADMIN id>[&fresh=1]  (same origin rule
//   as /media). The SECTIONS rows a title may use:
//     · rows whose title field holds this title, and
//     · rows whose title field is blank: a blank title means the section
//       is shared by every title (Jeff, 11 Oct).
//   Webflow cannot filter "this title or blank", which is why the T-A
//   page's Collection List could not do this job. ASF reads this route
//   instead of the page list.
//
//   WHICH FIELD SAYS WHO OWNS A ROW. Not typed in. The route reads the
//   SECTIONS schema and takes every Reference or Multi-reference field
//   that points at the TITLES-ADMIN collection (IX_CONFIG.collections.
//   titles). If there are two (the Designer shows title-admins, the data
//   reference lists title-admin), a row belongs to a title when either
//   names it, and is shared only when all are blank; meta.warnings says
//   so. IX_CONFIG.sectionsOwnerFields (a list of slugs) overrides the
//   search if that is ever wrong. The answer names the fields it used.
//
//   Answers { ok, taId, ownerFields:[{ slug, name, type }],
//     items:[{ id, name, slug, position, status, shared }], meta }.
//     Sorted by position (rows without one last), then name.
//     Draft and archived Webflow items are left out. status is the label
//     of the row's status option when SECTIONS has one, else null; ASF
//     leaves out "Retired" as it always has.
//   Needs IX_CONFIG.collections.sections and .titles (both already set).
//
//   HARDCODING
//     HC-P-S11-1  JOIN.sections: the position and status slugs on
//                 SECTIONS. Same class as HC-P-DW1-2.
//     HC-P-S11-2  Blank title = shared by every title. A rule, written
//                 once, here.
//   Includes all of v1.0.34.
// ============================================================
//
// ============================================================
// v1.0.34 header follows.
// ============================================================
// v1.0.34 (IPP Build S10, 11 Oct 2026) — facts for the Correct buttons.
//   Read-only, as always: this Worker reports, it never changes a record.
//   The page writes through Scenario G (records), 124 (plan rows), 122
//   (the greeting) and B (uploads).
//
//   1 · NEW GET /links?planId=<PUBLICATION PLAN id>[&fresh=1]  (same origin
//       rule as /plan-board). Every link in the issue, read from its
//       record before Compile: ad click links, article links, event links,
//       listing links. Each one is opened (the v1.0.29 probe: HEAD, then
//       GET when HEAD is refused; 8 s; 6 at a time; redirects followed)
//       and given a class:
//         works  any answer under 400
//         away   turned the checker away: 401, 403, 429, or no answer in
//                8 s. Most such sites open fine for a person.
//         dead   404 and every other 4xx, any 5xx, no such site, or not a
//                web address at all
//         none   the record has no link (not opened, not a failure)
//       Answers { ok, planId, checked, links:[{ group, kind, id, name,
//         key, url, status, cls, finalUrl, error, positions }], version }.
//         group  the slot's asset type (article, ad, event, re, text-ad)
//         kind   the record's own type (article, ad, event, re)
//         key    the field's state key, which Scenario G v6's updateAsset
//                takes (JOIN.links). The page never types a slug.
//       Cached 10 minutes per plan unless fresh=1. Max 80 links.
//   2 · NEW GET /media?taId=<TITLES-ADMIN id>[&fresh=1]  (same origin
//       rule). The title's own MEDIA images for the picture picker:
//         items [{ id, name, url, width, height }]  newest first
//       Only rows whose title-admin is this title, whose media-type is
//       "Image" and whose status is "Available" (labels read from the
//       MEDIA schema, never ids; IX_CONFIG.mediaLabels may rename them).
//       Also upload { publicKey, base, hashes:{ statusAvailable,
//       typeImage, roleMainImage }, publisherId, titleSlug } for a browser
//       upload to Scenario B, the same keys ASF sends. publicKey and base
//       come from IX_CONFIG.uploadcare; a missing one is named in
//       upload.missing and the page says so.
//       Needs IX_CONFIG.collections.media.
//   3 · /plan-board gains
//         designChoices { <block label>: [{ id, name }] }  for every label
//                  in this plan: the live DESIGNS rows that pass 206's own
//                  guard (template-file holds "email-<code>-", a web
//                  template is set) and whose block-type is that label
//                  when it has one: the title's own rows first (mine:
//                  true), then the rows for every title. The Correct
//                  window offers only these.
//         blockFields.design   the NL-BLOCKS design reference slug, for
//                  124's fill.
//         photoKeys { article, re, event }  the state keys Scenario G v6
//                  takes for a picture: { media, src } (event: src only;
//                  EVENTS has no MEDIA reference field).
//         items: listings gain mediaId (hero-image-media-item), events
//                  and listings keep photo.
//   4 · /issue-check lastCompile gains at: the NEWSLETTER's lastPublished.
//       206 publishes the newsletter when it saves a compile, and nothing
//       else on the IPP publishes it, so this is the time of the last
//       compile. The page compares it with the release and the vendor
//       send ("Compiled again after you confirmed").
//   HARDCODING
//     HC-P-S10-1  JOIN.links: the link field of each record type and its
//                 state key (ad redirect-link, article redirect-link,
//                 event event-link, listing listing-link). Same class as
//                 HC-P-DW1-2. Note: ASF's event map still reads
//                 event-redirect-link; the live field is event-link.
//     HC-P-S10-2  JOIN.media and JOIN.photo: MEDIA slugs (title-admin,
//                 media-type, status, component-role, image, image-url,
//                 pixel-width, pixel-height) and the picture state keys.
//     HC-P-S10-3  MEDIA labels "Image", "Available", "Main Image", used to
//                 find option ids by name. Overridable in
//                 IX_CONFIG.mediaLabels. Same class as HC-P-S7-16.
//     HC-P-S10-4  Link classes: which answers count as "turned away"
//                 (401, 403, 429, no answer in 8 s). Page rule, here once.
//   Includes all of v1.0.33.
// ============================================================
//
// ============================================================
// v1.0.33 (IPP Build S9, 11 Oct 2026) — facts for the new Compile step.
//   Read-only, as always: this Worker reports, it never changes a record
//   or an image. /plan-board slots gain what the Compile tiles need, and
//   the board gains a compile block. Nothing else changed.
//
//   1 · The pre-check of Scenario 206 v1.44's three tests, per slot:
//         compile { state, lane, why }
//           state  'compiles' | 'left-out' | 'not-email' | null
//           lane   'heavy' | 'light' | null
//           why    plain words when left out, else null
//       The tests, read from 206 v1.44's blueprint (modules 165, 280,
//       201, 301) on 11 Oct 2026:
//         a. The type is in a lane. Heavy: 165. Light: 280.
//         b. The design's template-file contains "email-<code>-", where
//            <code> is the type's label in lower case (201, 301).
//         c. Heavy lane only, it has content (201): EV at least one event,
//            TXA at least one ad, RE at least one listing, any other heavy
//            type an article. The light lane has no content test.
//       Lanes live in IX_CONFIG, not here (HC-P-S9-1):
//         "compile": { "heavy": [...], "light": [...], "notInEmail": [...],
//                      "codes": { "<label>": "<template code>" } }
//       Labels are the NL-BLOCKS block-type option names as Webflow shows
//       them (first word). codes is only for a label whose template code
//       differs (e.g. a renamed type). notInEmail types (SB) answer
//       'not-email' and never count as left out. Without the key every
//       slot answers compile null and meta.warnings says why. A lane label
//       that is no NL-BLOCKS option is named in meta.warnings.
//   2 · Design facts per slot, labels read from each collection's own
//       schema (never the 32-character ids):
//         blockLabel   the NL-BLOCKS block-type option name (first word)
//         designInfo   { id, name, label, template, templateWeb, missing }
//                      label = the DESIGNS block-type option name
//         designFits   true when designInfo.label equals blockLabel,
//                      false when both are set and differ, else null
//   3 · List items, for list slots (Events, Real Estate, Text Ad):
//         items  event   { id, name, start, photo }   start = event-start
//                re      { id, name, photo }          photo = has a picture
//                text-ad { id, name }
//                a reference to nothing: { id, missing: true }
//       Events and listings named only in design-json are now read too
//       (before, only the asset-event and asset-re fields were read).
//   4 · Article assets gain ogSrc: the article's
//       main-image-ulc-link---1-1-ratio, the field 206 module 25320 takes
//       for the share image and the archive image. null when empty.
//   5 · board.compile { configured, heavy, light, notInEmail, designAudit }
//       designAudit lists every live DESIGNS row whose label and
//       template-file disagree: [{ id, name, label, template }]. That has
//       happened once (Around Town recorded as GR, corrected to AT).
//   HARDCODING
//     HC-P-S9-1  The compile lanes, in IX_CONFIG.compile. They mirror 206's
//                gate lists (HC-P-S8-4) until 206 reads them too. By design.
//     HC-P-S9-2  New slugs: DESIGNS block-type; EVENTS event-start and
//                event-hero-image-ulc-link-ev-1-only; RE property-image-link;
//                ARTICLES main-image-ulc-link---1-1-ratio. Same class as
//                HC-P-DW1-2 (read from 206's own mappings).
//   Includes all of v1.0.32.
// ============================================================
//
// ============================================================
// v1.0.32 (10 Oct 2026) — newsletter status for Publish.
//   Ruled 10 Oct (Jeff): Publish writes the newsletter's Publishing
//   Status, and the Pub Plans tab colours Next by it.
//   /plan-board publish gains
//     fields.status / types.status / newsletters[].values.status
//                 NEWSLETTER publishing-status (the option id)
//     statusIds { draft, readyToPublish, publishNextAsCurrent }
//                 option ids read from the NEWSLETTER schema by label.
//                 A label not found is null and a warning; nothing is
//                 typed here.
//   IX_CONFIG KEY ADDED (optional; defaults shown)
//     publishStatusLabels { draft: "Draft", readyToPublish: "Ready to Publish",
//                           publishNextAsCurrent: "Publish Next as Current" }
//   HC-P-S7-16  those three default labels. Open, same class as HC-P-IPP2-2.
//   Includes all of v1.0.31.
// ============================================================
//
// ix-issue-data-v1.0.31.js
// ============================================================
// v1.0.31 (10 Oct 2026) — Add an edition.
//   Ruled 10 Oct (Jeff): an edition is the same issue sent again, a week
//   later or to other towns. It shares the issue's articles and layout;
//   its ads, sponsors, events, listings and greeting are its own.
//   /clone-rows gains  &edition=1. With it, every row is copied as a
//   clone copies it (position, block and asset type, design, section
//   text, articles), then these are emptied:
//     fields      IX_CONFIG.clone.editionClear
//                 default asset-ad, asset-ad-sponsor, paid-by-customer,
//                 asset-event, asset-re, block-greeting-title,
//                 block-greeting-paragraph, block-greeting-supershort
//     design-json IX_CONFIG.clone.editionClearLists
//                 default evEvents, reListings, txaAds
//   Nothing is marked for approval and no events are dropped: there is
//   nothing left to approve or drop. Without &edition=1 nothing changes.
//   HC-P-S7-13  the two edition defaults above (field slugs and
//               design-json keys). Open, same class as HC-P-S7-12.
// ============================================================
//
// ============================================================
// v1.0.30 (10 Oct 2026) — Submit to Vendor and Vendor Status, by hand.
//   Ruled 10 Oct (Jeff): for now step 4 is copy and paste (Jeff sends the
//   vendor email himself from Outlook) and step 5 is tick boxes he sets.
//   1 · publish.fields/types/values gain stepState ('publish-step-state',
//       existing Plain text field, "Publish-tab lifecycle storage"). The
//       page keeps its tick boxes there as JSON; no new field.
//   2 · publish.vendor { email, name, signoff } from IX_CONFIG.vendor (one
//       vendor for every title, a platform setting). Missing keys are null
//       and a warning; nothing about the vendor is typed in this Worker.
//   3 · NEW GET /email-html?n=<NEWSLETTER id>  (same origin rule as
//       /plan-board) answers the saved email HTML (email-render-html, else
//       web-render-html) as a download named <issue>-email.html, so the page
//       can hand Jeff the file to attach. 409 when nothing is saved yet.
//   Includes all of v1.0.29 (never deployed on its own).
//
// v1.0.29 (10 Oct 2026) — the Publish tab, steps 1 to 3.
//   Ruled 7 Jun (Δ-66) and 10 Oct (Jeff): the send settings are flat
//   NEWSLETTER fields edited on Publish; zip codes and the default
//   sectors are set once on the title (TITLES-ADMIN).
//   1 · /plan-board gains  publish {
//         fields { subject, preview, volume, sendAt, sectors, issueDate,
//                  authorizedAt, greetTitle, greetPara, greetShort, closing,
//                  ogImage, archiveImage }      NEWSLETTER slugs (JOIN.publish)
//         types  { same keys }                  Webflow field types from the
//                                               NEWSLETTER schema, null if
//                                               the field does not exist
//         title  { zips, sectorsDefault, has:{ zips, sectorsDefault } }
//                                               from TITLES-ADMIN (JOIN.publish.ta)
//         newsletters [{ id, name, slug, values:{ same keys } }]
//         error }
//       Same NEWSLETTER items the Splash tile already reads (no extra item
//       calls; one cached schema read). A field missing from a schema is a
//       warning and its type is null, so the page can say exactly which
//       field to create.
//   2 · NEW GET /link-check?n=<NEWSLETTER id>[&fresh=1]  (same origin rule as
//       /plan-board). Reads the newsletter's email-render-html, else its
//       web-render-html, takes every http(s) link (max 80, de-duplicated),
//       and asks each one (HEAD, then GET when HEAD is refused; 8 s each,
//       6 at a time, redirects followed). Answers
//         { ok, source:'email'|'web', checked, failed,
//           links:[{ url, text, status, ok, utm:{...} }], common:{ utm } }
//       utm holds every utm_* parameter on the link; common lists the ones
//       every link shares. Cached 10 minutes per newsletter unless fresh=1.
//   Slugs confirmed against WLN-998C on 10 Oct: email-subject,
//   email-preview, send-volume, send-time, publish-date,
//   final-send-authorized-at, newsletter-greeting-title,
//   entry-paragraph-for-each-newsletter, super-short-greeting, closing-note,
//   main-image-for-og, archive-page-image. NEW fields Jeff creates:
//   NEWSLETTER send-sectors; TITLES-ADMIN send-zip-codes,
//   send-sectors-default (all Plain text).
//
// v1.0.28 (9 Oct 2026) — section sponsors on Revenue.
//   Jeff, 9 Oct: a sponsor set on the PubPlan is for that issue only. On
//   the existing render path that is the block field asset-ad-sponsor
//   (a CUSTOMERS reference, as /issue-data has always read it): 206 v1.44
//   shows f_sponsorName from it, x_hasSponsor when it names someone, and
//   f_sponsorAd = the sponsor's active banner, else the customer's
//   default-paid-ad-ulc-link. So a section sponsor for one issue is that
//   field set on every block of the section in this issue.
//   1 · /plan-board slots answer
//         section   { id, name, from } — the slot's section, found exactly
//                   as /issue-data finds it for 206: the article's
//                   section, else the design-json cascade (block, plan,
//                   title, publisher; types.<TYPE>.sectionId). null when
//                   none. from = 'article' | 'block' | 'plan' | 'title' |
//                   'publisher'.
//         sponsor   { id, name } from asset-ad-sponsor, or null.
//   2 · adFields.sponsor  the NL-BLOCKS field to write ('asset-ad-sponsor').
//       The page types no field name.
//   3 · sponsorsMax  IX_CONFIG.sponsorsMax (a whole number), else null.
//       null means no cap. No number is typed into this Worker or the page.
//   4 · /issue-data activeBannerAds now covers this issue's sponsors as
//       well as its payers, so f_sponsorAd finds the sponsor's active
//       banner instead of falling back to default-paid-ad-ulc-link
//       (retirement scheduled, Sponsor & Paid §03).
//   A sectionId that is not in SECTIONS is a warning; the slot answers
//   section null. Nothing else changed.
//
// v1.0.27 (9 Oct 2026) — the Splash tile on Revenue.
//   /plan-board also answers
//     splash  { newsletters: [ { id, name, source, current, resolver } ],
//               house, fields, error }
//       newsletters  every NEWSLETTER whose publication-plan is this plan
//                    (normally one). Found in the cached list; when the
//                    cached list has none, the list is read fresh once,
//                    so a newsletter made a minute ago is still found.
//                    Each one is then read fresh, by id.
//       source       'paid' when the NEWSLETTER's splash-ad-image is set,
//                    else 'house' when the title has a Splash house ad,
//                    else 'none'. The same rule /splash uses.
//       current      { image, go, name } as typed on the NEWSLETTER now.
//       resolver     this Worker's own /splash?n=<id>. The page calls it
//                    with fresh=1 after a save so the splash page shows
//                    the change at once instead of after the cache time.
//       house        the title's Splash house ad as /splash picks it (most
//                    recently updated wins): { id, name, image, image2, go }
//                    or null.
//       fields       { image, go, name }: the NEWSLETTER field names to
//                    write, from JOIN.splash. The page types none.
//       error        why the newsletters could not be read, else null.
//   adPool entries also carry splash (splash-ad-link--get, null when
//   empty), so the shelf can offer ads that have a splash picture.
//   Nothing else changes.
//
// v1.0.26 (9 Oct 2026) — unapproved ads in the pre-compile check.
//   /issue-check also answers
//     unapproved  [{ position, id, name }] for every block whose
//                 approval field (IX_CONFIG.clone.ackField, default
//                 "needs-approval") still reads the pending value
//                 (IX_CONFIG.clone.ackPending, default "yes") AND holds
//                 an ad. name is the ad's name. Sorted by position.
//                 Empty list when there are none; on a wouldStop answer
//                 it is null (the data stops first).
//   Ruling (Jeff, 9 Oct 2026): an unapproved ad WARNS at Compile, it
//   does not block. Publish v1.5 shows the warning.
//   Nothing else changes.
//
// v1.0.25 (9 Oct 2026) — the Revenue tab's ad shelf (Revenue light).
//   /plan-board also answers
//     adPool    every ADS item for this plan's title (its 'titles'
//               reference holds the plan's TITLES-ADMIN id), not draft,
//               not archived, sorted by customer then name:
//               { id, name, customerId, customer, type, status,
//                 houseKind, house, banner, redirect }
//               type / status / houseKind are the option LABELS from
//               the ADS schema, never ids. house is true when the ad
//               has a House Kind. banner is 'banner-ad-link' (null when
//               empty: the page shows it but will not place it).
//     adFields  { ad, approval, approvalPending } — the NL-BLOCKS field
//               names the page writes: the ad reference ('asset-ad') and
//               the clone approval field (IX_CONFIG.clone.ackField,
//               default "needs-approval", pending value "yes"). The page
//               types neither.
//   No OBLIGATIONS yet (ruled 9 Oct: Revenue light first).
//   Nothing else changed.
// ============================================================
//
// v1.0.24 notes follow.
// ============================================================
// v1.0.24 (9 Oct 2026) — /clone-rows can write the real ids.
//   126 v2.3 swapped the tokens __NEWPLAN__ / __NEWNL__ with Make's
//   replace() and a /regex/g, which Make's editor would not parse.
//   /clone-rows now also takes
//     &newPlanId=<PLAN id>&newNlId=<NEWSLETTER id>
//   and, when they are given, writes them straight into every row body.
//   126 asks twice: once before anything is created (is there anything
//   to copy?) and once after the plan and newsletter exist (the batch,
//   with the real ids). No replace() in Make. Tokens remain the answer
//   when the ids are not given. Nothing else changed.
// ============================================================
//
// v1.0.23 (9 Oct 2026) — Clone, the new-model way.
//   Clone was legacy 103-CLONE, which copies the seven old picker
//   records and never writes NL-BLOCKS, so a clone had an empty Picker.
//   Clone now runs through Scenario 126 beside + Add a PubPlan, and
//   asks this Worker for the source issue's rows:
//     NEW GET /clone-rows?sourcePlanId=<PLAN id>&newName=<issue name>
//                        &newDate=<publication date>
//     Header X-IX-Key: <shared secret>   (Make keychain ix-issue-data)
//     -> { ok:true, mode:"clone", sourcePlan:{id,name,date},
//          rowCount, rows:[{position, blockType, assetType, needsAck, droppedEvents}],
//          dropped:[{position, eventId, name, lastDate}], undated:[...],
//          ackCount, planDesignJson, planDesignJsonQuoted, droppedJson,
//          batchLiteral, meta }
//   With no sourcePlanId the route answers { ok:true, mode:"add",
//   rowCount:0 } and does nothing, so 126 can call it on every run.
//
//   A clone is the WHOLE issue: every NL-BLOCKS field of every row is
//   copied as it stands (contents, designs, banners, Greeting words),
//   except
//     - identity: slug, self id, the print allocation link
//       (IX_CONFIG.clone.dropFields), name -> <newName>-b<position>,
//       publication-plan -> the new plan, newsletter -> the new
//       newsletter (when the source row had one), stage -> planning;
//     - EVENTS that have ended: an event whose last date (event-end,
//       else event-start) falls before newDate is left out of the row,
//       from design-json evEvents and from asset-event. The answer
//       names each one in `dropped`, so the page can say so. An event
//       with no date is kept and named in `undated`.
//   Rows holding an ad (asset-ad or asset-ad-sponsor) are written with
//   the approval field (IX_CONFIG.clone.ackField, default
//   "needs-approval") set to "yes": the new issue shows them salmon
//   until someone says yes, this ad runs again. If NL-BLOCKS has no such
//   field the clone still runs and meta.warnings says so.
//
//   The new plan and newsletter do not exist yet when 126 asks, so each
//   row body carries the tokens __NEWPLAN__ and __NEWNL__, which 126
//   replaces. batchLiteral is the 124 batch, already escaped to sit
//   inside a JSON string, because Make has no JSON-escape function.
//
//   /plan-board slots gain:
//     design     the row's DESIGNS id, or null (owed since IPP S7)
//     needsAck   true when the row's acknowledge field is "yes"
//
// IX_CONFIG KEY ADDED IN v1.0.23 (optional; defaults shown)
//   clone { dropFields: ["slug","self-nlb-item-id","asset-allocation-id"],
//           ackField: "needs-approval", ackPending: "yes",
//           eventLastDate: ["event-end","event-start"],
//           stageName: "planning" }   (stage option looked up by name)
//   HC-P-S7-12  the clone defaults above (field slugs). Open, same class
//               as HC-P-DW1-2.
// ============================================================
//
// ============================================================
// v1.0.22 (9 Oct 2026) — every hydrated row is born with its design.
//   Scenario 126 (Hydrate Issue on +Issue) made each row of a new issue
//   from the title's Default Layout, which names only a type and a
//   position, so every row was born with no design and 206 left the
//   single-design types out (WLN-998's Greeting, b2). 126 now asks:
//     NEW GET /block-designs?taId=<TITLES-ADMIN id>
//     Header X-IX-Key: <shared secret>   (Make holds it; same as 206)
//     -> { ok:true,
//          byHash: { "<NL-BLOCKS block-type option id>": "<DESIGNS id>" },
//          byType: { GR: { id, name }, EV: {...}, FA: null, ... },
//          meta }
//   Same lookup as v1.0.21's Add (withDesigns), unchanged: the title's
//   design-json types.<TYPE>.defaultDesign first, else the one live
//   DESIGNS row that fits the type. A type with several designs (FA, TS)
//   answers null: the Layout tab chooses those. byHash holds only the
//   types that resolved, so 126 maps with get() and an unresolved type
//   comes back empty, which 124 writes as no design, as before.
//   Every IX_CONFIG.blockTypes label is answered; no type is named here.
//   Nothing else changed.
//
// v1.0.21 (8 Oct 2026) — a list slot is born with its design.
//   /plan-board's addTypes entries for a typed section (EV, RE, TXA ...)
//   now also carry the design that block type always uses:
//     addTypes.<key> = { assetType, blockType, designId, designName }
//   designId/designName are null for an untyped section (Article: the
//   Layout tab chooses FA/TS/LBP and its design there).
//   How the design is found, per title, with nothing named in code:
//     1. The title's design-json types.<TYPE>.defaultDesign (a DESIGNS
//        item id), when set. The operator's override.
//     2. Otherwise the one DESIGNS row this title may use (titles empty
//        = every title, or naming this title; a row restricted to this
//        title beats a global one) that is live (not draft, not
//        archived), has a web-template-file, and whose template-file
//        passes Scenario 206's own guard: contains "email-<type>-".
//        The legacy EV Featured/List/Callout rows have no web template,
//        so EV resolves to the one Events row.
//   None or more than one candidate: designId null, and meta.warnings
//   names the candidates. The Picker then says the slot will have no
//   design. Read-only; nothing else changed.
//   HARDCODING: HC-P-S7-8 the DESIGNS slugs in JOIN.design (same class
//   as HC-P-DW1-2). HC-P-S7-9 the "email-<type>-" test copies 206's
//   guard (R2, D19); if the guard changes, this changes with it.
//   HC-P-S7-10 the design-json key types.<TYPE>.defaultDesign. Open.
//
// v1.0.20 (8 Oct 2026) — Create from print, P1.5 (compare with print).
//   NEW GET /article-print?articleId=<ARTICLES id>
//     -> { ok:true, items:[{ allocationId, printTitle, section, page,
//          pdfPage, pdfUrl, issueName, issuePages, byline }], meta }
//   The ALLOCATIONS rows whose asset-article names this article: the
//   print item(s) it was built from. The Asset Form uses it to show the
//   print page beside the body. Newest issue first. Empty items when the
//   article did not come from print. Same origin rule as /plan-board.
//   Read-only. Nothing else changed.
//
// INBXIFY · Cloudflare Worker · ix-issue-data
// One call returns every record an issue needs, already joined.
// Data Worker step 1 (D152). Replaces 206's per-row Webflow lookups.
//
// v1.0.19 (8 Oct 2026) — Create from print, P1. /plan-board's
//   allocations[] carry four more values the print review already writes
//   to ALLOCATIONS, so Create from print can match Intake files against
//   the printed article:
//     byline       ALLOCATIONS `byline`, "" when empty
//     imageCount   ALLOCATIONS `image-count`, 0 when empty
//     issueName    ALLOCATIONS `print-issue-name`, "" when empty
//     issuePages   ALLOCATIONS `print-issue-pages`, null when empty
//   Read-only. Nothing is removed or renamed. Field slugs join JOIN.alloc
//   (HC-P-IPP2-1, the existing ALLOCATIONS slug list).
//
// v1.0.18 (8 Oct 2026) — IPP Build S7, slice 4 (fill Events and Real
//   Estate from the Picker). /plan-board gives each list slot (asset type
//   whose slotAccepts value is "list") one more object, so the Picker can
//   write the list without wiping the block's design settings:
//     slots[].list  { key, ids, from, designJson, jsonOk }
//       key         the design-json key that holds the list, as 206 reads
//                   it: event "evEvents", re "reListings", text-ad "txaAds"
//                   (LIST_KEYS, HC-P-S7-7)
//       ids         the ids 206 will render, in order (same as listCount)
//       from        "design-json" | "reference" (the old single-reference
//                   fallback 206 still honours) | "none"
//       designJson  the block's design-json exactly as stored, "" if empty.
//                   Scenario 127 replaces the whole field on write, so the
//                   Picker sends this back with only the list key changed.
//       jsonOk      false when the stored design-json is not valid JSON.
//                   The Picker must not write over it.
//   listCount is unchanged. Nothing is removed or renamed.
//
// v1.0.17 (8 Oct 2026) — IPP Build S7 (Allocator catch-up). /plans also
//   answers `sections`, the same checked IX_CONFIG.sections list that
//   /plan-board answers, so the Allocator (ta-cadence-board v0.7.14) reads
//   lock AND sections from this Worker and nothing from a TA_CONFIG copy
//   (ruled 7 Oct: one source of truth).
//     sections   [{ key, label, assetType, allocationTypes }] or null with a
//                warning, exactly as /plan-board. Checked against the
//                ALLOCATIONS type options when IX_CONFIG.collections.
//                allocations is set; without it the list is still answered
//                and the check is skipped with a warning.
//   sectionsOf no longer warns about a section's assetType when
//   IX_CONFIG.assetTypes is absent (/plans does not require it; /plan-board
//   does, so nothing changes there). Nothing is removed or renamed.
//   No new hardcoding.
//
// v1.0.16 (7 Oct 2026) — IPP Build S6 (Allocations ledger). Nothing is
//   removed or renamed.
//   1 · A tile can hold a print item before its article exists (the hollow
//       green state). NL-BLOCKS gains a Plain text field 'asset-allocation-id'
//       holding the ALLOCATIONS item id. Plain text, not a Reference: NL-BLOCKS
//       has no Reference fields left (ruled 7 Oct 2026).
//         slots[].allocation  { id, printTitle, type } or null. A stored id
//                             that is not an ALLOCATIONS item answers
//                             { id, missing:true } and is named in
//                             meta.warnings.
//         allocations[]       an ALLOCATIONS row held by a tile of this plan
//                             through that field now counts as in the plan
//                             (the newsletter is the truth, as in v1.0.15).
//         placement           gains via: 'asset' when the linked article,
//                             event or listing sits in a tile, 'allocation'
//                             when a tile holds the row's id instead. The
//                             asset wins when both are true.
//         blockFields         { allocation: "asset-allocation-id" }. The IPP
//                             sends it as the assetField of Scenario 124's
//                             fill and clear ops; no slug is typed into the
//                             page. 124 v2.14 needs no change: fill and clear
//                             already take any field name and echo its value.
//       Missing field on NL-BLOCKS: named in meta.warnings, every allocation
//       field answers null, nothing else changes.
//   2 · One section list (S6 ruling 1). IX_CONFIG.sections, in order:
//         [{ "key": "articles", "label": "Articles", "assetType": "article",
//            "allocationTypes": ["article", "other"] }, ...]
//       Shared vocabulary only. It decides which rail section an allocation
//       sits in and nothing else: the Content Controller stays operator-set.
//         sections            the list, checked, or null with a warning
//         allocations[].sectionKey  the section whose allocationTypes holds
//                             the row's type; null when none does (print ads
//                             and house ads sit in no section, so the rail
//                             leaves them off with no exclusion list)
//       A type in two sections, a duplicate key, or an assetType that is not
//       in IX_CONFIG.assetTypes is named in meta.warnings. A type in two
//       sections answers sectionKey null (never guessed).
//   3 · Locked plans (S6 ruling 4). IX_CONFIG.lockedPlanStatuses, e.g.
//       ["Locked"]. /plan-board answers plan.locked; /plans answers locked on
//       every plan. true / false, or null with a warning when the key is not
//       set. Kept apart from openPlanStatuses, which decides what Assign
//       offers.
//   HARDCODING (provisional): 'asset-allocation-id' joins JOIN.block
//   (HC-P-IPP2-1 class). Section and lock values live in IX_CONFIG
//   (HC-P-DW1-1 class, by design).
//
// v1.0.15 (7 Oct 2026) — PLACED MEANS ALLOCATED. /plan-board's allocations
//   now also include an ALLOCATIONS row whose article sits in this plan's
//   NL-BLOCKS even when its publication-plans does not name the plan
//   (Inside This Issue on WLN-998). Same rule as the Allocator v0.7.11:
//   the newsletter is the truth. Such a row carries recorded:false; every
//   other row recorded:true. Nothing else changes.
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
// IX_CONFIG KEYS ADDED IN v1.0.16 (optional; the answer says when missing)
//   sections            [{ key, label, assetType, allocationTypes }]
//   lockedPlanStatuses  ["Locked"]
//
// HARDCODING ADDED IN v1.0.9 (provisional ids)
//   HC-P-IPP2-1  NL-BLOCKS slugs slot-key, end-group, block-text,
//                asset-type, and the ALLOCATIONS slugs in JOIN.alloc.
//                Same class as HC-P-DW1-2. Open.
//   HC-P-IPP2-2  Option names become keys by lower case and hyphens
//                ("Not for newsletter" -> "not-for-newsletter"), the way
//                the Allocator already writes them. By design.
// ============================================================

const VERSION = '1.0.51';
// v1.0.42 — the weather block's type (HC-P-M206-14)
const weatherLabelOf = cfg => String((cfg && cfg.weatherBlock) || 'LW').trim().toUpperCase();
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

// v1.0.18 — the design-json key each list asset type is stored under.
// 206's contract (data reference §14G): evEvents, reListings, txaAds.
// HC-P-S7-7. Same vocabulary eventIdsFor / reIdsFor already read.
const LIST_KEYS = { event: 'evEvents', re: 'reListings', 'text-ad': 'txaAds' };

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
    allocation: 'asset-allocation-id',            // v1.0.16, Plain text: an ALLOCATIONS item id
  },
  // v1.0.9 — ALLOCATIONS, as the Allocator writes it. HC-P-IPP2-1.
  alloc: { plans: 'publication-plans', printTitle: 'print-title', section: 'section',
           page: 'page', pdfPage: 'pdf-page', pdfUrl: 'print-pdf-url', type: 'type',
           disposition: 'disposition', article: 'asset-article', event: 'asset-event',
           re: 'asset-re', ad: 'asset-ad',
           customer: 'suggested-customer', paidOverride: 'paid-override', paidNote: 'paid-note',   // v1.0.12
           byline: 'byline', imageCount: 'image-count',                                             // v1.0.19
           issueName: 'print-issue-name', issuePages: 'print-issue-pages' },                        // v1.0.19
  // v1.0.9 — PUBLICATION PLAN fields the board answers.
  planBoard: { date: 'publication-date', titleAdmin: 'title-admin', status: 'planning-status',
               issueNumber: 'issue-number' },   // issueNumber v1.0.36, HC-P-S12-1
  newsletter: { title: 'sector', plan: 'publication-plan' },
  title: { publisher: 'associated-client', designJson: 'design-json',
           tokens: 'email-tokens-file',                                   // v1.0.6
           legacySplashLogo: 'title-masthead-ulc-link-for-splash' },      // v1.0.6, until 106 retires
  titleSite: { titleAdmin: 'titles-admin' },   // v1.0.3: TITLES -> TITLES-ADMIN
  plan: { designJson: 'design-json' },
  design: { template: 'template-file', templateWeb: 'web-template-file', titles: 'titles',
            type: 'block-type' },   // v1.0.21, HC-P-S7-8; type v1.0.33, HC-P-S9-2
  event: { start: 'event-start', photo: 'event-hero-image-ulc-link-ev-1-only' },   // v1.0.33, HC-P-S9-2
  publisher: { designJson: 'design-json' },   // v1.0.2: read when the field exists
  article: { section: 'section', author: 'associated-business-coc',
             ogSrc: 'main-image-ulc-link---1-1-ratio' },   // ogSrc v1.0.33, HC-P-S9-2; type removed v1.0.49
  re: { agent: 'listing-agent-customer', photo: 'property-image-link' },   // photo v1.0.33
  ad: { customer: 'associated-advertiser', type: 'add-type', status: 'status',
        bannerLink: 'banner-ad-link', redirectLink: 'redirect-link',
        houseKind: 'house-kind', titles: 'titles', splashLink: 'splash-ad-link--get',
        splashLink2: 'splash-ad-link-2---get' },   // v1.0.4
  splash: { logo: 'title-logo-url', paidAd: 'splash-ad-image', paidGo: 'splash-sponsor-go-url',
            paidName: 'splash-sponsor-name' },                                       // v1.0.4
  publish: {                                                                             // v1.0.29
    subject: 'email-subject', preview: 'email-preview', volume: 'send-volume', sendAt: 'send-time',
    sectors: 'send-sectors', issueDate: 'publish-date', authorizedAt: 'final-send-authorized-at',
    greetTitle: 'newsletter-greeting-title', greetPara: 'entry-paragraph-for-each-newsletter',
    greetShort: 'super-short-greeting', closing: 'closing-note',
    ogImage: 'main-image-for-og', archiveImage: 'archive-page-image', stepState: 'publish-step-state',   // v1.0.30
    status: 'publishing-status',                                                       // v1.0.32
    ta: { zips: 'send-zip-codes', sectorsDefault: 'send-sectors-default' },
    html: { email: 'email-render-html', web: 'web-render-html' },
  },
  // v1.0.34 — the link on each record, with the ASF state key Scenario G
  // takes for it. HC-P-S10-1.
  links: {
    article: { slugs: ['redirect-link'], key: 'redirectLink' },
    ad:      { slugs: ['redirect-link'], key: 'redirectLink' },
    event:   { slugs: ['event-link'], key: 'eventLink' },   // "Event Link - GO", what 206 module 248 reads
    re:      { slugs: ['listing-link'], key: 'propertyLink' },
  },
  // v1.0.34 — MEDIA, and the picture keys Scenario G takes. HC-P-S10-2.
  media: { title: 'title-admin', type: 'media-type', status: 'status', role: 'component-role',
           image: 'image', imageUrl: 'image-url', width: 'pixel-width', height: 'pixel-height' },
  reMedia: 'hero-image-media-item',
  // v1.0.35 — SECTIONS slugs the /sections route reads. HC-P-S11-1.
  sections: { position: 'position', status: 'status', type: 'block-type' },   // type v1.0.48, HC-P-CP-1
  franchise: { mnls: 'nl-section' },                                           // v1.0.50, HC-P-ASF-1
  photo: {
    article: { media: 'mainImageMediaId', src: 'mainImageSrc' },
    re:      { media: 'mainImageMediaId', src: 'mainImageSrc' },
    event:   { media: null, src: 'mainImageSrc' },
  },
};
const MEDIA_LABELS = { image: 'Image', available: 'Available', mainImage: 'Main Image' };   // v1.0.34, HC-P-S10-3

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
    if (url.pathname === '/article-print') return articlePrintRoute(env, ctx, url, request);   // v1.0.20
    if (url.pathname === '/block-designs') return blockDesignsRoute(env, ctx, url, request);   // v1.0.22
    if (url.pathname === '/clone-rows') return cloneRowsRoute(env, ctx, url, request);         // v1.0.23
    if (url.pathname === '/link-check') return linkCheckRoute(env, ctx, url, request);         // v1.0.29
    if (url.pathname === '/email-html') return emailHtmlRoute(env, ctx, url, request);         // v1.0.30
    if (url.pathname === '/links') return linksRoute(env, ctx, url, request);                  // v1.0.34
    if (url.pathname === '/media') return mediaRoute(env, ctx, url, request);                  // v1.0.34
    if (url.pathname === '/sections') return sectionsRoute(env, ctx, url, request);            // v1.0.35
    if (url.pathname === '/assemble-diff') return assembleDiffRoute(env, ctx, url, request);    // v1.0.37
    if (url.pathname === '/preview') return previewRoute(env, ctx, url, request);              // v1.0.47
    if (url.pathname !== '/issue-data' && url.pathname !== '/assemble') return fail(404, 'Unknown path. Use /issue-data, /assemble, /assemble-diff, /issue-check, /plan-board, /plans, /article-print, /block-designs, /clone-rows, /link-check, /links, /media, /sections, /email-html or /splash.');

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
    if (url.pathname === '/assemble') {                                                          // v1.0.37
      try { return await assembleKeyed(run, nlId, parentId); }
      catch (e) { return json({ ok: false, error: (e && e.message) || String(e), meta: run.meta(null) }, (e && e.status) || 502); }
    }
    try {
      const out = await buildIssue(run, nlId, parentId);
      return json(Object.assign({ ok: true }, out, { meta: run.meta(out.blocks.length) }), 200);
    } catch (e) {
      return json({ ok: false, error: (e && e.message) || String(e), meta: run.meta(null) },
        (e && e.status) || 502);
    }
  },
};

// ── Link check (v1.0.29) ─────────────────────────────────────
// Every link in the compiled email answers? Reads the newsletter's saved
// HTML; the page never sends URLs of its own.
const LINK_MAX = 80, LINK_TIMEOUT = 8000, LINK_PAR = 6;
async function linkCheckRoute(env, ctx, url, request) {
  const origin = request.headers.get('Origin') || '';
  let cfg = null;
  try { cfg = JSON.parse(env.IX_CONFIG || ''); } catch (e) { cfg = null; }
  const allowed = (cfg && Array.isArray(cfg.allowedOrigins)) ? cfg.allowedOrigins : [];
  const okO = !!origin && allowed.includes(origin);
  const out = (obj, status) => new Response(JSON.stringify(obj), { status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin' },
      okO ? { 'Access-Control-Allow-Origin': origin } : {}) });
  if (!cfg) return out({ ok: false, error: 'IX_CONFIG is missing or is not valid JSON.' }, 500);
  if (!okO) return out({ ok: false, error: 'This origin may not call /link-check.' }, 403);
  if (!env.WEBFLOW_TOKEN) return out({ ok: false, error: 'WEBFLOW_TOKEN is not set on this Worker.' }, 500);
  const C = cfg.collections || {};
  if (!/^[0-9a-f]{24}$/.test(C.newsletter || '')) return out({ ok: false, error: 'IX_CONFIG.collections.newsletter is not set.' }, 500);
  const nlId = (url.searchParams.get('n') || '').trim();
  if (!/^[0-9a-f]{24}$/.test(nlId)) return out({ ok: false, error: 'Missing or malformed n (NEWSLETTER id).' }, 400);
  const fresh = url.searchParams.get('fresh') === '1';
  const cacheKey = new Request('https://ix-cache.local/link-check/' + nlId);
  if (!fresh) { try { const hit = await caches.default.match(cacheKey); if (hit) return out(Object.assign(await hit.json(), { cached: true }), 200); } catch (e) {} }
  const run = new Run(env, ctx, cfg, true);
  try {
    const item = await run.getItem('NEWSLETTER', C.newsletter, nlId);
    if (!item) return out({ ok: false, error: 'NEWSLETTER ' + nlId + ' was not found.' }, 404);
    const f = item.fieldData || {}, H = JOIN.publish.html;
    let source = 'email', html = String(f[H.email] || '');
    if (!html.trim()) { source = 'web'; html = String(f[H.web] || ''); }
    if (!html.trim()) return out({ ok: false, error: 'This newsletter has no compiled HTML yet. Compile first.' }, 409);
    const links = extractLinks(html).slice(0, LINK_MAX);
    const results = await pool(links, LINK_PAR, async l => Object.assign(l, await probe(l.url)));
    const common = commonUtm(results);
    const body = { ok: true, nlId, source, checked: results.length, failed: results.filter(r => !r.ok).length,
                   links: results, common, version: VERSION };
    try { ctx.waitUntil(caches.default.put(cacheKey, new Response(JSON.stringify(body), { headers: { 'Cache-Control': 'max-age=600' } }))); } catch (e) {}
    return out(body, 200);
  } catch (e) {
    return out({ ok: false, error: (e && e.message) || String(e) }, 502);
  }
}
// v1.0.30 — the saved email HTML as a file to attach.
async function emailHtmlRoute(env, ctx, url, request) {
  const origin = request.headers.get('Origin') || '';
  let cfg = null;
  try { cfg = JSON.parse(env.IX_CONFIG || ''); } catch (e) { cfg = null; }
  const allowed = (cfg && Array.isArray(cfg.allowedOrigins)) ? cfg.allowedOrigins : [];
  const okO = !!origin && allowed.includes(origin);
  const cors = okO ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Expose-Headers': 'Content-Disposition' } : {};
  const err = (status, message) => new Response(JSON.stringify({ ok: false, error: message }), { status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin' }, cors) });
  if (!cfg) return err(500, 'IX_CONFIG is missing or is not valid JSON.');
  if (!okO) return err(403, 'This origin may not call /email-html.');
  if (!env.WEBFLOW_TOKEN) return err(500, 'WEBFLOW_TOKEN is not set on this Worker.');
  const C = cfg.collections || {};
  const nlId = (url.searchParams.get('n') || '').trim();
  if (!/^[0-9a-f]{24}$/.test(nlId)) return err(400, 'Missing or malformed n (NEWSLETTER id).');
  const run = new Run(env, ctx, cfg, true);
  try {
    const item = await run.getItem('NEWSLETTER', C.newsletter, nlId);
    if (!item) return err(404, 'NEWSLETTER ' + nlId + ' was not found.');
    const f = item.fieldData || {}, H = JOIN.publish.html;
    let source = 'email', html = String(f[H.email] || '');
    if (!html.trim()) { source = 'web'; html = String(f[H.web] || ''); }
    if (!html.trim()) return err(409, 'This newsletter has no compiled HTML yet. Compile first.');
    const name = String(f.name || nlId).replace(/[^A-Za-z0-9._-]+/g, '-') + '-email.html';
    return new Response(html, { status: 200, headers: Object.assign({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
      'Vary': 'Origin', 'Content-Disposition': 'attachment; filename="' + name + '"', 'X-IX-Source': source }, cors) });
  } catch (e) { return err(502, (e && e.message) || String(e)); }
}
function decodeEnt(s) { return String(s).replace(/&amp;/g, '&').replace(/&#38;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }
function extractLinks(html) {
  const seen = new Set(), out = [], re = /<a\b[^>]*?href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = decodeEnt(m[2].trim());
    if (!/^https?:\/\//i.test(href) || seen.has(href)) continue;
    seen.add(href);
    const alt = (/alt\s*=\s*(["'])(.*?)\1/i.exec(m[3]) || [])[2] || '';
    const text = decodeEnt(m[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || alt).slice(0, 80);
    let utm = {};
    try { new URL(href).searchParams.forEach((v, k) => { if (/^utm_/i.test(k)) utm[k.toLowerCase()] = v; }); } catch (e) {}
    out.push({ url: href, text, utm });
  }
  return out;
}
async function probe(u) {
  const go = method => {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), LINK_TIMEOUT);
    return fetch(u, { method, redirect: 'follow', signal: ac.signal,
      headers: { 'User-Agent': 'inbxify-link-check/1.0 (+https://inbxify.com)' } }).finally(() => clearTimeout(t));
  };
  try {
    let r = await go('HEAD');
    if ([403, 405, 501].includes(r.status)) r = await go('GET');
    return { status: r.status, ok: r.status < 400, finalUrl: r.url && r.url !== u ? r.url : undefined };
  } catch (e) {
    const msg = (e && e.name === 'AbortError') ? 'no answer in 8 s' : ((e && e.message) || 'request failed');
    return { status: 0, ok: false, error: msg, unchecked: CF_LIMIT_RX.test(msg) || undefined };   // v1.0.38
  }
}
// v1.0.38 — errors that come from Cloudflare, not from the site. HC-P-M206-13
const CF_LIMIT_RX = /too many subrequests|subrequest|worker exceeded|exceeded (cpu|memory)|script will never generate a response/i;
async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}
function commonUtm(links) {
  if (!links.length) return { utm: {} };
  const first = links[0].utm || {}, utm = {};
  Object.keys(first).forEach(k => { if (links.every(l => (l.utm || {})[k] === first[k])) utm[k] = first[k]; });
  return { utm, tagged: links.filter(l => Object.keys(l.utm || {}).length).length };
}

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
    delete board._recs;                                                                    // v1.0.34, internal
    if (board.splash) (board.splash.newsletters || []).forEach(n => { n.resolver = url.origin + '/splash?n=' + n.id; });   // v1.0.27
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
  const [plan, blocksAll, allocAll, ads, customers, blockSchema, planSchema, allocSchema, titles, designs] = await Promise.all([
    run.getItem('PUBLICATION PLAN', C.plan, planId),
    run.listAll(C.blocks),
    run.listAll(C.allocations),
    run.cachedList('ads', C.ads),
    run.cachedList('customers', C.customers),
    run.cachedSchema('blocks', C.blocks),
    run.cachedSchema('plan', C.plan),
    run.cachedSchema('allocations', C.allocations),
    run.cachedList('titles', C.titles),                       // v1.0.10
    /^[0-9a-f]{24}$/.test(C.designs || '') ? run.cachedList('designs', C.designs) : Promise.resolve(null),   // v1.0.21
  ]);
  if (!plan) throw httpErr(404, 'planId is not in the PUBLICATION PLAN collection.');
  // v1.0.28 — sections and the publisher, for each slot's section
  const [sectionsAll, publishersAll] = await Promise.all([
    /^[0-9a-f]{24}$/.test(C.sections || '') ? run.cachedList('sections', C.sections) : Promise.resolve([]),
    /^[0-9a-f]{24}$/.test(C.publishers || '') ? run.cachedList('publishers', C.publishers) : Promise.resolve([]),
  ]);
  if (!/^[0-9a-f]{24}$/.test(C.sections || '')) run.warn('IX_CONFIG.collections has no sections id; slots answer no section.');
  const adSchema = await run.cachedSchema('ads', C.ads);   // v1.0.25, option labels for the ad shelf
  // v1.0.48 — SECTIONS option labels, for the article type (v1.0.49: Section only).
  const secSchema = /^[0-9a-f]{24}$/.test(C.sections || '') ? await run.cachedSchema('sections', C.sections) : null;
  const secOpts = optionMaps(secSchema);
  if (secSchema && !secOpts[JOIN.sections.type]) run.warn('SECTIONS has no Option field "' + JOIN.sections.type + '"; a Section\'s type cannot be read.');
  // v1.0.33 — the DESIGNS schema, for its block-type labels.
  const designSchema = designs ? await run.cachedSchema('designs', C.designs) : null;

  const blockOpts = optionMaps(blockSchema);
  const planOpts = optionMaps(planSchema);
  const allocOpts = optionMaps(allocSchema);
  // v1.0.51 — which title owns an ALLOCATIONS row, found from the schema.
  const planTa = refId((plan.fieldData || {})[JOIN.planBoard.titleAdmin]);
  const allocTitleFields = (() => {
    const fs = (allocSchema && allocSchema.fields) || [];
    const isRef = f => f.type === 'Reference' || f.type === 'MultiReference';
    if (cfg.allocationsTitleField) {
      const hit = fs.filter(f => f.slug === cfg.allocationsTitleField);
      if (!hit.length) run.warn('IX_CONFIG.allocationsTitleField names "' + cfg.allocationsTitleField + '", which ALLOCATIONS does not have.');
      return hit;
    }
    return fs.filter(f => isRef(f) && f.validations && f.validations.collectionId === C.titles);
  })();
  if (!allocTitleFields.length) run.warn('ALLOCATIONS has no Reference field pointing at TITLES-ADMIN, so an allocation is never matched to this plan by its asset alone; only allocations recorded on the plan or held by a tile are listed.');
  if (!planTa) run.warn('This plan has no ' + JOIN.planBoard.titleAdmin + '; no allocation is matched to it by its asset alone.');
  const allocTitles = a => {
    const fd = a.fieldData || {}, ids = [];
    allocTitleFields.forEach(f => refIds(fd[f.slug]).forEach(id => { if (!ids.includes(id)) ids.push(id); }));
    return ids;
  };
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
  // v1.0.16 — the field that holds a print item in a tile before its article exists.
  const hasAllocField = blockSlugs.has(B.allocation);
  if (!hasAllocField) run.warn('NL-BLOCKS has no field "' + B.allocation + '"; a tile cannot hold a print item without an article.');
  const allocIdOf = b => {
    if (!hasAllocField) return '';
    const v = String((b.fieldData || {})[B.allocation] || '').trim();
    return /^[0-9a-f]{24}$/.test(v) ? v : '';
  };
  const allocById = index(allocAll);

  // 3. This plan's rows, in position order.
  const rows = blocksAll
    .filter(b => refId((b.fieldData || {})[B.plan]) === planId)
    .sort((a, b) => num(a.fieldData.position) - num(b.fieldData.position));
  const parsed = rows.map(b => parseDJ((b.fieldData || {})[B.designJson], 'block ' + b.id, run));

  // 4. This plan's allocations, minus hidden dispositions, in page order.
  // v1.0.15 - an article placed in this plan counts, recorded or not.
  const inPlan = new Set();
  rows.forEach(b => { const fd = b.fieldData || {};
    [B.article, B.events, B.re].forEach(f => refIds(fd[f]).forEach(id => inPlan.add(id))); });
  const heldIn = new Set();                                   // v1.0.16
  rows.forEach(b => { const id = allocIdOf(b); if (id) heldIn.add(id); });
  const recordedHere = a => refIds((a.fieldData || {})[A.plans]).includes(planId);
  const placedHere = a => { const fd = a.fieldData || {};
    return heldIn.has(a.id) ||
      [A.article, A.event, A.re].some(f => f && refIds(fd[f]).some(id => inPlan.has(id))); };
  // v1.0.51 — never another title's row; a row with no title only when
  // linked explicitly, never by its asset alone.
  let otherTitle = 0;
  const allocs = allocAll
    .filter(a => {
      const ts = allocTitles(a);
      if (ts.length && !ts.includes(planTa)) {
        if (recordedHere(a) || placedHere(a)) otherTitle++;
        return false;
      }
      if (recordedHere(a) || heldIn.has(a.id)) return true;
      return ts.length > 0 && !!planTa && placedHere(a);
    })
    .map(a => Object.assign({}, a, {
      _type: keyOf(optName(allocOpts, A.type, (a.fieldData || {})[A.type])),
      _disp: keyOf(optName(allocOpts, A.disposition, (a.fieldData || {})[A.disposition])),
    }))
    .filter(a => !hidden.includes(a._disp))
    .sort((a, b) => num(a.fieldData[A.page]) - num(b.fieldData[A.page]) ||
                    num(a.fieldData[A.pdfPage]) - num(b.fieldData[A.pdfPage]));
  if (otherTitle) run.warn(otherTitle + ' allocation' + (otherTitle === 1 ? ' belongs' : 's belong') +
    ' to another title and ' + (otherTitle === 1 ? 'is' : 'are') + ' not listed on this plan, though ' +
    (otherTitle === 1 ? 'its' : 'their') + ' asset is placed or recorded here.');

  // 5. Read every article, event and listing named anywhere, by id.
  const want = { articles: new Set(), events: new Set(), re: new Set() };
  rows.forEach(b => {
    const fd = b.fieldData || {};
    refIds(fd[B.article]).forEach(id => want.articles.add(id));
    refIds(fd[B.events]).forEach(id => want.events.add(id));
    refIds(fd[B.re]).forEach(id => want.re.add(id));
  });
  rows.forEach((b, i) => {                                    // v1.0.33: design-json lists too
    eventIdsFor(b.fieldData || {}, parsed[i]).forEach(id => want.events.add(id));
    reIdsFor(b.fieldData || {}, parsed[i]).forEach(id => want.re.add(id));
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
    const out = { kind, id, name: String(f.name || ''), customer, thumb };
    if (kind === 'article') out.ogSrc = String(f[JOIN.article.ogSrc] || '').trim() || null;   // v1.0.33
    if (kind === 'article') {                                                                 // v1.0.45: the EC badge
      const au = custBy.get(refId(Array.isArray(f[JOIN.article.author]) ? f[JOIN.article.author][0] : f[JOIN.article.author]));
      out.ec = EC_RULE(f, (au && au.fieldData) || {}) === 1;
      out.writer = String(f.writername || '').trim() || null;                                 // the byline 206 prints as f_author
      out.dek = firstWords(f['post-summary'], 24);                                            // v1.0.46
      const sec = sectionsBy.get(refId(Array.isArray(f[JOIN.article.section]) ? f[JOIN.article.section][0] : f[JOIN.article.section]));
      out.sectionType = sec ? (firstWord(optName(secOpts, JOIN.sections.type, (sec.fieldData || {})[JOIN.sections.type])).toUpperCase() || null) : null;
    }
    if (kind === 'ad') out.hasLink = !!String(f[JOIN.ad.redirectLink] || '').trim();          // v1.0.46
    return out;
  };
  const FIELD_KIND = { [B.article]: 'article', [B.ad]: 'ad', [B.events]: 'event', [B.re]: 're' };

  // v1.0.28 — each slot's section and sponsor, as /issue-data finds them.
  const sectionsBy = index(sectionsAll || []);
  const bTa = byId(titles, refId((plan.fieldData || {})[JOIN.planBoard.titleAdmin]));
  const bPub = bTa ? byId(publishersAll || [], refId((bTa.fieldData || {})[JOIN.title.publisher])) : null;
  const bTitleDJ = bTa ? parseDJ((bTa.fieldData || {})[JOIN.title.designJson], 'TITLES-ADMIN', run) : {};
  const bPlanDJ = parseDJ((plan.fieldData || {})[JOIN.plan.designJson], 'PUBLICATION PLAN', run);
  const bPubDJ = bPub ? parseDJ((bPub.fieldData || {})[JOIN.publisher.designJson], 'PUBLISHERS', run) : {};
  const sectionOfSlot = (fd, dj, label, where) => {
    const art = articles.get(refId(Array.isArray(fd[B.article]) ? fd[B.article][0] : fd[B.article]));
    let id = null, from = null;
    if (art) { id = refId((art.fieldData || {})[JOIN.article.section]); from = id ? 'article' : null; }
    else {
      const f = sectionIdFor(label || '', [['block', dj, true], ['plan', bPlanDJ], ['title', bTitleDJ], ['publisher', bPubDJ]]);
      if (f) { id = f.id; from = f.level; }
    }
    if (!id) return null;
    const sec = sectionsBy.get(id);
    if (!sec) { run.warn(where + ': section ' + id + ' is not in SECTIONS.'); return null; }
    return { id, name: String((sec.fieldData || {}).name || ''), from };
  };
  const sponsorOfSlot = (fd) => {
    const id = refId(Array.isArray(fd[B.sponsor]) ? fd[B.sponsor][0] : fd[B.sponsor]);
    return id ? { id, name: custName(id) } : null;
  };

  // v1.0.45 — the ads that print inside an article, as /issue-data finds them.
  const opt = cfg.options || {};
  const firstBanner = new Map();                              // customer id -> first active banner, ADS list order
  if (opt.adTypeBanner && opt.adStatusActive) {
    ads.forEach(a => {
      const f = a.fieldData || {};
      if (f[JOIN.ad.type] !== opt.adTypeBanner || f[JOIN.ad.status] !== opt.adStatusActive) return;
      const cid = refId(f[JOIN.ad.customer]);
      if (cid && !firstBanner.has(cid)) firstBanner.set(cid, { thumb: f[JOIN.ad.bannerLink] || null, redirect: String(f[JOIN.ad.redirectLink] || '').trim() });
    });
  } else run.warn('IX_CONFIG.options is missing adTypeBanner or adStatusActive; Layout cannot show the ad inside an article.');
  const paidYes = (() => {
    const m = blockOpts[ASM.slugs.isPaid];
    if (!m) return null;
    return Object.keys(m).find(k => String(m[k]).trim().toLowerCase() === ASM.yesLabel) || null;
  })();
  const insideOf = (fd) => {
    const out = [];
    const payer = refId(Array.isArray(fd[B.payer]) ? fd[B.payer][0] : fd[B.payer]);
    if (paidYes && fd[ASM.slugs.isPaid] === paidYes && payer) {
      const ad = firstBanner.get(payer) || null;
      out.push({ kind: 'paid', customer: custName(payer), thumb: ad ? ad.thumb : null, prints: !!(ad && ad.redirect) });
    }
    const sp = refId(Array.isArray(fd[B.sponsor]) ? fd[B.sponsor][0] : fd[B.sponsor]);
    if (sp) {
      const ad = firstBanner.get(sp) || null, c = custBy.get(sp);
      out.push({ kind: 'sponsor', customer: custName(sp),
        thumb: (ad && ad.thumb) || ((c && c.fieldData && c.fieldData['default-paid-ad-ulc-link']) || null), prints: true });
    }
    return out;
  };

  // v1.0.33 — what the Compile pre-check needs.
  const CX = compileContext(run, cfg, blockOpts, designs, designSchema, { events, reItems, adsBy });
  CX.tz = String(((bTa && bTa.fieldData) || {})['title-timezone'] || '').trim() || ASM.tzDefault;   // v1.0.46
  CX.custName = custName;                                                                      // v1.0.46

  // 6. Slots and loose rows.
  const slots = [], loose = [];
  const placedAt = new Map();    // asset id -> { blockId, position, loose }
  const place = (id, b, isLoose) => {
    if (!id || placedAt.has(id)) return;
    placedAt.set(id, { blockId: b.id, position: num(b.fieldData.position), loose: isLoose });
  };
  // v1.0.16 — ALLOCATIONS id -> the first tile of this plan holding it.
  const heldAt = new Map();
  const allocOf = (b, where) => {
    const id = allocIdOf(b);
    if (!id) return null;
    const pos = num(b.fieldData.position);
    if (!heldAt.has(id)) heldAt.set(id, { blockId: b.id, position: pos, loose: pos >= looseFrom });
    const a = allocById.get(id);
    if (!a) { run.warn(where + ': ' + B.allocation + ' ' + id + ' is not an ALLOCATIONS item.'); return { id, missing: true }; }
    const fd = a.fieldData || {};
    return { id, printTitle: String(fd[A.printTitle] || fd.name || ''),
             type: keyOf(optName(allocOpts, A.type, fd[A.type])) };
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
      const allocation = allocOf(b, where);                   // v1.0.16
      if (!asset && !allocation) run.warn(where + ' is a loose row with no asset.');
      else if (asset) place(asset.id, b, true);
      loose.push({ id: b.id, position: pos, asset, allocation });
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

    let asset = null, listCount = null, list = null;
    const field = assetType ? accepts[assetType] : undefined;
    if (assetType && field === undefined) run.warn('IX_CONFIG.slotAccepts has no entry for "' + assetType + '".');
    if (field === LIST) {
      let ids = [];
      if (assetType === 'event') ids = eventIdsFor(fd, dj);
      else if (assetType === 're') ids = reIdsFor(fd, dj);
      else ids = idList(dj && dj.txaAds);
      listCount = ids.length;
      ids.forEach(id => place(id, b, false));
      // v1.0.18 — what the Picker needs to write this list back safely
      const rawDJ = fd[B.designJson] == null ? '' : String(fd[B.designJson]);
      let jsonOk = true;
      if (rawDJ.trim()) { try { const v = JSON.parse(rawDJ); jsonOk = !!v && typeof v === 'object' && !Array.isArray(v); } catch (e) { jsonOk = false; } }
      const key = LIST_KEYS[assetType] || null;
      if (!key) run.warn('LIST_KEYS has no design-json key for list asset type "' + assetType + '".');
      const inDJ = key ? idList(dj && dj[key]).length : 0;
      list = { key, ids, from: inDJ ? 'design-json' : (ids.length ? 'reference' : 'none'), designJson: rawDJ, jsonOk };
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
      allocation: allocOf(b, where),                          // v1.0.16
      design: refId(fd[B.design]),                            // v1.0.23
      needsAck: String(fd[cloneCfg(cfg).ackField] || '').trim() === cloneCfg(cfg).ackPending,   // v1.0.23
      section: sectionOfSlot(fd, dj, blockType, where),        // v1.0.28
      sponsor: sponsorOfSlot(fd),                              // v1.0.28
    };
    if (list) slot.list = list;                               // v1.0.18
    if (assetType === 'article') slot.inside = insideOf(fd);   // v1.0.45
    compileFactsOf(CX, slot, fd, btRaw, list, dj);            // v1.0.33
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
  const sec = sectionsOf(run, cfg.sections, assetTypes, allocOpts);   // v1.0.16
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
      byline: String(fd[A.byline] || '').trim(),                    // v1.0.19
      imageCount: num(fd[A.imageCount]) || 0,                       // v1.0.19
      issueName: String(fd[A.issueName] || '').trim(),              // v1.0.19
      issuePages: fd[A.issuePages] == null ? null : (num(fd[A.issuePages]) || null),   // v1.0.19
      type: a._type,
      disposition: a._disp,
      plans: refIds(fd[A.plans]),                              // v1.0.14
      recorded: refIds(fd[A.plans]).includes(planId),          // v1.0.15
      asset,
      // v1.0.16 — via says what put it there: its asset, or the tile holding its id.
      placement: (asset && placedAt.get(asset.id)) ? Object.assign({ via: 'asset' }, placedAt.get(asset.id))
               : (heldAt.get(a.id) ? Object.assign({ via: 'allocation' }, heldAt.get(a.id)) : null),
      sectionKey: sec.keyFor(a._type),                         // v1.0.16
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
  const sb = await splashBoardOf(run, planId, ads, taId);                    // v1.0.29 (was inline)
  const layoutTypes = layoutTypesOf(run, cfg, writeIds);                     // v1.0.36
  const typeMismatches = typeChecksOf(run, slots, layoutTypes);              // v1.0.48
  const wxLabel = weatherLabelOf(cfg);                                       // v1.0.42
  const wxIds = slots.filter(s => String(s.blockLabel || '').toUpperCase() === wxLabel).map(s => s.id);
  return {
    plan: {
      id: plan.id,
      name: String(pfd.name || ''),
      date: pfd[JOIN.planBoard.date] || null,
      titleAdminId: taId,
      titleName: ta ? (String((ta.fieldData || {}).name || '').trim() || null) : null,   // v1.0.10
      titleSlug: ta ? (String((ta.fieldData || {}).slug || '').trim() || null) : null,   // v1.0.11
      issueNumber: String(pfd[JOIN.planBoard.issueNumber] == null ? '' : pfd[JOIN.planBoard.issueNumber]).trim(),   // v1.0.36
      planningStatus: optName(planOpts, JOIN.planBoard.status, pfd[JOIN.planBoard.status]) || null,
      locked: lockedTest(run, cfg, planOpts)(optName(planOpts, JOIN.planBoard.status, pfd[JOIN.planBoard.status]) || null),   // v1.0.16
    },
    slots, loose, allocations,
    sections: sec.list,                                  // v1.0.16
    blockFields: { allocation: B.allocation, design: B.design },   // v1.0.16, design v1.0.34
    accepts,
    writeIds,                                            // v1.0.12
    addTypes: withDesigns(run, addTypesOf(run, cfg.addTypes, writeIds), designs, ta),   // v1.0.12, designs v1.0.21
    linkFields: { article: A.article, event: A.event, re: A.re, ad: A.ad },   // v1.0.13
    loosePositionFrom: Number(cfg.loosePositionFrom),                         // v1.0.13
    adPool: adPoolOf(run, ads, adSchema, taId, custName),                    // v1.0.25
    adFields: { ad: B.ad, sponsor: B.sponsor, approval: cloneCfg(cfg).ackField, approvalPending: cloneCfg(cfg).ackPending },   // v1.0.25, sponsor v1.0.28
    sponsorsMax: (Number.isInteger(cfg.sponsorsMax) && cfg.sponsorsMax > 0) ? cfg.sponsorsMax : null,   // v1.0.28
    splash: sb,                                                              // v1.0.27
    publish: await publishBoardOf(run, sb, ta, wxIds.length > 0),            // v1.0.29, weather v1.0.42
    weather: { label: wxLabel, blockIds: wxIds, inPlan: wxIds.length > 0 },  // v1.0.42
    compile: CX.summary(),                                                   // v1.0.33
    designChoices: designChoicesOf(run, CX, designs, taId, slots, layoutTypes),   // v1.0.34, layout types v1.0.36
    editions: await editionsOf(run, cfg, planId, pfd, taId, blocksAll, planOpts, blockOpts),   // v1.0.36
    layout: { articleTypes: layoutTypes },                                   // v1.0.36
    typeMismatches,                                                          // v1.0.48
    catalog: catalogBoardOf(run, cfg, writeIds, slots, designs, ta,          // v1.0.43
      label => { const f = sectionIdFor(label, [['plan', bPlanDJ], ['title', bTitleDJ], ['publisher', bPubDJ]]);
                 const sec = f ? sectionsBy.get(f.id) : null;
                 return sec ? (String((sec.fieldData || {}).name || '').trim() || null) : null; }),
    photoKeys: JOIN.photo,                                                   // v1.0.34
    _recs: { articles, events, reItems, adsBy },                             // v1.0.34, removed before answering
  };
}

// v1.0.34 — the designs the Correct window may offer, per block label in
// this plan: 206's guard (template-file holds "email-<code>-" and a web
// template is set), live, and the DESIGNS block-type equal to the label
// when the row has one. The title's own rows first, then every title's.
function designChoicesOf(run, CX, designs, taId, slots, extra) {
  const out = {};
  if (!designs) return out;
  const D = JOIN.design;
  const labels = [...new Set(slots.map(s => s.blockLabel).concat(extra || []).filter(Boolean))];   // extra v1.0.36
  labels.forEach(label => {
    const needle = 'email-' + CX.codeOf(label) + '-';
    const ok = designs.filter(r => {
      const fd = r.fieldData || {};
      if (r.isArchived || r.isDraft) return false;
      if (!String(fd[D.templateWeb] || '').trim()) return false;
      if (String(fd[D.template] || '').toLowerCase().indexOf(needle) === -1) return false;
      const info = CX.designInfo(r.id);
      return !(info && info.label && info.label.toUpperCase() !== label.toUpperCase());
    });
    const mine = ok.filter(r => refIds((r.fieldData || {})[D.titles]).indexOf(taId) !== -1);
    const glob = ok.filter(r => !refIds((r.fieldData || {})[D.titles]).length);
    const shape = r => ({ id: r.id, name: String((r.fieldData || {}).name || '').trim() || r.id, mine: mine.indexOf(r) !== -1 });
    const byName = (a, b) => a.name.localeCompare(b.name);
    const pool = mine.map(shape).sort(byName).concat(glob.map(shape).sort(byName));
    out[label] = pool;
    if (!pool.length) run.warn('No live DESIGNS row fits ' + label + ' blocks for this title; the Correct window has none to offer.');
  });
  return out;
}

// v1.0.48 — article type against block type. v1.0.49: the type is the
// article's Section's, always.
function typeChecksOf(run, slots, layoutTypes) {
  const allowed = (layoutTypes || []).map(l => String(l).toUpperCase());
  const known = (v, what) => {
    if (!v) return null;
    if (allowed.length && allowed.indexOf(v) < 0) { run.warn(what + ' is "' + v + '", which is not in IX_CONFIG.layout.articleTypes; treated as untyped.'); return null; }
    return v;
  };
  const bad = [];
  slots.forEach(s => {
    if (s.assetType !== 'article' || !s.asset || s.asset.missing) return;
    const where = 'NL-BLOCKS ' + s.id;
    const secT = known(s.asset.sectionType, where + ': article ' + s.asset.id + ' Section type');
    const article = secT || null;                                      // v1.0.49: the Section decides
    const from = secT ? 'section' : null;
    const block = String(s.blockType || '').toUpperCase();
    let ok = null, reason = null;
    if (!block) reason = 'untyped-block';
    else if (!article) reason = 'untyped-article';
    else { ok = block === article; if (!ok) reason = 'mismatch'; }
    s.typeCheck = { block, article, from, sectionType: secT, ok, reason };
    if (ok === false) bad.push(s.id);
  });
  return bad;
}

// v1.0.36 — the block types an article block may take on Layout.
function layoutTypesOf(run, cfg, writeIds) {
  const raw = cfg.layout && cfg.layout.articleTypes;
  if (!Array.isArray(raw)) { run.warn('IX_CONFIG.layout.articleTypes is not set, so Layout cannot change an article block\'s type.'); return []; }
  const out = [];
  raw.map(x => String(x || '').trim()).filter(Boolean).forEach(l => {
    if (!(writeIds && writeIds.blockType && writeIds.blockType[l])) { run.warn('IX_CONFIG.layout.articleTypes names "' + l + '", which has no option id in IX_CONFIG.blockTypes; it is left out.'); return; }
    if (out.indexOf(l) < 0) out.push(l);
  });
  return out;
}

// v1.0.36 — the other editions of this issue: same title, same
// issue-number (HC-P-S12-2). Their rows, shaped like slots.
async function editionsOf(run, cfg, planId, pfd, taId, blocksAll, planOpts, blockOpts) {
  const P = JOIN.planBoard, B = JOIN.block;
  const issue = String(pfd[P.issueNumber] == null ? '' : pfd[P.issueNumber]).trim();
  if (!issue) { run.warn('This plan has no ' + P.issueNumber + ', so no other edition is found; Layout changes stay on this plan.'); return []; }
  if (!taId) return [];
  const plans = await run.cachedList('plans', cfg.collections.plan);
  const isLocked = lockedTest(run, cfg, planOpts);
  const looseFrom = Number(cfg.loosePositionFrom);
  const assetTypes = cfg.assetTypes || {}, blockTypes = cfg.blockTypes || {};
  return plans
    .filter(p => p.id !== planId && !p.isArchived)
    .filter(p => { const fd = p.fieldData || {}; return refId(fd[P.titleAdmin]) === taId && String(fd[P.issueNumber] == null ? '' : fd[P.issueNumber]).trim() === issue; })
    .map(p => {
      const fd = p.fieldData || {};
      const status = optName(planOpts, P.status, fd[P.status]) || null;
      const rows = blocksAll
        .filter(b => refId((b.fieldData || {})[B.plan]) === p.id && num((b.fieldData || {}).position) < looseFrom)
        .sort((a, b) => num(a.fieldData.position) - num(b.fieldData.position))
        .map(b => {
          const bf = b.fieldData || {};
          const bt = String(bf[B.type] || '');
          return { id: b.id, position: num(bf.position), slotKey: String(bf[B.slotKey] || ''),
                   assetType: assetTypes[String(bf[B.assetType] || '')] || null,
                   blockType: bt ? (blockTypes[bt] || null) : '',
                   design: refId(bf[B.design]), endGroup: bf[B.endGroup] === true,
                   blockText: String(bf[B.blockText] || '') };
        });
      return { id: p.id, name: String(fd.name || ''), date: fd[P.date] || null,
               planningStatus: status, locked: isLocked(status), rows };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ── Links, read from their records (v1.0.34) ────────────────
// HC-P-S10-4: what counts as turned away.
function linkClass(r, url) {
  if (!url) return 'none';
  if (r.ok) return 'works';
  if (r.unchecked) return 'unchecked';   // v1.0.38: the checker failed, not the site
  if ([401, 403, 429].includes(r.status)) return 'away';
  if (r.status === 0 && /no answer/.test(String(r.error || ''))) return 'away';
  return 'dead';
}
async function linksRoute(env, ctx, url, request) {
  const origin = request.headers.get('Origin') || '';
  let cfg = null;
  try { cfg = JSON.parse(env.IX_CONFIG || ''); } catch (e) { cfg = null; }
  const allowed = (cfg && Array.isArray(cfg.allowedOrigins)) ? cfg.allowedOrigins : [];
  const okO = !!origin && allowed.includes(origin);
  const out = (obj, status) => new Response(JSON.stringify(obj), { status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin' },
      okO ? { 'Access-Control-Allow-Origin': origin } : {}) });
  if (!cfg) return out({ ok: false, error: 'IX_CONFIG is missing or is not valid JSON.' }, 500);
  if (!okO) return out({ ok: false, error: 'This origin may not call /links.' }, 403);
  if (!env.WEBFLOW_TOKEN) return out({ ok: false, error: 'WEBFLOW_TOKEN is not set on this Worker.' }, 500);
  const C = cfg.collections || {};
  const missing = BOARD_COLLECTIONS.filter(k => !/^[0-9a-f]{24}$/.test(C[k] || ''));
  if (missing.length) return out({ ok: false, error: 'IX_CONFIG.collections is missing: ' + missing.join(', ') + '.' }, 500);
  const planId = (url.searchParams.get('planId') || '').trim();
  if (!/^[0-9a-f]{24}$/.test(planId)) return out({ ok: false, error: 'Missing or malformed planId.' }, 400);
  const fresh = url.searchParams.get('fresh') === '1';
  const cacheKey = new Request('https://ix-cache.local/links/' + planId);
  if (!fresh) { try { const hit = await caches.default.match(cacheKey); if (hit) return out(Object.assign(await hit.json(), { cached: true }), 200); } catch (e) {} }
  const run = new Run(env, ctx, cfg, fresh);
  try {
    const board = await buildBoard(run, planId);
    const R = board._recs; delete board._recs;
    const recOf = (kind, id) => kind === 'article' ? R.articles.get(id) : kind === 'event' ? R.events.get(id)
      : kind === 're' ? R.reItems.get(id) : R.adsBy.get(id);
    const seen = new Map(), list = [];
    const add = (group, kind, id, position) => {
      if (!id) return;
      const k = kind + ':' + id;
      if (seen.has(k)) { const x = seen.get(k); if (x.positions.indexOf(position) < 0) x.positions.push(position); return; }
      const rec = recOf(kind, id); if (!rec) return;
      const f = rec.fieldData || {}, L = JOIN.links[kind];
      let link = '';
      for (const s of L.slugs) { const v = String(f[s] || '').trim(); if (v) { link = v; break; } }
      const x = { group, kind, id, name: String(f.name || ''), key: L.key, url: link, positions: [position] };
      seen.set(k, x); list.push(x);
    };
    (board.slots || []).forEach(s => {
      if (s.compile && s.compile.state === 'not-email') return;
      const g = s.assetType;
      if (s.asset && !s.asset.missing && (s.asset.kind === 'article' || s.asset.kind === 'ad')) add(g, s.asset.kind, s.asset.id, s.position);
      (s.items || []).forEach(it => {
        if (it.missing) return;
        const kind = g === 'event' ? 'event' : g === 're' ? 're' : 'ad';
        add(g, kind, it.id, s.position);
      });
    });
    const toCheck = list.filter(x => x.url).slice(0, LINK_MAX);
    if (list.filter(x => x.url).length > LINK_MAX) run.warn('More than ' + LINK_MAX + ' links; only the first ' + LINK_MAX + ' were opened.');
    const answers = new Map();
    const urls = [...new Set(toCheck.map(x => x.url))];
    await pool(urls, LINK_PAR, async u => {
      if (!/^https?:\/\//i.test(u)) { answers.set(u, { status: 0, ok: false, error: 'not a web address' }); return; }
      answers.set(u, await probe(u));
    });
    list.forEach(x => {
      const a = x.url ? (answers.get(x.url) || { status: 0, ok: false, error: 'not opened (over the limit)' }) : { status: null, ok: null };
      x.status = a.status; x.finalUrl = a.finalUrl; x.error = a.error;
      x.cls = (x.url && !/^https?:\/\//i.test(x.url)) ? 'dead' : linkClass(a, x.url);
    });
    const body = { ok: true, planId, checked: urls.length, links: list, version: VERSION, warnings: run.meta(null).warnings,
                   webflowCalls: run.calls, probes: urls.length };   // v1.0.38 counts
    try { ctx.waitUntil(caches.default.put(cacheKey, new Response(JSON.stringify(body), { headers: { 'Cache-Control': 'max-age=600' } }))); } catch (e) {}
    return out(body, 200);
  } catch (e) {
    return out({ ok: false, error: (e && e.message) || String(e) }, (e && e.status) || 502);
  }
}

// ── The title's MEDIA images (v1.0.34) ──────────────────────
async function mediaRoute(env, ctx, url, request) {
  const origin = request.headers.get('Origin') || '';
  let cfg = null;
  try { cfg = JSON.parse(env.IX_CONFIG || ''); } catch (e) { cfg = null; }
  const allowed = (cfg && Array.isArray(cfg.allowedOrigins)) ? cfg.allowedOrigins : [];
  const okO = !!origin && allowed.includes(origin);
  const out = (obj, status) => new Response(JSON.stringify(obj), { status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin' },
      okO ? { 'Access-Control-Allow-Origin': origin } : {}) });
  if (!cfg) return out({ ok: false, error: 'IX_CONFIG is missing or is not valid JSON.' }, 500);
  if (!okO) return out({ ok: false, error: 'This origin may not call /media.' }, 403);
  if (!env.WEBFLOW_TOKEN) return out({ ok: false, error: 'WEBFLOW_TOKEN is not set on this Worker.' }, 500);
  const C = cfg.collections || {};
  if (!/^[0-9a-f]{24}$/.test(C.media || '')) return out({ ok: false, error: 'IX_CONFIG.collections.media is not set.' }, 500);
  if (!/^[0-9a-f]{24}$/.test(C.titles || '')) return out({ ok: false, error: 'IX_CONFIG.collections.titles is not set.' }, 500);
  const taId = (url.searchParams.get('taId') || '').trim();
  if (!/^[0-9a-f]{24}$/.test(taId)) return out({ ok: false, error: 'Missing or malformed taId.' }, 400);
  const run = new Run(env, ctx, cfg, url.searchParams.get('fresh') === '1');
  try {
    const M = JOIN.media, L = Object.assign({}, MEDIA_LABELS, cfg.mediaLabels || {});
    const [rows, schema, titles] = await Promise.all([
      run.cachedList('media', C.media), run.cachedSchema('media', C.media), run.cachedList('titles', C.titles)]);
    const ta = byId(titles, taId);
    if (!ta) return out({ ok: false, error: 'taId is not in the TITLES-ADMIN collection.' }, 404);
    const opts = optionMaps(schema);
    const idFor = (slug, label) => { const m = opts[slug] || {}; return Object.keys(m).find(o => keyOf(m[o]) === keyOf(label)) || null; };
    const typeImage = idFor(M.type, L.image), statusAvailable = idFor(M.status, L.available), roleMainImage = idFor(M.role, L.mainImage);
    if (!typeImage) run.warn('MEDIA media-type has no option "' + L.image + '".');
    if (!statusAvailable) run.warn('MEDIA status has no option "' + L.available + '".');
    if (!roleMainImage) run.warn('MEDIA component-role has no option "' + L.mainImage + '".');
    const items = rows.filter(r => {
      const f = r.fieldData || {};
      if (r.isArchived || r.isDraft) return false;
      if (refId(f[M.title]) !== taId) return false;
      if (typeImage && f[M.type] !== typeImage) return false;
      if (statusAvailable && f[M.status] !== statusAvailable) return false;
      return true;
    }).map(r => {
      const f = r.fieldData || {};
      const img = String(f[M.imageUrl] || (f[M.image] && f[M.image].url) || '').trim();
      return { id: r.id, name: String(f.name || ''), url: img || null,
               width: f[M.width] == null ? null : Number(f[M.width]), height: f[M.height] == null ? null : Number(f[M.height]),
               _at: String(r.lastUpdated || r.createdOn || '') };
    }).filter(x => x.url).sort((a, b) => b._at.localeCompare(a._at)).map(x => { delete x._at; return x; });
    const U = cfg.uploadcare || {}, tf = ta.fieldData || {};
    const upload = { publicKey: U.publicKey ? String(U.publicKey) : null, base: U.base ? String(U.base) : null,
      hashes: { statusAvailable, typeImage, roleMainImage },
      publisherId: refId(tf[JOIN.title.publisher]) || null, titleSlug: String(tf.slug || '').trim() || null, missing: [] };
    if (!upload.publicKey) upload.missing.push('IX_CONFIG.uploadcare.publicKey');
    if (!upload.base) upload.missing.push('IX_CONFIG.uploadcare.base');
    ['statusAvailable', 'typeImage', 'roleMainImage'].forEach(k => { if (!upload.hashes[k]) upload.missing.push('MEDIA option for ' + k); });
    return out({ ok: true, taId, items, upload, meta: run.meta(items.length) }, 200);
  } catch (e) {
    return out({ ok: false, error: (e && e.message) || String(e), meta: run.meta(null) }, (e && e.status) || 502);
  }
}

// v1.0.35 — the SECTIONS rows a title may use: its own and the shared
// ones (title field blank). See the header.
async function sectionsRoute(env, ctx, url, request) {
  const origin = request.headers.get('Origin') || '';
  let cfg = null;
  try { cfg = JSON.parse(env.IX_CONFIG || ''); } catch (e) { cfg = null; }
  const allowed = (cfg && Array.isArray(cfg.allowedOrigins)) ? cfg.allowedOrigins : [];
  const okO = !!origin && allowed.includes(origin);
  const out = (obj, status) => new Response(JSON.stringify(obj), { status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin' },
      okO ? { 'Access-Control-Allow-Origin': origin } : {}) });
  if (!cfg) return out({ ok: false, error: 'IX_CONFIG is missing or is not valid JSON.' }, 500);
  if (!okO) return out({ ok: false, error: 'This origin may not call /sections.' }, 403);
  if (!env.WEBFLOW_TOKEN) return out({ ok: false, error: 'WEBFLOW_TOKEN is not set on this Worker.' }, 500);
  const C = cfg.collections || {};
  if (!/^[0-9a-f]{24}$/.test(C.sections || '')) return out({ ok: false, error: 'IX_CONFIG.collections.sections is not set.' }, 500);
  if (!/^[0-9a-f]{24}$/.test(C.titles || '')) return out({ ok: false, error: 'IX_CONFIG.collections.titles is not set.' }, 500);
  const taId = (url.searchParams.get('taId') || '').trim();
  if (!/^[0-9a-f]{24}$/.test(taId)) return out({ ok: false, error: 'Missing or malformed taId.' }, 400);
  const run = new Run(env, ctx, cfg, url.searchParams.get('fresh') === '1');
  try {
    const [rows, schema, titles] = await Promise.all([
      run.cachedList('sections', C.sections), run.cachedSchema('sections', C.sections), run.cachedList('titles', C.titles)]);
    if (!byId(titles, taId)) return out({ ok: false, error: 'taId is not in the TITLES-ADMIN collection.' }, 404);
    const fields = (schema && schema.fields) || [];
    const isRef = f => (f.type === 'Reference' || f.type === 'MultiReference');
    let owners;
    if (Array.isArray(cfg.sectionsOwnerFields) && cfg.sectionsOwnerFields.length) {
      owners = cfg.sectionsOwnerFields.map(slug => fields.find(f => f.slug === slug) || { slug, displayName: null, type: null });
      owners.filter(f => !f.type).forEach(f => run.warn('IX_CONFIG.sectionsOwnerFields names "' + f.slug + '", which SECTIONS does not have.'));
      owners = owners.filter(f => f.type);
    } else {
      owners = fields.filter(f => isRef(f) && f.validations && f.validations.collectionId === C.titles);
    }
    if (!owners.length) return out({ ok: false, error: 'SECTIONS has no Reference field pointing at TITLES-ADMIN, so ownership cannot be read. Set IX_CONFIG.sectionsOwnerFields.', meta: run.meta(null) }, 500);
    if (owners.length > 1) run.warn('SECTIONS has ' + owners.length + ' title fields (' + owners.map(f => f.slug).join(', ') +
      '). A row belongs to a title when any of them names it, and is shared only when all are blank.');
    const J = JOIN.sections, maps = optionMaps(schema);
    // v1.0.48 — the row's publisher, found from the schema, and this title's.
    const pubFields = /^[0-9a-f]{24}$/.test(C.publishers || '')
      ? fields.filter(f => isRef(f) && f.validations && f.validations.collectionId === C.publishers) : [];
    if (!pubFields.length) run.warn('SECTIONS has no Reference field pointing at PUBLISHERS; a row with no title is shared by every title on the platform.');
    const myPub = refId(((byId(titles, taId) || {}).fieldData || {})[JOIN.title.publisher]);
    if (pubFields.length && !myPub) run.warn('This title has no ' + JOIN.title.publisher + '; SECTIONS rows are not filtered by publisher.');
    // v1.0.50 — the old newsletter page's Product Library and MNLS, from the Section.
    const legacy = { productField: null, mnlsField: null };
    let prodBy = new Map(), mnlsBy = new Map(), mnlsSlug = null;
    if (/^[0-9a-f]{24}$/.test(C.franchises || '')) {
      let pf;
      if (cfg.sectionsProductField) {
        pf = fields.filter(f => f.slug === cfg.sectionsProductField);
        if (!pf.length) run.warn('IX_CONFIG.sectionsProductField names "' + cfg.sectionsProductField + '", which SECTIONS does not have.');
      } else {
        pf = fields.filter(f => isRef(f) && f.validations && f.validations.collectionId === C.franchises);
      }
      if (pf.length > 1) run.warn('SECTIONS has ' + pf.length + ' fields pointing at PRODUCT LIBRARY (' + pf.map(f => f.slug).join(', ') + '); using ' + pf[0].slug + '.');
      if (pf.length) {
        legacy.productField = pf[0].slug;
        const [plRows, plSchema] = await Promise.all([run.cachedList('franchises', C.franchises), run.cachedSchema('franchises', C.franchises)]);
        plRows.forEach(r => prodBy.set(r.id, r));
        const mf = ((plSchema && plSchema.fields) || []).find(f => f.slug === JOIN.franchise.mnls && isRef(f));
        const mColl = mf && mf.validations && mf.validations.collectionId;
        if (!mf) run.warn('PRODUCT LIBRARY has no Reference field "' + JOIN.franchise.mnls + '"; MNLS cannot be filled from a Section.');
        else if (!/^[0-9a-f]{24}$/.test(mColl || '')) run.warn('PRODUCT LIBRARY "' + JOIN.franchise.mnls + '" does not say which collection it points at; MNLS cannot be named.');
        else {
          legacy.mnlsField = mf.slug; mnlsSlug = mf.slug;
          (await run.cachedList('mnls', mColl)).forEach(r => mnlsBy.set(r.id, r));
        }
      } else {
        run.warn('SECTIONS has no reference to PRODUCT LIBRARY yet, so the Article form cannot fill Product Library and MNLS from a Section.');
      }
    } else {
      run.warn('IX_CONFIG.collections has no franchises (PRODUCT LIBRARY) id; Product Library and MNLS are not filled from a Section.');
    }
    const nameOf = (by, id) => { const r = id && by.get(id); return r ? { id, name: String((r.fieldData || {}).name || id) } : (id ? { id, name: id } : null); };
    const legacyOf = f => {                                                             // v1.0.50
      if (!legacy.productField) return { product: null, mnls: null };
      const pid = refId(Array.isArray(f[legacy.productField]) ? f[legacy.productField][0] : f[legacy.productField]);
      const prow = pid && prodBy.get(pid);
      if (pid && !prow) run.warn('SECTIONS row "' + (f.name || '') + '" points at a PRODUCT LIBRARY row that is not live (' + pid + ').');
      const mv = prow && mnlsSlug ? (prow.fieldData || {})[mnlsSlug] : null;
      const mid = refId(Array.isArray(mv) ? mv[0] : mv);
      return { product: nameOf(prodBy, pid), mnls: nameOf(mnlsBy, mid) };
    };
    const items = rows.filter(r => !r.isArchived && !r.isDraft).map(r => {
      const f = r.fieldData || {};
      const ids = [];
      owners.forEach(o => refIds(f[o.slug]).forEach(id => { if (!ids.includes(id)) ids.push(id); }));
      if (ids.length && !ids.includes(taId)) return null;
      const pubs = [];
      pubFields.forEach(o => refIds(f[o.slug]).forEach(id => { if (!pubs.includes(id)) pubs.push(id); }));
      if (myPub && pubs.length && !pubs.includes(myPub)) return null;                     // v1.0.48
      if (!ids.length && !pubs.length) run.warn('SECTIONS row "' + (f.name || r.id) + '" has no title and no publisher, so every title on the platform sees it.');
      const p = f[J.position];
      return { id: r.id, name: String(f.name || ''), slug: String(f.slug || r.slug || '') || null,
               position: (p == null || p === '' || isNaN(Number(p))) ? null : Number(p),
               status: (J.status in f) ? (optName(maps, J.status, f[J.status]) || null) : null,
               shared: ids.length === 0,
               blockType: firstWord(optName(maps, J.type, f[J.type])).toUpperCase() || null,   // v1.0.48
               ...legacyOf(f) };                                                                // v1.0.50
    }).filter(Boolean).sort((a, b) => {
      if (a.position !== b.position) {
        if (a.position == null) return 1;
        if (b.position == null) return -1;
        return a.position - b.position;
      }
      return a.name.localeCompare(b.name);
    });
    return out({ ok: true, taId, ownerFields: owners.map(f => ({ slug: f.slug, name: f.displayName || null, type: f.type })),
                 legacy, items, meta: run.meta(items.length) }, 200);
  } catch (e) {
    return out({ ok: false, error: (e && e.message) || String(e), meta: run.meta(null) }, (e && e.status) || 502);
  }
}

// v1.0.29 — the Publish tab (steps 1 to 3), from the NEWSLETTER items the
// Splash tile already read, plus the title's send settings. Never throws.
const PUB_KEYS = ['subject', 'preview', 'volume', 'sendAt', 'sectors', 'issueDate', 'authorizedAt',
  'greetTitle', 'greetPara', 'greetShort', 'closing', 'ogImage', 'archiveImage', 'stepState', 'status'];
const PUB_STATUS_LABELS = { draft: 'Draft', readyToPublish: 'Ready to Publish',
  publishNextAsCurrent: 'Publish Next as Current' };   // v1.0.32, HC-P-S7-16
async function publishBoardOf(run, sb, ta, weatherInPlan) {
  const P = JOIN.publish, C = run.cfg.collections;
  const fields = {}, types = {}, statusIds = { draft: null, readyToPublish: null, publishNextAsCurrent: null };
  PUB_KEYS.forEach(k => { fields[k] = P[k]; types[k] = null; });
  const newsletters = ((sb && sb.newsletters) || []).map(n => {
    const e = n._pub || { slug: null, values: {} }; delete n._pub;
    return { id: n.id, name: n.name, slug: e.slug, values: e.values };
  });
  const tf = (ta && ta.fieldData) || {};
  const tv = k => { const v = tf[P.ta[k]]; return (v == null || String(v).trim() === '') ? null : String(v).trim(); };
  const title = { zips: tv('zips'), sectorsDefault: tv('sectorsDefault'),
                  has: { zips: P.ta.zips in tf, sectorsDefault: P.ta.sectorsDefault in tf } };
  let error = (sb && sb.error) || null;
  try {
    if (/^[0-9a-f]{24}$/.test(C.newsletter || '')) {
      const sch = await run.cachedSchema('NEWSLETTER', C.newsletter);
      const bySlug = {};
      ((sch && sch.fields) || []).forEach(f => { bySlug[f.slug] = f.type || null; });
      PUB_KEYS.forEach(k => {
        if (fields[k] in bySlug) types[k] = bySlug[fields[k]];
        else run.warn('NEWSLETTER has no field "' + fields[k] + '" (Publish, ' + k + ').');
      });
      // v1.0.32 — the status option ids, by label.
      const opts = optionMaps(sch)[P.status] || {};
      const want = Object.assign({}, PUB_STATUS_LABELS, run.cfg.publishStatusLabels || {});
      Object.keys(want).forEach(k => {
        const id = Object.keys(opts).find(o => keyOf(opts[o]) === keyOf(want[k])) || null;
        statusIds[k] = id;
        if (!id) run.warn('NEWSLETTER publishing-status has no option "' + want[k] + '" (Publish, ' + k + ').');
      });
    }
  } catch (e) { error = error || ('NEWSLETTER schema: ' + ((e && e.message) || e)); }
  // v1.0.41 — each newsletter's weather state, from the values Compile sends
  try {
    let days = null;
    const tokFile = String(tf[JOIN.title.tokens] || '').trim();
    if (tokFile && newsletters.length && weatherInPlan !== false) {
      const problems = [];
      const tok = await loadTokens(tokFile, problems);
      if (tok) days = tok['weather-days'];
      problems.forEach(p => run.warn('Weather tile: ' + p));
    }
    await Promise.all(newsletters.map(async n => {
      n.weather = weatherInPlan === false ? { state: 'off' }                // v1.0.42: no LW block, nothing fetched
        : await weatherStateOf(run.env, tf, n.values && n.values.issueDate, days);
    }));
  } catch (e) { newsletters.forEach(n => { if (!n.weather) n.weather = { state: 'unknown', error: (e && e.message) || String(e) }; }); }
  const V = run.cfg.vendor || {};                                         // v1.0.30
  const vendor = { email: V.email ? String(V.email) : null, name: V.name ? String(V.name) : null, signoff: V.signoff ? String(V.signoff) : null };
  if (!vendor.email) run.warn('IX_CONFIG.vendor.email is not set, so Submit to Vendor has no address.');
  return { fields, types, statusIds, title, newsletters, vendor, error };
}

// v1.0.27 — the Splash tile: this plan's NEWSLETTER(s), what each shows
// now, and the title's house splash. Never throws: a failure is
// answered as error, so the banner slots still load.
function houseSplashOf(ads, titleId, o) {
  if (!o.houseKindSplash || !titleId) return null;
  const J = JOIN.ad;
  const houses = (ads || []).filter(a => {
    const f = a.fieldData || {};
    return !a.isDraft && !a.isArchived && f[J.houseKind] === o.houseKindSplash &&
      refIds(f[J.titles]).includes(titleId) && String(f[J.splashLink] || '');
  }).sort((a, b) => String(b.lastUpdated || '').localeCompare(String(a.lastUpdated || '')));
  return houses.length ? houses[0] : null;
}

async function splashBoardOf(run, planId, ads, taId) {
  const C = run.cfg.collections, o = run.cfg.options || {};
  const S = JOIN.splash;
  const fields = { image: S.paidAd, go: S.paidGo, name: S.paidName };
  const h = houseSplashOf(ads, taId, o);
  const hf = (h && h.fieldData) || {};
  const house = h ? { id: h.id, name: String(hf.name || ''), image: String(hf[JOIN.ad.splashLink] || ''),
                      image2: String(hf[JOIN.ad.splashLink2] || '') || null,
                      go: String(hf[JOIN.ad.redirectLink] || '') || null } : null;
  if (!o.houseKindSplash) run.warn('IX_CONFIG.options.houseKindSplash is not set, so the Splash tile cannot name the house splash.');
  if (!/^[0-9a-f]{24}$/.test(C.newsletter || '')) {
    return { newsletters: [], house, fields, error: 'IX_CONFIG.collections.newsletter is not set.' };
  }
  try {
    const mine = list => (list || []).filter(n => refId((n.fieldData || {})[JOIN.newsletter.plan]) === planId);
    let found = mine(await run.cachedList('newsletter', C.newsletter));
    if (!found.length && !run.fresh) found = mine(await run.listAll(C.newsletter));
    const items = (await Promise.all(found.map(n => run.getItem('NEWSLETTER', C.newsletter, n.id)))).filter(Boolean);
    const newsletters = items.map(n => {
      const f = n.fieldData || {};
      const current = { image: String(f[S.paidAd] || '').trim() || null,
                        go: String(f[S.paidGo] || '').trim() || null,
                        name: String(f[S.paidName] || '').trim() || null };
      const P = JOIN.publish, vals = {};                                      // v1.0.29
      PUB_KEYS.forEach(k => { const v = f[P[k]]; vals[k] = (v == null || v === '') ? null : (typeof v === 'object' ? (v.url || null) : String(v)); });
      return { id: n.id, name: String(f.name || ''), current,
               source: current.image ? 'paid' : (house ? 'house' : 'none'),
               _pub: { slug: String(n.slug || f.slug || '') || null, values: vals } };
    }).sort((a, b) => a.name.localeCompare(b.name));
    return { newsletters, house, fields, error: null };
  } catch (e) {
    return { newsletters: [], house, fields, error: (e && e.message) || String(e) };
  }
}

// v1.0.25 — the title's ads for the Revenue tab. Draft and archived items
// are left out; everything else is answered with its labels, so the page
// can sort and show status without knowing any option id.
function adPoolOf(run, ads, adSchema, taId, custName) {
  if (!taId) return [];
  const maps = optionMaps(adSchema);
  const J = JOIN.ad;
  const pool = (ads || [])
    .filter(a => !a.isDraft && !a.isArchived)
    .filter(a => refIds((a.fieldData || {})[J.titles]).includes(taId))
    .map(a => {
      const f = a.fieldData || {};
      const custId = refId(Array.isArray(f[J.customer]) ? f[J.customer][0] : f[J.customer]);
      const houseKind = optName(maps, J.houseKind, f[J.houseKind]) || null;
      return {
        id: a.id,
        name: String(f.name || ''),
        customerId: custId || null,
        customer: custId ? custName(custId) : null,
        type: optName(maps, J.type, f[J.type]) || null,
        status: optName(maps, J.status, f[J.status]) || null,
        houseKind,
        house: !!houseKind,
        banner: String(f[J.bannerLink] || '').trim() || null,
        splash: String(f[J.splashLink] || '').trim() || null,     // v1.0.27
        redirect: String(f[J.redirectLink] || '').trim() || null,
      };
    });
  pool.sort((x, y) => String(x.customer || '\uffff').localeCompare(String(y.customer || '\uffff')) ||
                      x.name.localeCompare(y.name));
  if (!pool.length) run.warn('No live ADS item names this plan\'s title, so the Revenue tab has no ads to offer.');
  return pool;
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
    const hasAlloc = /^[0-9a-f]{24}$/.test(C.allocations || '');   // v1.0.17
    const [rows, schema, allocSchema] = await Promise.all([
      run.cachedList('plans', C.plan),
      run.cachedSchema('plan', C.plan),
      hasAlloc ? run.cachedSchema('allocations', C.allocations) : Promise.resolve(null),
    ]);
    if (!hasAlloc) run.warn('IX_CONFIG.collections.allocations is not set, so the section types are not checked against ALLOCATIONS.');
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
    const isLocked = lockedTest(run, cfg, maps);   // v1.0.16
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
          locked: isLocked(status),                  // v1.0.16
        };
      })
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || b.name.localeCompare(a.name));
    const sec = sectionsOf(run, cfg.sections, cfg.assetTypes || {}, allocSchema ? optionMaps(allocSchema) : {});   // v1.0.17
    return out({ ok: true, plans, sections: sec.list, loosePositionFrom: Number(cfg.loosePositionFrom), meta: run.meta(plans.length) }, 200);
  } catch (e) {
    return out({ ok: false, error: (e && e.message) || String(e), meta: run.meta(null) }, (e && e.status) || 502);
  }
}

// v1.0.20 — the print item(s) an article was built from.
async function articlePrintRoute(env, ctx, url, request) {
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
  if (!allowed.length) return out({ ok: false, error: 'IX_CONFIG.allowedOrigins is not set, so /article-print answers no one.' }, 403);
  if (!ok) return out({ ok: false, error: 'This origin may not call /article-print.' }, 403);
  if (!env.WEBFLOW_TOKEN) return out({ ok: false, error: 'WEBFLOW_TOKEN is not set on this Worker.' }, 500);
  const C = cfg.collections || {};
  if (!/^[0-9a-f]{24}$/.test(C.allocations || '')) return out({ ok: false, error: 'IX_CONFIG.collections is missing: allocations.' }, 500);
  const articleId = (url.searchParams.get('articleId') || '').trim();
  if (!/^[0-9a-f]{24}$/.test(articleId)) return out({ ok: false, error: 'Missing or malformed articleId.' }, 400);
  const run = new Run(env, ctx, cfg, url.searchParams.get('fresh') === '1');
  try {
    const A = JOIN.alloc;
    const rows = await run.listAll(C.allocations);
    const items = rows
      .filter(a => refId((a.fieldData || {})[A.article]) === articleId)
      .map(a => {
        const fd = a.fieldData || {};
        return {
          allocationId: a.id,
          printTitle: String(fd[A.printTitle] || fd.name || ''),
          section: String(fd[A.section] || ''),
          page: fd[A.page] == null ? null : num(fd[A.page]),
          pdfPage: fd[A.pdfPage] == null ? null : num(fd[A.pdfPage]),
          pdfUrl: String(fd[A.pdfUrl] || ''),
          issueName: String(fd[A.issueName] || '').trim(),
          issuePages: fd[A.issuePages] == null ? null : (num(fd[A.issuePages]) || null),
          byline: String(fd[A.byline] || '').trim(),
          _at: String(a.lastUpdated || a.createdOn || ''),
        };
      })
      .sort((x, y) => y._at.localeCompare(x._at))
      .map(x => { delete x._at; return x; });
    return out({ ok: true, items, meta: run.meta(items.length) }, 200);
  } catch (e) {
    return out({ ok: false, error: (e && e.message) || String(e), meta: run.meta(null) }, (e && e.status) || 502);
  }
}

// v1.0.16 — the one section list (S6 ruling 1). Checked against
// IX_CONFIG.assetTypes and the ALLOCATIONS type options; never guessed.
function sectionsOf(run, raw, assetTypes, allocOpts) {
  if (!Array.isArray(raw)) {
    run.warn('IX_CONFIG.sections is not set, so no allocation has a section (sectionKey is null).');
    return { list: null, keyFor: () => null };
  }
  const assetKeys = new Set(Object.values(assetTypes || {}));
  const allocTypeKeys = new Set(Object.values(allocOpts[JOIN.alloc.type] || {}).map(keyOf));
  const list = [], seen = new Set(), owner = new Map(), twice = new Set();
  raw.forEach((s, i) => {
    const key = keyOf(s && s.key);
    if (!key) { run.warn('IX_CONFIG.sections entry ' + (i + 1) + ' has no key; it is left out.'); return; }
    if (seen.has(key)) { run.warn('IX_CONFIG.sections has the key "' + key + '" twice; the second is left out.'); return; }
    seen.add(key);
    const assetType = String((s && s.assetType) || '');
    if (assetType && assetKeys.size && !assetKeys.has(assetType)) run.warn('IX_CONFIG.sections "' + key + '" names asset type "' + assetType + '", which is not in IX_CONFIG.assetTypes.');
    const types = (Array.isArray(s.allocationTypes) ? s.allocationTypes : []).map(keyOf).filter(Boolean);
    types.forEach(t => {
      if (allocTypeKeys.size && !allocTypeKeys.has(t)) run.warn('IX_CONFIG.sections "' + key + '" names allocation type "' + t + '", which is not an ALLOCATIONS type option.');
      if (owner.has(t) && owner.get(t) !== key) twice.add(t); else owner.set(t, key);
    });
    list.push({ key, label: String((s && s.label) || key), assetType: assetType || null, allocationTypes: types });
  });
  twice.forEach(t => run.warn('IX_CONFIG.sections puts allocation type "' + t + '" in more than one section; those rows answer sectionKey null.'));
  return { list, keyFor: t => (t && owner.has(t) && !twice.has(t)) ? owner.get(t) : null };
}

// v1.0.16 — a plan is locked when its planning-status is one of
// IX_CONFIG.lockedPlanStatuses (S6 ruling 4). null when the key is not set.
function lockedTest(run, cfg, planMaps) {
  const P = JOIN.planBoard;
  if (!Array.isArray(cfg.lockedPlanStatuses)) {
    run.warn('IX_CONFIG.lockedPlanStatuses is not set, so no plan is marked locked (locked is null).');
    return () => null;
  }
  const names = new Set(Object.values(planMaps[P.status] || {}));
  const set = new Set(cfg.lockedPlanStatuses.map(String));
  set.forEach(n => { if (names.size && !names.has(n)) run.warn('IX_CONFIG.lockedPlanStatuses names "' + n + '", which is not a ' + P.status + ' option.'); });
  return status => !!status && set.has(status);
}

// v1.0.43 — the block catalog (IX_CONFIG.catalog), checked. See the header.
const CAT_SIDES = ['editorial', 'revenue', 'fixed'];          // HC-P-BC-1
const CAT_CONTENT = ['none', 'one', 'list'];                  // HC-P-BC-1
const CAT_PER = ['one', 'many'];                              // HC-P-BC-1
function catalogOf(run, cfg, writeIds) {
  const raw = cfg.catalog;
  if (!Array.isArray(raw)) {
    run.warn('IX_CONFIG.catalog is not set, so no page can read the block catalog (catalog is null).');
    return null;
  }
  const out = [], keys = new Set(), owner = new Map(), dlOwner = new Map();
  raw.forEach((e, i) => {
    const at = 'IX_CONFIG.catalog entry ' + (i + 1);
    if (!e || typeof e !== 'object') { run.warn(at + ' is not an object; it is left out.'); return; }
    const key = keyOf(e.key);
    if (!key) { run.warn(at + ' has no key; it is left out.'); return; }
    const where = 'IX_CONFIG.catalog "' + key + '"';
    if (keys.has(key)) { run.warn(where + ' appears twice; the second is left out.'); return; }
    const bad = [];
    const side = String(e.side || '');
    if (!CAT_SIDES.includes(side)) bad.push('side "' + side + '" is not ' + CAT_SIDES.join(', '));
    const content = String(e.content || '');
    if (!CAT_CONTENT.includes(content)) bad.push('content "' + content + '" is not ' + CAT_CONTENT.join(', '));
    const perIssue = String(e.perIssue || '');
    if (!CAT_PER.includes(perIssue)) bad.push('perIssue "' + perIssue + '" is not ' + CAT_PER.join(', '));
    if (typeof e.controller !== 'boolean') bad.push('controller is not true or false');
    const blocks = e.blocks !== false;                                   // v1.0.44
    const labels = (Array.isArray(e.labels) ? e.labels : []).map(l => String(l || '').trim()).filter(Boolean);
    if (blocks && !labels.length) bad.push('labels is empty');
    if (!blocks && labels.length) bad.push('blocks is false but it names labels');
    labels.forEach(l => { if (!writeIds.blockType[l]) bad.push('label "' + l + '" has no option id in IX_CONFIG.blockTypes'); });
    const add = String(e.add == null ? '' : e.add).trim();
    if (add && !labels.includes(add)) bad.push('add "' + add + '" is not one of its labels');
    const assetType = String(e.assetType || '').trim();
    if (blocks && !writeIds.assetType[assetType]) bad.push('assetType "' + assetType + '" has no option id in IX_CONFIG.assetTypes');
    if (bad.length) { run.warn(where + ': ' + bad.join('; ') + '. It is left out.'); return; }
    keys.add(key);
    const mine = labels.filter(l => {
      if (owner.has(l)) { run.warn(where + ' names label "' + l + '", which "' + owner.get(l) + '" already covers; it stays with "' + owner.get(l) + '".'); return false; }
      owner.set(l, key); return true;
    });
    const dl = (Array.isArray(e.defaultLayout) ? e.defaultLayout : []).map(n => String(n || '').trim()).filter(Boolean).filter(n => {
      if (dlOwner.has(n)) { run.warn(where + ' names Default Layout "' + n + '", which "' + dlOwner.get(n) + '" already has; it stays with "' + dlOwner.get(n) + '".'); return false; }
      dlOwner.set(n, key); return true;
    });
    out.push({ key, name: String(e.name || '').trim() || key, side, controller: e.controller, blocks,
               labels: mine, add, assetType, content, perIssue, defaultLayout: dl });
  });
  Object.keys(writeIds.blockType).forEach(l => {
    if (!owner.has(l)) run.warn('Block type "' + l + '" is in IX_CONFIG.blockTypes but no IX_CONFIG.catalog entry covers it, so no page offers it.');
  });
  return out;
}

// v1.0.43 — the catalog with this plan's blocks counted against it.
function catalogBoardOf(run, cfg, writeIds, slots, designs, ta, sectionNameOf) {
  const cat = catalogOf(run, cfg, writeIds);
  if (!cat) return null;
  const born = {};
  cat.forEach(e => { if (e.add && e.controller) born[e.key] = { assetType: e.assetType, blockType: e.add }; });   // only what a tick creates
  withDesigns(run, born, designs, ta);
  const covered = new Set();
  const out = cat.map(e => {
    if (!e.blocks) return Object.assign({}, e, { sectionName: null, design: null, plan: null });   // v1.0.44
    const mine = slots.filter(s => s.blockType
      ? e.labels.includes(s.blockType)
      : (e.add === '' && s.assetType === e.assetType));
    mine.forEach(s => covered.add(s.id));
    const filled = mine.filter(s => !!s.asset || (s.listCount || 0) > 0 || !!s.allocation ||
      (s.greeting && !!(s.greeting.title.trim() || s.greeting.paragraph.trim() || s.greeting.supershort.trim())));
    let sectionName = null;
    for (const l of e.labels) { sectionName = sectionNameOf(l); if (sectionName) break; }
    const b = born[e.key];
    return Object.assign({}, e, {
      sectionName,
      design: (b && b.designId) ? { id: b.designId, name: b.designName } : null,
      plan: { blockIds: mine.map(s => s.id), count: mine.length, filledIds: filled.map(s => s.id), ticked: mine.length > 0 },
    });
  });
  slots.forEach(s => {
    if (!covered.has(s.id)) run.warn('Block ' + s.id + ' (position ' + s.position + ', type "' + (s.blockType || 'none') +
      '", asset type "' + (s.assetType || 'none') + '") is in no IX_CONFIG.catalog entry, so the Content Controller cannot count it.');
  });
  return out;
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

// v1.0.21 — the design a typed Add slot is born with. See the header.
// v1.0.22 — the design each block type is born with, for Scenario 126.
async function blockDesignsRoute(env, ctx, url, request) {
  if (!env.IX_KEY) return fail(500, 'IX_KEY is not set on this Worker.');
  if (request.headers.get('X-IX-Key') !== env.IX_KEY) return fail(401, 'Missing or wrong X-IX-Key header.');
  if (!env.WEBFLOW_TOKEN) return fail(500, 'WEBFLOW_TOKEN is not set on this Worker.');
  let cfg;
  try { cfg = JSON.parse(env.IX_CONFIG || ''); }
  catch (e) { return fail(500, 'IX_CONFIG is missing or is not valid JSON.'); }
  const C = cfg.collections || {};
  if (!/^[0-9a-f]{24}$/.test(C.titles || '')) return fail(500, 'IX_CONFIG.collections is missing: titles.');
  const taId = (url.searchParams.get('taId') || '').trim();
  if (!/^[0-9a-f]{24}$/.test(taId)) return fail(400, 'Missing or malformed taId.');
  const run = new Run(env, ctx, cfg, url.searchParams.get('fresh') === '1');
  try {
    const [titles, designs] = await Promise.all([
      run.cachedList('titles', C.titles),
      /^[0-9a-f]{24}$/.test(C.designs || '') ? run.cachedList('designs', C.designs) : Promise.resolve(null),
    ]);
    const ta = byId(titles, taId);
    if (!ta) return fail(404, 'taId is not in the TITLES-ADMIN collection.');
    const blockTypes = cfg.blockTypes || {};
    if (!Object.keys(blockTypes).length) run.warn('IX_CONFIG.blockTypes is missing; no block type can be answered.');
    // One pseudo Add entry per block type, so the lookup is exactly v1.0.21's.
    const asks = {};
    Object.keys(blockTypes).forEach(hash => {
      const label = String(blockTypes[hash] || '').trim();
      if (label && !asks[label]) asks[label] = { assetType: null, blockType: label, hash };
    });
    withDesigns(run, asks, designs, ta);
    const byHash = {}, byType = {};
    Object.keys(blockTypes).forEach(hash => {
      const a = asks[String(blockTypes[hash] || '').trim()];
      if (!a) return;
      byType[a.blockType] = a.designId ? { id: a.designId, name: a.designName } : null;
      if (a.designId) byHash[hash] = a.designId;
    });
    return json({ ok: true, taId, byHash, byType, meta: run.meta(Object.keys(byHash).length) }, 200);
  } catch (e) {
    return json({ ok: false, error: (e && e.message) || String(e), meta: run.meta(null) },
      (e && e.status) || 502);
  }
}

// ── Clone (v1.0.23) ─────────────────────────────────────────

const CLONE_DEFAULTS = {
  dropFields: ['slug', 'self-nlb-item-id', 'asset-allocation-id'],
  ackField: 'needs-approval',
  ackPending: 'yes',
  eventLastDate: ['event-end', 'event-start'],
  stageName: 'planning',
  editionClear: ['asset-ad', 'asset-ad-sponsor', 'paid-by-customer', 'asset-event', 'asset-re',
    'block-greeting-title', 'block-greeting-paragraph', 'block-greeting-supershort'],   // v1.0.31
  editionClearLists: ['evEvents', 'reListings', 'txaAds'],                              // v1.0.31
};
function cloneCfg(cfg) {
  const c = (cfg && cfg.clone && typeof cfg.clone === 'object') ? cfg.clone : {};
  return {
    dropFields: Array.isArray(c.dropFields) ? c.dropFields : CLONE_DEFAULTS.dropFields,
    ackField: String(c.ackField || CLONE_DEFAULTS.ackField),
    ackPending: String(c.ackPending || CLONE_DEFAULTS.ackPending),
    stageName: String(c.stageName || CLONE_DEFAULTS.stageName),
    eventLastDate: Array.isArray(c.eventLastDate) && c.eventLastDate.length ? c.eventLastDate : CLONE_DEFAULTS.eventLastDate,
    editionClear: Array.isArray(c.editionClear) ? c.editionClear : CLONE_DEFAULTS.editionClear,
    editionClearLists: Array.isArray(c.editionClearLists) ? c.editionClearLists : CLONE_DEFAULTS.editionClearLists,
  };
}
const NEW_PLAN = '__NEWPLAN__', NEW_NL = '__NEWNL__';

async function cloneRowsRoute(env, ctx, url, request) {
  if (!env.IX_KEY) return fail(500, 'IX_KEY is not set on this Worker.');
  if (request.headers.get('X-IX-Key') !== env.IX_KEY) return fail(401, 'Missing or wrong X-IX-Key header.');
  if (!env.WEBFLOW_TOKEN) return fail(500, 'WEBFLOW_TOKEN is not set on this Worker.');
  let cfg;
  try { cfg = JSON.parse(env.IX_CONFIG || ''); }
  catch (e) { return fail(500, 'IX_CONFIG is missing or is not valid JSON.'); }
  const C = cfg.collections || {};
  const missing = ['plan', 'blocks', 'events'].filter(k => !/^[0-9a-f]{24}$/.test(C[k] || ''));
  if (missing.length) return fail(500, 'IX_CONFIG.collections is missing: ' + missing.join(', ') + '.');

  const sourcePlanId = (url.searchParams.get('sourcePlanId') || '').trim();
  if (!sourcePlanId) return json({ ok: true, mode: 'add', rowCount: 0 }, 200);
  if (!/^[0-9a-f]{24}$/.test(sourcePlanId)) return fail(400, 'Malformed sourcePlanId.');
  const newName = (url.searchParams.get('newName') || '').trim();
  if (!newName) return fail(400, 'Missing newName.');
  const newDate = String(url.searchParams.get('newDate') || '').trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return fail(400, 'Missing or malformed newDate (YYYY-MM-DD first).');

  const newPlanId = (url.searchParams.get('newPlanId') || '').trim();   // v1.0.24
  const newNlId = (url.searchParams.get('newNlId') || '').trim();
  if (newPlanId && !/^[0-9a-f]{24}$/.test(newPlanId)) return fail(400, 'Malformed newPlanId.');
  if (newNlId && !/^[0-9a-f]{24}$/.test(newNlId)) return fail(400, 'Malformed newNlId.');

  const run = new Run(env, ctx, cfg, true);   // a clone always reads fresh
  try {
    const edition = url.searchParams.get('edition') === '1';   // v1.0.31
    const out = await buildClone(run, sourcePlanId, newName, newDate, newPlanId || NEW_PLAN, newNlId || NEW_NL, edition);
    return json(Object.assign({ ok: true, mode: edition ? 'edition' : 'clone' }, out, { meta: run.meta(out.rowCount) }), 200);
  } catch (e) {
    return json({ ok: false, mode: 'clone', error: (e && e.message) || String(e), meta: run.meta(null) },
      (e && e.status) || 502);
  }
}

async function buildClone(run, sourcePlanId, newName, newDate, planRef, nlRef, edition) {
  const C = run.cfg.collections, B = JOIN.block;
  const cc = cloneCfg(run.cfg);
  const assetTypes = run.cfg.assetTypes || {};
  const blockTypes = run.cfg.blockTypes || {};
  const [plan, blocksAll, blockSchema] = await Promise.all([
    run.getItem('PUBLICATION PLAN', C.plan, sourcePlanId),
    run.listAll(C.blocks),
    run.cachedSchema('blocks', C.blocks),
  ]);
  if (!plan) throw httpErr(404, 'sourcePlanId is not in the PUBLICATION PLAN collection.');
  const slugs = new Set(((blockSchema && blockSchema.fields) || []).map(f => f.slug));
  const hasAck = slugs.has(cc.ackField);
  // The new issue is being planned, whatever stage the source reached.
  const stageOpts = optionMaps(blockSchema).stage || {};
  const stageId = Object.keys(stageOpts).find(id => keyOf(stageOpts[id]) === keyOf(cc.stageName)) || null;
  if (!stageId) run.warn('NL-BLOCKS stage has no option named "' + cc.stageName + '"; cloned rows keep the source stage.');
  if (!hasAck) run.warn('NL-BLOCKS has no field "' + cc.ackField + '"; cloned ads are not marked for acknowledgement.');

  const rows = blocksAll
    .filter(b => refId((b.fieldData || {})[B.plan]) === sourcePlanId)
    .sort((a, b) => num(a.fieldData.position) - num(b.fieldData.position));

  // Every event any row names, read by id, fresh.
  const parsed = rows.map(b => parseDJ((b.fieldData || {})[B.designJson], 'block ' + b.id, run));
  const evIds = new Set();
  rows.forEach((b, i) => eventIdsFor(b.fieldData || {}, parsed[i]).forEach(id => evIds.add(id)));
  const events = edition ? new Map() : await run.getMany('EVENTS', C.events, [...evIds]);
  const lastDateOf = ev => {
    const fd = (ev && ev.fieldData) || {};
    for (const f of cc.eventLastDate) { const v = String(fd[f] || '').trim(); if (v) return v.slice(0, 10); }
    return '';
  };
  const ended = id => { const ev = events.get(id); const d = ev ? lastDateOf(ev) : '';
    return d ? d < newDate : false; };

  const dropped = [], undated = [], summary = [], ops = [];
  let ackCount = 0;
  rows.forEach((b, i) => {
    const src = b.fieldData || {};
    const pos = num(src.position);
    const fd = {};
    Object.keys(src).forEach(k => { if (!cc.dropFields.includes(k)) fd[k] = src[k]; });
    fd.name = newName + '-b' + (src.position == null ? pos : src.position);
    fd[B.plan] = planRef;
    if (refId(src.newsletter)) fd.newsletter = nlRef;
    if (stageId) fd.stage = stageId;
    delete fd[cc.ackField];

    // v1.0.31 — an edition keeps the issue's articles and layout only.
    if (edition) {
      cc.editionClear.forEach(k => { delete fd[k]; });
      const dj = parsed[i];
      if (dj && Object.keys(dj).length) {
        const kept = Object.assign({}, dj);
        cc.editionClearLists.forEach(k => { delete kept[k]; });
        fd[B.designJson] = JSON.stringify(kept);
      }
      summary.push({ position: pos, blockType: blockTypes[String(src[B.type] || '')] || null,
        assetType: assetTypes[String(src[B.assetType] || '')] || null, needsAck: false, droppedEvents: 0 });
      ops.push({ position: pos, body: JSON.stringify({ isArchived: false, isDraft: true, fieldData: fd }) });
      return;
    }

    // Ended events stay behind.
    let gone = 0;
    const ids = eventIdsFor(src, parsed[i]);
    ids.forEach(id => {
      const ev = events.get(id);
      if (ev && !lastDateOf(ev)) undated.push({ position: pos, eventId: id, name: String((ev.fieldData || {}).name || '') });
      if (ended(id)) { gone++; dropped.push({ position: pos, eventId: id,
        name: String(((ev && ev.fieldData) || {}).name || ''), lastDate: lastDateOf(ev) }); }
    });
    if (gone) {
      const dj = parsed[i];
      if (dj && (Array.isArray(dj.evEvents) || typeof dj.evEvents === 'string')) {
        const keep = idList(dj.evEvents).filter(id => !ended(id));
        fd[B.designJson] = JSON.stringify(Object.assign({}, dj, { evEvents: keep }));
      }
      const single = refIds(src[B.events]).filter(id => !ended(id));
      if (refIds(src[B.events]).length) {
        if (single.length) fd[B.events] = Array.isArray(src[B.events]) ? single : single[0];
        else delete fd[B.events];
      }
    }

    const holdsAd = !!(refId(src[B.ad]) || refId(src[B.sponsor]));
    if (holdsAd && hasAck) { fd[cc.ackField] = cc.ackPending; ackCount++; }

    summary.push({ position: pos, blockType: blockTypes[String(src[B.type] || '')] || null,
      assetType: assetTypes[String(src[B.assetType] || '')] || null,
      needsAck: holdsAd && hasAck, droppedEvents: gone });
    ops.push({ position: pos, body: JSON.stringify({ isArchived: false, isDraft: true, fieldData: fd }) });
  });

  if (!rows.length) run.warn('The source issue has no NL-BLOCKS rows (a legacy issue?). Nothing to clone; use + Add a PubPlan.');
  const batch = JSON.stringify({ ops });
  return {
    sourcePlan: { id: plan.id, name: String((plan.fieldData || {}).name || ''),
                  date: (plan.fieldData || {})[JOIN.planBoard.date] || null },
    newName, newDate,
    rowCount: rows.length,
    rows: summary, dropped, undated, ackCount,
    planDesignJson: String((plan.fieldData || {})[JOIN.plan.designJson] || ''),
    batchLiteral: JSON.stringify(batch).slice(1, -1),
    // Ready to sit raw in a Make JSON body (Make cannot escape JSON).
    planDesignJsonQuoted: JSON.stringify(String((plan.fieldData || {})[JOIN.plan.designJson] || '')),
    droppedJson: JSON.stringify(dropped),
  };
}

function withDesigns(run, addTypes, designs, ta) {
  if (!addTypes) return addTypes;
  const D = JOIN.design;
  let tdj = null;
  if (ta) {
    const raw = String((ta.fieldData || {})[JOIN.title.designJson] || '').trim();
    if (raw) { try { tdj = JSON.parse(raw); } catch (e) { run.warn('The title\'s design-json is not valid JSON; Add uses no design override.'); } }
  }
  if (designs === null) run.warn('IX_CONFIG.collections.designs is not set, so new list slots get no design.');
  const rows = designs || [];
  const taId = ta ? ta.id : '';
  Object.keys(addTypes).forEach(key => {
    const at = addTypes[key];
    at.designId = null; at.designName = null;
    if (!at.blockType || !designs) return;
    const label = at.blockType;
    const set = (row) => { at.designId = row.id; at.designName = String((row.fieldData || {}).name || '').trim() || null; };
    // 1. The title's own override.
    const ov = tdj && tdj.types && tdj.types[label] && tdj.types[label].defaultDesign;
    if (ov) {
      const row = byId(rows, String(ov));
      if (row && !row.isArchived && !row.isDraft) { set(row); return; }
      run.warn('The title\'s design-json names defaultDesign ' + ov + ' for ' + label + ', which is not a live DESIGNS row; looking it up instead.');
    }
    // 2. The one row that passes 206's guard for this type.
    const needle = 'email-' + label.toLowerCase() + '-';
    const ok = rows.filter(r => {
      const fd = r.fieldData || {};
      if (r.isArchived || r.isDraft) return false;
      if (!String(fd[D.templateWeb] || '').trim()) return false;
      return String(fd[D.template] || '').toLowerCase().indexOf(needle) !== -1;
    });
    const mine = ok.filter(r => refIds((r.fieldData || {})[D.titles]).indexOf(taId) !== -1);
    const glob = ok.filter(r => !refIds((r.fieldData || {})[D.titles]).length);
    const pool = mine.length ? mine : glob;
    if (pool.length === 1) { set(pool[0]); return; }
    const names = pool.map(r => '"' + (String((r.fieldData || {}).name || '').trim() || r.id) + '"').join(', ');
    run.warn(pool.length
      ? 'More than one DESIGNS row fits block type ' + label + ' (' + names + '); new ' + label + ' slots get no design. Set types.' + label + '.defaultDesign in the title\'s design-json.'
      : 'No live DESIGNS row with a web template fits block type ' + label + ' for this title; new ' + label + ' slots get no design.');
  });
  return addTypes;
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

// ── The Compile pre-check facts (v1.0.33) ───────────────────
// Mirrors Scenario 206 v1.44's three tests. See the header.
function firstWord(name) { return String(name || '').trim().split(/[\s\u00b7]/)[0] || ''; }

function compileContext(run, cfg, blockOpts, designs, designSchema, lists) {
  const D = JOIN.design;
  const C = cfg.compile && typeof cfg.compile === 'object' ? cfg.compile : null;
  const arr = v => Array.isArray(v) ? v.map(x => String(x).trim()).filter(Boolean) : [];
  const heavy = C ? arr(C.heavy) : [], light = C ? arr(C.light) : [], notInEmail = C ? arr(C.notInEmail) : [];
  const codes = (C && C.codes && typeof C.codes === 'object') ? C.codes : {};
  const up = x => String(x).toUpperCase();
  const configured = !!C && (heavy.length + light.length) > 0;
  if (!configured) run.warn('IX_CONFIG.compile is not set (heavy and light lanes), so slots answer compile null.');
  const btNames = Object.values(blockOpts[JOIN.block.type] || {}).map(n => up(firstWord(n)));
  if (configured) heavy.concat(light, notInEmail).forEach(l => {
    if (!btNames.includes(up(l))) run.warn('IX_CONFIG.compile names "' + l + '", which is no NL-BLOCKS block-type option.');
  });
  const dOpts = optionMaps(designSchema);
  const hasDType = !!(designSchema && ((designSchema.fields || []).some(f => f.slug === D.type)));
  if (designs && designSchema && !hasDType) run.warn('DESIGNS has no field "' + D.type + '"; designs answer no label.');
  const designsBy = index(designs || []);
  const codeOf = label => String(codes[label] != null ? codes[label] : label).toLowerCase();
  const designInfo = id => {
    if (!id) return null;
    const d = designsBy.get(id);
    if (!d) return { id, missing: true };
    const f = d.fieldData || {};
    return { id, name: String(f.name || ''), label: hasDType ? (firstWord(optName(dOpts, D.type, f[D.type])) || null) : null,
             template: String(f[D.template] || '') || null, templateWeb: String(f[D.templateWeb] || '') || null,
             live: !d.isDraft && !d.isArchived, missing: false };
  };
  const designAudit = [];
  if (hasDType) (designs || []).forEach(d => {
    if (d.isArchived) return;
    const info = designInfo(d.id);
    if (!info.label || !info.template) return;
    if (!info.template.toLowerCase().includes('email-' + codeOf(info.label) + '-'))
      designAudit.push({ id: d.id, name: info.name, label: info.label, template: info.template });
  });
  return {
    configured, heavy, light, notInEmail, codeOf, designInfo, lists, blockOpts,
    laneOf(label) {
      const L = up(label);
      if (notInEmail.some(x => up(x) === L)) return 'not-email';
      if (heavy.some(x => up(x) === L)) return 'heavy';
      if (light.some(x => up(x) === L)) return 'light';
      return null;
    },
    summary() { return { configured, heavy, light, notInEmail, designAudit }; },
  };
}

// v1.0.46 — the first n words of a text, for review lines on Layout
function firstWords(v, n) {
  const w = String(v == null ? '' : v).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (!w.length) return null;
  return w.length > n ? w.slice(0, n).join(' ') + '\u2026' : w.join(' ');
}
function itemsOf(CX, assetType, ids) {
  const { events, reItems, adsBy } = CX.lists;
  return (ids || []).map(id => {
    const it = assetType === 'event' ? events.get(id) : assetType === 're' ? reItems.get(id) : adsBy.get(id);
    if (!it) return { id, missing: true };
    const f = it.fieldData || {};
    const o = { id, name: String(f.name || '') };
    if (assetType === 'event') { o.start = f[JOIN.event.start] || null; o.photo = !!String(f[JOIN.event.photo] || '').trim();
      o.thumb = f['event-hero-image-ulc-link-ev-1-only'] || f['event-image-url'] || null;                       // thumb v1.0.45
      const tz = CX.tz || ASM.tzDefault, st = f[JOIN.event.start];                                            // v1.0.46
      o.when = fmtDate(st, 'ddd, MMM D, YYYY', tz) || null;
      o.time = fmtDate(st, 'h:mm A', tz) || null;
      o.endTime = String(f['dt-end-time'] || '').trim() || null;
      const venue = String(f['event-location'] || '').trim() +
        (String(f['venue-room'] || '').trim() ? ', ' + String(f['venue-room']).trim() : '') +
        (String(f['event-city'] || '').trim() ? ' \u00b7 ' + String(f['event-city']).trim() : '') +
        (String(f['event-state'] || '').trim() ? ', ' + String(f['event-state']).trim() : '');
      o.venue = venue.replace(/^[,\s\u00b7]+/, '') || null;
      o.teaser = firstWords(f['event-description'], 24);
      o.hasLink = !!String(f['event-link'] || '').trim(); }
    if (assetType === 're') { o.photo = !!String(f[JOIN.re.photo] || '').trim(); o.mediaId = refId(f[JOIN.reMedia]) || null;   // mediaId v1.0.34
      o.thumb = f['property-image-link'] || null;                                                                 // thumb v1.0.45
      o.priceHidden = f['hide-price'] === true;                                                                   // v1.0.46
      o.price = (!o.priceHidden && num0(f['property-price']) > 0) ? '$' + fmtNumber0(f['property-price']) : null;
      o.beds = String(f.bedrooms == null ? '' : f.bedrooms).trim() || null;
      o.baths = String(f.bathrooms == null ? '' : f.bathrooms).trim() || null;
      o.sqft = String(f['sq-ft'] == null ? '' : f['sq-ft']).trim() || null;
      o.agent = CX.custName ? CX.custName(f[JOIN.re.agent]) : null;
      o.brokerage = String(f.brokerage || '').trim() || null;
      o.teaser = firstWords(f['property-description'], 24);
      o.hasLink = !!String(f['listing-link'] || '').trim(); }
    return o;
  });
}

function compileFactsOf(CX, slot, fd, btRaw, list, dj) {
  const label = btRaw ? firstWord(optName(CX.blockOpts, JOIN.block.type, btRaw)) : '';
  slot.blockLabel = label || null;
  slot.designInfo = CX.designInfo(slot.design);
  const dl = slot.designInfo && !slot.designInfo.missing ? slot.designInfo.label : null;
  slot.designFits = (label && dl) ? (label.toUpperCase() === dl.toUpperCase()) : null;
  if (list) slot.items = itemsOf(CX, slot.assetType, list.ids);
  // 206 reads a block's events, listings and ads by its type, whatever its
  // asset type says; so does the content test below.
  const U0 = label.toUpperCase();
  const typed = U0 === 'EV' ? itemsOf(CX, 'event', eventIdsFor(fd, dj))
              : U0 === 'RE' ? itemsOf(CX, 're', reIdsFor(fd, dj))
              : U0 === 'TXA' ? itemsOf(CX, 'text-ad', idList(dj && dj.txaAds)) : null;

  if (!CX.configured) { slot.compile = null; return; }
  const out = (state, lane, why) => { slot.compile = { state, lane, why: why || null }; };
  if (!label) return out('left-out', null, 'It has no block type.');
  const lane = CX.laneOf(label);
  if (lane === 'not-email') return out('not-email', null, null);
  if (!lane) return out('left-out', null, 'Compile does not take ' + label + ' blocks.');
  const di = slot.designInfo;
  if (!di) return out('left-out', lane, 'It has no design.');
  if (di.missing) return out('left-out', lane, 'Its design is not in DESIGNS.');
  const code = CX.codeOf(label);
  if (!di.template || !di.template.toLowerCase().includes('email-' + code + '-'))
    return out('left-out', lane, 'Its design (' + (di.name || di.id) + ') is not a design for ' + label + ' blocks.');
  if (lane === 'heavy') {
    const found = (typed || []).filter(x => !x.missing).length;
    const U = label.toUpperCase();
    if (U === 'EV' && !found) return out('left-out', lane, 'No events are selected.');
    if (U === 'TXA' && !found) return out('left-out', lane, 'No ads are selected.');
    if (U === 'RE' && !found) return out('left-out', lane, 'No listings are selected.');
    if (U !== 'EV' && U !== 'TXA' && U !== 'RE' && !(slot.asset && !slot.asset.missing))
      return out('left-out', lane, 'No article is selected.');
  }
  return out('compiles', lane, null);
}

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
                   unapproved: null,
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
               unpublished, unpublishedError, unapproved: unapprovedIn(built.blocks, cfg),
               notes: run.warnings,
               meta: run.meta(built.blocks.length) }, 200);
}

function lastCompileOf(newsletter, cfg) {
  const raw = newsletter && newsletter.fieldData ? newsletter.fieldData['email-size-kb'] : null;
  const sizeKb = (raw === null || raw === undefined || raw === '') ? null : Number(raw);
  const limit = Number(cfg.emailLimitBytes) > 0 ? Number(cfg.emailLimitBytes) : null;
  const limitKb = limit ? Math.round(limit / 102.4) / 10 : null;
  return {
    at: (newsletter && newsletter.lastPublished) || null,                  // v1.0.34
    sizeKb: (sizeKb === null || isNaN(sizeKb)) ? null : sizeKb,
    limitKb,
    over: (limitKb && sizeKb !== null && !isNaN(sizeKb)) ? sizeKb > limitKb : null,
  };
}

// v1.0.26 — blocks still holding a cloned ad nobody has approved.
function unapprovedIn(blocks, cfg) {
  const cc = cloneCfg(cfg);
  return blocks
    .filter(b => b.ad && String((b.fieldData || {})[cc.ackField] || '').trim() === cc.ackPending)
    .map(b => ({ position: (b.fieldData || {}).position, id: b.ad.id,
                 name: String((b.ad.fieldData || {}).name || b.ad.id) }))
    .sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
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
  rows.forEach(b => { const sp = refId((b.fieldData || {})[JOIN.block.sponsor]); if (sp) payerIds.add(sp); });   // v1.0.28 sponsors too
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

// ── Assembler (v1.0.37, Modular 206 · Assembler port S1) ────
// Scenario 206 v1.44's block building, in JavaScript. A faithful port:
// every rule reads as 206 reads it today, quirks included, so the output
// can be proved identical before 206 is switched over. Quirks found in
// 206 are listed in the header (F-1 to F-4) and are fixed only after
// parity, one at a time, so each fix is its own visible change.
//
// Pure: assemble() takes the /issue-data answer plus the schema facts and
// returns the two render payloads. It reads nothing and writes nothing.

const ASM = {
  // 206 module 25310 (V-URL endpoints). HC-P-M206-1
  urls: { site: 'https://www.inbxify.com', splash: 'https://splash.inbxify.com' },
  // 206 modules 227, 25311. HC-P-M206-2
  paths: { article: '/articles-blog-posts/', issue: '/nl/' },
  // 206 modules 31, 227, 244, 248, 301. HC-P-M206-3
  utm: { medium: 'email', fa: 'FA-b', txa: 'TXA-b', ev: 'EV-b', pa: 'PA-b', ba: 'BA-b', ha: 'HA-b' },
  // Uploadcare sizes 206 appends. HC-P-M206-4
  uc: {
    og: '-/scale_crop/2400x1260/smart_faces/-/format/jpeg/-/quality/better/',
    photo: '-/scale_crop/1296x1296/smart_faces/-/format/auto/-/quality/smart/',
    photoTall: '-/scale_crop/1040x1300/smart_faces/-/format/auto/-/quality/smart/',
    ev: '-/scale_crop/800x800/smart_faces/-/format/auto/-/quality/smart/',
    re: '-/scale_crop/1200x800/smart/-/format/auto/-/quality/smart/',
  },
  tzDefault: 'America/New_York',   // HC-P-M206-5 (206 modules 248, 25311)
  txaKickerDefault: 'This Week',   // HC-P-M206-6 (206 module 201)
  dekMax: 400, dekCut: 397,        // HC-P-M206-7 (206 module 227)
  ogType: 'FA',                    // HC-P-M206-8 (206 module 25320): first FA block's picture
  // 206 module 201's list guards: template code, the list it needs. HC-P-M206-9
  listGuards: [['ev', 'ev'], ['txa', 'txa'], ['re', 're']],
  // The house-ad kinds the payload has flags for (f_hkSubscribe ...). A kind
  // is read by its ADS option label in lower case, never by id. HC-P-M206-10
  houseKinds: ['subscribe', 'bookmark', 'advertise'],
  // The yes option on NL-BLOCKS is-paid and show-as-sponsored, by label. HC-P-M206-11
  yesLabel: 'true',
  // Slugs that differ from what the reader would guess. HC-P-M206-12
  // F-2 fixed (v1.0.40): the live slug is show-as-sponsored (data
  // reference §CORRECTIONS). 206 v1.44 read show-as-sponsored-2.
  slugs: { sponsored: 'show-as-sponsored', isPaid: 'is-paid', houseKind: 'house-kind' },
};

// F-5 fixed (v1.0.40). Customer-determined: the article's business is a
// CUSTOMERS record (JOIN.article.author = associated-business-coc, read
// into b.author) with expert-contributor on. 206 v1.44 answered 1 always.
const EC_RULE = (afd, au) => (len(afd[JOIN.article.author]) > 0 && au['expert-contributor'] === true) ? 1 : 0;

// Regexes exactly as written in 206's expressions, parsed the way Make
// parses "/pattern/flags". The RE one is F-1: its doubled backslashes
// match a literal backslash, so it never strips a file name.
const RX206 = {
  photo: '/\\/[a-zA-Z0-9_-]+\\.(jpg|jpeg|png|gif|webp)$/i',        // modules 227, 248
  rePhoto: '/\\\\/[a-zA-Z0-9_-]+\\\\.(jpg|jpeg|png|gif|webp)$/i',  // modules 201, 259 (F-1)
};

// ── Make's functions, as 206 uses them ──
function mkRegex(s) {
  const m = /^\/(.*)\/([gimsuy]*)$/s.exec(s);
  return m ? new RegExp(m[1], m[2]) : null;
}
// F-1 fixed (v1.0.40): listing photos use the same strip as article photos.
// RX206.rePhoto stays above as the record of what 206 v1.44 did.
const RX = { photo: mkRegex(RX206.photo), rePhoto: mkRegex(RX206.photo) };
function t(v) { return v == null ? '' : (typeof v === 'object' ? '' : String(v)); }   // {{x}} in text
function q(v) { return t(v).replace(/"/g, "'"); }   // replace(x; '/"/g'; "'")
function blank(v) { return v == null || v === '' || (Array.isArray(v) && !v.length); }
function ifempty(a, b) { return blank(a) ? b : a; }
function len(v) { if (v == null) return 0; if (Array.isArray(v)) return v.length; return typeof v === 'object' ? 0 : String(v).length; }
function contains(s, sub) { return t(s).includes(sub); }
function gp(obj, path) {   // get(obj; "a.b") and dotted mapping paths
  if (obj == null) return undefined;
  let cur = obj;
  for (const k of String(path).split('.')) { if (cur == null || typeof cur !== 'object') return undefined; cur = cur[k]; }
  return cur;
}
// map(array; key; filterKey; filterValue). Empty values are left out.
// (W-2: if Make keeps them, the share image can differ; the diff checks it.)
function mmap(arr, key, fkey, fval) {
  return (Array.isArray(arr) ? arr : [])
    .filter(x => fkey == null || (gp(x, fkey) != null && String(gp(x, fkey)) === String(fval)))
    .map(x => gp(x, key)).filter(v => v != null && v !== '');
}
function first(a) { return Array.isArray(a) && a.length ? a[0] : ''; }
function encodeURL(v) { return encodeURIComponent(t(v)); }
function fmtNumber0(n) {   // formatNumber(n; 0; "."; ",")
  const s = Math.round(Number(n)).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function num0(v) { const n = Number(v); return isNaN(n) ? 0 : n; }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY3 = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
function partsIn(d, tz) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric',
    day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' });
  const o = {};
  f.formatToParts(d).forEach(x => { o[x.type] = x.value; });
  return { Y: +o.year, M: +o.month, D: +o.day, h: (+o.hour) % 24, m: +o.minute, s: +o.second,
           ms: d.getUTCMilliseconds(), dow: DAY3[o.weekday] };
}
// formatDate(date; "MMMM D, YYYY"; tz), Moment tokens as Make takes them.
function fmtDate(v, fmt, tz, run) {
  if (v == null || v === '') return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  let p;
  try { p = partsIn(d, tz || 'UTC'); }
  catch (e) { if (run) run.warn('Time zone "' + tz + '" is not valid; dates were formatted in UTC.'); p = partsIn(d, 'UTC'); }
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  return String(fmt).replace(/\[([^\]]*)\]|YYYY|MMMM|MMM|MM|M|dddd|ddd|DD|D|HH|H|hh|h|mm|ss|SSS|A|a/g, (m, lit) => {
    if (lit != null) return lit;
    switch (m) {
      case 'YYYY': return String(p.Y);
      case 'MMMM': return MONTHS[p.M - 1];
      case 'MMM': return MONTHS[p.M - 1].slice(0, 3);
      case 'MM': return pad(p.M);
      case 'M': return String(p.M);
      case 'dddd': return DAYS[p.dow];
      case 'ddd': return DAYS[p.dow].slice(0, 3);
      case 'DD': return pad(p.D);
      case 'D': return String(p.D);
      case 'HH': return pad(p.h);
      case 'H': return String(p.h);
      case 'hh': return pad(h12);
      case 'h': return String(h12);
      case 'mm': return pad(p.m);
      case 'ss': return pad(p.s);
      case 'SSS': return pad(p.ms, 3);
      case 'A': return p.h < 12 ? 'AM' : 'PM';
      case 'a': return p.h < 12 ? 'am' : 'pm';
    }
    return m;
  });
}
function fdOf(item) { return (item && item.fieldData) || {}; }
// json:ParseJSON of a design-json (206 modules 220, 221, 222). An empty
// field is {}. Unreadable JSON stops 206; here it is {} and a warning.
function djOf(raw, where, run) {
  if (raw == null || String(raw).trim() === '') return {};
  if (typeof raw === 'object') return raw;
  try { const v = JSON.parse(raw); return v && typeof v === 'object' ? v : {}; }
  catch (e) { run.warn(where + ': design-json is not valid JSON; read as {}. (206 would stop here.)'); return {}; }
}
// A JSON value 206 pastes raw into its payload (skin, djTitle, djIssue).
function rawJson(raw, where, run) {
  if (raw == null || String(raw).trim() === '') return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); }
  catch (e) { run.warn(where + ' is not valid JSON; sent as {}. (206 would fail the render here.)'); return {}; }
}
function sortByPosition(rows, key) {   // sort(...; "asc"; key), stable
  return rows.map((r, i) => [r, i])
    .sort((a, b) => (num0(gp(a[0], key)) - num0(gp(b[0], key))) || (a[1] - b[1]))
    .map(x => x[0]);
}

// Schema facts the assembler needs, read once per run. Labels, never ids.
async function assemblerFacts(run) {
  const C = run.cfg.collections;
  const [blockSchema, adSchema] = await Promise.all([
    run.cachedSchema('blocks', C.blocks), run.cachedSchema('ads', C.ads),
  ]);
  const blockOpts = optionMaps(blockSchema);
  const adOpts = optionMaps(adSchema);
  const CX = compileContext(run, run.cfg, blockOpts, null, null, null);
  if (!CX.configured) throw httpErr(500, 'IX_CONFIG.compile (heavy and light lanes) is not set, so nothing can be assembled.');
  const yesOf = slug => {
    const m = blockOpts[slug];
    if (!m) { run.warn('NL-BLOCKS has no Option field "' + slug + '"; it reads as no on every block, as in 206 v1.44.'); return null; }
    const id = Object.keys(m).find(k => String(m[k]).trim().toLowerCase() === ASM.yesLabel);
    if (!id) run.warn('NL-BLOCKS ' + slug + ' has no option named "' + ASM.yesLabel + '" (found: ' + Object.values(m).join(', ') + '); it reads as no.');
    return id || null;
  };
  const kindMap = adOpts[ASM.slugs.houseKind] || {};
  if (!adOpts[ASM.slugs.houseKind]) run.warn('ADS has no Option field "' + ASM.slugs.houseKind + '"; house ads get no kind.');
  return {
    CX, blockOpts,
    isPaidYes: yesOf(ASM.slugs.isPaid),
    sponsoredYes: yesOf(ASM.slugs.sponsored),
    houseKindOf: id => {
      const k = id && kindMap[id] ? String(kindMap[id]).trim().toLowerCase() : '';
      return ASM.houseKinds.includes(k) ? k : '';
    },
    labelOf: raw => raw ? firstWord(optName(blockOpts, JOIN.block.type, raw)) : '',
  };
}

// The two render payloads, from one /issue-data answer.
//   data   { context, blocks } as buildIssue answers
//   F      assemblerFacts(run)
// Answers { email, web, og, counts, skipped }.
function assemble(run, data, F) {
  const c = data.context;
  const nl = c.newsletter, nfd = fdOf(nl), tfd = fdOf(c.title), pfd = fdOf(c.plan);
  const ufd = fdOf(c.publisher), sfd = fdOf(c.titleSite);
  const tz = ifempty(tfd['title-timezone'], ASM.tzDefault);
  const djT = djOf(tfd['design-json'], 'TITLES-ADMIN', run);        // 220
  const djI = djOf(pfd['design-json'], 'PUBLICATION PLAN', run);    // 221
  const utmBase = '?utm_source=' + encodeURL(tfd.name) + '&utm_medium=' + ASM.utm.medium +
                  '&utm_campaign=' + encodeURL(pfd.name);           // 31
  const utmAmp = utmBase.split('?').join('&');                      // 25319
  const tagFor = link => (contains(link, '?') ? utmAmp : utmBase);
  const ads = c.activeBannerAds || [];
  const site = ASM.urls.site;

  // 25320, 25321 — the share image and title
  const sortedRows = sortByPosition(data.blocks, 'fieldData.position');
  const ogSrc = t(first(sortedRows
    .filter(b => F.labelOf(fdOf(b)[JOIN.block.type]).toUpperCase() === ASM.ogType)
    .map(b => gp(b, 'article.fieldData.' + JOIN.article.ogSrc)).filter(v => v != null && v !== '')));
  // W-1: split(...; "/") then get(...; 2) and get(...; 3): host and uuid.
  const segs = ogSrc.split('/').filter(s => s !== '');
  const ogImage = ogSrc ? 'https://' + t(segs[1]) + '/' + t(segs[2]) + '/' + ASM.uc.og : '';
  const og = {
    ogImage,
    ogTitle: t(tfd.name) + ' | No. ' + t(nfd['issue-no']) + ' | ' + fmtDate(nfd['publish-date'], 'MMMM D, YYYY', tz, run),   // F-4 fixed (v1.0.40): title time zone
    archiveImage: ogSrc,
  };

  // v1.0.42 — the LW block switches the weather strip on
  const wxLabel = weatherLabelOf(run.cfg);
  const hasWeather = data.blocks.some(b => String(F.labelOf(fdOf(b)[JOIN.block.type]) || '').trim().split(/\s+/)[0].toUpperCase() === wxLabel);
  const heavy = [], light = [], skipped = [];
  data.blocks.forEach(b => {
    const fd = fdOf(b);
    const label = F.labelOf(fd[JOIN.block.type]);
    const lane = label ? F.CX.laneOf(label) : null;
    const pos = fd.position;
    const skip = why => skipped.push({ id: b.id, position: pos == null ? null : pos, type: label || null, why });
    if (lane === 'not-email') return skip('This type is not in the email.');
    if (!lane) return skip(label ? 'Compile does not take ' + label + ' blocks.' : 'It has no block type.');
    const D = fdOf(b.design);
    const code = F.CX.codeOf(label);
    const tpl = t(D[JOIN.design.template]).toLowerCase();

    if (lane === 'light') {
      // 301 guard
      if (!tpl.includes('email-' + code + '-')) return skip('Its design is not a design for ' + label + ' blocks.');
      light.push(lightBlock(b, fd, D, F, tfd, nfd, tagFor));
      return;
    }

    // heavy lane: 162 to 201
    const dj = djOf(fd[JOIN.block.designJson], 'block ' + b.id, run);   // 222
    const blockLabel = code.toUpperCase();                               // 231
    const txaCards = (b.txaAds || []).map(ad => {                        // 241, 244
      const af = fdOf(ad);
      const link = t(af['redirect-link']) + tagFor(af['redirect-link']) + '&utm_content=' + ASM.utm.txa + t(pos);
      return { logo: q(gp(ad, 'customer.fieldData.logo-link')), business: q(af['customer-name']),
               title: q(af['short-title']), body: q(af['short-text']), meta: q(af['txa-meta']), link: q(link) };
    });
    const evCards = (b.events || []).map(ev => {                         // 246, 248, 249
      const ef = fdOf(ev);
      const photoBase = t(ef[JOIN.event.photo]).replace(RX.photo, '/');
      const venue = t(ef['event-location']) +
        (len(ef['venue-room']) > 0 ? ', ' + t(ef['venue-room']) : '') +
        (len(ef['event-city']) > 0 ? ' · ' + t(ef['event-city']) : '') +
        (len(ef['event-state']) > 0 ? ', ' + t(ef['event-state']) : '');
      const link = len(ef['event-link']) > 0
        ? t(ef['event-link']) + tagFor(ef['event-link']) + '&utm_content=' + ASM.utm.ev + t(pos) : '';
      const at = f => fmtDate(ef[JOIN.event.start], f, tz, run);
      return {
        title: q(ef.name), eyebrow: q(ef['event-eyebrow']),
        dtDay: q(at('D')), dtDow: q(at('dddd')), dtMonth: q(at('MMM')), dtTime: q(at('h:mm A')),
        dtEndTime: q(ef['dt-end-time']), address: q(ef['event-address']),
        x_hasEndTime: len(ef['dt-end-time']) > 0 ? 1 : 0,
        venue: q(venue), teaser: q(ef['event-description']), link: q(link),
        photo: len(photoBase) > 0 ? photoBase + ASM.uc.ev : '',
        x_hasPhoto: len(photoBase) > 0 ? 1 : 0,
        x_hasTeaser: len(ef['event-description']) > 0 ? 1 : 0,
        x_hasEyebrow: len(ef['event-eyebrow']) > 0 ? 1 : 0,
        dtSort: isoOf(ef[JOIN.event.start]),   // v1.0.41: render sorts merged runs by it
      };
    });
    const reCards = (b.reListings || []).map(l => {                      // 256, 259
      const lf = fdOf(l);
      return {
        address: q(lf.name),
        flag: q(ifempty(lf['phase-note'], len(lf['listing-phase']) > 0 ? gp(l, '_opt.listing-phase') : '')),
        price: lf['hide-price'] === true ? '' : (num0(lf['property-price']) > 0 ? '$' + fmtNumber0(lf['property-price']) : ''),
        beds: q(lf.bedrooms), baths: q(lf.bathrooms), sqft: q(lf['sq-ft']),
        description: q(lf['property-description']).replace(/\n/g, ' '),
        agent: q(gp(l, 'agent.fieldData.name')), brokerage: q(lf.brokerage),
        photo: len(lf[JOIN.re.photo]) > 0 ? t(lf[JOIN.re.photo]).replace(RX.rePhoto, '/') + ASM.uc.re : '',
        link: q(lf['listing-link']),
      };
    });

    // 201 guard: any one of the four
    const art = b.article, afd = fdOf(art);
    const hasCode = cd => tpl.includes('email-' + cd + '-');
    const lists = { ev: evCards.length, txa: txaCards.length, re: reCards.length };
    const passes = (hasCode(code) && len(art && art.id) > 0) ||
      ASM.listGuards.some(([cd, key]) => hasCode(cd) && lists[key] > 0);
    if (!passes) {
      const want = ASM.listGuards.find(([cd]) => cd === code);
      return skip(!hasCode(code) ? 'Its design is not a design for ' + label + ' blocks.'
        : want ? 'Nothing is selected in it.' : 'No article is selected.');
    }

    // 224 — the PRODUCT LIBRARY item for the franchise banner
    const typeKey = blockLabel + '.franchiseId';
    const fid = ifempty(gp(dj.types, typeKey), ifempty(dj.franchiseId, ifempty(gp(djI.types, typeKey),
      ifempty(djI.franchiseId, ifempty(gp(djT.types, typeKey), '')))));
    const fr = len(fid) > 0 ? (first(mmap(c.franchises, 'fieldData', 'id', fid)) || {}) : {};

    // 227 — resolved values
    const isPaid = !!F.isPaidYes && fd[ASM.slugs.isPaid] === F.isPaidYes;
    const payerId = b.payer ? b.payer.id : null;
    const firstAd = (key, advId) => t(first(mmap(ads, key, 'advertiserId', advId)));
    const payerRedirect = payerId ? firstAd('redirectLink', payerId) : '';
    const summary = afd['post-summary'];
    const d = {
      sponsored: (!!F.sponsoredYes && fd[ASM.slugs.sponsored] === F.sponsoredYes) ? 1 : 0,
      dek: len(summary) > ASM.dekMax ? t(summary).substring(0, ASM.dekCut) + '…' : t(summary),
      linkUrl: ASM.urls.splash + '/?n=' + t(nl && nl.id) + '&to=' + site + ASM.paths.article + t(afd.slug) +
               utmBase + '&utm_content=' + ASM.utm.fa + t(pos),
      dekFull: t(summary),
      linkDirect: site + ASM.paths.article + t(afd.slug),
      paidBy: isPaid ? t(gp(b, 'payer.fieldData.name')) : '',
      paidAdImage: (isPaid && len(fd[JOIN.block.payer]) > 0 && len(payerRedirect) > 0) ? firstAd('bannerLink', payerId) : '',
      paidAdLink: (isPaid && len(payerRedirect) > 0)
        ? payerRedirect + tagFor(payerRedirect) + '&utm_content=' + ASM.utm.pa + t(pos) + '&utm_term=' + t(payerId) : '',
      photoBase: t(afd[JOIN.article.ogSrc]).replace(RX.photo, '/'),
    };
    const sec = fdOf(b.section), sp = fdOf(b.sponsor), re = fdOf(b.re), ag = fdOf(b.reAgent), au = fdOf(b.author);
    const sponsorId = b.sponsor ? b.sponsor.id : null;
    const frName = ifempty(sec.name, fr.name);
    heavy.push({
      skin: rawJson(sec.skin, 'SECTIONS skin (block ' + b.id + ')', run),
      listings: reCards,
      cards: txaCards.concat(evCards),   // F-3 closed (v1.0.40): a real list here; the missing comma was in 206's typed JSON only
      template: q(D[JOIN.design.template]),
      templateWeb: q(D[JOIN.design.templateWeb]),
      blockType: q(blockLabel),
      position: pos,
      x_endGroup: gp(fd, JOIN.block.endGroup) ? 1 : 0,
      f_headline: q(afd.name),
      f_flag: q(afd['banner-statement']),
      f_subhead: q(afd['sub-title']),
      f_teaser: q(d.dek),
      f_teaserFull: q(d.dekFull),
      f_linkDirect: d.linkDirect,
      f_paidBy: q(d.paidBy),
      f_photoSrc: d.photoBase,
      f_photo: len(d.photoBase) > 0 ? d.photoBase + ASM.uc.photo : '',
      f_photoTall: len(d.photoBase) > 0 ? d.photoBase + ASM.uc.photoTall : '',
      f_photoCredit: q(afd.photographer),
      f_author: q(afd.writername),
      f_authorTitle: q(afd.writertitle),
      f_coAuthor: q(afd['co-writername']),
      f_coAuthorTitle: q(afd['co-writertitle']),
      f_authorBusiness: q(au.name),
      f_authorLogo: q(au['logo-link']),
      f_rubric: q(fd.rubric),
      f_txaKicker: q(ifempty(gp(djI.types, 'txaKicker'), ifempty(djI.txaKicker,
        ifempty(gp(djT.types, 'txaKicker'), ifempty(djT.txaKicker, ASM.txaKickerDefault))))),
      f_ctaText: q(afd['cta-button-text']),
      f_articleUrl: q(afd['redirect-link']),
      f_shortSummary: q(afd['short-article-summary']),
      f_link: q(d.linkUrl),
      f_sponsorName: q(sp.name),
      f_sponsorAd: q(ifempty(sponsorId ? firstAd('bannerLink', sponsorId) : '', sp['default-paid-ad-ulc-link'])),
      f_franchiseName: q(frName),
      f_franchiseArt: q(ifempty(sec['section-art'], fr['ulc-section-image-link'])),
      f_reAddress: q(re.name),
      f_rePhoto: len(re[JOIN.re.photo]) > 0 ? t(re[JOIN.re.photo]).replace(RX.rePhoto, '/') + ASM.uc.re : '',
      f_reLink: q(re['listing-link']),
      f_rePrice: re['hide-price'] === true ? '' : (num0(re['property-price']) > 0 ? '$' + fmtNumber0(re['property-price']) : ''),
      f_reBeds: q(re.bedrooms),
      f_reBaths: q(re.bathrooms),
      f_reSqft: q(re['sq-ft']),
      f_reBrokerage: q(re.brokerage),
      f_reAgent: q(ag.name),
      f_reAgentLogo: q(ag['business-logo-ulc-link']),
      x_sponsored: d.sponsored,
      x_hasPhoto: len(afd[JOIN.article.ogSrc]) > 0 ? 1 : 0,
      x_hasAuthor: len(afd.writername) > 0 ? 1 : 0,
      x_showPhotoCredit: afd['show-photo-credits'] === true ? 1 : 0,
      x_hasCoAuthor: len(afd['co-writername']) > 0 ? 1 : 0,
      x_isEC: EC_RULE(afd, au),   // F-5 fixed (v1.0.40)
      x_hasREPhoto: len(re[JOIN.re.photo]) > 0 ? 1 : 0,
      x_hasAgent: len(ag.name) > 0 ? 1 : 0,
      x_hasFranchise: len(frName) > 0 ? 1 : 0,
      f_paidAd: d.paidAdImage,
      f_paidAdLink: d.paidAdLink,
      x_isPaid: isPaid ? 1 : 0,
      f_evCount: evCards.length,
      x_evCount: evCards.length,
      x_hasSponsor: len(sp.name) > 0 ? 1 : 0,
    });
  });

  // 210 — both lanes, in position order (heavy first on a tie, as merge() does)
  const blocks = sortByPosition(heavy.concat(light), 'position');

  // 25311 — the render context
  const lbl = k => q(ifempty(gp(djI.labels, k), gp(djT.labels, k)));
  const theme = k => q(gp(djI.theme, k));
  const pd = nfd['publish-date'];
  const ctx = {
    ogImage: og.ogImage,
    titleName: q(tfd.name),
    titleTagline: q(tfd['title-tagline']),
    masthead: q(sfd['email-masthead-url']),
    publisherName: q(ufd.name),
    publisherPerson: q(ufd['contact-name']),
    publisherPhone: q(ufd['business-phone']),
    publisherPhoneTel: t(ufd['business-phone']).replace(/[^0-9+]/g, ''),
    publisherHeadshot: q(tfd['publisher-headshot-ulc-link']),
    issueNo: q(nfd['issue-no']),
    issueTitle: q(nfd['newsletter-greeting-title']),
    publishDate: q(fmtDate(pd, 'MMMM D, YYYY', tz, run)),
    utm: q(utmBase),
    previewText: q(ifempty(nfd['email-preview'], ifempty(nfd['super-short-greeting'], nfd['entry-paragraph-for-each-newsletter']))),
    publishDateShort: q(fmtDate(pd, 'MMM D', tz, run)),
    issueDateNumeric: fmtDate(pd, 'M.DD', tz, run),
    publishYear: q(fmtDate(pd, 'YYYY', tz, run)),
    issueUrl: q(site + ASM.paths.issue + t(nfd.slug)),
    bgColor: q(tfd['nl-background']),
    themeAccent: theme('accent'),
    themeBg: theme('background'),
    closingNote: q(nfd['closing-note']),
    themeOrnament: theme('ornament'),
    themeMasthead: theme('mastheadArt'),
    lblAroundTown: lbl('aroundTown'),
    lblAroundTownEyebrow: lbl('aroundTownEyebrow'),
    aroundTownTeaser: lbl('aroundTownTeaser'),
    lblPartners: lbl('partners'),
    lblReadStory: lbl('readStory'),
    postmarkTop: lbl('postmarkTop'),
    postmarkBottom: lbl('postmarkBottom'),
    postmarkCenter: lbl('postmarkCenter'),
    'weather-lat': hasWeather ? q(tfd['weather-lat']) : '',   // v1.0.42: only with an LW block
    'weather-lon': hasWeather ? q(tfd['weather-lon']) : '',
    'weather-off': hasWeather ? '' : '1',
    'weather-tz': q(tfd['title-timezone']),
    'weather-date': q(pd),
    publisherEmail: q(ufd['business-email']),
    djTitle: rawJson(tfd['design-json'], 'TITLES-ADMIN design-json', run),
    djIssue: rawJson(pfd['design-json'], 'PUBLICATION PLAN design-json', run),
  };

  // 212, 213 — the two bodies. Same blocks, same context.
  const clone = v => JSON.parse(JSON.stringify(v));
  return {
    email: { surface: 'email', shell: t(tfd['shell-template']), tokens: t(tfd[JOIN.title.tokens]), context: ctx, blocks },
    web: { surface: 'web', shell: t(tfd['web-shell-template']), tokens: t(tfd[JOIN.title.tokens]), context: clone(ctx), blocks: clone(blocks) },
    og,
    counts: { blocks: blocks.length, heavy: heavy.length, light: light.length, blocksInPlan: data.blocks.length, skipped: skipped.length },
    skipped: sortByPosition(skipped, 'position'),
  };
}

// 262 to 301 — the light lane: ads, greeting, weather, dividers, spacers.
function lightBlock(b, fd, D, F, tfd, nfd, tagFor) {
  const pos = fd.position;
  const ad = fdOf(b.ad);                                  // 280
  const redirect = ad['redirect-link'];
  const kind = F.houseKindOf(ad[ASM.slugs.houseKind]);
  const button = ad['house-button-link'];
  return {
    template: q(D[JOIN.design.template]),
    templateWeb: q(D[JOIN.design.templateWeb]),
    blockType: q(fd[JOIN.block.type]),   // 206 sends the option id here, not a label
    position: pos,
    x_endGroup: gp(fd, JOIN.block.endGroup) ? 1 : 0,
    f_adImage: q(ad['banner-ad-link']),
    f_adLink: q(len(redirect) > 0
      ? t(redirect) + tagFor(redirect) + '&utm_content=' + ASM.utm.ba + t(pos) + '&utm_term=' + t(ad['customer-id']) : ''),
    f_adName: q(ad['customer-name']),
    f_greetingTitle: q(ifempty(fd[JOIN.block.greetTitle], tfd['greeting-salutation'])),
    f_greetingBody: q(ifempty(nfd['entry-paragraph-for-each-newsletter'], fd[JOIN.block.greetParagraph])),
    f_greetingSupershort: q(ifempty(nfd['super-short-greeting'], fd[JOIN.block.greetSupershort])),
    f_blockText: q(fd[JOIN.block.blockText]),
    f_houseKind: kind,
    f_hkSubscribe: kind === 'subscribe' ? '1' : '',
    f_hkBookmark: kind === 'bookmark' ? '1' : '',
    f_hkAdvertise: kind === 'advertise' ? '1' : '',
    f_houseEyebrow: q(ad['house-eyebrow']),
    f_houseHeadline: q(ad['house-headline']),
    f_houseCopy: q(ad['house-copy']),
    f_houseButtonText: q(ad['house-button-text']),
    f_houseButtonLink: q(len(button) > 0
      ? t(button) + tagFor(button) + '&utm_content=' + ASM.utm.ha + t(pos) : ''),
    f_houseArt1: q(ad['house-art-1']),
    f_houseArt2: q(ad['house-art-2']),
    f_houseArt3: q(ad['house-art-3']),
    f_rubric: q(fd.rubric),
    x_sold: len(fd[JOIN.block.ad]) > 0 ? 1 : 0,
  };
}

// ── /assemble and /assemble-diff (v1.0.37) ──────────────────

// The render Worker, through the service binding RENDER (Cloudflare
// dashboard → this Worker → Settings → Bindings → Service binding,
// name RENDER, service newsletter-render). A Worker cannot fetch another
// Worker on the same workers.dev subdomain by its address.
async function renderVia(env, body) {
  if (!env.RENDER || typeof env.RENDER.fetch !== 'function') {
    throw httpErr(500, 'The service binding RENDER is not set on this Worker. Add it: Settings → Bindings → Service binding, name RENDER, service newsletter-render.');
  }
  const res = await env.RENDER.fetch('https://newsletter-render/render', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return { status: res.status, html: await res.text(),
           bytes: res.headers.get('X-IX-Email-Bytes'), blocks: res.headers.get('X-IX-Email-Blocks'),
           weather: res.headers.get('X-IX-Weather') };                                       // weather v1.0.47
}

// GET /preview?contextNlId=&parentId=  (v1.0.47) Layout's Preview. Same
// origin rule as /plan-board. Assembles and renders both surfaces with
// block markers; writes nothing.
async function previewRoute(env, ctx, url, request) {
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
  if (!ok) return out({ ok: false, error: 'This origin may not call /preview.' }, 403);
  if (!env.WEBFLOW_TOKEN) return out({ ok: false, error: 'WEBFLOW_TOKEN is not set on this Worker.' }, 500);
  const C = cfg.collections || {};
  const missing = REQUIRED_COLLECTIONS.filter(k => !/^[0-9a-f]{24}$/.test(C[k] || ''));
  if (missing.length) return out({ ok: false, error: 'IX_CONFIG.collections is missing: ' + missing.join(', ') + '.' }, 500);
  const nlId = (url.searchParams.get('contextNlId') || '').trim();
  const parentId = (url.searchParams.get('parentId') || '').trim();
  if (!/^[0-9a-f]{24}$/.test(nlId)) return out({ ok: false, error: 'Missing or malformed contextNlId.' }, 400);
  if (!/^[0-9a-f]{24}$/.test(parentId)) return out({ ok: false, error: 'Missing or malformed parentId.' }, 400);

  const run = new Run(env, ctx, cfg, url.searchParams.get('fresh') === '1');
  try {
    const { out: A } = await assembleIssue(run, nlId, parentId);
    const em = Object.assign({}, A.email, { markBlocks: true });
    const wb = Object.assign({}, A.web, { markBlocks: true });
    const [re, rw] = await Promise.all([renderVia(env, em), renderVia(env, wb)]);
    const errOf = r => {
      if (r.status === 200) return null;
      try { const j = JSON.parse(r.html); return j.error || ('render answered ' + r.status); } catch (e) { return 'render answered ' + r.status; }
    };
    let weather = null;
    try { weather = re.weather ? JSON.parse(re.weather) : null; } catch (e) { weather = null; }
    return out({
      ok: true, version: VERSION, at: new Date().toISOString(),
      email: { status: re.status, html: re.status === 200 ? re.html : '', bytes: re.bytes ? Number(re.bytes) : null, error: errOf(re) },
      web: { status: rw.status, html: rw.status === 200 ? rw.html : '', error: errOf(rw) },
      weather, counts: A.counts, skipped: A.skipped,
      meta: run.meta(A.counts.blocksInPlan),
    }, 200);
  } catch (e) {
    return out({ ok: false, error: (e && e.message) || String(e), meta: run.meta(null) }, (e && e.status) || 502);
  }
}

// v1.0.41 — a date as a full ISO time for sorting, or '' when it is not a date.
function isoOf(v) {
  if (v == null || v === '') return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

// v1.0.41 — the weather state Compile will meet, asked of newsletter-render
// (its /weather route holds the rule). Never throws.
async function weatherStateOf(env, tf, issueDate, days) {
  const lat = String(tf['weather-lat'] == null ? '' : tf['weather-lat']).trim();
  const lon = String(tf['weather-lon'] == null ? '' : tf['weather-lon']).trim();
  if (!lat || !lon) return { state: 'no-place' };
  if (!issueDate || !/^\d{4}-\d{2}-\d{2}/.test(String(issueDate))) return { state: 'no-date' };
  if (!env.RENDER || typeof env.RENDER.fetch !== 'function') {
    return { state: 'unknown', error: 'The service binding RENDER is not set on this Worker.' };
  }
  const q = new URLSearchParams({ lat, lon, date: String(issueDate) });
  const tz = String(tf['title-timezone'] == null ? '' : tf['title-timezone']).trim();
  if (tz) q.set('tz', tz);
  if (days != null && String(days).trim() !== '') q.set('days', String(days).trim());
  try {
    const res = await env.RENDER.fetch('https://newsletter-render/weather?' + q.toString());
    const r = await res.json();
    const out = { state: r.state || (r.ok ? 'ready' : 'failed') };
    ['date', 'availableOn', 'today', 'error'].forEach(k => { if (r[k]) out[k] = String(r[k]); });
    if (out.state === 'ready' && !out.date) out.date = String(issueDate).slice(0, 10);
    return out;
  } catch (e) {
    return { state: 'unknown', error: 'newsletter-render /weather: ' + ((e && e.message) || String(e)) };
  }
}

// Where two texts first and last differ. Prefix and suffix are the same.
function diffRegion(a, b, keep) {
  a = String(a == null ? '' : a); b = String(b == null ? '' : b);
  if (a === b) return { same: true, chars: a.length };
  const n = Math.min(a.length, b.length);
  let i = 0; while (i < n && a.charCodeAt(i) === b.charCodeAt(i)) i++;
  let j = 0; while (j < n - i && a.charCodeAt(a.length - 1 - j) === b.charCodeAt(b.length - 1 - j)) j++;
  const k = keep || 600;
  return {
    same: false, workerChars: a.length, storedChars: b.length, firstDiffAt: i,
    line: a.slice(0, i).split('\n').length,
    before: a.slice(Math.max(0, i - 200), i),
    worker: a.slice(i, a.length - j).slice(0, k), workerRegionChars: a.length - j - i,
    stored: b.slice(i, b.length - j).slice(0, k), storedRegionChars: b.length - j - i,
    after: a.slice(a.length - j, a.length - j + 120),
  };
}

// Line by line, each place the two differ (up to max), so one run shows
// every difference rather than only the first.
function lineHunks(a, b, max) {
  const A = String(a || '').split('\n'), B = String(b || '').split('\n');
  const LOOK = 40, out = [];
  let i = 0, j = 0;
  while (i < A.length && j < B.length && out.length < max) {
    if (A[i] === B[j]) { i++; j++; continue; }
    let best = null;
    for (let s = 1; s <= 2 * LOOK && !best; s++) {
      for (let k = 0; k <= s; k++) {
        const l = s - k;
        if (k > LOOK || l > LOOK) continue;
        if (i + k < A.length && j + l < B.length && A[i + k] === B[j + l] && A[i + k].trim() !== '') { best = [k, l]; break; }
      }
    }
    const wk = best ? A.slice(i, i + best[0]) : A.slice(i, i + 3);
    const st = best ? B.slice(j, j + best[1]) : B.slice(j, j + 3);
    const h = { workerLine: i + 1, storedLine: j + 1 };
    if (wk.length === 1 && st.length === 1) h.inLine = diffRegion(wk[0], st[0], 300);
    else { h.worker = wk.map(x => x.slice(0, 300)); h.stored = st.map(x => x.slice(0, 300)); }
    out.push(h);
    if (!best) { h.resynced = false; break; }
    i += best[0]; j += best[1];
  }
  return out;
}

function sizeReportDiff(workerJson, storedJson) {
  let w = [], s = [];
  try { w = JSON.parse(workerJson || '[]'); } catch (e) { w = []; }
  try { s = JSON.parse(storedJson || '[]'); } catch (e) { s = []; }
  const rows = [];
  for (let i = 0; i < Math.max(w.length, s.length); i++) {
    const a = w[i] || null, b = s[i] || null;
    if (!a || !b || a.t !== b.t || a.b !== b.b) rows.push({ i, worker: a, stored: b });
  }
  return { same: rows.length === 0, workerBlocks: w.length, storedBlocks: s.length, differ: rows };
}

async function assembleIssue(run, nlId, parentId) {
  const data = await buildIssue(run, nlId, parentId);
  const F = await assemblerFacts(run);
  return { data, out: assemble(run, data, F) };
}

// GET /assemble?contextNlId=&parentId=[&fresh=1]   Header X-IX-Key.
// What 206 will call in place of its building half. Writes nothing.
async function assembleKeyed(run, nlId, parentId) {
  const { data, out } = await assembleIssue(run, nlId, parentId);
  // v1.0.39: the shape 206 v1.45 reads. Bodies as text; issue facts for
  // modules 214 (NEWSLETTER update), 26008 (answer) and 25317 (archive).
  const nl = data.context.newsletter, nfd = fdOf(nl), tfd = fdOf(data.context.title);
  return json({
    ok: true,
    emailBody: JSON.stringify(out.email),
    webBody: JSON.stringify(out.web),
    og: out.og,
    counts: out.counts,
    skipped: out.skipped,
    issue: {
      nlId: nl && nl.id,
      name: nfd.name || '',
      publishDate: nfd['publish-date'] || '',
      slug: nfd.slug || '',
      titleName: tfd.name || '',
      githubPath: tfd['github-output-path'] || '',
    },
    meta: run.meta(out.counts.blocksInPlan),
  }, 200);
}

// GET /assemble-diff?contextNlId=&parentId=[&fresh=1][&show=payload]
// Same origin rule as /plan-board. Assembles here, renders both surfaces
// through the render Worker, and compares with what 206 last saved on the
// NEWSLETTER. Run it right after a Compile of the same issue. Writes
// nothing.
async function assembleDiffRoute(env, ctx, url, request) {
  const origin = request.headers.get('Origin') || '';
  let cfg = null;
  try { cfg = JSON.parse(env.IX_CONFIG || ''); } catch (e) { cfg = null; }
  const allowed = (cfg && Array.isArray(cfg.allowedOrigins)) ? cfg.allowedOrigins : [];
  const ok = !!origin && allowed.includes(origin);
  const out = (obj, status) => new Response(JSON.stringify(obj, null, 1), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'Vary': 'Origin' }, ok ? { 'Access-Control-Allow-Origin': origin } : {}),
  });
  if (!cfg) return out({ ok: false, error: 'IX_CONFIG is missing or is not valid JSON.' }, 500);
  if (!ok) return out({ ok: false, error: 'This origin may not call /assemble-diff.' }, 403);
  if (!env.WEBFLOW_TOKEN) return out({ ok: false, error: 'WEBFLOW_TOKEN is not set on this Worker.' }, 500);
  const C = cfg.collections || {};
  const missing = REQUIRED_COLLECTIONS.filter(k => !/^[0-9a-f]{24}$/.test(C[k] || ''));
  if (missing.length) return out({ ok: false, error: 'IX_CONFIG.collections is missing: ' + missing.join(', ') + '.' }, 500);
  const nlId = (url.searchParams.get('contextNlId') || '').trim();
  const parentId = (url.searchParams.get('parentId') || '').trim();
  if (!/^[0-9a-f]{24}$/.test(nlId)) return out({ ok: false, error: 'Missing or malformed contextNlId.' }, 400);
  if (!/^[0-9a-f]{24}$/.test(parentId)) return out({ ok: false, error: 'Missing or malformed parentId.' }, 400);

  const run = new Run(env, ctx, cfg, url.searchParams.get('fresh') === '1');
  try {
    const { data, out: A } = await assembleIssue(run, nlId, parentId);
    const [em, wb] = await Promise.all([renderVia(env, A.email), renderVia(env, A.web)]);
    const nfd = fdOf(data.context.newsletter);
    const H = JOIN.publish.html;
    const stored = { email: nfd[H.email] || '', web: nfd[H.web] || '' };
    const updated = data.context.newsletter.lastUpdated || null;
    const ageMin = updated ? Math.round((Date.now() - Date.parse(updated)) / 60000) : null;
    const report = {
      ok: true,
      version: VERSION,
      issue: t(nfd.name),
      storedSaved: updated, storedAgeMinutes: ageMin,
      verdict: null,
      web: wb.status === 200 ? diffRegion(wb.html, stored.web) : { renderStatus: wb.status, error: wb.html.slice(0, 800) },
      email: em.status === 200 ? diffRegion(em.html, stored.email) : { renderStatus: em.status, error: em.html.slice(0, 800) },
      emailBlocks: em.status === 200 ? sizeReportDiff(em.blocks, nfd['email-size-report']) : null,
      emailBytes: { worker: em.bytes ? Number(em.bytes) : null, storedKb: nfd['email-size-kb'] == null ? null : nfd['email-size-kb'] },
      og: {
        title: { worker: A.og.ogTitle, stored: t(nfd['og-title']), same: A.og.ogTitle === t(nfd['og-title']) },
        image: { worker: A.og.ogImage, stored: t(nfd[JOIN.publish.ogImage]), same: A.og.ogImage === t(nfd[JOIN.publish.ogImage]) },
        archiveSource: A.og.archiveImage,
      },
      counts: A.counts,
      skipped: A.skipped,
    };
    if (wb.status === 200 && !report.web.same) report.webHunks = lineHunks(wb.html, stored.web, 12);
    if (em.status === 200 && !report.email.same) report.emailHunks = lineHunks(em.html, stored.email, 12);
    const parts = [];
    if (!report.web.same) parts.push('web');
    if (!report.email.same) parts.push('email');
    if (report.emailBlocks && !report.emailBlocks.same) parts.push('email block sizes');
    if (!report.og.title.same) parts.push('share title');
    if (!report.og.image.same) parts.push('share image');
    report.verdict = parts.length ? 'Differs: ' + parts.join(', ') + '.' : 'Identical to what 206 saved.';
    if (url.searchParams.get('show') === 'payload') report.payload = A.email;
    report.meta = run.meta(A.counts.blocksInPlan);
    return out(report, 200);
  } catch (e) {
    return out({ ok: false, error: (e && e.message) || String(e), meta: run.meta(null) }, (e && e.status) || 502);
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
