// ix-perf-v1.2.1.js
// INBXIFY · Cloudflare Worker · ix-perf · the performance collector and its reads
//
// v1.2.1 (24 Nov 2026, Performance Report S5) — OUR OWN EMAIL CLICK COUNT: GET /r (Jeff, 24 Nov: the list vendor's own
//   click links fail on phones, so we count clicks ourselves and can ask a vendor to send our links as they are).
//   1 · GET /r/<NEWSLETTERS item id>/<sender>/<the destination, base64url>     (also HEAD)
//       The address ix-issue-data v1.0.211 writes into a downloaded email in place of each link that leaves our site.
//       It holds only letters, digits, "-", "_" and "/": no "?", no "&", no "%", so a vendor's own link wrapper, a mail
//       program or a scanner cannot mangle it. The reader is sent on at once (302) to the destination, unchanged.
//       · WHERE IT MAY SEND A READER. Only to a link of that newsletter: the destination (compared without utm codes), or
//         at least its site, must be in the newsletter's compiled email in the CMS copy. So localtap.link cannot be used
//         by a stranger to bounce people to an address of their choosing.
//           in the compiled email                                         -> 302
//           the compiled email is read, and the destination is not in it  -> 404, nothing counted
//           the compiled email cannot be read (no row yet, no CMS_DB)     -> a small page with one link to the
//             destination's site, so a real reader is never stranded and nothing is sent on unseen
//         The list of a newsletter's links is kept 10 minutes (1 minute when it could not be read).
//       · THE COUNT. A GET writes one row to clicks: source "localtap", kind "email", link_code = the sender, issue_id,
//         issue_code, and the spot (utm_content), advertiser (utm_term) and destination taken from the link itself.
//         A HEAD is a link checker: sent on, not counted. Scanner clicks are not separated (Jeff, 17 Nov). The row is
//         written after the reader has been sent on, so counting never slows or blocks the click.
//       · Raw counts shows these as Click on the surface Email, with no change to quill-performance.
//   2 · EDITIONS READS OUR EMAIL CLICKS. On GET /edition a sender's clicks counted by /r fill that source's column, line
//       by line and in its Clicks total, until that source has clicks typed in or uploaded; then the source's own are
//       used and ours are not added (the same rule as opens). sources[].clicksFrom says "ours" or "source".
//       ours.clicksBySender is in the answer. A sender we have clicks for is a source in use.
//   3 · /health adds emailClicks24.
//   4 · LINE NAMES, from the first real screen (WLN-124B, 24 Nov): a franchise band link that is a picture with no words
//       reads the franchise's name from its page address (recipe-corner -> Recipe Corner), not "www.inbxify.com";
//       every numbered character code in a link's words is decoded (&#128222; is a telephone).
//   No schema change (clicks has held source, link_code and kind since v1.0.0). No new variable or binding.
//   HARDCODING (provisional): HC-P-PR5-9 the /r path shape, the 10 minute and 1 minute keeps, the 2,400 character limit
//     and the shape named for each spot code on a click row (R_SHAPE); HC-P-PR5-10 the words of the small page.
//
// v1.2.0 (17 Nov 2026, Performance Report S5) — THE EDITIONS AND SITE SCREENS (mockup v0.6, Jeff's rulings of 17 Nov).
//   Four new staff-only routes for Quill Performance (quill-performance v1.1.0), email opens in Raw counts, and article
//   pages opened from an issue page now count toward that edition.
//   1 · GET /editions   Every NEWSLETTERS item in the CMS copy with its issue code (its PUBLICATION PLANS name), newest
//       first: { id, code, name, publisher, title, titleAdmin, series, data }. data = this store holds numbers for it.
//       series is the code without its last letter (WLN-123A is in WLN-123).
//   2 · GET /edition?n=<NEWSLETTERS item id>[&roll=1]   One edition:
//         edition  { id, code, name, publisher, title, sentDay, series, siblings:[{id, code}] }
//         sources  the sources that hold data for this edition, worked out (ruling 1.8): Our count first, then each typed
//                  or uploaded source, then any sender our open picture has counted. Never ticked.
//         top      { sends, opens, clicks } per source. Our count has clicks only (clicks on the issue page).
//         groups   every link of the compiled email (NEWSLETTERS email-render-html, else web-render-html, read from the
//                  CMS copy: "what ran" comes from the compiled issue, not from clicks), one line per link, grouped as
//                  the IPP pickers group them. The spot is the link's own utm_content (FA-b24, BA-b3 ...):
//                    Editorial  FA Feature articles · FA with a franchise band or sponsor in the same block, and FR,
//                               Franchise stories · EV Events · RE On the Market (Jeff, 17 Nov: Editorial)
//                    Revenue    BA and HA Banner ads · SP Franchise sponsors · TXA The Find text ads · PA Paid article links
//                    Other      every link with no spot code (and phone, text and email links)
//                  A franchise story and its sponsor's ad are separate lines. Each line: clicks per source, views per
//                  source, its block position and its share on the curve.
//         curve    THE VIEWS CURVE (ruling 1.4, HC-P-PR4-11): 100% at the first block, 18% at the last, a straight line
//                  between, by where the block sits among the issue's blocks (its NL-BLOCKS rows in the CMS copy; if
//                  those do not hold every linked position, among the blocks that carry links, and the answer says so).
//                  Email views = that source's opens x the block's share. One rule for every email. Not editable.
//         ours     our open picture's count per sender (email_opens.list), and the count with no sender named.
//       OUR COUNT per line: clicks on the issue page matched to the line by address, then by spot; ads seen on the issue
//         page by spot; page views of the line's own page that belong to this edition. Clicks on the issue page that
//         match no line are one line under Other links, so the column adds up.
//       OPENS (Jeff, 17 Nov, question 10): a source's own number is the one used. Until it is in, our open picture's
//         count for that sender fills the cell (opensFrom 'ours'). Our count is never added to a source's own.
//       roll=1 answers the series added up (every edition whose code shares the series, same title): each number is the
//         editions' numbers added, and a line is the same link in the same group.
//   3 · GET /site?days=7|28|90[&title=<TITLES slug>]   Pages tied to no edition (no issue code, no issue id, not an
//       issue page). Our count only. pages: per kind of page, pages opened, readers and clicks, with its addresses.
//       ads: per advertiser, shape and kind of page, views (seen) and clicks. No polling: the page asks on Refresh.
//   4 · POST /typed   Typed and uploaded numbers per edition and source (rulings 1.7, 3.2, 3.3; question 9: Stirista and
//       Mailchimp are typed or uploaded the same way until their intakes exist). Sends, opens, clicks per source and
//       clicks per line. A typed number replaces what was there and is the number every read uses. Every change is also
//       written to edition_log with who entered it and when. Staff only, through MEMBERS, as /raw.
//   5 · RAW COUNTS gains the event email_open (one row per load of our open picture). Surface reads email; the sender is
//       in label; the reader column holds the recipient value when the sender filled one in.
//   6 · WHICH SCREEN COUNTS A PAGE VIEW (Jeff, 17 Nov, question 3): the edition, when the reader came from its email, is
//       on its issue page, or clicked through from its issue page; otherwise the site; never both. The first two were
//       already stored. The third is filled in here: an article or franchise page view with no issue, reached from
//       inside the site, whose visit's page view just before it was an issue page, takes that issue (and so do its ads
//       and clicks). Done with the other fill-ins, at most every 5 minutes, on /raw, /edition and /site.
//   NEEDS (Cloudflare D1 console, once): ix-perf-schema-v1.0.3-console.sql (three new tables; nothing existing changes).
//     Until it is run, /edition answers with a warning naming the file and POST /typed refuses with the same words.
//   Collection (POST /c), /o, /config and /sources are unchanged. CORS already allows POST and Authorization.
//   HARDCODING (provisional, for the S5 delta): HC-P-PR4-11 the curve 100 / 18; HC-P-PR5-1 the spot codes and their
//     picker groups (SPOTS, GROUPS); HC-P-PR5-2 the provider names and their order (PROVIDERS) and the sender values
//     that name no source (email, unknown); HC-P-PR5-3 the NEWSLETTERS field slugs email-render-html, web-render-html
//     and publish-date; HC-P-PR5-4 the words (W5, SHAPE_W, KIND_W, GENERIC_WORDS); HC-P-PR5-5 limits (600 editions,
//     numbers to 1,000,000,000, site periods 7 / 28 / 90, 40 addresses a kind); HC-P-PR5-6 the visit fill-in window
//     (3 days; 35 days the first time an isolate runs it).
//
// v1.1.5 (17 Nov 2026, Performance Report S4) — THE EMAIL OPEN PICTURE: GET /o.
//   Jeff, 17 Nov: build our own open counter now, so the next Stirista send can be the test. Rulings the same day:
//   count TOTAL opens from every source (a second open is a second open), and one tracking domain, localtap.link,
//   served by this Worker.
//   1 · GET /o?n=<NEWSLETTERS item id>&s=<sender>&r=<recipient value, optional>
//       Answers a 1 x 1 transparent GIF, always, whatever happens (a broken picture must never show in an email), with
//       Cache-Control no-store so a mail program asks again on the next open. One email_opens row is written per load
//       (schema v1.0.2 already has the table; nothing to run in D1). The write happens after the picture is sent.
//         issue_id    n, when it looks like an item id. Otherwise nothing is written.
//         issue_code  the issue's PUBLICATION PLANS name, looked up as for site pages (v1.1.3). Blank if not found.
//         list        s, lower case, letters digits and hyphens (stirista, mailchimp, ...). Blank becomes 'unknown'.
//         recipient   r, only when a sender filled it in. A merge tag left as typed (RECIPIENT_ID, *|...|*, {{...}},
//                     %%...%%, [...]) is stored as blank, so an unfilled tag is never counted as one reader.
//         first_open  1 when r is filled and no earlier row has this issue, list and recipient.
//         ua_class    gmail | yahoo | outlook | apple | other, read from the User-Agent. apple = 1 with ua_class apple.
//       No Origin check: mail programs and their image proxies send none. Nothing here can read data.
//   2 · SOURCE STATUS 'opens' (quill-performance already lists it as "Email opens") is stamped at most once a minute.
//   3 · GET /health adds opens24: email_opens rows in the last 24 hours, so the picture can be tested from a browser
//       with no login (load /o, then /health).
//   NOT IN THIS VERSION: /raw does not list email opens yet, and publisher and title are left blank on these rows
//     (the issue code carries the title). The Edition screen (mockup v0.6) reads them when it is built.
//   NEEDS (Cloudflare dashboard): localtap.link added to ix-perf as a Custom Domain (Settings > Domains & Routes).
//     Until then the picture works at the workers.dev address.
//   HARDCODING (provisional, for the S4 delta): HC-P-PR4-8 the route name /o and its three letters n, s, r;
//     HC-P-PR4-9 the mail-program names read from the User-Agent and the one-minute 'opens' stamp.
//
// v1.1.4 (17 Nov 2026, Performance Report S4) — THE ISSUE IS FOUND FROM THE PAGE'S ADDRESS TOO.
//   Jeff's test of v1.1.3 (7:40 AM): an issue page opened directly still showed a blank Issue, with no warning. v1.1.3
//   needs the page to send its NEWSLETTERS item id. The site shell (ix-shell v1.0.28) draws an issue page from the
//   copy of /site it kept in the reader's browser, and tells the collector with that kept copy. A copy kept before
//   ix-issue-data v1.0.187 (16 Nov) has no issue id, so a returning reader's page sends none. The Worker no longer
//   depends on it:
//   1 · POST /c, open, on an issue page with no code and no id: the last part of the page's address is the NEWSLETTERS
//       slug. NEWSLETTERS row by slug in the CMS copy -> its PUBLICATION PLANS item -> the plan's name. Both the id and
//       the code are written.
//   2 · POST /c, end and click, on an issue page with no code: taken from the page view's own row (one read by id).
//   3 · FILL-IN (on /raw, every 5 minutes at most) also does both: page views on issue pages by their address, then ads
//       and clicks from their page view. Only blank issue_id and issue_code are written. What stays unmatched is
//       counted in "warnings".
//   HARDCODING: none new (the slug is the last part of the address, as ix-shell reads it).
//
// v1.1.3 (17 Nov 2026, Performance Report S4) — ISSUE PAGES OPENED DIRECTLY NOW COUNT TOWARD THEIR ISSUE.
//   S3 finding 1, ruling 17 (Jeff: "ship collector fix now"). The page script takes the issue code (WLN-123B) only from
//   utm_campaign, so an issue page opened without an email link was stored with its NEWSLETTERS item id (issue_id) and a
//   blank issue code, and Raw counts' Issue column missed it.
//   WHERE THE CODE LIVES (checked in ix-issue-data v1.0.187): a NEWSLETTERS item does not hold the code. The code in
//     every email link is the NAME of the issue's PUBLICATION PLANS item (utm_campaign = plan name), and the NEWSLETTERS
//     item points at its plan through the field publication-plan. So: issue_id -> NEWSLETTERS row in the CMS copy
//     (CMS_DB, ix-content copy_items) -> its plan (plan_id, else field_data publication-plan) -> the plan's name.
//   1 · POST /c. A message with an issue id and no issue code gets the code looked up before the row is written
//       (open, end and click alike). Nothing changes in the page script or in any template. A lookup that fails never
//       stops the row being stored: it is stored with the blank code, as before.
//   2 · FILL-IN. Rows already stored with an issue id and a blank code (everything since 16 Nov, and any row written
//       before the CMS copy had the new issue) are filled in the same way, at most once every 5 minutes, when Quill
//       reads /raw. Only the blank issue_code is written; no count, time or other column is touched. Rows that cannot
//       be matched stay blank and /raw says how many in "warnings".
//   3 · GET /health adds issueLookup: "ready", or the reason the lookup cannot work (binding or collection missing).
//   Collections are found as in v1.1.1 (letters only): NEWSLETTERS and PUBLICATION PLANS. PERF_CMS may set
//   "newsletters" and "plans" ids. Answers found are kept an hour per isolate; misses one minute.
//   NOT FIXED HERE (coverage audit): article pages reached from an issue page on the site carry neither code nor id.
//   HARDCODING (provisional, for the S4 delta): HC-P-PR4-1 the display names NEWSLETTERS and PUBLICATION PLANS and the
//     field slug publication-plan; HC-P-PR4-2 the one-hour / one-minute lookup cache, the 5-minute fill-in pace and
//     its 200 issues a pass.
//
// v1.1.2 (17 Nov 2026, Performance Report S3) — ADS WITH NO ADVERTISER ID SAY WHAT THEY ARE.
//   Jeff (17 Nov): Raw counts showed advertiser counts with a blank name. His query of 16 Nov: every such ad row was a
//   house ad (4, two with no link) or a sponsor spot linking to splash.inbxify.com (2). On /raw the advertiser column
//   for an ad (ad rows, and clicks on an ad) with no advertiser id is now:
//     'house'          when its shape is house          shown as "House ad"
//     'host:<site>'    when it links somewhere          shown as "– · <site>"
//     ''               only when neither is known
//   Page views and clicks on ordinary links (no ad shape) stay blank. Filters and the filter list use the same keys,
//   and names[advertiser] carries the words, so quill-performance shows them with no change. Stored rows are not
//   touched. HARDCODING: HC-P-PR3-9 the words "House ad" and "– · " (ADV_W).
//
// v1.1.1 (17 Nov 2026, Performance Report S3) — CMS NAMES MATCHED ON THEIR LETTERS.
//   ix-content's collections table holds Webflow display names as written, with emoji and mixed case (Jeff's /status,
//   17 Nov: "🛡️ CUSTOMERs", "PUBLISHERS", "TITLES"). v1.1.0 compared them exactly, so CUSTOMERS was never found and
//   advertisers showed their ids. Names are now compared on letters, digits and hyphens only, in capitals, so
//   "🛡️ CUSTOMERs" is CUSTOMERS and "TITLES-ADMIN" stays apart from "TITLES". PERF_CMS still overrides. Nothing else
//   changed. HARDCODING: none new (HC-P-PR3-3 unchanged).
//
// v1.1.0 (16 Nov 2026, Performance Report S3 · build step 2) — QUILL READS: GET /raw AND GET /sources.
//   Quill's Performance tab (quill-performance v1.0.0) reads its numbers here. Mockup v0.1, Jeff 16 Nov: D1 to D12
//   accepted except D6 (no "Ad seen at" switch: Ad seen is the stored seen flag, measured under PERF_SEEN). Raw counts
//   keeps Readers and drops Avg time (Jeff, 16 Nov); each event's own time shows when rows are not merged.
//
//   WHO MAY READ (D1). Staff only. Quill sends the Memberstack login token in "Authorization: Bearer <token>" (the
//     same token Quill Home sends to ix-sales). This Worker asks ix-members GET /whoami through the service binding
//     MEMBERS, exactly as ix-sales v1.0.2+ does, and answers only when it says staff. No key anywhere. The page's
//     Origin must also be in PERF_ORIGINS. A checked token is trusted for 60 seconds in this isolate.
//
//   NAMES (D2). Rows hold ids and slugs. Names come from the CMS copy in D1 database ix-content, bound read-only here
//     as CMS_DB (the database ix-issue-data reads as IX_DB). Collections are found by their Webflow display name
//     (PUBLISHERS, TITLES, CUSTOMERS) in its collections table, or set in PERF_CMS. A collection not in the copy, or a
//     missing binding, leaves the slug or id showing, and the answer says so in "warnings" (never a silent blank).
//
//   GET /raw   ?from=YYYY-MM-DD&to=YYYY-MM-DD    (both days included; default the last 7 days in PERF_TZ)
//              &group=day,title,event            merge rows by these columns (D3 default). group=none merges nothing:
//                                                one row per event (at most RAW_EVENT_DAYS days at a time).
//                                                group= (empty) merges everything into one row.
//              &f.<column>=<value>               filter; one per column. An empty value means "blank".
//              &page=1&size=12                   page of rows (size at most 200)
//              &all=1                            every row, for Export CSV (at most RAW_ALL_MAX rows)
//              &options=1                        also the values each filter offers in this date range
//     Columns: day, publisher, title, issue, surface, event, spot, advertiser, linktype.
//     Events (D7): page_view (page_views), ad_on_page (ad_views, every row), ad_seen (ad_views with seen = 1),
//     click (clicks). Merged rows carry n (count) and readers (different reader codes). Event rows carry at, reader,
//     visit, ms (engaged time for a page view, longest time on screen for an ad), path, dest and label.
//     Answers { ok, from, to, group, filters, rows, total: { rows, events }, page, size, names, options, warnings, version }.
//   GET /sources  Each input with its last delivery and health (D9, D10). Health rules are hours in PERF_SOURCES
//     (default {"site":{"hours":24}}): healthy within the hours, late within twice the hours, otherwise down;
//     failing when the last error is newer than the last delivery. A source with no source_status row is not
//     connected. Site also answers rows in the last 24 hours, rows today, and rows per day for the last 7 days.
//
//   NEEDS (Cloudflare dashboard, ix-perf > Settings > Bindings):
//     · Service binding MEMBERS → Worker ix-members.
//     · D1 binding CMS_DB → database ix-content (only read here; nothing in this Worker writes to it).
//     · D1 schema v1.0.2 on ix-perf (three day indexes; console copy ix-perf-schema-v1.0.2-console.sql).
//     Variables (optional): PERF_SOURCES (health hours), PERF_CMS (collection ids, if display names ever change).
//
//   Collection (POST /c) and /config are unchanged. /health also reports the two new bindings (members, cms).
//   CORS now allows the Authorization header, for the read routes.
//
//   HARDCODING (provisional, for the S3 delta): HC-P-PR3-1 RAW_DEFAULT_DAYS 7, RAW_EVENT_DAYS 31, RAW_SIZE_MAX 200,
//     RAW_ALL_MAX 50000, OPT_MAX 500; HC-P-PR3-2 the default health rule (site, 24 hours) and the "twice the hours"
//     late band; HC-P-PR3-3 the CMS display names PUBLISHERS, TITLES, CUSTOMERS (override PERF_CMS); HC-P-PR3-4 the
//     60-second login and 10-minute collection-list caches; HC-P-PR3-5 the event keys and their order.
//
// v1.0.0 (16 Nov 2026, Performance Report S2 · build step 1) — THE SITE COLLECTOR.
//   We count everything ourselves (S1 ruling 1). This Worker takes what the site script (ix-perf-site v1.0.0) sends from
//   every title site page and stores it in D1 (database ix-perf, binding PERF_DB; tables in ix-perf-schema-v1.0.0.sql).
//   Later steps add localtap.link clicks, the email open picture and the provider intakes to the same Worker.
//
//   ROUTES
//     POST /c        One message from a page. The body is JSON sent as text (navigator.sendBeacon), so no preflight.
//                    t: 'open'   a page opened: one page_views row. Answers { ok, seen: { ratio, ms } } so the page
//                                measures ads with the one "seen" setting (seed ruling 12).
//                    t: 'end'    the reader left or switched away: raises engaged_ms on the page's row (never lowers
//                                it) and writes every ad shown, one ad_views row each, keeping the largest times sent.
//                                A page may send several (each tab switch); the last one wins where it is larger.
//                    t: 'click'  one clicks row.
//     GET  /health   { ok, version, d1, seen, tz }
//     GET  /config   { ok, seen } (the same setting, for anything else that needs it)
//
//   THE "SEEN" SETTING (seed rulings 12 and 13; Jeff 16 Nov: half the ad on screen for half a second). One place:
//     the Worker variable PERF_SEEN, JSON {"ratio":0.5,"ms":500}. Absent or unreadable: 0.5 and 500. The page measures
//     with ratio; this Worker marks an ad seen when its longest unbroken stretch reached ms. Every ad row also keeps
//     max_ms, total_ms and the setting it was measured with, so a different time can be counted later on the same rows.
//
//   WHO MAY SEND. Only pages whose Origin is in PERF_ORIGINS (comma list; default https://inbxify.com and
//   https://www.inbxify.com). Anything else gets 403 and nothing is written. No key: the page cannot keep a secret.
//   Staff and bot visits are stored like any other (Jeff, 16 Nov).
//
//   LIMITS. A message over 64 KB, or with more than 300 ads, is refused (413). Text fields are cut to fixed lengths.
//
//   SOURCE STATUS. Each isolate stamps source_status 'site' at most once a minute with the rows written since.
//
//   NEEDS (Cloudflare dashboard): D1 database ix-perf with the schema run; this Worker bound to it as PERF_DB.
//     Variables (optional): PERF_SEEN, PERF_ORIGINS, PERF_TZ (default America/New_York, for the day column).
//
//   HARDCODING (provisional, for the S2 delta): HC-P-PR2-2 the default seen setting 0.5 / 500 ms (Jeff's ruling);
//     HC-P-PR2-3 the default origins and zone; HC-P-PR2-4 the size limits and field lengths; HC-P-PR2-5 the
//     one-minute status stamp.

const VERSION = '1.2.1';
const DEF_SEEN = { ratio: 0.5, ms: 500 };                                   // HC-P-PR2-2
const DEF_ORIGINS = ['https://inbxify.com', 'https://www.inbxify.com'];     // HC-P-PR2-3
const DEF_TZ = 'America/New_York';                                          // HC-P-PR2-3
const MAX_BODY = 65536, MAX_ADS = 300;                                      // HC-P-PR2-4
const LEN = { id: 64, code: 64, path: 512, dest: 1024, host: 255, label: 80, small: 40 };   // HC-P-PR2-4
const STAMP_MS = 60000;                                                     // HC-P-PR2-5
const KINDS = ['issue', 'article', 'archives', 'directory', 'franchise', 'home', 'other'];
const SHAPES = ['banner', 'sidebar', 'house', 'text', 'sponsor', 'paid'];
const LINK_TYPES = ['CALL', 'TEXT', 'EMAIL', 'SOCIAL', 'WEB', 'NO LINK'];
const REF_KINDS = ['email', 'internal', 'search', 'social', 'direct', 'other'];
const DEVICES = ['phone', 'tablet', 'desktop'];

let pending = 0, lastStamp = 0;   // per isolate
let pendingOpens = 0, lastOpenStamp = 0;   // per isolate, v1.1.5

function seenOf(env) {
  try {
    const v = env.PERF_SEEN ? JSON.parse(env.PERF_SEEN) : null;
    const ratio = Number(v && v.ratio), ms = Number(v && v.ms);
    if (ratio > 0 && ratio <= 1 && ms >= 0 && ms <= 60000) return { ratio, ms: Math.round(ms) };
  } catch (e) {}
  return Object.assign({}, DEF_SEEN);
}
function originsOf(env) {
  const list = String(env.PERF_ORIGINS || '').split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);
  return list.length ? list : DEF_ORIGINS;
}
function tzOf(env) { return String(env.PERF_TZ || '').trim() || DEF_TZ; }
function dayOf(ms, tz) {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms)); }
  catch (e) { return new Date(ms).toISOString().slice(0, 10); }
}

function cors(origin) {
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
           'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
}
function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), { status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, origin ? cors(origin) : {}) });
}

// Cleaning: every value from a page is cut and checked before it reaches SQL (all SQL is bound, never built from text).
const str = (v, n) => (v == null ? '' : String(v)).slice(0, n || LEN.small);
const oneOf = (v, list, dflt) => (list.indexOf(v) >= 0 ? v : dflt);
const int = (v, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 ? Math.min(n, max || 86400000) : 0; };
const bit = v => (v ? 1 : 0);
const idOk = v => /^[A-Za-z0-9_.:-]{6,64}$/.test(String(v || ''));
function atOf(v, now) {   // the page's clock is trusted only within a day of ours
  const n = Number(v);
  return Number.isFinite(n) && Math.abs(n - now) < 86400000 ? Math.round(n) : now;
}
function hostOf(u) { try { return new URL(u).host.slice(0, LEN.host); } catch (e) { return ''; } }

// The context every row shares.
function ctxOf(m) {
  return {
    reader: str(m.reader, LEN.id), visit: str(m.visit, LEN.id),
    publisher: str(m.publisher, LEN.code), title: str(m.title, LEN.code), titleAdmin: str(m.titleAdmin, LEN.code),
    kind: oneOf(m.kind, KINDS, 'other'),
    issueId: str(m.issueId, LEN.code), issueCode: str(m.issueCode, LEN.code),
  };
}

async function onOpen(db, m, now, tz, script) {
  const c = ctxOf(m), at = atOf(m.at, now);
  await db.prepare(
    'INSERT OR IGNORE INTO page_views (id, at, day, reader, visit, visit_first, reader_new, publisher, title, title_admin, kind, path,' +
    ' issue_id, issue_code, ref_kind, ref_host, utm_source, utm_medium, utm_content, device, engaged_ms, last_at, script)' +
    ' VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)'
  ).bind(m.pv, at, dayOf(at, tz), c.reader, c.visit, bit(m.visitFirst), bit(m.readerNew), c.publisher, c.title, c.titleAdmin,
         c.kind, str(m.path, LEN.path), c.issueId, c.issueCode, oneOf(m.refKind, REF_KINDS, 'other'), str(m.refHost, LEN.host),
         str(m.utmSource, LEN.code), str(m.utmMedium, LEN.code), str(m.utmContent, LEN.code), oneOf(m.device, DEVICES, 'desktop'),
         now, str(script, 16)).run();
  return 1;
}

async function onEnd(db, m, now, tz, seen) {
  const c = ctxOf(m), at = atOf(m.at, now), day = dayOf(at, tz);
  const stmts = [db.prepare('UPDATE page_views SET engaged_ms = MAX(engaged_ms, ?), last_at = ? WHERE id = ?')
    .bind(int(m.engagedMs), now, m.pv)];
  const ads = Array.isArray(m.ads) ? m.ads : [];
  const ratio = Number(m.ratio) > 0 && Number(m.ratio) <= 1 ? Number(m.ratio) : seen.ratio;
  ads.forEach(a => {
    const n = int(a.n, 10000), max = int(a.maxMs), total = Math.max(int(a.totalMs), max);
    const firstAt = atOf(a.at, now);
    stmts.push(db.prepare(
      'INSERT INTO ad_views (id, page_view_id, at, day, reader, visit, publisher, title, kind, issue_id, issue_code,' +
      ' ad_id, advertiser_id, slot, shape, href_host, max_ms, total_ms, ratio, seen_ms, seen)' +
      ' VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)' +
      ' ON CONFLICT(id) DO UPDATE SET max_ms = MAX(max_ms, excluded.max_ms), total_ms = MAX(total_ms, excluded.total_ms),' +
      ' slot = excluded.slot, seen = MAX(seen, excluded.seen), seen_ms = excluded.seen_ms, ratio = excluded.ratio'
    ).bind(m.pv + ':' + n, m.pv, firstAt, dayOf(firstAt, tz), c.reader, c.visit, c.publisher, c.title, c.kind, c.issueId, c.issueCode,
           str(a.ad, LEN.code), str(a.adv, LEN.code), str(a.slot, LEN.code), oneOf(a.shape, SHAPES, 'banner'),
           str(a.host, LEN.host), max, total, ratio, seen.ms, max >= seen.ms ? 1 : 0));
  });
  await db.batch(stmts);
  return stmts.length;
}

async function onClick(db, m, now, tz) {
  const c = ctxOf(m), at = atOf(m.at, now), dest = str(m.dest, LEN.dest);
  await db.prepare(
    'INSERT OR IGNORE INTO clicks (id, at, day, source, page_view_id, reader, visit, publisher, title, kind, issue_id, issue_code,' +
    ' ad_id, advertiser_id, slot, shape, link_type, dest, dest_host, internal, label, link_code, scanner)' +
    " VALUES (?,?,?,'site',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'',0)"
  ).bind(m.id, at, dayOf(at, tz), m.pv, c.reader, c.visit, c.publisher, c.title, c.kind, c.issueId, c.issueCode,
         str(m.ad, LEN.code), str(m.adv, LEN.code), str(m.slot, LEN.code), m.shape ? oneOf(m.shape, SHAPES, '') : '',
         oneOf(m.linkType, LINK_TYPES, 'NO LINK'), dest, hostOf(dest), bit(m.internal), str(m.label, LEN.label)).run();
  return 1;
}

async function stamp(db, ctx, now, err) {
  if (!err && now - lastStamp < STAMP_MS) return;
  lastStamp = now;
  const n = pending; pending = 0;
  const q = err
    ? db.prepare('INSERT INTO source_status (source, last_error_at, last_error) VALUES (\'site\', ?, ?)' +
        ' ON CONFLICT(source) DO UPDATE SET last_error_at = excluded.last_error_at, last_error = excluded.last_error')
        .bind(now, String(err).slice(0, 300))
    : db.prepare('INSERT INTO source_status (source, last_ok_at, last_count) VALUES (\'site\', ?, ?)' +
        ' ON CONFLICT(source) DO UPDATE SET last_ok_at = excluded.last_ok_at, last_count = excluded.last_count')
        .bind(now, n);
  const p = q.run().catch(() => {});
  if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
}

async function collect(request, env, ctx, origin) {
  const db = env.PERF_DB;
  if (!db) return json({ ok: false, error: 'PERF_DB is not bound on ix-perf.' }, 500, origin);
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len > MAX_BODY) return json({ ok: false, error: 'Too large.' }, 413, origin);
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ ok: false, error: 'Too large.' }, 413, origin);
  let m;
  try { m = JSON.parse(text); } catch (e) { return json({ ok: false, error: 'Not JSON.' }, 400, origin); }
  if (!m || typeof m !== 'object') return json({ ok: false, error: 'Not JSON.' }, 400, origin);
  if (!idOk(m.pv)) return json({ ok: false, error: 'No page view id.' }, 400, origin);
  if (Array.isArray(m.ads) && m.ads.length > MAX_ADS) return json({ ok: false, error: 'Too many ads.' }, 413, origin);
  const now = Date.now(), tz = tzOf(env), seen = seenOf(env);
  if (!m.issueCode) {                                                                                       // v1.1.3, v1.1.4
    try {
      if (idOk(m.issueId)) { const got = await issueCodes(env, [String(m.issueId)], []); if (got[m.issueId]) m.issueCode = got[m.issueId]; }
      else if (m.kind === 'issue' && m.t === 'open') {
        const sl = slugOfPath(m.path), got = sl ? await issuesBySlug(env, [sl], []) : {};
        if (got[sl]) { m.issueId = got[sl].id; m.issueCode = got[sl].code; }
      } else if (m.kind === 'issue') {
        const r = await db.prepare('SELECT issue_id, issue_code FROM page_views WHERE id = ?').bind(m.pv).first();
        if (r) { if (r.issue_id) m.issueId = r.issue_id; if (r.issue_code) m.issueCode = r.issue_code; }
      }
    } catch (e) {}
  }
  try {
    let n = 0;
    if (m.t === 'open') n = await onOpen(db, m, now, tz, m.v);
    else if (m.t === 'end') n = await onEnd(db, m, now, tz, seen);
    else if (m.t === 'click') { if (!idOk(m.id)) return json({ ok: false, error: 'No click id.' }, 400, origin); n = await onClick(db, m, now, tz); }
    else return json({ ok: false, error: 'Unknown message type.' }, 400, origin);
    pending += n;
    await stamp(db, ctx, now, null);
    return json(m.t === 'open' ? { ok: true, seen } : { ok: true }, 200, origin);
  } catch (e) {
    await stamp(db, ctx, now, e && e.message);
    return json({ ok: false, error: 'Not stored: ' + (e && e.message) }, 500, origin);
  }
}

// ══════════════════════════════════════════════════════════
// v1.1.5 — THE EMAIL OPEN PICTURE: GET /o
// ══════════════════════════════════════════════════════════
const GIF = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0));
function gif() {
  return new Response(GIF, { status: 200, headers: { 'Content-Type': 'image/gif', 'Content-Length': String(GIF.length),
    'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0', Pragma: 'no-cache', Expires: '0' } });
}
function uaClass(ua) {                                                                                     // HC-P-PR4-9
  const u = String(ua || '');
  if (/GoogleImageProxy|ggpht\.com/i.test(u)) return 'gmail';
  if (/YahooMailProxy/i.test(u)) return 'yahoo';
  if (/Microsoft Office|Outlook|MSOffice/i.test(u)) return 'outlook';
  if (u.trim() === 'Mozilla/5.0') return 'apple';      // Apple Mail's automatic load sends only this
  return 'other';
}
// A merge tag nobody filled in is not a reader.
function recipientOf(v) {
  const r = String(v == null ? '' : v).trim();
  if (!r || r.length > LEN.id) return '';
  if (/^RECIPIENT_ID$/i.test(r) || /[{}|%\[\]*<> ]/.test(r)) return '';
  return /^[A-Za-z0-9_.:@=+-]+$/.test(r) ? r : '';
}
async function openWrite(env, url, ua, now) {
  const db = env.PERF_DB;
  if (!db) return;
  const n = String(url.searchParams.get('n') || '');
  if (!idOk(n)) return;
  try {
    const tz = tzOf(env);
    const list = String(url.searchParams.get('s') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, LEN.small) || 'unknown';
    const recipient = recipientOf(url.searchParams.get('r'));
    const cls = uaClass(ua);
    let code = '';
    try { code = (await issueCodes(env, [n], []))[n] || ''; } catch (e) {}
    let first = 0;
    if (recipient) {
      const seenRow = await db.prepare('SELECT 1 AS x FROM email_opens WHERE issue_id = ? AND list = ? AND recipient = ? LIMIT 1').bind(n, list, recipient).first();
      first = seenRow ? 0 : 1;
    }
    await db.prepare('INSERT INTO email_opens (id, at, day, issue_id, issue_code, publisher, title, list, recipient, apple, first_open, ua_class)' +
      " VALUES (?,?,?,?,?,'','',?,?,?,?,?)").bind(crypto.randomUUID(), now, dayOf(now, tz), n, code, list, recipient, cls === 'apple' ? 1 : 0, first, cls).run();
    pendingOpens += 1;
    if (now - lastOpenStamp >= STAMP_MS) {
      lastOpenStamp = now; const c = pendingOpens; pendingOpens = 0;
      await db.prepare("INSERT INTO source_status (source, last_ok_at, last_count) VALUES ('opens', ?, ?)" +
        ' ON CONFLICT(source) DO UPDATE SET last_ok_at = excluded.last_ok_at, last_count = excluded.last_count').bind(now, c).run();
    }
  } catch (e) {
    try {
      await db.prepare("INSERT INTO source_status (source, last_error_at, last_error) VALUES ('opens', ?, ?)" +
        ' ON CONFLICT(source) DO UPDATE SET last_error_at = excluded.last_error_at, last_error = excluded.last_error').bind(now, String((e && e.message) || e).slice(0, 300)).run();
    } catch (e2) {}
  }
}

// ══════════════════════════════════════════════════════════
// v1.1.0 — QUILL READS: GET /raw AND GET /sources (staff only)
// ══════════════════════════════════════════════════════════
const RAW_DEFAULT_DAYS = 7, RAW_EVENT_DAYS = 31, RAW_SIZE_MAX = 200, RAW_ALL_MAX = 50000, OPT_MAX = 500;   // HC-P-PR3-1
const DEF_SOURCES = { site: { hours: 24 } };                                                               // HC-P-PR3-2
const CMS_NAMES = { publishers: ['PUBLISHERS'], titles: ['TITLES'], customers: ['CUSTOMERS'],             // HC-P-PR3-3
  newsletters: ['NEWSLETTERS', 'NEWSLETTER'], plans: ['PUBLICATIONPLANS', 'PUBLICATIONPLAN'] };            // HC-P-PR4-1 (letters only)
const CMS_SAY = { publishers: 'PUBLISHERS', titles: 'TITLES', customers: 'CUSTOMERS', newsletters: 'NEWSLETTERS', plans: 'PUBLICATION PLANS' };
const ISSUE_PLAN_FIELD = 'publication-plan';                                                               // HC-P-PR4-1
const ISSUE_OK_TTL = 3600000, ISSUE_MISS_TTL = 60000, HEAL_MS = 300000, HEAL_MAX = 200;                    // HC-P-PR4-2
const issueCache = new Map();         // NEWSLETTERS item id -> { at, code }
const slugCache = new Map();          // NEWSLETTERS slug -> { at, id, code }   v1.1.4
let lastHeal = 0, healNote = '';      // per isolate
const AUTH_TTL = 60000, CMS_TTL = 600000;                                                                  // HC-P-PR3-4
const EVENTS = ['page_view', 'ad_on_page', 'ad_seen', 'click', 'email_open'];   // email_open v1.2.0                                            // HC-P-PR3-5
const DIMS = ['day', 'publisher', 'title', 'issue', 'surface', 'event', 'spot', 'advertiser', 'linktype'];
const authCache = new Map();          // token -> { at, who }
let cmsCols = null, cmsColsAt = 0;    // collection ids found in ix-content

function httpErr(status, msg) { const e = new Error(msg); e.status = status; return e; }

async function staffOnly(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const tok = (auth.match(/^Bearer\s+(\S+)/i) || [])[1];
  if (!tok) throw httpErr(401, 'Not logged in: no Memberstack token was sent.');
  const hit = authCache.get(tok);
  if (hit && Date.now() - hit.at < AUTH_TTL) { if (!hit.who.staff) throw httpErr(403, 'Only inbxify staff can read performance numbers.'); return hit.who; }
  if (!env.MEMBERS || typeof env.MEMBERS.fetch !== 'function') throw httpErr(500, 'The MEMBERS service binding (to ix-members) is not set on ix-perf.');
  let res, j = null;
  try { res = await env.MEMBERS.fetch(new Request('https://ix-members/whoami', { headers: { Authorization: 'Bearer ' + tok } })); j = await res.json().catch(() => null); }
  catch (e) { throw httpErr(502, 'ix-members did not answer: ' + ((e && e.message) || e)); }
  if (!res.ok || !j || !j.ok) throw httpErr(res && res.status === 401 ? 401 : 403, (j && j.error) || 'The login check failed.');
  const who = { memberId: j.memberId, staff: !!j.staff };
  if (authCache.size > 500) authCache.clear();
  authCache.set(tok, { at: Date.now(), who });
  if (!who.staff) throw httpErr(403, 'Only inbxify staff can read performance numbers.');
  return who;
}

async function readRoute(url, request, env, origin) {
  try {
    if (!env.PERF_DB) throw httpErr(500, 'PERF_DB is not bound on ix-perf.');
    await staffOnly(request, env);
    const out = url.pathname === '/raw' ? await rawRead(url, env) : url.pathname === '/editions' ? await editionsRead(env)   // v1.2.0
      : url.pathname === '/edition' ? await editionRead(url, env) : url.pathname === '/site' ? await siteRead(url, env) : await sourcesRead(env);
    out.version = VERSION;
    return json(out, 200, origin);
  } catch (e) {
    return json({ ok: false, error: (e && e.message) || String(e), version: VERSION }, (e && e.status) || 500, origin);
  }
}

// ── dates ─────────────────────────────────────────────────
const dayOk = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || '')) && !isNaN(Date.parse(d + 'T00:00:00Z'));
function addDays(d, n) { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
function daysBetween(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000) + 1; }

// ── the four events as one list ───────────────────────────
// Every column is text with '' for "blank", so a filter on a blank value matches. All values are bound, never built.
// v1.1.2: an ad with no advertiser id is keyed 'house' (shape house) or 'host:<site>' (where it links); see header.
const ADV_W = { house: 'House ad', host: '\u2013 \u00b7 ' };                                             // HC-P-PR3-9
const ADV_AD = "CASE WHEN COALESCE(advertiser_id,'') <> '' THEN advertiser_id WHEN shape = 'house' THEN 'house'" +
  " WHEN COALESCE(href_host,'') <> '' THEN 'host:' || href_host ELSE '' END";
const ADV_CK = "CASE WHEN COALESCE(advertiser_id,'') <> '' THEN advertiser_id WHEN shape = 'house' THEN 'house'" +
  " WHEN COALESCE(shape,'') <> '' AND COALESCE(dest_host,'') <> '' THEN 'host:' || dest_host ELSE '' END";
function branches(events) {
  // [table, event, extra WHERE, spot, advertiser, linktype, ms, path, dest, label, page view id]
  const B = {
    page_view: ['page_views', 'page_view', '', "''", "''", "''", 'engaged_ms', "COALESCE(path,'')", "''", "''", "''"],
    ad_on_page: ['ad_views', 'ad_on_page', '', "COALESCE(slot,'')", ADV_AD, "''", 'max_ms', "''", "COALESCE(href_host,'')", "''", 'page_view_id'],
    ad_seen: ['ad_views', 'ad_seen', ' AND seen = 1', "COALESCE(slot,'')", ADV_AD, "''", 'max_ms', "''", "COALESCE(href_host,'')", "''", 'page_view_id'],
    click: ['clicks', 'click', '', "COALESCE(slot,'')", ADV_CK, "COALESCE(link_type,'')", 'NULL', "''", "COALESCE(dest,'')", "COALESCE(label,'')", "COALESCE(page_view_id,'')"]
  };
  const EMAIL_OPEN = "SELECT day, at, COALESCE(publisher,'') AS publisher, COALESCE(title,'') AS title, COALESCE(issue_code,'') AS issue," +   // v1.2.0
    " 'email' AS surface, 'email_open' AS event, '' AS spot, '' AS advertiser, '' AS linktype, COALESCE(recipient,'') AS reader, '' AS visit," +
    " NULL AS ms, id, '' AS path, '' AS dest, COALESCE(list,'') AS label, '' AS pv FROM email_opens WHERE day BETWEEN ?1 AND ?2";
  return events.map(e => { if (e === 'email_open') return EMAIL_OPEN; const b = B[e];
    return "SELECT day, at, COALESCE(publisher,'') AS publisher, COALESCE(title,'') AS title, COALESCE(issue_code,'') AS issue," +
      " COALESCE(kind,'') AS surface, '" + b[1] + "' AS event, " + b[3] + ' AS spot, ' + b[4] + ' AS advertiser, ' + b[5] + ' AS linktype,' +
      " COALESCE(reader,'') AS reader, COALESCE(visit,'') AS visit, " + b[6] + ' AS ms, id, ' + b[7] + ' AS path, ' + b[8] + ' AS dest, ' +
      b[9] + ' AS label, ' + b[10] + ' AS pv FROM ' + b[0] + ' WHERE day BETWEEN ?1 AND ?2' + b[2];
  }).join(' UNION ALL ');
}
const EV_ORDER = "CASE event WHEN 'page_view' THEN 1 WHEN 'ad_on_page' THEN 2 WHEN 'ad_seen' THEN 3 WHEN 'click' THEN 4 ELSE 5 END";

function parseRaw(url, tz) {
  const q = url.searchParams, today = dayOf(Date.now(), tz);
  let to = dayOk(q.get('to')) ? q.get('to') : today;
  let from = dayOk(q.get('from')) ? q.get('from') : addDays(to, -(RAW_DEFAULT_DAYS - 1));
  if (from > to) { const t = from; from = to; to = t; }
  const gRaw = q.has('group') ? q.get('group') : 'day,title,event';
  const eventMode = gRaw === 'none';
  const group = eventMode ? [] : DIMS.filter(d => String(gRaw).split(',').map(s => s.trim()).indexOf(d) >= 0);
  const filters = {};
  DIMS.forEach(d => { if (q.has('f.' + d)) filters[d] = String(q.get('f.' + d)).slice(0, 200); });
  const all = q.get('all') === '1';
  const size = all ? RAW_ALL_MAX : Math.min(RAW_SIZE_MAX, Math.max(1, parseInt(q.get('size'), 10) || 12));
  const page = all ? 1 : Math.max(1, parseInt(q.get('page'), 10) || 1);
  return { from, to, group, eventMode, filters, all, size, page, options: q.get('options') === '1' };
}

async function rawRead(url, env) {
  const db = env.PERF_DB, tz = tzOf(env), p = parseRaw(url, tz), warnings = [];
  await healIssues(env, warnings);                                                                          // v1.1.3
  if (p.eventMode && daysBetween(p.from, p.to) > RAW_EVENT_DAYS)
    throw httpErr(400, 'One row per event shows at most ' + RAW_EVENT_DAYS + ' days at a time. Narrow the dates, or merge rows.');
  const events = p.filters.event != null ? EVENTS.filter(e => e === p.filters.event) : EVENTS.slice();
  const binds = [p.from, p.to];
  const where = [];
  DIMS.forEach(d => { if (d !== 'event' && p.filters[d] != null) { binds.push(p.filters[d]); where.push(d + ' = ?' + binds.length); } });
  const W = where.length ? ' WHERE ' + where.join(' AND ') : '';
  let rows = [], total = { rows: 0, events: 0 };

  if (events.length) {
    const U = '(' + branches(events) + ')';
    if (p.eventMode) {
      const tot = await db.prepare('SELECT COUNT(*) AS n FROM ' + U + W).bind(...binds).first();
      total = { rows: tot.n, events: tot.n };
      const r = await db.prepare('SELECT * FROM ' + U + W + ' ORDER BY at DESC LIMIT ' + p.size + ' OFFSET ' + ((p.page - 1) * p.size)).bind(...binds).all();
      rows = r.results || [];
      // the page an ad was on: one read for the page view ids on this page of rows
      const pvIds = [...new Set(rows.filter(x => x.pv && !x.path).map(x => x.pv))];
      const paths = {};
      for (let i = 0; i < pvIds.length; i += 90) {
        const part = pvIds.slice(i, i + 90);
        const pr = await db.prepare('SELECT id, path FROM page_views WHERE id IN (' + part.map(() => '?').join(',') + ')').bind(...part).all();
        (pr.results || []).forEach(x => { paths[x.id] = x.path || ''; });
      }
      rows = rows.map(x => ({ at: x.at, day: x.day, publisher: x.publisher, title: x.title, issue: x.issue, surface: x.surface, event: x.event,
        spot: x.spot, advertiser: x.advertiser, linktype: x.linktype, reader: x.reader, visit: x.visit, ms: x.ms,
        path: x.path || paths[x.pv] || '', dest: x.dest, label: x.label }));
    } else {
      const G = p.group.join(', ');
      const order = p.group.map(d => d === 'day' ? 'day DESC' : d === 'event' ? EV_ORDER : d).join(', ');
      const sel = (G ? G + ', ' : '') + 'COUNT(*) AS n, COUNT(DISTINCT reader) AS readers';
      const tot = await db.prepare('SELECT COUNT(*) AS rows_n, COALESCE(SUM(n),0) AS events_n FROM (SELECT COUNT(*) AS n FROM ' + U + W +
        (G ? ' GROUP BY ' + G : '') + ')').bind(...binds).first();
      total = { rows: tot.rows_n, events: tot.events_n };
      const r = await db.prepare('SELECT ' + sel + ' FROM ' + U + W + (G ? ' GROUP BY ' + G + ' ORDER BY ' + order : '') +
        ' LIMIT ' + p.size + ' OFFSET ' + ((p.page - 1) * p.size)).bind(...binds).all();
      rows = r.results || [];
      if (!G && rows.length && rows[0].n === 0) { rows = []; total = { rows: 0, events: 0 }; }
    }
  }
  if (p.all && total.rows > RAW_ALL_MAX) warnings.push('Only the first ' + RAW_ALL_MAX.toLocaleString('en-US') + ' of ' + total.rows.toLocaleString('en-US') + ' rows were sent. Narrow the dates or filters.');

  let options = null;
  if (p.options) options = await optionsRead(db, p.from, p.to);
  const want = { publisher: new Set(), title: new Set(), advertiser: new Set() };
  rows.forEach(x => { ['publisher', 'title', 'advertiser'].forEach(k => { if (x[k]) want[k].add(x[k]); }); });
  if (options) ['publisher', 'title', 'advertiser'].forEach(k => options[k].forEach(v => { if (v) want[k].add(v); }));
  const names = await namesRead(env, want, warnings);

  return { ok: true, from: p.from, to: p.to, group: p.eventMode ? 'none' : p.group.join(','), filters: p.filters,
    rows, total, page: p.page, size: p.size, names, options, warnings };
}

async function optionsRead(db, from, to) {
  const cols = { publisher: 'publisher', title: 'title', issue: 'issue_code', surface: 'kind' };
  const stmts = [], keys = [];
  Object.keys(cols).forEach(k => {
    keys.push(k);
    const extra = k === 'surface' ? " UNION SELECT 'email' FROM email_opens WHERE day BETWEEN ?1 AND ?2"                                // v1.2.0
      : " UNION SELECT DISTINCT COALESCE(" + cols[k].replace('kind', 'title') + ",'') FROM email_opens WHERE day BETWEEN ?1 AND ?2";
    stmts.push(db.prepare(['page_views', 'ad_views', 'clicks'].map(t => 'SELECT DISTINCT COALESCE(' + cols[k] + ",'') AS v FROM " + t + ' WHERE day BETWEEN ?1 AND ?2').join(' UNION ') +
      extra + ' ORDER BY v LIMIT ' + OPT_MAX).bind(from, to));
  });
  keys.push('spot'); stmts.push(db.prepare("SELECT DISTINCT COALESCE(slot,'') AS v FROM ad_views WHERE day BETWEEN ?1 AND ?2 UNION SELECT DISTINCT COALESCE(slot,'') FROM clicks WHERE day BETWEEN ?1 AND ?2 ORDER BY v LIMIT " + OPT_MAX).bind(from, to));
  keys.push('advertiser'); stmts.push(db.prepare('SELECT DISTINCT ' + ADV_AD + ' AS v FROM ad_views WHERE day BETWEEN ?1 AND ?2 UNION SELECT DISTINCT ' + ADV_CK +
    ' FROM clicks WHERE day BETWEEN ?1 AND ?2 ORDER BY v LIMIT ' + OPT_MAX).bind(from, to));                                   // v1.1.2
  keys.push('linktype'); stmts.push(db.prepare("SELECT DISTINCT COALESCE(link_type,'') AS v FROM clicks WHERE day BETWEEN ?1 AND ?2 ORDER BY v LIMIT " + OPT_MAX).bind(from, to));
  keys.push('day'); stmts.push(db.prepare('SELECT DISTINCT day AS v FROM page_views WHERE day BETWEEN ?1 AND ?2 UNION SELECT DISTINCT day FROM ad_views WHERE day BETWEEN ?1 AND ?2 UNION SELECT DISTINCT day FROM clicks WHERE day BETWEEN ?1 AND ?2 UNION SELECT DISTINCT day FROM email_opens WHERE day BETWEEN ?1 AND ?2 ORDER BY v DESC').bind(from, to));
  const res = await db.batch(stmts), out = { event: EVENTS.slice() };
  res.forEach((r, i) => { out[keys[i]] = (r.results || []).map(x => x.v); });
  return out;
}

// ── names from the CMS copy (ix-content) ──────────────────
// v1.1.1: letters, digits and hyphens only, in capitals ("🛡️ CUSTOMERs" → CUSTOMERS).
function cmsNorm(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9-]/g, ''); }
async function cmsCollections(env, warnings) {
  if (cmsCols && Date.now() - cmsColsAt < CMS_TTL) return cmsCols;
  let over = {};
  try { over = env.PERF_CMS ? JSON.parse(env.PERF_CMS) : {}; } catch (e) { warnings.push('PERF_CMS is not valid JSON, so it was ignored.'); }
  const found = {};
  const r = await env.CMS_DB.prepare('SELECT collection_id, display_name, copied FROM collections').all();
  const list = r.results || [];
  Object.keys(CMS_NAMES).forEach(k => {
    if (over[k]) { found[k] = { id: over[k], copied: 1 }; return; }
    const m = list.filter(c => CMS_NAMES[k].indexOf(cmsNorm(c.display_name)) >= 0);           // v1.1.1, v1.1.3
    found[k] = m.length === 1 ? { id: m[0].collection_id, copied: m[0].copied } : null;
  });
  cmsCols = found; cmsColsAt = Date.now();
  return found;
}
async function namesRead(env, want, warnings) {
  const names = { publisher: {}, title: {}, advertiser: {} };
  [...want.advertiser].forEach(v => {                                                                    // v1.1.2
    if (v === 'house') { names.advertiser[v] = ADV_W.house; want.advertiser.delete(v); }
    else if (v.indexOf('host:') === 0) { names.advertiser[v] = ADV_W.host + v.slice(5); want.advertiser.delete(v); }
  });
  const any = want.publisher.size || want.title.size || want.advertiser.size;
  if (!any) return names;
  if (!env.CMS_DB) { warnings.push('ix-perf has no CMS_DB binding (database ix-content), so ids and slugs show instead of names.'); return names; }
  try {
    const C = await cmsCollections(env, warnings);
    const jobs = [['publisher', 'publishers', 'slug'], ['title', 'titles', 'slug'], ['advertiser', 'customers', 'item_id']];
    for (const [k, coll, key] of jobs) {
      const vals = [...want[k]];
      if (!vals.length) continue;
      const c = C[coll];
      if (!c) { warnings.push(CMS_SAY[coll] + ' was not found in the CMS copy, so ' + k + 's show their ' + (key === 'slug' ? 'slug' : 'id') + '.'); continue; }
      if (!c.copied) warnings.push(CMS_SAY[coll] + ' is not on the CMS copy list, so its names may be missing or old.');
      for (let i = 0; i < vals.length; i += 90) {
        const part = vals.slice(i, i + 90);
        const r = await env.CMS_DB.prepare('SELECT ' + key + ' AS k, name FROM copy_items WHERE collection_id = ? AND ' + key + ' IN (' +
          part.map(() => '?').join(',') + ')').bind(c.id, ...part).all();
        (r.results || []).forEach(x => { if (x.name) names[k][x.k] = x.name; });
      }
    }
  } catch (e) { warnings.push('Names could not be read from the CMS copy: ' + ((e && e.message) || e)); }
  return names;
}

// ── v1.1.3: the issue code of an issue page ───────────────
// issue_id (NEWSLETTERS item) -> its PUBLICATION PLANS item -> that plan's name, which is the code in every email link.
function issueReady(C) {
  if (!C.newsletters) return 'NEWSLETTERS was not found in the CMS copy.';
  if (!C.plans) return 'PUBLICATION PLANS was not found in the CMS copy.';
  return '';
}
async function issueCodes(env, ids, warnings) {
  const out = {}, need = [], now = Date.now();
  [...new Set(ids)].forEach(id => {
    const h = issueCache.get(id);
    if (h && now - h.at < (h.code ? ISSUE_OK_TTL : ISSUE_MISS_TTL)) { if (h.code) out[id] = h.code; }
    else need.push(id);
  });
  if (!need.length) return out;
  if (!env.CMS_DB) { warnings.push('ix-perf has no CMS_DB binding (database ix-content), so issue pages opened directly cannot be given their issue code.'); return out; }
  const C = await cmsCollections(env, warnings);
  const why = issueReady(C);
  if (why) { warnings.push(why + ' Issue pages opened directly keep a blank issue code until it is.'); return out; }
  if (issueCache.size > 2000) issueCache.clear();
  for (let i = 0; i < need.length; i += 80) {
    const part = need.slice(i, i + 80);
    const r = await env.CMS_DB.prepare(
      'SELECT n.item_id AS id, p.name AS code FROM copy_items n JOIN copy_items p ON p.collection_id = ? AND p.item_id = ' +
      "COALESCE(NULLIF(n.plan_id, ''), json_extract(n.field_data, ?)) WHERE n.collection_id = ? AND n.item_id IN (" +
      part.map(() => '?').join(',') + ')'
    ).bind(C.plans.id, '$."' + ISSUE_PLAN_FIELD + '"', C.newsletters.id, ...part).all();
    const got = {};
    (r.results || []).forEach(x => { const code = str(String(x.code || '').trim(), LEN.code); if (code) got[x.id] = code; });
    part.forEach(id => { issueCache.set(id, { at: now, code: got[id] || '' }); if (got[id]) out[id] = got[id]; });
  }
  return out;
}
// v1.1.4: the same, starting from the page's address. The last part of an issue page's address is its NEWSLETTERS slug.
function slugOfPath(p) { const m = String(p || '').toLowerCase().match(/\/([a-z0-9][a-z0-9._-]{0,200})\/?$/); return m ? m[1] : ''; }
async function issuesBySlug(env, slugs, warnings) {
  const out = {}, need = [], now = Date.now();
  [...new Set(slugs)].forEach(sl => {
    const h = slugCache.get(sl);
    if (h && now - h.at < (h.code ? ISSUE_OK_TTL : ISSUE_MISS_TTL)) { if (h.id) out[sl] = { id: h.id, code: h.code }; }
    else need.push(sl);
  });
  if (!need.length) return out;
  if (!env.CMS_DB) { warnings.push('ix-perf has no CMS_DB binding (database ix-content), so issue pages opened directly cannot be given their issue code.'); return out; }
  const C = await cmsCollections(env, warnings);
  const why = issueReady(C);
  if (why) { warnings.push(why + ' Issue pages opened directly keep a blank issue code until it is.'); return out; }
  if (slugCache.size > 2000) slugCache.clear();
  for (let i = 0; i < need.length; i += 80) {
    const part = need.slice(i, i + 80);
    const r = await env.CMS_DB.prepare(
      'SELECT n.slug AS slug, n.item_id AS id, p.name AS code FROM copy_items n LEFT JOIN copy_items p ON p.collection_id = ? AND p.item_id = ' +
      "COALESCE(NULLIF(n.plan_id, ''), json_extract(n.field_data, ?)) WHERE n.collection_id = ? AND n.is_archived = 0 AND LOWER(n.slug) IN (" +
      part.map(() => '?').join(',') + ')'
    ).bind(C.plans.id, '$."' + ISSUE_PLAN_FIELD + '"', C.newsletters.id, ...part).all();
    const got = {};
    (r.results || []).forEach(x => { got[String(x.slug || '').toLowerCase()] = { id: str(x.id, LEN.code), code: str(String(x.code || '').trim(), LEN.code) }; });
    part.forEach(sl => { const g = got[sl] || { id: '', code: '' }; slugCache.set(sl, { at: now, id: g.id, code: g.code }); if (g.id) out[sl] = g; });
  }
  return out;
}
// Rows stored with an issue id and a blank code get the code. Only issue_code is written, and only where it is blank.
async function healIssues(env, warnings) {
  const now = Date.now();
  if (now - lastHeal >= HEAL_MS) {
    lastHeal = now; healNote = '';
    try {
      const db = env.PERF_DB, tables = ['page_views', 'ad_views', 'clicks'];
      const r = await db.prepare(tables.map(t => 'SELECT DISTINCT issue_id AS id FROM ' + t +
        " WHERE COALESCE(issue_id,'') <> '' AND COALESCE(issue_code,'') = ''").join(' UNION ') + ' LIMIT ' + HEAL_MAX).all();
      const ids = (r.results || []).map(x => String(x.id)).filter(idOk);
      if (ids.length) {
        const w = [], codes = await issueCodes(env, ids, w), stmts = [];
        ids.forEach(id => { if (codes[id]) tables.forEach(t => stmts.push(
          db.prepare('UPDATE ' + t + " SET issue_code = ? WHERE issue_id = ? AND COALESCE(issue_code,'') = ''").bind(codes[id], id))); });
        for (let i = 0; i < stmts.length; i += 60) await db.batch(stmts.slice(i, i + 60));
        if (w.length) healNote = w[0];
      }
      // v1.1.4 · page views on issue pages with neither id nor code: by the page's address
      const BLANK = "COALESCE(issue_code,'') = ''", NOID = "COALESCE(issue_id,'') = ''";
      const pr = await db.prepare("SELECT DISTINCT path FROM page_views WHERE kind = 'issue' AND " + BLANK + ' AND ' + NOID + ' LIMIT ' + HEAL_MAX).all();
      const paths = (pr.results || []).map(x => String(x.path || '')).filter(x => slugOfPath(x));
      if (paths.length) {
        const w2 = [], bySlug = await issuesBySlug(env, paths.map(slugOfPath), w2), st2 = [];
        paths.forEach(pa => { const g = bySlug[slugOfPath(pa)]; if (g) st2.push(
          db.prepare("UPDATE page_views SET issue_id = ?, issue_code = ? WHERE kind = 'issue' AND path = ? AND " + BLANK + ' AND ' + NOID).bind(g.id, g.code, pa)); });
        for (let i = 0; i < st2.length; i += 60) await db.batch(st2.slice(i, i + 60));
        if (w2.length && !healNote) healNote = w2[0];
      }
      // v1.1.4 · ads and clicks on issue pages: from their page view
      await db.batch(['ad_views', 'clicks'].map(t => db.prepare(
        'UPDATE ' + t + ' SET issue_code = (SELECT p.issue_code FROM page_views p WHERE p.id = ' + t + '.page_view_id),' +
        " issue_id = COALESCE(NULLIF(issue_id,''), (SELECT p.issue_id FROM page_views p WHERE p.id = " + t + '.page_view_id))' +
        " WHERE kind = 'issue' AND " + BLANK + " AND page_view_id IN (SELECT id FROM page_views WHERE kind = 'issue' AND COALESCE(issue_code,'') <> '')")));
      // v1.2.0 · an article or franchise page opened from an issue page (question 3): the page view just before it in the
      // same visit is an issue page with an issue. Its ads and clicks follow.
      const since = dayOf(now - (healedVisitsOnce ? HEAL_VISIT_DAYS : HEAL_VISIT_FIRST) * 86400000, tzOf(env));
      healedVisitsOnce = true;
      const PREV = col => '(SELECT CASE WHEN i.kind = \'issue\' THEN i.' + col + ' END FROM page_views i WHERE i.visit = page_views.visit AND i.at < page_views.at ORDER BY i.at DESC LIMIT 1)';
      await db.prepare("UPDATE page_views SET issue_id = COALESCE(" + PREV('issue_id') + ", ''), issue_code = COALESCE(" + PREV('issue_code') + ", '')" +
        " WHERE kind IN ('article','franchise') AND ref_kind = 'internal' AND " + BLANK + ' AND ' + NOID + ' AND day >= ?1' +
        " AND visit IN (SELECT visit FROM page_views WHERE kind = 'issue' AND COALESCE(issue_code,'') <> '' AND day >= ?1)").bind(since).run();
      await db.batch(['ad_views', 'clicks'].map(t => db.prepare(
        'UPDATE ' + t + ' SET issue_code = (SELECT p.issue_code FROM page_views p WHERE p.id = ' + t + '.page_view_id),' +
        " issue_id = COALESCE(NULLIF(issue_id,''), (SELECT p.issue_id FROM page_views p WHERE p.id = " + t + '.page_view_id))' +
        " WHERE kind IN ('article','franchise') AND " + BLANK + ' AND day >= ?1' +
        " AND page_view_id IN (SELECT id FROM page_views WHERE kind IN ('article','franchise') AND COALESCE(issue_code,'') <> '' AND day >= ?1)").bind(since)));
      const left = await db.prepare("SELECT COUNT(*) AS n, COUNT(DISTINCT path) AS pages FROM page_views WHERE kind = 'issue' AND " + BLANK).first();
      if (!healNote && left && left.n) healNote = left.n + (left.n === 1 ? ' issue page view has' : ' issue page views have') + ' no issue code yet (' +
        left.pages + (left.pages === 1 ? ' page' : ' pages') + '): the NEWSLETTERS item or its PUBLICATION PLANS item was not found in the CMS copy. ' +
        'They are tried again every 5 minutes.';
    } catch (e) { healNote = 'Issue codes could not be filled in: ' + ((e && e.message) || e); }
  }
  if (healNote) warnings.push(healNote);
}

// ── GET /sources ──────────────────────────────────────────
async function sourcesRead(env) {
  const db = env.PERF_DB, tz = tzOf(env), now = Date.now(), today = dayOf(now, tz), warnings = [];
  let rules = DEF_SOURCES;
  try { if (env.PERF_SOURCES) rules = Object.assign({}, DEF_SOURCES, JSON.parse(env.PERF_SOURCES)); } catch (e) { warnings.push('PERF_SOURCES is not valid JSON, so the default rules are used.'); }
  const st = await db.prepare('SELECT * FROM source_status').all();
  const rows = {};
  (st.results || []).forEach(r => { rows[r.source] = r; });
  const since = addDays(today, -6), yday = addDays(today, -1), cut = now - 86400000;
  const tables = ['page_views', 'ad_views', 'clicks'];
  const res = await db.batch([
    ...tables.map(t => db.prepare('SELECT day, COUNT(*) AS n FROM ' + t + ' WHERE day BETWEEN ? AND ? GROUP BY day').bind(since, today)),
    ...tables.map(t => db.prepare('SELECT COUNT(*) AS n FROM ' + t + ' WHERE day BETWEEN ? AND ? AND at >= ?').bind(yday, today, cut))
  ]);
  const days = {};
  for (let i = 0; i < 7; i++) days[addDays(since, i)] = { page_views: 0, ad_views: 0, clicks: 0 };
  tables.forEach((t, i) => (res[i].results || []).forEach(r => { if (days[r.day]) days[r.day][t] = r.n; }));
  const rows24 = tables.reduce((s, t, i) => s + (((res[3 + i].results || [])[0] || {}).n || 0), 0);
  const rowsToday = tables.reduce((s, t) => s + days[today][t], 0);

  const keys = [...new Set(Object.keys(rules).concat(Object.keys(rows)))];
  const sources = keys.map(k => {
    const r = rows[k], hours = Number(rules[k] && rules[k].hours) || null;
    const o = { source: k, connected: !!r, hours, lastOkAt: r ? r.last_ok_at || null : null,
      lastErrorAt: r ? r.last_error_at || null : null, lastError: r ? r.last_error || '' : '', note: r ? r.note || '' : '' };
    if (!r) o.status = 'not_connected';
    else if (o.lastErrorAt && (!o.lastOkAt || o.lastErrorAt > o.lastOkAt)) o.status = 'failing';
    else if (!o.lastOkAt) o.status = 'never';
    else if (!hours) o.status = 'no_rule';
    else { const age = now - o.lastOkAt; o.status = age <= hours * 3600000 ? 'healthy' : age <= 2 * hours * 3600000 ? 'late' : 'down'; }
    if (k === 'site') { o.rows24 = rows24; o.rowsToday = rowsToday; o.days = Object.keys(days).sort().reverse().map(d => Object.assign({ day: d }, days[d])); }
    return o;
  });
  return { ok: true, now, today, tz, sources, warnings };
}

// ══════════════════════════════════════════════════════════
// v1.2.0 — EDITIONS AND SITE: GET /editions, GET /edition, GET /site, POST /typed (staff only)
// ══════════════════════════════════════════════════════════
const CURVE = { top: 100, bottom: 18 };                                                                    // HC-P-PR4-11
const PROVIDERS = { stirista: 'Stirista', mailchimp: 'Mailchimp', nexstar: 'Nexstar', 'data-axle': 'Data Axle' };   // HC-P-PR5-2
const NO_SENDER = ['', 'email', 'unknown'];                                                                // HC-P-PR5-2: open-picture senders that name no source
// HC-P-PR5-1: the spot codes ix-issue-data writes into every link (ASM.utm), and where the IPP pickers put each.
const SPOTS = { FA: ['editorial', 'feature'], FR: ['editorial', 'franchise'], EV: ['editorial', 'events'], RE: ['editorial', 'market'],
  BA: ['revenue', 'banner'], HA: ['revenue', 'banner'], SP: ['revenue', 'sponsor'], TXA: ['revenue', 'text'], PA: ['revenue', 'paid'] };
const GROUPS = [
  { key: 'editorial', name: 'Editorial', note: 'Stories and listings, as in the Editorial Picker',
    subs: [['feature', 'Feature articles'], ['franchise', 'Franchise stories'], ['events', 'Events'], ['market', 'On the Market']] },
  { key: 'revenue', name: 'Revenue', note: 'Paid placements, as in the Revenue Picker',
    subs: [['banner', 'Banner ads'], ['sponsor', 'Franchise sponsors'], ['text', 'The Find · text ads'], ['paid', 'Paid article links']] },
  { key: 'other', name: 'Other links', note: 'Not placements, so no views', noViews: true, subs: [['other', '']] } ];
const HTML_FIELDS = ['email-render-html', 'web-render-html'];                                              // HC-P-PR5-3 (ix-issue-data JOIN.publish.html)
const SENT_FIELD = 'publish-date';                                                                         // HC-P-PR5-3
const GENERIC_WORDS = /^(read more|learn more|more|view|view more|details|click here|here|see more|shop now|visit|website)\W*$/i;   // HC-P-PR5-4
const W5 = { house: 'House ad', frPage: 'Franchise page', noName: 'Link', siteOther: 'Other links on the issue page', gone: 'Not in the compiled email',
  own: 'Our count', ownSub: 'ix-perf \u00b7 site', oursSub: 'Our open picture' };                                                       // HC-P-PR5-4
const ED_MAX = 600, NUM_MAX = 1000000000, SITE_DAYS = [7, 28, 90], SITE_PATHS = 40;                         // HC-P-PR5-5
const SHAPE_W = { banner: 'Banner ad', sidebar: 'Sidebar ad', house: 'House ad', text: 'Text ad', sponsor: 'Sponsor ad', paid: 'Paid placement' };   // HC-P-PR5-4
const KIND_W = { issue: 'Issue', article: 'Articles', archives: 'Archives', directory: 'Directory', franchise: 'Franchise pages', home: 'Home', other: 'Other pages' };
const HEAL_VISIT_DAYS = 3, HEAL_VISIT_FIRST = 35;                                                          // HC-P-PR5-6
let healedVisitsOnce = false;

function decodeEnt(s) {
  return String(s).replace(/&amp;/g, '&').replace(/&#0*38;/g, '&').replace(/&#x0*26;/gi, '&').replace(/&quot;/g, '"').replace(/&#0*39;/g, "'")
    .replace(/&rsquo;|&#8217;/g, '’').replace(/&nbsp;|&#160;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d{2,7});/g, (m, d) => { try { return String.fromCodePoint(+d); } catch (e) { return m; } })           // v1.2.1
    .replace(/&#x([0-9a-f]{2,6});/gi, (m, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch (e) { return m; } });
}
// v1.2.1 — a franchise band link's name: its own words, else the franchise's page address read as words.
function frWords(L) {
  const real = L.texts.concat(L.alts).filter(t => t && !GENERIC_WORDS.test(t)).sort((a, b) => b.length - a.length)[0];
  if (real) return real.slice(0, LEN.label);
  let seg = '';
  try { seg = decodeURIComponent(new URL(L.url).pathname.replace(/\/+$/, '').split('/').pop() || ''); } catch (e) {}
  const words = seg.replace(/[-_]+/g, ' ').trim().replace(/\b[a-z]/g, c => c.toUpperCase());
  return words ? words.slice(0, LEN.label) : W5.frPage;
}
// One link, whatever its tracking codes: site (no www), path (no trailing slash) and every parameter that is not utm_*.
function urlKey(u) {
  const raw = String(u || '').trim();
  try {
    const x = new URL(raw);
    if (!/^https?:$/.test(x.protocol)) return raw.toLowerCase().slice(0, 400);
    const q = [];
    x.searchParams.forEach((v, k) => { if (!/^utm_/i.test(k)) q.push(k + '=' + v); });
    q.sort();
    return (x.host.toLowerCase().replace(/^www\./, '') + x.pathname.replace(/\/+$/, '') + (q.length ? '?' + q.join('&') : '')).slice(0, 400);
  } catch (e) { return raw.toLowerCase().slice(0, 400); }
}
function pathKey(u) { try { return new URL(u).pathname.toLowerCase().replace(/\/+$/, '') || '/'; } catch (e) { return String(u || '').toLowerCase().replace(/[?#].*$/, '').replace(/\/+$/, '') || '/'; } }
function slotOf(v) { const m = String(v || '').match(/^([A-Z]{2,4})-b(\d{1,3})$/); return m ? { code: m[1], pos: parseInt(m[2], 10) } : null; }

// Every link of the compiled email, one line per link. The line's key is its spot and its address without utm codes.
function emailLines(html) {
  const map = new Map(), re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m, order = 0;
  while ((m = re.exec(html))) {
    const hm = /href\s*=\s*(["'])([\s\S]*?)\1/i.exec(m[1]);
    if (!hm) continue;
    const href = decodeEnt(hm[2].trim());
    if (!/^(https?:|tel:|sms:|mailto:)/i.test(href)) continue;
    let slot = '', adv = '';
    if (/^https?:/i.test(href)) { try { const sp = new URL(href).searchParams; slot = String(sp.get('utm_content') || ''); adv = String(sp.get('utm_term') || ''); } catch (e) {} }
    const so = slotOf(slot);
    if (!so) slot = '';
    const key = (slot + ' ' + urlKey(href)).slice(0, 480);
    const text = decodeEnt(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 120);
    const alt = decodeEnt((/alt\s*=\s*(["'])([\s\S]*?)\1/i.exec(m[2]) || [])[2] || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    let L = map.get(key);
    if (!L) { L = { key, slot, code: so ? so.code : '', pos: so ? so.pos : null, url: href.slice(0, LEN.dest), adv: idOk(adv) ? adv : '', texts: [], alts: [], order: order++ }; map.set(key, L); }
    if (text) L.texts.push(text);
    if (alt) L.alts.push(alt);
  }
  return [...map.values()];
}
function bestWords(L) {
  const real = L.texts.filter(t => !GENERIC_WORDS.test(t)).sort((a, b) => b.length - a.length);
  if (real.length) return real[0].slice(0, LEN.label);
  const alts = L.alts.filter(t => !GENERIC_WORDS.test(t));
  if (alts.length) return alts[0].slice(0, LEN.label);
  if (L.texts.length) return L.texts[0].slice(0, LEN.label);
  if (/^(tel:|sms:|mailto:)/i.test(L.url)) return L.url.replace(/\?.*$/, '').slice(0, LEN.label);
  return hostOf(L.url) || W5.noName;
}
function shareOf(pos, positions) {
  if (pos == null) return null;
  const i = positions.indexOf(pos), n = positions.length;
  if (i < 0) return null;
  if (n <= 1) return CURVE.top;
  return Math.round((CURVE.top - (CURVE.top - CURVE.bottom) * i / (n - 1)) * 10) / 10;
}
const numOrNull = v => (v == null ? null : Number(v));
function dShortTz(ms, tz) { try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: 'numeric', month: 'short' }).format(new Date(ms)); } catch (e) { return ''; } }
function seriesOf(code) { const m = String(code || '').match(/^(.*\d)([A-Za-z])$/); return m ? m[1] : ''; }

async function newsletterRows(env, warnings, id) {
  if (!env.CMS_DB) throw httpErr(500, 'ix-perf has no CMS_DB binding (database ix-content), so editions cannot be listed.');
  const C = await cmsCollections(env, warnings), why = issueReady(C);
  if (why) throw httpErr(500, why + ' Editions cannot be listed until it is.');
  const cols = 'n.item_id AS id, n.name AS name, n.slug AS slug, n.publisher_id AS pub, n.title_admin_id AS ta, n.created_on AS created, p.item_id AS plan, p.name AS code';
  const join = ' FROM copy_items n LEFT JOIN copy_items p ON p.collection_id = ?1 AND p.item_id = ' +
    "COALESCE(NULLIF(n.plan_id, ''), json_extract(n.field_data, ?2)) WHERE n.collection_id = ?3";
  const b = [C.plans.id, '$."' + ISSUE_PLAN_FIELD + '"', C.newsletters.id];
  if (id) return (await env.CMS_DB.prepare('SELECT ' + cols + ', n.field_data AS fd' + join + ' AND n.item_id = ?4').bind(...b, id).all()).results || [];
  return (await env.CMS_DB.prepare('SELECT ' + cols + join + ' AND n.is_archived = 0 ORDER BY n.created_on DESC LIMIT ' + ED_MAX).bind(...b).all()).results || [];
}
async function itemNames(env, ids) {
  const out = {}, list = [...new Set(ids.filter(Boolean))];
  for (let i = 0; i < list.length; i += 90) {
    const part = list.slice(i, i + 90);
    const r = await env.CMS_DB.prepare('SELECT item_id, name FROM copy_items WHERE item_id IN (' + part.map(() => '?').join(',') + ')').bind(...part).all();
    (r.results || []).forEach(x => { if (x.name) out[x.item_id] = x.name; });
  }
  return out;
}

// GET /editions — every NEWSLETTERS item with its issue code, newest first, and which ones hold numbers.
async function editionsRead(env) {
  const warnings = [], rows = await newsletterRows(env, warnings, null);
  const names = await itemNames(env, rows.map(r => r.pub).concat(rows.map(r => r.ta)));
  const has = new Set();
  try {
    const r = await env.PERF_DB.prepare("SELECT DISTINCT issue_id AS id FROM edition_sources UNION SELECT DISTINCT issue_id FROM email_opens WHERE COALESCE(issue_id,'') <> ''" +
      " UNION SELECT DISTINCT issue_id FROM page_views WHERE COALESCE(issue_id,'') <> ''").all();
    (r.results || []).forEach(x => has.add(x.id));
  } catch (e) { warnings.push(schemaWords(e)); }
  return { ok: true, editions: rows.filter(r => r.code).map(r => ({ id: r.id, code: String(r.code).trim(), name: r.name || '', publisher: names[r.pub] || '', title: names[r.ta] || '',
    titleAdmin: r.ta || '', created: r.created || '', series: seriesOf(String(r.code).trim()), data: has.has(r.id) })), warnings };
}
function schemaWords(e) {
  const m = (e && e.message) || String(e);
  return /no such table/i.test(m) ? 'D1 ix-perf is still on schema v1.0.2: run ix-perf-schema-v1.0.3-console.sql in the D1 console (tables edition_sources, edition_lines, edition_log).' : m;
}

// One edition, worked out in full. Used by /edition (one edition, or its series added up).
async function editionBuild(env, id, warnings) {
  const db = env.PERF_DB, tz = tzOf(env);
  const row = (await newsletterRows(env, warnings, id))[0];
  if (!row) throw httpErr(404, 'NEWSLETTERS item ' + id + ' is not in the CMS copy.');
  const code = str(String(row.code || '').trim(), LEN.code);
  let fd = {};
  try { fd = JSON.parse(row.fd || '{}') || {}; } catch (e) {}
  let html = '';
  for (const f of HTML_FIELDS) { if (String(fd[f] || '').trim()) { html = String(fd[f]); break; } }
  const names = await itemNames(env, [row.pub, row.ta]);
  const sentMs = Date.parse(String(fd[SENT_FIELD] || ''));
  const edition = { id, code, name: row.name || '', publisher: names[row.pub] || '', title: names[row.ta] || '', titleAdmin: row.ta || '',
    sentDay: isNaN(sentMs) ? '' : dayOf(sentMs, tz), series: seriesOf(code) };

  // 1 · the lines, from the compiled email
  let raw = [];
  if (html) raw = emailLines(html);
  else warnings.push('This edition has no compiled email in the CMS copy (' + HTML_FIELDS.join(', ') + '), so its links are listed from typed and counted numbers only.');
  const frAt = {}, withBand = new Set();
  raw.forEach(L => { if (L.code === 'FR' || L.code === 'SP') withBand.add(L.pos); if (L.code === 'FR') frAt[L.pos] = frWords(L); });
  const advNames = await namesRead(env, { publisher: new Set(), title: new Set(), advertiser: new Set(raw.map(L => L.adv).filter(Boolean)) }, warnings);
  const lines = raw.map(L => {
    const sp = SPOTS[L.code];
    let group = sp ? sp[0] : 'other', sub = sp ? sp[1] : 'other';
    if (L.code === 'FA' && withBand.has(L.pos)) sub = 'franchise';
    let label = bestWords(L), who = '';
    const advName = L.adv ? advNames.advertiser[L.adv] || '' : '';
    if (group === 'revenue' && advName) label = advName;
    else if (L.code === 'HA' && (!label || label === hostOf(L.url))) label = W5.house;
    if (L.code === 'FR') label = frAt[L.pos] || W5.frPage;
    if (L.code === 'SP') who = frAt[L.pos] || '';
    return { key: L.key, spot: L.slot, code: L.code, pos: L.pos, group, sub, label, who, url: L.url, adv: L.adv, order: L.order, clicks: {}, views: {} };
  });

  // 2 · the curve: where each block sits among the issue's blocks
  let positions = [], from = 'links';
  const linkPos = [...new Set(lines.map(L => L.pos).filter(p => p != null))].sort((a, b) => a - b);
  if (row.plan && env.CMS_DB) {
    try {
      const r = await env.CMS_DB.prepare('SELECT DISTINCT position AS p FROM nl_blocks WHERE plan_id = ? AND is_archived = 0 AND position IS NOT NULL ORDER BY position').bind(row.plan).all();
      const got = (r.results || []).map(x => Number(x.p)).filter(Number.isFinite);
      if (got.length && linkPos.every(p => got.indexOf(p) >= 0)) { positions = got; from = 'blocks'; }
      else if (got.length) warnings.push('Some links name a block position that the issue’s NL-BLOCKS rows do not hold, so the curve runs over the blocks that carry links (' + linkPos.length + ').');
    } catch (e) {}
  }
  if (!positions.length) positions = linkPos;
  lines.forEach(L => { L.share = shareOf(L.pos, positions); });

  // 3 · our own count for this edition
  const ISS = '(issue_id = ?1 OR issue_code = ?2)', code2 = code || '~no code~';   // a blank code must never match blank rows
  const own = await db.batch([
    db.prepare("SELECT COALESCE(slot,'') AS slot, COALESCE(dest,'') AS dest, COUNT(*) AS n FROM clicks WHERE kind = 'issue' AND " + ISS + ' GROUP BY 1, 2').bind(id, code2),
    db.prepare("SELECT COALESCE(slot,'') AS slot, COUNT(*) AS n FROM ad_views WHERE seen = 1 AND kind = 'issue' AND " + ISS + ' GROUP BY 1').bind(id, code2),
    db.prepare("SELECT COALESCE(path,'') AS path, COUNT(*) AS n FROM page_views WHERE kind <> 'issue' AND " + ISS + ' GROUP BY 1').bind(id, code2),
    db.prepare("SELECT COUNT(*) AS n FROM page_views WHERE kind = 'issue' AND " + ISS).bind(id, code2),
    db.prepare("SELECT COALESCE(list,'') AS list, COUNT(*) AS n FROM email_opens WHERE issue_id = ?1 GROUP BY 1").bind(id),
    db.prepare("SELECT COALESCE(link_code,'') AS s, COALESCE(slot,'') AS slot, COALESCE(dest,'') AS dest, COUNT(*) AS n FROM clicks" +     // v1.2.1
      " WHERE kind = 'email' AND source = 'localtap' AND issue_id = ?1 GROUP BY 1, 2, 3").bind(id)
  ]);
  const byUrl = {}, bySlot = {};
  lines.forEach(L => { (byUrl[urlKey(L.url)] = byUrl[urlKey(L.url)] || []).push(L); if (L.spot) (bySlot[L.spot] = bySlot[L.spot] || []).push(L); });
  let ownClicks = 0, ownLoose = 0, anyOwn = false;
  (own[0].results || []).forEach(r => {
    ownClicks += r.n; anyOwn = true;
    const cands = byUrl[urlKey(r.dest)] || [];
    const hit = cands.filter(L => L.spot === r.slot)[0] || (cands.length === 1 ? cands[0] : null) || (r.slot && (bySlot[r.slot] || []).length === 1 ? bySlot[r.slot][0] : null);
    if (hit) hit.clicks.own = (hit.clicks.own || 0) + r.n; else ownLoose += r.n;
  });
  (own[1].results || []).forEach(r => { anyOwn = true; (bySlot[r.slot] || []).forEach(L => { if (L.group === 'revenue') L.views.own = (L.views.own || 0) + r.n; }); });
  const byPath = {};
  lines.forEach(L => { if (/^https?:/i.test(L.url) && L.group === 'editorial') (byPath[pathKey(L.url)] = byPath[pathKey(L.url)] || []).push(L); });
  (own[2].results || []).forEach(r => { anyOwn = true; (byPath[pathKey(r.path)] || []).forEach(L => { L.views.own = (L.views.own || 0) + r.n; }); });
  const issuePageViews = ((own[3].results || [])[0] || {}).n || 0;
  if (issuePageViews) anyOwn = true;
  if (ownLoose) lines.push({ key: ' site-other', spot: '', code: '', pos: null, group: 'other', sub: 'other', label: W5.siteOther, who: '', url: '', adv: '', order: 1e6, share: null, clicks: { own: ownLoose }, views: {} });
  const ours = { bySender: {}, unnamed: 0 };
  (own[4].results || []).forEach(r => { if (NO_SENDER.indexOf(r.list) >= 0) ours.unnamed += r.n; else ours.bySender[r.list] = r.n; });
  // v1.2.1 · our own email clicks (GET /r), per sender and line
  ours.clicksBySender = {}; ours.clicksUnnamed = 0;
  const oursLine = {};                                    // sender -> { line key -> clicks }
  (own[5].results || []).forEach(r => {
    if (NO_SENDER.indexOf(r.s) >= 0) { ours.clicksUnnamed += r.n; return; }
    ours.clicksBySender[r.s] = (ours.clicksBySender[r.s] || 0) + r.n;
    const cands = byUrl[urlKey(r.dest)] || [];
    let hit = cands.filter(L => L.spot === r.slot)[0] || (cands.length === 1 ? cands[0] : null);
    if (!hit) {
      const key = ((slotOf(r.slot) ? r.slot : '') + ' ' + urlKey(r.dest)).slice(0, 480);
      hit = lines.filter(L => L.key === key)[0];
      if (!hit) { hit = { key, spot: slotOf(r.slot) ? r.slot : '', code: '', pos: null, group: 'other', sub: 'other', label: hostOf(r.dest) || W5.noName, who: '', url: r.dest, adv: '', order: 15e5, share: null, clicks: {}, views: {} }; lines.push(hit); }
    }
    const m = oursLine[r.s] = oursLine[r.s] || {};
    m[hit.key] = (m[hit.key] || 0) + r.n;
  });

  // 4 · typed and uploaded numbers
  let srcRows = [], lineRows = [];
  try {
    const t = await db.batch([db.prepare('SELECT * FROM edition_sources WHERE issue_id = ?').bind(id), db.prepare('SELECT source, line, clicks FROM edition_lines WHERE issue_id = ?').bind(id)]);
    srcRows = t[0].results || []; lineRows = t[1].results || [];
  } catch (e) { warnings.push(schemaWords(e)); }
  const lineBy = {};
  lines.forEach(L => { lineBy[L.key] = L; });
  lineRows.forEach(r => {
    let L = lineBy[r.line];
    if (!L) { L = { key: r.line, spot: (r.line.split(' ')[0] || ''), code: '', pos: null, group: 'other', sub: 'other', label: W5.gone + ': ' + r.line.trim().slice(0, 60), who: '', url: '', adv: '', order: 2e6, share: null, clicks: {}, views: {} }; lineBy[r.line] = L; lines.push(L); }
    if (r.clicks != null) L.clicks[r.source] = r.clicks;
  });

  // 5 · the sources in use, and the three top rows
  const sources = [], top = { sends: {}, opens: {}, clicks: {} };
  if (anyOwn) { sources.push({ key: 'own', name: W5.own, sub: W5.ownSub, kind: 'own', issuePageViews }); top.clicks.own = ownClicks; }
  const keys = [...new Set(srcRows.map(r => r.source).concat(lineRows.map(r => r.source)).concat(Object.keys(ours.bySender)).concat(Object.keys(ours.clicksBySender)))];
  const rank = k => { const i = Object.keys(PROVIDERS).indexOf(k); return i < 0 ? 99 : i; };
  keys.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  keys.forEach(k => {
    const r = srcRows.filter(x => x.source === k)[0] || null;
    const o = { key: k, name: (r && r.label) || PROVIDERS[k] || k, kind: 'typed', origin: r ? r.origin || 'typed' : '', file: r ? r.file_name || '' : '',
      enteredAt: r ? r.entered_at || null : null, oursOpens: ours.bySender[k] == null ? null : ours.bySender[k], opensFrom: '' };
    o.sub = !r ? (o.oursOpens != null || ours.clicksBySender[k] != null ? W5.oursSub : '') : (o.origin === 'upload' ? 'Report ' : 'Typed in ') + (o.enteredAt ? dShortTz(o.enteredAt, tz) : '');
    if (r && r.sends != null) top.sends[k] = r.sends;
    if (r && r.opens != null) { top.opens[k] = r.opens; o.opensFrom = 'source'; }
    else if (o.oursOpens != null) { top.opens[k] = o.oursOpens; o.opensFrom = 'ours'; }
    // v1.2.1 · clicks: the source's own (typed or uploaded) are used; until any are in, ours fill the column
    const ownLines = lineRows.some(x => x.source === k && x.clicks != null);
    o.clicksFrom = ownLines || (r && r.clicks != null) ? 'source' : '';
    if (!ownLines && oursLine[k]) {
      const byKey = {}; lines.forEach(L => { byKey[L.key] = L; });
      Object.keys(oursLine[k]).forEach(key => { if (byKey[key]) byKey[key].clicks[k] = oursLine[k][key]; });
      if (!(r && r.clicks != null)) { top.clicks[k] = ours.clicksBySender[k]; o.clicksFrom = 'ours'; }
    }
    if (r && r.clicks != null) top.clicks[k] = r.clicks;
    sources.push(o);
  });
  // views for the email sources: that source's opens times the block's share
  sources.forEach(s => { if (s.kind === 'own') return; const op = top.opens[s.key];
    if (op != null) lines.forEach(L => { if (L.share != null) L.views[s.key] = Math.round(op * L.share / 100); }); });

  return { edition, sources, top, lines, ours, curve: { top: CURVE.top, bottom: CURVE.bottom, blocks: positions.length, positions, from } };
}
function groupLines(lines) {
  return GROUPS.map(G => ({ key: G.key, name: G.name, note: G.note, noViews: !!G.noViews, subs: G.subs.map(s => ({ key: s[0], name: s[1],
    lines: lines.filter(L => L.group === G.key && L.sub === s[0]).sort((a, b) => (a.pos == null ? 1e9 : a.pos) - (b.pos == null ? 1e9 : b.pos) || a.order - b.order)
      .map(L => ({ key: L.key, spot: L.spot, label: L.label, who: L.who, pos: L.pos, share: L.share, url: L.url, clicks: L.clicks, views: L.views })) }))
    .filter(s => s.lines.length) })).filter(G => G.subs.length);
}
async function siblingsOf(env, ed, warnings) {
  if (!ed.series) return [];
  const all = await newsletterRows(env, warnings, null);
  return all.filter(r => r.ta === ed.titleAdmin && r.code && seriesOf(String(r.code).trim()) === ed.series)
    .map(r => ({ id: r.id, code: String(r.code).trim() })).sort((a, b) => a.code.localeCompare(b.code));
}
// GET /edition?n=<NEWSLETTERS item id>[&roll=1]
async function editionRead(url, env) {
  const id = String(url.searchParams.get('n') || '');
  if (!idOk(id)) throw httpErr(400, 'Missing or malformed n (NEWSLETTERS item id).');
  const warnings = [];
  await healIssues(env, warnings);
  const one = await editionBuild(env, id, warnings);
  const sibs = await siblingsOf(env, one.edition, warnings);
  one.edition.siblings = sibs;
  const base = { ok: true, providers: PROVIDERS, warnings };
  if (url.searchParams.get('roll') !== '1' || sibs.length < 2)
    return Object.assign(base, { rollup: false, edition: one.edition, sources: one.sources, top: one.top, groups: groupLines(one.lines), ours: one.ours, curve: one.curve });
  // the series added up: every number is the editions' numbers added; a line is the same link in the same group
  const parts = [];
  for (const s of sibs) parts.push(s.id === id ? one : await editionBuild(env, s.id, warnings));
  const sources = [], top = { sends: {}, opens: {}, clicks: {} }, lineBy = new Map(), ours = { bySender: {}, unnamed: 0, clicksBySender: {} };
  parts.forEach(p => {
    p.sources.forEach(s => { if (!sources.some(x => x.key === s.key)) sources.push(Object.assign({}, s, { sub: s.kind === 'own' ? s.sub : sibs.length + ' editions', opensFrom: '', oursOpens: null })); });
    ['sends', 'opens', 'clicks'].forEach(f => Object.keys(p.top[f]).forEach(k => { top[f][k] = (top[f][k] || 0) + p.top[f][k]; }));
    Object.keys(p.ours.bySender).forEach(k => { ours.bySender[k] = (ours.bySender[k] || 0) + p.ours.bySender[k]; });
    Object.keys(p.ours.clicksBySender || {}).forEach(k => { ours.clicksBySender[k] = (ours.clicksBySender[k] || 0) + p.ours.clicksBySender[k]; });
    ours.unnamed += p.ours.unnamed;
    p.lines.forEach(L => {
      const k = L.group + '|' + L.sub + '|' + (L.url ? urlKey(L.url) : L.key);
      let T = lineBy.get(k);
      if (!T) { T = Object.assign({}, L, { key: k, spot: L.code || L.spot, pos: null, share: null, clicks: {}, views: {}, order: lineBy.size }); lineBy.set(k, T); }
      Object.keys(L.clicks).forEach(s => { T.clicks[s] = (T.clicks[s] || 0) + L.clicks[s]; });
      Object.keys(L.views).forEach(s => { T.views[s] = (T.views[s] || 0) + L.views[s]; });
    });
  });
  const rank = s => (s.kind === 'own' ? -1 : Object.keys(PROVIDERS).indexOf(s.key) < 0 ? 99 : Object.keys(PROVIDERS).indexOf(s.key));
  sources.sort((a, b) => rank(a) - rank(b) || a.key.localeCompare(b.key));
  return Object.assign(base, { rollup: true, edition: one.edition, sources, top, groups: groupLines([...lineBy.values()]), ours,
    curve: { top: CURVE.top, bottom: CURVE.bottom, blocks: null, positions: [], from: 'series' } });
}

// GET /site?days=7|28|90[&title=<TITLES slug>] — pages tied to no edition. Our count only.
async function siteRead(url, env) {
  const db = env.PERF_DB, tz = tzOf(env), warnings = [];
  await healIssues(env, warnings);
  const days = SITE_DAYS.indexOf(parseInt(url.searchParams.get('days'), 10)) >= 0 ? parseInt(url.searchParams.get('days'), 10) : SITE_DAYS[0];
  const to = dayOf(Date.now(), tz), from = addDays(to, -(days - 1));
  const FREE = "COALESCE(issue_code,'') = '' AND COALESCE(issue_id,'') = '' AND kind <> 'issue' AND day BETWEEN ?1 AND ?2";
  const tr = await db.prepare("SELECT COALESCE(title,'') AS title, COUNT(*) AS n FROM page_views WHERE " + FREE + ' GROUP BY 1 ORDER BY n DESC').bind(from, to).all();
  const titles = (tr.results || []).map(x => x.title);
  let title = url.searchParams.has('title') ? String(url.searchParams.get('title')).slice(0, LEN.code) : (titles[0] == null ? '' : titles[0]);
  const T = " AND COALESCE(title,'') = ?3";
  const res = await db.batch([
    db.prepare("SELECT kind, COUNT(*) AS opened, COUNT(DISTINCT reader) AS readers FROM page_views WHERE " + FREE + T + ' GROUP BY kind').bind(from, to, title),
    db.prepare("SELECT kind, COUNT(*) AS n FROM clicks WHERE " + FREE + T + ' GROUP BY kind').bind(from, to, title),
    db.prepare("SELECT kind, COALESCE(path,'') AS path, COUNT(*) AS opened, COUNT(DISTINCT reader) AS readers FROM page_views WHERE " + FREE + T + ' GROUP BY kind, path ORDER BY opened DESC LIMIT 400').bind(from, to, title),
    db.prepare("SELECT c.kind AS kind, COALESCE(p.path,'') AS path, COUNT(*) AS n FROM clicks c LEFT JOIN page_views p ON p.id = c.page_view_id WHERE " +
      FREE.replace(/issue_code|issue_id|kind|day/g, x => 'c.' + x) + " AND COALESCE(c.title,'') = ?3 GROUP BY 1, 2").bind(from, to, title),
    db.prepare('SELECT ' + ADV_AD + " AS adv, COALESCE(shape,'') AS shape, kind, COUNT(*) AS onpage, SUM(seen) AS views FROM ad_views WHERE " + FREE + T + ' GROUP BY 1, 2, 3').bind(from, to, title),
    db.prepare('SELECT ' + ADV_CK + " AS adv, COALESCE(shape,'') AS shape, kind, COUNT(*) AS n FROM clicks WHERE COALESCE(shape,'') <> '' AND " + FREE + T + ' GROUP BY 1, 2, 3').bind(from, to, title),
    db.prepare("SELECT COUNT(DISTINCT reader) AS readers FROM page_views WHERE " + FREE + T).bind(from, to, title)
  ]);
  const ck = {}; (res[1].results || []).forEach(r => { ck[r.kind] = r.n; });
  const pck = {}; (res[3].results || []).forEach(r => { pck[r.kind + '|' + r.path] = r.n; });
  const order = ['home', 'archives', 'directory', 'franchise', 'article', 'other'];
  const pages = (res[0].results || []).sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind)).map(r => ({ kind: r.kind, name: KIND_W[r.kind] || r.kind,
    opened: r.opened, readers: r.readers, clicks: ck[r.kind] || 0,
    paths: (res[2].results || []).filter(p => p.kind === r.kind).slice(0, SITE_PATHS).map(p => ({ path: p.path, opened: p.opened, readers: p.readers, clicks: pck[r.kind + '|' + p.path] || 0 })) }));
  const adck = {}; (res[5].results || []).forEach(r => { adck[r.adv + '|' + r.shape + '|' + r.kind] = r.n; });
  const ads = (res[4].results || []).map(r => ({ adv: r.adv, shape: r.shape, kind: r.kind, placement: (SHAPE_W[r.shape] || 'Ad') + ' on ' + (KIND_W[r.kind] || r.kind),
    views: r.views || 0, onPage: r.onpage, clicks: adck[r.adv + '|' + r.shape + '|' + r.kind] || 0 }));
  const names = await namesRead(env, { publisher: new Set(), title: new Set(titles.filter(Boolean)), advertiser: new Set(ads.map(a => a.adv).filter(Boolean)) }, warnings);
  ads.forEach(a => { a.name = names.advertiser[a.adv] || a.adv || '–'; });
  ads.sort((a, b) => b.views - a.views || a.name.localeCompare(b.name));
  return { ok: true, days, from, to, title, titles: titles.map(t => ({ slug: t, name: names.title[t] || t || '(no title)' })), pages, ads,
    readers: ((res[6].results || [])[0] || {}).readers || 0, at: Date.now(), warnings };
}

// POST /typed — typed and uploaded numbers for one edition. Body:
//   { n: <NEWSLETTERS item id>, sources: [ { source, label, origin: 'typed' | 'upload', file, remove: true?,
//       top: { sends, opens, clicks }   only the ones that change; null clears
//       lines: [ { line, clicks } ]     null clears } ] }
async function typedWrite(request, env, who) {
  const db = env.PERF_DB;
  const text = await request.text();
  if (text.length > 400000) throw httpErr(413, 'Too large.');
  let m; try { m = JSON.parse(text); } catch (e) { throw httpErr(400, 'Not JSON.'); }
  const id = String((m && m.n) || '');
  if (!idOk(id)) throw httpErr(400, 'Missing or malformed n (NEWSLETTERS item id).');
  const list = Array.isArray(m.sources) ? m.sources : [];
  if (!list.length || list.length > 12) throw httpErr(400, 'No sources to save.');
  const now = Date.now(), by = str(who.memberId, LEN.id), stmts = [];
  const numIn = v => { if (v === null || v === '') return null; const n = Number(v); if (!Number.isInteger(n) || n < 0 || n > NUM_MAX) throw httpErr(400, 'A number must be a whole number from 0 up: ' + String(v).slice(0, 20)); return n; };
  const log = (source, line, field, val, origin) => stmts.push(db.prepare('INSERT INTO edition_log (id, at, entered_by, issue_id, source, line, field, value, origin) VALUES (?,?,?,?,?,?,?,?,?)')
    .bind(crypto.randomUUID(), now, by, id, source, line, field, val, origin));
  for (const s of list) {
    const source = String((s && s.source) || '').toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(source) || source === 'own') throw httpErr(400, 'A source needs a name of letters, digits and hyphens.');
    const origin = s.origin === 'upload' ? 'upload' : 'typed';
    if (s.remove) {
      stmts.push(db.prepare('DELETE FROM edition_sources WHERE issue_id = ? AND source = ?').bind(id, source));
      stmts.push(db.prepare('DELETE FROM edition_lines WHERE issue_id = ? AND source = ?').bind(id, source));
      log(source, '', 'removed', null, origin);
      continue;
    }
    const label = str(String(s.label || PROVIDERS[source] || source).trim(), 40), file = str(s.file, 200);
    stmts.push(db.prepare('INSERT INTO edition_sources (issue_id, source, label, origin, file_name, entered_by, entered_at) VALUES (?,?,?,?,?,?,?)' +
      ' ON CONFLICT(issue_id, source) DO UPDATE SET label = excluded.label, origin = excluded.origin, entered_by = excluded.entered_by, entered_at = excluded.entered_at,' +
      " file_name = CASE WHEN excluded.origin = 'upload' THEN excluded.file_name ELSE file_name END").bind(id, source, label, origin, file, by, now));
    const top = (s.top && typeof s.top === 'object') ? s.top : {};
    ['sends', 'opens', 'clicks'].forEach(f => {
      if (!(f in top)) return;
      const v = numIn(top[f]);
      stmts.push(db.prepare('UPDATE edition_sources SET ' + f + ' = ? WHERE issue_id = ? AND source = ?').bind(v, id, source));
      log(source, '', f, v, origin);
    });
    const lines = Array.isArray(s.lines) ? s.lines : [];
    if (lines.length > 400) throw httpErr(400, 'Too many lines.');
    lines.forEach(l => {
      const line = String((l && l.line) == null ? '' : l.line).slice(0, 480);
      if (!line.trim()) throw httpErr(400, 'A line has no key.');
      const v = numIn(l.clicks);
      if (v == null) stmts.push(db.prepare('DELETE FROM edition_lines WHERE issue_id = ? AND source = ? AND line = ?').bind(id, source, line));
      else stmts.push(db.prepare('INSERT INTO edition_lines (issue_id, source, line, clicks, origin, entered_by, entered_at) VALUES (?,?,?,?,?,?,?)' +
        ' ON CONFLICT(issue_id, source, line) DO UPDATE SET clicks = excluded.clicks, origin = excluded.origin, entered_by = excluded.entered_by, entered_at = excluded.entered_at')
        .bind(id, source, line, v, origin, by, now));
      log(source, line, 'clicks', v, origin);
    });
  }
  try { for (let i = 0; i < stmts.length; i += 80) await db.batch(stmts.slice(i, i + 80)); }
  catch (e) { throw httpErr(500, 'Not saved: ' + schemaWords(e)); }
  return { saved: stmts.length };
}
async function writeRoute(url, request, env, origin) {
  try {
    if (!env.PERF_DB) throw httpErr(500, 'PERF_DB is not bound on ix-perf.');
    const who = await staffOnly(request, env);
    const w = await typedWrite(request, env, who);
    return json({ ok: true, saved: w.saved, version: VERSION }, 200, origin);
  } catch (e) {
    return json({ ok: false, error: (e && e.message) || String(e), version: VERSION }, (e && e.status) || 500, origin);
  }
}

// ══════════════════════════════════════════════════════════
// v1.2.1 — OUR OWN EMAIL CLICK COUNT: GET /r/<NEWSLETTERS item id>/<sender>/<destination, base64url>
// ══════════════════════════════════════════════════════════
const R_PATH = /^\/r\/([0-9a-f]{24})\/([a-z0-9-]{1,40})\/([A-Za-z0-9_-]{8,3400})\/?$/;                       // HC-P-PR5-9
const R_MAX = 2400, R_KEEP_MS = 10 * 60 * 1000, R_MISS_MS = 60 * 1000;                                      // HC-P-PR5-9
const R_SHAPE = { BA: 'banner', HA: 'house', SP: 'sponsor', TXA: 'text', PA: 'paid' };                      // HC-P-PR5-9
const R_WORDS = { title: 'One more step', line: 'This link goes to', go: 'Continue', gone: 'This link is not part of that newsletter.' };   // HC-P-PR5-10
const linkSets = new Map();                                // NEWSLETTERS id -> { at, read, keys, hosts }
function b64uText(s) {
  let t = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(t), c => c.charCodeAt(0)));
}
const bareHost = u => { try { return new URL(u).host.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; } };
// The links of one newsletter's compiled email, from the CMS copy. read = false when it could not be read.
async function linkSet(env, id, now) {
  const hit = linkSets.get(id);
  if (hit && now - hit.at < (hit.read ? R_KEEP_MS : R_MISS_MS)) return hit;
  const out = { at: now, read: false, keys: new Set(), hosts: new Set() };
  try {
    if (env.CMS_DB) {
      const r = await env.CMS_DB.prepare('SELECT field_data AS fd FROM copy_items WHERE item_id = ? LIMIT 4').bind(id).all();
      for (const row of (r.results || [])) {
        let fd = {}; try { fd = JSON.parse(row.fd || '{}') || {}; } catch (e) {}
        const html = HTML_FIELDS.map(f => String(fd[f] || '')).filter(h => h.trim()).join('\n');
        if (!html) continue;
        emailLines(html).forEach(L => { if (/^https?:/i.test(L.url)) { out.keys.add(urlKey(L.url)); const h = bareHost(L.url); if (h) out.hosts.add(h); } });
        out.read = out.keys.size > 0;
        if (out.read) break;
      }
    }
  } catch (e) {}
  if (linkSets.size > 300) linkSets.clear();
  linkSets.set(id, out);
  return out;
}
async function clickWriteEmail(env, id, sender, dest, now) {
  const db = env.PERF_DB;
  if (!db) return;
  try {
    let slot = '', adv = '';
    try { const sp = new URL(dest).searchParams; slot = String(sp.get('utm_content') || ''); adv = String(sp.get('utm_term') || ''); } catch (e) {}
    const so = slotOf(slot);
    let code = '';
    try { code = (await issueCodes(env, [id], []))[id] || ''; } catch (e) {}
    await db.prepare('INSERT INTO clicks (id, at, day, source, page_view_id, reader, visit, publisher, title, kind, issue_id, issue_code, ad_id, advertiser_id,' +
      " slot, shape, link_type, dest, dest_host, internal, label, link_code, scanner) VALUES (?,?,?,'localtap','','','','','','email',?,?,'',?,?,?,'WEB',?,?,0,'',?,0)")
      .bind(crypto.randomUUID(), now, dayOf(now, tzOf(env)), id, code, idOk(adv) ? adv : '', so ? slot : '', so ? (R_SHAPE[so.code] || '') : '',
        dest.slice(0, LEN.dest), hostOf(dest), sender).run();
  } catch (e) { console.log('click write failed: ' + ((e && e.message) || e)); }
}
function plainPage(status, body) {
  return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex"><title>' + R_WORDS.title + '</title></head><body style="font:16px/1.5 Georgia,serif;margin:48px 24px;color:#22252B">' + body + '</body></html>',
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
const escH = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function clickRoute(m, request, env, ctx) {
  const id = m[1], sender = m[2], now = Date.now();
  let dest = '';
  try { dest = b64uText(m[3]).trim(); } catch (e) { dest = ''; }
  let ok = false;
  try { const u = new URL(dest); ok = /^https?:$/.test(u.protocol) && !!u.host && dest.length <= R_MAX && !/[\u0000-\u001f\s<>"]/.test(dest); } catch (e) {}
  if (!ok) return plainPage(404, '<p>' + R_WORDS.gone + '</p>');
  const set = await linkSet(env, id, now);
  const known = set.read && (set.keys.has(urlKey(dest)) || set.hosts.has(bareHost(dest)));
  if (set.read && !known) return plainPage(404, '<p>' + R_WORDS.gone + '</p>');
  if (request.method === 'GET') {                         // a HEAD is a link checker, not a click
    const job = clickWriteEmail(env, id, sender, dest, now);
    if (ctx && ctx.waitUntil) ctx.waitUntil(job); else await job;
  }
  if (known) return new Response(null, { status: 302, headers: { Location: dest, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  // the compiled email could not be read: show where the link goes and let the reader go there
  return plainPage(200, '<p>' + R_WORDS.line + ' <b>' + escH(bareHost(dest)) + '</b>.</p><p><a href="' + escH(dest) + '" rel="noreferrer" style="font-weight:bold">' + R_WORDS.go + ' &rarr;</a></p>');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = originsOf(env).indexOf(origin.replace(/\/+$/, '')) >= 0;
    if (request.method === 'OPTIONS') return new Response(null, { status: allowed ? 204 : 403, headers: allowed ? cors(origin) : {} });
    if (url.pathname.indexOf('/r/') === 0 && (request.method === 'GET' || request.method === 'HEAD')) {         // v1.2.1
      const rm = R_PATH.exec(url.pathname);
      return rm ? clickRoute(rm, request, env, ctx) : plainPage(404, '<p>' + R_WORDS.gone + '</p>');
    }
    if (url.pathname === '/o' && (request.method === 'GET' || request.method === 'HEAD')) {                    // v1.1.5
      if (request.method === 'GET') {       // a HEAD is a link checker, not an open
        const job = openWrite(env, url, request.headers.get('User-Agent'), Date.now());
        if (ctx && ctx.waitUntil) ctx.waitUntil(job); else await job;
      }
      return gif();
    }
    if (url.pathname === '/health') {
      let emailClicks24 = null;                                                                                 // v1.2.1
      if (env.PERF_DB) { try { emailClicks24 = ((await env.PERF_DB.prepare("SELECT COUNT(*) AS n FROM clicks WHERE kind = 'email' AND at >= ?").bind(Date.now() - 86400000).first()) || {}).n || 0; } catch (e) { emailClicks24 = null; } }
      let opens24 = null;                                                                                       // v1.1.5
      if (env.PERF_DB) { try { opens24 = ((await env.PERF_DB.prepare('SELECT COUNT(*) AS n FROM email_opens WHERE at >= ?').bind(Date.now() - 86400000).first()) || {}).n || 0; } catch (e) { opens24 = 'email_opens not readable: ' + ((e && e.message) || e); } }
      let issueLookup = 'ix-perf has no CMS_DB binding.';                                                       // v1.1.3
      if (env.CMS_DB) { try { issueLookup = issueReady(await cmsCollections(env, [])) || 'ready'; } catch (e) { issueLookup = 'CMS copy not readable: ' + ((e && e.message) || e); } }
      return json({ ok: true, version: VERSION, d1: !!env.PERF_DB, seen: seenOf(env), tz: tzOf(env),
        members: !!(env.MEMBERS && typeof env.MEMBERS.fetch === 'function'), cms: !!env.CMS_DB, issueLookup, opens24, emailClicks24 });  // v1.1.0, v1.1.5
    }
    if (['/raw', '/sources', '/editions', '/edition', '/site'].indexOf(url.pathname) >= 0 && request.method === 'GET') {   // v1.1.0, v1.2.0
      if (!allowed) return json({ ok: false, error: 'This page may not read ix-perf.' }, 403);
      return readRoute(url, request, env, origin);
    }
    if (url.pathname === '/typed' && request.method === 'POST') {                                              // v1.2.0
      if (!allowed) return json({ ok: false, error: 'This page may not write to ix-perf.' }, 403);
      return writeRoute(url, request, env, origin);
    }
    if (url.pathname === '/config') return json({ ok: true, seen: seenOf(env) }, 200, allowed ? origin : null);
    if (url.pathname === '/c' && request.method === 'POST') {
      if (!allowed) return json({ ok: false, error: 'This page may not send to ix-perf.' }, 403);
      return collect(request, env, ctx, origin);
    }
    return json({ ok: false, error: 'No such route.' }, 404);
  },
};
