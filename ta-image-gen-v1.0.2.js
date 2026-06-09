/* ============================================================
   ta-image-gen-v1.0.2.js
   ============================================================
   INBXIFY · ASF main-image generation (Flux 2 Pro)

   Companion module — does NOT edit ta-asf. It self-wires to the
   existing "✨ Generate" button (data-asf-action="generate-main")
   by intercepting the click in the capture phase, the same way
   ta-generate is a standalone consumer of the Anthropic proxy.

   ── FLOW ──
   1. Click "✨ Generate" on the main-image zone (Article, create or edit).
   2. Claude reads the article body via the existing Anthropic proxy
      (window.TA_CONFIG.anthropicProxy) and drafts a tight image prompt
      + a safety gate. If the gate says "don't generate" (named real
      person, sensitive event), we surface the reason and stop.
   3. Modal shows the drafted prompt, EDITABLE, with the gold
      dirty/selected border (--ipp-edit-dirty-border) once the operator
      changes it, plus a Cancel link that reverts to the drafted text.
   4. "Generate image" → POST { prompt, width, height } to the fluxgen
      Worker → returns a permanent Uploadcare UUID + URL.
   5. The returned UUID + URL is handed to Scenario L (Generate Media)
      via window.TA_CONFIG.makeGenerateMedia, which CREATES the MEDIA row
      (component-role = Image, status = Attached) and ATTACHES it to the
      asset's main-image slot in one pass, then returns { ok:true }.
      Scenario B (conditioner) is NOT involved — generated images are
      already conditioned by the Worker.

   ── CONFIG (TA_CONFIG) ──
     anthropicProxy   (already present — used by ta-rte / ta-generate)
     fluxGen          the Worker URL:
                      fluxGen: 'https://fluxgen.jeff-2cd.workers.dev'
     makeGenerateMedia  NEW — the Scenario L webhook URL.
                      makeGenerateMedia: 'https://hook.us1.make.com/...'

   ── DEPENDENCY ──
     Reads window.InbxASF._internal (already exposed by ta-asf) for the
     live tenant config, article id, toast, render and hydrateMedia.
     No ASF file edit required. If InbxASF is absent or makeConditioner
     is unset, the module degrades gracefully: it still generates the
     image and hands back the Uploadcare URL so the operator can attach
     it manually via the Replace button.

   ── HARDCODING ──
     HC-IMG-001  fluxGen Worker URL read from TA_CONFIG.fluxGen
     HC-IMG-002  model 'flux-2-pro' (Worker-side; client sends none)
     HC-IMG-003  default 1024×1024 square (main-image zone guidance)
     HC-IMG-004  prompt model 'claude-haiku-4-5' (matches ta-generate)
     HC-IMG-005  dirty/selected border token --ipp-edit-dirty-border
     (component-role intentionally NOT written — see TD-IMG-ROLE)
   ============================================================ */
(function () {
  'use strict';

  var VERSION = '1.0.2';
  var PROMPT_MODEL = 'claude-haiku-4-5';     // HC-IMG-004
  var DEFAULT_W = 1024, DEFAULT_H = 1024;     // HC-IMG-003

  function cfg() { return window.TA_CONFIG || {}; }
  function proxyUrl() { return cfg().anthropicProxy || ''; }
  function fluxUrl()  { return cfg().fluxGen || ''; }   // HC-IMG-001
  function log() { if (cfg().debug) try { console.log.apply(console, ['[img-gen v' + VERSION + ']'].concat([].slice.call(arguments))); } catch (e) {} }

  /* ── Prompt-drafting via the Anthropic proxy ──
     Mirrors ta-generate: build the full Messages request client-side,
     POST to the transparent proxy. Returns { generate, prompt, reason }. */
  var SYSTEM_PROMPT = [
    'You write image-generation prompts for a LOCAL COMMUNITY NEWSLETTER.',
    'You are given the HTML body of one article. Produce a single complementary',
    'hero image prompt for a text-to-image model (Flux). Rules:',
    '- Describe scene, setting, mood, lighting, composition. Photographic by default.',
    '- NEVER depict real, named, identifiable people. NO text, logos, watermarks, signage.',
    '- Keep it concise: one paragraph, ~25-45 words, details ordered by priority.',
    '- If the article centers on a SPECIFIC real named person, a tragedy, crime,',
    '  death, medical detail, or other sensitive event where a generated image',
    '  would be inappropriate, DO NOT write a prompt.',
    '',
    'Respond with ONLY a JSON object, no markdown, no preamble:',
    '{"generate": true|false, "prompt": "<prompt or empty>", "reason": "<if false, why>"}'
  ].join('\n');

  function draftPrompt(bodyHtml) {
    var proxy = proxyUrl();
    if (!proxy) return Promise.reject(new Error('anthropicProxy not configured in TA_CONFIG'));
    var body = String(bodyHtml || '').trim();
    if (!body) return Promise.reject(new Error('No article body to read — add a body first.'));

    var req = {
      model: PROMPT_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: 'ARTICLE BODY (HTML):\n\n' + body }]
    };

    return fetch(proxy, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error('Proxy HTTP ' + r.status + ': ' + t.slice(0, 200)); });
      return r.json();
    }).then(function (data) {
      var text = '';
      if (data && Array.isArray(data.content)) {
        text = data.content.filter(function (b) { return b && b.type === 'text'; })
                           .map(function (b) { return b.text; }).join('\n');
      }
      var clean = text.replace(/```json|```/g, '').trim();
      var parsed;
      try { parsed = JSON.parse(clean); }
      catch (e) { throw new Error('Could not parse prompt response.'); }
      if (!parsed || typeof parsed.generate !== 'boolean') throw new Error('Malformed prompt response.');
      return parsed;
    });
  }

  /* ── Worker call ── */
  function generateImage(prompt) {
    var url = fluxUrl();
    if (!url) return Promise.reject(new Error('fluxGen Worker URL not configured in TA_CONFIG.'));
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt, width: DEFAULT_W, height: DEFAULT_H })
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || !j || !j.url) {
          throw new Error((j && j.error ? j.error : 'Worker HTTP ' + r.status) +
                          (j && j.stage ? ' [' + j.stage + ']' : ''));
        }
        return j;   // { url, uuid, model, width, height, seconds }
      });
    });
  }

  /* ── Attach via Scenario L — Generate Media ──
     Architectural rule (Jeff): Scenario B is a CONDITIONER only — it
     does not assign assets. Generated images are ALREADY conditioned
     (the fluxgen Worker did the Uploadcare upload), so they bypass B
     Architectural rule (Jeff): generation and assignment stay separate.
     Scenario L CREATES + PUBLISHES the MEDIA row only (status Available)
     and returns its mediaId. It does NOT assign. The module then hands
     that MEDIA item to the ASF's OWN setMainImageFromMedia — the exact
     path used when picking an existing library image — so the ASF marks
     the slot dirty and ASSIGNS it on Save. No assignment logic here, no
     behind-the-back article write, no Scenario B.

     Endpoint: TA_CONFIG.makeGenerateMedia  (Scenario L webhook)
     Contract: { action:'createGeneratedMedia', uploadcareUrl, ... } →
               creates MEDIA (Media Type=image, status=Available, NO
               component-role — see TD-IMG-ROLE), publishes it, returns
               { ok:true, mediaId, imageUrl, name }.

     Returns to caller: { ok, media:{ mediaId, imageUrl, name } } so the
     click handler can call setMainImageFromMedia and let the ASF finish. */
  function createMedia(j, prompt) {
    var asf = window.InbxASF;
    var I   = asf && asf._internal;
    if (!I || !I.cfg || !I.state) {
      return Promise.resolve({ fallback: true, url: j.url });   // graceful: manual Replace
    }
    var CFG = I.cfg, S = I.state;
    var tenant = CFG.tenant;
    var url = (tenant.makeGenerateMedia && tenant.makeGenerateMedia())
              || (window.TA_CONFIG && window.TA_CONFIG.makeGenerateMedia)
              || '';
    if (!url) return Promise.resolve({ fallback: true, url: j.url });

    // Per convention (TD-IMG-ROLE): Available MEDIA does NOT carry a
    // Component Role. Role is a TYPE/usage sub-classifier assigned at
    // ATTACH time, not at creation — and for a plain image it would only
    // duplicate Media Type = image. So we do NOT send componentRole here.
    // Scenario L's Create-MEDIA module leaves Component Role empty;
    // Media Type = image is the real classifier.
    var fname = 'flux-' + String(j.uuid).slice(0, 8) + '.jpg';
    var payload = {
      action:           'createGeneratedMedia',
      uploadcareUuid:   j.uuid,
      uploadcareUrl:    j.url,
      originalFilename: fname,
      mimeType:         'image/jpeg',
      width:            j.width || 1024,
      height:           j.height || 1024,
      titleSlug:        tenant.titleSlug(),
      taItemId:         tenant.taItemId(),
      imageSource:      'ai-flux-2-pro',        // provenance
      generationPrompt: prompt,                 // provenance
      source:           'image-gen-v' + VERSION
    };
    return fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error('Scenario L HTTP ' + r.status);
      return r.text();
    }).then(function (body) {
      var p = null;
      try { p = JSON.parse(body); } catch (e) {}
      if (!p || p.ok !== true || !p.mediaId) {
        throw new Error('Scenario L did not confirm (createGeneratedMedia route).');
      }
      return {
        ok: true,
        media: {
          mediaId:  p.mediaId,
          imageUrl: p.imageUrl || j.url,
          name:     p.name || fname
        }
      };
    });
  }

  // Hand the new MEDIA to the ASF's own main-image setter, exactly as if
  // the operator had picked it from the library. The ASF marks it dirty
  // and assigns it on Save — assignment stays the ASF's job.
  function handToAsf(media) {
    var I = window.InbxASF && window.InbxASF._internal;
    var fn = I && (I.setMainImageFromMedia || (I.api && I.api.setMainImageFromMedia));
    if (typeof fn === 'function') { fn(media); return true; }
    // Fallback: write state directly the way setMainImageFromMedia does,
    // then re-render — covers the case where it isn't exposed on _internal.
    if (I && I.state) {
      var S = I.state;
      if (!S.article) S.article = {};
      if (!S.dirtyFields) S.dirtyFields = {};
      if (!S.originalValues) S.originalValues = {};
      var prior = S.originalValues.mainImageSrc || '';
      S.article.mainImageSrc     = media.imageUrl;
      S.article.mainImageMediaId = media.mediaId || '';
      if (!S.article.mainImageAlt && media.name) S.article.mainImageAlt = media.name;
      if (!Array.isArray(S.media)) S.media = [];
      S.media = S.media.filter(function (m) { return m.role !== 'main-image'; });
      S.media.push({ mediaId: media.mediaId, imageUrl: media.imageUrl, name: media.name, role: 'main-image' });
      S.dirtyFields.mainImageSrc     = { from: prior, to: media.imageUrl };
      S.dirtyFields.mainImageMediaId = { from: '', to: media.mediaId || '' };
      try { I.render(); } catch (e) {}
      return true;
    }
    return false;
  }

  /* ── Modal UI ── */
  var modalEl = null, state = null;

  function styleTag() {
    if (document.getElementById('ix-imggen-styles')) return;
    var s = document.createElement('style');
    s.id = 'ix-imggen-styles';
    s.textContent = [
      '.ixig-backdrop{position:fixed;inset:0;background:rgba(26,58,58,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px}',
      '.ixig-modal{background:#FAF9F5;border-radius:14px;max-width:560px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.28);font-family:"DM Sans",system-ui,sans-serif;overflow:hidden}',
      '.ixig-head{padding:18px 22px;border-bottom:1px solid #e7e4da;display:flex;align-items:center;gap:10px}',
      '.ixig-head b{font-size:16px;color:#1A3A3A;font-weight:600}',
      '.ixig-body{padding:20px 22px}',
      '.ixig-label{display:block;font-size:12px;font-weight:600;color:#1A3A3A;margin:0 0 6px}',
      '.ixig-ta{width:100%;min-height:96px;resize:vertical;border:2px solid #e0ddd2;border-radius:9px;padding:11px 13px;font:14px/1.5 "DM Sans",sans-serif;color:#243;background:#fff;box-sizing:border-box}',
      '.ixig-ta:focus{outline:none;border-color:#5B7FFF}',
      '.ixig-ta.dirty{border-color:var(--ipp-edit-dirty-border,#C4A35A) !important}',   /* HC-IMG-005 */
      '.ixig-sub{font-size:12px;color:#7a7766;margin:8px 2px 0}',
      '.ixig-preview{margin-top:14px;border-radius:10px;overflow:hidden;background:#eee;aspect-ratio:1/1;display:none}',
      '.ixig-preview img{width:100%;height:100%;object-fit:cover;display:block}',
      '.ixig-foot{padding:14px 22px;border-top:1px solid #e7e4da;display:flex;align-items:center;justify-content:space-between;gap:12px}',
      '.ixig-cancel{background:none;border:none;color:#7a7766;font-size:13px;text-decoration:underline;cursor:pointer;padding:6px}',
      '.ixig-cancel:hover{color:#1A3A3A}',
      '.ixig-btn{background:#C4A35A;color:#1A3A3A;border:none;border-radius:9px;padding:11px 20px;font-weight:600;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}',
      '.ixig-btn:disabled{opacity:.55;cursor:default}',
      '.ixig-btn.secondary{background:#5B7FFF;color:#fff}',
      '.ixig-spin{width:15px;height:15px;border:2px solid rgba(26,58,58,.3);border-top-color:#1A3A3A;border-radius:50%;animation:ixigspin .7s linear infinite}',
      '@keyframes ixigspin{to{transform:rotate(360deg)}}',
      '.ixig-err{color:#b3261e;font-size:13px;margin-top:10px}',
      '.ixig-x{margin-left:auto;background:none;border:none;font-size:20px;color:#7a7766;cursor:pointer;line-height:1}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function close() {
    if (modalEl) { modalEl.remove(); modalEl = null; }
    state = null;
    document.removeEventListener('keydown', onKey, true);
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  function render() {
    if (!modalEl || !state) return;
    var s = state;
    var dirty = s.prompt !== s.drafted;
    var busy = s.phase === 'drafting' || s.phase === 'generating';

    var inner;
    if (s.phase === 'drafting') {
      inner = '<div class="ixig-body"><div class="ixig-sub">Reading the article and drafting an image prompt…</div></div>';
    } else if (s.phase === 'blocked') {
      inner = '<div class="ixig-body"><div class="ixig-err">No image generated. ' + esc(s.reason || 'This article isn\u2019t a good fit for a generated image.') + '</div></div>';
    } else {
      inner =
        '<div class="ixig-body">' +
          '<label class="ixig-label" for="ixig-prompt">Image prompt' + (dirty ? ' \u00b7 edited' : '') + '</label>' +
          '<textarea id="ixig-prompt" class="ixig-ta' + (dirty ? ' dirty' : '') + '"' +
            (busy ? ' disabled' : '') + '>' + esc(s.prompt) + '</textarea>' +
          '<div class="ixig-sub">Flux 2 Pro \u00b7 1024\u00d71024 \u00b7 ~12\u201315s \u00b7 no real people, no text</div>' +
          '<div class="ixig-preview"' + (s.resultUrl ? ' style="display:block"' : '') + '>' +
            (s.resultUrl ? '<img src="' + esc(s.resultUrl) + '" alt="Generated preview">' : '') +
          '</div>' +
          (s.error ? '<div class="ixig-err">' + esc(s.error) + '</div>' : '') +
        '</div>';
    }

    var foot;
    if (s.phase === 'blocked') {
      foot = '<div class="ixig-foot"><span></span><button type="button" class="ixig-btn" data-ixig="close">Close</button></div>';
    } else if (s.resultUrl && s.phase === 'done') {
      foot = '<div class="ixig-foot">' +
               '<button type="button" class="ixig-cancel" data-ixig="regen">Discard &amp; redraw</button>' +
               '<button type="button" class="ixig-btn" data-ixig="use">Use as main image</button>' +
             '</div>';
    } else {
      foot = '<div class="ixig-foot">' +
               '<button type="button" class="ixig-cancel" data-ixig="cancel">' + (dirty ? 'Revert prompt' : 'Cancel') + '</button>' +
               '<button type="button" class="ixig-btn"' + (busy ? ' disabled' : '') + ' data-ixig="generate">' +
                 (s.phase === 'generating' ? '<span class="ixig-spin"></span>Generating…' : '\u2728 Generate image') +
               '</button>' +
             '</div>';
    }

    modalEl.querySelector('.ixig-modal').innerHTML =
      '<div class="ixig-head"><span>\u2728</span><b>Generate main image</b>' +
        '<button type="button" class="ixig-x" data-ixig="close">\u00d7</button></div>' +
      inner + foot;

    var ta = modalEl.querySelector('#ixig-prompt');
    if (ta && !busy) {
      // Do NOT re-render on input — re-rendering rebuilds the textarea
      // and kills typing (one char at a time). Just store the value and
      // update the dirty affordances in place. The textarea is an
      // uncontrolled input; the browser owns its text while typing.
      ta.addEventListener('input', function () {
        s.prompt = ta.value;
        var isDirty = s.prompt !== s.drafted;
        ta.classList.toggle('dirty', isDirty);
        // Update the Cancel/Revert label + the "· edited" hint without
        // a full re-render.
        var cancelBtn = modalEl.querySelector('[data-ixig="cancel"]');
        if (cancelBtn) cancelBtn.textContent = isDirty ? 'Revert prompt' : 'Cancel';
        var lbl = modalEl.querySelector('.ixig-label');
        if (lbl) lbl.textContent = 'Image prompt' + (isDirty ? ' \u00b7 edited' : '');
      });
      // Restore focus once after a (re)render that wasn't caused by typing
      // — e.g. arriving from the drafting phase — so the operator can type
      // immediately. Guarded so we only autofocus when the field is empty
      // of a selection.
      if (s._focusOnRender) { s._focusOnRender = false; try { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {} }
    }
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function onModalClick(e) {
    var t = e.target.closest('[data-ixig]'); if (!t) {
      if (e.target.classList && e.target.classList.contains('ixig-backdrop')) close();
      return;
    }
    var act = t.getAttribute('data-ixig');
    var s = state; if (!s) return;
    if (act === 'close') return close();
    if (act === 'cancel') {
      if (s.prompt !== s.drafted) { s.prompt = s.drafted; s._focusOnRender = true; render(); }   // revert
      else close();
      return;
    }
    if (act === 'regen') { s.resultUrl = ''; s.phase = 'ready'; s.error = ''; render(); return; }
    if (act === 'generate') {
      // Read the LIVE textarea value so the final state is captured even
      // if the last input event hasn't flushed.
      var taLive = modalEl.querySelector('#ixig-prompt');
      if (taLive) s.prompt = taLive.value;
      if (!s.prompt.trim()) { s.error = 'Prompt is empty.'; render(); return; }
      s.phase = 'generating'; s.error = ''; render();
      generateImage(s.prompt).then(function (j) {
        s.result = j; s.resultUrl = j.url; s.phase = 'done'; render();
      }).catch(function (err) {
        s.phase = 'ready'; s.error = (err && err.message) || 'Generation failed.'; render();
      });
      return;
    }
    if (act === 'use') {
      var btn = t; btn.disabled = true; btn.innerHTML = '<span class="ixig-spin"></span>Adding…';
      createMedia(s.result, s.prompt).then(function (res) {
        if (res && res.fallback) {
          asfToast('Image generated. Scenario L not wired — copy the URL and use Replace.', 'info');
          close();
          return;
        }
        // Hand the new Available MEDIA to the ASF's own main-image setter.
        // The slot goes dirty; the operator's Save assigns it (ASF's job).
        var ok = handToAsf(res.media);
        if (ok) {
          asfToast('Image added to the main-image slot — Save to assign it.', 'success');
        } else {
          asfToast('MEDIA created. Pick it from the library to attach.', 'info');
        }
        close();
      }).catch(function (err) {
        s.error = 'Could not add image: ' + ((err && err.message) || 'unknown'); s.phase = 'done'; render();
      });
      return;
    }
  }

  function asfToast(msg, kind) {
    var I = window.InbxASF && window.InbxASF._internal;
    if (I && typeof I.toast === 'function') return I.toast(msg, kind);
    log(kind, msg);
  }

  function open(bodyHtml) {
    styleTag();
    state = { phase: 'drafting', drafted: '', prompt: '', resultUrl: '', result: null, error: '', reason: '' };
    modalEl = document.createElement('div');
    modalEl.className = 'ixig-backdrop';
    modalEl.innerHTML = '<div class="ixig-modal"></div>';
    modalEl.addEventListener('click', onModalClick);
    document.body.appendChild(modalEl);
    document.addEventListener('keydown', onKey, true);
    render();

    draftPrompt(bodyHtml).then(function (out) {
      if (!state) return;   // closed mid-flight
      if (!out.generate) { state.phase = 'blocked'; state.reason = out.reason || ''; render(); return; }
      state.drafted = out.prompt || '';
      state.prompt  = state.drafted;
      state.phase   = 'ready';
      state._focusOnRender = true;
      render();
    }).catch(function (err) {
      if (!state) return;
      state.phase = 'ready'; state.drafted = ''; state.prompt = '';
      state.error = (err && err.message) || 'Could not draft a prompt.';
      state._focusOnRender = true;
      render();
    });
  }

  /* ── Self-wire to the existing generate-main button ──
     Capture-phase listener intercepts BEFORE the ASF delegated click
     router shows its "coming soon" toast. We read the body from the
     ASF bridge if present, else from the live state hook. */
  function getBodyHtml() {
    var I = window.InbxASF && window.InbxASF._internal;
    if (I && I.state && I.state.article && I.state.article.bodyHtml) {
      return I.state.article.bodyHtml;
    }
    // Fallback: read from the live Trix editor if mounted
    var trix = document.querySelector('trix-editor');
    if (trix && trix.innerHTML) return trix.innerHTML;
    return '';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-asf-action="generate-main"]');
    if (!btn) return;
    e.stopPropagation();   // pre-empt the ASF stub toast
    e.preventDefault();
    open(getBodyHtml());
  }, true);  // capture phase

  window.InbxImageGen = { open: open, version: VERSION };
  log('ready');
})();
