// tools/scan-css.mjs
// ============================================================
// INBXIFY · the Checks Action, part 1: scan the CSS a branch adds (Agent Groundwork G2, scoping §3 point 5)
//
// v1.0.0 (17 Nov 2026).   node tools/scan-css.mjs            (run from the repo root, on an agent branch)
//   env BASE_REF  what to compare with (default origin/main)
//   env OUT       where the report goes (default check-out)
//
// FAILS (exit 1) when the branch
//   1. EDITS A FILE UNDER A LIVE NAME: a versioned .css or .js file that is already on main was changed on the
//      branch. A change ships as a new file name, always (the versioning rule).
//   2. ADDS A HAND-TYPED COLOUR OR FONT SIZE to a CSS file that is not a token file: #hex, rgb(), rgba(), hsl(),
//      hsla(), or a font size in px, rem or pt that is not a var(--…). Colours and sizes come from the token files.
//
// WHAT COUNTS AS "ADDS"
//   A new CSS file is compared with the version of the same module on main (same name before "-v"). Only lines
//   the branch added are judged. Hand-typed values the older version already had are counted and reported, not
//   failed: otherwise no old file could ever get a small fix. A brand-new module is judged on every line.
//
// Writes OUT/css.md (for the report) and OUT/css.json. Reads git only; opens no page.
// HARDCODING (provisional): HC-P-AG-10 TOKEN_FILES (the files allowed to hold hand-typed values).
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const BASE = process.env.BASE_REF || 'origin/main';
const OUT = process.env.OUT || 'check-out';
const TOKEN_FILES = /^ix-tokens-v[\d._]+\.css$/;                 // HC-P-AG-10
const VERSIONED = /-v\d[\d._]*\.(css|js)$/i;
const SKIP_DIRS = /^(tools|loaders|manifests|checks|\.github|node_modules)\//;

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const tryGit = (...a) => { try { return git(...a); } catch { return null; } };

const mergeBase = (tryGit('merge-base', BASE, 'HEAD') || '').trim() || BASE;
const changes = git('diff', '--name-status', '--no-renames', mergeBase, 'HEAD').split('\n').filter(Boolean)
  .map((l) => { const [s, ...f] = l.split('\t'); return { s, f: f.join('\t') }; })
  .filter((c) => !SKIP_DIRS.test(c.f));

const editedLive = changes.filter((c) => c.s === 'M' && VERSIONED.test(c.f)).map((c) => c.f);
const addedCss = changes.filter((c) => c.s === 'A' && /\.css$/i.test(c.f) && !TOKEN_FILES.test(path.basename(c.f))).map((c) => c.f);

// comments out, line numbers kept
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const baseName = (f) => path.basename(f).replace(/-v\d[\d._]*\.css$/i, '');
const mainFiles = git('ls-tree', '-r', '--name-only', mergeBase).split('\n').filter((f) => /\.css$/i.test(f));

function findings(line) {
  const out = [];
  const colours = line.match(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)/g);
  if (colours) for (const c of colours) out.push({ kind: 'colour', value: c });
  const fs1 = /font-size\s*:\s*([^;}]+)/i.exec(line);
  if (fs1 && !/var\(/.test(fs1[1]) && /\d(?:px|rem|pt)\b/i.test(fs1[1])) out.push({ kind: 'font size', value: fs1[1].trim() });
  const fs2 = /(?:^|[;{\s])font\s*:\s*([^;}]+)/i.exec(line);
  if (fs2 && !/var\(/.test(fs2[1]) && /\d(?:px|rem|pt)\b/i.test(fs2[1])) out.push({ kind: 'font size', value: fs2[1].trim() });
  return out;
}

const added = [], carried = {};
for (const f of addedCss) {
  const older = mainFiles.filter((m) => path.dirname(m) === path.dirname(f) && baseName(m) === baseName(f));
  const known = new Set();
  for (const o of older) for (const l of strip(git('show', `${mergeBase}:${o}`)).split('\n')) known.add(l.trim());
  strip(fs.readFileSync(f, 'utf8')).split('\n').forEach((l, i) => {
    const found = findings(l);
    if (!found.length) return;
    if (known.has(l.trim())) { carried[f] = (carried[f] || 0) + found.length; return; }
    for (const x of found) added.push({ file: f, line: i + 1, ...x, text: l.trim().slice(0, 140) });
  });
}

const failed = editedLive.length > 0 || added.length > 0;
const md = [];
md.push(`### CSS scan: ${failed ? 'FAILED' : 'passed'}`);
md.push('');
if (!addedCss.length && !editedLive.length) md.push('The branch adds no CSS file and edits no live file.');
if (editedLive.length) {
  md.push(`**${editedLive.length} file(s) edited under a live name.** A change must ship as a new file name.`);
  for (const f of editedLive) md.push(`- \`${f}\``);
  md.push('');
}
if (addedCss.length) md.push(`CSS files the branch adds: ${addedCss.map((f) => `\`${f}\``).join(', ')}.`);
if (added.length) {
  md.push('');
  md.push(`**${added.length} hand-typed value(s) added.** Use a token from the token files instead.`);
  md.push('');
  md.push('| File | Line | What | Value |');
  md.push('|---|---|---|---|');
  for (const a of added.slice(0, 200)) md.push(`| \`${a.file}\` | ${a.line} | ${a.kind} | \`${a.value.replace(/\|/g, '\\|')}\` |`);
  if (added.length > 200) md.push(`| … | | | ${added.length - 200} more |`);
}
const carriedList = Object.entries(carried);
if (carriedList.length) {
  md.push('');
  md.push('Hand-typed values already in the older version of the file (reported, not failed): ' +
    carriedList.map(([f, n]) => `\`${f}\` ${n}`).join(', ') + '.');
}
md.push('');

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'css.md'), md.join('\n'));
fs.writeFileSync(path.join(OUT, 'css.json'), JSON.stringify({ failed, editedLive, addedCss, added, carried }, null, 2));
console.log(md.join('\n'));
process.exit(failed ? 1 : 0);
