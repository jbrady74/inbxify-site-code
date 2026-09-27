// ix-print-parse-v1.1.2.js
/* ════════════════════════════════════════════════════════════════
   ix-print-parse v1.1.2 · Cloudflare Worker

   ── v1.1.2 · STREAMED MODEL CALLS · NO MORE 524 ──
   Test 27 Sept, Wyckoff Living October (40 pages): the stitch failed
   with "Anthropic API: HTTP 524". A 524 is a timeout between two
   servers: the model took longer than about 100 seconds to start
   answering, so the connection was dropped before any reply. v1.1.1
   made the stitch bigger (every ad is now an item), which pushed a
   40-page issue past that limit. A 12-page issue stayed under it.

   Every model call is now STREAMED (stream: true). The answer starts
   arriving within seconds and keeps the connection alive however long
   the full answer takes. The Worker collects the pieces and returns
   the same response as before, so the Allocator needs no change.
   A stream that ends early or reports an error is a failure with the
   reason, never a partial success (TOAST-TRUTH).

   Also: "house" is tightened. A house ad promotes THIS magazine or its
   publisher. A library, town, school or charity promoting itself is a
   print ad (Watchung p.8 library anniversary was filed as house).

   ── v1.1.1 · EVERY AD IS KEPT · LISTINGS IN ADS ARE READ ──
   Rulings (Jeff, 27 Sept), made before v1.1.0 was deployed:
     · Listings shown in an ad ARE listings. An ad that shows one or
       more homes with a street address, any status (Sold, For Sale,
       Just Listed, Under Contract…), has those homes read as RE
       items; the ad's agent or team is the suggested Agent. An ad
       with only market statistics, charts or "call us" gives none.
       v1.1.0 said an agent's ad was never a listing: that was a
       misreading of the spec's statistics rule, and is reversed.
     · Homes sold long ago in an agent's ad are still read (as Sold);
       the operator unticks any that should not be created.
     · Every print ad is kept as a record: stitch item type
       "print-ad", named by its advertiser, with its approximate size.
     · The publisher's own ads (advertise with us, rate sheets,
       subscribe, follow us) are type "house-ad", a third section.

   Page read: ad blocks gain adSize, house and showsListings
   (itemCount = homes shown). re-listings is editorial only.
   Stitch: every ad is an item (print-ad or house-ad); `listings`
   is "ad" when the ad shows homes. The v1.1.0 rule that turned an
   event ad into an "other" item is replaced: it is a print-ad with
   event "ad".
   Extract: new kind "re-in-block" reads only the homes in one named
   ad. The editorial "re" kind never takes homes from an ad.

   v1.1.0 was never deployed. Discard it.

   ── v1.1.0 · EVENTS AND LISTINGS, ITEM BY ITEM (Allocator step 1) ──
   Spec: Allocator-RE-Events-Spec v1.10, build step 1 (Parser).

   PAGE READ learns two block kinds and one flag:
     · event-listings  a calendar or programme page: several dated
                       events listed one after another (a library's
                       monthly programmes, a town calendar).
     · re-listings     several properties, each with an address and
                       a status (Active, Sold, Under Contract…).
                       An agent's or brokerage's AD is never this,
                       even when it shows sold homes or market
                       statistics: it is an ad.
     · announcesEvent  on editorial-start and ad blocks: true when
                       the block announces a specific public event
                       with a printed date that readers can attend.
   The old kind "listings" is read as re-listings.

   STITCH returns two new item types and three new fields:
     · type events-page | re-page: ONE item per listings page (or
       run of consecutive pages). Individual events and listings
       never become stitch items.
     · event: "article" (an article that announces an event),
       "ad" (an ad that announces an event; the ad becomes an
       "other" item so the operator can see it) or "none".
     · pdfPage / pdfPages: the PDF page numbers, so the browser can
       render the right pages for extraction. `page` stays the
       printed folio.

   NEW ENDPOINT  POST /extract — one page image in, the items on it
   out. Three kinds:
     · events          every event on a listings page, with the
                       page's default venue and the heading each
                       item sits under (→ audience).
     · re              every property on a listings page. The
                       caller sends the LIVE Listing Phase option
                       labels (from ix-asset-list); the model picks
                       the one that means what the printed status
                       means, or none. No fixed word list lives
                       here (spec v1.8).
     · event-in-block  the event(s) one named article or ad on the
                       page announces.
     · re-in-block     (v1.1.1) the homes one named ad shows.
   Dates YYYY-MM-DD, times HH:mm (24h). A value not printed stays
   empty. Unclear text is flagged `check` with a reason and the raw
   text, never guessed. A malformed date or time from the model is
   blanked and flagged, not passed through.

   Nothing is written anywhere, as before. Duplicate checks and
   writes are later build steps, in the browser and in Make.

   TENANCY: unchanged. No publisher, title or issue is named here.
   Title name, issue name, issue year and phase labels arrive as
   data from the caller.

   ── v1.0.3 · CUSTOMER, NOT ADVERTORIAL · ONE DIRECTORY, ONE ITEM ──
   Terminology decision (Jeff, Sep 22): every editorial piece is an
   Article. What makes one paid is the Customer it belongs to, not a
   type label. So the stitch no longer returns "advertorial". It
   returns type article | other, plus `customer`: the business a
   piece is by or about and promotes, as printed, or empty. It is a
   suggestion; the operator confirms it when the article is created.
   A legacy "advertorial" reply is read as article.

   WLN October split the Expert Contributors directory into one item
   per contributor and dropped page 6's entries. A directory is now
   one item across all its pages. Mastheads and staff boxes are not
   items.

   ── v1.0.2 · THE STITCH HAS ROOM, AND SAYS WHY IT FAILS ──
   The stitch cap is STITCH_MAX_TOKENS (32000). Failures carry
   stop_reason, output token count and the start of the reply.

   ── v1.0.1 · A WRONG LABEL IS CORRECTED, NOT FATAL ──
   Labels are normalised and the original kept (pageKindRead,
   kindRead, typeRead). Only a reply with no usable structure fails.

   WHAT IT DOES
     POST /read-page   one page image  → one page read
     POST /stitch      all page reads  → manifest items
     POST /extract     one page image  → events or listings on it

   ENV (Cloudflare dashboard, Settings → Variables and Secrets)
     ANTHROPIC_API_KEY   Secret. Never Plaintext (HC-CLIENT-KEYFMT).
     PARSE_MODEL         Plaintext. Required; no default in code.
     ALLOWED_ORIGINS     Plaintext. Comma-separated. Required.

   TOAST-TRUTH
   Every response carries ok:true or ok:false with a reason.

   RULES THE PROMPTS ENFORCE (SLATE Parse Contract v0.1, extended)
     · Running head is read verbatim. Never inferred, never prefixed.
     · A byline is only what is printed. Blank beats invented.
     · Ads are not editorial. Agent ads are not property listings.
     · Image count is editorial photos only.
     · Dates and times are only what is printed; the issue year fills
       a missing year; anything unclear is flagged, not guessed.
   ════════════════════════════════════════════════════════════════ */

const VERSION = '1.1.2';
const PAGE_MAX_TOKENS = 2500;
const STITCH_MAX_TOKENS = 32000;
const EXTRACT_MAX_TOKENS = 16000;
const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

/* ── Prompts ──────────────────────────────────────────────── */

const PAGE_PROMPT = `You are reading one page of a printed local magazine, supplied as an image.
Report what is on the page. Do not summarise the content. Return JSON only, no prose, no code fences.

Shape:
{
  "printedPageNumber": number or null,
  "runningHead": string,
  "pageKind": "cover" | "contents" | "masthead" | "editorial" | "mixed" | "ads-only",
  "blocks": [
    {
      "kind": "editorial-start" | "editorial-continuation" | "ad" | "directory" | "event-listings" | "re-listings" | "letter" | "contents",
      "title": string,
      "byline": string,
      "advertiser": string,
      "editorialPhotoCount": number,
      "continuesOnNextPage": boolean,
      "announcesEvent": boolean,
      "adSize": "full" | "half" | "third" | "quarter" | "eighth" | "strip" | "",
      "house": boolean,
      "showsListings": boolean,
      "itemCount": number,
      "note": string
    }
  ]
}

Rules:
- printedPageNumber: the folio printed on the page. null if none is printed.
- runningHead: the section label printed at the top of the page (a tab, bar or kicker such as "OUR NEIGHBORS" or "EXPERT CONTRIBUTOR: PLUMBING & HEATING"). Copy it exactly as printed, then convert to title case. Do not shorten, abbreviate or prefix it. Empty string if the page has none. A large decorative header that sits above only ads is NOT a running head.
- pageKind must be exactly one of: cover, contents, masthead, editorial, mixed, ads-only. A page holding a directory, event-listings, re-listings or a letter is "editorial" (or "mixed" if it also holds ads).
- block kind must be exactly one of: editorial-start, editorial-continuation, ad, directory, event-listings, re-listings, letter, contents.
- pageKind "ads-only": every block on the page is an ad, even if a large section-style header appears at the top.
- editorial-start: a piece of editorial content whose headline begins on this page.
- editorial-continuation: editorial text or photos continuing a piece that began on an earlier page, with no new headline.
- event-listings: a calendar or programme listing — several separate dated events listed one after another under a heading (for example a library's monthly programmes). One block for the whole listing on this page. Set itemCount to the number of separate events listed.
- re-listings: several properties listed as EDITORIAL content (not inside an advertisement), each with an address and a status such as Active, Sold, Under Contract or For Sale. One block for the whole listing on this page. Set itemCount to the number of properties. An advertisement by an agent, team or brokerage is kind "ad", never re-listings; see showsListings.
- Every advertisement is its own ad block, however small. Two ads by the same business are two blocks.
- title: the headline exactly as printed, in title case, joining multi-line or multi-style headlines into one line. For continuations, empty string. For event-listings and re-listings, the heading printed over the listing.
- byline: the author name only, as printed after "BY". Drop "BY", job titles and company names. Empty string if no byline is printed. Never guess.
- advertiser: for kind "ad", the business name. Otherwise empty string.
- editorialPhotoCount: photographs that belong to the editorial block. Do not count ads, logos, headshots inside ads, decorative art, textures or icons. 0 for ads.
- continuesOnNextPage: true if the editorial text visibly runs on (mid-sentence ending, "CONTINUED", an arrow, or a spread layout).
- announcesEvent: for editorial-start and ad blocks only. true when the block announces a specific public event, with a printed date, that readers can attend (a fair, a concert, a ceremony, a festival, a lecture). false for sales, discounts, coupons, opening hours, deadlines, recruitment, or a report of an event that has already happened. false for every other block kind.
- adSize: for ad blocks only, the ad's approximate share of the page: "full", "half", "third", "quarter", "eighth", or "strip" (a thin band across the page). Empty string for every other block.
- house: for ad blocks only. true ONLY when the ad promotes this magazine itself or the company that publishes it (the magazine and publisher named on the page or above): selling advertising space ("place your ad here", rate sheets), subscriptions, "follow us" for the magazine, "send us your news", the publisher's own services. false for any other organisation's ad, including a library, town, school, church or charity promoting itself or its own anniversary. false for every non-ad block.
- showsListings: for ad blocks only. true when the ad shows one or more individual properties, each with a street address, in any status (sold, for sale, just listed, under contract, for rent). false for ads with only market statistics, charts, team photos or "call us". false for every non-ad block.
- itemCount: for event-listings and re-listings, the number of entries. For an ad with showsListings true, the number of properties shown. 0 otherwise.
- directory: a list of contributors or businesses with short descriptions. letter: a letter from the editor or publisher. contents: a table of contents.
- note: one short sentence only when something is uncertain. Otherwise empty string.`;

const STITCH_PROMPT = `You are given page-by-page reads of one printed magazine issue, in page order.
Merge them into the list of items in the issue. Return JSON only, no prose, no code fences.

Shape:
{
  "items": [
    {
      "name": string,
      "page": number,
      "pagesSpanned": string,
      "pdfPage": number,
      "pdfPages": [number],
      "section": string,
      "byline": string,
      "imageCount": number,
      "type": "article" | "other" | "events-page" | "re-page" | "print-ad" | "house-ad",
      "customer": string,
      "adSize": string,
      "event": "none" | "article" | "ad",
      "listings": "none" | "ad",
      "itemCount": number,
      "confidence": "high" | "medium" | "low",
      "note": string
    }
  ]
}

Rules:
- One item per editorial piece. Merge an editorial-start with the editorial-continuation blocks that follow it into one item.
- Include blocks of kind contents, directory and letter as items. A cover page gives no editorial items.
- EVERY ad block, on any page (including ads-only pages), is its own item: type "house-ad" when its house is true, otherwise "print-ad". One item per ad block, even when one business has several ads. name: the advertiser as printed (for a house ad, a short description such as "Advertise With Us"). section: the page's runningHead or empty. byline empty. imageCount 0. customer: the advertiser for a print-ad, empty for a house-ad. adSize: as read. event "ad" when announcesEvent is true. listings "ad" when showsListings is true, with itemCount the number of properties shown.
- A block of kind event-listings is ONE item of type "events-page". If the listing continues on the next page (the next page starts with more of the same listing), it is still one item across those pages. Never make one item per event. Name it by the heading printed over the listing. itemCount is the total entries across its pages.
- A block of kind re-listings (or the older kind "listings") is ONE item of type "re-page", on the same terms. Name it by the heading printed over the listing.
- A directory is ONE item, however many entries it lists and however many pages it spans. Never make one item per directory entry. Name it by the heading printed on it.
- Do not include mastheads, staff boxes, publication-team credits or contact lists as items.
- name: the title of the editorial-start block. For contents, directory, listings or letter blocks with no title, use the heading printed on the page.
- page: the printed page number where the item starts. If the read has no printed number, use the PDF page number given.
- pagesSpanned: printed pages, "8" for one page, "8-10" for a range.
- pdfPage: the pdfPage value of the read where the item starts, exactly as given in the reads.
- pdfPages: every pdfPage value the item appears on, in order.
- section: the runningHead of the page where the item starts, unchanged. Empty string if none.
- byline: from the editorial-start block, unchanged. Never invent one.
- imageCount: the sum of editorialPhotoCount across every page of the item. 0 for events-page and re-page.
- type: "events-page", "re-page", "print-ad" and "house-ad" as above. "other" for contents, directory and letter. Otherwise "article". Every editorial piece is an article, paid or not.
- customer: when the piece is written by or about a business and promotes it (a business profile, or an article by a company owner that closes with that company's contact details), the business name exactly as printed. For an ad item, the advertiser. Otherwise empty string. Never guess.
- event: "article" for an article item whose editorial-start block has announcesEvent true. "ad" for an ad item as above. Otherwise "none".
- listings: "ad" for an ad item whose showsListings is true. Otherwise "none".
- adSize: for print-ad and house-ad items, from the ad block. Otherwise empty.
- itemCount: for events-page and re-page, the number of entries; for an ad with listings "ad", the number of properties. Otherwise 0.
- confidence: "low" when a merge or the editorial/ad split was a judgement call. Explain in note.
- Keep items in page order.`;

const EXTRACT_EVENTS_PROMPT = `You are reading one page of a printed local magazine, supplied as an image. The page holds a listing of events (a calendar or programme list).
Extract every event on the page as data. Return JSON only, no prose, no code fences.

Shape:
{
  "pageDefaults": {
    "venueName": string, "street": string, "city": string, "state": string, "zip": string,
    "note": string
  },
  "items": [
    {
      "title": string,
      "audience": string,
      "dates": [ { "date": "YYYY-MM-DD", "startTime": "HH:mm", "endTime": "HH:mm" } ],
      "startDate": "YYYY-MM-DD",
      "startTime": "HH:mm",
      "endDate": "YYYY-MM-DD",
      "endTime": "HH:mm",
      "venueName": string,
      "venueFromDefault": boolean,
      "room": string,
      "street": string, "city": string, "state": string, "zip": string,
      "description": string,
      "cost": string,
      "link": string,
      "registrationRequired": true | false | null,
      "rainPlan": string,
      "sponsorCredit": string,
      "organiser": string,
      "check": boolean,
      "checkReason": string,
      "rawText": string
    }
  ]
}

Rules:
- One item per event. An event that repeats on several dates ("Wednesdays, August 5, 12, 19" or "Thursday, August 6, 13, 20") is ONE item with every date in "dates", in order.
- A date range ("August 5-7") is one item: startDate the first day, endDate the last day, dates empty, startTime/endTime the daily times.
- startDate/startTime/endTime: for a single date or a date list, the first date and its times. endDate empty unless a range.
- Dates as YYYY-MM-DD, times as 24-hour HH:mm. If no year is printed, use the issue year given above. A value that is not printed stays an empty string. Never guess.
- pageDefaults: the venue the page says applies unless noted (for example "hosted at the library, 20 Stirling Rd. unless otherwise noted"). Empty strings if the page states none.
- venueName and address: the item's own venue if it names one (for example "Wilson Memorial Church"). If it names none, copy the page default and set venueFromDefault true.
- audience: the heading the item sits under, as printed (for example "GRADES K - 5", "ADULT"), in title case. Empty if none.
- description: the item's own descriptive text as printed, joined into one paragraph. Do not add words.
- registrationRequired: true if the item says registration is required, false if it says none is needed, otherwise null.
- rainPlan, sponsorCredit, cost, link: only as printed for this item.
- organiser: the organiser if printed for this item, otherwise empty.
- check: true when any date or time is unclear — for example two times with no dash or "to" between them ("10:30 a.m. 5:30 p.m."), a missing weekday/date match, or text you cannot read. Put the reason in checkReason in one short sentence. Fill only the parts you are sure of.
- rawText: the item's printed text exactly, heading excluded.
- Do not include advertisements on the page.`;

const EXTRACT_BLOCK_EVENT_PROMPT = `You are reading one page of a printed local magazine, supplied as an image. The caller names one block on the page (an article or an ad). Report only the public event(s) that block announces — an occasion with a date that readers can attend. Ignore every other block on the page.
Return JSON only, no prose, no code fences.

Shape:
{
  "items": [
    {
      "title": string,
      "audience": string,
      "dates": [ { "date": "YYYY-MM-DD", "startTime": "HH:mm", "endTime": "HH:mm" } ],
      "startDate": "YYYY-MM-DD", "startTime": "HH:mm",
      "endDate": "YYYY-MM-DD", "endTime": "HH:mm",
      "venueName": string, "venueFromDefault": false,
      "room": string, "street": string, "city": string, "state": string, "zip": string,
      "description": string, "cost": string, "link": string,
      "registrationRequired": true | false | null,
      "rainPlan": string, "sponsorCredit": string, "organiser": string,
      "check": boolean, "checkReason": string, "rawText": string
    }
  ]
}

Rules:
- One item per event. One event on several dates is ONE item with every date in "dates". A range ("August 5-7") is startDate + endDate with dates empty.
- A series with different acts on different dates (for example a concert series listing two Sundays) is ONE item: the series name as title, every date in "dates", the acts named in description.
- title: the event's name as printed. If the block's headline is the event (for example "National Night Out August 4"), use the event name without the date.
- description: one or two sentences from the printed text about the event itself (what, who, what to bring). Do not add words or opinions.
- Dates YYYY-MM-DD, times 24-hour HH:mm. No year printed → the issue year given above. Not printed → empty string. Never guess.
- rainPlan: any bad-weather arrangement as printed (for example "moved indoors to the Community Room, 425 East Broad Street").
- sponsorCredit: sponsors as printed. organiser: who organises it, as printed.
- check: true when a date or time is unclear; reason in checkReason. rawText: the printed sentences that give the event's date, time and place.
- If the block announces no event with a date, return "items": [].`;

const RE_SHAPE_AND_RULES = `
Shape:
{
  "items": [
    {
      "address": string,
      "city": string,
      "mlsNumber": string,
      "price": string,
      "statusPrinted": string,
      "phase": string,
      "phaseNote": string,
      "bedrooms": string,
      "bathrooms": string,
      "sqFt": string,
      "brokerage": string,
      "agentName": string,
      "description": string,
      "link": string,
      "check": boolean,
      "checkReason": string,
      "rawText": string
    }
  ]
}

Rules:
- address: the street address as printed (for example "114 Wyckoff Avenue"), without the town. city: the town as printed after it (for example "Wyckoff"), else empty.
- price: the asking or sale price as printed, digits only (for example "1250000"). Empty if none is printed.
- statusPrinted: the status words exactly as printed (for example "UNDER CONTRACT").
- phase: choose from the Listing Phase options given above the one that means the same thing as the printed status (for example "Active" printed and "Just Listed" offered; "Pending" printed and "Under Contract" offered). Copy the option exactly as given. If no option fits, empty string. Never invent an option.
- phaseNote: the printed status words when they say more than the chosen phase (for example "Open House Sun 1-4" with phase "Open House"), or when no phase fits. Otherwise empty.
- bedrooms, bathrooms, sqFt: as printed (for example "4", "3 Full, 1 Half", "2,850"). Empty if not printed.
- brokerage, agentName, description, link, mlsNumber: only as printed for this property. Empty if not printed.
- check: true when something is unclear; reason in checkReason.
- rawText: the property's printed text exactly.`;

const EXTRACT_RE_PROMPT = `You are reading one page of a printed local magazine, supplied as an image. The page holds an editorial listing of properties (for example "August Listings and Sales").
Extract every property in that editorial listing. Do NOT take properties from any advertisement on the page (an agent's, team's or brokerage's ad): those are read separately. Return JSON only, no prose, no code fences.
` + RE_SHAPE_AND_RULES;

const EXTRACT_RE_IN_BLOCK_PROMPT = `You are reading one page of a printed local magazine, supplied as an image. The caller names one advertisement on the page. Extract every property that advertisement shows — each home with a street address, in any status (sold, for sale, just listed, under contract, for rent). Ignore every other block on the page. Return JSON only, no prose, no code fences.
- agentName: the agent or team the ad is for, as printed, for every property. brokerage: the brokerage named in the ad, as printed.
- If the ad shows no property with a street address (only statistics, charts or contact details), return "items": [].
` + RE_SHAPE_AND_RULES;

/* ── Helpers ──────────────────────────────────────────────── */

function corsHeaders(env, origin) {
  const allowed = String(env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const ok = origin && allowed.indexOf(origin) > -1;
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
  });
}

function fail(reason, status, cors, extra) {
  return json(Object.assign({ ok: false, v: VERSION, reason: reason }, extra || {}), status || 400, cors);
}

function parseModelJson(text) {
  const clean = String(text || '').replace(/```json|```/g, '').trim();
  const a = clean.indexOf('{');
  const b = clean.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('model reply held no JSON object');
  return JSON.parse(clean.slice(a, b + 1));
}

function parseOrExplain(out, label) {
  try { return { ok: true, value: parseModelJson(out.text) }; }
  catch (e) {
    const outTok = out.usage && out.usage.output_tokens;
    const cut = out.stop === 'max_tokens';
    const why = cut
      ? label + ': the reply was cut off at the output limit (' + outTok + ' tokens) before it was finished'
      : label + ': ' + e.message;
    return { ok: false, reason: why, detail: {
      stop_reason: out.stop, output_tokens: outTok,
      text_start: String(out.text || '').slice(0, 200)
    } };
  }
}

/* v1.1.2 — streamed. The reply arrives as server-sent events; text
   pieces are joined in order. Returns the same shape as before:
   { text, usage, stop }. */
async function callClaude(env, content, maxTokens) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': API_VERSION
    },
    body: JSON.stringify({
      model: env.PARSE_MODEL,
      max_tokens: maxTokens,
      stream: true,
      messages: [{ role: 'user', content: content }]
    })
  });
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    const msg = body && body.error ? body.error.message : ('HTTP ' + res.status);
    throw new Error('Anthropic API: ' + msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '', text = '', stop = '', ended = false;
  const usage = { input_tokens: 0, output_tokens: 0 };

  function handle(evt) {
    if (!evt || typeof evt !== 'object') return;
    if (evt.type === 'message_start' && evt.message && evt.message.usage) {
      usage.input_tokens = evt.message.usage.input_tokens || 0;
    } else if (evt.type === 'content_block_delta' && evt.delta && evt.delta.type === 'text_delta') {
      text += evt.delta.text || '';
    } else if (evt.type === 'message_delta') {
      if (evt.delta && evt.delta.stop_reason) stop = evt.delta.stop_reason;
      if (evt.usage && evt.usage.output_tokens != null) usage.output_tokens = evt.usage.output_tokens;
    } else if (evt.type === 'message_stop') {
      ended = true;
    } else if (evt.type === 'error') {
      throw new Error('Anthropic API: ' + ((evt.error && evt.error.message) || 'stream error'));
    }
  }

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let cut;
    while ((cut = buf.indexOf('\n\n')) > -1) {
      const chunk = buf.slice(0, cut);
      buf = buf.slice(cut + 2);
      const data = chunk.split('\n').filter(l => l.startsWith('data:'))
        .map(l => l.slice(5).trim()).join('');
      if (!data || data === '[DONE]') continue;
      let evt = null;
      try { evt = JSON.parse(data); } catch (e) { continue; }
      handle(evt);
    }
  }
  if (!ended) throw new Error('Anthropic API: the answer stopped before it was finished');
  return { text: text, usage: usage, stop: stop };
}

/* ── Validation ───────────────────────────────────────────── */

const PAGE_KINDS  = ['cover', 'contents', 'masthead', 'editorial', 'mixed', 'ads-only'];
const BLOCK_KINDS = ['editorial-start', 'editorial-continuation', 'ad', 'directory',
                     'event-listings', 're-listings', 'letter', 'contents'];
const ITEM_TYPES  = ['article', 'other', 'events-page', 're-page', 'print-ad', 'house-ad'];
const EVENT_FROM  = ['none', 'article', 'ad'];
const AD_SIZES    = ['full', 'half', 'third', 'quarter', 'eighth', 'strip'];

const PAGE_FROM_BLOCK = { directory: 'editorial', 'event-listings': 'editorial',
                          're-listings': 'editorial', listings: 'editorial',
                          letter: 'editorial', contents: 'contents', ad: 'mixed' };

function toNum(v) { const n = Number(v); return isNaN(n) ? 0 : n; }
function str(v) { return v == null ? '' : String(v).trim(); }
function bool(v) { return v === true || v === 'true'; }

function checkPage(r) {
  if (!r || typeof r !== 'object') return 'page read is not an object';
  if (!Array.isArray(r.blocks)) {
    if (r.blocks == null) r.blocks = [];
    else return 'blocks is not an array';
  }
  if (PAGE_KINDS.indexOf(r.pageKind) < 0) {
    r.pageKindRead = r.pageKind;
    r.pageKind = PAGE_FROM_BLOCK[r.pageKind] || 'mixed';
  }
  r.blocks = r.blocks.filter(b => b && typeof b === 'object').map(b => {
    if (b.kind === 'listings') { b.kindRead = 'listings'; b.kind = 're-listings'; }   /* v1.1.0 legacy */
    if (BLOCK_KINDS.indexOf(b.kind) < 0) {
      b.kindRead = b.kind;
      b.kind = /ad|advert/i.test(String(b.kind)) ? 'ad' : 'editorial-start';
      b.note = ((b.note || '') + ' Kind "' + b.kindRead + '" was not recognised.').trim();
    }
    b.title = String(b.title || '');
    b.byline = String(b.byline || '');
    b.advertiser = String(b.advertiser || '');
    b.editorialPhotoCount = toNum(b.editorialPhotoCount);
    b.continuesOnNextPage = bool(b.continuesOnNextPage);
    b.announcesEvent = (b.kind === 'editorial-start' || b.kind === 'ad') && bool(b.announcesEvent);
    /* v1.1.1 — ad facts */
    const isAd = b.kind === 'ad';
    b.adSize = isAd && AD_SIZES.indexOf(String(b.adSize || '').toLowerCase()) > -1 ? String(b.adSize).toLowerCase() : '';
    b.house = isAd && bool(b.house);
    b.showsListings = isAd && bool(b.showsListings);
    b.itemCount = (b.kind === 'event-listings' || b.kind === 're-listings' || b.showsListings) ? toNum(b.itemCount) : 0;
    return b;
  });
  if (r.printedPageNumber != null && typeof r.printedPageNumber !== 'number') {
    const n = parseInt(r.printedPageNumber, 10);
    r.printedPageNumber = isNaN(n) ? null : n;
  }
  r.runningHead = String(r.runningHead || '');
  return '';
}

function checkItems(o) {
  if (!o || !Array.isArray(o.items)) return 'items is not an array';
  o.items = o.items.filter(it => it && typeof it === 'object').map(it => {
    if (typeof it.page !== 'number') {
      const n = parseInt(it.page, 10);
      it.page = isNaN(n) ? 0 : n;
    }
    if (!it.name) {
      it.name = 'Untitled item, page ' + (it.page || '?');
      it.confidence = 'low';
      it.note = ((it.note || '') + ' No title was read.').trim();
    }
    if (it.type === 'advertorial') it.type = 'article';   /* legacy label */
    if (ITEM_TYPES.indexOf(it.type) < 0) {
      it.typeRead = it.type;
      it.type = 'other';
      it.confidence = 'low';
      it.note = ((it.note || '') + ' Type "' + it.typeRead + '" was not recognised.').trim();
    }
    if (EVENT_FROM.indexOf(it.event) < 0) it.event = 'none';
    it.listings = (it.listings === 'ad' && (it.type === 'print-ad' || it.type === 'house-ad')) ? 'ad' : 'none';
    it.adSize = (it.type === 'print-ad' || it.type === 'house-ad') && AD_SIZES.indexOf(String(it.adSize || '').toLowerCase()) > -1
      ? String(it.adSize).toLowerCase() : '';
    if (it.type === 'house-ad') it.customer = '';
    it.section = String(it.section || '');
    it.byline = String(it.byline || '');
    it.customer = String(it.customer || '');
    it.imageCount = toNum(it.imageCount);
    it.itemCount = toNum(it.itemCount);
    it.pagesSpanned = String(it.pagesSpanned || it.page);
    it.pdfPage = toNum(it.pdfPage);
    it.pdfPages = Array.isArray(it.pdfPages) ? it.pdfPages.map(toNum).filter(Boolean) : [];
    if (!it.pdfPages.length && it.pdfPage) it.pdfPages = [it.pdfPage];
    if (!it.pdfPage && it.pdfPages.length) it.pdfPage = it.pdfPages[0];
    return it;
  });
  return '';
}

/* Extraction: every value is checked for shape. A malformed date or
   time is blanked and the item flagged, so nothing unreadable reaches
   the operator looking like a clean value. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function flag(it, why) {
  it.check = true;
  it.checkReason = (it.checkReason ? it.checkReason + ' ' : '') + why;
}
function cleanDate(it, k) {
  const v = str(it[k]);
  if (v && !DATE_RE.test(v)) { flag(it, 'Unreadable ' + k + ' "' + v + '".'); it[k] = ''; return; }
  it[k] = v;
}
function cleanTime(it, k) {
  let v = str(it[k]);
  if (/^\d:\d\d$/.test(v)) v = '0' + v;
  if (v && !TIME_RE.test(v)) { flag(it, 'Unreadable ' + k + ' "' + v + '".'); it[k] = ''; return; }
  it[k] = v;
}

function checkEvents(o) {
  if (!o || !Array.isArray(o.items)) return 'items is not an array';
  const d = o.pageDefaults && typeof o.pageDefaults === 'object' ? o.pageDefaults : {};
  o.pageDefaults = { venueName: str(d.venueName), street: str(d.street), city: str(d.city),
                     state: str(d.state), zip: str(d.zip), note: str(d.note) };
  o.items = o.items.filter(it => it && typeof it === 'object').map(it => {
    ['title', 'audience', 'venueName', 'room', 'street', 'city', 'state', 'zip',
     'description', 'cost', 'link', 'rainPlan', 'sponsorCredit', 'organiser',
     'checkReason', 'rawText'].forEach(k => { it[k] = str(it[k]); });
    it.check = bool(it.check);
    it.venueFromDefault = bool(it.venueFromDefault);
    it.registrationRequired = it.registrationRequired === true || it.registrationRequired === 'true' ? true
      : (it.registrationRequired === false || it.registrationRequired === 'false' ? false : null);
    ['startDate', 'endDate'].forEach(k => cleanDate(it, k));
    ['startTime', 'endTime'].forEach(k => cleanTime(it, k));
    it.dates = (Array.isArray(it.dates) ? it.dates : []).filter(x => x && typeof x === 'object').map(x => {
      const e = { date: str(x.date), startTime: str(x.startTime), endTime: str(x.endTime) };
      if (e.date && !DATE_RE.test(e.date)) { flag(it, 'Unreadable date "' + e.date + '".'); e.date = ''; }
      ['startTime', 'endTime'].forEach(k => {
        let v = e[k]; if (/^\d:\d\d$/.test(v)) v = '0' + v;
        if (v && !TIME_RE.test(v)) { flag(it, 'Unreadable time "' + v + '".'); v = ''; }
        e[k] = v;
      });
      return e;
    }).filter(e => e.date);
    if (!it.startDate && it.dates.length) {
      it.startDate = it.dates[0].date;
      if (!it.startTime) it.startTime = it.dates[0].startTime;
      if (!it.endTime) it.endTime = it.dates[0].endTime;
    }
    if (!it.title) { it.title = 'Untitled event'; flag(it, 'No title was read.'); }
    if (!it.startDate) flag(it, 'No date was found.');
    return it;
  });
  return '';
}

function checkListings(o, phases) {
  if (!o || !Array.isArray(o.items)) return 'items is not an array';
  const allowed = {};
  (phases || []).forEach(p => { allowed[String(p).trim().toLowerCase()] = String(p).trim(); });
  o.items = o.items.filter(it => it && typeof it === 'object').map(it => {
    ['address', 'city', 'mlsNumber', 'statusPrinted', 'phase', 'phaseNote', 'bedrooms',
     'bathrooms', 'sqFt', 'brokerage', 'agentName', 'description', 'link',
     'checkReason', 'rawText'].forEach(k => { it[k] = str(it[k]); });
    it.check = bool(it.check);
    it.price = str(it.price).replace(/[^0-9.]/g, '');
    /* The phase must be one of the live options sent, exactly. */
    if (it.phase) {
      const hit = allowed[it.phase.toLowerCase()];
      if (hit) it.phase = hit;
      else {
        it.phaseRead = it.phase;
        it.phase = '';
        if (!it.phaseNote) it.phaseNote = it.statusPrinted;
        flag(it, 'Phase "' + it.phaseRead + '" is not one of the options.');
      }
    }
    if (!it.phase && !it.phaseNote && it.statusPrinted) it.phaseNote = it.statusPrinted;
    if (!it.address) { it.address = 'Unknown address'; flag(it, 'No address was read.'); }
    return it;
  });
  return '';
}

/* ── Handlers ─────────────────────────────────────────────── */

async function readPage(req, env, cors) {
  const b = await req.json().catch(() => null);
  if (!b || !b.image) return fail('image missing', 400, cors);
  if (typeof b.pdfPage !== 'number') return fail('pdfPage missing', 400, cors);
  const mediaType = b.mediaType || 'image/jpeg';
  if (['image/jpeg', 'image/png', 'image/webp'].indexOf(mediaType) < 0) {
    return fail('unsupported mediaType: ' + mediaType, 400, cors);
  }

  const context = b.titleName
    ? 'The magazine is "' + String(b.titleName).slice(0, 120) + '". This is PDF page ' + b.pdfPage + '.'
    : 'This is PDF page ' + b.pdfPage + '.';

  let out;
  try {
    out = await callClaude(env, [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: b.image } },
      { type: 'text', text: context + '\n\n' + PAGE_PROMPT }
    ], PAGE_MAX_TOKENS);
  } catch (e) {
    return fail(String(e.message || e), 502, cors, { pdfPage: b.pdfPage });
  }

  const pr = parseOrExplain(out, 'page ' + b.pdfPage);
  if (!pr.ok) return fail(pr.reason, 502, cors, { pdfPage: b.pdfPage, detail: pr.detail });
  const read = pr.value;

  const bad = checkPage(read);
  if (bad) return fail('page ' + b.pdfPage + ': ' + bad, 502, cors, { pdfPage: b.pdfPage });

  read.pdfPage = b.pdfPage;
  return json({ ok: true, v: VERSION, pdfPage: b.pdfPage, read: read, usage: out.usage }, 200, cors);
}

async function stitch(req, env, cors) {
  const b = await req.json().catch(() => null);
  if (!b || !Array.isArray(b.reads) || !b.reads.length) return fail('reads missing', 400, cors);

  const reads = b.reads.filter(Boolean).slice().sort((x, y) => (x.pdfPage || 0) - (y.pdfPage || 0));
  const context = b.titleName
    ? 'The magazine is "' + String(b.titleName).slice(0, 120) + '".'
    : '';

  let out;
  try {
    out = await callClaude(env, [
      { type: 'text', text: context + '\n\nPage reads:\n' + JSON.stringify(reads) + '\n\n' + STITCH_PROMPT }
    ], STITCH_MAX_TOKENS);
  } catch (e) {
    return fail(String(e.message || e), 502, cors);
  }

  const pr = parseOrExplain(out, 'stitch');
  if (!pr.ok) return fail(pr.reason, 502, cors, { detail: pr.detail });
  const o = pr.value;

  const bad = checkItems(o);
  if (bad) return fail('stitch: ' + bad, 502, cors);

  return json({ ok: true, v: VERSION, items: o.items, usage: out.usage }, 200, cors);
}

/* Body: { kind: "events" | "re" | "event-in-block", pdfPage, image,
           mediaType?, titleName?, issueName?, issueYear?,
           blockName?, blockKind? ("article"|"ad"), phases? [labels] } */
async function extract(req, env, cors) {
  const b = await req.json().catch(() => null);
  if (!b || !b.image) return fail('image missing', 400, cors);
  if (typeof b.pdfPage !== 'number') return fail('pdfPage missing', 400, cors);
  const kind = String(b.kind || '');
  if (['events', 're', 'event-in-block', 're-in-block'].indexOf(kind) < 0) return fail('unknown kind: ' + kind, 400, cors);
  if ((kind === 'event-in-block' || kind === 're-in-block') && !b.blockName) return fail('blockName missing', 400, cors);
  const mediaType = b.mediaType || 'image/jpeg';
  if (['image/jpeg', 'image/png', 'image/webp'].indexOf(mediaType) < 0) {
    return fail('unsupported mediaType: ' + mediaType, 400, cors);
  }

  const phases = Array.isArray(b.phases) ? b.phases.map(p => String(p).slice(0, 60)).filter(Boolean).slice(0, 40) : [];
  const ctx = [];
  if (b.titleName) ctx.push('The magazine is "' + String(b.titleName).slice(0, 120) + '".');
  if (b.issueName) ctx.push('The issue is "' + String(b.issueName).slice(0, 60) + '".');
  const yr = parseInt(b.issueYear, 10);
  ctx.push('Issue year: ' + (isNaN(yr) ? 'not given; leave the year out only if none is printed and use empty dates' : yr) + '.');
  ctx.push('This is PDF page ' + b.pdfPage + '.');
  let prompt;
  if (kind === 'events') prompt = EXTRACT_EVENTS_PROMPT;
  else if (kind === 'event-in-block') {
    ctx.push('The block is the ' + (b.blockKind === 'ad' ? 'advertisement' : 'article') +
             ' "' + String(b.blockName).slice(0, 160) + '".');
    prompt = EXTRACT_BLOCK_EVENT_PROMPT;
  } else {
    if (kind === 're-in-block') ctx.push('The advertisement is by "' + String(b.blockName).slice(0, 160) + '".');
    ctx.push('Listing Phase options: ' + (phases.length ? phases.map(p => '"' + p + '"').join(', ') : 'none given — leave phase empty') + '.');
    prompt = kind === 're-in-block' ? EXTRACT_RE_IN_BLOCK_PROMPT : EXTRACT_RE_PROMPT;
  }

  let out;
  try {
    out = await callClaude(env, [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: b.image } },
      { type: 'text', text: ctx.join('\n') + '\n\n' + prompt }
    ], EXTRACT_MAX_TOKENS);
  } catch (e) {
    return fail(String(e.message || e), 502, cors, { pdfPage: b.pdfPage });
  }

  const pr = parseOrExplain(out, 'extract page ' + b.pdfPage);
  if (!pr.ok) return fail(pr.reason, 502, cors, { pdfPage: b.pdfPage, detail: pr.detail });
  const o = pr.value;

  const bad = (kind === 're' || kind === 're-in-block') ? checkListings(o, phases) : checkEvents(o);
  if (bad) return fail('extract page ' + b.pdfPage + ': ' + bad, 502, cors, { pdfPage: b.pdfPage });

  return json({ ok: true, v: VERSION, kind: kind, pdfPage: b.pdfPage,
                pageDefaults: o.pageDefaults || null, items: o.items, usage: out.usage }, 200, cors);
}

/* ── Entry ────────────────────────────────────────────────── */

export default {
  async fetch(req, env) {
    const cors = corsHeaders(env, req.headers.get('Origin'));
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(req.url);
    if (req.method === 'GET' && url.pathname === '/') {
      return json({ ok: true, v: VERSION, service: 'ix-print-parse' }, 200, cors);
    }
    if (req.method !== 'POST') return fail('POST only', 405, cors);

    if (!env.ANTHROPIC_API_KEY) return fail('ANTHROPIC_API_KEY secret not set', 500, cors);
    if (!env.PARSE_MODEL)       return fail('PARSE_MODEL variable not set', 500, cors);
    if (!env.ALLOWED_ORIGINS)   return fail('ALLOWED_ORIGINS variable not set', 500, cors);

    if (url.pathname === '/read-page') return readPage(req, env, cors);
    if (url.pathname === '/stitch')    return stitch(req, env, cors);
    if (url.pathname === '/extract')   return extract(req, env, cors);
    return fail('unknown path: ' + url.pathname, 404, cors);
  }
};
