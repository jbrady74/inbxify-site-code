// newsletter-render-worker-v1_9_0.js
//
// INBXIFY Newsletter Render Worker v1.9.0
// Receives a newsletter payload from Scenario 206, fetches block templates
// from GitHub via jsDelivr, substitutes values, returns finished HTML.
//
// v1.9.0 (Design Pass 2 S2): the web page is arranged after the blocks
//   render. Web surface only; email is untouched until the email pass.
//   1 · Ad groups (D142). Ads placed next to each other render as groups
//       of up to three: one "Featured local partners" label above one mat
//       holding the ads. Four become two pairs, five a three and a two. An
//       unsold slot renders nothing and does not count. A lone ad keeps its
//       own label. The label is ctx.lblPartners (the labels map, D144),
//       else the platform default. web-blocks-v50 styles the group.
//   2 · Opener runs (D145). An Around Town block and every block after it,
//       up to the next ad or the next opener, sit in one .nlw-run, closed
//       by a small mark (.nlw-run-end) when the run holds any block.
//   A block's kind comes from its template file name (web-ba-…, web-at-…),
//   the same naming 206 already checks on the email file. ?debug=1 lists
//   the groups and runs it made.
//   Nothing else changed.
//
// v1.8.0 (Design Port Session 5): the email is tidied before it leaves.
//   Gmail clips any message over about 102 KB behind "Message clipped",
//   hiding everything below the cut: ads, footer, unsubscribe. WLN-999's
//   email came out at 100.7 KB, and 18.6 KB of that was template comments
//   (file names and build notes) no reader ever sees. The sender's link
//   tracking then lengthens every link, which would push it over.
//   On the email surface only, tidyEmail() removes HTML comments and the
//   indentation at the start of each line. WLN-999: 100.7 KB → 75.3 KB,
//   visible text identical.
//   Kept: Outlook's conditional comments (<!--[if mso]> ... <![endif]-->
//   and <!--<![endif]-->), and the "INBXIFY render:" markers a failed block
//   leaves, so a failure is still findable in the sent file.
//   Not touched: the web surface, and ?debug=1, which returns the untidied
//   HTML so templates can still be traced. Debug now reports emailBytes
//   (raw and tidied) and warns above 95 KB.
//   Nothing else changed.
//
// v1.7.0 (Design Port Session 3): the skin reaches web as well as email.
//   A skinned block also gets ctx.skinStyle — the same values written as CSS
//   custom properties, ready to drop on the block's wrapper:
//       --nl-surface:#f6efe6;--nl-accent:#8a5a3c;
//   Email templates read the values directly and need nothing new. Web
//   templates put style="{{&ctx.skinStyle}}" on their outer element; every
//   rule inside then resolves against the block's own values, because custom
//   properties cascade. A block with no skin gets an empty string, so the
//   attribute is harmless when absent.
//
//   Most token names already match the web variable names. One does not:
//   email calls the card's ground "surface", and the web stylesheet paints an
//   article block from --nl-article-bg, which defaults to transparent. So a
//   skin's surface is emitted under BOTH names. That alias lives in SKIN_ALIAS
//   below, is the only one, and exists because the two surfaces named the same
//   visual role differently before this work. Logged as a hardcode. Remove it
//   the day the stylesheet reads --nl-surface for an article's ground.
//
// v1.6.0 (Design Port Session 3): per-block design values.
//   A block may carry a "skin" object: token names with different values,
//   applied to that block only. The block renders against ctx + its own
//   skin; every other block is untouched. This is what lets a section
//   carry its own look — a wallpaper, a background, an accent — without a
//   second template or a second stylesheet.
//     "blocks": [ { "template": "...", "skin": { "ev-bg": "#f3ece1" },
//                   "fields": {...} } ]
//   Skin values are plain values, not @references: 206 resolves the
//   cascade and sends the finished value. Unknown names are harmless;
//   a template that never reads the name simply ignores it.
//   A block with no skin renders exactly as it did on v1.5.0.
//
// v1.5.0 (Design Port Session 3): one new loop flag.
//   Inside {{#each}}, "only" is true when the list has exactly one item,
//   beside the existing "first" and "last". EV email v4 uses it to render
//   one event as a card and two or more as rows. Nothing else changed;
//   templates that don't use "only" render exactly as on v1.4.0.
//
// v1.4.0 (Design Port Session 2): email design values from token files.
//   payload.tokens names the title's token file, e.g.
//   "bnm-wln/email-tokens-v1.json". That file lists its parents in
//   "extends" (platform first, then publisher), the way a web shell names
//   its stylesheet. The Worker merges platform, then publisher, then title,
//   replaces every "@name" with that name's value, and adds the result to
//   the context. Templates read {{ctx.ink}}, {{ctx.t-title}}, and font
//   chains unescaped: {{&ctx.font-ui}}.
//   A context key sent by 206 wins over a token of the same name; the
//   clash is listed in ?debug=1. No payload.tokens: behaves as v1.3.0.
//   Safe to deploy first: no live template reads a token until repointed.
//
// v1.3.0 (WS-I Session 2): surface-aware template selection.
//   payload.surface === "web"  → each block renders block.templateWeb when
//   present, falling back to block.template (email) so content never
//   vanishes from a published page. Email path behavior unchanged.
//   No other changes from v1.2.0.
//
// Deploy as: newsletter-render.<subdomain>.workers.dev
//
// ── ENDPOINTS ──────────────────────────────────────────────────────────
//   POST /render          → returns text/html (the newsletter)
//   POST /render?debug=1  → returns application/json (payload + diagnostics)
//   GET  /health          → returns 200 "ok"
//
// ── TEMPLATE SYNTAX ────────────────────────────────────────────────────
//   {{field}}                 value from block fields, HTML-escaped
//   {{&field}}                value, NOT escaped (for pre-built HTML)
//   {{ctx.titleName}}         value from payload.context
//   {{#flag}} ... {{/flag}}   shown when flag is truthy
//   {{^flag}} ... {{/flag}}   shown when flag is falsy
//   {{#each items}} ... {{/each}}   loops an array in fields
//        inside a loop, {{.field}} reads the current item
//        loop flags: first, last, only (v1.5.0)
//   {{BLOCKS}}                in the shell only — where blocks are injected
//
// Make sends flat blocks: f_* are fields, x_* are flags, bare arrays
// (cards, events) pass through to fields untouched.
//
// Unresolved tokens render as empty string, never as literal braces.

const REPO = 'jbrady74/inbxify-site-code';
const BRANCH = 'main';
const CDN = (file) => `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/templates/${file}`;

// v1.8.0 — debug warns when a tidied email passes this size. Gmail clips
// at about 102 KB; the margin leaves room for the sender's link tracking.
const EMAIL_WARN_BYTES = 95 * 1024;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === '/health') {
      return new Response('ok', { status: 200, headers: CORS });
    }

    if (request.method !== 'POST') {
      return new Response('POST only', { status: 405, headers: CORS });
    }

    const debug = url.searchParams.get('debug') === '1';
    const diagnostics = [];

    let payload;
    try {
      payload = await request.json();
    } catch (err) {
      return json({ error: 'payload is not valid JSON', detail: String(err) }, 400);
    }

    if (!payload || !Array.isArray(payload.blocks)) {
      return json({ error: 'payload.blocks must be an array' }, 400);
    }

    // v1.3.0 — surface-aware template selection (web prefers templateWeb,
    // falls back to the email template so content never disappears)
    const surface = payload.surface === 'web' ? 'web' : 'email';
    const pick = (b) =>
      (surface === 'web' && b && b.templateWeb) ? b.templateWeb : (b && b.template);

    const cache = new Map();

    // ---- fetch every distinct template once ------------------------------
    const wanted = new Set();
    if (payload.shell) wanted.add(payload.shell);
    for (const b of payload.blocks) {
      const t = pick(b);
      if (t) wanted.add(t);
    }

    await Promise.all([...wanted].map(async (file) => {
      try {
        const res = await fetch(CDN(file), { cf: { cacheTtl: 300, cacheEverything: true } });
        if (!res.ok) {
          diagnostics.push({ template: file, status: res.status, error: 'fetch failed' });
          cache.set(file, null);
          return;
        }
        cache.set(file, await res.text());
      } catch (err) {
        diagnostics.push({ template: file, error: String(err) });
        cache.set(file, null);
      }
    }));

    // ---- design tokens (v1.4.0) -------------------------------------------
    const ctx = Object.assign({}, payload.context || {});
    let tokenReport = null;
    if (payload.tokens) {
      tokenReport = await loadTokens(payload.tokens, diagnostics);
      for (const [k, v] of Object.entries(tokenReport.values)) {
        if (Object.prototype.hasOwnProperty.call(ctx, k)) {
          diagnostics.push({ token: k, error: 'context key of the same name wins' });
        } else {
          ctx[k] = v;
        }
      }
    }

    // A skin value that the web stylesheet reads under a second name.
    // One entry, and the reason is in the header above.
    const SKIN_ALIAS = { surface: ['surface', 'article-bg'] };

    // ---- render each block -----------------------------------------------
    const parts = [];
    const kinds = [];                       // v1.9.0: 'ba' | 'at' | 'other'
    const addPart = (html, tplName) => { parts.push(html); kinds.push(blockKind(tplName)); };

    payload.blocks.forEach((block, i) => {
      const tplName = pick(block);
      if (!block || !tplName) {
        addPart(errorBlock(`block ${i} has no template`, debug), null);
        diagnostics.push({ index: i, error: 'no template named' });
        return;
      }
      const tpl = cache.get(tplName);
      if (tpl == null) {
        addPart(errorBlock(`template not found: ${tplName}`, debug), null);
        return;
      }
      try {
        const { fields, flags } = normalize(block);

        // per-block design values (v1.6.0). Shallow merge over the run's
        // context, for this block only.
        let blockCtx = Object.assign({}, ctx, { skinStyle: '' });
        const skin = block && typeof block.skin === 'object' && block.skin ? block.skin : null;
        if (skin) {
          const applied = {};
          for (const [k, v] of Object.entries(skin)) {
            if (v == null || v === '') continue;      // empty means "inherit"
            applied[k] = String(v);
          }
          if (Object.keys(applied).length) {
            // the same values as CSS custom properties, for web wrappers
            const css = Object.entries(applied)
              .filter(([k]) => /^[a-z0-9-]+$/i.test(k))
              .flatMap(([k, v]) => (SKIN_ALIAS[k] || [k])
                .map((name) => '--nl-' + name + ':' + v.replace(/[;{}<>"]/g, '')))
              .join(';');
            blockCtx = Object.assign({}, ctx, applied, { skinStyle: css });
            if (debug) diagnostics.push({ index: i, skin: applied, skinStyle: css });
          }
        }
        if (debug) diagnostics.push({
          index: i,
          template: tplName,
          surface,
          loopKeys: (tpl.match(/\{\{#each\s+[\w.-]+\}\}/g) || []),
          arrays: Object.keys(fields).filter((k) => Array.isArray(fields[k]))
                    .map((k) => k + ':' + fields[k].length),
        });
        addPart(render(tpl, fields, flags, blockCtx), tplName);
      } catch (err) {
        addPart(errorBlock(`render failed: ${tplName}`, debug), null);
        diagnostics.push({ index: i, template: tplName, error: String(err) });
      }
    });

    // v1.9.0 — on web, adjacent ads become one group and an opener holds
    // the run of blocks under it. Email is unchanged until the email pass.
    const groups = [];
    const body = surface === 'web'
      ? arrangeWeb(parts, kinds, ctx, groups)
      : parts.join('\n');

    // ---- wrap in the shell ------------------------------------------------
    let html;
    const shell = payload.shell ? cache.get(payload.shell) : null;
    if (shell == null) {
      if (payload.shell) diagnostics.push({ shell: payload.shell, error: 'shell not found' });
      else diagnostics.push({ shell: null, error: 'no shell named in payload' });
      html = errorBlock('shell not found: ' + (payload.shell || '(none named)'), true) + body;
    } else {
      html = render(shell, ctx, payload.flags || {}, ctx).replace(/\{\{\s*BLOCKS\s*\}\}/g, body);
    }

    // ---- email tidy (v1.8.0) ---------------------------------------------
    let emailBytes = null;
    if (surface === 'email') {
      const tidied = tidyEmail(html);
      emailBytes = { raw: byteLength(html), tidied: byteLength(tidied) };
      if (emailBytes.tidied > EMAIL_WARN_BYTES) {
        diagnostics.push({ email: 'size', bytes: emailBytes.tidied,
          error: 'over 95 KB after tidy; Gmail clips at about 102 KB' });
      }
      if (!debug) html = tidied;
    }

    if (debug) {
      return json({
        ok: diagnostics.length === 0,
        blockCount: payload.blocks.length,
        surface,
        emailBytes,
        groups,
        templatesFetched: [...cache.keys()],
        templatesMissing: [...cache.entries()].filter(([, v]) => v == null).map(([k]) => k),
        tokens: tokenReport ? { files: tokenReport.files, count: Object.keys(tokenReport.values).length,
                                values: tokenReport.values } : null,
        diagnostics,
        html,
      }, 200);
    }

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS },
    });
  },
};


// ---- email tidy (v1.8.0) -------------------------------------------------
// Removes HTML comments and leading indentation. Keeps Outlook conditional
// comments and failed-block markers. Collapsing a newline plus indentation
// to a newline leaves the same whitespace for layout, so nothing visible
// moves. No email template uses <pre> or <textarea>, where it would matter.
function tidyEmail(html) {
  let out = String(html).replace(/<!--([\s\S]*?)-->/g, (m, inner) => {
    if (/^\[if\s/i.test(inner)) return m;            // <!--[if mso]> ... <![endif]-->
    if (/^<!\[endif\]/i.test(inner)) return m;       // <!--<![endif]-->
    if (/<!\[endif\]$/i.test(inner)) return m;
    if (/^\s*INBXIFY render:/.test(inner)) return m; // failed-block marker
    return '';
  });
  out = out.replace(/\n[ \t]+/g, '\n').replace(/\n{2,}/g, '\n');
  return out.replace(/^\s+/, '');
}

function byteLength(s) {
  return new TextEncoder().encode(String(s)).length;
}


// ---- web arrangement (v1.9.0) --------------------------------------------
// A block's kind comes from its template's file name. 206 already requires
// an email file to be named for its block type ("email-ba-…" for BA), and
// web files follow the same pattern ("web-ba-…"), so the name is a checked
// fact, not a guess. Logged in the tracker as a naming dependency.
function blockKind(tplName) {
  const base = String(tplName || '').split('/').pop().toLowerCase();
  if (/^(web|email)-ba-/.test(base)) return 'ba';
  if (/^(web|email)-at-/.test(base)) return 'at';
  return 'other';
}

// Ad groups (D142): ads placed next to each other render as groups of up to
// three under one label. Four become two pairs, five a three and a two.
// An unsold slot renders nothing and does not count. A lone ad keeps its
// own label.
// Opener runs (D145): an Around Town block and every block after it, up to
// the next ad or the next opener, sit inside one .nlw-run, which ends with
// a closing mark when the run holds more than the opener.
function arrangeWeb(parts, kinds, ctx, groups) {
  const out = [];
  const n = parts.length;
  const label = esc(String(ctx.lblPartners || '').trim() || 'Featured local partners');
  // a part with nothing but template comments counts as empty (an unsold slot)
  const bare = (p) => String(p || '').replace(/<!--[\s\S]*?-->/g, '').trim();
  const filled = (j) => bare(parts[j]) !== '';
  const isAd = (j) => kinds[j] === 'ba' && filled(j);

  const emitAds = (ads, at) => {
    if (ads.length < 2) { out.push(...ads); if (ads.length) groups.push({ at, ads: 1 }); return; }
    const count = Math.ceil(ads.length / 3);
    let k = 0;
    for (let g = 0; g < count; g++) {
      const size = Math.ceil((ads.length - k) / (count - g));
      const chunk = ads.slice(k, k + size);
      k += size;
      groups.push({ at, ads: chunk.length });
      out.push(chunk.length === 1 ? chunk[0]
        : '<div class="nlw-ba-group">\n<div class="nlw-ba-group-label">' + label +
          '</div>\n<div class="nlw-ba-group-mat">\n' + chunk.join('\n') + '\n</div>\n</div>');
    }
  };

  let i = 0;
  while (i < n) {
    if (kinds[i] === 'ba') {
      const ads = [];
      const start = i;
      while (i < n && kinds[i] === 'ba') { if (filled(i)) ads.push(parts[i]); i++; }
      emitAds(ads, start);
      continue;
    }
    if (kinds[i] === 'at') {
      const run = [parts[i]];
      let j = i + 1;
      while (j < n && kinds[j] !== 'at' && !isAd(j)) { run.push(parts[j]); j++; }
      const held = run.slice(1).filter((p) => bare(p) !== '').length;
      out.push('<div class="nlw-run nlw-run--at">\n' + run.join('\n') +
        (held ? '\n<div class="nlw-run-end" aria-hidden="true"></div>' : '') + '\n</div>');
      groups.push({ at: i, run: held });
      i = j;
      continue;
    }
    out.push(parts[i]);
    i++;
  }
  return out.join('\n');
}

// ---- tokens (v1.4.0) -----------------------------------------------------
// Fetch the title file, then each file it extends. Merge in order:
// extends[0] (platform), extends[1] (publisher), ..., then the title file.
// Keys starting with "_" and the "extends" key are notes, not tokens.
async function fetchJSON(file, diagnostics) {
  try {
    const res = await fetch(CDN(file), { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!res.ok) { diagnostics.push({ tokens: file, status: res.status, error: 'fetch failed' }); return null; }
    return await res.json();
  } catch (err) {
    diagnostics.push({ tokens: file, error: 'not valid JSON or fetch error: ' + String(err) });
    return null;
  }
}

async function loadTokens(titleFile, diagnostics) {
  const title = await fetchJSON(titleFile, diagnostics);
  const parents = (title && Array.isArray(title.extends)) ? title.extends : [];
  const parentData = await Promise.all(parents.map((f) => fetchJSON(f, diagnostics)));
  const merged = {};
  for (const layer of [...parentData, title]) {
    if (!layer) continue;
    for (const [k, v] of Object.entries(layer)) {
      if (k === 'extends' || k.startsWith('_')) continue;
      merged[k] = v;
    }
  }
  return { files: [...parents, titleFile], values: resolveRefs(merged, diagnostics) };
}

// "@name" means "the value of name". Chains are followed; loops and
// unknown names are reported and resolve to empty.
function resolveRefs(tokens, diagnostics) {
  const out = {};
  const walk = (k, seen) => {
    if (Object.prototype.hasOwnProperty.call(out, k)) return out[k];
    const v = tokens[k];
    if (typeof v !== 'string' || !v.startsWith('@')) return v;
    const ref = v.slice(1);
    if (seen.has(ref)) { diagnostics.push({ token: k, error: 'reference loop via @' + ref }); return ''; }
    if (!Object.prototype.hasOwnProperty.call(tokens, ref)) {
      diagnostics.push({ token: k, error: 'unknown reference @' + ref }); return '';
    }
    seen.add(ref);
    return walk(ref, seen);
  };
  for (const k of Object.keys(tokens)) out[k] = walk(k, new Set([k]));
  return out;
}

function normalize(block) {
  if (block.fields || block.flags) {
    return { fields: block.fields || {}, flags: block.flags || {} };
  }
  const fields = {}, flags = {};
  for (const [k, v] of Object.entries(block)) {
    if (k.startsWith('f_')) fields[k.slice(2)] = v;
    else if (k.startsWith('x_')) flags[k.slice(2)] = v;
    else if (Array.isArray(v)) fields[k] = v;
  }
  fields.blockType = block.blockType;
  fields.position = block.position;
  return { fields, flags };
}

function render(tpl, fields, flags, ctx) {
  let out = String(tpl);
  out = renderLoops(out, fields, flags, ctx);
  out = renderSections(out, flags, fields, ctx);
  out = renderTokens(out, fields, ctx);
  return out;
}

function renderLoops(tpl, fields, flags, ctx) {
  return tpl.replace(/\{\{#each\s+([\w.-]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (m, key, body) => {
    const list = lookup(fields, key);
    if (!Array.isArray(list) || list.length === 0) return '';
    return list.map((item, idx) => {
      const scoped = (item && typeof item === 'object') ? item : { value: item };
      const itemFlags = Object.assign({}, flags, scoped.flags || {}, {
        first: idx === 0,
        last: idx === list.length - 1,
        only: list.length === 1,
      });
      let chunk = body.replace(/\{\{(&?)\.([\w.-]+)\}\}/g, (mm, raw, k) => {
        const v = lookup(scoped, k);
        return v == null ? '' : (raw ? String(v) : esc(String(v)));
      });
      chunk = renderSections(chunk, itemFlags, scoped, ctx);
      return renderTokens(chunk, Object.assign({}, fields, scoped), ctx);
    }).join('');
  });
}

function renderSections(tpl, flags, fields, ctx) {
  const test = (key) => {
    if (flags && Object.prototype.hasOwnProperty.call(flags, key)) return truthy(flags[key]);
    if (key.startsWith('ctx.')) return truthy(lookup(ctx || {}, key.slice(4)));
    const f = lookup(fields || {}, key);
    if (f !== undefined) return truthy(f);
    return truthy(lookup(flags || {}, key));
  };
  let out = tpl;
  for (let pass = 0; pass < 12; pass++) {
    const before = out;
    out = out.replace(/\{\{#([\w.-]+)\}\}((?:(?!\{\{[#^]).)*?)\{\{\/\1\}\}/gs,
      (m, key, body) => test(key) ? body : '');
    out = out.replace(/\{\{\^([\w.-]+)\}\}((?:(?!\{\{[#^]).)*?)\{\{\/\1\}\}/gs,
      (m, key, body) => test(key) ? '' : body);
    if (out === before) break;
  }
  return out;
}

function renderTokens(tpl, fields, ctx) {
  return tpl.replace(/\{\{(&?)([\w.-]+)\}\}/g, (m, raw, key) => {
    if (key === 'BLOCKS') return m;
    const src = key.startsWith('ctx.') ? ctx : fields;
    const path = key.startsWith('ctx.') ? key.slice(4) : key;
    const v = lookup(src, path);
    if (v == null) return '';
    return raw ? String(v) : esc(String(v));
  });
}

function lookup(obj, path) {
  if (!obj) return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, path)) return obj[path];
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function truthy(v) {
  if (v == null) return false;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s !== '' && s !== '0' && s !== 'false' && s !== 'no';
  }
  if (Array.isArray(v)) return v.length > 0;
  return Boolean(v);
}

function esc(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// A failed block renders as a visible marker, never as silence.
function errorBlock(msg, debug) {
  const safe = esc(String(msg));
  if (!debug) return `<!-- INBXIFY render: ${safe} -->`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr><td style="padding:14px;background:#fff3f0;border:1px solid #cc5500;
font-family:Arial,sans-serif;font-size:12px;color:#7a2e00;">
INBXIFY render error — ${safe}</td></tr></table>`;
}

function json(obj, status) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  });
}
