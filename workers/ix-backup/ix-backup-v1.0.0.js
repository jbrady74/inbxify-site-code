// ix-backup-v1.0.0.js
// INBXIFY · Cloudflare Worker · ix-backup
//
// v1.0.0 (23 Nov 2026, Content Home S15 · phase 4a) — A COPY OF THE ix-content DATABASE IN R2, AND A PROVEN RESTORE.
//   Scoping v0.4 ruling 10: an export of the ix-content D1 database to R2 must exist and be proven before any
//   NL-BLOCKS or ALLOCATIONS row is deleted from Webflow. Rulings this session (Jeff, 23 Nov):
//   (1) The copy is made by this Worker reading each table through the normal D1 binding and writing files to R2.
//       Cloudflare's own export was not used: the database stops answering while it runs, and since S14 every public
//       page reads D1. It would also need an account API token.
//   (2) A new Worker, not routes inside ix-content. ix-content's save path is rewritten in 4b, restore code does not
//       belong in the Worker that writes live data, and this Worker's own nightly trigger does not spend ix-content's.
//   (3) 35 days of nightly backups are kept; named backups (e.g. "pre-4d") are kept until deleted by hand.
//
//   BINDINGS
//   · IX_DB       D1 "ix-content", the live database. This Worker only reads it: every query goes through liveRaw(),
//                 which refuses anything that is not a SELECT.
//   · RESTORE_DB  D1 "ix-content-restore-test", an empty scratch database. Only the restore writes here, and it
//                 refuses a database holding tables it did not create (so a binding pointed at the live database
//                 is refused, because the live database is never empty).
//   · BACKUPS     R2 bucket "ix-content-backups".
//   · MEMBERS     service binding to ix-members, for the staff check on admin routes (same check as ix-content).
//   Optional plain-text variables: BACKUP_KEEP_DAYS (default 35), BACKUP_KEEP_MIN (default 3),
//   ALLOWED_ORIGINS (comma list; default www.inbxify.com and inbxify.com).
//   Cron Trigger: 15 9 * * * (09:15 UTC, 04:15 New York in winter; ix-content's nightly check runs at 08:00 UTC).
//
//   ROUTES
//   · GET  /health            open. Bindings, and whether RESTORE_DB is empty, ours, or someone else's.
//   · GET  /status            open. Every backup (name, time, rows, size, whether writes happened during it), the
//                             last backup run and the last restore check. Never any row content.
//   · POST /admin/backup      staff. Runs a backup now. ?label=pre-4d makes a named backup (kept until deleted by
//                             hand); without a label it is one more nightly backup.
//   · POST /admin/restore     staff. Loads a backup into RESTORE_DB, a step at a time, then checks it.
//                             ?backup=nightly/2026-11-24T09-15-03Z picks one (default: the newest complete backup).
//                             ?fresh=1 empties RESTORE_DB first (only when this Worker filled it).
//                             Call it again until the reply says done:true.
//
//   WHAT ONE BACKUP IS (R2, under ix-content/nightly/<time>/ or ix-content/named/<label>--<time>/)
//   · data/<table>/000001.ndjson …  one line per row: a JSON array of the row's values in the manifest's column
//     order. Tables that have a hidden rowid carry it first, so the restore puts every row back at the same rowid.
//     A file closes at 4 MB or 5,000 rows. Each file's SHA-256 is in the manifest.
//   · schema.sql     every CREATE statement read live from the database (tables, then indexes, triggers, views).
//   · manifest.json  written LAST. A folder without it is an unfinished backup and never counts.
//   Tables are read in pages through D1, not at one instant. So each table's row count and highest rowid are taken
//   before and after the run; any table where they moved is listed in changedDuringRun. ix-content logs every save
//   (change_log) and every webhook (webhook_log), so a write anywhere during the run shows there.
//
//   WHAT THE RESTORE CHECK PROVES
//   Every table in the manifest exists in RESTORE_DB, holds the same number of rows, and every file's rows, read back
//   from RESTORE_DB and written out the same way, give the same SHA-256 as the file in R2. A pass means the backup
//   holds the whole database and can be put back exactly.
//
//   HARDCODING (provisional, for the doc-maintenance chat): HC-P-CH15-1 the R2 folder layout (ROOT ix-content/,
//   nightly/, named/, _runs/); HC-P-CH15-2 keep 35 days and at least 3 nightly backups (variables override);
//   HC-P-CH15-3 sizes and limits (SIZES); HC-P-CH15-4 the cron 15 9 * * * (dashboard); HC-P-CH15-5 tables never
//   copied (names starting sqlite_, _cf_, _ixb_); HC-P-CH15-6 the restore marker table _ixb_restore;
//   HC-P-CH15-7 the default allowed origins.

const VERSION = '1.0.0';
const ROOT = 'ix-content/';                                       // HC-P-CH15-1
const RUNS = ROOT + '_runs/';                                     // HC-P-CH15-1
const SIZES = {                                                   // HC-P-CH15-3
  pageRows: 100,              // rows per D1 read
  chunkBytes: 4 * 1024 * 1024, chunkRows: 5000,                   // one data file
  backupCalls: 900,           // D1 queries + R2 calls one backup may make (Workers Paid allows 1,000 D1 queries)
  restoreCalls: 800, restoreMs: 50000, restoreBatch: 50,          // one restore call
  lockMs: 20 * 60 * 1000,     // a backup lock older than this is taken to be dead
  unfinishedKeepMs: 24 * 3600e3,                                  // an unfinished backup folder is cleared after a day
  statusMax: 60,              // backups described by /status
};
const DEFAULT_ORIGINS = ['https://www.inbxify.com', 'https://inbxify.com'];   // HC-P-CH15-7
const SKIP = /^(sqlite_|_cf_|_ixb_)/i;                            // HC-P-CH15-5
const MARKER = '_ixb_restore';                                    // HC-P-CH15-6
const LABEL = /^[a-z0-9][a-z0-9-]{0,39}$/;

// ─────────────────────────────────────────────────────────────────────────────────────────
// ENTRY
// ─────────────────────────────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const allowed = origins(env);
    const cors = corsHeaders(origin, allowed);
    try {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      const url = new URL(request.url);
      const p = url.pathname.replace(/\/+$/, '') || '/';
      const m = request.method;
      if (p === '/health' && m === 'GET') return json(await health(env), 200, cors);
      if (p === '/status' && m === 'GET') return json(await status(env), 200, cors);
      if (p.startsWith('/admin/')) {
        if (m !== 'POST') return json({ ok: false, error: 'Admin routes take POST.' }, 405, cors);
        if (origin && !allowed.includes(origin)) return json({ ok: false, error: 'This origin may not call ix-backup.' }, 403, cors);
        const gate = await identify(env, request);
        if (!gate.ok) return json({ ok: false, error: gate.why }, gate.status, cors);
        if (!gate.who.staff) return json({ ok: false, error: 'Only staff may run backups and restores.' }, 403, cors);
        const by = gate.who.email || gate.who.memberId;
        if (p === '/admin/backup') {
          const label = url.searchParams.get('label');
          if (label != null && !LABEL.test(label)) return json({ ok: false, error: 'label must be lower-case letters, digits and dashes, up to 40 characters (e.g. pre-4d).' }, 400, cors);
          const out = await runBackup(env, { kind: label ? 'named' : 'nightly', label: label || null, by });
          return json(out, out.ok ? 200 : 500, cors);
        }
        if (p === '/admin/restore') {
          const out = await restoreStep(env, { backup: url.searchParams.get('backup'), fresh: url.searchParams.get('fresh') === '1', by });
          return json(out.body, out.status, cors);
        }
      }
      return json({ ok: false, error: 'Unknown route. See the v1.0.0 header.' }, 404, cors);
    } catch (e) {
      return json({ ok: false, error: (e && e.message) || String(e) }, (e && e.status) || 500, cors);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runBackup(env, { kind: 'nightly', label: null, by: 'cron ' + (event.cron || '') })
      .then(r => { if (!r.ok) console.log('ix-backup nightly failed: ' + r.error); })
      .catch(e => console.log('ix-backup nightly failed: ' + ((e && e.message) || e))));
  },
};

// ─────────────────────────────────────────────────────────────────────────────────────────
// SETTINGS, CALL BUDGET, LIVE READS
// ─────────────────────────────────────────────────────────────────────────────────────────
function keepRules(env) {                                         // HC-P-CH15-2
  const days = Number(env.BACKUP_KEEP_DAYS), min = Number(env.BACKUP_KEEP_MIN);
  return { days: days > 0 ? days : 35, min: min > 0 ? Math.floor(min) : 3 };
}
function origins(env) {
  const s = String(env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
  return s.length ? s : DEFAULT_ORIGINS;
}
function need(env, name) {
  const b = env[name];
  const ok = name === 'BACKUPS' ? b && typeof b.put === 'function' : name === 'MEMBERS' ? b && typeof b.fetch === 'function' : b && typeof b.prepare === 'function';
  if (!ok) throw httpErr(500, 'The ' + name + ' binding is not set on ix-backup. See the v1.0.0 header for the four bindings.');
  return b;
}

// Counts every D1 query and R2 call one invocation makes. Workers Paid allows 1,000 D1 queries per invocation.
class Budget {
  constructor(max) { this.max = max; this.n = 0; }
  tick(k) {
    this.n += k || 1;
    if (this.n > this.max) throw httpErr(500, 'This run reached its limit of ' + this.max + ' database and storage calls. ' +
      'The database has outgrown one run; ix-backup needs to be rebuilt to work across several runs.');
  }
  left() { return this.max - this.n; }
}

// The only way this Worker touches the live database: SELECT (or WITH … SELECT), nothing else.
async function liveRaw(env, b, sql, binds) {
  if (!/^\s*(SELECT|WITH)\b/i.test(sql)) throw httpErr(500, 'ix-backup refused a live query that is not a SELECT.');
  b.tick();
  return need(env, 'IX_DB').prepare(sql).bind(...(binds || [])).raw();
}
async function rawOn(db, b, sql, binds) { b.tick(); return db.prepare(sql).bind(...(binds || [])).raw(); }

// ─────────────────────────────────────────────────────────────────────────────────────────
// TABLE SHAPES (read from the database itself, so the backup follows the schema, never a list in code)
// ─────────────────────────────────────────────────────────────────────────────────────────
async function readSchema(run, b) {
  const rows = await run(b, 'SELECT type, name, tbl_name, sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY rowid', []);
  const objects = rows.filter(r => !SKIP.test(String(r[1])) && !SKIP.test(String(r[2])))
    .map(r => ({ type: r[0], name: r[1], table: r[2], sql: r[3] }));
  const tables = objects.filter(o => o.type === 'table');
  const rest = objects.filter(o => o.type !== 'table');
  return { tables, rest };
}

async function tableShape(run, b, t) {
  const cols = await run(b, 'SELECT name, type, pk FROM pragma_table_info(?) ORDER BY cid', [t.name]);
  if (!cols.length) throw httpErr(500, 'Could not read the columns of table ' + t.name + '.');
  const columns = cols.map(c => c[0]);
  const pks = cols.filter(c => Number(c[2]) > 0).sort((a, x) => Number(a[2]) - Number(x[2]));
  const withoutRowid = /\bWITHOUT\s+ROWID\b/i.test(t.sql || '');
  if (/^\s*CREATE\s+VIRTUAL\b/i.test(t.sql || '')) throw httpErr(500, 'Table ' + t.name + ' is a virtual table; ix-backup v1.0.0 cannot copy it.');
  // A single INTEGER PRIMARY KEY is the rowid itself, so the rowid is already in the row.
  const aliased = !withoutRowid && pks.length === 1 && String(pks[0][1]).trim().toUpperCase() === 'INTEGER';
  return {
    name: t.name, columns,
    rowidFirst: !withoutRowid && !aliased,       // each line starts with the hidden rowid
    withoutRowid,
    orderBy: withoutRowid ? (pks.length ? pks.map(c => qi(c[0])).join(', ') : columns.map(qi).join(', ')) : 'rowid',
  };
}

// One page of a table, in the order the backup uses. Returns { lines, lastRowid }.
//   rowid tables: rows with rowid > after (and <= upto), by rowid.   WITHOUT ROWID tables: by key, LIMIT/OFFSET.
async function readPage(run, b, s, opt) {
  const cols = s.columns.map(qi).join(', ');
  let rows;
  if (s.withoutRowid) {
    rows = await run(b, 'SELECT ' + cols + ' FROM ' + qi(s.name) + ' ORDER BY ' + s.orderBy + ' LIMIT ? OFFSET ?', [opt.limit, opt.offset]);
    return { lines: rows.map(r => line(r)), lastRowid: null, n: rows.length };
  }
  const where = [], binds = [];
  if (opt.after != null) { where.push('rowid > ?'); binds.push(opt.after); }
  if (opt.upto != null) { where.push('rowid <= ?'); binds.push(opt.upto); }
  rows = await run(b, 'SELECT rowid, ' + cols + ' FROM ' + qi(s.name) + (where.length ? ' WHERE ' + where.join(' AND ') : '') +
    ' ORDER BY rowid LIMIT ?', [...binds, opt.limit]);
  return {
    lines: rows.map(r => line(s.rowidFirst ? r : r.slice(1))),
    rowids: rows.map(r => r[0]),
    lastRowid: rows.length ? rows[rows.length - 1][0] : null, n: rows.length,
  };
}

async function countOf(run, b, s) {
  const r = await run(b, 'SELECT COUNT(*), ' + (s.withoutRowid ? 'NULL' : 'MAX(rowid)') + ' FROM ' + qi(s.name), []);
  return { rows: Number(r[0][0]) || 0, maxRowid: r[0][1] == null ? null : r[0][1] };
}

// One row as one line. Blobs become {"$b":"<hex>"}; everything else is JSON as D1 gave it.
function line(values) { return JSON.stringify(values.map(enc)) + '\n'; }
function enc(v) {
  if (v instanceof ArrayBuffer) return { $b: hex(new Uint8Array(v)) };
  if (ArrayBuffer.isView(v)) return { $b: hex(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
  if (Array.isArray(v)) return { $b: hex(Uint8Array.from(v)) };
  if (typeof v === 'bigint') return Number(v);
  return v;
}
function dec(v) {
  if (v && typeof v === 'object' && typeof v.$b === 'string') {
    const a = new Uint8Array(v.$b.length / 2);
    for (let i = 0; i < a.length; i++) a[i] = parseInt(v.$b.substr(i * 2, 2), 16);
    return a.buffer;
  }
  return v;
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// BACKUP
// ─────────────────────────────────────────────────────────────────────────────────────────
async function runBackup(env, opts) {
  const t0 = Date.now(), startedAt = iso();
  const r2 = need(env, 'BACKUPS');
  need(env, 'IX_DB');
  const b = new Budget(SIZES.backupCalls);
  const live = (bb, sql, binds) => liveRaw(env, bb, sql, binds);
  const stamp = startedAt.slice(0, 19).replace(/:/g, '-') + 'Z';
  const name = opts.kind === 'named' ? 'named/' + opts.label + '--' + stamp : 'nightly/' + stamp;
  const prefix = ROOT + name + '/';

  // One backup at a time.
  b.tick();
  const lockObj = await r2.get(RUNS + 'lock.json');
  if (lockObj) {
    const lk = await lockObj.json().catch(() => null);
    if (lk && Date.now() - Date.parse(lk.at) < SIZES.lockMs) {
      return { ok: false, error: 'A backup (' + lk.name + ', started by ' + lk.by + ' at ' + lk.at + ') is still running. Look at /status in a few minutes.' };
    }
  }
  b.tick(); await r2.put(RUNS + 'lock.json', JSON.stringify({ at: startedAt, by: opts.by, name }));

  try {
    const { tables, rest } = await readSchema(live, b);
    if (!tables.length) throw httpErr(500, 'The live database shows no tables. Nothing was written.');
    const shapes = [];
    for (const t of tables) shapes.push({ ...(await tableShape(live, b, t)), sql: t.sql });
    const before = {};
    for (const s of shapes) before[s.name] = await countOf(live, b, s);
    // Smallest tables first: the working tables (NL-BLOCKS, ALLOCATIONS) are read in the first seconds.
    shapes.sort((a, x) => before[a.name].rows - before[x.name].rows || a.name.localeCompare(x.name));

    const out = [];
    for (const s of shapes) out.push(await backupTable(env, b, r2, prefix, s, live));

    const after = {};
    for (const s of shapes) after[s.name] = await countOf(live, b, s);
    const changedDuringRun = shapes.filter(s => before[s.name].rows !== after[s.name].rows || before[s.name].maxRowid !== after[s.name].maxRowid)
      .map(s => ({ table: s.name, before: before[s.name], after: after[s.name] }));

    const schemaSql = [...tables, ...rest].map(o => o.sql.trim().replace(/;?$/, ';')).join('\n\n') + '\n';
    b.tick(); await r2.put(prefix + 'schema.sql', schemaSql, { httpMetadata: { contentType: 'text/plain; charset=utf-8' } });

    const manifest = {
      ix: 'ix-backup', version: VERSION, database: 'ix-content', name, kind: opts.kind, label: opts.label, by: opts.by,
      startedAt, finishedAt: iso(),
      schema: { tables: tables.map(o => ({ name: o.name, sql: o.sql })), rest: rest.map(o => ({ type: o.type, name: o.name, table: o.table, sql: o.sql })) },
      tables: out.map(t => ({ ...t, before: before[t.name], after: after[t.name] })),
      totals: { tables: out.length, rows: out.reduce((n, t) => n + t.rows, 0), bytes: out.reduce((n, t) => n + t.bytes, 0), files: out.reduce((n, t) => n + t.files.length, 0) },
      changedDuringRun,
      meta: { calls: b.n + 1, callLimit: SIZES.backupCalls, ms: Date.now() - t0 },
    };
    b.tick(); await r2.put(prefix + 'manifest.json', JSON.stringify(manifest, null, 1), { httpMetadata: { contentType: 'application/json' } });

    let pruned = null;
    if (opts.kind === 'nightly') {
      try { pruned = await prune(env, b, name); } catch (e) { pruned = { error: (e && e.message) || String(e) }; }
    }
    const summary = { ok: true, version: VERSION, name, kind: opts.kind, by: opts.by, startedAt, finishedAt: manifest.finishedAt,
      totals: manifest.totals, changedDuringRun, pruned, meta: { ...manifest.meta, calls: b.n + 1 } };
    await r2.put(RUNS + 'last-backup.json', JSON.stringify(summary, null, 1));
    return summary;
  } catch (e) {
    const fail = { ok: false, version: VERSION, name, kind: opts.kind, by: opts.by, startedAt, failedAt: iso(),
      error: (e && e.message) || String(e), note: 'This folder has no manifest.json, so it is not a backup. It is cleared after a day.', meta: { calls: b.n, ms: Date.now() - t0 } };
    try { await r2.put(RUNS + 'last-backup.json', JSON.stringify(fail, null, 1)); } catch (_) {}
    return fail;
  } finally {
    try { await r2.delete(RUNS + 'lock.json'); } catch (_) {}
  }
}

async function backupTable(env, b, r2, prefix, s, live) {
  const files = [];
  let buf = [], bytes = 0, rows = 0, firstRowid = null, lastRowid = null, offset = 0, fileStart = 0, after = null, total = 0, totalBytes = 0;
  const flush = async () => {
    if (!rows) return;
    const data = new TextEncoder().encode(buf.join(''));
    const key = 'data/' + s.name + '/' + String(files.length + 1).padStart(6, '0') + '.ndjson';
    b.tick(); await r2.put(prefix + key, data, { httpMetadata: { contentType: 'application/x-ndjson' } });
    files.push({ key, rows, bytes: data.byteLength, sha256: await sha256(data),
      ...(s.withoutRowid ? { offset: fileStart } : { firstRowid, lastRowid }) });
    total += rows; totalBytes += data.byteLength;
    buf = []; bytes = 0; rows = 0; firstRowid = null; lastRowid = null; fileStart = offset;
  };
  for (;;) {
    const page = await readPage(live, b, s, s.withoutRowid ? { limit: SIZES.pageRows, offset } : { limit: SIZES.pageRows, after });
    for (let i = 0; i < page.lines.length; i++) {
      const l = page.lines[i];
      buf.push(l); bytes += l.length; rows++;
      if (!s.withoutRowid) { if (firstRowid == null) firstRowid = page.rowids[i]; lastRowid = page.rowids[i]; }
      offset++;
      if (bytes >= SIZES.chunkBytes || rows >= SIZES.chunkRows) await flush();
    }
    if (page.n < SIZES.pageRows) break;
    after = page.lastRowid;
  }
  await flush();
  const tableHash = await sha256(new TextEncoder().encode(files.map(f => f.sha256).join('\n')));
  return { name: s.name, columns: s.columns, rowidFirst: s.rowidFirst, withoutRowid: s.withoutRowid, orderBy: s.orderBy,
    rows: total, bytes: totalBytes, sha256: tableHash, files };
}

// Nightly backups older than the keep rule are deleted, but the newest BACKUP_KEEP_MIN complete ones always stay.
// Runs only after a good nightly backup, so failures can never empty the bucket. Named backups are never touched.
async function prune(env, b, justMade) {
  const keep = keepRules(env);
  const r2 = need(env, 'BACKUPS');
  const now = Date.now();
  const prefixes = await listPrefixes(r2, b, ROOT + 'nightly/');
  const found = [];
  for (const p of prefixes) {
    const name = p.slice(ROOT.length).replace(/\/$/, '');
    const at = stampTime(name);
    b.tick();
    const complete = !!(await r2.head(p + 'manifest.json'));
    found.push({ prefix: p, name, at, complete });
  }
  const complete = found.filter(f => f.complete).sort((a, x) => x.at - a.at);
  const protectedSet = new Set(complete.slice(0, keep.min).map(f => f.prefix));
  const doomed = found.filter(f => f.name !== justMade && !protectedSet.has(f.prefix) &&
    ((f.complete && now - f.at > keep.days * 86400e3) || (!f.complete && now - f.at > SIZES.unfinishedKeepMs)));
  const deleted = [];
  for (const f of doomed) {
    const keys = await listKeys(r2, b, f.prefix);
    for (let i = 0; i < keys.length; i += 1000) { b.tick(); await r2.delete(keys.slice(i, i + 1000)); }
    deleted.push({ name: f.name, objects: keys.length, complete: f.complete });
  }
  return { keepDays: keep.days, keepAtLeast: keep.min, nightlyFound: found.length, deleted };
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// RESTORE (into RESTORE_DB only), A STEP AT A TIME, THEN THE CHECK
// ─────────────────────────────────────────────────────────────────────────────────────────
// Phases: tables → data → rest (indexes, triggers, views) → verify → done.
// Progress lives in RESTORE_DB's own _ixb_restore table and is written in the same transaction as each batch of
// rows, so a call that stops anywhere resumes exactly where the last good batch ended.
async function restoreStep(env, opts) {
  const t0 = Date.now();
  const db = need(env, 'RESTORE_DB');
  const r2 = need(env, 'BACKUPS');
  const b = new Budget(SIZES.restoreCalls);
  const run = (bb, sql, binds) => rawOn(db, bb, sql, binds);

  const objs = await run(b, "SELECT type, name FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'", []);
  const hasMarker = objs.some(o => o[1] === MARKER);
  const others = objs.filter(o => o[1] !== MARKER);
  if (!hasMarker && others.length) {
    return { status: 409, body: { ok: false, error: 'RESTORE_DB already holds ' + others.length + ' table(s) that ix-backup did not create (' +
      others.slice(0, 5).map(o => o[1]).join(', ') + (others.length > 5 ? ', …' : '') + '). ix-backup will not write to it. ' +
      'RESTORE_DB must be bound to the empty scratch database ix-content-restore-test, never to ix-content.' } };
  }

  let state = null;
  if (hasMarker) {
    const r = await run(b, 'SELECT v FROM ' + MARKER + " WHERE k='state'", []);
    state = r.length ? JSON.parse(r[0][0]) : null;
  }
  if (hasMarker && opts.fresh) {
    for (const o of others) { b.tick(); await db.prepare('DROP ' + (o[0] === 'view' ? 'VIEW' : 'TABLE') + ' IF EXISTS ' + qi(o[1])).run(); }
    b.tick(); await db.prepare('DROP TABLE IF EXISTS ' + MARKER).run();
    state = null;
  }
  if (state && opts.backup && opts.backup !== state.backup) {
    return { status: 409, body: { ok: false, error: 'RESTORE_DB holds a restore of ' + state.backup + '. Add &fresh=1 to empty it and restore ' + opts.backup + ' instead.', state: brief(state) } };
  }
  if (hasMarker && !state && !opts.fresh) {
    // Marker table without a state row: an earlier start stopped before its first save. Start again cleanly.
    for (const o of others) { b.tick(); await db.prepare('DROP ' + (o[0] === 'view' ? 'VIEW' : 'TABLE') + ' IF EXISTS ' + qi(o[1])).run(); }
  }

  let manifest;
  if (!state) {
    const name = opts.backup || await latestComplete(r2, b);
    if (!name) return { status: 404, body: { ok: false, error: 'There is no complete backup to restore yet. Run POST /admin/backup first.' } };
    manifest = await getManifest(r2, b, name);
    if (!manifest) return { status: 404, body: { ok: false, error: 'No complete backup called ' + name + ' (no manifest.json).' } };
    b.tick(); await db.prepare('CREATE TABLE IF NOT EXISTS ' + MARKER + ' (k TEXT PRIMARY KEY, v TEXT NOT NULL)').run();
    state = { backup: name, by: opts.by, startedAt: iso(), phase: 'tables', fi: 0, line: 0, vi: 0, rowsLoaded: 0, bad: [], calls: 0 };
    await saveState(db, b, state);
  } else {
    if (state.phase === 'done') return { status: 200, body: { ok: state.result.pass, done: true, ...state.result,
      note: 'This restore is already finished. Add &fresh=1 to run it again.' } };
    manifest = await getManifest(r2, b, state.backup);
    if (!manifest) return { status: 404, body: { ok: false, error: 'The backup ' + state.backup + ' has gone from R2. Add &fresh=1 to start again.' } };
  }

  const files = [];
  for (const t of manifest.tables) for (const f of t.files) files.push({ t, f });
  const outOfRoom = () => b.left() < 20 || Date.now() - t0 > SIZES.restoreMs;

  try {
    if (state.phase === 'tables') {
      for (const t of manifest.schema.tables) { b.tick(); await db.prepare(t.sql).run(); }
      state.phase = 'data'; await saveState(db, b, state);
    }
    while (state.phase === 'data' && !outOfRoom()) {
      if (state.fi >= files.length) { state.phase = 'rest'; await saveState(db, b, state); break; }
      const { t, f } = files[state.fi];
      b.tick();
      const obj = await r2.get(ROOT + state.backup + '/' + f.key);
      if (!obj) throw httpErr(500, 'Backup file ' + f.key + ' is missing from R2.');
      const lines = (await obj.text()).split('\n').filter(Boolean);
      const cols = (t.rowidFirst ? ['rowid'] : []).concat(t.columns);
      const sql = 'INSERT INTO ' + qi(t.name) + ' (' + cols.map(qi).join(', ') + ') VALUES (' + cols.map(() => '?').join(', ') + ')';
      while (state.line < lines.length && !outOfRoom()) {
        const part = lines.slice(state.line, state.line + SIZES.restoreBatch);
        const stmts = part.map(l => db.prepare(sql).bind(...JSON.parse(l).map(dec)));
        const next = { ...state, line: state.line + part.length, rowsLoaded: state.rowsLoaded + part.length };
        if (next.line >= lines.length) { next.fi = state.fi + 1; next.line = 0; }
        stmts.push(db.prepare('INSERT OR REPLACE INTO ' + MARKER + " (k, v) VALUES ('state', ?)").bind(JSON.stringify(next)));
        b.tick(); await db.batch(stmts);          // rows and progress in one transaction
        state = next;
        if (state.line === 0) break;              // this file is finished; the outer loop opens the next one
      }
    }
    if (state.phase === 'rest' && !outOfRoom()) {
      for (const o of manifest.schema.rest) { b.tick(); await db.prepare(o.sql).run(); }
      state.phase = 'verify'; await saveState(db, b, state);
    }
    while (state.phase === 'verify' && !outOfRoom()) {
      if (state.vi >= files.length) { state.result = await finalCheck(db, b, manifest, state, t0); state.phase = 'done'; await saveState(db, b, state); break; }
      const { t, f } = files[state.vi];
      const s = { name: t.name, columns: t.columns, rowidFirst: t.rowidFirst, withoutRowid: t.withoutRowid, orderBy: t.orderBy };
      const lines = [];
      if (s.withoutRowid) {
        let off = f.offset;
        while (lines.length < f.rows) {
          const page = await readPage(run, b, s, { limit: Math.min(SIZES.pageRows, f.rows - lines.length), offset: off });
          if (!page.n) break; lines.push(...page.lines); off += page.n;
        }
      } else {
        let after = f.firstRowid - 1;
        for (;;) {
          const page = await readPage(run, b, s, { limit: SIZES.pageRows, after, upto: f.lastRowid });
          lines.push(...page.lines);
          if (page.n < SIZES.pageRows) break;
          after = page.lastRowid;
        }
      }
      const hash = await sha256(new TextEncoder().encode(lines.join('')));
      if (hash !== f.sha256 || lines.length !== f.rows) state.bad.push({ table: t.name, file: f.key, rowsInFile: f.rows, rowsRestored: lines.length, match: false });
      state.vi++;
      await saveState(db, b, state);
    }
  } catch (e) {
    return { status: 500, body: { ok: false, done: false, error: (e && e.message) || String(e), state: brief(state),
      next: 'Call POST /admin/restore again; it carries on from the last saved batch.' } };
  }

  if (state.phase === 'done') {
    try { b.tick(); await r2.put(RUNS + 'last-restore.json', JSON.stringify({ ...state.result, by: state.by }, null, 1)); } catch (_) {}
    return { status: 200, body: { ok: state.result.pass, done: true, ...state.result } };
  }
  return { status: 200, body: { ok: true, done: false, backup: state.backup, phase: state.phase,
    progress: { files: files.length, filesLoaded: Math.min(state.fi, files.length), filesChecked: state.vi, rowsLoaded: state.rowsLoaded, rowsInBackup: manifest.totals.rows },
    next: 'Call POST /admin/restore again (same address). Repeat until done:true.', meta: { calls: b.n, ms: Date.now() - t0 } } };
}

async function finalCheck(db, b, manifest, state, t0) {
  const run = (bb, sql, binds) => rawOn(db, bb, sql, binds);
  const tables = [];
  const names = await run(b, "SELECT name FROM sqlite_master WHERE type='table'", []);
  const have = new Set(names.map(r => r[0]));
  for (const t of manifest.tables) {
    const exists = have.has(t.name);
    const n = exists ? Number((await run(b, 'SELECT COUNT(*) FROM ' + qi(t.name), []))[0][0]) : null;
    const badFiles = state.bad.filter(x => x.table === t.name).length;
    tables.push({ table: t.name, rowsInBackup: t.rows, rowsRestored: n, files: t.files.length, filesMatching: t.files.length - badFiles,
      pass: exists && n === t.rows && !badFiles });
  }
  const extra = [...have].filter(n => !SKIP.test(n) && !manifest.tables.some(t => t.name === n));
  const pass = tables.every(t => t.pass) && !extra.length;
  return {
    pass, backup: state.backup, backupTakenAt: manifest.finishedAt, checkedAt: iso(), version: VERSION,
    summary: pass
      ? 'PASS: every table (' + tables.length + ') and every row (' + manifest.totals.rows + ') of ' + state.backup + ' was restored, and every file matches its fingerprint.'
      : 'FAIL: see the tables marked pass:false' + (extra.length ? ' and the extra tables' : '') + '.',
    tables, extraTables: extra, mismatchedFiles: state.bad,
    changedDuringBackup: manifest.changedDuringRun,
  };
}

async function saveState(db, b, state) {
  b.tick();
  await db.prepare('INSERT OR REPLACE INTO ' + MARKER + " (k, v) VALUES ('state', ?)").bind(JSON.stringify(state)).run();
}
function brief(s) { return s ? { backup: s.backup, phase: s.phase, filesLoaded: s.fi, filesChecked: s.vi, rowsLoaded: s.rowsLoaded, startedAt: s.startedAt } : null; }

// ─────────────────────────────────────────────────────────────────────────────────────────
// R2 HELPERS
// ─────────────────────────────────────────────────────────────────────────────────────────
async function listPrefixes(r2, b, prefix) {
  const out = []; let cursor;
  do { b && b.tick(); const r = await r2.list({ prefix, delimiter: '/', cursor }); out.push(...(r.delimitedPrefixes || [])); cursor = r.truncated ? r.cursor : undefined; } while (cursor);
  return out;
}
async function listKeys(r2, b, prefix) {
  const out = []; let cursor;
  do { b && b.tick(); const r = await r2.list({ prefix, cursor }); out.push(...(r.objects || []).map(o => o.key)); cursor = r.truncated ? r.cursor : undefined; } while (cursor);
  return out;
}
async function getManifest(r2, b, name) {
  if (!/^(nightly|named)\/[A-Za-z0-9T:.\-]+$/.test(String(name || ''))) return null;
  b && b.tick();
  const o = await r2.get(ROOT + name + '/manifest.json');
  return o ? o.json() : null;
}
async function backupList(r2, b) {
  const all = [];
  for (const kind of ['nightly', 'named']) {
    for (const p of await listPrefixes(r2, b, ROOT + kind + '/')) {
      const name = p.slice(ROOT.length).replace(/\/$/, '');
      all.push({ name, kind, at: stampTime(name) });
    }
  }
  return all.sort((a, x) => x.at - a.at);
}
async function latestComplete(r2, b) {
  for (const x of await backupList(r2, b)) { b.tick(); if (await r2.head(ROOT + x.name + '/manifest.json')) return x.name; }
  return null;
}
// "nightly/2026-11-24T09-15-03Z" or "named/pre-4d--2026-11-24T09-15-03Z" → ms
function stampTime(name) {
  const m = /(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z$/.exec(name);
  return m ? Date.parse(m[1] + 'T' + m[2] + ':' + m[3] + ':' + m[4] + 'Z') : 0;
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// STATUS AND HEALTH (open; names, counts and sizes only, never row content)
// ─────────────────────────────────────────────────────────────────────────────────────────
async function status(env) {
  const r2 = need(env, 'BACKUPS');
  const b = new Budget(500);
  const list = await backupList(r2, b);
  const backups = [];
  for (const x of list.slice(0, SIZES.statusMax)) {
    b.tick();
    const o = await r2.get(ROOT + x.name + '/manifest.json');
    if (!o) { backups.push({ name: x.name, complete: false }); continue; }
    const m = await o.json().catch(() => null);
    if (!m || m.ix !== 'ix-backup' || !m.totals) { backups.push({ name: x.name, complete: false, note: 'manifest.json is not one ix-backup wrote' }); continue; }
    backups.push({ name: x.name, complete: true, kind: m.kind, label: m.label, by: m.by, finishedAt: m.finishedAt,
      tables: m.totals.tables, rows: m.totals.rows, mb: Math.round(m.totals.bytes / 1048576 * 100) / 100, files: m.totals.files,
      changedDuringRun: m.changedDuringRun.map(c => c.table), calls: m.meta.calls + ' of ' + m.meta.callLimit, seconds: Math.round(m.meta.ms / 100) / 10 });
  }
  const read = async (k) => { b.tick(); const o = await r2.get(RUNS + k); return o ? o.json() : null; };
  const keep = keepRules(env);
  return { ok: true, version: VERSION, at: iso(), keep: { nightlyDays: keep.days, nightlyAtLeast: keep.min, named: 'until deleted by hand' },
    lastBackupRun: await read('last-backup.json'), lastRestoreCheck: await read('last-restore.json'),
    backupsListed: backups.length, backupsInBucket: list.length, backups };
}

async function health(env) {
  const out = { ok: true, version: VERSION, bindings: {
    IX_DB: !!(env.IX_DB && env.IX_DB.prepare), RESTORE_DB: !!(env.RESTORE_DB && env.RESTORE_DB.prepare),
    BACKUPS: !!(env.BACKUPS && env.BACKUPS.put), MEMBERS: !!(env.MEMBERS && env.MEMBERS.fetch) } };
  const b = new Budget(50);
  if (out.bindings.IX_DB) {
    try {
      const { tables } = await readSchema((bb, sql, binds) => liveRaw(env, bb, sql, binds), b);
      out.live = { tables: tables.length, names: tables.map(t => t.name) };
    } catch (e) { out.live = { error: e.message }; }
  }
  if (out.bindings.RESTORE_DB) {
    try {
      const r = await rawOn(env.RESTORE_DB, b, "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'", []);
      const names = r.map(x => x[0]);
      out.restoreDb = !names.length ? 'empty (ready for a restore)'
        : names.includes(MARKER) ? 'holds a restore made by ix-backup (' + (names.length - 1) + ' tables)'
        : 'NOT USABLE: holds ' + names.length + ' tables ix-backup did not create. Point RESTORE_DB at the empty ix-content-restore-test.';
    } catch (e) { out.restoreDb = { error: e.message }; }
  }
  if (out.bindings.BACKUPS) {
    try { b.tick(); await env.BACKUPS.list({ prefix: ROOT, limit: 1 }); out.bucket = 'reachable'; } catch (e) { out.bucket = { error: e.message }; }
  }
  out.keep = keepRules(env);
  out.ok = Object.values(out.bindings).every(Boolean) && !!out.live && !out.live.error && out.bucket === 'reachable' &&
    typeof out.restoreDb === 'string' && !out.restoreDb.startsWith('NOT');
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// LOGIN CHECK (the same ix-members /whoami call ix-content makes)
// ─────────────────────────────────────────────────────────────────────────────────────────
async function identify(env, request) {
  const auth = request.headers.get('Authorization') || '';
  if (!/^Bearer\s+\S+/i.test(auth)) return { ok: false, status: 401, why: 'Not signed in: no Memberstack token was sent.' };
  if (!env.MEMBERS || typeof env.MEMBERS.fetch !== 'function') return { ok: false, status: 500, why: 'The MEMBERS service binding (to ix-members) is not set on ix-backup.' };
  let res, j = null;
  try { res = await env.MEMBERS.fetch(new Request('https://ix-members/whoami', { headers: { Authorization: auth } })); j = await res.json().catch(() => null); }
  catch (e) { return { ok: false, status: 502, why: 'ix-members did not answer: ' + ((e && e.message) || e) }; }
  if (!res.ok || !j || !j.ok) return { ok: false, status: res && res.status === 401 ? 401 : 403, why: (j && j.error) || 'The login check failed.' };
  return { ok: true, who: { memberId: j.memberId, email: j.email || null, staff: !!j.staff } };
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────────────────────────────────
function qi(name) { return '"' + String(name).replace(/"/g, '""') + '"'; }
async function sha256(bytes) { return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))); }
function hex(u8) { let s = ''; for (let i = 0; i < u8.length; i++) s += u8[i].toString(16).padStart(2, '0'); return s; }
function corsHeaders(origin, allowed) {
  const h = { 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '600' };
  if (origin && allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
function json(obj, status, extra) {
  return new Response(JSON.stringify(obj, null, 2), { status: status || 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...(extra || {}) } });
}
function httpErr(status, message) { const e = new Error(message); e.status = status; return e; }
function iso() { return new Date().toISOString(); }
