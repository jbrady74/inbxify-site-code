// tools/verify-cdn.mjs
// ============================================================
// INBXIFY · purge the version lists on jsDelivr and prove the CDN serves the new copy
// (Agent Groundwork G1, Part A). Run by .github/workflows/loaders.yml after the build.
//
// v1.1.0 (17 Nov 2026, Agent Groundwork G2) — PURGE ONLY WHAT CHANGED, AND SAY WHEN jsDelivr HOLDS A PURGE BACK.
//   v1.0.0 purged all the lists on every push. On a busy day (many pushes to main and to an agent branch) jsDelivr
//   began answering 200 to a purge while still serving the old copy, and two go-lives sat on the old lists.
//   Now: (1) a list the CDN already serves correctly is not purged at all; (2) the purge answer is read, and a
//   purge jsDelivr is holding back is printed as HELD BACK with the wait it gives; (3) a held-back list is not
//   purged again and again (that only lengthens the wait); (4) the failure message says what will happen next.
// v1.0.0 (17 Nov 2026).   REPO=owner/name REF=branch node tools/verify-cdn.mjs
//
// 1. Purges every loaders/ix-load-*.js at this branch on jsDelivr.
// 2. Reads each one back the way a browser does (with a time stamp on the address) until the bytes match
//    the file in the repo. Gives up after WAIT_TRIES tries and fails, naming the file.
// 3. Asks the CDN for every repo file the manifests name, and for the page loader itself, at this branch.
//    jsDelivr remembers a "not found" answer, so a file asked for before it was pushed can stay missing: a
//    miss is purged and asked for again; a file still missing fails the run.
// A failure means: the pages may still be on the old lists. It never means a half-written page.
// HARDCODING (provisional): HC-P-AG-6 the two jsDelivr hosts and the wait (WAIT_TRIES x WAIT_MS).
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const REPO = process.env.REPO, REF = process.env.REF;
const CDN = 'https://cdn.jsdelivr.net/gh/', PURGE = 'https://purge.jsdelivr.net/gh/';   // HC-P-AG-6
const WAIT_TRIES = Number(process.env.WAIT_TRIES || 24), WAIT_MS = Number(process.env.WAIT_MS || 10000);
if (!REPO || !REF) { console.error('REPO and REF are required'); process.exit(1); }
if (!/^[A-Za-z0-9._-]+$/.test(REF)) { console.error(`branch "${REF}" cannot be served as a preview (letters, digits, . _ - only)`); process.exit(1); }

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const at = (file) => `${REPO}@${REF}/${file}`;
async function get(url) {
  try { const r = await fetch(url, { cache: 'no-store' }); return { status: r.status, body: Buffer.from(await r.arrayBuffer()) }; }
  catch (e) { return { status: 0, body: Buffer.alloc(0), error: String(e) }; }
}
const held = new Map();   // file -> what jsDelivr said about holding the purge back
async function purge(file) {
  const r = await get(PURGE + at(file));
  let note = '';
  try {
    const j = JSON.parse(r.body.toString('utf8'));
    const p = j.paths && Object.values(j.paths)[0];
    if (p && p.throttled) {
      note = ' HELD BACK by jsDelivr' + (p.throttlingReset ? `, free again in about ${Math.ceil(p.throttlingReset / 60)} min` : '');
      held.set(file, note.trim());
    } else { held.delete(file); if (j.status) note = ' ' + j.status; }
    if (!p) note += ' ' + r.body.toString('utf8').replace(/\s+/g, ' ').slice(0, 200);
  } catch { /* not JSON: the status is all we have */ }
  console.log(`purge ${file}: ${r.status}${note}`);
  return r.status === 200;
}

const failures = [];
const lists = fs.readdirSync('loaders').filter((f) => /^ix-load-.*\.js$/.test(f)).sort().map((f) => `loaders/${f}`);

// 1 + 2: the version lists
async function served(f, want) {
  const stamped = await get(`${CDN}${at(f)}?t=${Date.now()}`);
  const bare = await get(CDN + at(f));
  return { ok: stamped.status === 200 && sha(stamped.body) === want && bare.status === 200 && sha(bare.body) === want,
    last: `stamped ${stamped.status}, bare ${bare.status}` };
}
for (const f of lists) {
  const want = sha(fs.readFileSync(f));
  let s = await served(f, want);
  if (s.ok) { console.log(`OK   ${f} ${want.slice(0, 12)} (already served, not purged)`); continue; }
  await purge(f);
  for (let i = 1; i <= WAIT_TRIES && !s.ok; i++) {
    await sleep(WAIT_MS);
    s = await served(f, want);
    if (!s.ok && i % 6 === 0 && !held.has(f)) await purge(f);
  }
  console.log(`${s.ok ? 'OK  ' : 'FAIL'} ${f} ${want.slice(0, 12)} ${s.ok ? '' : '(' + s.last + ', content is not the new copy)'}`);
  if (!s.ok) failures.push(held.has(f)
    ? `${f}: jsDelivr is holding the purge back (${held.get(f)}). The page keeps its last good list until then. Run this Action again after the wait (Actions, Loaders, Run workflow); do not push again just to retry.`
    : `${f}: the CDN is not serving the new copy`);
}

// 3: every file the pages will ask for
const need = new Set(fs.readdirSync('.').filter((f) => /^ix-load-v[\d._]+\.js$/.test(f)));
for (const m of fs.readdirSync('manifests').filter((f) => f.endsWith('.json'))) {
  const j = JSON.parse(fs.readFileSync(path.join('manifests', m), 'utf8'));
  for (const slot of ['head', 'body']) for (const e of j[slot] || []) {
    const u = typeof e === 'string' ? e : e.css || e.js;
    if (u && !/^https?:\/\//.test(u)) need.add(u);
  }
}
for (const f of [...need].sort()) {
  let r = await get(CDN + at(f));
  for (let i = 0; i < 6 && r.status !== 200; i++) { await purge(f); await sleep(WAIT_MS); r = await get(CDN + at(f)); }
  if (r.status === 200 && sha(r.body) !== sha(fs.readFileSync(f))) {
    console.log(`FAIL ${f}: the CDN copy differs from the repo (a file was edited under a live name)`);
    failures.push(`${f}: CDN copy differs from the repo; versioned files must never be edited in place`);
  } else if (r.status !== 200) {
    console.log(`FAIL ${f}: ${r.status}`); failures.push(`${f}: the CDN answers ${r.status}`);
  } else console.log(`OK   ${f}`);
}

if (failures.length) {
  console.error('\nCDN CHECK FAILED. Pages may still be on the old lists.\n' + failures.map((x) => '  - ' + x).join('\n'));
  process.exit(1);
}
console.log(`\nCDN check passed for ${REPO}@${REF}: ${lists.length} version lists, ${need.size} files.`);
