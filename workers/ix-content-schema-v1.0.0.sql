-- ix-content-schema-v1.0.0.sql
-- INBXIFY · D1 database "ix-content" (Worker binding IX_DB, HC-P-CH1-1) · Content Home phase 1.
-- Paste the whole file into the D1 Console and run it once. Every statement is IF NOT EXISTS,
-- so running it again changes nothing.
--
-- Three kinds of table (Content-Home-Scoping-v0_2 section 5a):
--   COPY   copy_items, copy_title_links  a full copy of each Webflow collection that stays in Webflow
--   HOME   nl_blocks, allocations, allocation_plans, change_log  created empty, filled in phase 2
--   WORK   collections, sync_runs, pending_items, webhook_log, site_facts  the copy's own bookkeeping

-- ── COPY ────────────────────────────────────────────────────────────────────────────────
-- One row per Webflow item. collection_id is the Webflow collection id.
-- Tenancy columns come from the collection's own Reference fields (found from its schema),
-- or are derived: title from the item's plan, publisher from its title (title_derived /
-- publisher_derived = 1 marks a derived value, which the Worker recomputes after each write).
CREATE TABLE IF NOT EXISTS copy_items (
  collection_id      TEXT NOT NULL,
  item_id            TEXT NOT NULL,
  publisher_id       TEXT,
  title_admin_id     TEXT,
  plan_id            TEXT,
  title_derived      INTEGER NOT NULL DEFAULT 0,
  publisher_derived  INTEGER NOT NULL DEFAULT 0,
  slug               TEXT,
  name               TEXT,
  is_draft           INTEGER NOT NULL DEFAULT 0,
  is_archived        INTEGER NOT NULL DEFAULT 0,
  created_on         TEXT,
  last_updated       TEXT,
  last_published     TEXT,
  field_data         TEXT NOT NULL,
  copied_at          TEXT NOT NULL,
  seen_run           TEXT,
  PRIMARY KEY (collection_id, item_id)
);
CREATE INDEX IF NOT EXISTS copy_items_title     ON copy_items (collection_id, title_admin_id);
CREATE INDEX IF NOT EXISTS copy_items_publisher ON copy_items (collection_id, publisher_id);
CREATE INDEX IF NOT EXISTS copy_items_plan      ON copy_items (collection_id, plan_id);
CREATE INDEX IF NOT EXISTS copy_items_slug      ON copy_items (collection_id, slug);
CREATE INDEX IF NOT EXISTS copy_items_item      ON copy_items (item_id);
CREATE INDEX IF NOT EXISTS copy_items_seen      ON copy_items (collection_id, seen_run);

-- Items that name several TITLES-ADMIN (e.g. an ADS item shared by two titles): one row per title.
CREATE TABLE IF NOT EXISTS copy_title_links (
  collection_id   TEXT NOT NULL,
  item_id         TEXT NOT NULL,
  title_admin_id  TEXT NOT NULL,
  PRIMARY KEY (collection_id, item_id, title_admin_id)
);
CREATE INDEX IF NOT EXISTS copy_title_links_title ON copy_title_links (title_admin_id, collection_id);

-- ── HOME (phase 2) ──────────────────────────────────────────────────────────────────────
-- Real columns for what pages find rows by; everything else in fields (JSON), per the 8 Nov field rule.
-- Backfilled rows keep their Webflow ids; new rows get a 24-character hex id.
CREATE TABLE IF NOT EXISTS nl_blocks (
  id              TEXT PRIMARY KEY,
  publisher_id    TEXT NOT NULL,
  title_admin_id  TEXT NOT NULL,
  plan_id         TEXT NOT NULL,
  position        INTEGER,
  block_type      TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  fields          TEXT NOT NULL DEFAULT '{}',
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT
);
CREATE INDEX IF NOT EXISTS nl_blocks_plan      ON nl_blocks (plan_id, position);
CREATE INDEX IF NOT EXISTS nl_blocks_title     ON nl_blocks (title_admin_id);
CREATE INDEX IF NOT EXISTS nl_blocks_publisher ON nl_blocks (publisher_id);

CREATE TABLE IF NOT EXISTS allocations (
  id              TEXT PRIMARY KEY,
  publisher_id    TEXT NOT NULL,
  title_admin_id  TEXT NOT NULL,
  print_issue     TEXT,
  page            INTEGER,
  version         INTEGER NOT NULL DEFAULT 1,
  fields          TEXT NOT NULL DEFAULT '{}',
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  updated_by      TEXT
);
CREATE INDEX IF NOT EXISTS allocations_issue     ON allocations (title_admin_id, print_issue, page);
CREATE INDEX IF NOT EXISTS allocations_publisher ON allocations (publisher_id);

-- An allocation can serve several plans.
CREATE TABLE IF NOT EXISTS allocation_plans (
  allocation_id  TEXT NOT NULL,
  plan_id        TEXT NOT NULL,
  PRIMARY KEY (allocation_id, plan_id)
);
CREATE INDEX IF NOT EXISTS allocation_plans_plan ON allocation_plans (plan_id);

-- Every write to a home table: before and after, who and when (the undo history).
CREATE TABLE IF NOT EXISTS change_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name   TEXT NOT NULL,
  row_id       TEXT NOT NULL,
  action       TEXT NOT NULL,
  before_json  TEXT,
  after_json   TEXT,
  by_member    TEXT,
  at           TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS change_log_row ON change_log (table_name, row_id, at);

-- ── WORK ────────────────────────────────────────────────────────────────────────────────
-- Every collection on the Webflow site; copied = 1 for the ones on the KV copy list.
CREATE TABLE IF NOT EXISTS collections (
  collection_id    TEXT PRIMARY KEY,
  display_name     TEXT,
  slug             TEXT,
  copied           INTEGER NOT NULL DEFAULT 0,
  webflow_total    INTEGER,
  tenancy_json     TEXT,
  last_full_check  TEXT,
  last_change      TEXT,
  updated_at       TEXT
);

-- Backfill and nightly runs. A run that stops at its time or call limit is resumed by the next call.
CREATE TABLE IF NOT EXISTS sync_runs (
  run_id       TEXT PRIMARY KEY,
  kind         TEXT NOT NULL,
  by_who       TEXT,
  started_at   TEXT NOT NULL,
  beat_at      TEXT,
  finished_at  TEXT,
  status       TEXT NOT NULL,
  state_json   TEXT,
  report_json  TEXT
);
CREATE INDEX IF NOT EXISTS sync_runs_kind ON sync_runs (kind, started_at);

-- Webhook hints that could not be re-read at once (Webflow busy); drained by later hints and the nightly check.
CREATE TABLE IF NOT EXISTS pending_items (
  collection_id  TEXT NOT NULL,
  item_id        TEXT NOT NULL,
  trigger_type   TEXT,
  queued_at      TEXT NOT NULL,
  tries          INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, item_id)
);

-- Every webhook call and what the Worker did with it (kept contentHome.settings.webhooks.logDays).
CREATE TABLE IF NOT EXISTS webhook_log (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  received_at    TEXT NOT NULL,
  trigger_type   TEXT,
  collection_id  TEXT,
  item_id        TEXT,
  signed         INTEGER NOT NULL DEFAULT 0,
  action         TEXT NOT NULL,
  detail         TEXT
);
CREATE INDEX IF NOT EXISTS webhook_log_at ON webhook_log (received_at);

-- Site-wide facts: item count, collection count, webhook registrations.
CREATE TABLE IF NOT EXISTS site_facts (
  k       TEXT PRIMARY KEY,
  v_json  TEXT NOT NULL,
  at      TEXT NOT NULL
);
