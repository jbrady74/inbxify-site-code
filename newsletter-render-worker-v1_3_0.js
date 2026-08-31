// newsletter-render-worker-v1_3_0.js
//
// INBXIFY Newsletter Render Worker v1.3.0
// Receives a newsletter payload from Scenario 206, fetches block templates
// from GitHub via jsDelivr, substitutes values, returns finished HTML.
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
//   {{BLOCKS}}                in the shell only — where blocks are injected
//
// Make sends flat blocks: f_* are fields, x_* are flags, bare arrays
// (cards, events) pass through to fields untouched.
//
// Unresolved tokens render as empty string, never as literal braces.

const REPO = 'jbrady74/inbxify-site-code';
const BRANCH = 'main';
const CDN = (file) => `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/templates/${file}`;

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

    // ---- render each block -----------------------------------------------
    const ctx = payload.context || {};
    const parts = [];

    payload.blocks.forEach((block, i) => {
      const tplName = pick(block);
      if (!block || !tplName) {
        parts.push(errorBlock(`block ${i} has no template`, debug));
        diagnostics.push({ index: i, error: 'no template named' });
        return;
      }
      const tpl = cache.get(tplName);
      if (tpl == null) {
        parts.push(errorBlock(`template not found: ${tplName}`, debug));
        return;
      }
      try {
        const { fields, flags } = normalize(block);
        if (debug) diagnostics.push({
          index: i,
          template: tplName,
          surface,
          loopKeys: (tpl.match(/\{\{#each\s+[\w.-]+\}\}/g) || []),
          arrays: Object.keys(fields).filter((k) => Array.isArray(fields[k]))
                    .map((k) => k + ':' + fields[k].length),
        });
        parts.push(render(tpl, fields, flags, ctx));
      } catch (err) {
        parts.push(errorBlock(`render failed: ${tplName}`, debug));
        diagnostics.push({ index: i, template: tplName, error: String(err) });
      }
    });

    const body = parts.join('\n');

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

    if (debug) {
      return json({
        ok: diagnostics.length === 0,
        blockCount: payload.blocks.length,
        surface,
        templatesFetched: [...cache.keys()],
        templatesMissing: [...cache.entries()].filter(([, v]) => v == null).map(([k]) => k),
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
