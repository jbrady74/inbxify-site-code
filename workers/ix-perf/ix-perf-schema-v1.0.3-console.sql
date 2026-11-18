CREATE TABLE IF NOT EXISTS edition_sources (issue_id TEXT NOT NULL, source TEXT NOT NULL, label TEXT, sends INTEGER, opens INTEGER, clicks INTEGER, origin TEXT, file_name TEXT, entered_by TEXT, entered_at INTEGER, PRIMARY KEY (issue_id, source));
CREATE TABLE IF NOT EXISTS edition_lines (issue_id TEXT NOT NULL, source TEXT NOT NULL, line TEXT NOT NULL, clicks INTEGER, origin TEXT, entered_by TEXT, entered_at INTEGER, PRIMARY KEY (issue_id, source, line));
CREATE TABLE IF NOT EXISTS edition_log (id TEXT PRIMARY KEY, at INTEGER NOT NULL, entered_by TEXT, issue_id TEXT NOT NULL, source TEXT NOT NULL, line TEXT NOT NULL DEFAULT '', field TEXT NOT NULL, value INTEGER, origin TEXT);
CREATE INDEX IF NOT EXISTS el_issue ON edition_log (issue_id, at);
