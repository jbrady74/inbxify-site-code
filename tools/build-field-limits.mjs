// tools/build-field-limits.mjs
// ============================================================
// INBXIFY · rebuilds config/field-limits.json from Webflow (ASF Rethink A1, P16)
//
// v1.0.0 (27 Nov 2026). Run from the repo root:
//   node tools/build-field-limits.mjs                 reads ix-asset-list /field-limits and writes the file
//   node tools/build-field-limits.mjs --from x.json   uses a saved /field-limits answer instead of the network
//   node tools/build-field-limits.mjs --check         writes nothing; exit 1 if Webflow differs from the file
//   --table FILE   also writes a Markdown table (the four asset types side by side) to FILE
//
// The Worker reads the four collection schemas (each field's Webflow `validations`) and answers the whole
// file. This tool checks the answer's shape, keeps the file stable (fields sorted, two-space JSON, no
// builtAt change when nothing else changed), and writes it. A limit changed in Webflow is one rerun:
// the "Field limits" Action runs this and opens a pull request.
//
// The file is data, read by ta-asf at the page's own commit. Nothing types a limit by hand.
// ============================================================
import fs from 'node:fs';

const args = process.argv.slice(2);
const argOf = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const CHECK = args.includes('--check');
const FROM = argOf('--from');
const TABLE = argOf('--table');
const URL_ = argOf('--url') || process.env.FIELD_LIMITS_URL || 'https://ix-asset-list.jeff-2cd.workers.dev/field-limits';   // HC-P-A1-2
const OUT = 'config/field-limits.json';
const TYPES = ['article', 'ad', 'event', 'realestate'];
const NAMES = { article: 'ARTICLES', ad: 'ADS', event: 'EVENTS', realestate: 'REAL ESTATE' };

function die(msg) { console.error('field limits: ' + msg); process.exit(1); }

async function read() {
  if (FROM) return JSON.parse(fs.readFileSync(FROM, 'utf8'));
  const r = await fetch(URL_, { headers: { accept: 'application/json' } });
  const t = await r.text();
  if (!r.ok) die('the Worker answered ' + r.status + ': ' + t.slice(0, 300));
  try { return JSON.parse(t); } catch (e) { die('the Worker did not answer JSON: ' + t.slice(0, 200)); }
}

function shape(j) {
  if (!j || typeof j !== 'object' || !j.types) die('no "types" in the answer');
  TYPES.forEach(k => {
    const t = j.types[k];
    if (!t || !Array.isArray(t.fields)) die('asset type "' + k + '" is missing');
    t.fields.forEach(f => {
      if (!f.slug || !(f.limit > 0) || typeof f.rich !== 'boolean' || typeof f.required !== 'boolean')
        die(k + ' has a malformed entry: ' + JSON.stringify(f));
    });
    t.fields.sort((a, b) => a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);
  });
  return j;
}

// Same content apart from builtAt counts as unchanged.
const body = (j) => JSON.stringify(Object.assign({}, j, { builtAt: null, builtBy: null }));

function table(j) {
  const cols = TYPES.map(k => j.types[k].fields);
  const n = Math.max(1, ...cols.map(c => c.length));
  const cell = (f) => !f ? '' : f.label + ' (`' + f.slug + '`) ' + f.limit + (f.rich ? ' visible' : '') +
    (f.required ? ' · required' : '') + (f.enforce === false ? ' · not enforced' : '');
  const L = ['| ' + TYPES.map(k => NAMES[k] + ' (' + j.types[k].fields.length + ')').join(' | ') + ' |',
             '|' + TYPES.map(() => '---').join('|') + '|'];
  for (let i = 0; i < n; i++) L.push('| ' + cols.map(c => cell(c[i]) || (i === 0 ? 'no limited fields' : '')).join(' | ') + ' |');
  return L.join('\n') + '\n';
}

const j = shape(await read());
const old = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
const same = old && body(old) === body(j);
if (TABLE) fs.writeFileSync(TABLE, table(j));
if (CHECK) { console.log(same ? 'field limits: the file matches Webflow' : 'field limits: Webflow differs from ' + OUT); process.exit(same ? 0 : 1); }
if (same) { console.log('field limits: no change'); process.exit(0); }
fs.mkdirSync('config', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(j, null, 2) + '\n');
console.log('field limits: wrote ' + OUT + ' · ' + TYPES.map(k => NAMES[k] + ' ' + j.types[k].fields.length).join(', '));
