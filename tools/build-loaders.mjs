// tools/build-loaders.mjs
// ============================================================
// INBXIFY · builds the version lists the page loader reads (Agent Groundwork G1, Part A)
//
// v1.0.0 (17 Nov 2026). Run from the repo root:   node tools/build-loaders.mjs
//   --check   build nothing; exit 1 if any loaders/ file differs from what the manifests say
//   --root X  use folder X as the repo root (the loader tests use this)
//
// Reads every manifests/<page>.json and writes loaders/ix-load-<page>-head.js and loaders/ix-load-<page>-body.js.
// A manifest that is wrong stops the build with a plain message and writes nothing, so a bad list never
// reaches a page: the pages keep the last good lists.
//
// MANIFEST (manifests/<page>.json)
//   { "page": "quill",                    must match the file name; lower case, digits, hyphens
//     "webflowPage": "quill-admin",       the Webflow page that carries the two loader tags (for people)
//     "confirmed": true,                  false = drafted, not yet checked against the live page's tags
//     "head": [ … ], "body": [ … ] }      what each slot loads, in order
//   An entry is one of:
//     "ix-tokens-v1.0.4.css"              a file in this repo (path from the repo root); .css or .js
//     { "css": "https://…" }              a stylesheet at a full address (e.g. Google Fonts)
//     { "js":  "https://…" }              a script at a full address
//     { "link": { "rel": "preconnect", "href": "https://…", "crossorigin": true } }   any other <link>
//   "css" and "js" entries may carry "attrs": { … } for extra attributes; true writes a bare attribute.
//   A script may not be async, defer or a module: the loader's whole point is list order.
//
// The output holds no date, commit or branch, so the same manifest builds the same file on every branch
// and a merge never conflicts on loaders/.
// ============================================================
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const rootArg = args.indexOf('--root');
const ROOT = path.resolve(rootArg >= 0 ? args[rootArg + 1] : '.');
const MAN = path.join(ROOT, 'manifests'), OUT = path.join(ROOT, 'loaders');
const SLOTS = ['head', 'body'];
const errors = [], warnings = [];

const isUrl = (s) => /^https?:\/\//.test(s);
const kindOf = (file) => (/\.css$/i.test(file) ? 'css' : /\.js$/i.test(file) ? 'js' : null);

function repoFile(file, where) {
  if (typeof file !== 'string' || !file || file.startsWith('/') || file.includes('..') || file.includes('\\') || /[?#\s]/.test(file)) {
    errors.push(`${where}: "${file}" is not a plain path from the repo root`); return false;
  }
  if (!fs.existsSync(path.join(ROOT, file)) || !fs.statSync(path.join(ROOT, file)).isFile()) {
    errors.push(`${where}: "${file}" is not in the repo`); return false;
  }
  return true;
}
function attrsOf(a, where) {
  if (a === undefined) return undefined;
  if (!a || typeof a !== 'object' || Array.isArray(a)) { errors.push(`${where}: "attrs" must be an object`); return undefined; }
  for (const [k, v] of Object.entries(a)) {
    if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(k)) errors.push(`${where}: attribute name "${k}" is not allowed`);
    if (/^on/i.test(k)) errors.push(`${where}: event attributes ("${k}") are not allowed`);
    if (v !== true && typeof v !== 'string') errors.push(`${where}: attribute "${k}" must be text or true`);
    if (['async', 'defer'].includes(k.toLowerCase()) || (k.toLowerCase() === 'type' && v === 'module'))
      errors.push(`${where}: a loader script cannot be async, defer or a module (list order would be lost)`);
  }
  return Object.keys(a).length ? a : undefined;
}
function item(entry, where, seen) {
  let it = null;
  if (typeof entry === 'string') {
    const k = kindOf(entry);
    if (isUrl(entry)) errors.push(`${where}: a full address must be written as { "css": "…" } or { "js": "…" }`);
    else if (!k) errors.push(`${where}: "${entry}" must end in .css or .js`);
    else if (repoFile(entry, where)) it = { k, u: entry };
  } else if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
    const keys = Object.keys(entry).filter((k) => k !== 'attrs');
    if (keys.length !== 1 || !['css', 'js', 'link'].includes(keys[0])) {
      errors.push(`${where}: an entry needs exactly one of "css", "js" or "link"`);
    } else if (keys[0] === 'link') {
      const a = attrsOf(entry.link, where);
      if (!a || !a.rel || !a.href) errors.push(`${where}: a "link" entry needs rel and href`);
      else if (a.rel === 'stylesheet') errors.push(`${where}: write a stylesheet as { "css": … }`);
      else it = { k: 'link', a };
    } else {
      const k = keys[0], u = entry[k];
      if (typeof u !== 'string' || !u) errors.push(`${where}: "${k}" needs a file or an address`);
      else if (isUrl(u) || (kindOf(u) === k ? repoFile(u, where) : (errors.push(`${where}: "${u}" does not end in .${k}`), false))) {
        it = { k, u }; const a = attrsOf(entry.attrs, where); if (a) it.a = a;
      }
    }
  } else errors.push(`${where}: entry must be a file name or an object`);
  if (it) {
    const key = it.k + '|' + (it.u || it.a.rel + ' ' + it.a.href);
    if (seen.has(key)) errors.push(`${where}: "${it.u || it.a.href}" is listed twice on this page`);
    seen.add(key);
  }
  return it;
}

const files = fs.existsSync(MAN) ? fs.readdirSync(MAN).filter((f) => f.endsWith('.json')).sort() : [];
if (!files.length) errors.push('no manifests/*.json found');
const outputs = new Map(), summary = [];
for (const f of files) {
  const rel = `manifests/${f}`;
  let m;
  try { m = JSON.parse(fs.readFileSync(path.join(MAN, f), 'utf8')); }
  catch (e) { errors.push(`${rel}: not valid JSON (${e.message})`); continue; }
  const page = f.replace(/\.json$/, '');
  if (!/^[a-z0-9-]+$/.test(page)) errors.push(`${rel}: the file name must be lower case letters, digits and hyphens`);
  if (m.page !== page) errors.push(`${rel}: "page" must be "${page}" (the file name)`);
  if (typeof m.webflowPage !== 'string' || !m.webflowPage) errors.push(`${rel}: "webflowPage" is missing (name the Webflow page)`);
  if (typeof m.confirmed !== 'boolean') errors.push(`${rel}: "confirmed" must be true or false`);
  else if (!m.confirmed) warnings.push(`${rel}: not confirmed against the live page yet; do not cut this page over`);
  const seen = new Set(), repoFiles = [];
  for (const slot of SLOTS) {
    if (!Array.isArray(m[slot])) { errors.push(`${rel}: "${slot}" must be a list (use [] for none)`); continue; }
    const items = m[slot].map((e, i) => item(e, `${rel} ${slot}[${i + 1}]`, seen)).filter(Boolean);
    if (slot === 'body' && items.some((it) => it.k !== 'js')) warnings.push(`${rel}: body holds a stylesheet or link; styles normally go in head`);
    items.forEach((it) => { if (it.u && !isUrl(it.u)) repoFiles.push(it.u); });
    const name = `ix-load-${page}-${slot}.js`;
    outputs.set(name,
      `// loaders/${name}\n` +
      `// GENERATED from manifests/${f} by tools/build-loaders.mjs. Do not edit this file; edit the manifest.\n` +
      `window.IxLoad&&IxLoad.run(${JSON.stringify({ page, slot, items })});\n`);
    summary.push(`${name}: ${items.length} tag${items.length === 1 ? '' : 's'}`);
  }
  m.__files = repoFiles;
}

if (errors.length) {
  console.error('Loader build STOPPED. Nothing was written. Fix these in the manifests:\n' + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
warnings.forEach((w) => console.warn('warning: ' + w));

const stale = [];
const existing = fs.existsSync(OUT) ? fs.readdirSync(OUT).filter((f) => /^ix-load-.*\.js$/.test(f)) : [];
for (const [name, text] of outputs) {
  const p = path.join(OUT, name);
  if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== text) stale.push(name);
}
const orphans = existing.filter((f) => !outputs.has(f));
if (CHECK) {
  if (stale.length || orphans.length) {
    console.error('loaders/ does not match the manifests: ' + [...stale, ...orphans.map((o) => o + ' (no manifest)')].join(', '));
    process.exit(1);
  }
  console.log('loaders/ matches the manifests.');
} else {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, text] of outputs) fs.writeFileSync(path.join(OUT, name), text);
  orphans.forEach((o) => fs.unlinkSync(path.join(OUT, o)));
  console.log(summary.join('\n'));
  console.log(stale.length || orphans.length ? `changed: ${[...stale, ...orphans.map((o) => o + ' (removed)')].join(', ')}` : 'no change');
}
