-- ix-perf-schema-v1.0.0.sql
-- INBXIFY · D1 database ix-perf · the performance store (Performance Report S2, 16 Nov 2026)
-- Run once in the Cloudflare dashboard: D1 > ix-perf > Console, paste this whole file, Execute.
-- Every statement uses IF NOT EXISTS, so running it again changes nothing.
--
-- Every row carries publisher, title, issue, surface (kind), spot (slot), advertiser and ad where they apply,
-- so Quill can filter and roll up on any of them. Times are milliseconds since 1970 (UTC); day is the calendar
-- day in the platform zone (ix-perf PERF_TZ, default America/New_York), kept for fast daily grouping.
--
-- Rulings this store follows: S1 1-10 and 16 Nov 11-17 (seed v0.3). The reader code lasts across visits (16).
-- The collector keeps how long each ad stayed on screen (13). Staff and bot visits are counted like everyone else
-- (16 Nov, Needs-you 6: no). Email-scanner clicks and Apple automatic opens are flagged, not dropped (S1 4 and 5).

-- 1 · page_views: one row per page opened on any title site page.
CREATE TABLE IF NOT EXISTS page_views (
  id            TEXT PRIMARY KEY,          -- made by the page (random), so the leave message can find its row
  at            INTEGER NOT NULL,          -- page opened
  day           TEXT NOT NULL,
  reader        TEXT NOT NULL,             -- the lasting reader code (browser storage)
  visit         TEXT NOT NULL,             -- the visit code (30-minute rule, made by the page)
  visit_first   INTEGER NOT NULL DEFAULT 0,-- 1 = the first page of its visit
  reader_new    INTEGER NOT NULL DEFAULT 0,-- 1 = the reader code was made on this page (first visit seen)
  publisher     TEXT,                      -- PUBLISHERS slug
  title         TEXT,                      -- TITLES slug
  title_admin   TEXT,                      -- TITLES-ADMIN item id
  kind          TEXT,                      -- issue | article | archives | directory | franchise | home | other
  path          TEXT,
  issue_id      TEXT,                      -- NEWSLETTER item id (issue pages)
  issue_code    TEXT,                      -- e.g. WLN-123A (from utm_campaign when the visit came from an email link)
  ref_kind      TEXT,                      -- email | internal | search | social | direct | other
  ref_host      TEXT,
  utm_source    TEXT, utm_medium TEXT, utm_content TEXT,
  device        TEXT,                      -- phone | tablet | desktop (by window width)
  engaged_ms    INTEGER NOT NULL DEFAULT 0,-- engaged time on this page (raised by each leave message, never lowered)
  last_at       INTEGER,                   -- last message from this page
  script        TEXT                       -- ix-perf-site version
);
CREATE INDEX IF NOT EXISTS pv_title_day  ON page_views (title, day);
CREATE INDEX IF NOT EXISTS pv_reader     ON page_views (reader, at);
CREATE INDEX IF NOT EXISTS pv_visit      ON page_views (visit);
CREATE INDEX IF NOT EXISTS pv_issue      ON page_views (issue_code);

-- 2 · ad_views: one row per ad shown on a page view (an ad that never reached the screen still gets a row with 0 ms).
CREATE TABLE IF NOT EXISTS ad_views (
  id            TEXT PRIMARY KEY,          -- <page view id>:<n>
  page_view_id  TEXT NOT NULL,
  at            INTEGER NOT NULL,
  day           TEXT NOT NULL,
  reader        TEXT, visit TEXT,
  publisher     TEXT, title TEXT, kind TEXT, issue_id TEXT, issue_code TEXT,
  ad_id         TEXT,                      -- ADS item id ('' on pages compiled before the markers)
  advertiser_id TEXT,                      -- CUSTOMERS id
  slot          TEXT,                      -- BA-b3, HA-b12, TXA-b8, SP-b24, PA-b5, top, rail-1, inline-2, list-3, past-1 ...
  shape         TEXT,                      -- banner | sidebar | house | text | sponsor | paid
  href_host     TEXT,                      -- where the ad links (identity of last resort on unmarked pages)
  max_ms        INTEGER NOT NULL DEFAULT 0,-- longest unbroken time with the share in ratio of the ad on screen
  total_ms      INTEGER NOT NULL DEFAULT 0,-- all such time on this page view added up
  ratio         REAL,                      -- the share of the ad that counted as on screen when measured
  seen_ms       INTEGER,                   -- the "seen" time in force when written
  seen          INTEGER NOT NULL DEFAULT 0 -- 1 = max_ms reached seen_ms
);
CREATE INDEX IF NOT EXISTS av_ad_day     ON ad_views (ad_id, day);
CREATE INDEX IF NOT EXISTS av_adv_day    ON ad_views (advertiser_id, day);
CREATE INDEX IF NOT EXISTS av_title_day  ON ad_views (title, day);
CREATE INDEX IF NOT EXISTS av_pv         ON ad_views (page_view_id);

-- 3 · clicks: one row per click we see ourselves (on the site now; through localtap.link from build step 3).
CREATE TABLE IF NOT EXISTS clicks (
  id            TEXT PRIMARY KEY,
  at            INTEGER NOT NULL,
  day           TEXT NOT NULL,
  source        TEXT NOT NULL,             -- site | localtap
  page_view_id  TEXT,
  reader        TEXT, visit TEXT,
  publisher     TEXT, title TEXT, kind TEXT, issue_id TEXT, issue_code TEXT,
  ad_id         TEXT, advertiser_id TEXT, slot TEXT, shape TEXT,
  link_type     TEXT,                      -- CALL | TEXT | EMAIL | SOCIAL | WEB | NO LINK
  dest          TEXT,
  dest_host     TEXT,
  internal      INTEGER NOT NULL DEFAULT 0,-- 1 = a link to another page of our own site
  label         TEXT,                      -- the link's words, cut to 80 characters
  link_code     TEXT,                      -- localtap.link code (step 3)
  scanner       INTEGER NOT NULL DEFAULT 0 -- 1 = an email security scanner (step 3)
);
CREATE INDEX IF NOT EXISTS ck_title_day  ON clicks (title, day);
CREATE INDEX IF NOT EXISTS ck_adv_day    ON clicks (advertiser_id, day);
CREATE INDEX IF NOT EXISTS ck_issue      ON clicks (issue_code);

-- 4 · email_opens: one row per load of our open picture (build step 3).
CREATE TABLE IF NOT EXISTS email_opens (
  id            TEXT PRIMARY KEY,
  at            INTEGER NOT NULL,
  day           TEXT NOT NULL,
  issue_id      TEXT, issue_code TEXT, publisher TEXT, title TEXT,
  list          TEXT,                      -- mailchimp | stirista
  recipient     TEXT,                      -- the provider's reader code, when the provider fills one in
  apple         INTEGER NOT NULL DEFAULT 0,-- 1 = an Apple automatic open
  first_open    INTEGER NOT NULL DEFAULT 0,-- 1 = the first open seen for this recipient and issue
  ua_class      TEXT
);
CREATE INDEX IF NOT EXISTS eo_issue      ON email_opens (issue_code, list);

-- 5 · sends: one row per issue and provider, as the provider reports it (Mailchimp, Stirista, Nexstar history).
CREATE TABLE IF NOT EXISTS sends (
  issue_id      TEXT NOT NULL,
  provider      TEXT NOT NULL,             -- mailchimp | stirista | nexstar
  issue_code    TEXT, publisher TEXT, title TEXT,
  sent_at       INTEGER,
  ordered       INTEGER, delivered INTEGER,
  opens_unique  INTEGER, opens_total INTEGER,
  clicks_unique INTEGER, clicks_total INTEGER,
  bounces       INTEGER, unsubscribes INTEGER,
  measured_at   INTEGER,                   -- when the provider took the numbers (asked of Stirista, 16 Nov)
  fetched_at    INTEGER,
  raw           TEXT,                      -- the provider's numbers as received (JSON)
  PRIMARY KEY (issue_id, provider)
);

-- 6 · links: one row per localtap.link short code (build step 3).
CREATE TABLE IF NOT EXISTS links (
  code          TEXT PRIMARY KEY,
  dest          TEXT NOT NULL,
  issue_id      TEXT, issue_code TEXT, publisher TEXT, title TEXT,
  advertiser_id TEXT, ad_id TEXT, slot TEXT, link_type TEXT,
  created_at    INTEGER
);

-- 7 · ga4_daily: GA4's numbers for the Check sub-tab, one row per title, day and metric.
CREATE TABLE IF NOT EXISTS ga4_daily (
  title         TEXT NOT NULL,
  day           TEXT NOT NULL,
  metric        TEXT NOT NULL,
  value         REAL,
  fetched_at    INTEGER,
  PRIMARY KEY (title, day, metric)
);

-- 8 · source_status: one row per input, for the Sources sub-tab and the status line.
CREATE TABLE IF NOT EXISTS source_status (
  source        TEXT PRIMARY KEY,          -- site | localtap | opens | mailchimp | stirista | ga4 | nexstar
  last_ok_at    INTEGER,
  last_error_at INTEGER,
  last_error    TEXT,
  last_count    INTEGER,                   -- rows written since the status was last stamped
  note          TEXT
);
