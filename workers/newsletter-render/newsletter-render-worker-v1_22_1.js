// newsletter-render-worker-v1_22_1.js
//
// INBXIFY Newsletter Render Worker v1.22.1
//
// v1.22.1 (Title Design S1, 27 Oct 2026): a title colour may be typed in any
//   CSS colour form. WLN's Primary Color Swatch holds "hsla(180, …)", not a
//   hex value, so v1.22.0 would have stopped with "Main is not a hex
//   colour". toHex() turns #rgb, #rrggbb, #rrggbbaa, rgb()/rgba() and
//   hsl()/hsla() into #RRGGBB before the check; alpha is dropped. A value in
//   none of those forms still stops the render with 422, naming the TITLES
//   field. The 422 message now uses the real TITLES field names (Primary
//   Color Swatch, Secondary Color Swatch, Highlight Color for the three
//   colours that existed before this session). Nothing else changed.
// ============================================================
//
// newsletter-render-worker-v1_22_0.js
//
// INBXIFY Newsletter Render Worker v1.22.0
//
// v1.22.0 (Title Design S1, 26 Oct 2026): a title's look comes from its
//   TITLES record, not from a file named after the title (runbook 00b,
//   Priority Work row 65; title fields review v0.1, every row accepted).
//   1 · THE TITLE LAYER. The Data Worker (v1.0.87) sends context.title, the
//       twelve design values typed on the title's TITLES record:
//         main accent highlight paper text accent2 footer
//         fontDisplay fontBody fontUi logoOnMain signoffRole
//       After the token files merge (platform, publisher, title), these
//       twelve set the base tokens (TITLE_MAP below): ink, accent,
//       highlight, paper, text, accent-2, end-bg, font-display, font-body,
//       font-ui, logo-on-main, signoff-role. They beat any token file.
//       No context.title: behaves exactly as v1.21.0. Safe to deploy first.
//   2 · REQUIRED AT THE SOURCE. With context.title present, every one of
//       the twelve must be filled, and the seven colours must be hex
//       (#abc or #aabbcc). Anything else stops the render with 422, naming
//       the TITLES fields (e.g. "Paper is empty", "Main is not a hex
//       colour"). No fallback prints blanks (standing rule, 2026-10-03).
//       A wrong field slug in the Data Worker shows here as "empty".
//   3 · MIXED SHADES. A token whose value is mix(a, b, p) is a mixed
//       colour: a with p% of b, as #RRGGBB. a and b are "@name" or a hex.
//       The recipes live in the platform token file (ix/email-tokens-v19),
//       one percentage each, the same for every title. Example:
//         "ink-deep": "mix(@ink, #000000, 35)"   Main plus 35% black
//         "page-bg":  "mix(@paper, @ink, 10)"    Main 10% into Paper
//       A recipe that cannot be worked out resolves to empty and is listed
//       in ?debug=1.
//   4 · FONTS. Each font field holds a Google Fonts family name ("Lora").
//       The chain is the family plus the role's platform fallback
//       (font-fallback-serif for display and body, font-fallback-sans for
//       UI). ctx.font-link is one Google Fonts address loading the three
//       families plus font-link-extra (Spectral, The Find), using the
//       older css API, which skips a weight a family does not have
//       instead of failing the whole request.
//   5 · WEB VARIABLES. ctx.web-vars is "--nl-<name>:<value>;" for every
//       name in the platform token "web-vars". The platform web shell
//       (templates/ix/web-shell-v1) writes it into its style block, so web
//       and email read the same resolved values (one fact, one place).
//   6 · ?debug=1 answers title: { applied, missing, values } beside tokens.
//   HARDCODING (provisional, Title Design S1):
//     HC-P-TD1-1  TITLE_MAP: which context.title key sets which token, and
//                 its TITLES field name for the 422 message. Platform
//                 structure, not a title value. The same map is in the Data
//                 Worker for /splash (HC-P-TD1-2).
//     HC-P-TD1-3  The Google Fonts address form (css API, family:weights).
// ============================================================
//
// newsletter-render-worker-v1_21_0.js
//
// INBXIFY Newsletter Render Worker v1.21.0
//
// v1.21.0 (106 Gap Interview S3, 19 Oct 2026): a section skin's accent
//   also colours the section-art bullet and rule. Ruled by Jeff 19 Oct
//   ("use accent of the section"), over web-blocks v63 / D184, where the
//   bullet and rule took the title's Highlight on every section.
//   1 · SKIN_ALIAS accent gains art-dot. Web reads --nl-art-dot for the
//       bullet and mixes the rule from it itself (35% over white); email
//       reads ctx.art-dot for the bullet and ctx.art-rule for the line.
//   2 · ctx.art-rule is derived for a skinned block: the accent mixed 35%
//       over white, the same mix web-blocks makes, so the two surfaces
//       agree (standing rule). mix35() is the only arithmetic; a value
//       that is not a 6-digit hex is left alone and the title's art-rule
//       stands.
//   3 · Nothing else changed. A block with no skin is as on v1.20.0.
//
// newsletter-render-worker-v1_20_0.js
//
// INBXIFY Newsletter Render Worker v1.20.0
//
// v1.20.0 (106 Gap Interview S3, 19 Oct 2026): a section skin reaches the
//   email story card (closure S2 D17). Standing rule, ruled 19 Oct: a block
//   renders the same on web and email unless email prohibits it.
//   What was wrong: a skin writes "surface" and "accent". The email story
//   templates (email-fa-*, email-ts-*) paint the card from ctx.tile-bg and
//   the headline rule from ctx.accent-soft, the title-token names for the
//   same visual roles. ctx got surface and accent, nothing read them, and
//   a skinned section printed on the title's white card in email while web
//   (which already aliases surface to --nl-article-bg) painted the skin.
//   1 · SKIN_ALIAS grows: surface also lands as tile-bg; accent also lands
//       as accent-soft. The alias applies to BOTH outputs now: the values
//       merged into the block's ctx (what email templates read) and the
//       CSS custom properties on the web wrapper (--nl-tile-bg and
//       --nl-accent-soft are harmless where no rule reads them; the web
//       stylesheet's accent-soft rules fall back to accent anyway, so web
//       is unchanged).
//   2 · Nothing else changed. A block with no skin renders as on v1.19.0.
//   HARDCODING: the alias table is the same hardcode as v1.7.0 (two
//   surfaces named one visual role differently); two more rows in it, not
//   a new one. Remove the table the day templates and stylesheet agree on
//   one name per role.
//
// v1.19.0 (Layout Preview · S2, 12 Oct 2026): block markers for Preview.
// v1.19.0 (Layout Preview · S2, 12 Oct 2026): block markers for Preview.
//   Layout's Preview shades the open tile's block in the Email and Web
//   previews. To find it, the page needs to know where each block starts
//   and ends in the finished HTML.
//   1 · New payload flag markBlocks (true or absent). When true, every
//       block's HTML is wrapped in two comments:
//         <!--INBXIFY block:7,9-->  ...block...  <!--INBXIFY /block-->
//       The numbers are the NL-BLOCKS positions the block came from (a
//       joined Events or Real Estate run lists every block it joined).
//       Email tidy keeps these two comments; it still strips all others.
//   2 · Only ix-issue-data's /preview sends markBlocks. Compile (206) never
//       does, so a compiled email or web page is byte for byte what
//       v1.18.2 made. Nothing else changed.
//
// (v1.18.2 header follows.)
// INBXIFY Newsletter Render Worker v1.18.2
// Receives a newsletter payload from Scenario 206, fetches block templates
// from GitHub via jsDelivr, substitutes values, returns finished HTML.
//
// v1.18.2 (Modular 206 S3, 12 Oct 2026): merged events in date order.
//   When contiguous Events blocks join into one section (v1.17.0), their
//   events are now sorted by event start (Jeff, 12 Oct 2026). Before, they
//   joined in plan order, so block 7's Oct 25 event could print above
//   block 9's Oct 22 event. The date is each item's dtSort, sent by
//   ix-issue-data v1.0.41. The sort runs only when every item in the
//   joined list has a dtSort; equal dates keep plan order. Real Estate
//   listings carry no dtSort and keep plan order. A single block is never
//   re-sorted (the Picker already orders it). Same on email and web.
//   Nothing else changed.
//
// v1.18.1 (Modular 206 S3, 12 Oct 2026): v1.18.0 without its banner
//   change. v1.18.0 (never deployed) tightened the gap between stacked
//   banners on email. Jeff's standing rule: every ad gets its own ceremony,
//   full spacing, never compressed. Removed; banner spacing is exactly as
//   v1.17.0. Weather (1) and the corrected record (3) below are unchanged.
//
// v1.18.0 (Modular 206 S3, 12 Oct 2026, superseded by v1.18.1, not
//   deployed): weather from the publish date only, and a corrected record.
//   1 · WEATHER NEVER SUBSTITUTES (Jeff's ruling). On email the strip
//       starts on the issue's publish date (weather-date) or is left out.
//       v1.13.0 to v1.17.0 quietly used today's forecast when the publish
//       date was too far ahead or in the past; that is gone. Every email
//       render now reports one of these:
//         ready     strip printed, starting on the publish date
//         too-far   publish date beyond the forecast window; no strip;
//                   "availableOn" names the first day it can be fetched
//                   (publish date minus 16 + days; 11 days for a 5-day strip)
//         past      publish date before today in the title's time zone
//                   (weather-tz); no strip
//         no-date   weather-date empty or not a date; no strip
//         no-place  weather-lat / weather-lon empty; no strip
//         failed    Open-Meteo did not answer; no strip; "error" says why
//       The render still succeeds in every case (warn and allow, ruled by
//       Jeff): the page is returned without the strip, and the state rides
//       in a new response header, X-IX-Weather, as compact JSON
//       {"state":"too-far","date":"2026-10-21","availableOn":"2026-10-10"}.
//       ?debug=1 shows the same as "weather". The /weather route keeps its
//       old meaning for the live web strip later: no date = today. A date
//       given to the route follows the same rules as email (no swap).
//   2 · (Banner stack spacing: withdrawn in v1.18.1, see above.)
//   3 · RECORD CORRECTED. The v1.17.0 note below said each Picker tile is
//       one record, "ruled by Jeff". Jeff made no such ruling, and it
//       contradicts his design (PubPlan 2.0, March; WS-I S4/S5; Picker
//       v1.26): one Events or Real Estate block holds a list of items with
//       one header and one sponsor. The v1.17.0 behaviour is kept because
//       it is his other rule: contiguous same-section blocks are one
//       section (one header); anything rendered between them makes two.
//   Nothing else changed.
//
// v1.17.0 (IPP Build S7, 9 Oct 2026): one section header over a run of
//   list blocks. [Correction in v1.18.0: the line that followed here said
//   one record per tile was ruled by Jeff; it was not. See v1.18.0, 3.]
//   Before, two Events tiles rendered two "What's Happening" headers.
//   Now, before anything is rendered, neighbouring blocks merge into one
//   when all of these hold:
//     · each carries items in exactly one list (cards, listings, or any
//       other non-empty array on the block; the Worker names no type)
//     · same template and templateWeb
//     · same header: section name and art (f_franchiseName,
//       f_franchiseArt), sponsor (f_sponsorName, f_sponsorAd,
//       x_hasSponsor), rubric (f_rubric) and skin
//     · the earlier block has no x_endGroup ("End group here" still wins)
//   Their items join in plan order into the first block, and any numeric
//   field ending in "Count" that equalled the first block's own item
//   count (f_evCount, x_evCount) is set to the new total, so the 1-3 card
//   grid and the 4+ rows choose themselves. A block between them that
//   renders (an ad, a story) keeps them apart: two runs, two headers.
//   Unfilled slots never reach the Worker, so they don't separate a run.
//   Both surfaces get it: 206 module 212 (email) and 213 (web) send the
//   same blocks. ?debug=1 lists each merge as "merges" (positions joined,
//   list name, item count). One side effect: X-IX-Email-Blocks indexes
//   blocks after merging, so a merged run is one entry.
//   Not enforced: a run longer than a template's own cap (RE says four
//   listings) renders all of them. Nothing else changed.
//
// v1.16.0 (Clean-Up S1): a missing file stops the run (D207).
//   Before, a shell or block template that could not be found, a block with
//   no template named, or a block whose render threw, was replaced by an
//   orange "INBXIFY render error" box and the page was still returned with
//   200, so 206 saved a broken page and Make showed green (seen with
//   bnm-wln/web-shell-v53.html, which does not exist). Now any of those
//   answers 422 with the list of problems and nothing is rendered, so 206
//   stops with a visible error, as it does for empty required values.
//   ?debug=1 is unchanged: it still returns the page with its error boxes
//   and the diagnostics, for looking into a problem. Nothing else changed.
//
// v1.15.0 (Clean-Up S1): the email size meter.
//   Every email render now reports its size, so an issue's weight is known
//   before it is sent (Gmail clips at about 102 KB; the warning line is
//   95 KB). Three response headers on surface "email":
//     X-IX-Email-Bytes   the finished email's size in bytes (after tidy)
//     X-IX-Email-Limit   the warning line in bytes (95 KB = 97280)
//     X-IX-Email-Blocks  each block's share, as compact JSON:
//                        [{"i":0,"t":"email-fa-centered-v7","b":4651}, ...]
//                        i = block position in the payload, t = template
//                        (folder and .html dropped), b = bytes after tidy
//   A block's share is the block on its own, tidied the same way; group
//   openers' wrappers, ad-group labels and the shell are the rest of the
//   total. ?debug=1 adds the same as "blockBytes". Nothing else changed:
//   the email itself is byte for byte what v1.14.0 sends.
//
// v1.14.0 (Email Pass S2): required values and Outlook-sized art.
//   1 · Required context (no silent blanks). The token required-context
//       lists context keys that must have a value, e.g.
//       "publisherEmail,titleName,issueUrl". If any is empty the Worker
//       renders nothing and answers 422 with the missing keys, so 206 stops
//       with a visible error instead of sending a page with blanks. Fix the
//       record (e.g. PUBLISHERS Business Email) and fire again.
//   2 · Height-only pictures on email (D197). An <img> with a height but no
//       width attribute, whose src is a bare Uploadcare base (no size, no
//       file name), is asked from Uploadcare at its size: twice its height
//       for every client (sharp on phones), exactly its height for Outlook
//       for Windows through an Outlook-only branch. Outlook draws a picture
//       at its file's pixel size when it has no width, so the section art
//       (Pet Corner, Our Neighbors ...) was drawn far too big there. The
//       height is the one in the style (a token, e.g. ctx.art-h), else the
//       attribute. A src that is not a bare base is left alone and listed in
//       ?debug=1 (fix the field, D197).
//   Nothing else changed.
//
// v1.13.3 (Email Pass S2): the email tidy squeezes more, to keep issues under
//   Gmail's clip (about 102 KB, before the sender adds link tracking).
//   1 · Whitespace next to a table, row, cell, paragraph, div or center tag
//       is removed. Those tags break lines on their own, so nothing moves.
//       Whitespace between inline tags (a, span, b, img ...) is kept: there
//       it can be a visible space.
//   2 · Inside style="..." attributes, spaces around ; : , are removed, and
//       the last ; is dropped. Spaces inside a value (font names, padding
//       lists) are kept.
//   Web is not tidied. Nothing else changed.
//
// v1.13.2 (Email Pass S2): link patterns accept {&key}, which inserts the
//   context value as it is, not URL-encoded. For a value that is itself a
//   link, e.g. Subscribe: "{&issueUrl}?subscribe=true" opens the issue's web
//   page with the site's subscribe popup (body.js section 13 already opens
//   it on ?subscribe=true). {key} still encodes. Nothing else changed.
//
// v1.13.1 (Email Pass S2): house-ad buttons work without a link on the ADS
//   record. For a house ad the Worker sets two values:
//     ctx.ha-href    the ADS House Button Link if set; otherwise the kind's
//                    token ha-<kind>-href with {key} filled from the context,
//                    e.g. "mailto:{publisherEmail}?subject=Advertising%20in%20
//                    {titleName}" (publisherEmail = PUBLISHERS business-email,
//                    sent by 206). Values are URL-encoded. If any {key} is
//                    empty, there is no link, and the template shows no button.
//    ctx.ha-button  the ADS House Button Text if set; otherwise ha-<kind>-button.
//   Templates read these (email-ba-house-*-v2). Nothing else changed.
//
// v1.13.0 (Email Pass S2, Design Pass 2 S5): weather and house ads.
//   1 · Weather route. GET /weather?lat=&lon=&date=&tz=&unit=&days=&phone=
//       returns { ok, days: [{ icon, day, hi, lo, phoneHide, date }] } from
//       Open-Meteo (free, no key). Built for email now and for a live
//       weather strip on the web pages later (one copy of the icon table).
//       tz defaults to "auto" (Open-Meteo picks the town's zone); unit is
//       fahrenheit or celsius (Open-Meteo's default when absent). A date
//       more than a day in the past, or too far ahead for a 5-day forecast,
//       is replaced by today. Forecasts are cached for an hour.
//   2 · Weather on email (D189). When the payload context carries
//       weather-lat and weather-lon (206 v1.35, from TITLES-ADMIN) and no
//       ready-made weather list, the Worker fetches the forecast and sets
//       ctx.weather, which the shell prints. Also read: weather-date (the
//       issue's publish date), weather-tz (TITLES-ADMIN title-timezone,
//       optional), and the token weather-unit. A failed forecast prints no
//       strip and adds a ?debug=1 line; the newsletter still renders.
//       Phone: days after the first ctx.weather-phone-days (token, default 3)
//       carry phoneHide.
//   3 · House ads (D146). A house-ad template declares itself with
//         <!-- ix-house -->
//       Such a block is never an ad: it is not grouped with banners and gets
//       no partner label (it counts as "other", like RE or EV). Its kind
//       (houseKind: subscribe, advertise, bookmark) picks its values: every
//       token named ha-<kind>-<name> is copied into the block's context as
//       ha-<name> (ha-c, ha-on, ha-art, ha-pm, ha-art-bg ...). Templates
//       read ctx.ha-*; no colour is typed in a template.
//   Web path unchanged. Email path unchanged for files without the marker.
//
// v1.12.0 (Email Pass S1, Design Pass 2 S4): story groups and ad groups on
//   email. Web is untouched: arrangeWeb() is byte-for-byte v1.11.0.
//   1 · The plan comes first. On email the Worker works out the groups
//       BEFORE it renders the blocks, from each block's kind (template file
//       name) and its x_endGroup flag. Same rule as web (D169): an opener
//       (email-at-) holds the stories (email-fa-, email-ts-, email-story-)
//       after it and the ads, spacers and dividers between them; it closes
//       at the first other block, the next opener, or a block with
//       x_endGroup. Ads after the last story stay outside. A block whose
//       template is missing counts as "other". Planning first lets every
//       block in a group render with its group's colours.
//   2 · Tone (D170). An opener template names its tone in a comment:
//         <!-- ix-tone: accent -->   (or main, or highlight)
//       No marker means accent. The comment is removed by the email tidy.
//   3 · Colours come from tokens, mixed here into plain hex (email has no
//       CSS variables and no color-mix):
//         grp-<tone>-edge   the edge colour         (@accent / @ink / @highlight)
//         grp-<tone>-tint   percent of the edge on white for the panel
//         grp-rule-mix      percent for the section-art rule (D184)
//         grp-radius, grp-pad, grp-gap, grp-edge-w   panel shape
//       Missing tokens fall back to the platform values in GRP_DEFAULTS.
//   4 · Every block gets, in its context:
//         ctx.grp-tone  ctx.grp-edge  ctx.grp-tint   (empty outside a group)
//         ctx.art-dot   ctx.art-rule  the section-art dot and rule colours:
//                       the group's edge inside a group, else the title's
//                       highlight (D184)
//   5 · Arrangement. Each group's rows are wrapped in one panel row: a
//       tinted table, 5px left edge in the edge colour, rounded corners
//       (square in Outlook). The panel has no bottom padding: the last
//       block's own 22px gap closes it.
//   6 · Ad groups on email (D142, D177, D179). Two or more ads placed
//       together, in groups of up to three: one label row, then each ad.
//       An email BA template wraps its own label in
//         <!-- ix-label --> ... <!-- /ix-label -->
//       and the Worker removes that part from ads inside a group. Label
//       order as web: the first BA block-text in the group, then
//       ctx.lblPartners, then "Featured local partners".
//   ?debug=1 lists every group with its tone, edge, tint and why it ended,
//   and every ad group with its size and label source.
//   Templates without markers (today's email files) render as before,
//   except that a run under an opener now sits on a panel.
//
// v1.11.0 (Design Pass 2 S3, D179): an ad group's label can be set per placement.
//   The label over a group of ads is, in order: the block text of the first
//   ad in the group that has any (NL-BLOCKS block-text on a BA row, which
//   206 already sends as f_blockText), then ctx.lblPartners (issue labels,
//   then title labels), then "Featured local partners". Lets a publisher
//   label a group of non-local ads differently. A lone ad's label is its
//   template's (web-ba-banner-v3 reads the same order). Web only.
//   Nothing else changed.
//
// v1.10.0 (Design Pass 2 S3): where an opener's group ends. Web only.
//   v1.9.0 ended a group at the first ad. With banners spread through an
//   issue, that cut every group short. Now:
//   1 · Default rule. A group holds stories (web-fa-, web-ts-, web-story-)
//       and the ads, spacers and dividers between them. It ends at the first
//       other block (RE, EV, TXA, house ad, greeting, sign-off ...) or at the
//       next opener. Ads, spacers and dividers after the group's last story
//       stay outside it, so the closing mark sits under a story.
//   2 · Override. A block sent with x_endGroup (NL-BLOCKS "End group here",
//       206 v1.32) is the last block in its group; the group closes right
//       after it. Set on an opener, the group holds the opener alone. Set on
//       an ad or spacer inside a group, the group closes after that block.
//   Ads inside a group still form ad groups (D142), now inside the run.
//   ?debug=1 reports each run's size and why it ended.
//   Email is untouched. Nothing else changed.
//
// v1.9.0 (Design Pass 2 S2): the web page is arranged after the blocks
//   render. Web surface only; email is untouched until the email pass.
//   1 · Ad groups (D142). Ads placed next to each other render as groups
//       of up to three: one "Featured local partners" label above one mat
//       holding the ads. Four become two pairs, five a three and a two. An
//       unsold slot renders nothing and does not count. A lone ad keeps its
//       own label. The label is ctx.lblPartners (the labels map, D144),
//       else the platform default. web-blocks-v50 styles the group.
//   2 · Opener runs (D145). An Around Town block and every block after it,
//       up to the next ad or the next opener, sit in one .nlw-run, closed
//       by a small mark (.nlw-run-end) when the run holds any block.
//   A block's kind comes from its template file name (web-ba-…, web-at-…),
//   the same naming 206 already checks on the email file. ?debug=1 lists
//   the groups and runs it made.
//   Nothing else changed.
//
// v1.8.0 (Design Port Session 5): the email is tidied before it leaves.
//   Gmail clips any message over about 102 KB behind "Message clipped",
//   hiding everything below the cut: ads, footer, unsubscribe. WLN-999's
//   email came out at 100.7 KB, and 18.6 KB of that was template comments
//   (file names and build notes) no reader ever sees. The sender's link
//   tracking then lengthens every link, which would push it over.
//   On the email surface only, tidyEmail() removes HTML comments and the
//   indentation at the start of each line. WLN-999: 100.7 KB → 75.3 KB,
//   visible text identical.
//   Kept: Outlook's conditional comments (<!--[if mso]> ... <![endif]-->
//   and <!--<![endif]-->), and the "INBXIFY render:" markers a failed block
//   leaves, so a failure is still findable in the sent file.
//   Not touched: the web surface, and ?debug=1, which returns the untidied
//   HTML so templates can still be traced. Debug now reports emailBytes
//   (raw and tidied) and warns above 95 KB.
//   Nothing else changed.
//
// v1.7.0 (Design Port Session 3): the skin reaches web as well as email.
//   A skinned block also gets ctx.skinStyle — the same values written as CSS
//   custom properties, ready to drop on the block's wrapper:
//       --nl-surface:#f6efe6;--nl-accent:#8a5a3c;
//   Email templates read the values directly and need nothing new. Web
//   templates put style="{{&ctx.skinStyle}}" on their outer element; every
//   rule inside then resolves against the block's own values, because custom
//   properties cascade. A block with no skin gets an empty string, so the
//   attribute is harmless when absent.
//
//   Most token names already match the web variable names. One does not:
//   email calls the card's ground "surface", and the web stylesheet paints an
//   article block from --nl-article-bg, which defaults to transparent. So a
//   skin's surface is emitted under BOTH names. That alias lives in SKIN_ALIAS
//   below, is the only one, and exists because the two surfaces named the same
//   visual role differently before this work. Logged as a hardcode. Remove it
//   the day the stylesheet reads --nl-surface for an article's ground.
//
// v1.6.0 (Design Port Session 3): per-block design values.
//   A block may carry a "skin" object: token names with different values,
//   applied to that block only. The block renders against ctx + its own
//   skin; every other block is untouched. This is what lets a section
//   carry its own look — a wallpaper, a background, an accent — without a
//   second template or a second stylesheet.
//     "blocks": [ { "template": "...", "skin": { "ev-bg": "#f3ece1" },
//                   "fields": {...} } ]
//   Skin values are plain values, not @references: 206 resolves the
//   cascade and sends the finished value. Unknown names are harmless;
//   a template that never reads the name simply ignores it.
//   A block with no skin renders exactly as it did on v1.5.0.
//
// v1.5.0 (Design Port Session 3): one new loop flag.
//   Inside {{#each}}, "only" is true when the list has exactly one item,
//   beside the existing "first" and "last". EV email v4 uses it to render
//   one event as a card and two or more as rows. Nothing else changed;
//   templates that don't use "only" render exactly as on v1.4.0.
//
// v1.4.0 (Design Port Session 2): email design values from token files.
//   payload.tokens names the title's token file, e.g.
//   "bnm-wln/email-tokens-v1.json". That file lists its parents in
//   "extends" (platform first, then publisher), the way a web shell names
//   its stylesheet. The Worker merges platform, then publisher, then title,
//   replaces every "@name" with that name's value, and adds the result to
//   the context. Templates read {{ctx.ink}}, {{ctx.t-title}}, and font
//   chains unescaped: {{&ctx.font-ui}}.
//   A context key sent by 206 wins over a token of the same name; the
//   clash is listed in ?debug=1. No payload.tokens: behaves as v1.3.0.
//   Safe to deploy first: no live template reads a token until repointed.
//
// v1.3.0 (WS-I Session 2): surface-aware template selection.
//   payload.surface === "web"  → each block renders block.templateWeb when
//   present, falling back to block.template (email) so content never
//   vanishes from a published page. Email path behavior unchanged.
//   No other changes from v1.2.0.
//
// Deploy as: newsletter-render.<subdomain>.workers.dev
//
// ── ENDPOINTS ──────────────────────────────────────────────────────────
//   POST /render          → returns text/html (the newsletter)
//   POST /render?debug=1  → returns application/json (payload + diagnostics)
//   GET  /health          → returns 200 "ok"
//
// ── TEMPLATE SYNTAX ────────────────────────────────────────────────────
//   {{field}}                 value from block fields, HTML-escaped
//   {{&field}}                value, NOT escaped (for pre-built HTML)
//   {{ctx.titleName}}         value from payload.context
//   {{#flag}} ... {{/flag}}   shown when flag is truthy
//   {{^flag}} ... {{/flag}}   shown when flag is falsy
//   {{#each items}} ... {{/each}}   loops an array in fields
//        inside a loop, {{.field}} reads the current item
//        loop flags: first, last, only (v1.5.0)
//   {{BLOCKS}}                in the shell only — where blocks are injected
//
// Make sends flat blocks: f_* are fields, x_* are flags, bare arrays
// (cards, events) pass through to fields untouched.
//
// Unresolved tokens render as empty string, never as literal braces.

const REPO = 'jbrady74/inbxify-site-code';
const BRANCH = 'main';
const CDN = (file) => `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/templates/${file}`;

// v1.8.0 — debug warns when a tidied email passes this size. Gmail clips
// at about 102 KB; the margin leaves room for the sender's link tracking.
const EMAIL_WARN_BYTES = 95 * 1024;

// v1.12.0 — platform fallbacks for the group panel tokens. The values live
// in ix/email-tokens (platform); these apply only if a token is missing.
const GRP_DEFAULTS = {
  'grp-accent-tint': '11', 'grp-main-tint': '6', 'grp-highlight-tint': '10',
  'grp-rule-mix': '35', 'grp-radius': '14px', 'grp-pad': '26px 20px 0 18px',
  'grp-gap': '26px', 'grp-edge-w': '5px',
};
const GRP_EDGE_FALLBACK = { accent: 'accent', main: 'ink', highlight: 'highlight' };

// v1.13.0 — a house-ad template carries this marker (see the header).
const HOUSE_RE = /<!--\s*ix-house\s*-->/i;

// v1.13.0 — Open-Meteo weather codes to the strip's icons. Platform level:
// every title reads the same table (tracker HC-P-EP2-1). Codes missing from
// the table show the thermometer.
const WX_ICONS = {
  0: '\u2600\uFE0F', 1: '\u{1F324}\uFE0F', 2: '\u26C5', 3: '\u2601\uFE0F',
  45: '\u{1F32B}\uFE0F', 48: '\u{1F32B}\uFE0F',
  51: '\u{1F326}\uFE0F', 53: '\u{1F326}\uFE0F', 55: '\u{1F327}\uFE0F',
  56: '\u{1F327}\uFE0F', 57: '\u{1F327}\uFE0F',
  61: '\u{1F327}\uFE0F', 63: '\u{1F327}\uFE0F', 65: '\u{1F327}\uFE0F',
  66: '\u{1F327}\uFE0F', 67: '\u{1F327}\uFE0F',
  71: '\u{1F328}\uFE0F', 73: '\u{1F328}\uFE0F', 75: '\u2744\uFE0F', 77: '\u{1F328}\uFE0F',
  80: '\u{1F326}\uFE0F', 81: '\u{1F327}\uFE0F', 82: '\u26C8\uFE0F',
  85: '\u{1F328}\uFE0F', 86: '\u2744\uFE0F',
  95: '\u26C8\uFE0F', 96: '\u26C8\uFE0F', 99: '\u26C8\uFE0F',
};
const WX_ICON_UNKNOWN = '\u{1F321}\uFE0F';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Expose-Headers': 'X-IX-Email-Bytes, X-IX-Email-Limit, X-IX-Email-Blocks, X-IX-Weather',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === '/health') {
      return new Response('ok', { status: 200, headers: CORS });
    }

    // v1.13.0 — weather route (email now, web pages later)
    if (url.pathname === '/weather' && request.method === 'GET') {
      const q = url.searchParams;
      const r = await getForecast({
        lat: q.get('lat'), lon: q.get('lon'), date: q.get('date'), tz: q.get('tz'),
        unit: q.get('unit'), days: q.get('days'), phone: q.get('phone'),
      });
      return new Response(JSON.stringify(r, null, 2), {
        status: r.ok ? 200 : 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': r.ok ? 'public, max-age=3600' : 'no-store', ...CORS },
      });
    }

    if (request.method !== 'POST') {
      return new Response('POST only', { status: 405, headers: CORS });
    }

    const debug = url.searchParams.get('debug') === '1';
    const diagnostics = [];

    let payload;
    try {
      payload = await request.json();
    } catch (err) {
      return json({ error: 'payload is not valid JSON', detail: String(err) }, 400);
    }

    if (!payload || !Array.isArray(payload.blocks)) {
      return json({ error: 'payload.blocks must be an array' }, 400);
    }

    // v1.17.0 — one section header over a run of list blocks
    const merges = [];
    payload.blocks = mergeListRuns(payload.blocks, merges);

    // v1.3.0 — surface-aware template selection (web prefers templateWeb,
    // falls back to the email template so content never disappears)
    const surface = payload.surface === 'web' ? 'web' : 'email';
    const pick = (b) =>
      (surface === 'web' && b && b.templateWeb) ? b.templateWeb : (b && b.template);

    const cache = new Map();

    // ---- fetch every distinct template once ------------------------------
    const wanted = new Set();
    if (payload.shell) wanted.add(payload.shell);
    for (const b of payload.blocks) {
      const t = pick(b);
      if (t) wanted.add(t);
    }

    await Promise.all([...wanted].map(async (file) => {
      try {
        const res = await fetch(CDN(file), { cf: { cacheTtl: 300, cacheEverything: true } });
        if (!res.ok) {
          diagnostics.push({ template: file, status: res.status, error: 'fetch failed' });
          cache.set(file, null);
          return;
        }
        cache.set(file, await res.text());
      } catch (err) {
        diagnostics.push({ template: file, error: String(err) });
        cache.set(file, null);
      }
    }));

    // ---- design tokens (v1.4.0) -------------------------------------------
    const ctx = Object.assign({}, payload.context || {});
    let tokenReport = null;
    // v1.22.0 — the title layer (TITLES values) and its required check
    let titleReport = null;
    const titleIn = (ctx.title && typeof ctx.title === 'object') ? ctx.title : null;
    if (titleIn) {
      titleReport = titleLayer(titleIn);
      if (titleReport.missing.length) {
        return json({ ok: false, error: 'TITLES design values are not usable: ' + titleReport.missing.join('; '),
          missing: titleReport.missing, surface, tokens: payload.tokens || null }, 422);
      }
      if (!payload.tokens) {
        return json({ ok: false, error: 'context.title needs payload.tokens (the platform token file holds the recipes)',
          surface }, 422);
      }
    }
    if (payload.tokens) {
      tokenReport = await loadTokens(payload.tokens, diagnostics, titleReport ? titleReport.tokens : null);
      if (titleReport) finishTitle(tokenReport.values, titleReport, diagnostics);
      for (const [k, v] of Object.entries(tokenReport.values)) {
        if (Object.prototype.hasOwnProperty.call(ctx, k)) {
          diagnostics.push({ token: k, error: 'context key of the same name wins' });
        } else {
          ctx[k] = v;
        }
      }
    }

    // ---- required context (v1.14.0) ---------------------------------------
    const required = String(ctx['required-context'] || '').split(',')
      .map((k) => k.trim()).filter(Boolean);
    const missing = required.filter((k) => {
      const v = lookup(ctx, k);
      return v == null || String(v).trim() === '';
    });
    if (missing.length) {
      return json({ ok: false, error: 'required values are empty: ' + missing.join(', '),
        missing, surface, tokens: payload.tokens || null }, 422);
    }

    // ---- weather (v1.13.0, D189) -------------------------------------------
    // v1.18.0: the publish date or no strip; the state is always reported.
    let weatherReport = null;
    if (surface === 'email' && !Array.isArray(ctx.weather)) {
      if (!String(ctx['weather-lat'] || '').trim() || !String(ctx['weather-lon'] || '').trim()) {
        weatherReport = { ok: false, state: 'no-place' };
      } else {
        weatherReport = await getForecast({
          lat: ctx['weather-lat'], lon: ctx['weather-lon'], date: ctx['weather-date'],
          tz: ctx['weather-tz'], unit: ctx['weather-unit'], days: ctx['weather-days'],
          phone: ctx['weather-phone-days'], requireDate: true,
        });
      }
      if (weatherReport.ok) ctx.weather = weatherReport.days;
      else if (weatherReport.state === 'failed') diagnostics.push({ weather: weatherReport.error });
    } else if (surface === 'email') {
      weatherReport = { ok: true, state: 'ready', supplied: true };
    }

    // A skin value that the web stylesheet reads under a second name.
    // One entry, and the reason is in the header above.
    // v1.20.0 — one visual role, every name the two surfaces use for it (see header).
    const SKIN_ALIAS = { surface: ['surface', 'article-bg', 'tile-bg'], accent: ['accent', 'accent-soft', 'art-dot'] };   // art-dot v1.21.0

    // ---- email plan (v1.12.0): groups before render -----------------------
    let plan = null;
    const grpCtx = [];
    if (surface === 'email') {
      const pKinds = payload.blocks.map((b) => {
        const t = pick(b);
        return (t && cache.get(t) != null) ? blockKind(t, cache.get(t)) : 'other';
      });
      const pEnds = payload.blocks.map((b) => endFlag(b));
      plan = planEmail(pKinds, pEnds);
      const hl = String(ctx.highlight || ctx.accent || '');
      const outside = { 'grp-tone': '', 'grp-edge': '', 'grp-tint': '',
        'art-dot': hl, 'art-rule': mixHex(hl, tok(ctx, 'grp-rule-mix')) };
      payload.blocks.forEach((b, i) => { grpCtx[i] = outside; });
      for (const seg of plan) {
        if (seg.type !== 'run') continue;
        const tpl = cache.get(pick(payload.blocks[seg.at])) || '';
        const m = /<!--\s*ix-tone:\s*(accent|main|highlight)\s*-->/i.exec(tpl);
        const tone = m ? m[1].toLowerCase() : 'accent';
        const edge = String(ctx['grp-' + tone + '-edge'] || ctx[GRP_EDGE_FALLBACK[tone]] || '');
        const tint = mixHex(edge, tok(ctx, 'grp-' + tone + '-tint'));
        Object.assign(seg, { tone, edge, tint, marker: Boolean(m) });
        const gc = { 'grp-tone': tone, 'grp-edge': edge, 'grp-tint': tint,
          'art-dot': edge, 'art-rule': mixHex(edge, tok(ctx, 'grp-rule-mix')) };
        for (const j of seg.members) grpCtx[j] = gc;
      }
    }

    // ---- render each block -----------------------------------------------
    const parts = [];
    const kinds = [];                       // v1.10.0: 'ba' | 'at' | 'story' | 'pass' | 'other'
    const ends = [];                        // v1.10.0: x_endGroup per block
    const labels = [];                      // v1.11.0: per-placement ad label
    const names = [];                       // v1.15.0: template per block, for the size meter
    const fatal = [];                       // v1.16.0: problems that stop the run
    let current = null;
    const mark = payload.markBlocks === true;                 // v1.19.0
    const addPart = (html, tplName) => {
      if (mark && current) {
        const from = Array.isArray(current.__runFrom) ? current.__runFrom : [current.position == null ? '' : current.position];
        html = '<!--INBXIFY block:' + from.join(',') + '-->' + html + '<!--INBXIFY /block-->';
      }
      parts.push(html); names.push(tplName || ''); kinds.push(blockKind(tplName, tplName ? cache.get(tplName) : null));
      ends.push(endFlag(current));
      labels.push(blockLabel(current));
    };

    payload.blocks.forEach((block, i) => {
      current = block;
      const tplName = pick(block);
      if (!block || !tplName) {
        fatal.push(`block ${i} has no template`);
        addPart(errorBlock(`block ${i} has no template`, debug), null);
        diagnostics.push({ index: i, error: 'no template named' });
        return;
      }
      const tpl = cache.get(tplName);
      if (tpl == null) {
        fatal.push(`block ${i}: template not found: ${tplName}`);
        addPart(errorBlock(`template not found: ${tplName}`, debug), null);
        return;
      }
      try {
        const { fields, flags } = normalize(block);

        // per-block design values (v1.6.0). Shallow merge over the run's
        // context, for this block only.
        let blockCtx = Object.assign({}, ctx, grpCtx[i] || {}, { skinStyle: '' });
        // v1.13.0 — a house ad takes its kind's ha-<kind>-* values as ha-*
        if (HOUSE_RE.test(tpl)) {
          const hk = String(fields.houseKind || '').trim().toLowerCase();
          const pre = 'ha-' + hk + '-';
          const picked = {};
          if (hk) for (const [k, v] of Object.entries(ctx)) {
            if (k.startsWith(pre)) picked['ha-' + k.slice(pre.length)] = v;
          }
          Object.assign(blockCtx, picked);
          // v1.13.1 — the button's link and words
          const own = String(fields.houseButtonLink || '').trim();
          blockCtx['ha-href'] = own || fillLink(picked['ha-href'], ctx);
          blockCtx['ha-button'] = String(fields.houseButtonText || '').trim() || String(picked['ha-button'] || '');
          if (debug) diagnostics.push({ index: i, house: hk || '(no houseKind)', values: picked,
            href: blockCtx['ha-href'], button: blockCtx['ha-button'] });
        }
        const skin = block && typeof block.skin === 'object' && block.skin ? block.skin : null;
        if (skin) {
          const applied = {};
          for (const [k, v] of Object.entries(skin)) {
            if (v == null || v === '') continue;      // empty means "inherit"
            (SKIN_ALIAS[k] || [k]).forEach((name) => { applied[name] = String(v); });   // v1.20.0: the alias reaches ctx too, so email reads it
          }
          // v1.21.0 — email's section-art rule is the accent softened the way web softens it
          if (applied.accent && !skin['art-rule']) { const soft = mix35(applied.accent); if (soft) applied['art-rule'] = soft; }
          if (Object.keys(applied).length) {
            // the same values as CSS custom properties, for web wrappers
            const css = Object.entries(applied)
              .filter(([k]) => /^[a-z0-9-]+$/i.test(k))
              .map(([k, v]) => '--nl-' + k + ':' + v.replace(/[;{}<>"]/g, ''))   // v1.20.0: applied already carries the alias names
              .join(';');
            blockCtx = Object.assign({}, ctx, grpCtx[i] || {}, applied, { skinStyle: css });
            if (debug) diagnostics.push({ index: i, skin: applied, skinStyle: css });
          }
        }
        if (debug) diagnostics.push({
          index: i,
          template: tplName,
          surface,
          loopKeys: (tpl.match(/\{\{#each\s+[\w.-]+\}\}/g) || []),
          arrays: Object.keys(fields).filter((k) => Array.isArray(fields[k]))
                    .map((k) => k + ':' + fields[k].length),
        });
        addPart(render(tpl, fields, flags, blockCtx), tplName);
      } catch (err) {
        fatal.push(`block ${i}: render failed: ${tplName}: ${String(err)}`);
        addPart(errorBlock(`render failed: ${tplName}`, debug), null);
        diagnostics.push({ index: i, template: tplName, error: String(err) });
      }
    });

    // v1.9.0 — on web, adjacent ads become one group and an opener holds
    // the run of blocks under it. v1.12.0 — email does the same from the plan.
    const groups = [];
    const body = surface === 'web'
      ? arrangeWeb(parts, kinds, ends, labels, ctx, groups)
      : arrangeEmail(parts, plan, labels, ctx, groups);

    // ---- wrap in the shell ------------------------------------------------
    let html;
    const shell = payload.shell ? cache.get(payload.shell) : null;
    if (shell == null) {
      if (payload.shell) diagnostics.push({ shell: payload.shell, error: 'shell not found' });
      else diagnostics.push({ shell: null, error: 'no shell named in payload' });
      fatal.push(payload.shell ? 'shell not found: ' + payload.shell : 'no shell named in payload');
      html = errorBlock('shell not found: ' + (payload.shell || '(none named)'), true) + body;
    } else {
      html = render(shell, ctx, payload.flags || {}, ctx).replace(/\{\{\s*BLOCKS\s*\}\}/g, body);
    }

    // v1.16.0 — a missing file stops the run (D207); ?debug=1 still shows the page.
    if (fatal.length && !debug) {
      return json({ ok: false, error: 'render stopped: ' + fatal.join('; '),
        problems: fatal, surface }, 422);
    }

    // ---- email tidy (v1.8.0) ---------------------------------------------
    let emailBytes = null;
    let blockBytes = null;                  // v1.15.0
    if (surface === 'email') {
      blockBytes = parts.map((p, i) => ({
        i,
        t: String(names[i] || '(none)').replace(/^.*\//, '').replace(/\.html$/i, ''),
        b: byteLength(tidyEmail(sizeArtForEmail(p, []))),
      }));
      html = sizeArtForEmail(html, diagnostics);           // v1.14.0
      const tidied = tidyEmail(html);
      emailBytes = { raw: byteLength(html), tidied: byteLength(tidied) };
      if (emailBytes.tidied > EMAIL_WARN_BYTES) {
        diagnostics.push({ email: 'size', bytes: emailBytes.tidied,
          error: 'over 95 KB after tidy; Gmail clips at about 102 KB' });
      }
      if (!debug) html = tidied;
    }

    if (debug) {
      return json({
        ok: diagnostics.length === 0,
        blockCount: payload.blocks.length,
        surface,
        emailBytes,
        blockBytes,
        weather: weatherReport,
        groups,
        merges,
        templatesFetched: [...cache.keys()],
        templatesMissing: [...cache.entries()].filter(([, v]) => v == null).map(([k]) => k),
        tokens: tokenReport ? { files: tokenReport.files, count: Object.keys(tokenReport.values).length,
                                values: tokenReport.values } : null,
        title: titleReport ? { applied: true, missing: titleReport.missing, values: titleReport.tokens } : { applied: false },   // v1.22.0
        diagnostics,
        html,
      }, 200);
    }

    const sizeHeaders = emailBytes ? {
      'X-IX-Email-Bytes': String(emailBytes.tidied),
      'X-IX-Email-Limit': String(EMAIL_WARN_BYTES),
      'X-IX-Email-Blocks': JSON.stringify(blockBytes),
    } : {};
    if (weatherReport) sizeHeaders['X-IX-Weather'] = JSON.stringify(weatherHeader(weatherReport));
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...sizeHeaders, ...CORS },
    });
  },
};


// ---- list runs (v1.17.0) ----------------------------------------------------
// The one list a block carries items in: the name of its only non-empty
// array field, or '' when it has none or more than one. 'skin' is style.
function listKeyOf(b) {
  if (!b || typeof b !== 'object') return '';
  const keys = Object.keys(b).filter((k) => k !== 'skin' && Array.isArray(b[k]) && b[k].length);
  return keys.length === 1 ? keys[0] : '';
}
const RUN_HEADER_FIELDS = ['template', 'templateWeb', 'f_franchiseName', 'f_franchiseArt',
  'f_sponsorName', 'f_sponsorAd', 'x_hasSponsor', 'f_rubric'];
function runHeader(b) {
  return JSON.stringify(RUN_HEADER_FIELDS.map((k) => (b[k] == null ? '' : String(b[k])))
    .concat(JSON.stringify(b.skin || {})));
}
function mergeListRuns(blocks, merges) {
  const out = [];
  for (const b of blocks) {
    const prev = out[out.length - 1];
    const key = listKeyOf(b);
    if (prev && key && prev.__runKey === key && !endFlag(prev) &&
        runHeader(prev) === runHeader(b)) {
      prev[key] = prev[key].concat(b[key]);
      prev.__runFrom.push(b.position == null ? '' : b.position);
      if (endFlag(b)) {
        if (Object.prototype.hasOwnProperty.call(b, 'x_endGroup')) prev.x_endGroup = b.x_endGroup;
        if (b.flags && b.flags.endGroup) prev.flags = Object.assign({}, prev.flags || {}, { endGroup: b.flags.endGroup });
      }
      continue;
    }
    const copy = Object.assign({}, b);
    if (key) {
      copy[key] = b[key].slice();
      Object.defineProperty(copy, '__runKey', { value: key, enumerable: false });
      Object.defineProperty(copy, '__runFrom', { value: [b.position == null ? '' : b.position], enumerable: false });
      Object.defineProperty(copy, '__runOwn', { value: b[key].length, enumerable: false });
    }
    out.push(copy);
  }
  for (const b of out) {
    if (!b.__runKey || b.__runFrom.length < 2) continue;
    const n = b[b.__runKey].length;
    // v1.18.2: events of a joined run in date order (stable; only when all are dated)
    const items = b[b.__runKey];
    if (items.every((it) => it && typeof it.dtSort === 'string' && it.dtSort)) {
      b[b.__runKey] = items.map((it, i) => [it, i])
        .sort((x, y) => (x[0].dtSort < y[0].dtSort ? -1 : x[0].dtSort > y[0].dtSort ? 1 : x[1] - y[1]))
        .map((p) => p[0]);
    }
    for (const k of Object.keys(b)) {
      if (/Count$/.test(k) && typeof b[k] === 'number' && b[k] === b.__runOwn) b[k] = n;
    }
    merges.push({ positions: b.__runFrom.slice(), list: b.__runKey, items: n,
      section: b.f_franchiseName || '' });
  }
  return out;
}

// ---- Outlook-sized pictures (v1.14.0) -------------------------------------
const UC_BASE = /^https:\/\/[^\/"]*(?:ucarecdn\.com|ucarecd\.net)\/[0-9a-f-]{36}\/$/i;
const UC_ANY = /^https:\/\/[^\/"]*(?:ucarecdn\.com|ucarecd\.net)\//i;
function sizeArtForEmail(html, diagnostics) {
  return String(html).replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\swidth\s*=/i.test(tag)) return tag;
    const hAttr = /\sheight\s*=\s*"(\d+)"/i.exec(tag);
    const hStyle = /style\s*=\s*"[^"]*?(?:^|;|")\s*height\s*:\s*(\d+)px/i.exec(tag);
    const h = parseInt((hStyle && hStyle[1]) || (hAttr && hAttr[1]), 10);
    const src = (/\ssrc\s*=\s*"([^"]*)"/i.exec(tag) || [])[1] || '';
    if (!h || !src) return tag;
    if (!UC_BASE.test(src)) {
      if (UC_ANY.test(src)) diagnostics.push({ image: src, error: 'not a bare Uploadcare base; Outlook may draw it at full size (D197)' });
      return tag;
    }
    const at = (px) => tag.replace(src, src + '-/resize/x' + px + '/');
    const mso = at(h).replace(/\sclass\s*=\s*"[^"]*"/i, '');
    return '<!--[if mso]>' + mso + '<![endif]--><!--[if !mso]><!-->' + at(h * 2) + '<!--<![endif]-->';
  });
}

// ---- email tidy (v1.8.0) -------------------------------------------------
// Removes HTML comments and leading indentation. Keeps Outlook conditional
// comments and failed-block markers. Collapsing a newline plus indentation
// to a newline leaves the same whitespace for layout, so nothing visible
// moves. No email template uses <pre> or <textarea>, where it would matter.
function tidyEmail(html) {
  let out = String(html).replace(/<!--([\s\S]*?)-->/g, (m, inner) => {
    if (/^\[if\s/i.test(inner)) return m;            // <!--[if mso]> ... <![endif]-->
    if (/^<!\[endif\]/i.test(inner)) return m;       // <!--<![endif]-->
    if (/<!\[endif\]$/i.test(inner)) return m;
    if (/^\s*INBXIFY render:/.test(inner)) return m; // failed-block marker
    if (/^INBXIFY \/?block/.test(inner)) return m;   // v1.19.0 Preview markers (only sent with markBlocks)
    return '';
  });
  out = out.replace(/\n[ \t]+/g, '\n').replace(/\n{2,}/g, '\n');
  // v1.13.3 — whitespace beside block and table tags
  out = out.replace(/(<\/?(?:table|tbody|thead|tr|td|th|p|div|center|h[1-6])\b[^>]*>)\s+/gi, '$1')
           .replace(/\s+(<\/?(?:table|tbody|thead|tr|td|th|p|div|center|h[1-6])\b)/gi, '$1');
  // v1.13.3 — inside style attributes
  out = out.replace(/\sstyle="([^"]*)"/g, (m, css) =>
    ' style="' + css.replace(/\s*([;:,])\s*/g, '$1').replace(/;+$/, '').trim() + '"');
  return out.replace(/^\s+/, '');
}

function byteLength(s) {
  return new TextEncoder().encode(String(s)).length;
}


// ---- web arrangement (v1.9.0, groups v1.10.0) ---------------------------
// A block's kind comes from its template's file name. 206 already requires
// an email file to be named for its block type ("email-ba-…" for BA), and
// web files follow the same pattern ("web-ba-…"), so the name is a checked
// fact, not a guess. Logged in the tracker as a naming dependency.
//   story : FA and TS (web-fa-, web-ts-) and the shared web-story- files
//   pass  : spacers and dividers; layout, not content
function blockKind(tplName, tplText) {
  if (tplText && HOUSE_RE.test(tplText)) return 'other';        // v1.13.0
  const base = String(tplName || '').split('/').pop().toLowerCase();
  if (/^(web|email)-ba-/.test(base)) return 'ba';
  if (/^(web|email)-at-/.test(base)) return 'at';
  if (/^(web|email)-(fa|ts|story)-/.test(base)) return 'story';
  if (/^(web|email)-(spacer|divider)/.test(base)) return 'pass';
  return 'other';
}

// v1.11.0: a BA placement's own label is its block text (f_blockText flat,
// or fields.blockText).
function blockLabel(block) {
  if (!block) return '';
  const v = Object.prototype.hasOwnProperty.call(block, 'f_blockText') ? block.f_blockText
    : (block.fields && block.fields.blockText);
  return String(v == null ? '' : v).trim();
}

// x_endGroup arrives flat (x_ prefix) or under block.flags.
function endFlag(block) {
  if (!block) return false;
  const v = Object.prototype.hasOwnProperty.call(block, 'x_endGroup') ? block.x_endGroup
    : (block.flags && block.flags.endGroup);
  return truthy(v);
}

// Ad groups (D142): ads placed next to each other render as groups of up to
// three under one label. Four become two pairs, five a three and a two.
// An unsold slot renders nothing and does not count. A lone ad keeps its
// own label.
// Opener groups (D145, v1.10.0): see the v1.10.0 note at the top.
function arrangeWeb(parts, kinds, ends, labels, ctx, groups) {
  const out = [];
  const n = parts.length;
  const fallbackLabel = String(ctx.lblPartners || '').trim() || 'Featured local partners';
  // a part with nothing but template comments counts as empty (an unsold slot)
  const bare = (p) => String(p || '').replace(/<!--[\s\S]*?-->/g, '').trim();
  const filled = (j) => bare(parts[j]) !== '';

  // ads[] -> list of html chunks (a lone ad, or a labelled mat of 2-3)
  const adChunks = (ads, at) => {
    const res = [];
    // v1.11.0: ads are indexes into parts; a group's label is its first placement label
    if (ads.length < 2) { res.push(...ads.map((j) => parts[j])); if (ads.length) groups.push({ at, ads: 1 }); return res; }
    const count = Math.ceil(ads.length / 3);
    let k = 0;
    for (let g = 0; g < count; g++) {
      const size = Math.ceil((ads.length - k) / (count - g));
      const chunk = ads.slice(k, k + size);
      k += size;
      const own = chunk.map((n) => labels[n]).find((t) => t);
      const label = esc(own || fallbackLabel);
      groups.push({ at, ads: chunk.length, label: own ? 'placement' : 'labels/default' });
      res.push(chunk.length === 1 ? parts[chunk[0]]
        : '<div class="nlw-ba-group">\n<div class="nlw-ba-group-label">' + label +
          '</div>\n<div class="nlw-ba-group-mat">\n' + chunk.map((n) => parts[n]).join('\n') + '\n</div>\n</div>');
    }
    return res;
  };

  // A span of ads, spacers and dividers starting at j. Ads that sit next to
  // each other (spacers/dividers between them break a mat) become ad groups.
  // Returns { html[], next, endFlagged }.
  const span = (j) => {
    const html = [];
    let ads = [], adStart = j, flagged = false;
    const flush = () => { if (ads.length) html.push(...adChunks(ads, adStart)); ads = []; };
    while (j < n && (kinds[j] === 'ba' || kinds[j] === 'pass')) {
      if (kinds[j] === 'ba') {
        if (!ads.length) adStart = j;
        if (filled(j)) ads.push(j);
      } else {
        flush();
        html.push(parts[j]);
      }
      if (ends[j]) { flagged = true; j++; break; }
      j++;
    }
    flush();
    return { html, next: j, endFlagged: flagged };
  };

  let i = 0;
  while (i < n) {
    if (kinds[i] === 'ba' || kinds[i] === 'pass') {
      const s = span(i);
      out.push(...s.html);
      i = s.next;
      continue;
    }
    if (kinds[i] === 'at') {
      const run = [parts[i]];
      let j = i + 1, held = 0, why = 'end of issue';
      if (ends[i]) {
        why = 'end-group on opener';
      } else {
        while (j < n) {
          if (kinds[j] === 'at') { why = 'next opener'; break; }
          if (kinds[j] === 'story') {
            run.push(parts[j]);
            if (bare(parts[j]) !== '') held++;
            if (ends[j]) { j++; why = 'end-group'; break; }
            j++;
            continue;
          }
          if (kinds[j] === 'ba' || kinds[j] === 'pass') {
            const s = span(j);
            if (s.endFlagged) { run.push(...s.html); j = s.next; why = 'end-group'; break; }
            // keep the span only when a story follows it inside the group
            if (s.next < n && kinds[s.next] === 'story') { run.push(...s.html); j = s.next; continue; }
            why = s.next < n ? 'trailing ads, then a non-story block' : 'trailing ads, end of issue';
            break;
          }
          why = 'non-story block';
          break;
        }
      }
      out.push('<div class="nlw-run nlw-run--at">\n' + run.join('\n') +
        (held ? '\n<div class="nlw-run-end" aria-hidden="true"></div>' : '') + '\n</div>');
      groups.push({ at: i, run: held, ended: why });
      i = j;
      continue;
    }
    out.push(parts[i]);
    i++;
  }
  return out.join('\n');
}

// ---- email plan and arrangement (v1.12.0) ---------------------------------
// planEmail walks the blocks the way arrangeWeb does, but on kinds and
// end flags only, so it can run before rendering. Segments:
//   { type:'run', at, members:[i...], held, ended }  an opener and its group
//   { type:'span', items:[i...] }                    ads, spacers, dividers
//   { type:'one', at }                               any other block
// Inside a run, members lists every block after the opener (stories, and
// the ads/spacers between them); ads keep their place in the order.
function planEmail(kinds, ends) {
  const n = kinds.length, out = [];
  const isAdOrPass = (j) => kinds[j] === 'ba' || kinds[j] === 'pass';
  // a span of ads/spacers starting at j: { items, next, endFlagged }
  const span = (j) => {
    const items = []; let flagged = false;
    while (j < n && isAdOrPass(j)) {
      items.push(j);
      if (ends[j]) { flagged = true; j++; break; }
      j++;
    }
    return { items, next: j, endFlagged: flagged };
  };
  let i = 0;
  while (i < n) {
    if (isAdOrPass(i)) { const s = span(i); out.push({ type: 'span', items: s.items }); i = s.next; continue; }
    if (kinds[i] === 'at') {
      const members = []; let j = i + 1, held = 0, why = 'end of issue';
      if (ends[i]) {
        why = 'end-group on opener';
      } else {
        while (j < n) {
          if (kinds[j] === 'at') { why = 'next opener'; break; }
          if (kinds[j] === 'story') {
            members.push(j); held++;
            if (ends[j]) { j++; why = 'end-group'; break; }
            j++; continue;
          }
          if (isAdOrPass(j)) {
            const s = span(j);
            if (s.endFlagged) { members.push(...s.items); j = s.next; why = 'end-group'; break; }
            if (s.next < n && kinds[s.next] === 'story') { members.push(...s.items); j = s.next; continue; }
            why = s.next < n ? 'trailing ads, then a non-story block' : 'trailing ads, end of issue';
            break;
          }
          why = 'non-story block'; break;
        }
      }
      out.push({ type: 'run', at: i, members, held, ended: why });
      i = j; continue;
    }
    out.push({ type: 'one', at: i });
    i++;
  }
  out.kinds = kinds;
  return out;
}

function arrangeEmail(parts, plan, labels, ctx, groups) {
  if (!plan) return parts.join('\n');
  const bare = (p) => String(p || '').replace(/<!--[\s\S]*?-->/g, '').trim();
  const filled = (j) => bare(parts[j]) !== '';
  const fallbackLabel = String(ctx.lblPartners || '').trim() || 'Featured local partners';
  const stripLabel = (html) => String(html).replace(/<!--\s*ix-label\s*-->[\s\S]*?<!--\s*\/ix-label\s*-->/g, '');
  const labelRow = (text) =>
    '<tr><td align="center" style="padding:0 0 10px;"><span style="font-family:' + (ctx['font-ui'] || 'Arial,sans-serif') +
    ';font-size:' + (ctx['t-label'] || '10px') + ';font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:' +
    (ctx['text-mid'] || '#5A6478') + ';">' + esc(text) + '</span></td></tr>';

  // a list of indexes of ads/spacers -> html rows, with ad groups (D142)
  const spanHtml = (items, at) => {
    const html = []; let ads = [];
    const flush = () => {
      const sold = ads.filter(filled);
      // unsold slots render nothing; keep their (empty) output in place
      ads.filter((j) => !filled(j)).forEach((j) => html.push(parts[j]));
      if (sold.length === 1) { html.push(parts[sold[0]]); groups.push({ at, ads: 1, surface: 'email' }); }
      else if (sold.length > 1) {
        const count = Math.ceil(sold.length / 3); let k = 0;
        for (let g = 0; g < count; g++) {
          const size = Math.ceil((sold.length - k) / (count - g));
          const chunk = sold.slice(k, k + size); k += size;
          if (chunk.length === 1) { html.push(parts[chunk[0]]); groups.push({ at, ads: 1, surface: 'email' }); continue; }
          const own = chunk.map((x) => labels[x]).find((t) => t);
          groups.push({ at, ads: chunk.length, label: own ? 'placement' : 'labels/default', surface: 'email' });
          html.push(labelRow(own || fallbackLabel) + '\n' + chunk.map((x) => stripLabel(parts[x])).join('\n'));
        }
      }
      ads = [];
    };
    // spacers and dividers between ads break a group, as on web
    for (const j of items) {
      if (plan.kinds[j] === 'ba') { ads.push(j); continue; }
      flush(); html.push(parts[j]);
    }
    flush();
    return html;
  };

  const out = [];
  for (const seg of plan) {
    if (seg.type === 'one') { out.push(parts[seg.at]); continue; }
    if (seg.type === 'span') { out.push(...spanHtml(seg.items, seg.items[0])); continue; }
    // run: opener row, then members (stories as they are, ads/spacers grouped)
    const rows = [parts[seg.at]];
    let buf = [];
    const flushBuf = () => { if (buf.length) rows.push(...spanHtml(buf, buf[0])); buf = []; };
    for (const j of seg.members) {
      if (plan.kinds[j] === 'story') { flushBuf(); rows.push(parts[j]); }
      else buf.push(j);
    }
    flushBuf();
    const radius = tok(ctx, 'grp-radius'), pad = tok(ctx, 'grp-pad'),
          gap = tok(ctx, 'grp-gap'), edgeW = tok(ctx, 'grp-edge-w');
    out.push(
      '<tr><td style="padding:0 0 ' + gap + ';">\n' +
      '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="' + seg.tint + '" ' +
      'style="background-color:' + seg.tint + ';border-radius:' + radius + ';">\n' +
      '<tr><td class="grp-pad" style="padding:' + pad + ';border-left:' + edgeW + ' solid ' + seg.edge + ';border-radius:' + radius + ';">\n' +
      '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">\n' +
      rows.join('\n') +
      '\n</table>\n</td></tr>\n</table>\n</td></tr>');
    groups.push({ at: seg.at, run: seg.held, ended: seg.ended, tone: seg.tone,
      toneFrom: seg.marker ? 'template marker' : 'default (accent)', edge: seg.edge, tint: seg.tint, surface: 'email' });
  }
  return out.join('\n');
}

// a token, else its platform fallback
function tok(ctx, name) {
  const v = ctx && ctx[name];
  return (v == null || v === '') ? GRP_DEFAULTS[name] : String(v);
}

// colour at pct% over white, as #RRGGBB. Accepts #RGB or #RRGGBB;
// anything else comes back unchanged (and debug shows it).
function mixHex(hex, pct) {
  const h = String(hex || '').trim();
  let m = /^#([0-9a-f]{6})$/i.exec(h);
  if (!m) {
    const s = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(h);
    if (!s) return h;
    m = [null, s[1] + s[1] + s[2] + s[2] + s[3] + s[3]];
  }
  const p = Math.max(0, Math.min(100, parseFloat(pct))) / 100;
  if (!isFinite(p)) return h;
  const c = [0, 2, 4].map((o) => parseInt(m[1].slice(o, o + 2), 16));
  return '#' + c.map((v) => Math.round(v * p + 255 * (1 - p)).toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ---- tokens (v1.4.0) -----------------------------------------------------
// Fetch the title file, then each file it extends. Merge in order:
// extends[0] (platform), extends[1] (publisher), ..., then the title file.
// Keys starting with "_" and the "extends" key are notes, not tokens.
async function fetchJSON(file, diagnostics) {
  try {
    const res = await fetch(CDN(file), { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!res.ok) { diagnostics.push({ tokens: file, status: res.status, error: 'fetch failed' }); return null; }
    return await res.json();
  } catch (err) {
    diagnostics.push({ tokens: file, error: 'not valid JSON or fetch error: ' + String(err) });
    return null;
  }
}

async function loadTokens(titleFile, diagnostics, overrides) {
  const title = await fetchJSON(titleFile, diagnostics);
  const parents = (title && Array.isArray(title.extends)) ? title.extends : [];
  const parentData = await Promise.all(parents.map((f) => fetchJSON(f, diagnostics)));
  const merged = {};
  for (const layer of [...parentData, title]) {
    if (!layer) continue;
    for (const [k, v] of Object.entries(layer)) {
      if (k === 'extends' || k.startsWith('_')) continue;
      merged[k] = v;
    }
  }
  // v1.22.0 — the title layer beats every file
  if (overrides) for (const [k, v] of Object.entries(overrides)) merged[k] = v;
  return { files: [...parents, titleFile], values: resolveRefs(merged, diagnostics) };
}

// "@name" means "the value of name". Chains are followed; loops and
// unknown names are reported and resolve to empty.
// v1.22.0 — "mix(a, b, p)" is a with p% of b, a and b each "@name" or hex.
const MIX_RE = /^mix\(\s*([^,()]+?)\s*,\s*([^,()]+?)\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)$/i;
function resolveRefs(tokens, diagnostics) {
  const out = {};
  const walk = (k, seen) => {
    if (Object.prototype.hasOwnProperty.call(out, k)) return out[k];
    const v = tokens[k];
    if (typeof v !== 'string') return v;
    const m = MIX_RE.exec(v.trim());
    if (m) {
      const arg = (a) => {
        if (!a.startsWith('@')) return a;
        const ref = a.slice(1);
        if (seen.has(ref)) { diagnostics.push({ token: k, error: 'reference loop via @' + ref }); return ''; }
        if (!Object.prototype.hasOwnProperty.call(tokens, ref)) {
          diagnostics.push({ token: k, error: 'unknown reference @' + ref }); return '';
        }
        const r = walk(ref, new Set([...seen, ref]));
        out[ref] = r;
        return r;
      };
      const res = mixTwo(arg(m[1]), arg(m[2]), m[3]);
      if (!res) diagnostics.push({ token: k, error: 'mix could not be worked out: ' + v });
      return res;
    }
    if (!v.startsWith('@')) return v;
    const ref = v.slice(1);
    if (seen.has(ref)) { diagnostics.push({ token: k, error: 'reference loop via @' + ref }); return ''; }
    if (!Object.prototype.hasOwnProperty.call(tokens, ref)) {
      diagnostics.push({ token: k, error: 'unknown reference @' + ref }); return '';
    }
    seen.add(ref);
    return walk(ref, seen);
  };
  for (const k of Object.keys(tokens)) out[k] = walk(k, new Set([k]));
  return out;
}

// v1.22.0 — a with pct% of b, as #RRGGBB. Both must be #RGB or #RRGGBB.
function hex6(h) {
  const s = String(h || '').trim();
  let m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) return m[1];
  m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(s);
  return m ? m[1] + m[1] + m[2] + m[2] + m[3] + m[3] : '';
}
function mixTwo(a, b, pct) {
  const x = hex6(a), y = hex6(b);
  const p = parseFloat(pct);
  if (!x || !y || !isFinite(p)) return '';
  const q = Math.max(0, Math.min(100, p)) / 100;
  const c = (h, o) => parseInt(h.slice(o, o + 2), 16);
  return '#' + [0, 2, 4].map((o) => Math.round(c(x, o) * (1 - q) + c(y, o) * q)
    .toString(16).padStart(2, '0')).join('').toUpperCase();
}

// v1.22.1 — any CSS colour a field may hold, as #RRGGBB: #rgb, #rrggbb,
// #rrggbbaa, rgb()/rgba(), hsl()/hsla(), comma or space syntax. Alpha is
// dropped (a title colour is solid). Anything else: ''.
function toHex(v) {
  const s = String(v == null ? '' : v).trim().toLowerCase();
  let m = /^#([0-9a-f]{3})$/.exec(s);
  if (m) return '#' + m[1].split('').map((c) => c + c).join('').toUpperCase();
  m = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/.exec(s);
  if (m) return '#' + m[1].toUpperCase();
  m = /^(rgba?|hsla?)\(\s*([^)]*)\)$/.exec(s);
  if (!m) return '';
  const parts = m[2].replace(/\//g, ' ').split(/[\s,]+/).filter(Boolean);
  if (parts.length < 3) return '';
  const num = (p) => parseFloat(p);
  const hex2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  if (m[1].startsWith('rgb')) {
    const ch = parts.slice(0, 3).map((p) => (p.endsWith('%') ? num(p) * 2.55 : num(p)));
    if (ch.some((x) => !isFinite(x))) return '';
    return ('#' + ch.map(hex2).join('')).toUpperCase();
  }
  let h = num(parts[0]); const sat = num(parts[1]) / 100, lit = num(parts[2]) / 100;
  if (/turn$/.test(parts[0])) h *= 360;
  if (/rad$/.test(parts[0])) h = h * 180 / Math.PI;
  if (![h, sat, lit].every(isFinite)) return '';
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * lit - 1)) * sat, x = c * (1 - Math.abs((h / 60) % 2 - 1)), o = lit - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return ('#' + [r, g, b].map((n) => hex2((n + o) * 255)).join('')).toUpperCase();
}

// ---- the title layer (v1.22.0) ----------------------------------------------
// context.title key -> the token it sets, the TITLES field name (for the
// 422 message) and what it holds. HC-P-TD1-1.
const TITLE_MAP = [
  { key: 'main',        token: 'ink',          field: 'Primary Color Swatch',          kind: 'colour' },
  { key: 'accent',      token: 'accent',       field: 'Secondary Color Swatch',        kind: 'colour' },
  { key: 'highlight',   token: 'highlight',    field: 'Highlight Color',     kind: 'colour' },
  { key: 'paper',       token: 'paper',        field: 'Paper',         kind: 'colour' },
  { key: 'text',        token: 'text',         field: 'Text Color',    kind: 'colour' },
  { key: 'accent2',     token: 'accent-2',     field: 'Second Accent', kind: 'colour' },
  { key: 'footer',      token: 'end-bg',       field: 'Footer Color',  kind: 'colour' },
  { key: 'fontDisplay', token: 'font-display', field: 'Display Font',  kind: 'font', fallback: 'font-fallback-serif' },
  { key: 'fontBody',    token: 'font-body',    field: 'Body Font',     kind: 'font', fallback: 'font-fallback-serif' },
  { key: 'fontUi',      token: 'font-ui',      field: 'UI Font',       kind: 'font', fallback: 'font-fallback-sans' },
  { key: 'logoOnMain',  token: 'logo-on-main', field: 'Logo on Main',  kind: 'text' },
  { key: 'signoffRole', token: 'signoff-role', field: 'Sign-off Role', kind: 'text' },
];

// The twelve values, checked. Fonts keep only the family name here; the
// chain is built in finishTitle once the platform fallbacks are known.
function titleLayer(t) {
  const tokens = {}, missing = [], families = {};
  for (const m of TITLE_MAP) {
    const v = String(t[m.key] == null ? '' : t[m.key]).trim();
    if (!v) { missing.push(m.field + ' is empty'); continue; }
    if (m.kind === 'colour') {
      const hx = toHex(v);                          // v1.22.1: any CSS colour form
      if (!hx) { missing.push(m.field + ' is not a colour (' + v + ')'); continue; }
      tokens[m.token] = hx;
    } else if (m.kind === 'font') {
      const fam = v.replace(/["'`]/g, '').split(',')[0].replace(/[^A-Za-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
      if (!fam) { missing.push(m.field + ' is not a font family name (' + v + ')'); continue; }
      families[m.token] = fam;
      tokens[m.token] = "'" + fam + "'";          // finished in finishTitle
    } else {
      tokens[m.token] = v;
    }
  }
  return { tokens, missing, families };
}

// After the merge: font chains, the font link and the web variables.
function finishTitle(values, report, diagnostics) {
  const fams = [];
  for (const m of TITLE_MAP) {
    if (m.kind !== 'font' || !report.families[m.token]) continue;
    const fam = report.families[m.token];
    const fb = String(values[m.fallback] || '').trim();
    if (!fb) diagnostics.push({ token: m.fallback, error: 'platform font fallback missing' });
    values[m.token] = "'" + fam + "'" + (fb ? ',' + fb : '');
    report.tokens[m.token] = values[m.token];
    const w = String(values['font-weights-' + m.token.replace('font-', '')] || '400,700').replace(/\s+/g, '');
    fams.push(fam.replace(/ /g, '+') + ':' + w);
  }
  const extra = String(values['font-link-extra'] || '').trim();
  if (extra) fams.push(extra);
  const seen = new Set();
  const list = fams.filter((f) => { const k = f.split(':')[0].toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  values['font-link'] = 'https://fonts.googleapis.com/css?family=' + list.join('|') + '&display=swap';
  const names = String(values['web-vars'] || '').split(',').map((s) => s.trim()).filter(Boolean);
  values['web-vars'] = names
    .filter((n) => values[n] != null && String(values[n]).trim() !== '')
    .map((n) => '--nl-' + n + ':' + String(values[n]).replace(/[;{}<>]/g, '') + ';').join('');
}

// v1.13.1 — "{key}" in a link pattern takes ctx[key], URL-encoded ("@" kept
// so mailto addresses read cleanly). v1.13.2 — "{&key}" takes it as it is.
// Any empty key: no link.
function fillLink(pattern, ctx) {
  const p = String(pattern || '').trim();
  if (!p) return '';
  let missing = false;
  const out = p.replace(/\{(&?)([\w.-]+)\}/g, (m, raw, k) => {
    const v = String(lookup(ctx, k) == null ? '' : lookup(ctx, k)).trim();
    if (!v) { missing = true; return ''; }
    if (raw) return v;
    return encodeURIComponent(v).replace(/%40/g, '@');
  });
  return missing ? '' : out;
}

// ---- weather (v1.13.0) ----------------------------------------------------
// One forecast call to Open-Meteo. Returns { ok, days } or { ok:false, error }.
async function getForecast(o) {
  const lat = parseFloat(o.lat), lon = parseFloat(o.lon);
  if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return { ok: false, state: 'no-place', error: 'lat and lon must be numbers' };
  }
  const n = clampInt(o.days, 5, 1, 7);
  const phone = clampInt(o.phone, 3, 1, n);
  const tz = String(o.tz || '').trim() || 'auto';
  const unit = String(o.unit || '').trim().toLowerCase();
  // v1.18.0: a given date is used as-is or not at all (never today instead)
  const when = issueDate(o.date, n, tz);
  if (when.state !== 'ok' && (o.requireDate || when.state !== 'no-date')) {
    return Object.assign({ ok: false }, when);
  }
  const start = when.state === 'ok' ? when.date : '';
  const p = new URLSearchParams({
    latitude: lat.toFixed(4), longitude: lon.toFixed(4),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min', timezone: tz,
  });
  if (unit === 'fahrenheit' || unit === 'celsius') p.set('temperature_unit', unit);
  if (start) { p.set('start_date', start); p.set('end_date', addDaysISO(start, n - 1)); }
  else p.set('forecast_days', String(n));
  const api = 'https://api.open-meteo.com/v1/forecast?' + p.toString();
  try {
    const res = await fetch(api, { cf: { cacheTtl: 3600, cacheEverything: true } });
    if (!res.ok) return { ok: false, state: 'failed', date: start, error: 'forecast fetch ' + res.status, url: api };
    const d = (await res.json() || {}).daily || {};
    const dates = d.time || [];
    if (!dates.length) return { ok: false, state: 'failed', date: start, error: 'forecast had no days', url: api };
    const deg = String.fromCharCode(176);
    const days = dates.slice(0, n).map((date, i) => ({
      date,
      day: new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })
        .format(new Date(date + 'T12:00:00Z')),
      icon: WX_ICONS[d.weather_code && d.weather_code[i]] || WX_ICON_UNKNOWN,
      hi: Math.round(d.temperature_2m_max[i]) + deg,
      lo: Math.round(d.temperature_2m_min[i]) + deg,
      phoneHide: i >= phone,
    }));
    return { ok: true, state: 'ready', date: start || 'today', days, start: start || 'today', tz, unit: unit || 'celsius' };
  } catch (err) {
    return { ok: false, state: 'failed', date: start, error: 'forecast error: ' + String(err) };
  }
}

// v1.18.0: the issue's date, checked, never swapped. A date-only value or a
// midnight-UTC timestamp (how Webflow stores a date) keeps its calendar day.
// "Today" is today in the title's time zone (UTC when none is given).
// Open-Meteo forecasts 16 days, so an n-day strip can start up to 16 - n
// days ahead (FORECAST_DAYS, HC-R-18-2: Open-Meteo's own limit).
const FORECAST_DAYS = 16;
function issueDate(v, n, tz) {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v || '').trim());
  if (!m) return { state: 'no-date' };
  const today = todayIn(tz);
  const last = addDaysISO(today, FORECAST_DAYS - n);
  if (m[1] < today) return { state: 'past', date: m[1], today };
  if (m[1] > last) return { state: 'too-far', date: m[1], today,
    availableOn: addDaysISO(m[1], -(FORECAST_DAYS - n)) };
  return { state: 'ok', date: m[1] };
}
function todayIn(tz) {
  const zone = String(tz || '').trim();
  try {
    if (zone && zone !== 'auto') {
      return new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' })
        .format(new Date());
    }
  } catch (e) { /* unknown zone: fall through to UTC, reported by the date check */ }
  return new Date().toISOString().slice(0, 10);
}
// The compact X-IX-Weather value: state, publish date, and what applies.
function weatherHeader(r) {
  const h = { state: r.state || (r.ok ? 'ready' : 'failed') };
  if (r.date) h.date = r.date;
  if (r.availableOn) h.availableOn = r.availableOn;
  if (r.today) h.today = r.today;
  if (r.error) h.error = String(r.error).slice(0, 120);
  return h;
}

function addDaysISO(iso, k) {
  return new Date(Date.parse(iso + 'T00:00:00Z') + k * 86400000).toISOString().slice(0, 10);
}

function clampInt(v, dflt, lo, hi) {
  const x = parseInt(v, 10);
  return isFinite(x) ? Math.max(lo, Math.min(hi, x)) : dflt;
}

function normalize(block) {
  if (block.fields || block.flags) {
    return { fields: block.fields || {}, flags: block.flags || {} };
  }
  const fields = {}, flags = {};
  for (const [k, v] of Object.entries(block)) {
    if (k.startsWith('f_')) fields[k.slice(2)] = v;
    else if (k.startsWith('x_')) flags[k.slice(2)] = v;
    else if (Array.isArray(v)) fields[k] = v;
  }
  fields.blockType = block.blockType;
  fields.position = block.position;
  return { fields, flags };
}

function render(tpl, fields, flags, ctx) {
  let out = String(tpl);
  out = renderLoops(out, fields, flags, ctx);
  out = renderSections(out, flags, fields, ctx);
  out = renderTokens(out, fields, ctx);
  return out;
}

function renderLoops(tpl, fields, flags, ctx) {
  return tpl.replace(/\{\{#each\s+([\w.-]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (m, key, body) => {
    const list = lookup(fields, key);
    if (!Array.isArray(list) || list.length === 0) return '';
    return list.map((item, idx) => {
      const scoped = (item && typeof item === 'object') ? item : { value: item };
      const itemFlags = Object.assign({}, flags, scoped.flags || {}, {
        first: idx === 0,
        last: idx === list.length - 1,
        only: list.length === 1,
      });
      let chunk = body.replace(/\{\{(&?)\.([\w.-]+)\}\}/g, (mm, raw, k) => {
        const v = lookup(scoped, k);
        return v == null ? '' : (raw ? String(v) : esc(String(v)));
      });
      chunk = renderSections(chunk, itemFlags, scoped, ctx);
      return renderTokens(chunk, Object.assign({}, fields, scoped), ctx);
    }).join('');
  });
}

function renderSections(tpl, flags, fields, ctx) {
  const test = (key) => {
    if (flags && Object.prototype.hasOwnProperty.call(flags, key)) return truthy(flags[key]);
    if (key.startsWith('ctx.')) return truthy(lookup(ctx || {}, key.slice(4)));
    const f = lookup(fields || {}, key);
    if (f !== undefined) return truthy(f);
    return truthy(lookup(flags || {}, key));
  };
  let out = tpl;
  for (let pass = 0; pass < 12; pass++) {
    const before = out;
    out = out.replace(/\{\{#([\w.-]+)\}\}((?:(?!\{\{[#^]).)*?)\{\{\/\1\}\}/gs,
      (m, key, body) => test(key) ? body : '');
    out = out.replace(/\{\{\^([\w.-]+)\}\}((?:(?!\{\{[#^]).)*?)\{\{\/\1\}\}/gs,
      (m, key, body) => test(key) ? '' : body);
    if (out === before) break;
  }
  return out;
}

function renderTokens(tpl, fields, ctx) {
  return tpl.replace(/\{\{(&?)([\w.-]+)\}\}/g, (m, raw, key) => {
    if (key === 'BLOCKS') return m;
    const src = key.startsWith('ctx.') ? ctx : fields;
    const path = key.startsWith('ctx.') ? key.slice(4) : key;
    const v = lookup(src, path);
    if (v == null) return '';
    return raw ? String(v) : esc(String(v));
  });
}

function lookup(obj, path) {
  if (!obj) return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, path)) return obj[path];
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function truthy(v) {
  if (v == null) return false;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s !== '' && s !== '0' && s !== 'false' && s !== 'no';
  }
  if (Array.isArray(v)) return v.length > 0;
  return Boolean(v);
}

function esc(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// A failed block renders as a visible marker, never as silence.
function errorBlock(msg, debug) {
  const safe = esc(String(msg));
  if (!debug) return `<!-- INBXIFY render: ${safe} -->`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr><td style="padding:14px;background:#fff3f0;border:1px solid #cc5500;
font-family:Arial,sans-serif;font-size:12px;color:#7a2e00;">
INBXIFY render error — ${safe}</td></tr></table>`;
}

function json(obj, status) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  });
}

// v1.21.0 — a 6-digit hex colour mixed 35% over white (web-blocks' section-art rule mix). Null when not a hex.
function mix35(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const ch = (x) => Math.round(x * 0.35 + 255 * 0.65).toString(16).padStart(2, '0');
  return '#' + ch((n >> 16) & 255) + ch((n >> 8) & 255) + ch(n & 255);
}
