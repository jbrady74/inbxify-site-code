// tools/post-report.mjs
// ============================================================
// INBXIFY · the Checks Action, part 3: put the report where a person reads it (Agent Groundwork G2, scoping §3 point 6)
//
// v1.0.0 (17 Nov 2026).   node tools/post-report.mjs
//   env REPO, BRANCH, SHA, RUN_URL, GITHUB_TOKEN, OUT (default check-out), SHOTS_BRANCH (default check-reports)
//
// Joins OUT/css.md and OUT/pages.md into one report, turns each {{IMG:name}} into the picture's address on the
// SHOTS_BRANCH branch (the workflow pushes the pictures there, in a folder named after the checked branch), then
//   · writes it to the run's summary page, always
//   · posts it on the branch's open pull request, as one comment that is replaced on every push
// With no open pull request it says so and posts nothing: the summary page still has the report.
// HARDCODING (provisional): HC-P-AG-13 MARK (how the comment is found again) and SHOTS_BRANCH.
// ============================================================
import fs from 'node:fs';
import path from 'node:path';

const { REPO, BRANCH, SHA = '', RUN_URL = '', GITHUB_TOKEN } = process.env;
const OUT = process.env.OUT || 'check-out';
const SHOTS_BRANCH = process.env.SHOTS_BRANCH || 'check-reports';   // HC-P-AG-13
const MARK = '<!-- ix-checks-report -->';                           // HC-P-AG-13
const read = (f) => { try { return fs.readFileSync(path.join(OUT, f), 'utf8'); } catch { return ''; } };
const json = (f) => { try { return JSON.parse(read(f)); } catch { return null; } };

const css = json('css.json'), pages = json('pages.json');
const failed = !css || !pages || css.failed || pages.failed;
const img = (name) => `https://raw.githubusercontent.com/${REPO}/${SHOTS_BRANCH}/${encodeURIComponent(BRANCH)}/${encodeURIComponent(name)}?v=${SHA.slice(0, 8)}`;

let body = [
  MARK,
  `## Checks on \`${BRANCH}\`: ${failed ? 'FAILED' : 'passed'}`,
  '',
  `Commit \`${SHA.slice(0, 7)}\`${RUN_URL ? ` · [the run](${RUN_URL})` : ''} · test title pages only · read-only (pages opened, rail tabs clicked, nothing typed or saved).`,
  '',
  read('css.md') || '### CSS scan: did not run\n',
  read('pages.md') || '### Pages: did not run\n',
].join('\n').replace(/\{\{IMG:([^}]+)\}\}/g, (_, n) => img(n));
if (body.length > 64000) body = body.slice(0, 63000) + '\n\n</details>\n\n(The report was cut here: it is too long for one comment. The run page has all of it.)';

if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, body + '\n');

async function api(method, url, data) {
  const r = await fetch('https://api.github.com' + url, {
    method, headers: { authorization: `Bearer ${GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'content-type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!r.ok) throw new Error(`${method} ${url}: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

if (!GITHUB_TOKEN || !REPO || !BRANCH) { console.log('no token: the report is on the run summary only'); process.exit(0); }
try {
  const owner = REPO.split('/')[0];
  const prs = await api('GET', `/repos/${REPO}/pulls?state=open&head=${owner}:${encodeURIComponent(BRANCH)}`);
  if (!prs.length) { console.log(`no open pull request for ${BRANCH}: the report is on the run summary only`); process.exit(0); }
  const n = prs[0].number;
  const comments = await api('GET', `/repos/${REPO}/issues/${n}/comments?per_page=100`);
  const mine = comments.find((c) => c.body && c.body.includes(MARK));
  if (mine) await api('PATCH', `/repos/${REPO}/issues/comments/${mine.id}`, { body });
  else await api('POST', `/repos/${REPO}/issues/${n}/comments`, { body });
  console.log(`report posted on pull request #${n}`);
} catch (e) { console.error('the report could not be posted: ' + e.message); process.exit(1); }
