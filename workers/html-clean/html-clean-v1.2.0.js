/**
 * html-clean-v1.2.0.js
 * html-clean worker
 *
 * Conditions publisher-uploaded HTML files into clean, Webflow-RT-friendly HTML.
 *
 * ------------------------------------------------------------------
 * v1.2.0 — LISTS SURVIVE. ENTITIES ALL DECODE. THE WORKER SAYS WHAT IT IS.
 *
 *   WHAT HAPPENED. A Recipe submission came through with four paragraphs
 *   of substitution notes and nothing else. Ten ingredients and four
 *   method steps were missing. The output was a byte-for-byte match for
 *   what v1.0 produces on that file, which is how we know v1.1.0 was not
 *   the code that ran. v1.1.0 recovers all eighteen blocks; it was
 *   verified against this exact file before v1.2.0 was written.
 *
 *   That is a deploy question, not a code question, and it cost a second
 *   file in the same tranche to answer. So v1.2.0 stops the question from
 *   ever being asked again: every response now carries
 *
 *       X-Inbxify-Worker: html-clean v1.2.0
 *
 *   Read the header, know the code. No more reasoning backwards from
 *   output shape to figure out which build answered.
 *
 *   CHANGE 1 — LISTS ARE LISTS.
 *   v1.1.0's extractBlocks walks li, so the recipe's items survived, but
 *   the output contract flattened every one of them into a bare <p>. A
 *   recipe is not fourteen paragraphs. Neither is an event schedule or a
 *   real estate feature list, and both are coming.
 *
 *   ul and ol now join the scan set as CONTAINERS. A container emits one
 *   list node holding its items; everything else still emits paragraph
 *   nodes. Output is a mixed stream of <p>, <ul> and <ol>. Webflow rich
 *   text and Trix both accept all three, so nothing downstream changes.
 *
 *   A nested list inside an li is FLATTENED into its parent's item run
 *   rather than nested. Publisher submissions do not use nested lists and
 *   a wrong nesting is worse than a flat one. If that ever stops being
 *   true it is a small change, in listItemsFrom().
 *
 *   An <li> found outside any list is still a paragraph. That is how
 *   email clients emit a single orphaned bullet.
 *
 *   CHANGE 2 — THE ENTITY TABLE STOPPED BEING A GUESS.
 *   The same recipe carried &frac12; and &frac34;. Both came through
 *   undecoded, in v1.0 and in v1.1.0 alike, because the named map held
 *   about sixty entries chosen from four sample files. &amp; decoded and
 *   &frac12; did not, which reads to an operator as random.
 *
 *   The map now covers the whole HTML4 named set that matters for body
 *   copy: fractions, arrows, maths, currency, punctuation, and the full
 *   Latin-1 range in both cases. Numeric decoding was already complete
 *   and is unchanged.
 *
 *   It will still never be exhaustive, so an unrecognised named entity is
 *   now REPORTED rather than silently passed through:
 *
 *       X-Inbxify-Unknown-Entities: frac56,oline
 *
 *   The text is left exactly as written — the entity is passed through,
 *   never dropped or mangled — but we find out it happened on the first
 *   file rather than the fifth.
 *
 *   CHANGE 3 — THE DOCUMENT'S OWN WORD COUNT IS A RULER.
 *   Doug's metadata table declares Word Count. Every failure in the
 *   October tranche would have been caught by comparing it against what
 *   came out. Titanium: 360 declared, 9 extracted. Recipe: 194 declared,
 *   about 25 extracted. Both silent, both HTTP 200.
 *
 *   The Worker now counts the extracted body and reports:
 *
 *       X-Inbxify-Wordcount-Declared: 194
 *       X-Inbxify-Wordcount-Extracted: 214
 *       X-Inbxify-Wordcount-Ratio: 1.10
 *       X-Inbxify-Warning: (present only when the ratio is low)
 *
 *   The Worker REPORTS, it does not REJECT. Whether a thin body is
 *   rejected outright or written and flagged for the operator is a
 *   Scenario B routing decision, and Scenario B already has the Slack
 *   channel for it (#rejected-txt-submission-scenario-b). Putting the
 *   verdict here would bury the policy in a Worker where nobody would
 *   look for it.
 *
 *   The threshold is WORDCOUNT_MIN_RATIO, 0.60, a single named constant.
 *   Only a LOW ratio warns. High is normal and expected: a declared count
 *   is usually the editorial body and excludes list items and the byline,
 *   which is why the recipe reads 1.10 rather than 1.00.
 *
 *   Multi-tenant note: nothing here is publisher-specific. Doug's table
 *   supplies the declared count; a publisher whose files carry no such
 *   table simply gets no ratio and no warning, same as today.
 * ------------------------------------------------------------------
 *
 * v1.1.0 — THE BODY IS READ AS BLOCKS, NOT COUNTED AS <p> TAGS.
 *
 *   A submission forwarded out of an email client arrived with every
 *   paragraph wrapped in <div>. Eleven blocks went in, two came out,
 *   because v1.0 chose its extractor by counting <p> tags and the <p>
 *   walker is blind to <div>. extractBlocks() replaced the count with a
 *   nesting-aware walk of the body's block elements in document order.
 *   extractParagraphs() was deleted rather than left beside it — two
 *   extractors is how the wrong one gets chosen.
 *
 * ------------------------------------------------------------------
 * Pipeline:
 *   1. Auth check (Bearer token, optional)
 *   2. Read raw bytes, decode UTF-8
 *   3. Detect "Doug shape" — metadata <table> at top of body
 *   4. Doug shape:
 *        - Parse metadata <table> → JSON sidecar
 *        - Take everything after </table><br/><hr/> as the body
 *        - Normalize body: strip head, strip noise, blocks → nodes,
 *          decode entities, strip inline styles, drop empty paragraphs
 *   5. Fallback shape (anything else):
 *        - Strip head, scripts, styles
 *        - Same normalization, no metadata
 *   6. Return cleaned HTML with metadata and diagnostics in headers
 *
 * Response shape:
 *   - Status 200, Content-Type text/html
 *   - Body = cleaned HTML: <p>, <ul>, <ol> with strong / em / a / br inline
 *   - X-Inbxify-Worker                 html-clean v1.2.0
 *   - X-Inbxify-Metadata               JSON sidecar (Title, By Line, etc.)
 *   - X-Inbxify-Shape                  "doug" | "fallback"
 *   - X-Inbxify-Wordcount-Declared     from the metadata table, when present
 *   - X-Inbxify-Wordcount-Extracted    always
 *   - X-Inbxify-Wordcount-Ratio        when a declared count was present
 *   - X-Inbxify-Warning                only when the ratio is below threshold
 *   - X-Inbxify-Unknown-Entities       only when unrecognised entities were seen
 *
 * Headings are not emitted: the ASF's promoteBoldHeaders turns the
 * author's bold-only lines into <h2>, and that stays the single place
 * section headers are decided.
 *
 * Errors:
 *   - 400 empty body
 *   - 401 unauthorized (if HTML_WORKER_SECRET is set and Bearer doesn't match)
 *   - 405 wrong method
 *   - 500 unexpected error
 */

const WORKER_VERSION = 'html-clean v1.2.0';

/* Below this share of the document's own declared word count, the
 * extracted body is reported as suspect. Low only — a high ratio is
 * normal, since declared counts usually exclude list items and bylines. */
const WORDCOUNT_MIN_RATIO = 0.60;

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
        status: 405,
        headers: { 'content-type': 'application/json', 'x-inbxify-worker': WORKER_VERSION },
      });
    }

    // Optional Bearer auth
    if (env.HTML_WORKER_SECRET) {
      const auth = request.headers.get('authorization') || '';
      const expected = `Bearer ${env.HTML_WORKER_SECRET}`;
      if (auth !== expected) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json', 'x-inbxify-worker': WORKER_VERSION },
        });
      }
    }

    const buf = await request.arrayBuffer();
    if (!buf || buf.byteLength === 0) {
      return new Response(JSON.stringify({ error: 'empty_body' }), {
        status: 400,
        headers: { 'content-type': 'application/json', 'x-inbxify-worker': WORKER_VERSION },
      });
    }

    const html = new TextDecoder('utf-8').decode(buf);

    try {
      const result = condition(html);

      const headers = {
        'content-type': 'text/html; charset=utf-8',
        'x-inbxify-worker': WORKER_VERSION,
        'x-inbxify-metadata': JSON.stringify(result.metadata),
        'x-inbxify-shape': result.shape,
        'x-inbxify-wordcount-extracted': String(result.wordCount.extracted),
      };
      if (result.wordCount.declared != null) {
        headers['x-inbxify-wordcount-declared'] = String(result.wordCount.declared);
        headers['x-inbxify-wordcount-ratio'] = result.wordCount.ratio.toFixed(2);
      }
      if (result.warning) headers['x-inbxify-warning'] = result.warning;
      if (result.unknownEntities.length) {
        headers['x-inbxify-unknown-entities'] = result.unknownEntities.join(',');
      }

      return new Response(result.html, { status: 200, headers });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'conversion_failed', detail: String(err.message || err) }),
        {
          status: 500,
          headers: { 'content-type': 'application/json', 'x-inbxify-worker': WORKER_VERSION },
        }
      );
    }
  },
};

/* ============================================================
 * Top-level conditioner
 * ============================================================ */
export function condition(rawHtml) {
  // v1.2.0 — unknown named entities are collected across the whole run,
  // not per paragraph, so the report is one deduped list.
  const seen = new Set();
  const result = detectDougShape(rawHtml)
    ? conditionDougShape(rawHtml, detectDougShape(rawHtml), seen)
    : conditionFallback(rawHtml, seen);

  result.unknownEntities = Array.from(seen).sort();

  // v1.2.0 — word count guard. Declared comes from the document's own
  // metadata table; extracted is counted off the cleaned output.
  const extracted = countWords(result.html);
  const declared = parseDeclaredWordCount(result.metadata);
  result.wordCount = { extracted, declared, ratio: null };
  result.warning = '';

  if (declared != null && declared > 0) {
    const ratio = extracted / declared;
    result.wordCount.ratio = ratio;
    if (ratio < WORDCOUNT_MIN_RATIO) {
      result.warning =
        'extracted ' + extracted + ' words against ' + declared +
        ' declared (' + ratio.toFixed(2) + ') — body may be incomplete';
    }
  }

  return result;
}

/* The declared count is a free-text cell: "194", "194 words", "~194".
 * Take the first integer and ignore the rest. */
function parseDeclaredWordCount(metadata) {
  if (!metadata || metadata.wordCount == null) return null;
  const m = String(metadata.wordCount).match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function countWords(html) {
  return html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

/* ============================================================
 * Shape detection
 * ============================================================ */
function detectDougShape(html) {
  const tableMatch = html.match(/<table\b[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return null;

  const tableInner = tableMatch[1];
  const hasContentType = /<td[^>]*>\s*Content Type:\s*<\/td>/i.test(tableInner);
  const hasTitle = /<td[^>]*>\s*Title:\s*<\/td>/i.test(tableInner);

  if (!hasTitle && !hasContentType) return null;

  return {
    fullTable: tableMatch[0],
    tableInner,
    tableEnd: tableMatch.index + tableMatch[0].length,
  };
}

/* ============================================================
 * Doug-shape conditioner
 * ============================================================ */
function conditionDougShape(rawHtml, dougShape, seen) {
  const metadata = extractMetadata(dougShape.tableInner, seen);

  let body = rawHtml.slice(dougShape.tableEnd);

  const hrMatch = body.match(/<hr\s*\/?>/i);
  if (hrMatch) body = body.slice(hrMatch.index + hrMatch[0].length);

  body = body.replace(/<\/body\s*>[\s\S]*$/i, '');
  body = body.replace(/<\/html\s*>[\s\S]*$/i, '');

  return { html: normalizeBody(body, seen), metadata, shape: 'doug' };
}

/* ============================================================
 * Metadata extraction
 * ============================================================ */
function extractMetadata(tableInner, seen) {
  const metadata = {};
  const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;

  let rowMatch;
  while ((rowMatch = rowRegex.exec(tableInner)) !== null) {
    const cells = [];
    let cellMatch;
    cellRegex.lastIndex = 0;
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) cells.push(cellMatch[1]);

    if (cells.length >= 2) {
      const rawKey = stripTags(cells[0]).trim();
      const rawValue = decodeEntities(stripTags(cells[1]), seen).trim();

      const key = rawKey.replace(/:\s*$/, '').trim();
      if (!key) continue;
      if (/^article$/i.test(key) && !rawValue) continue;

      metadata[normalizeKey(key)] = rawValue;
    }
  }

  return metadata;
}

function normalizeKey(key) {
  const map = {
    'Content Type': 'contentType',
    'Title': 'title',
    'Subtitle': 'subtitle',
    'By Line': 'byLine',
    'Pull Quote': 'pullQuote',
    'Word Count': 'wordCount',
    'Notes': 'notes',
    'Client': 'client',
    'Agreement #': 'agreement',
  };
  return map[key] || key.toLowerCase().replace(/\s+/g, '_');
}

/* ============================================================
 * Body normalizer
 *
 * Body shapes seen in the wild:
 *   A) <span> body with <br/> line breaks, no block elements at all.
 *                                              Example: Lazy Pierogi
 *   B) <p class="p1"> paragraphs with <p>&nbsp;</p> spacers.
 *                             Example: Pet Corner, Market Volatility
 *   C) <div> per paragraph, which is what every email client emits.
 *                             Example: Titanium Plumbing, Brown Friday
 *   D) <ul>/<ol> lists interleaved with <p>.
 *                     Example: Pumpkin Chocolate Chip Bars (v1.2.0)
 *
 * B, C and D are the same question — where are the block elements — so
 * they take one path. A has no blocks to find and takes the other.
 * ============================================================ */

// Block-level elements that can carry a paragraph of body text.
// Deliberately excludes table/thead/tr/td: the metadata table is already
// lifted out upstream, and a table that reaches here is layout scaffolding
// whose text cleanInline will unwrap anyway.
const BLOCK_TAGS = 'p|div|h1|h2|h3|h4|h5|h6|li|blockquote|dd|dt|pre';

// v1.2.0 — list containers. Scanned like blocks, emitted as list nodes.
const LIST_TAGS = 'ul|ol';

const SCAN_TAGS = BLOCK_TAGS + '|' + LIST_TAGS;

function hasBlockElement(s) {
  return new RegExp('<(' + SCAN_TAGS + ')\\b', 'i').test(s);
}

function normalizeBody(body, seen) {
  let html = body;

  // 1. Strip <head>, <script>, <style>, <iframe>, <object>, <embed>
  html = html.replace(/<head\b[\s\S]*?<\/head>/gi, '');
  html = html.replace(/<(script|style|iframe|object|embed|noscript)\b[\s\S]*?<\/\1>/gi, '');

  // 2. The question is whether the body HAS block elements, not how many
  // <p> it happens to contain. Counting <p> is what let a div-shaped
  // document lose eleven of its thirteen blocks in v1.0.
  const nodes = hasBlockElement(html)
    ? extractNodes(html, 0)
    : extractFromBrSeparated(html).map((t) => ({ kind: 'p', text: t }));

  // 3. Clean, drop empties, render
  return renderNodes(nodes, seen);
}

/* v1.2.0 — render the mixed node stream. Paragraphs become <p>; lists
 * become <ul>/<ol> with their items. A list whose items all clean away
 * to nothing is dropped entirely rather than emitted empty. */
function renderNodes(nodes, seen) {
  const out = [];

  for (const node of nodes) {
    if (node.kind === 'list') {
      const items = node.items
        .map((t) => cleanInline(t, seen))
        .map((t) => t.trim())
        .filter((t) => t.length > 0 && isContentful(t));
      if (!items.length) continue;
      out.push(
        '<' + node.tag + '>' +
        items.map((t) => '<li>' + t + '</li>').join('') +
        '</' + node.tag + '>'
      );
    } else {
      const t = cleanInline(node.text, seen).trim();
      if (!t.length || !isContentful(t)) continue;
      out.push('<p>' + t + '</p>');
    }
  }

  return out.join('\n');
}

/* ------------------------------------------------------------
 * Block walker
 *
 * Splits a fragment into its top-level block elements and the loose
 * text between them, in document order. A block that contains other
 * blocks is unwrapped and recursed into, so a <div> wrapping two <p>
 * contributes its own loose text AND the two paragraphs, once each.
 * A block that contains no other block is a leaf paragraph and is
 * split on <br/><br/>.
 *
 * v1.2.0 — a ul or ol is not recursed into. It becomes one list node
 * holding its items, which is the whole point of the change.
 *
 * MAX_DEPTH guards against a pathological wrapper chain; at the limit
 * the remaining fragment is treated as a leaf, which keeps the text
 * rather than dropping it. Losing formatting beats losing content.
 * ------------------------------------------------------------ */
const MAX_DEPTH = 8;

function extractNodes(fragment, depth) {
  const parts = splitTopLevelBlocks(fragment);
  const out = [];

  // No block found at this level — the fragment itself is the paragraph.
  if (!parts.some((p) => p.type === 'block')) {
    return splitOnDoubleBr(fragment).map((t) => ({ kind: 'p', text: t }));
  }

  for (const part of parts) {
    if (part.type === 'text') {
      // Loose text beside a block still counts: it is the author's
      // sentence, it just was not wrapped.
      for (const t of splitOnDoubleBr(part.raw)) out.push({ kind: 'p', text: t });
    } else if (part.tag === 'ul' || part.tag === 'ol') {
      out.push({ kind: 'list', tag: part.tag, items: listItemsFrom(part.inner, depth) });
    } else if (depth < MAX_DEPTH && hasBlockElement(part.inner)) {
      for (const n of extractNodes(part.inner, depth + 1)) out.push(n);
    } else {
      for (const t of splitOnDoubleBr(part.inner)) out.push({ kind: 'p', text: t });
    }
  }
  return out;
}

/* v1.2.0 — pull the items out of a list container.
 *
 * An <li> is one item; its inner is NOT split on <br/><br/>, because a
 * line break inside a bullet is a line break, not a new bullet.
 *
 * A nested <ul>/<ol> inside an item is FLATTENED into this list's item
 * run. Publisher submissions do not use nested lists, and a wrong
 * nesting is worse than a flat one. Change here if that stops being true.
 *
 * Loose text between items — whitespace, stray markup — is discarded;
 * anything contentful there would be a malformed list and renderNodes
 * drops it at the isContentful filter anyway. */
function listItemsFrom(inner, depth) {
  const items = [];
  for (const part of splitTopLevelBlocks(inner)) {
    if (part.type !== 'block') continue;
    if (part.tag === 'ul' || part.tag === 'ol') {
      if (depth < MAX_DEPTH) {
        for (const t of listItemsFrom(part.inner, depth + 1)) items.push(t);
      }
    } else if (part.tag === 'li') {
      // A nested list inside the item: the item's own text first, then
      // the nested items, all at this level.
      if (depth < MAX_DEPTH && new RegExp('<(' + LIST_TAGS + ')\\b', 'i').test(part.inner)) {
        const sub = splitTopLevelBlocks(part.inner);
        let own = '';
        for (const s of sub) {
          if (s.type === 'text') own += s.raw;
          else if (s.tag !== 'ul' && s.tag !== 'ol') own += s.inner;
        }
        if (own.trim()) items.push(own);
        for (const s of sub) {
          if (s.type === 'block' && (s.tag === 'ul' || s.tag === 'ol')) {
            for (const t of listItemsFrom(s.inner, depth + 1)) items.push(t);
          }
        }
      } else {
        items.push(part.inner);
      }
    } else {
      // A <p> or <div> directly inside a list, which sloppy editors emit.
      // Treat it as an item rather than losing it.
      items.push(part.inner);
    }
  }
  return items;
}

/* Scan a fragment for its TOP-LEVEL block elements, skipping over the
 * contents of each one so nested blocks are not emitted twice. Returns
 * an ordered list of {type:'text', raw} and {type:'block', tag, inner}. */
function splitTopLevelBlocks(fragment) {
  const openRe = new RegExp('<(' + SCAN_TAGS + ')\\b[^>]*>', 'gi');
  const out = [];
  let pos = 0;
  let m;

  while ((m = openRe.exec(fragment)) !== null) {
    const tag = m[1].toLowerCase();
    const openEnd = m.index + m[0].length;
    const close = findMatchingClose(fragment, tag, openEnd);

    if (m.index > pos) out.push({ type: 'text', raw: fragment.slice(pos, m.index) });

    if (close) {
      out.push({ type: 'block', tag, inner: fragment.slice(openEnd, close.start) });
      pos = close.end;
    } else {
      // Unclosed block — common with <p> and <li> from sloppy editors.
      // v1.2.0: it ends at the next sibling of the same tag, which is
      // what the HTML parser itself does, and only runs to the end of
      // the fragment if there is no sibling. v1.1.0 always took the
      // rest, so "<li>One<li>Two" collapsed into a single item.
      const sibRe = new RegExp('<' + tag + '\\b[^>]*>', 'gi');
      sibRe.lastIndex = openEnd;
      const sib = sibRe.exec(fragment);
      const end = sib ? sib.index : fragment.length;
      out.push({ type: 'block', tag, inner: fragment.slice(openEnd, end) });
      pos = end;
    }
    openRe.lastIndex = pos;
  }

  if (pos < fragment.length) out.push({ type: 'text', raw: fragment.slice(pos) });
  return out;
}

/* Depth-counting close finder, so <div><div>x</div></div> matches the
 * OUTER close and the inner one is handled by the recursion instead. */
function findMatchingClose(s, tag, from) {
  const re = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'gi');
  re.lastIndex = from;
  let depth = 1;
  let m;
  while ((m = re.exec(s)) !== null) {
    if (m[1] === '/') {
      depth--;
      if (depth === 0) return { start: m.index, end: m.index + m[0].length };
    } else {
      depth++;
    }
  }
  return null;
}

/* A leaf block's inner content: drop trailing <br/> runs, then split on
 * <br/><br/> — authors routinely write several paragraphs inside one
 * block and separate them with a blank line. */
function splitOnDoubleBr(inner) {
  const trimmed = inner.replace(/(<br\s*\/?>\s*)+$/i, '');
  return trimmed.split(/<br\s*\/?>\s*<br\s*\/?>/gi);
}

/* ------------------------------------------------------------
 * Shape A — a body that uses <br/> line breaks inside a single
 * <span> or directly in <body>, with no block elements anywhere.
 * ------------------------------------------------------------ */
function extractFromBrSeparated(html) {
  let inner = html
    .replace(/<\/?body\b[^>]*>/gi, '')
    .replace(/^\s*<span\b[^>]*>/i, '')
    .replace(/<\/span>\s*$/i, '');

  const chunks = inner.split(/<br\s*\/?>\s*<br\s*\/?>/gi);
  return chunks.map((c) => c.replace(/<br\s*\/?>/gi, ' '));
}

/* ============================================================
 * Inline cleaner — runs on each paragraph and each list item
 *
 * Allowed inline tags: <strong>, <em>, <a href>, <br>
 * Everything else gets unwrapped (inner text kept, tag removed).
 * ============================================================ */
function cleanInline(p, seen) {
  let s = p;

  // 1. Decode HTML entities
  s = decodeEntities(s, seen);

  // 2. Strip Apple-converted-space wrappers
  s = s.replace(/<span\s+class="Apple-converted-space"[^>]*>([\s\S]*?)<\/span>/gi, ' ');

  // 3. Strip any remaining <span> tags but keep inner content. This also
  //    removes yellow-highlight spans, which are publisher annotations
  //    rather than body content — the text stays, the highlight does not.
  s = s.replace(/<\/?span\b[^>]*>/gi, '');

  // 4. Strip <font> tags but keep inner content
  s = s.replace(/<\/?font\b[^>]*>/gi, '');

  // 5. Strip structural wrappers but keep inner text (in case any leak)
  s = s.replace(/<\/?(div|section|article|header|footer|aside|main|nav)\b[^>]*>/gi, '');

  // 6. Convert <b> → <strong>, <i> → <em>
  s = s.replace(/<b\b[^>]*>/gi, '<strong>').replace(/<\/b>/gi, '</strong>');
  s = s.replace(/<i\b[^>]*>/gi, '<em>').replace(/<\/i>/gi, '</em>');

  // 7. Sanitize <a> tags — keep href, drop other attributes
  s = s.replace(/<a\b([^>]*)>/gi, (_, attrs) => {
    const hrefMatch = attrs.match(/\bhref\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i);
    if (!hrefMatch) return ''; // anchor with no href is meaningless
    let href = hrefMatch[1].replace(/^["']|["']$/g, '');
    if (/^javascript:/i.test(href)) return '';
    return `<a href="${escapeAttr(href)}">`;
  });

  // 8. Strip any remaining tags not in the safe list.
  //    A single <br/> inside a leaf block is a line break the author
  //    meant — the bold lead-in followed by its sentence, for instance.
  s = s.replace(/<(?!\/?(strong|em|a|br)\b)[^>]+>/gi, '');

  // 9. Balance the inline tags. Splitting a block on <br/><br/> can cut
  //    between an opening tag and its closer, because authors put the
  //    blank line INSIDE the emphasis. Unclosed emphasis bleeds into
  //    everything after it in Webflow RT.
  s = balanceInline(s);

  // 10. Collapse whitespace runs
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/* Close what this paragraph opened, drop what it never opened. Walks
   strong / em / a in order against a stack: an unmatched closer is
   dropped, and anything still open at the end is closed. */
function balanceInline(s) {
  const stack = [];
  const out = [];
  const re = /<(\/?)(strong|em|a)\b[^>]*>/gi;
  let last = 0;
  let m;

  while ((m = re.exec(s)) !== null) {
    out.push(s.slice(last, m.index));
    const isClose = m[1] === '/';
    const tag = m[2].toLowerCase();

    if (!isClose) {
      stack.push(tag);
      out.push(m[0]);
    } else {
      const at = stack.lastIndexOf(tag);
      if (at !== -1) {
        // Close anything opened inside it first, so nesting stays legal.
        while (stack.length > at + 1) out.push('</' + stack.pop() + '>');
        stack.pop();
        out.push('</' + tag + '>');
      }
      // at === -1: orphan closer, drop it.
    }
    last = m.index + m[0].length;
  }

  out.push(s.slice(last));
  while (stack.length) out.push('</' + stack.pop() + '>');
  return out.join('');
}

/* ============================================================
 * Filters
 * ============================================================ */
function isContentful(p) {
  const stripped = p.replace(/<[^>]+>/g, '').replace(/\s|\u00A0/g, '');
  return stripped.length > 0;
}

/* ============================================================
 * Fallback conditioner
 * ============================================================ */
function conditionFallback(rawHtml, seen) {
  const bodyMatch = rawHtml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : rawHtml;
  return { html: normalizeBody(body, seen), metadata: {}, shape: 'fallback' };
}

/* ============================================================
 * Helpers
 * ============================================================ */
function stripTags(s) {
  return s.replace(/<[^>]+>/g, '');
}

/* v1.2.0 — the named table now covers the HTML4 set that appears in
 * body copy. An unrecognised name is passed through untouched and
 * recorded in `seen` so the response can report it. */
const NAMED_ENTITIES = {
  // structural / punctuation
  nbsp: '\u00A0', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  mdash: '\u2014', ndash: '\u2013', lsquo: '\u2018', rsquo: '\u2019',
  ldquo: '\u201C', rdquo: '\u201D', sbquo: '\u201A', bdquo: '\u201E',
  hellip: '\u2026', bull: '\u2022', middot: '\u00B7', dagger: '\u2020',
  Dagger: '\u2021', permil: '\u2030', prime: '\u2032', Prime: '\u2033',
  lsaquo: '\u2039', rsaquo: '\u203A', laquo: '\u00AB', raquo: '\u00BB',
  oline: '\u203E', frasl: '\u2044', shy: '\u00AD', brvbar: '\u00A6',
  sect: '\u00A7', para: '\u00B6', uml: '\u00A8', macr: '\u00AF',
  acute: '\u00B4', cedil: '\u00B8', ordf: '\u00AA', ordm: '\u00BA',
  iexcl: '\u00A1', iquest: '\u00BF', not: '\u00AC',

  // marks and currency
  copy: '\u00A9', reg: '\u00AE', trade: '\u2122',
  cent: '\u00A2', pound: '\u00A3', curren: '\u00A4', yen: '\u00A5',
  euro: '\u20AC',

  // v1.2.0 — fractions. The Recipe file's &frac12; / &frac34; are why
  // this whole table got rewritten.
  frac14: '\u00BC', frac12: '\u00BD', frac34: '\u00BE',

  // maths, superscripts, arrows
  deg: '\u00B0', plusmn: '\u00B1', times: '\u00D7', divide: '\u00F7',
  minus: '\u2212', ne: '\u2260', le: '\u2264', ge: '\u2265',
  asymp: '\u2248', equiv: '\u2261', infin: '\u221E', radic: '\u221A',
  sup1: '\u00B9', sup2: '\u00B2', sup3: '\u00B3', micro: '\u00B5',
  larr: '\u2190', uarr: '\u2191', rarr: '\u2192', darr: '\u2193',
  harr: '\u2194',

  // Latin-1 lowercase
  aacute: '\u00E1', agrave: '\u00E0', acirc: '\u00E2', atilde: '\u00E3',
  auml: '\u00E4', aring: '\u00E5', aelig: '\u00E6',
  ccedil: '\u00E7',
  eacute: '\u00E9', egrave: '\u00E8', ecirc: '\u00EA', euml: '\u00EB',
  iacute: '\u00ED', igrave: '\u00EC', icirc: '\u00EE', iuml: '\u00EF',
  ntilde: '\u00F1',
  oacute: '\u00F3', ograve: '\u00F2', ocirc: '\u00F4', otilde: '\u00F5',
  ouml: '\u00F6', oslash: '\u00F8', oelig: '\u0153',
  uacute: '\u00FA', ugrave: '\u00F9', ucirc: '\u00FB', uuml: '\u00FC',
  yacute: '\u00FD', yuml: '\u00FF',
  eth: '\u00F0', thorn: '\u00FE', szlig: '\u00DF', scaron: '\u0161',

  // Latin-1 uppercase
  Aacute: '\u00C1', Agrave: '\u00C0', Acirc: '\u00C2', Atilde: '\u00C3',
  Auml: '\u00C4', Aring: '\u00C5', AElig: '\u00C6',
  Ccedil: '\u00C7',
  Eacute: '\u00C9', Egrave: '\u00C8', Ecirc: '\u00CA', Euml: '\u00CB',
  Iacute: '\u00CD', Igrave: '\u00CC', Icirc: '\u00CE', Iuml: '\u00CF',
  Ntilde: '\u00D1',
  Oacute: '\u00D3', Ograve: '\u00D2', Ocirc: '\u00D4', Otilde: '\u00D5',
  Ouml: '\u00D6', Oslash: '\u00D8', OElig: '\u0152',
  Uacute: '\u00DA', Ugrave: '\u00D9', Ucirc: '\u00DB', Uuml: '\u00DC',
  Yacute: '\u00DD', Yuml: '\u0178',
  ETH: '\u00D0', THORN: '\u00DE', Scaron: '\u0160',
};

export function decodeEntities(s, seen) {
  // Named entities. An unrecognised name is left exactly as written —
  // passing the text through unchanged is always safer than guessing —
  // and recorded so the response can report it.
  s = s.replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (whole, name) => {
    if (NAMED_ENTITIES[name] != null) return NAMED_ENTITIES[name];
    if (seen) seen.add(name);
    return whole;
  });

  // Numeric entities (&#1234; or &#x1A;)
  s = s.replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)));
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));

  return s;
}

function escapeAttr(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
