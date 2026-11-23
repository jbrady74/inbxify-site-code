/* ix-transcribe-v1.1.3.js
   ════════════════════════════════════════════════════════════════
   INBXIFY · ix-transcribe — the Transcriber engine, shared
   ── v1.1.3 (22 Nov 2026, TA Reskin S1 · Compare with print) — THE READING RULES PANEL IN THE PORTAL LOOK ──
   Look only, from the approved S1 board, plus one control the board adds:
     · White panel, a hairline, square corners; "Reading rules" in Newsreader 18; each rule's label in small
       capitals ABOVE its options; options as small square buttons, the chosen one ink; Sen throughout.
     · A changed rule keeps the gold edge and now gets its own Cancel beside its label, which puts back that
       rule only (the board). The panel's own "cancel" at the top right is unchanged and still undoes all.
     · The page strip and the preview keep their behaviour; colours move to the ix tokens.
     · The panel's CSS is now scoped to .ixt-panel. Before, rules like .ixt-row and .ixt-card were page-wide
       and reached any other element with those names (ix-table v1.0.0's rows turned into a grid on TA Studio).
   Nothing about reading changes: read(), readPdf(), the prompts, the rules saved per place, the callbacks.
   ── v1.1.2 (18 Nov 2026, Content Home S12) — "ADD HEADERS" ADDS HEADERS ──
   Jeff (18 Nov, retest on "Meet the Rojas Family"): Headers = Add headers
   only if the source has none, and the body came back with none. The
   reader was left to decide what counts as a section header, and took the
   kicker, the deck, the pull quotes or a recipe name as one, so it added
   nothing.
     · The prompt now says exactly what a section header is (a heading
       inside the body that divides it into sections) and what is NOT one:
       the headline, kicker or section label ("Our Neighbors"), deck,
       byline, captions, pull quotes, a recipe name, a numbered item's own
       heading.
     · With Add, a body longer than 6 paragraphs with no section header
       MUST get them: one before each new topic, at least one per 6
       paragraphs, only between units.
     · If Add was chosen, the body is long and still has no header, read()
       returns headersMissing: true so the caller can say so (Create from
       print and Re-read show it; nothing is added quietly by anyone else).
   HARDCODING: HC-IXT-8 "long" means more than 6 paragraphs (the same
   number as the header spacing).
   ── v1.1.1 (18 Nov 2026, Content Home S12) — A PAGE PICKER YOU CAN SEE;
      THE READER SAYS WHEN THE ARTICLE GOES ON ──
   Jeff (18 Nov, Test 1 and Re-read): there was no way to know which
   pages to choose (View pages opened a viewer behind the palette); "+ add
   a page" was cramped and only ever added page 1; From/To and add-a-page
   did the same job twice. Re-read of a long article stopped mid-sentence
   at the end of the one page it was given, with no warning.
     · PAGES is one picker: a strip of the issue's pages as cards (one
       page before the print item's first page and five after; Earlier
       pages / Later pages extend it). Click a card to read that page or
       leave it out; chosen pages have the gold edge and their reading
       order. View on a card shows that page large inside the panel, with
       Read this page / Leave this page out. From/To, + add a page and
       View pages (the viewer behind the palette) are gone.
     · The reader now answers <continues>: yes when the article does not
       end on the pages given. read() returns continues: true, and the
       callers say so and offer the next page (panel.addPage,
       panel.message).
     · Subtitle is only a short deck printed under the headline (the
       reader had put an opening paragraph there, 160 of 60).
   HARDCODING: HC-IXT-6 the strip opens one page before and five after,
   and grows six at a time; HC-IXT-7 the preview is drawn 1000 px wide;
   HC-IXT-4 thumbnails now drawn 280 px wide (was 160).
   ── v1.1.0 (17 Nov 2026, Content Home S12) — READING RULES THE USER SETS ──
   Jeff (17 Nov): one engine, two modes, and the user sets the rules after
   pasting or picking the source. The existing transcribers handled
   recipes and steps badly and put generated headers in the wrong places
   (between "1. Heading" and its text, or next to headers the source
   already had).
     · FIXED RULES (always on, in the prompt): a unit is never split
       (question + answer, numbered heading + its text, a recipe, a step
       and its sub-points); numbered items with their own headline come
       out as <h3>N. Heading</h3> + text in the source's numbering;
       recipes as name, yield/times line, ingredients <ul> exactly as
       printed, method <ol> one step each, notes after; steps <ol> with
       nested sub-points; the source's own headers kept, never added to;
       nothing summarised or cut; page furniture left out.
     · READING RULES PANEL (IxTranscribe.panel): Kind (Let the reader
       decide · Article · Recipe · Steps / how-to · Q&A · Numbered list),
       Headers (As printed only · Add headers only if the source has
       none), Fields (Everything · Body only), and for print, Pages (a
       printed range shown with its PDF pages and thumbnails, + add a page,
       View pages). A changed choice has the gold border until Read; the
       cancel link puts the choices back. Choices are remembered per place
       (light browser storage; Pages is never remembered).
     · PAGES: printed page numbers are turned into PDF pages with the
       print item's own pair (stored PDF page minus printed page), the
       same pair the Allocator's page button uses. Any number of pages,
       read as one article in the order listed.
     · LENGTH: 8,000 output tokens, 16,000 when more than two pages are
       read. If the reader still runs out, the result carries
       truncated: true and the caller must say so; nothing is dropped
       quietly.
   Replaces v1.0.0 (whose prompt was the Transcriber prompt word for word).

   API
     IxTranscribe.read({ images:[{mime,base64}], rules:{kind,headers,fields},
                         focus, pageText, proxyUrl })
       → Promise<{ title, subtitle, writername, writertitle, cowritername,
                   cowritertitle, teaser, shortsummary, body, truncated }>
     IxTranscribe.readPdf({ url, pages:[pdf page numbers], rules, focus })
       → same; draws the pages (ix-pdf-pager) and adds their text layer.
     IxTranscribe.panel({ place, defaults, pdf:{ url, pdfPage, page,
                          issuePages, title }, readLabel, onRead(rules),
                          onCancel() })
       → { mount(el), rules(), busy(on, words), version }
         rules() = { kind, headers, fields, pages:[pdf pages], pagesLabel }
     IxTranscribe.fromDataUrl(dataUrl) → { mime, base64 }

   HARDCODING: HC-IXT-1 the model, claude-opus-4-5; HC-IXT-2 output caps
   8,000 / 16,000 tokens; HC-IXT-3 page draw width 1600 px (the width the
   Asset Form's Re-read used, HC-P-CFP-12); HC-IXT-4 thumbnail width
   160 px; HC-IXT-5 the panel's choice words and their order.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.IxTranscribe && window.IxTranscribe.version >= '1.1.2') return;
  var VERSION = '1.1.3';
  var TAG = '[ix-transcribe v' + VERSION + ']';
  var MODEL = 'claude-opus-4-5';            /* HC-IXT-1 */
  var CAP = 8000, CAP_LONG = 16000;         /* HC-IXT-2 */
  var READ_W = 1600;                        /* HC-IXT-3 */

  var SYSTEM = "You are an expert article transcriber and editor for a local community newsletter publishing platform.\n\nReturn your response using XML tags, one tag per field. Do not use JSON. Do not add any text outside the tags.\n\nUse exactly these tags:\n<title>Article headline</title>\n<subtitle>Sub-title: only a short deck printed directly under the headline, else leave empty</subtitle>\n<writername>Primary writer name if visible, else leave empty</writername>\n<writertitle>Primary writer title/role if visible, else leave empty</writertitle>\n<cowritername>Co-writer name if visible, else leave empty</cowritername>\n<cowritertitle>Co-writer title if visible, else leave empty</cowritertitle>\n<teaser>Newsletter teaser here</teaser>\n<shortsummary>Short summary here</shortsummary>\n<body>Full article HTML here</body>\n<continues>yes or no</continues>\n\nTEASER RULES:\n- Target length: 350–400 characters. Write enough to fill this range.\n- Minimum: 300 characters. If under 300, expand with a compelling detail.\n- Maximum: 400 characters hard limit.\n- Write a complete, engaging teaser. No truncation, no ellipsis.\n\nSHORT SUMMARY RULES:\n- Target length: 120–150 characters. Write to fill this range.\n- Minimum: 100 characters. If under 100, add a key detail.\n- Maximum: 150 characters hard limit.\n\nBODY RULES (always apply):\n- Transcribe the article text exactly and completely, in reading order across columns and pages. Do not summarise, shorten, reword or cut anything.\n- Leave out page furniture: running heads, page numbers, \"continued on page\" lines, photo captions, photo credits and ads. The headline, subtitle and byline go in their own tags, not in the body.\n- UNITS. These are units: a question and its answer; a numbered or lettered item with its own headline and the text under it; a whole recipe (name, yield and times, ingredients, method, notes); a step and its sub-points. A unit is NEVER split. Nothing, including any header, ever goes inside a unit or between its parts.\n- SOURCE HEADERS: keep every section header the source shows, exactly as worded, as <h2 class=\"sct-transcribed\">Header</h2>. Never change, merge or move them.\n- NUMBERED ITEMS WITH THEIR OWN HEADLINE (for example \"1. Prep the beds\" followed by a paragraph): write <h3 class=\"sct-transcribed\">1. Prep the beds</h3> followed by that item's paragraphs. Keep the source's own numbering or lettering. Do NOT turn these into an <ol>.\n- RECIPES: for each recipe, <h3 class=\"sct-transcribed\">Recipe name</h3>; yield, servings and times as one <p><em>...</em></p>; ingredients as <ul><li>, one ingredient per item, quantities and units exactly as printed; ingredient sub-groups (\"For the dressing\") as <p><strong>For the dressing</strong></p> before their own <ul>; the method as <ol><li>, one step per item; notes or tips as <p> after the method. Two recipes are two separate blocks.\n- STEPS AND HOW-TO: <ol><li>, one step per item, in order. A step's sub-points go in a <ul> nested inside that step's <li>.\n- QUESTION AND ANSWER: each question in its own <p><strong>...</strong></p>, its answer in the <p> elements directly after it.\n- Other lists: <ul><li> for bullets, <ol><li> for numbered lists. Paragraphs in <p>.\n- No inline styles, no wrapper divs, no images. Start directly with content.\n\nCONTINUES: write yes when the article does not end on the pages given: its last sentence is cut off, or a line says it continues on another page. Otherwise write no.\n\nIf a field is not visible or not applicable, leave its tag empty. Never omit a tag.";

  var TAGS = ['title', 'subtitle', 'writername', 'writertitle', 'cowritername',
              'cowritertitle', 'teaser', 'shortsummary', 'body', 'continues'];

  /* HC-IXT-5 — the panel's choices, in order. */
  var CHOICES = {
    kind: [['auto', 'Let the reader decide'], ['article', 'Article'], ['recipe', 'Recipe'],
           ['steps', 'Steps / how-to'], ['qa', 'Q&A'], ['numbered', 'Numbered list']],
    headers: [['print', 'As printed only'], ['add', 'Add headers only if the source has none']],
    fields: [['all', 'Everything'], ['body', 'Body only']]
  };
  var KIND_WORDS = {
    auto: 'KIND: decide the shape from the source. A mixed piece (an article with a recipe in it, say) gets each part in its own shape.',
    article: 'KIND: this is an article. Use paragraphs, keep any lists, Q&A or numbered items it contains in their own shapes.',
    recipe: 'KIND: this is a recipe (or recipes). Use the RECIPES shape for each recipe. Any introduction is paragraphs before the first recipe.',
    steps: 'KIND: this is a set of steps or a how-to. Use the STEPS shape. Any introduction is paragraphs before the steps.',
    qa: 'KIND: this is a question-and-answer piece. Use the Q&A shape for every question. Any introduction is paragraphs before the first question.',
    numbered: 'KIND: this is a numbered list of items, each with its own headline and text. Use the NUMBERED ITEMS shape for every item.'
  };
  var HEADER_WORDS = {
    print: 'HEADERS: add no header the source does not show.',
    add: 'HEADERS: a section header is a heading INSIDE the article body that divides it into sections. These are NOT section headers: the headline, a kicker or section label above it (for example "Our Neighbors"), the deck or subtitle, the byline, photo captions, pull quotes, a recipe name, a numbered item\u2019s own heading. If the body has no section header and runs longer than 6 paragraphs, you MUST add <h2 class="sct-generated">Header</h2> headers: a short header before each new topic, at least one for every 6 paragraphs, only BETWEEN units, never inside a unit, never directly before a numbered heading or a recipe name. If the body already has section headers, keep them and add none.'
  };

  function cleanRules(r) {
    r = r || {};
    var out = {};
    ['kind', 'headers', 'fields'].forEach(function (k) {
      var ok = CHOICES[k].some(function (c) { return c[0] === r[k]; });
      out[k] = ok ? r[k] : CHOICES[k][0][0];
    });
    return out;
  }

  function userText(n, rules, focus, pageText) {
    var t = n > 1
      ? 'This article spans ' + n + ' pages, given in reading order. Treat them as one continuous article. Transcribe it now.'
      : 'Transcribe this article now.';
    t += '\n\n' + KIND_WORDS[rules.kind] + '\n' + HEADER_WORDS[rules.headers];
    if (rules.fields === 'body') t += '\nFIELDS: fill ONLY <body>. Leave every other tag empty.';
    if (focus) t += '\n\nThe page may hold more than one item. Transcribe ONLY the article headed “' + focus +
      '” (the headline may differ slightly on the page). Leave out every other article, ad, caption and page furniture. If that article is not on these pages, return every tag empty.';
    if (pageText) t += '\n\nThe pages’ own text layer follows. Use it only to spell names, numbers and words exactly; take the article’s text and order from the images.\n<pagetext>\n' + pageText + '\n</pagetext>';
    return t;
  }

  function extract(raw, tag) {
    var m = raw.match(new RegExp('<' + tag + '>([\\s\\S]*?)<\\/' + tag + '>'));
    if (m) return m[1].trim();
    // An answer cut off by the length cap leaves <body> open: keep what came.
    var open = raw.indexOf('<' + tag + '>');
    return (tag === 'body' && open >= 0) ? raw.slice(open + tag.length + 2).trim() : '';
  }

  function read(o) {
    o = o || {};
    var proxy = o.proxyUrl || (window.TA_CONFIG && window.TA_CONFIG.anthropicProxy) || '';
    if (!proxy) return Promise.reject(new Error('the AI is not set up on this page (no TA_CONFIG.anthropicProxy), so nothing was read'));
    var imgs = (o.images || []).filter(function (i) { return i && i.base64; });
    if (!imgs.length) return Promise.reject(new Error('there is no picture to read'));
    var rules = cleanRules(o.rules);
    var content = imgs.map(function (img) {
      return { type: 'image', source: { type: 'base64', media_type: img.mime || 'image/jpeg', data: img.base64 } };
    });
    content.push({ type: 'text', text: userText(imgs.length, rules, String(o.focus || '').trim(), String(o.pageText || '').trim()) });
    return fetch(proxy, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: imgs.length > 2 ? CAP_LONG : CAP, system: SYSTEM,
                             messages: [{ role: 'user', content: content }] })
    }).then(function (res) {
      return res.text().then(function (t) {
        var data; try { data = JSON.parse(t); } catch (e) { throw new Error('the AI did not answer in JSON (HTTP ' + res.status + '), so nothing was read'); }
        if (!res.ok) throw new Error(((data && data.error && (data.error.message || data.error)) || ('the AI answered HTTP ' + res.status)) + ', so nothing was read');
        var raw = ((data.content || []).filter(function (b) { return b.type === 'text'; })[0] || {}).text || '';
        if (!raw) throw new Error('the AI answered with no text, so nothing was read');
        var out = {};
        TAGS.forEach(function (tag) { out[tag] = extract(raw, tag); });
        out.continues = /^\s*yes/i.test(out.continues || '');   // v1.1.1
        // v1.1.2 — Add was chosen, the body is long, and it still has no section header.
        var paras = (out.body.match(/<p[\s>]/gi) || []).length;
        out.headersMissing = rules.headers === 'add' && paras > 6 && !/<h2[\s>]/i.test(out.body);   /* HC-IXT-8 */
        if (rules.fields === 'body') TAGS.forEach(function (tag) { if (tag !== 'body' && tag !== 'continues') out[tag] = ''; });
        out.truncated = data.stop_reason === 'max_tokens';
        return out;
      });
    });
  }

  function fromDataUrl(u) {
    var m = String(u || '').match(/^data:([^;]+);base64,(.*)$/);
    return m ? { mime: m[1], base64: m[2] } : null;
  }

  function readPdf(o) {
    o = o || {};
    var P = window.IxPdfPager;
    if (!P || typeof P.render !== 'function') return Promise.reject(new Error('the PDF viewer (ix-pdf-pager) is not on this page'));
    var pages = (o.pages || []).filter(function (n) { return n > 0; });
    if (!o.url) return Promise.reject(new Error('there is no stored PDF to read'));
    if (!pages.length) return Promise.reject(new Error('no pages are chosen'));
    return Promise.all(pages.map(function (n) { return P.render(o.url, n, READ_W); })).then(function (urls) {
      var images = urls.map(fromDataUrl);
      images.forEach(function (im, i) { if (!im) throw new Error('PDF page ' + pages[i] + ' could not be drawn'); });
      var texts = typeof P.text === 'function'
        ? Promise.all(pages.map(function (n) { return P.text(o.url, n).catch(function () { return null; }); }))
        : Promise.resolve([]);
      return texts.then(function (ts) {
        var words = (ts || []).map(function (t, i) {
          return (t && t.method === 'pdf') ? '[page ' + (i + 1) + ']\n' + t.runs.map(function (r) { return r.str; }).join(' ') : '';
        }).filter(Boolean).join('\n\n');
        return read({ images: images, rules: o.rules, focus: o.focus, pageText: words, proxyUrl: o.proxyUrl });
      });
    });
  }

  /* ── pages: printed numbers ↔ PDF pages ───────────────────── */
  function printedRange(page) {
    var m = String(page == null ? '' : page).match(/^\s*(\d+)\s*(?:[-–—]\s*(\d+))?/);
    if (!m) return null;
    var a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
    return b >= a ? [a, b] : [a, a];
  }
  function pageModel(pdf) {
    var pr = printedRange(pdf.page), start = Number(pdf.pdfPage) || 0;
    var known = !!(pr && start);
    var offset = known ? start - pr[0] : 0;
    var max = Number(pdf.issuePages) || 0;
    var list = [];
    if (known) { for (var p = pr[0]; p <= pr[1]; p++) list.push(p + offset); }
    else if (start) list.push(start);
    else if (pr) list.push(pr[0]);
    return { known: known, offset: offset, max: max, pdfPages: list };
  }

  /* ── the panel ───────────────────────────────────────────── */
  var STORE = 'ixTranscribeRules:';
  function loadRules(place) { try { var v = window.localStorage.getItem(STORE + place); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function saveRules(place, r) { try { window.localStorage.setItem(STORE + place, JSON.stringify({ kind: r.kind, headers: r.headers, fields: r.fields })); } catch (e) {} }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function css() {
    if (document.getElementById('ixt-css')) return;
    var s = document.createElement('style'); s.id = 'ixt-css';
    s.textContent =
      '.ixt-panel{border:1px solid var(--ix-border);border-radius:0;background:var(--ix-white);padding:16px 18px;font-family:var(--ix-font-body);font-size:var(--ix-fs-13);line-height:1.4;color:var(--ix-text-dark);text-align:left}' +
      '.ixt-panel *{box-sizing:border-box}' +
      '.ixt-panel .ixt-head{display:flex;align-items:baseline;gap:10px;margin-bottom:12px}' +
      '.ixt-panel .ixt-title{font-family:var(--ix-font-display);font-weight:600;font-size:var(--ix-fs-18);line-height:1.2;color:var(--ix-text-dark)}' +
      '.ixt-panel .ixt-sp{flex:1}' +
      '.ixt-panel .ixt-row{display:block;margin:0 0 12px}' +
      '.ixt-panel .ixt-row>*{min-width:0}' +
      '.ixt-panel .ixt-lab{display:flex;align-items:center;gap:10px;height:18px;margin-bottom:5px;font-family:var(--ix-font-caps);font-size:var(--ix-fs-11);font-weight:600;letter-spacing:1.6px;text-transform:uppercase;line-height:1;color:var(--ix-text-light)}' +
      '.ixt-panel .ixt-undo{background:none;border:0;padding:0;font-family:var(--ix-font-body);font-size:var(--ix-fs-12);letter-spacing:0;text-transform:none;color:var(--ix-text-light);text-decoration:underline;cursor:pointer}' +
      '.ixt-panel .ixt-opts{display:flex;flex-wrap:wrap;gap:6px}' +
      '.ixt-panel .ixt-opt{height:28px;padding:0 10px;border:1px solid var(--ix-border);background:var(--ix-white);border-radius:var(--ix-radius-sm);font-family:var(--ix-font-body);font-size:var(--ix-fs-12-5);font-weight:400;line-height:1;white-space:nowrap;cursor:pointer;color:var(--ix-text-dark)}' +
      '.ixt-panel .ixt-opt:hover{border-color:var(--ix-hair)}' +
      '.ixt-panel .ixt-opt.is-on{background:var(--ix-text-dark);border-color:var(--ix-text-dark);color:var(--ix-cream);font-weight:600}' +
      '.ixt-panel .ixt-opt[disabled]{cursor:default;opacity:.6}' +
      '.ixt-panel .ixt-opts.ixt-changed{display:inline-flex;outline:1px solid var(--ix-changed-border);outline-offset:4px;box-shadow:0 0 0 6px var(--ix-changed-shadow)}' +
      '.ixt-panel .ixt-pick{padding:10px;background:var(--ix-cream)}' +
      '.ixt-panel .ixt-pick.ixt-changed{outline:1px solid var(--ix-changed-border);outline-offset:2px;box-shadow:0 0 0 4px var(--ix-changed-shadow)}' +
      '.ixt-panel .ixt-pick-top{display:flex;align-items:center;gap:12px;margin-bottom:10px;font-size:var(--ix-fs-12-5);color:var(--ix-text-light)}' +
      '.ixt-panel .ixt-pick-top b{color:var(--ix-text-dark)}' +
      '.ixt-panel .ixt-strip{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 8px}' +
      '.ixt-panel .ixt-card{position:relative;flex:0 0 112px;border:1px solid var(--ix-border);background:var(--ix-white);padding:5px;cursor:pointer;text-align:center}' +
      '.ixt-panel .ixt-card:hover{border-color:var(--ix-hair)}' +
      '.ixt-panel .ixt-card.is-on{border-color:var(--ix-changed-border);box-shadow:0 0 0 2px var(--ix-changed-border)}' +
      '.ixt-panel .ixt-card img,.ixt-panel .ixt-card .ixt-ph{display:block;width:100%;height:144px;object-fit:contain;background:var(--ix-cream-deep)}' +
      '.ixt-panel .ixt-card .ixt-num{margin-top:5px;font-size:var(--ix-fs-12);font-weight:600;font-variant-numeric:tabular-nums}' +
      '.ixt-panel .ixt-card .ixt-sub{font-size:var(--ix-fs-11);color:var(--ix-text-light)}' +
      '.ixt-panel .ixt-card .ixt-badge{position:absolute;top:9px;left:9px;min-width:20px;height:20px;border-radius:10px;background:var(--ix-text-dark);color:var(--ix-cream);font-size:var(--ix-fs-11);font-weight:700;line-height:20px;padding:0 6px}' +
      '.ixt-panel .ixt-card .ixt-zoom{position:absolute;top:9px;right:9px;border:1px solid var(--ix-border);background:var(--ix-white);border-radius:var(--ix-radius-sm);padding:2px 6px;font-family:var(--ix-font-body);font-size:var(--ix-fs-11);color:var(--ix-text-dark);cursor:pointer}' +
      '.ixt-panel .ixt-more{flex:0 0 88px;border:1px dashed var(--ix-hair);background:none;font-family:var(--ix-font-body);font-size:var(--ix-fs-12);color:var(--ix-text-light);cursor:pointer}' +
      '.ixt-panel .ixt-prev{margin-top:10px;border:1px solid var(--ix-border);background:var(--ix-white);padding:10px}' +
      '.ixt-panel .ixt-prev-top{display:flex;align-items:center;gap:12px;margin-bottom:8px;font-size:var(--ix-fs-13)}' +
      '.ixt-panel .ixt-prev img,.ixt-panel .ixt-prev .ixt-ph{display:block;max-width:100%;width:760px;min-height:240px;margin:0 auto;background:var(--ix-cream-deep)}' +
      '.ixt-panel .ixt-note{color:var(--ix-warn);font-size:var(--ix-fs-12-5);margin-top:8px}' +
      '.ixt-panel .ixt-msg{margin:10px 0 0;padding:10px 12px;background:var(--ix-warn-pale);border:1px solid var(--ix-changed-border);color:var(--ix-warn);font-size:var(--ix-fs-12-5)}' +
      '.ixt-panel .ixt-foot{display:flex;align-items:center;gap:12px;margin-top:4px}' +
      '.ixt-panel .ixt-busy{color:var(--ix-text-light);font-size:var(--ix-fs-12-5)}' +
      '.ixt-panel .ixt-link{background:none;border:0;padding:0;color:var(--ix-text-light);text-decoration:underline;cursor:pointer;font-family:var(--ix-font-body);font-size:var(--ix-fs-12)}';
    document.head.appendChild(s);
  }

  var STRIP_BEFORE = 1, STRIP_AFTER = 5, STRIP_STEP = 6;   /* HC-IXT-6: the strip opens one page before and five after */
  var PREVIEW_W = 1000;                                      /* HC-IXT-7: the in-panel preview's draw width */

  function panel(o) {
    o = o || {};
    css();
    var place = String(o.place || 'default');
    var start = cleanRules(Object.assign({}, o.defaults || {}, loadRules(place) || {}));
    var cur = Object.assign({}, start);
    var pdf = o.pdf || null;
    var pm = pdf ? pageModel(pdf) : null;
    var pagesStart = pm ? pm.pdfPages.slice() : [];
    var pages = pagesStart.slice();
    var first = pagesStart[0] || 1;
    var win = pm ? [Math.max(1, first - STRIP_BEFORE), first + STRIP_AFTER] : [0, -1];
    if (pm && pm.max) win[1] = Math.min(win[1], pm.max);
    if (pm && pagesStart.length) win[1] = Math.max(win[1], pagesStart[pagesStart.length - 1]);
    var thumbs = {}, big = {};
    var preview = 0;     // pdf page shown large, 0 = none
    var msg = '';
    var busy = false, busyWords = '', root = null;

    function printedOf(n) { return pm && pm.known ? n - pm.offset : n; }
    function sorted(a) { return a.slice().sort(function (x, y) { return x - y; }); }
    function pagesLabel() {
      if (!pages.length) return 'no pages';
      var pr = sorted(pages).map(printedOf);
      return (pm && pm.known ? 'printed ' : 'PDF ') + (pr.length > 1 ? 'pages ' + pr.join(', ') : 'page ' + pr[0]);
    }
    function sameList(a, b) { a = sorted(a); b = sorted(b); return a.length === b.length && a.every(function (x, i) { return x === b[i]; }); }

    function loadImg(store, n, w, sel) {
      if (store[n] || !pdf || !pdf.url || !window.IxPdfPager) return;
      store[n] = 'busy';
      window.IxPdfPager.render(pdf.url, n, w).then(function (u) { store[n] = u || 'err'; putImg(store, n, sel); })
        .catch(function () { store[n] = 'err'; });
    }
    /* A picture fills in place, so nothing else on the panel is redrawn. */
    function putImg(store, n, sel) {
      var ph = root && root.querySelector(sel + '[data-n="' + n + '"]');
      if (!ph || !store[n] || store[n] === 'err' || store[n] === 'busy') return;
      var im = document.createElement('img'); im.alt = 'PDF page ' + n; im.src = store[n];
      im.setAttribute('data-n', String(n)); ph.parentNode.replaceChild(im, ph);
    }
    function imgHtml(store, n, cls) {
      var u = store[n];
      return (u && u !== 'busy' && u !== 'err') ? '<img alt="PDF page ' + n + '" src="' + esc(u) + '">'
                                                : '<div class="ixt-ph ' + cls + '" data-n="' + n + '"></div>';
    }

    /* v1.1.3 — the label sits above its options; a changed rule gets its own Cancel */
    function labHtml(word, key, changed) {
      return '<div class="ixt-lab"><span>' + esc(word) + '</span>' +
        (changed && !busy ? '<button type="button" class="ixt-undo" data-ixt-undo="' + key + '">Cancel</button>' : '') + '</div>';
    }
    function optsHtml(key) {
      var changed = cur[key] !== start[key];
      return '<div class="ixt-opts' + (changed ? ' ixt-changed' : '') + '">' +
        CHOICES[key].map(function (c) {
          return '<button type="button" class="ixt-opt' + (cur[key] === c[0] ? ' is-on' : '') + '" data-ixt-set="' + key + '" data-v="' + c[0] + '"' + (busy ? ' disabled' : '') + '>' + esc(c[1]) + '</button>';
        }).join('') + '</div>';
    }

    function pagesHtml() {
      if (!pm) return '';
      var changed = !sameList(pages, pagesStart);
      var order = sorted(pages);
      var cards = '';
      if (win[0] > 1) cards += '<button type="button" class="ixt-more" data-ixt-more="-1"' + (busy ? ' disabled' : '') + '>‹ Earlier pages</button>';
      for (var n = win[0]; n <= win[1]; n++) {
        loadImg(thumbs, n, 280, '.ixt-thumb');
        var on = pages.indexOf(n) >= 0;
        cards += '<div class="ixt-card' + (on ? ' is-on' : '') + '" data-ixt-page="' + n + '" role="button" aria-pressed="' + on + '" title="' + (on ? 'Leave this page out' : 'Read this page') + '">' +
          (on ? '<span class="ixt-badge">' + (order.indexOf(n) + 1) + '</span>' : '') +
          '<button type="button" class="ixt-zoom" data-ixt-zoom="' + n + '">View</button>' +
          imgHtml(thumbs, n, 'ixt-thumb') +
          '<div class="ixt-num">' + (pm.known ? 'Page ' + printedOf(n) : 'PDF page ' + n) + '</div>' +
          (pm.known && pm.offset ? '<div class="ixt-sub">PDF ' + n + '</div>' : '') +
        '</div>';
      }
      if (!pm.max || win[1] < pm.max) cards += '<button type="button" class="ixt-more" data-ixt-more="1"' + (busy ? ' disabled' : '') + '>Later pages ›</button>';
      var h = '<div class="ixt-pick' + (changed ? ' ixt-changed' : '') + '">' +
        '<div class="ixt-pick-top"><span>Click each page the article is on. They are read in page order.</span><span class="ixt-sp"></span>' +
          '<span><b>' + (pages.length ? 'Reading ' + esc(pagesLabel()) : 'No page chosen') + '</b></span></div>' +
        '<div class="ixt-strip">' + cards + '</div>';
      if (preview) {
        loadImg(big, preview, PREVIEW_W, '.ixt-big');
        var pon = pages.indexOf(preview) >= 0;
        h += '<div class="ixt-prev"><div class="ixt-prev-top"><b>' + (pm.known ? 'Page ' + printedOf(preview) : 'PDF page ' + preview) + '</b>' +
          '<button type="button" class="ix-btn ix-btn--secondary" data-ixt-page="' + preview + '">' + (pon ? 'Leave this page out' : 'Read this page') + '</button>' +
          '<span class="ixt-sp"></span><button type="button" class="ixt-link" data-ixt-zoom="0">Close the preview</button></div>' +
          imgHtml(big, preview, 'ixt-big') + '</div>';
      }
      h += '</div>';
      if (!pm.known) h += '<div class="ixt-note">This print item has no stored PDF page, so the pages are numbered as in the PDF. Use View to check each one.</div>';
      return h;
    }

    function html() {
      return '<div class="ixt-panel">' +
        '<div class="ixt-head"><span class="ixt-title">Reading rules</span><span class="ixt-sp"></span>' +
          (busy ? '' : '<button type="button" class="ixt-link" data-ixt-cancel>cancel</button>') + '</div>' +
        '<div class="ixt-row">' + labHtml('Kind', 'kind', cur.kind !== start.kind) + optsHtml('kind') + '</div>' +
        '<div class="ixt-row">' + labHtml('Headers', 'headers', cur.headers !== start.headers) + optsHtml('headers') + '</div>' +
        '<div class="ixt-row">' + labHtml('Fields', 'fields', cur.fields !== start.fields) + optsHtml('fields') + '</div>' +
        (pm ? '<div class="ixt-row">' + labHtml('Pages', 'pages', !sameList(pages, pagesStart)) + '<div>' + pagesHtml() + '</div></div>' : '') +
        (msg ? '<div class="ixt-msg">' + msg + '</div>' : '') +
        '<div class="ixt-foot"><span class="ixt-sp"></span>' +
          (busy ? '<span class="ixt-busy">' + esc(busyWords || 'Reading…') + '</span>'
                : (o.extraHtml ? o.extraHtml() : '') +
                  '<button type="button" class="ix-btn ix-btn--primary" data-ixt-read' + (pm && !pages.length ? ' disabled' : '') + '>' + esc(o.readLabel || 'Read it') + '</button>') +
        '</div>' +
      '</div>';
    }

    function draw() { if (root) root.innerHTML = html(); }

    function onClick(e) {
      var t = e.target;
      if (!t.closest) return;
      var set = t.closest('[data-ixt-set]');
      if (set && !busy) { cur[set.getAttribute('data-ixt-set')] = set.getAttribute('data-v'); draw(); return; }
      var undo = t.closest('[data-ixt-undo]');   // v1.1.3 — one rule back
      if (undo && !busy) {
        var uk = undo.getAttribute('data-ixt-undo');
        if (uk === 'pages') { pages = pagesStart.slice(); preview = 0; } else cur[uk] = start[uk];
        msg = ''; draw(); return;
      }
      if (t.closest('[data-ixt-cancel]')) {
        cur = Object.assign({}, start); pages = pagesStart.slice(); preview = 0; msg = ''; draw();
        if (typeof o.onCancel === 'function') o.onCancel();
        return;
      }
      var zm = t.closest('[data-ixt-zoom]');
      if (zm) { e.stopPropagation(); var z = Number(zm.getAttribute('data-ixt-zoom')); preview = (z && z !== preview) ? z : 0; draw(); return; }
      var mo = t.closest('[data-ixt-more]');
      if (mo && !busy) {
        if (Number(mo.getAttribute('data-ixt-more')) < 0) win[0] = Math.max(1, win[0] - STRIP_STEP);
        else { win[1] = win[1] + STRIP_STEP; if (pm.max) win[1] = Math.min(win[1], pm.max); }
        draw(); return;
      }
      var pg = t.closest('[data-ixt-page]');
      if (pg && !busy) {
        var n = Number(pg.getAttribute('data-ixt-page')), i = pages.indexOf(n);
        if (i >= 0) pages.splice(i, 1); else pages.push(n);
        pages = sorted(pages); msg = ''; draw(); return;
      }
      if (t.closest('[data-ixt-read]') && !busy) {
        saveRules(place, cur); msg = '';
        if (typeof o.onRead === 'function') o.onRead(api.rules());
        return;
      }
      if (typeof o.onClick === 'function') o.onClick(e);
    }

    var api = {
      version: VERSION,
      mount: function (el) {
        if (!el) return;
        if (root && root !== el) root.removeEventListener('click', onClick);
        if (root !== el) el.addEventListener('click', onClick);
        root = el; draw();
      },
      rules: function () {
        var p = sorted(pages);
        return { kind: cur.kind, headers: cur.headers, fields: cur.fields, pages: p, pagesLabel: pagesLabel(),
                 lastPage: p.length ? p[p.length - 1] : null, lastPrinted: p.length ? printedOf(p[p.length - 1]) : null };
      },
      printedOf: printedOf,
      /* Tick a page (and bring it into the strip). */
      addPage: function (n) {
        n = Number(n); if (!(n > 0) || (pm && pm.max && n > pm.max)) return false;
        if (pages.indexOf(n) < 0) pages = sorted(pages.concat([n]));
        if (n > win[1]) win[1] = n; if (n < win[0]) win[0] = n;
        draw(); return true;
      },
      /* A message in the panel (HTML the caller built and escaped). */
      message: function (h) { msg = h || ''; draw(); },
      busy: function (on, words) { busy = !!on; busyWords = words || ''; draw(); }
    };
    return api;
  }

  window.IxTranscribe = { version: VERSION, read: read, readPdf: readPdf, panel: panel, fromDataUrl: fromDataUrl,
                          system: SYSTEM, choices: CHOICES, pageModel: pageModel };
  console.log(TAG, 'ready');
})();
