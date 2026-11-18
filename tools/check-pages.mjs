// tools/check-pages.mjs
// ============================================================
// INBXIFY · the Checks Action, part 2: open the changed pages on the test title, on main and on the branch
// (Agent Groundwork G2, scoping §3 points 1 to 4). Runs in GitHub's cloud with Playwright.
//
// v1.0.1 (17 Nov 2026) — from the first runs with the agent login: (1) a page that sends the member away AFTER it has
//   loaded (Memberstack does this in the browser) is now caught, and the report says where the member ended up and
//   what the page showed; (2) a picture no longer waits for web fonts that never arrive.
// v1.0.0 (17 Nov 2026).   node tools/check-pages.mjs        (run from the repo root, on an agent branch)
//   env BRANCH              the branch being checked (must be a preview name: reskin-, agent-, jeff-)
//   env REPO                owner/name (to wait for the CDN)
//   env PAGES               "auto" (default: pages whose manifest differs from main), "all", or a list: "ta,ipp"
//   env IX_AGENT_EMAIL, IX_AGENT_PASSWORD   the agent member's login (GitHub secrets; never printed)
//   env OUT                 where the report goes (default check-out)
//   env IX_BASE             test only: another site address.  env IX_SKIP_CDN_WAIT=1  test only.
//
// WHAT IT DOES, for each changed page (checks/pages.json says where the page is on the test title)
//   1. Signs in as the agent member, if the page needs a login.
//   2. Opens the page twice at each width: once on main (?ixbranch=off) and once on the branch (?ixbranch=<branch>).
//   3. Clicks every rail tab once. Takes a picture of the first view and of every tab, main and branch.
//   4. FAILS (exit 1) when
//        · the page did not load its code, or the preview did not turn on, or the member was sent somewhere else
//        · the branch shows a console error that main does not show
//        · a request to jsDelivr fails on the branch and does not fail on main
//        · the branch has a contrast failure that main does not have (axe-core "color-contrast", WCAG AA)
//      Errors, failed requests and contrast failures main already has are listed, not failed: the check judges
//      the branch's change.
//
// READ-ONLY. It never types, saves or submits; it only opens pages and clicks rail tabs. Every request that is
// not a plain read (POST, PUT, PATCH, DELETE) is listed in the report by address, so a write would be seen.
//
// Writes OUT/pages.md, OUT/pages.json and OUT/shots/*.jpg. Pictures are named in the report as {{IMG:name}};
// tools/post-report.mjs turns those into addresses.
// HARDCODING (provisional): HC-P-AG-3 the test title's page addresses (checks/pages.json); HC-P-AG-8 SETTLE and
//   LIMIT (how long a view may take to go quiet); HC-P-AG-9 the picture format.
// ============================================================
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = '1';   // a picture must not wait for a web font that never arrives
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BRANCH = process.env.BRANCH || '';
const REPO = process.env.REPO || '';
const OUT = process.env.OUT || 'check-out';
const SHOTS = path.join(OUT, 'shots');
const CFG = JSON.parse(fs.readFileSync('checks/pages.json', 'utf8'));
const SITE = (process.env.IX_BASE || CFG.base).replace(/\/$/, '');
const EMAIL = process.env.IX_AGENT_EMAIL || '', PASSWORD = process.env.IX_AGENT_PASSWORD || '';
const SETTLE = 900, LIMIT = 12000;                                   // HC-P-AG-8
const PICTURE = { type: 'jpeg', quality: 68, fullPage: true };       // HC-P-AG-9
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!/^(reskin-|agent-|jeff-)[A-Za-z0-9._-]+$/.test(BRANCH)) { console.error(`"${BRANCH}" is not a preview branch name`); process.exit(1); }
fs.mkdirSync(SHOTS, { recursive: true });

// ── which pages changed ──────────────────────────────────
function changedPages() {
  const names = fs.readdirSync('manifests').filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
  const want = (process.env.PAGES || 'auto').trim();
  if (want === 'all') return names;
  if (want !== 'auto') return want.split(',').map((s) => s.trim()).filter((s) => names.includes(s));
  return names.filter((n) => {
    let main;
    try { main = JSON.parse(execFileSync('git', ['show', `origin/main:manifests/${n}.json`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); }
    catch { return true; }
    const mine = JSON.parse(fs.readFileSync(`manifests/${n}.json`, 'utf8'));
    return JSON.stringify([main.head, main.body]) !== JSON.stringify([mine.head, mine.body]);
  });
}

// ── wait until the CDN serves this branch's version lists ─
async function waitForCdn() {
  if (process.env.IX_SKIP_CDN_WAIT || !REPO) return null;
  const files = fs.readdirSync('loaders').filter((f) => /^ix-load-.*\.js$/.test(f));
  for (let i = 0; i < 48; i++) {
    const behind = [];
    for (const f of files) {
      try {
        const r = await fetch(`https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/loaders/${f}?t=${Date.now()}`, { cache: 'no-store' });
        const body = Buffer.from(await r.arrayBuffer());
        if (r.status !== 200 || !body.equals(fs.readFileSync(path.join('loaders', f)))) behind.push(f);
      } catch { behind.push(f); }
    }
    if (!behind.length) return null;
    if (i === 47) return `jsDelivr is not serving this branch's version lists yet (${behind.join(', ')}). Is the Loaders Action green?`;
    await sleep(10000);
  }
  return null;
}

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'view';
const keyOf = (text) => String(text).split(BRANCH).join('main').replace(/[?&]t=\d+/g, '').replace(/\s+/g, ' ').trim();

async function quiet(page) {
  await page.waitForLoadState('networkidle', { timeout: LIMIT }).catch(() => {});
  await sleep(SETTLE);
}

async function signIn(ctx) {
  const page = await ctx.newPage();
  try {
    await page.goto(SITE + CFG.loginAt, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => window.$memberstackDom && typeof window.$memberstackDom.loginMemberEmailPassword === 'function', null, { timeout: 30000 });
    const res = await page.evaluate(async ([email, password]) => {
      try { const r = await window.$memberstackDom.loginMemberEmailPassword({ email, password }); const m = r && r.data && r.data.member;
        return { ok: !!m, id: m && m.id, plans: ((m && m.planConnections) || []).map((p) => `${p.planId} (${p.status || (p.active ? 'active' : 'not active')})`) }; }
      catch (e) { return { ok: false, why: String((e && e.message) || e).slice(0, 200) }; }
    }, [EMAIL, PASSWORD]);
    await sleep(1200);
    return res;
  } catch (e) { return { ok: false, why: 'the login page did not offer Memberstack: ' + String(e.message || e).slice(0, 160) }; }
  finally { await page.close().catch(() => {}); }
}

// ── one page, one width, main or branch ──────────────────
async function pass(ctx, name, cfg, which, width) {
  const log = { which, stops: [], errors: [], cdn: [], writes: [], contrast: [], views: [], saw: null };
  const page = await ctx.newPage();
  let view = 'first view';
  page.on('console', (m) => { if (m.type() === 'error') log.errors.push({ view, text: m.text().slice(0, 300) }); });
  page.on('pageerror', (e) => log.errors.push({ view, text: String((e && e.message) || e).slice(0, 300) }));
  page.on('requestfailed', (r) => {
    const why = (r.failure() && r.failure().errorText) || '';
    if (/jsdelivr\.net/.test(r.url()) && !/ERR_ABORTED/.test(why)) log.cdn.push({ view, url: r.url(), why });
  });
  page.on('response', (r) => { if (r.status() >= 400 && /jsdelivr\.net/.test(r.url())) log.cdn.push({ view, url: r.url(), why: 'answered ' + r.status() }); });
  page.on('request', (r) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(r.method())) return;
    try { const u = new URL(r.url()); log.writes.push({ view, method: r.method(), to: u.host + u.pathname }); } catch { /* not an address */ }
  });

  async function record(label, n) {
    const file = `${name}-${width}-${String(n).padStart(2, '0')}-${slug(label)}-${which}.jpg`;
    try { await page.screenshot({ path: path.join(SHOTS, file), timeout: 20000, ...PICTURE }); }
    catch (e) {
      // a whole-page picture can hang on a very tall or still-moving page: take what the window shows instead
      try {
        const cdp = await page.context().newCDPSession(page);
        const shot = await Promise.race([cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: PICTURE.quality }), sleep(15000).then(() => null)]);
        if (!shot) throw new Error('the window picture timed out too');
        fs.writeFileSync(path.join(SHOTS, file), Buffer.from(shot.data, 'base64'));
        log.notes = (log.notes || 0) + 1;
      } catch (e2) { log.stops.push(`no picture of "${label}": ${String(e.message || e).replace(/\s+/g, ' ').slice(0, 400)} / ${String(e2.message || e2).slice(0, 120)}`); }
    }
    try {
      const res = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      for (const v of res.violations) for (const nd of v.nodes) {
        const d = (nd.any && nd.any[0] && nd.any[0].data) || {};
        log.contrast.push({ view: label, target: nd.target.join(' '), fg: d.fgColor, bg: d.bgColor, ratio: d.contrastRatio, need: d.expectedContrastRatio });
      }
    } catch (e) { log.stops.push(`contrast could not be measured on "${label}": ${String(e.message || e).slice(0, 120)}`); }
    log.views.push({ label, file });
  }

  async function sawWhat() {
    try {
      log.saw = await page.evaluate(() => {
        const b = document.body, cs = b ? getComputedStyle(b) : null, hs = getComputedStyle(document.documentElement);
        return { url: location.pathname + location.search, title: document.title,
          text: ((b && b.innerText) || '').replace(/\s+/g, ' ').trim().slice(0, 240) +
            ` [body: ${b ? b.children.length : 0} elements, display ${cs && cs.display}, visibility ${cs && cs.visibility}, opacity ${cs && cs.opacity}, height ${b && b.scrollHeight}; html display ${hs.display}, visibility ${hs.visibility}; gated elements ${document.querySelectorAll('[data-ms-content]').length}; member ${(() => { try { return localStorage.getItem('_ms-mem') ? 'in storage' : 'not in storage'; } catch (e) { return '?'; } })()}]` };
      });
      const emptied = await page.evaluate(() => (window.__ixEmptied || []).slice(0, 4)).catch(() => []);
      if (emptied.length) log.saw.text += ` [emptied by: ${emptied.join(' || ')}]`;
      log.saw.text += ` [the server sent: ${log.doc || 'unknown'}; the window went to: ${navs.join(' then ')}]`;
    } catch { /* the page is gone */ }
  }

  // if a script empties the page, remember which one (the report names it)
  await page.addInitScript(() => {
    const seen = (window.__ixEmptied = []);
    const note = (what) => { try { seen.push(what + ' · readyState ' + document.readyState + ' · ' + String(new Error().stack).split('\n').slice(2, 6).map((l) => l.trim().replace(/^at /, '')).join(' < ')); } catch (e) { /* no stack */ } };
    const wrap = (obj, name, test) => { const old = obj[name]; if (typeof old !== 'function') return; obj[name] = function () { try { if (test.call(this, arguments)) note(name); } catch (e) { /* keep going */ } return old.apply(this, arguments); }; };
    wrap(Document.prototype, 'open', function () { return true; });
    wrap(Document.prototype, 'write', function () { return document.readyState !== 'loading'; });
    wrap(Element.prototype, 'remove', function () { return this === document.body || this === document.documentElement; });
    wrap(Node.prototype, 'removeChild', function (a) { return a[0] === document.body || a[0] === document.documentElement; });
    wrap(Node.prototype, 'replaceChild', function (a) { return a[1] === document.body || a[1] === document.documentElement; });
  });
  const navs = [];
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs.push(new URL(f.url()).pathname); });
  page.on('response', async (r) => {
    try {
      if (r.request().resourceType() !== 'document' || r.frame() !== page.mainFrame()) return;
      const t = await r.text().catch(() => '');
      log.doc = `${r.status()}, ${t.length} characters, ${/<body[\s>]/i.test(t) ? 'has a body' : 'no body'}`;
      const gates = [...t.matchAll(/<([a-z0-9]+)\b[^>]*\bdata-ms-content=["']([^"']+)["'][^>]*>/gi)]
        .map((m) => `<${m[1].toLowerCase()}${/\bid=["']([^"']+)/i.exec(m[0]) ? '#' + /\bid=["']([^"']+)/i.exec(m[0])[1] : ''}${/\bclass=["']([^"' ]+)/i.exec(m[0]) ? '.' + /\bclass=["']([^"' ]+)/i.exec(m[0])[1] : ''} data-ms-content="${m[2]}">`);
      if (gates.length) log.doc += `; Memberstack gates in the page: ${[...new Set(gates)].slice(0, 12).join(', ')}`;
    } catch { /* gone */ }
  });

  const address = `${SITE}${cfg.path}?ixbranch=${which === 'main' ? 'off' : encodeURIComponent(BRANCH)}`;
  try {
    await page.goto(address, { waitUntil: 'load', timeout: 60000 });
    if (new URL(page.url()).pathname.replace(/\/$/, '') !== cfg.path.replace(/\/$/, '')) {
      log.stops.push(`asked for ${cfg.path} and was sent to ${new URL(page.url()).pathname}. ${cfg.login ? 'The agent member cannot open this page.' : ''}`);
      await record('first view', 0);
      return log;
    }
    const st = await page.waitForFunction(() => {
      const L = window.IxLoad; if (!L) return false;
      const s = Object.values(L.slots); if (s.length < 2 || !s.every((x) => x.ran || x.failed)) return false;
      return { ref: L.ref, failed: s.filter((x) => x.failed).length };
    }, null, { timeout: 30000 }).then((h) => h.jsonValue()).catch(() => null);
    if (!st) log.stops.push('the page loader did not run (no IxLoad, or a version list never arrived)');
    else {
      if (st.failed) log.stops.push('a version list did not load: the page showed "code did not load"');
      const expect = which === 'main' ? 'main' : BRANCH;
      if (st.ref !== expect) log.stops.push(`the page read "${st.ref}", not "${expect}"${which === 'main' ? '' : ': the preview did not turn on'}`);
    }
    await quiet(page);
    const here = new URL(page.url()).pathname.replace(/\/$/, '');
    if (here !== cfg.path.replace(/\/$/, '')) {
      log.stops.push(`the page opened, then sent the member to ${here || '/'}. ${cfg.login ? 'The agent member is not allowed on this page (check its Memberstack plan).' : ''}`);
      await sawWhat();
      await record('first view', 0);
      return log;
    }
    await record('first view', 0);

    if (cfg.tabs) {
      const labels = await page.locator(cfg.tabs).evaluateAll((els) => els.map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim()));
      if (!labels.length) { log.stops.push(`no rail tabs found (${cfg.tabs})`); await sawWhat(); }
      for (let i = 0; i < labels.length; i++) {
        view = labels[i] || `tab ${i + 1}`;
        try {
          await page.locator(cfg.tabs).nth(i).evaluate((el) => el.click());
          await quiet(page);
          if (new URL(page.url()).pathname.replace(/\/$/, '') !== cfg.path.replace(/\/$/, '')) {
            log.stops.push(`tab "${view}" left the page (${new URL(page.url()).pathname}); opened the page again`);
            await page.goto(address, { waitUntil: 'load', timeout: 60000 }); await quiet(page);
            continue;
          }
          await record(view, i + 1);
        } catch (e) { log.stops.push(`tab "${view}" could not be opened: ${String(e.message || e).slice(0, 140)}`); }
      }
    }
  } catch (e) { log.stops.push(`the page did not open: ${String(e.message || e).slice(0, 200)}`); }
  finally { await page.close().catch(() => {}); }
  return log;
}

// ── run ──────────────────────────────────────────────────
const pages = changedPages();
const result = { branch: BRANCH, pages: [], failed: false, notes: [] };
const md = [];

if (!pages.length) result.notes.push('No page’s file list differs from main, so no page was opened.');
const cdnWait = pages.length ? await waitForCdn() : null;
if (cdnWait) { result.failed = true; result.notes.push(cdnWait); }

if (pages.length && !cdnWait) {
  const browser = await chromium.launch();
  for (const name of pages) {
    const cfg = CFG.pages[name];
    const rec = { page: name, widths: [], fails: [] };
    result.pages.push(rec);
    if (!cfg || !cfg.path) { rec.fails.push(`checks/pages.json has no test address for "${name}". Add one, then push again.`); continue; }
    if (cfg.login && (!EMAIL || !PASSWORD)) { rec.fails.push('This page needs the agent login. The repo secrets IX_AGENT_EMAIL and IX_AGENT_PASSWORD are not set.'); continue; }
    for (const width of CFG.widths) {
      const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 } });
      const w = { width, main: null, branch: null, newErrors: [], newContrast: [], newCdn: [] };
      rec.widths.push(w);
      try {
        if (cfg.login) {
          const s = await signIn(ctx);
          if (!s.ok) { rec.fails.push(`${width} wide: the agent member could not sign in${s.why ? ' (' + s.why + ')' : ''}.`); continue; }
          result.member = { id: s.id, plans: s.plans || [] };
        }
        w.main = await pass(ctx, name, cfg, 'main', width);
        w.branch = await pass(ctx, name, cfg, 'branch', width);
        const seen = new Set(w.main.errors.map((e) => keyOf(e.text)));
        w.newErrors = w.branch.errors.filter((e) => !seen.has(keyOf(e.text)));
        const had = new Set(w.main.contrast.map((c) => `${c.view}|${c.target}|${c.fg}|${c.bg}`));
        w.newContrast = w.branch.contrast.filter((c) => !had.has(`${c.view}|${c.target}|${c.fg}|${c.bg}`));
        for (const s of w.branch.stops) rec.fails.push(`${width} wide, branch: ${s}`);
        const saw = w.branch.saw || w.main.saw;
        if (saw) rec.fails.push(`${width} wide: the page was at \`${saw.url}\`, titled "${saw.title}", and showed: "${saw.text}"`);
        for (const s of w.main.stops) rec.fails.push(`${width} wide, main: ${s}`);
        if (w.newErrors.length) rec.fails.push(`${width} wide: ${w.newErrors.length} console error(s) the branch adds`);
        const gone = new Set(w.main.cdn.map((c) => keyOf(c.url)));
        w.newCdn = w.branch.cdn.filter((c) => !gone.has(keyOf(c.url)));
        if (w.newCdn.length) rec.fails.push(`${width} wide: ${w.newCdn.length} failed request(s) to jsDelivr the branch adds`);
        if (w.newContrast.length) rec.fails.push(`${width} wide: ${w.newContrast.length} contrast failure(s) the branch adds`);
      } finally { await ctx.close().catch(() => {}); }
    }
  }
  await browser.close();
}
for (const p of result.pages) if (p.fails.length) result.failed = true;

// ── the report ───────────────────────────────────────────
const cell = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
md.push(`### Pages: ${result.failed ? 'FAILED' : 'passed'}`);
md.push('');
for (const n of result.notes) md.push(n, '');
if (result.member) md.push(`The agent member \`${result.member.id}\` has ${result.member.plans.length} Memberstack plan(s)${result.member.plans.length ? ': ' + result.member.plans.map((x) => '`' + x + '`').join(', ') : ''}.`, '');
for (const p of result.pages) {
  md.push(`#### ${p.page}: ${p.fails.length ? 'FAILED' : 'passed'}`);
  md.push('');
  for (const f of p.fails) md.push(`- ${f}`);
  if (p.fails.length) md.push('');
  for (const w of p.widths) {
    if (!w.main || !w.branch) continue;
    if (w.newErrors.length) {
      md.push(`**${w.width} wide: console errors the branch adds**`, '', '| View | Error |', '|---|---|');
      for (const e of w.newErrors.slice(0, 40)) md.push(`| ${cell(e.view)} | \`${cell(e.text)}\` |`);
      md.push('');
    }
    if (w.newCdn.length) {
      md.push(`**${w.width} wide: failed requests to jsDelivr the branch adds**`, '', '| View | Address | Why |', '|---|---|---|');
      for (const c of w.newCdn.slice(0, 40)) md.push(`| ${cell(c.view)} | \`${cell(c.url)}\` | ${cell(c.why)} |`);
      md.push('');
    }
    if (w.newContrast.length) {
      md.push(`**${w.width} wide: contrast failures the branch adds**`, '', '| View | Element | Text on background | Ratio | Needs |', '|---|---|---|---|---|');
      for (const c of w.newContrast.slice(0, 60)) md.push(`| ${cell(c.view)} | \`${cell(c.target)}\` | ${cell(c.fg)} on ${cell(c.bg)} | ${cell(c.ratio)} | ${cell(c.need)} |`);
      md.push('');
    }
    const oldErr = [...new Set(w.main.errors.map((e) => keyOf(e.text)))];
    const writes = [...new Set(w.branch.writes.map((x) => `${x.method} ${x.to}`))];
    md.push(`<details><summary>${p.page} at ${w.width} wide: ${w.branch.views.length} view(s), main beside branch</summary>`, '');
    const oldCdn = [...new Set(w.main.cdn.map((c) => `${c.url} (${c.why})`))];
    md.push(`Already on main, not failed: ${oldErr.length} console error(s), ${oldCdn.length} failed request(s) to jsDelivr, ${w.main.contrast.length} contrast failure(s).`);
    if (oldErr.length || oldCdn.length) { md.push(''); for (const e of oldErr.slice(0, 15)) md.push(`- \`${cell(e)}\``); for (const e of oldCdn.slice(0, 15)) md.push(`- failed request: \`${cell(e)}\``); }
    md.push('');
    md.push(writes.length ? `Requests that were not plain reads (the check clicked rail tabs only): ${writes.map((x) => `\`${x}\``).join(', ')}.` : 'Every request was a plain read.');
    md.push('', '| View | main | branch |', '|---|---|---|');
    const byLabel = new Map(w.main.views.map((v) => [v.label, v.file]));
    const imgw = w.width < 600 ? 200 : 400;
    for (const v of w.branch.views) {
      const m = byLabel.get(v.label);
      md.push(`| ${cell(v.label)} | ${m ? `<img src="{{IMG:${m}}}" width="${imgw}">` : 'not on main'} | <img src="{{IMG:${v.file}}}" width="${imgw}"> |`);
    }
    md.push('', '</details>', '');
  }
}

fs.writeFileSync(path.join(OUT, 'pages.md'), md.join('\n'));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(result, null, 2));
console.log(md.join('\n').replace(/<img[^>]*>/g, '(picture)'));
process.exit(result.failed ? 1 : 0);
