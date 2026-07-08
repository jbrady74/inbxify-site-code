/* ============================================================
   ta-adreformat-v0.5.0.js
   INBXIFY TA Studio — Ad Reformatter (Generator tab tool)

   CANVAS-FIRST REWRITE. Supersedes the v1.0.x line.

   v0.5.0 — ISOLATE OBJECT (WaveSpeed SAM3 via ix-object-isolator worker).
     • New "⬚ Isolate object" action in the editor bar. Overlay on the
       SOURCE image with three pick tools — Box / Point / Text — and a
       Mode select: Isolate (SAM3 cut-out onto transparency) or Copy
       (plain crop, all layers; box only).
     • TWO-STAGE pipeline (locked 2026-07-08): Box+Isolate client-crops
       the drawn region first, then sends ONLY the crop to SAM3 with a
       full-frame box prompt — small objects get high-res masks.
       Point/Text send the full source with the point/text prompt.
     • Single result + re-run: SAM3 returns ONE cut-out; if it's wrong,
       adjust the selection and Re-run (each run ~$0.005). A mask picker
       only appears if the API ever returns multiple outputs.
     • Result actions (3): "Add to Canvas" (in-browser layer —
       intermediate, no MEDIA row per the deliverable-vs-intermediate
       rule) · "Save as MEDIA Item" · "Save & Download" (MEDIA save +
       local PNG download). Both saves open the customer-assignment
       step — the arc's first CMS-writing dropdown: tenant-scoped
       customer select with the gold #C4A35A dirty border while a
       selection is pending and a cancel link to revert (edit-state
       invariants), then Uploadcare → Scenario B Route 4
       (sourceChannel:'reformatter') with componentRole =
       ISOLATED_ROLE_HASH (HC — isolated-object role) + customerId.
     • Requires TA_CONFIG.objectIsolatorWorker (ix-object-isolator
       worker URL) and worker v1.3.0+ (return_base64) so the cut-out
       comes back as bytes — an untainted canvas that composeBanner's
       toBlob export can always read.

   v0.4.9 — brand-kit assist: logo drop-zone + brand-info panel.
     • LOGO DROP-ZONE: drag or browse a logo image; it uploads to
       Uploadcare immediately (conditioned URL shown + Copy URL), and
       "Place on banner" drops it as a logo layer. "use a different
       logo" revert link (.ix-revert per the standing revert convention).
     • BRAND-INFO PANEL: extracted brand colors as click-to-copy hex
       chips; font names surfaced as reference (honest: licensed fonts
       can't be embedded, so the names are there to match in Canva).
     Neither writes to the Customer record yet — that piece is gated on
     new Webflow fields (brand colors / font family don't exist on the
     Customers collection per platform-data-reference; logo/logoLink
     do). When save-to-Customer-record is built it must honor the
     edit-state invariants: gold #C4A35A border on fields holding an
     unsaved selection + a cancel/revert link before Save writes.

   v0.4.8 — FIX Add-text + AUTOSAVE (so work survives a reload):
     • FIX: "+ Add text" did nothing. After adding, it tried to enter
       inline edit via querySelector('div') — which grabbed the resize
       HANDLE (first div), not the text span, so editing attached to the
       wrong node. The text span now carries class .ix-arf-txt and is
       targeted explicitly. (Same first-div trap the console inspection
       showed earlier.)
     • AUTOSAVE: editor layers (including cropped images, stored as
       dataURLs) are persisted to localStorage on every change (debounced,
       keyed per title+advertiser). On reopening the editor you're asked
       to "Restore your previous banner edits?" — Cancel starts fresh.
       Cleared after a successful Save to advertiser. This is the
       deferred autosave; a reload no longer throws away your work.
       (Quota/disabled localStorage fails silently — non-fatal.)

   v0.4.7 — FIX: "grey screen of death" on the 2nd Crop-from-source.
     openCropTool appended a new id="ix-arf-crop" overlay WITHOUT
     removing the previous one. On the 2nd crop, two same-id overlays
     coexisted, so getElementById('ix-arf-crop-surf'|'-canvas'|'-rect')
     returned the STALE first nodes — the new crop's drag drew nothing
     interactive while its 9999px dim shadow painted over the page:
     looked grey and frozen, only fixable by reload. Now openCropTool
     removes any existing crop overlay (and open color popover) first.
     Belt-and-suspenders: .ix-arf-crop-surf gets overflow:hidden so the
     dim shadow is clipped to the crop image and can never cover the
     whole viewport again.
     (NOTE: autosave/restore across reloads requested — deferred to a
     follow-up; this fix removes the main reason reloads were needed.)

   v0.4.6 — REAL background fix (console-confirmed) + white crop-box.
     Inspection showed the white wasn't the outer layer node (that was
     correctly transparent) — it was the INNER text <div> getting
     `background-color:#fff !important` from the page's
     `.publisher-wrapper *` rule, painted on top of the layer's real
     background. v0.4.5 only hardened the outer node, so white persisted.
     Now:
       • Text inner div forced background-color:transparent !important,
         so the layer's chosen background (or the banner) shows through.
       • Resize handle forced its blue !important (was whiting too).
       • Crop-from-source rect forced transparent !important — this is
         the long-owed "white crop box" fix; same root cause.
     The chosen Background color (set on the outer node) now actually
     shows because the inner div no longer covers it with white.

   v0.4.5 — FIX: layer background now actually applies (white was
     overtaking it). The T-A page has a global
     `section.publisher-wrapper * { background-color: var(--ix-white)
     !important }`. We were setting the `background` SHORTHAND with
     !important, but an !important `background-color` LONGHAND beats an
     !important shorthand for the color — so the page's white won.
     Now we set `background-color` (longhand) !important on the stage
     and each layer, which goes head-to-head and wins (inline > selector).
     Matches the architecture note: injected elements need inline
     !important AND must target background-color specifically.

   v0.4.4 — placement + label fixes:
     • Finish/export box now sits BELOW the format toolbar (it's the
       last step) instead of above it.
     • Text color button relabeled "Highlight" → "Background", and it
       sets the layer's background fill (it already did in the model;
       the dashed outline is just the selection indicator, not a
       border the button controls).

   v0.4.3 — Word-like editor: real toolbar + add/delete + color popover.
     • Top action bar: "+ Add text" (drops a new text box, selected, in
       edit mode \u2014 for CTAs etc.) and "Delete" (also Delete/Backspace
       key) to remove the selected element.
     • Single contextual FORMAT ROW (Word-style) instead of stacked
       confusing chip rows: text \u2192 font, size, B, align, color buttons;
       image \u2192 background, lock-ratio, crop, reset.
     • COLOR done right: a color button shows the current color and
       opens a popover \u2014 swatch grid + "No fill / Transparent" +
       "More colors\u2026" (full picker). Replaces the naked chips +
       inline picker that were confusing (no transparent, no +, no
       apply, picker-on-a-chip). Click a swatch = applied + closed.
     • Inline text edit still on double-click; new boxes open straight
       into edit.
     This is the "make it work like Word" pass.

   v0.4.2 — toolbar redesign + fonts:
     • Toolbar is now LABELED ROWS (Background / Text / Text color /
       actions) instead of one undifferentiated chip strip. Background
       swatches and text-color swatches are clearly separated and
       labeled — fixes the confusion + the accidental color change.
     • FIX: background swatches now actually apply (handler matched a
       stale class after markup drift; unified to .ix-arf-sw + data-kind).
     • Full font picker: ~38 fonts from the project's Google + installed
       custom fonts (HC-ARF-FONTS-01), flat alphabetical, each option
       shown in its own face. Because the banner is rasterized, any
       browser-loaded font works — compose now awaits document.fonts.load()
       so the PNG matches the preview (no fallback surprise).
     • Wider size box (px), labeled.
     • Text box still resizes via the corner handle.
     HC-ARF-FONTS-01 logged (font list hardcoded from Webflow project).

   v0.4.1 — TEXT EDITING + the 104 titleSlug fix:
     • FIX: Scenario 104's datastore search keys on titleSlug, but
       v0.4.0's 104 payload omitted it → the search returned empty →
       no titleAdminId → asset create stalled (seen in a live run).
       Payload now sends titleSlug at top level. (taItemId stays too.)
     • Text editing (everything): double-click a text layer to edit
       the words inline on the banner; the toolbar sets font (DM Sans
       / Fraunces / DM Mono), size, bold, color (brand swatches or
       custom), and alignment (L/C/R). Compose + reset honor all of it.
     • "Use original as image": crops the original wording from the
       source ad (via the crop tool) and converts the text layer into
       an image layer — pixel-exact original text when you don't want
       a substitute font. Reuses openCropTool(asTextReplace).
     NOTE on fonts: editable text uses YOUR fonts (DM Sans/Fraunces/
     DM Mono); the advertiser's exact licensed font can't be loaded —
     use "original as image" when you need the precise original look.

   v0.4.0 — EXPORT + SAVE (the finish line). The editor now has a
     Finish bar: pick the Advertiser (from the page's hidden
     .customers-wrapper), Download PNG, or Save to advertiser.
       • Compose: all layers drawn to a 2\u00d7 (1400\u00d7470) canvas —
         backgrounds, image crops (cover-clipped via drawImage),
         text (fillText) — then toBlob PNG.
       • Download: offers the composed PNG.
       • Save chain (confirmed against live ta-converter + the
         Scenario B / 104 blueprints):
           1. Upload PNG \u2192 Uploadcare (client, public key).
           2. Scenario B (makeConditioner) Route 4
              sourceChannel:'reformatter' \u2192 module 124 \u2192 returns
              { ok, mediaId }. (Jeff adds the reformatter OR to
              Route 4's filter in Make.)
           3. Scenario 104 (makeCreateAssets) JSON body with
              { taItemId, fields:{ adName, customerId, customerName,
              bannerImageMediaId } } \u2192 customer-assigned AD with the
              banner MEDIA linked.
       • Honors each webhook's {ok:true}+JSON contract; real
         status, no false-positive saves.
     This makes the Reformatter end-to-end: read an ad \u2192 crop/lay
     out \u2192 produce a 700\u00d7235 banner \u2192 save it to the advertiser.
     Deferred: text font picker / original-as-image; sidebar export.

   v0.3.5 — crop polish + fixes:
     • Crop box is now TRANSPARENT (was filling white) — you see the
       image through it while framing; only the surround is dimmed.
     • FIX: Reset now works. Two elements shared id="ix-arf-reset"
       (the staged "Use a different ad" button AND the editor's
       Reset), so getElementById hit the wrong one and Reset never
       fired. Editor's is now ix-arf-layerreset; snapshot also stores
       the canvas so Reset restores correctly.
     • Removed Zoom slider + Pan toggle — redundant now that
       Crop-from-source is the real cropping tool. Toolbar is now
       Background / lock ratio / Crop from source / Reset.

   v0.3.4 — CROP FROM SOURCE (the real "basic crop"). The prior crop
     operated on the auto-extracted part, which is often wrong (the
     "photo" crop had the gold panel + text fused in, so you could
     never isolate just the people). Now: select a photo layer →
     "\u2702 Crop from source" in the toolbar opens the ORIGINAL ad with
     a free draw-rectangle. Drag to draw any region (just the people),
     drag inside to move it; Apply crops that region from the source
     and REPLACES the selected photo; Cancel exits unchanged. The
     cropped region becomes the layer's new image (crop/zoom reset,
     new Reset baseline). Free-shape box per your call. This is the
     basic, operate-on-the-raw-image crop that was the goal all along.
     Next: v0.3.5 per-text font picker + original-as-image; then
     export PNG/SVG + save to ADS record.

   v0.3.3 — CROP MODEL CORRECTED (standard cover-crop). The v0.3.2
     model was backwards: it aspect-locked the CONTAINER to the image.
     Now: the container resizes FREELY to any shape (make it a square,
     a wide strip, whatever the slot needs); the IMAGE keeps its OWN
     aspect and fills the container (cover, never distorts); Zoom +
     Pan choose WHICH PART of the image shows; the container clips the
     rest. This is "set the container to a square, then fill it with
     the part of the photo I want." Plus:
       • Lock-ratio checkbox: hold the container's current shape while
         resizing (off by default = free shape).
       • Reset button (per image): restore original crop/zoom/pan/box.
     Banner size stays BANNER_W/BANNER_H (single source) so a future
     banner-dimension change (e.g. taller than 700×235) is one edit.
     Next: v0.3.4 per-text font picker + original-as-image; then
     export PNG/SVG + save to ADS record.

   v0.3.2 — image behavior (feedback set, item 2/3 + bug):
     • FIX: custom background color now applies. The color <input>'s
       live `input` events were being killed by a full renderEditor()
       that destroyed the input mid-interaction. Now custom-color and
       zoom update the live node + state without a full rebuild.
     • Aspect-lock resize for IMAGE layers: the frame keeps the
       image's ratio on corner-resize so photos never distort. Text
       layers still resize freely.
     • CROP-FRAME (model b): each image layer is a fixed frame
       containing the image, which you Zoom (slider) and Pan (toggle
       + drag) inside the frame; overflow is clipped. "Crop the photo"
       and "expand beyond the border, hide overflow."
     • Each layer stashes its initial geometry (L.initial) so the
       parked per-element RESET button is a quick future add.
     Next: v0.3.3 editable source bboxes → re-crop (clipped logo);
     v0.3.4 per-text font picker + original-as-image. Then export+save.

   v0.3.1 — editor refinements (1 of the feedback set):
     • Border on the image: image layers now object-fit:fill and are
       sized to the crop's natural aspect, so the selection border
       sits on the image edge with no contain-padding.
     • Per-layer background: selecting a layer shows a background bar
       — transparent (default), brand-color swatches, or a custom
       color picker. Applies to image and text layers.
     Still pending (next versions): v0.3.2 crop-frame (scale/pan image
     inside a fixed clip frame, hide overflow); v0.3.3 editable source
     bboxes → re-crop (fixes clipped logo); v0.3.4 per-text font picker
     + original-text-as-image option. Export + save after those.

   v0.3.0 — BANNER EDITOR (drag + resize core). "Build banner \u2192"
     opens a 700×235 editor below the extract results. Cropped image
     parts + the first text parts are placed onto the banner (rough
     auto-place: photo left, logo/others right, text stacked) as
     absolutely-positioned layers. Drag the body to move, drag the
     corner handle to resize; click to select. Background uses the
     first brand color. Image layers use <img> (object-fit:contain),
     which gets proper proportional sizing — unlike the bare preview
     canvas that fought the page CSS (now solved via iframe + this
     img-layer model). NOT yet: snapping/guides, text editing/restyle,
     z-order controls, sidebar, export, save. This is the interaction
     slice to feel out before building those.

   v0.2.3 — ISOLATED IFRAME preview. The canvas-in-page approach was
     defeated by the T-A page's global CSS three times: the canvas
     measured visible / on-top / opaque / sized, yet rendered white,
     and its aspect-ratio was overridden (rect 558×372 where the
     bitmap demanded ~558×139 — proof an unseen page rule won). The
     cropped-part thumbnails always rendered because they aren't
     subject to that cascade the same way. Fix: render the source
     preview inside a same-origin <iframe> with its own document, so
     publisher-wrapper resets and unknown !important rules can't reach
     it. Source + bounding boxes are drawn into the iframe's own
     canvas/DOM. Crops and the parts bin are unchanged (they already
     worked). Brand-swatch !important fix retained from v0.2.2.

   v0.2.2 — FIX (proven, not guessed). Console reads established:
     canvas height = 139.5px (NOT collapsed), intrinsic 4096×1024,
     top-left pixel = rgba(155,124,129,255) — i.e. the canvas was
     correctly sized AND fully painted with the real ad. The image
     was being VISUALLY COVERED, not unpainted. Cause: the wrapper's
     own white background + overflow:hidden + font-size:0 created a
     stacking context where the static canvas painted beneath the
     wrapper background. Fix: canvas position:relative z-index:1 +
     transparent background so its own pixels show; overlay z-index:2
     transparent; removed overflow:hidden / font-size:0 from wrapper.
     ALSO: brand-color swatches were blank because the T-A
     publisher-wrapper universal `* { background: white !important }`
     reset overrode the inline swatch color — now forced with
     `!important` on the inline background.

   v0.2.1 — FIX: preview canvas was still rendering at ~0 height.
     A <canvas> with width:100% does not derive proportional height
     from its intrinsic pixels the way an <img> does — height:auto
     resolved to 0 in the flex wrapper. (The cropped-part thumbnail
     rendered fine, proving the source pixels were on the canvas all
     along — it was purely the big preview's display height.) Fix:
     set an explicit aspect-ratio on the canvas from the real source
     dimensions, and drop line-height:0 on the wrapper.

   Why the rewrite: in v1.0.x the source ad was shown via an
   <img src="data:..."> in a flex layout. Console proved the image
   loaded (naturalWidth 4096) and the src was set — it was simply
   collapsing to zero height in the flex wrapper, so the preview
   was blank while the bounding boxes (absolute overlay) still drew.
   Rather than patch the layout, the tool is rebuilt on <canvas>,
   which has explicit pixel dimensions and cannot collapse — and
   which is exactly the substrate Pieces 3+4 (crop + composite)
   require anyway. One architecture, preview through export.

   PIPELINE (deterministic, no DOM-src fragility):
     intake (drop/browse/paste)
       → decode into an in-memory Image (S.img)
       → draw to a sized preview <canvas> (S.previewCanvas)
       → extract via ix-adreformat Worker
       → draw bbox overlays as positioned divs over the canvas
       → crop each image region via ctx.drawImage into a part canvas
         (S.parts[]) — the reusable building blocks
     [Pieces 3+4, next: arrange parts → composite 700×235 + 480×400
      canvas → export PNG (toBlob) / SVG → save to ADS record]

   Worker contract (confirmed against ix-adreformat-worker-v1.0.0):
     REQUEST  (POST): { image: { media_type, data(base64,no prefix) } }
     RESPONSE (200):  { ok:true, parts:{ business_name,
                        texts:[{role,value,verify?}],
                        images:[{label,kind,bbox:[x,y,w,h] 0..1}],
                        brand_colors:[hex] }, diagnostics:{...} }
     ERROR:           { ok:false, error, detail? }
     Origin allow-list: inbxify.com / www.inbxify.com / *.webflow.io.

   Mount: Converter pattern — listens for std:panel:generator
   (ta-studio v1.4.4), self-mounts into #std-generator-mount with
   a panel-body fallback; idempotent.

   Public API: window.InbxAdReformat.mount(selector?)
   Head: load AFTER ta-studio-v1.4.4.js.
   ============================================================ */
(function () {
  'use strict';

  var VERSION = '0.5.0';
  function CFG() { return window.TA_CONFIG || {}; }
  function log() { try { console.log.apply(console, ['[AdReformat v' + VERSION + ']'].concat([].slice.call(arguments))); } catch (e) {} }
  function warn() { try { console.warn.apply(console, ['[AdReformat v' + VERSION + ']'].concat([].slice.call(arguments))); } catch (e) {} }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── State ──
  var S = {
    mounted: false,
    el: null,
    file: null,
    img: null,           // in-memory HTMLImageElement of the source
    previewCanvas: null, // visible source canvas
    busy: false,
    result: null,        // worker parts
    diagnostics: null,
    parts: [],           // [{ label, kind, bbox, canvas }] cropped regions
    layers: [],          // editor layer model
    selected: -1,
    panMode: false,
    _pasteHandler: null
  };

  // Role-ID → label (only if a raw option-id ever appears; the Worker
  // returns semantic strings).
  function roleLabel(role) {
    if (!role) return '';
    var map = (CFG().optionIds && CFG().optionIds.componentRole) || {};
    var inv = {}; Object.keys(map).forEach(function (k) { inv[map[k]] = k; });
    var key = inv[role] || role;
    var nice = {
      bannerAd: 'Banner Ad', sidebarAd: 'Sidebar Ad', splashAd: 'Splash Ad',
      logo: 'Logo', customerLogo: 'Customer Logo', mainImage: 'Main Image',
      headline: 'Headline', tagline: 'Tagline', offer: 'Offer', services: 'Services',
      promo_code: 'Promo Code', phone: 'Phone', web: 'Website', address: 'Address',
      license: 'License', person: 'Person', mascot: 'Mascot', photo: 'Photo',
      graphic: 'Graphic', qr: 'QR Code', coupon: 'Coupon', badge: 'Badge', other: 'Other'
    };
    return nice[key] || String(key).replace(/_/g, ' ');
  }

  // ── Styles ──
  function injectStyles() {
    if (document.getElementById('ix-arf-styles')) return;
    var css = [
      '.ix-arf{font-family:"DM Sans",system-ui,sans-serif;color:#1A3A3A;}',
      '.ix-arf-intro{font-size:13px;color:#6b6f63;margin:0 0 14px;line-height:1.5;}',
      '.ix-arf-drop{border:2px dashed #c9c3b2;border-radius:10px;background:#FAF9F5 !important;',
        'padding:40px 20px;text-align:center;cursor:pointer;transition:border-color .12s,background .12s;}',
      '.ix-arf-drop:hover,.ix-arf-drop.drag{border-color:#5B7FFF;background:#EEF2FF !important;}',
      '.ix-arf-drop-icon{font-size:30px;}',
      '.ix-arf-drop-hint{font-size:14px;font-weight:600;margin-top:8px;}',
      '.ix-arf-drop-sub{font-size:11px;color:#8a8a7a;margin-top:4px;font-family:"DM Mono",monospace;}',
      '.ix-arf-stage{display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;}',
      // canvas wrapper: position context for box overlays; explicit block sizing
      '.ix-arf-srcwrap{position:relative;flex:1 1 380px;min-width:280px;max-width:560px;',
        'border:1px solid #e2ddcd;border-radius:8px;background:#fff !important;}',
      // the canvas itself: scales to wrapper width, keeps aspect; CANNOT collapse
      '.ix-arf-canvas{display:block;width:100%;height:auto;position:relative;z-index:1;background:transparent !important;}',
      '.ix-arf-ov{position:absolute;inset:0;z-index:2;pointer-events:none;background:transparent !important;}',
      '.ix-arf-box{position:absolute;border:2px solid #5B7FFF;background:rgba(91,127,255,.10);border-radius:2px;}',
      '.ix-arf-box .t{position:absolute;top:-17px;left:-2px;background:#5B7FFF;color:#fff;font-size:9px;',
        'font-family:"DM Mono",monospace;padding:1px 5px;border-radius:3px;white-space:nowrap;line-height:1.4;}',
      '.ix-arf-bin{flex:1 1 280px;min-width:260px;}',
      '.ix-arf-bizname{font-size:15px;font-weight:700;color:#1A3A3A;margin-bottom:10px;}',
      '.ix-arf-lbl{font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;',
        'font-family:"DM Mono",monospace;margin:14px 0 6px;}',
      '.ix-arf-sw{display:inline-block;width:22px;height:22px;border-radius:4px;margin-right:5px;',
        'border:1px solid rgba(0,0,0,.12);vertical-align:middle;}',
      '.ix-arf-swhex{font-size:10px;color:#8a8a7a;font-family:"DM Mono",monospace;margin-left:4px;}',
      '.ix-arf-chips{display:flex;flex-wrap:wrap;gap:6px;}',
      '.ix-arf-chip{display:inline-flex;align-items:center;gap:6px;background:#FAF9F5 !important;',
        'border:1px solid #e2ddcd;border-radius:14px;padding:4px 10px;font-size:12px;max-width:100%;}',
      '.ix-arf-chip .r{font-size:9px;font-family:"DM Mono",monospace;color:#fff;background:#C4A35A;',
        'padding:1px 6px;border-radius:8px;text-transform:uppercase;letter-spacing:.04em;}',
      '.ix-arf-chip .r.v{background:#b8860b;}',
      '.ix-arf-chip .val{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px;}',
      // cropped part thumbnails
      '.ix-arf-parts{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;}',
      '.ix-arf-part{border:1px solid #e2ddcd;border-radius:6px;padding:6px;background:#fff !important;',
        'text-align:center;width:96px;}',
      '.ix-arf-part canvas{display:block;max-width:100%;height:auto;margin:0 auto 4px;background:#fff !important;}',
      '.ix-arf-part .pl{font-size:9px;font-family:"DM Mono",monospace;color:#8a8a7a;text-transform:uppercase;}',
      '.ix-arf-actions{display:flex;gap:10px;align-items:center;margin-top:16px;flex-wrap:wrap;}',
      '.ix-arf-status{font-size:12px;font-family:"DM Mono",monospace;}',
      '.ix-arf-status.ok{color:#2e7d52;} .ix-arf-status.err{color:#b23b3b;} .ix-arf-status.work{color:#5B7FFF;}',
      '.ix-arf-spin{display:inline-block;width:13px;height:13px;border:2px solid #c9c3b2;',
        'border-top-color:#5B7FFF;border-radius:50%;animation:ixarfspin .7s linear infinite;vertical-align:-2px;margin-right:6px;}',
      '@keyframes ixarfspin{to{transform:rotate(360deg)}}',
      '.ix-arf-soon{margin-top:18px;padding:10px 12px;border-left:3px solid #C4A35A;background:#FDFCF8 !important;',
        'font-size:12px;color:#6b6f63;border-radius:0 6px 6px 0;line-height:1.5;}',
      // banner editor
      '.ix-arf-edstage-wrap{max-width:700px;width:100%;}',
      '.ix-arf-edstage{position:relative;width:100%;min-height:120px;border:1px solid #c9c3b2;',
        'border-radius:4px;overflow:hidden;}',
      '.ix-arf-layer{position:absolute;box-sizing:border-box;cursor:grab;border:1px solid transparent;}',
      '.ix-arf-layer.sel{border:1.5px dashed #5B7FFF;}',
      '.ix-arf-layer:active{cursor:grabbing;}',
      '.ix-arf-handle{position:absolute;right:-6px;bottom:-6px;width:12px;height:12px;background:#5B7FFF;',
        'border:2px solid #fff;border-radius:2px;cursor:nwse-resize;display:none;}',
      '.ix-arf-layer.sel .ix-arf-handle{display:block;}',
      '.ix-arf-edhint{font-size:11px;color:#8a8a7a;margin-top:8px;line-height:1.5;max-width:700px;}',
      '.ix-arf-ltbar{display:flex;margin-top:10px;max-width:900px;border:1px solid #e6e2d6;border-radius:8px;padding:6px 8px;background:#fff !important;}',
      '.ix-arf-fmtrow{display:flex;align-items:center;gap:6px;flex-wrap:wrap;width:100%;}',
      '.ix-arf-fmtsep{width:1px;align-self:stretch;background:#e6e2d6;margin:2px 4px;}',
      '.ix-arf-tsel{font:500 12px/1 "DM Sans",sans-serif;padding:6px 8px;border:1px solid #c9c3b2;border-radius:5px;background:#fff !important;color:#1A3A3A;max-width:160px;}',
      '.ix-arf-tnum{width:58px;font:500 13px/1 "DM Sans",sans-serif;padding:6px 8px;border:1px solid #c9c3b2;border-radius:5px;background:#fff !important;color:#1A3A3A;}',
      '.ix-arf-unit{font:500 10px/1 "DM Mono",monospace;color:#8a8a7a;margin-left:-2px;}',
      '.ix-arf-talign{display:inline-flex;gap:2px;}',
      // action bar
      '.ix-arf-actionbar{display:flex;align-items:center;gap:8px;margin:6px 0;}',
      '.ix-arf-actbtn{font:600 12px/1 "DM Sans",sans-serif;padding:8px 12px;border:1px solid #c9c3b2;border-radius:6px;background:#fff !important;color:#1A3A3A;cursor:pointer;}',
      '.ix-arf-actbtn:hover{border-color:#5B7FFF;color:#5B7FFF;}',
      '.ix-arf-acthint{font:400 11px/1.3 "DM Sans",sans-serif;color:#9a9a8a;margin-left:6px;}',
      // brand bar (kit info + logo drop)
      '.ix-arf-brandbar{display:flex;gap:12px;margin:4px 0 10px;align-items:stretch;flex-wrap:wrap;}',
      '.ix-arf-brandkit{flex:1 1 380px;border:1px solid #e6e2d6;border-radius:8px;padding:8px 10px;background:#FDFCF8 !important;}',
      '.ix-arf-bk-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:3px 0;}',
      '.ix-arf-bk-lbl{font:600 9px/1.2 "DM Mono",monospace;letter-spacing:.05em;text-transform:uppercase;color:#6b6f63;min-width:96px;}',
      '.ix-arf-bk-chip{display:inline-flex;align-items:center;gap:5px;font:500 11px/1 "DM Mono",monospace;padding:4px 8px;border:1px solid #d4cfbf;border-radius:12px;background:#fff !important;color:#1A3A3A;cursor:pointer;}',
      '.ix-arf-bk-chip.copied{border-color:#3f9142;color:#3f9142;}',
      '.ix-arf-bk-sw{width:12px;height:12px;border-radius:3px;border:1px solid rgba(0,0,0,.15);display:inline-block;}',
      '.ix-arf-bk-none{font:400 10px/1 "DM Sans",sans-serif;color:#9a9a8a;}',
      '.ix-arf-bk-note{font:italic 400 9px/1.2 "DM Sans",sans-serif;color:#a09a88;margin-left:4px;}',
      '.ix-arf-logodrop{flex:0 0 220px;border:2px dashed #c9c3b2;border-radius:8px;background:#fff !important;display:flex;align-items:center;justify-content:center;min-height:76px;transition:border-color .15s;}',
      '.ix-arf-logodrop.over{border-color:#5B7FFF;background:#EEF2FF !important;}',
      '.ix-arf-logodrop-in{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:10px;text-align:center;}',
      '.ix-arf-logodrop-ic{font-size:18px;color:#8a8a7a;}',
      '.ix-arf-logodrop-t{font:500 11px/1.3 "DM Sans",sans-serif;color:#6b6f63;}',
      '.ix-arf-logodrop-done{width:100%;padding:8px;}',
      '.ix-arf-logo-prev{text-align:center;margin-bottom:6px;}',
      '.ix-arf-logo-prev img{max-height:44px;max-width:100%;}',
      '.ix-arf-logo-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;}',
      '.ix-arf-logo-url{font:400 8px/1.3 "DM Mono",monospace;color:#9a9a8a;word-break:break-all;margin-top:5px;text-align:center;}',
      '.ix-arf-logo-up{font:500 11px/1 "DM Sans",sans-serif;color:#5B7FFF;}',
      '.ix-arf-logo-err{font:500 11px/1.3 "DM Sans",sans-serif;color:#b23b3b;}',
      '.ix-revert{font:500 10px/1 "DM Sans",sans-serif;color:#8a6d3b;text-decoration:underline;cursor:pointer;}',
      // color button
      '.ix-arf-colorbtn{display:inline-flex;align-items:center;gap:6px;font:600 12px/1 "DM Sans",sans-serif;',
        'padding:5px 9px;border:1px solid #c9c3b2;border-radius:6px;background:#fff !important;color:#1A3A3A;cursor:pointer;}',
      '.ix-arf-colorbtn-sw{width:16px;height:16px;border-radius:3px;border:1px solid rgba(0,0,0,.18);display:inline-block;}',
      '.ix-arf-colorbtn-car{font-size:9px;color:#8a8a7a;}',
      // popover
      '.ix-arf-colorpop{position:fixed;z-index:99999;background:#fff;border:1px solid #c9c3b2;border-radius:10px;',
        'box-shadow:0 8px 28px rgba(0,0,0,.18);padding:10px;width:208px;}',
      '.ix-arf-popgrid{display:grid;grid-template-columns:repeat(8,1fr);gap:4px;margin-bottom:8px;}',
      '.ix-arf-popsw{width:20px;height:20px;border-radius:4px;border:1px solid rgba(0,0,0,.18);cursor:pointer;padding:0;}',
      '.ix-arf-popsw.sel{outline:2px solid #5B7FFF;outline-offset:1px;}',
      '.ix-arf-popopt{display:flex;align-items:center;gap:8px;width:100%;font:500 12px/1 "DM Sans",sans-serif;',
        'padding:8px 6px;border:0;border-top:1px solid #eee;background:#fff;color:#1A3A3A;cursor:pointer;text-align:left;}',
      '.ix-arf-popt-x{width:14px;height:14px;border:1px solid #c33;position:relative;display:inline-block;border-radius:2px;}',
      '.ix-arf-popopt input[type=color]{width:24px;height:24px;border:1px solid #c9c3b2;border-radius:4px;padding:0;background:none;cursor:pointer;}',
      '.ix-arf-ltlbl{font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;font-family:"DM Mono",monospace;margin-right:4px;}',
      '.ix-arf-bgsw{width:22px;height:22px;border-radius:4px;border:1px solid rgba(0,0,0,.15);cursor:pointer;padding:0;}',
      '.ix-arf-bgsw.sel{outline:2px solid #5B7FFF;outline-offset:1px;}',
      '.ix-arf-ltcustom{display:inline-flex;align-items:center;}',
      '.ix-arf-ltcustom input{width:26px;height:26px;border:1px solid #c9c3b2;border-radius:4px;cursor:pointer;background:none;padding:0;}',
      '.ix-arf-ltsep{width:1px;height:20px;background:#d4cfbf;margin:0 4px;}',
      '.ix-arf-zoom{width:120px;cursor:pointer;}',
      '.ix-arf-ltbtn{font:600 11px/1 "DM Sans",sans-serif;padding:6px 10px;border:1px solid #c9c3b2;',
        'border-radius:14px;background:#fff !important;color:#1A3A3A;cursor:pointer;}',
      '.ix-arf-ltbtn.on{background:#EEF2FF !important;border-color:#5B7FFF;color:#5B7FFF;}',
      '.ix-arf-ltchk{font:500 11px/1 "DM Sans",sans-serif;color:#1A3A3A;display:inline-flex;align-items:center;gap:4px;cursor:pointer;}',
      '.ix-arf-ltchk input{cursor:pointer;}',
      // crop-from-source overlay
      '.ix-arf-crop{margin-top:16px;border:1px solid #c9c3b2;border-radius:8px;padding:12px;background:#fff !important;}',
      '.ix-arf-crop-bar{display:flex;align-items:center;gap:8px;margin-bottom:10px;}',
      '.ix-arf-crop-title{font:600 12px/1.3 "DM Sans",sans-serif;color:#1A3A3A;}',
      '.ix-arf-crop-surfwrap{max-width:760px;}',
      '.ix-arf-crop-surf{position:relative;width:100%;line-height:0;user-select:none;overflow:hidden;}',
      '.ix-arf-crop-surf canvas{display:block;width:100%;cursor:crosshair;}',
      '.ix-arf-crop-rect{position:absolute;border:2px solid #5B7FFF;background:transparent;',
        'box-sizing:border-box;cursor:move;box-shadow:0 0 0 9999px rgba(0,0,0,.40);}',
      '.ix-arf-export{margin-top:18px;padding:12px 14px;border:1px solid #d4cfbf;border-radius:8px;background:#FDFCF8 !important;}',
      '.ix-arf-exprow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px;}',
      '.ix-arf-adv{font:500 13px/1 "DM Sans",sans-serif;padding:7px 10px;border:1px solid #c9c3b2;border-radius:6px;background:#fff !important;color:#1A3A3A;min-width:200px;}',
      '.ix-arf-tsel{font:500 12px/1 "DM Sans",sans-serif;padding:5px 6px;border:1px solid #c9c3b2;border-radius:5px;background:#fff !important;color:#1A3A3A;max-width:170px;}',
      '.ix-arf-tnum{width:64px;font:500 13px/1 "DM Sans",sans-serif;padding:6px 8px;border:1px solid #c9c3b2;border-radius:5px;background:#fff !important;color:#1A3A3A;}',
      '.ix-arf-unit{font:500 10px/1 "DM Mono",monospace;color:#8a8a7a;margin-left:-2px;}',
      '.ix-arf-tcolors,.ix-arf-talign{display:inline-flex;align-items:center;gap:3px;}',
      // labeled rows
      '.ix-arf-trow{display:flex;align-items:center;gap:8px;padding:5px 0;border-top:1px solid #efece1;}',
      '.ix-arf-trow:first-child{border-top:0;}',
      '.ix-arf-rowlbl{flex:0 0 84px;font:600 10px/1.2 "DM Mono",monospace;letter-spacing:.04em;text-transform:uppercase;color:#6b6f63;text-align:right;}',
      '.ix-arf-rowctl{display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex:1;}',
      '.ix-arf-sw{width:24px;height:24px;border-radius:5px;border:1px solid rgba(0,0,0,.18);cursor:pointer;padding:0;}',
      '.ix-arf-sw.sel{outline:2px solid #5B7FFF;outline-offset:1px;}',
      // isolate-object overlay (v0.5.0)
      '.ix-arf-iso{margin-top:16px;border:1px solid #c9c3b2;border-radius:8px;padding:12px;background:#fff !important;}',
      '.ix-arf-iso-bar{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;}',
      '.ix-arf-iso-title{font:600 12px/1.3 "DM Sans",sans-serif;color:#1A3A3A;}',
      '.ix-arf-iso-seg{display:inline-flex;border:1px solid #c9c3b2;border-radius:7px;overflow:hidden;}',
      '.ix-arf-iso-seg button{font:600 11px/1 "DM Sans",sans-serif;padding:7px 12px;border:0;border-right:1px solid #c9c3b2;background:#fff !important;color:#1A3A3A;cursor:pointer;}',
      '.ix-arf-iso-seg button:last-child{border-right:0;}',
      '.ix-arf-iso-seg button.on{background:#1A3A3A !important;color:#fff;}',
      '.ix-arf-iso-mode{font:500 12px/1 "DM Sans",sans-serif;padding:7px 8px;border:1px solid #c9c3b2;border-radius:6px;background:#fff !important;color:#1A3A3A;}',
      '.ix-arf-iso-txt{flex:1 1 220px;font:500 12px/1 "DM Sans",sans-serif;padding:8px 10px;border:1px solid #c9c3b2;border-radius:6px;background:#fff !important;color:#1A3A3A;}',
      '.ix-arf-iso-surfwrap{max-width:760px;}',
      '.ix-arf-iso-surf{position:relative;width:100%;line-height:0;user-select:none;overflow:hidden;}',
      '.ix-arf-iso-surf canvas{display:block;width:100%;cursor:crosshair;}',
      '.ix-arf-iso-rect{position:absolute;border:2px dashed #C4A35A;background:transparent;box-sizing:border-box;cursor:move;box-shadow:0 0 0 9999px rgba(0,0,0,.35);}',
      '.ix-arf-iso-dot{position:absolute;width:14px;height:14px;border-radius:50%;border:2.5px solid #C4A35A;transform:translate(-50%,-50%);pointer-events:none;box-shadow:0 0 0 2px rgba(18,43,43,.5);}',
      '.ix-arf-iso-run{display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap;}',
      '.ix-arf-iso-clear{font:500 11px/1 "DM Sans",sans-serif;color:#8a8a7a;background:none !important;border:0;cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:4px 2px;}',
      '.ix-arf-iso-result{margin-top:14px;display:none;}',
      '.ix-arf-iso-frame{border:1px solid #c9c3b2;border-radius:8px;overflow:hidden;max-width:420px;}',
      '.ix-arf-iso-frame canvas{display:block;width:100%;}',
      '.ix-arf-iso-meta{font:500 10px/1.4 "DM Mono",monospace;color:#8a8a7a;margin:8px 0 10px;letter-spacing:.04em;}',
      '.ix-arf-iso-acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}',
      '.ix-arf-iso-custrow{display:none;align-items:center;gap:10px;margin-top:12px;padding:10px 12px;border:1px solid #d4cfbf;border-radius:8px;background:#FDFCF8 !important;flex-wrap:wrap;}'
    ].join('');
    var st = document.createElement('style'); st.id = 'ix-arf-styles'; st.textContent = css;
    document.head.appendChild(st);
  }

  // ── Mount (Converter pattern) ──
  function findContainer(sel) {
    if (sel) { var s = document.querySelector(sel); if (s) return s; }
    return document.querySelector('#std-generator-mount') ||
           document.querySelector('[data-std-panel-body="generator"]') || null;
  }
  function mount(sel) {
    var c = findContainer(sel);
    if (!c) { warn('mount: no Generator container yet'); return false; }
    injectStyles();
    var host = c;
    if (c.matches && c.matches('[data-std-panel-body="generator"]')) {
      var inner = c.querySelector('#std-generator-mount');
      if (!inner) {
        inner = document.createElement('div'); inner.id = 'std-generator-mount';
        var ph = c.querySelector('.std-placeholder'); if (ph) ph.style.display = 'none';
        c.appendChild(inner);
      }
      host = inner;
    }
    if (S.mounted && S.el === host && document.body.contains(host) && host.querySelector('#ix-arf-root')) return true;
    host.innerHTML = '<div class="ix-arf"><div id="ix-arf-root"></div></div>';
    S.el = host; S.mounted = true;
    renderIntake();
    log('mounted into', host.id || 'generator panel');
    return true;
  }

  // ── Intake ──
  function renderIntake() {
    resetState();
    var root = document.getElementById('ix-arf-root'); if (!root) return;
    root.innerHTML =
      '<p class="ix-arf-intro">Drop an existing ad and the Reformatter reads it apart — ' +
      'business name, brand colors, logo and image regions, and the headline / offer / contact text — ' +
      'then crops each region so you can rebuild the ad at newsletter sizes.</p>' +
      '<div class="ix-arf-drop" id="ix-arf-drop" tabindex="0" role="button" aria-label="Add an ad image">' +
        '<div class="ix-arf-drop-icon">\u2728</div>' +
        '<div class="ix-arf-drop-hint">Drop an ad, click to browse, or paste (\u2318V / Ctrl+V)</div>' +
        '<div class="ix-arf-drop-sub">JPG / PNG / WEBP \u2014 the whole ad, as-is</div>' +
        '<input type="file" id="ix-arf-file" accept="image/png,image/jpeg,image/jpg,image/webp" hidden>' +
      '</div>' +
      '<div class="ix-arf-soon">Next build: arrange the cropped parts, composite a 700\u00d7235 banner and ' +
      '480\u00d7400 sidebar, then export and save to the ad record.</div>';
    wireDrop();
  }
  function resetState() {
    S.file = null; S.img = null; S.previewCanvas = null;
    S.result = null; S.diagnostics = null; S.parts = [];
  }
  function validate(f) {
    return f && (/^image\/(jpeg|jpg|png|webp)$/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name || ''));
  }

  function wireDrop() {
    var drop = document.getElementById('ix-arf-drop');
    var file = document.getElementById('ix-arf-file');
    if (!drop || !file) return;
    drop.addEventListener('click', function () { file.click(); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
    file.addEventListener('change', function () { if (file.files[0]) loadFile(file.files[0]); file.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('drag'); }); });
    drop.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) loadFile(f); });
    wirePaste();
  }
  function wirePaste() {
    if (S._pasteHandler) { document.removeEventListener('paste', S._pasteHandler); S._pasteHandler = null; }
    var handler = function (e) {
      if (!S.el || !document.body.contains(S.el)) { document.removeEventListener('paste', handler); S._pasteHandler = null; return; }
      if (!document.getElementById('ix-arf-drop')) return;
      var ae = document.activeElement; if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName)) return;
      var items = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf('image/') === 0) {
          var blob = items[i].getAsFile(); if (!blob) continue;
          e.preventDefault();
          var ext = blob.type === 'image/jpeg' ? 'jpg' : (blob.type === 'image/webp' ? 'webp' : 'png');
          loadFile(new File([blob], 'pasted-ad-' + Date.now() + '.' + ext, { type: blob.type }));
          return;
        }
      }
    };
    S._pasteHandler = handler; document.addEventListener('paste', handler);
  }

  // ── Load → decode into in-memory Image (NOT a DOM <img> in flow) ──
  function loadFile(f) {
    if (!validate(f)) { flashErr('That file type won\u2019t work \u2014 use JPG, PNG, or WEBP.'); return; }
    S.file = f;
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () { S.img = img; renderStaged(); };
      img.onerror = function () { flashErr('Couldn\u2019t decode that image. Try another.'); };
      img.src = reader.result; // in-memory; never attached to the flow layout
    };
    reader.onerror = function () { flashErr('Couldn\u2019t read that file. Try another.'); };
    reader.readAsDataURL(f);
  }
  function flashErr(msg) {
    var sub = document.querySelector('#ix-arf-drop .ix-arf-drop-sub');
    if (sub) { sub.textContent = msg; sub.style.color = '#b23b3b'; }
  }

  // ── Staged: render preview inside an ISOLATED IFRAME ──
  // Every prior approach (img, canvas) was defeated by the T-A page's
  // global CSS — the canvas measured visible/onTop/opaque yet showed
  // white, and its aspect-ratio was overridden (rect 558×372 where the
  // bitmap demanded 558×139). Rather than keep losing a fight against an
  // unseen cascade, the preview now lives in a same-origin iframe with
  // its OWN document. The page's publisher-wrapper resets and unknown
  // !important rules cannot reach inside it. We draw the source (and the
  // boxes) into the iframe's own canvas. v0.2.3.
  function renderStaged() {
    var root = document.getElementById('ix-arf-root'); if (!root) return;
    root.innerHTML =
      '<div class="ix-arf-stage">' +
        '<div class="ix-arf-srcwrap" id="ix-arf-srcwrap">' +
          '<iframe id="ix-arf-frame" title="Ad preview" ' +
            'style="display:block;width:100%;border:0;background:#fff;"></iframe>' +
        '</div>' +
        '<div class="ix-arf-bin" id="ix-arf-bin">' +
          '<p class="ix-arf-intro">Source loaded. Extraction reads the ad apart and crops each ' +
          'detected region into a reusable part.</p>' +
        '</div>' +
      '</div>' +
      '<div class="ix-arf-actions">' +
        '<button class="ix-btn ix-btn--primary" id="ix-arf-extract">Extract parts</button>' +
        '<button class="ix-btn ix-btn--ghost" id="ix-arf-reset">Use a different ad</button>' +
        '<span class="ix-arf-status" id="ix-arf-status"></span>' +
      '</div>';
    paintFrame([]);   // initial paint, no boxes yet
    document.getElementById('ix-arf-extract').addEventListener('click', extract);
    document.getElementById('ix-arf-reset').addEventListener('click', renderIntake);
  }

  // Build the iframe's document from scratch and draw the source + boxes
  // into a canvas inside it. boxes = array of {bbox:[x,y,w,h], label}.
  function paintFrame(boxes) {
    var frame = document.getElementById('ix-arf-frame');
    if (!frame || !S.img) return;
    var w = S.img.naturalWidth || S.img.width;
    var h = S.img.naturalHeight || S.img.height;

    var doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
    if (!doc) { setTimeout(function () { paintFrame(boxes); }, 30); return; }

    // Size the iframe element to the source aspect at the wrapper's width.
    // Read the wrapper width and set the iframe height to match aspect, so
    // there is no flex-stretch and no external CSS in play.
    var wrap = document.getElementById('ix-arf-srcwrap');
    var dispW = (wrap && wrap.clientWidth) ? wrap.clientWidth : 540;
    var dispH = Math.round(dispW * (h / w));
    frame.style.height = dispH + 'px';

    // Boxes as absolutely-positioned divs in the iframe doc (percentages).
    var boxHtml = (boxes || []).map(function (b) {
      var bb = b.bbox || [0, 0, 0, 0];
      return '<div class="bx" style="left:' + (bb[0] * 100) + '%;top:' + (bb[1] * 100) +
             '%;width:' + (bb[2] * 100) + '%;height:' + (bb[3] * 100) + '%">' +
             '<span>' + esc(b.label || '') + '</span></div>';
    }).join('');

    doc.open();
    doc.write(
      '<!doctype html><html><head><meta charset="utf-8"><style>' +
      'html,body{margin:0;padding:0;background:#fff;}' +
      '.stage{position:relative;width:100%;line-height:0;}' +
      'canvas{display:block;width:100%;height:auto;}' +
      '.bx{position:absolute;border:2px solid #5B7FFF;background:rgba(91,127,255,.10);box-sizing:border-box;}' +
      '.bx span{position:absolute;top:-16px;left:-2px;background:#5B7FFF;color:#fff;font:9px/1.4 monospace;padding:1px 5px;border-radius:3px;white-space:nowrap;}' +
      '</style></head><body><div class="stage">' +
      '<canvas id="c"></canvas>' + boxHtml +
      '</div></body></html>'
    );
    doc.close();

    // Draw the source into the iframe's canvas. Same-origin → no taint.
    var cv = doc.getElementById('c');
    if (cv) {
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(S.img, 0, 0);
      S.previewCanvas = cv;
    }
  }

  function setStatus(kind, msg, spin) {
    var s = document.getElementById('ix-arf-status'); if (!s) return;
    s.className = 'ix-arf-status ' + (kind || '');
    s.innerHTML = (spin ? '<span class="ix-arf-spin"></span>' : '') + esc(msg || '');
  }

  // ── Extract ──
  function extract() {
    if (S.busy) return;
    var worker = CFG().adReformatWorker;
    if (!worker) { setStatus('err', 'No adReformatWorker configured.'); return; }
    var btn = document.getElementById('ix-arf-extract');
    S.busy = true; if (btn) btn.disabled = true;
    setStatus('work', 'Reading the ad\u2026', true);

    var dataUrl = (S.file && S.previewCanvas) ? null : null;
    // Use the canvas to produce clean base64 (also normalizes odd source
    // encodings). Fall back to the original file bytes if toDataURL fails.
    var b64, mime;
    try {
      var out = S.previewCanvas.toDataURL('image/jpeg', 0.92);
      b64 = out.split(',')[1]; mime = 'image/jpeg';
    } catch (e) {
      warn('canvas toDataURL failed, using file reader fallback', e);
    }

    var go = function (base64, mediaType) {
      fetch(worker, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: { media_type: mediaType, data: base64 } })
      })
        .then(function (r) {
          return r.text().then(function (t) {
            var data; try { data = JSON.parse(t); } catch (e) { throw new Error('Worker returned non-JSON: ' + t.slice(0, 120)); }
            if (!r.ok || data.ok === false) {
              throw new Error((data.error || ('Worker HTTP ' + r.status)) + (data.detail ? ' \u2014 ' + String(data.detail).slice(0, 120) : ''));
            }
            return data;
          });
        })
        .then(function (data) {
          S.result = data.parts || {}; S.diagnostics = data.diagnostics || null;
          cropParts(S.result);
          renderExtract(S.result);
          var nImg = (S.result.images || []).length, nTxt = (S.result.texts || []).length;
          var dd = data.diagnostics;
          var merged = (dd && dd.raw_text_count > dd.deduped_text_count)
            ? ' (' + (dd.raw_text_count - dd.deduped_text_count) + ' duplicate merged)' : '';
          setStatus('ok', 'Read ' + nImg + ' region' + (nImg === 1 ? '' : 's') + ', ' + nTxt + ' text part' + (nTxt === 1 ? '' : 's') + merged + '. Cropped ' + S.parts.length + '.');
        })
        .catch(function (err) { warn('extract failed', err); setStatus('err', err.message || 'Extraction failed.'); })
        .finally(function () { S.busy = false; if (btn) btn.disabled = false; });
    };

    if (b64) { go(b64, mime); }
    else {
      // fallback: re-read the original file
      var reader = new FileReader();
      reader.onload = function () { var o = reader.result; go(o.split(',')[1], S.file.type === 'image/jpg' ? 'image/jpeg' : (S.file.type || 'image/png')); };
      reader.onerror = function () { S.busy = false; if (btn) btn.disabled = false; setStatus('err', 'Could not encode image.'); };
      reader.readAsDataURL(S.file);
    }
  }

  // ── Crop each image region from the source canvas into a part canvas ──
  // This is the Pieces-3+4 foundation: every detected region becomes a
  // standalone canvas we can later draw into the 700×235 / 480×400 comps.
  function cropParts(p) {
    S.parts = [];
    if (!S.img) return;
    var W = S.img.naturalWidth || S.img.width;
    var H = S.img.naturalHeight || S.img.height;
    (p.images || []).forEach(function (im) {
      var b = im.bbox || [0, 0, 0, 0];
      var sx = Math.round(b[0] * W), sy = Math.round(b[1] * H);
      var sw = Math.round(b[2] * W), sh = Math.round(b[3] * H);
      if (sw < 2 || sh < 2) return;
      var c = document.createElement('canvas');
      c.width = sw; c.height = sh;
      try { c.getContext('2d').drawImage(S.img, sx, sy, sw, sh, 0, 0, sw, sh); }
      catch (e) { warn('crop failed for', im.label, e); return; }
      S.parts.push({ label: im.label || im.kind || 'part', kind: im.kind || 'other', bbox: b, canvas: c });
    });
  }

  // ── Render extracted parts + overlays + cropped thumbnails ──
  function renderExtract(p) {
    paintFrame(p.images || []);   // repaint iframe preview with boxes
    var bin = document.getElementById('ix-arf-bin'); if (!bin) return;
    var html = '<div class="ix-arf-bizname">' + esc(p.business_name || '(no business name detected)') + '</div>';

    var colors = p.brand_colors || [];
    if (colors.length) {
      html += '<div class="ix-arf-lbl">Brand colors</div><div>';
      colors.forEach(function (c) { html += '<span class="ix-arf-sw" style="background:' + esc(c) + ' !important"></span>'; });
      html += '<span class="ix-arf-swhex">' + esc(colors.join('  ')) + '</span></div>';
    }

    var imgs = p.images || [];
    html += '<div class="ix-arf-lbl">Cropped parts (' + S.parts.length + ' of ' + imgs.length + ')</div>';
    html += '<div class="ix-arf-parts" id="ix-arf-parts"></div>';

    var txts = p.texts || [];
    html += '<div class="ix-arf-lbl">Text (' + txts.length + ')</div><div class="ix-arf-chips">';
    if (!txts.length) html += '<span class="ix-arf-chip"><span class="val">none detected</span></span>';
    txts.forEach(function (t) {
      var v = t.verify ? '<span class="r v" title="Small text \u2014 confirm">verify</span>' : '';
      html += '<span class="ix-arf-chip"><span class="r">' + esc(roleLabel(t.role) || 'text') + '</span>' + v +
              '<span class="val" title="' + esc(t.value) + '">' + esc(t.value || '') + '</span></span>';
    });
    html += '</div>';
    bin.innerHTML = html;

    // Attach the cropped part canvases (live nodes, not markup).
    var holder = document.getElementById('ix-arf-parts');
    if (holder) {
      if (!S.parts.length) holder.innerHTML = '<span class="ix-arf-chip"><span class="val">no image regions cropped</span></span>';
      S.parts.forEach(function (part) {
        var wrap = document.createElement('div'); wrap.className = 'ix-arf-part';
        // display copy scaled down; keep the full-res canvas in S.parts
        part.canvas.style.maxWidth = '84px';
        wrap.appendChild(part.canvas);
        var lbl = document.createElement('div'); lbl.className = 'pl'; lbl.textContent = roleLabel(part.kind) || part.label;
        wrap.appendChild(lbl);
        holder.appendChild(wrap);
      });
    }

    // Build-banner entry: opens the drag/resize editor below.
    var actions = document.querySelector('.ix-arf-actions');
    if (actions && !document.getElementById('ix-arf-build')) {
      var b = document.createElement('button');
      b.className = 'ix-btn ix-btn--secondary'; b.id = 'ix-arf-build';
      b.textContent = 'Build banner \u2192';
      b.addEventListener('click', openEditor);
      actions.insertBefore(b, actions.querySelector('#ix-arf-reset'));
    }
  }

  // ════════════════════════════════════════════════════════════
  //  BANNER EDITOR (v0.3.0) — drag + resize core, 700×235.
  //  Layers are DOM nodes (img/text) absolutely positioned over a
  //  banner-sized stage INSIDE THE IFRAME (clean CSS). Drag to move,
  //  corner handle to resize. Export/snap/save come later.
  // ════════════════════════════════════════════════════════════
  var BANNER_W = 700, BANNER_H = 235;

  // HC-ARF-FONTS-01 — font picker list. Hardcoded from the project's
  // loaded Google fonts + installed custom fonts (per Jeff's Webflow
  // font screenshots, 2026-06-18). Because the banner is RASTERIZED to
  // PNG, any font loaded in the browser at compose time renders — but
  // compose must await document.fonts.load() first or canvas draws the
  // fallback. Flat alphabetical. Update here if the project's fonts change.
  var ARF_FONTS = [
    'Abril Fatface', 'Bebas Neue', 'Bevan', 'Castoro', 'CastoroTitling',
    'DM Mono', 'DM Sans', 'DM Serif Display', 'DM Serif Text', 'EB Garamond',
    'Francois One', 'Fraunces', 'Graduate', 'Hammersmith One',
    'Instrument Sans', 'Instrument Serif', 'Inter', 'Kaushan Script',
    'Libre Baskerville', 'Libre Caslon Display', 'Libre Caslon Text',
    'Manrope', 'Montecarlo', 'Neuemontreal', 'Nunito', 'Oxford Laqy',
    'Parisienne', 'Playfair Display', 'Playfair Display SC', 'Poppins',
    'Roboto Serif', 'Rosarivo', 'Sedgwick Ave', 'SF Pro Display',
    'Spectral', 'Spectral SC', 'Tenor Sans', 'Work Sans'
  ];
  // Map a family name to a CSS font stack (quote the family, add a sane fallback).
  function fontStack(fam) {
    var serif = /Serif|Garamond|Baskerville|Caslon|Fraunces|Playfair|Spectral|Bevan|Abril|Rosarivo|Castoro|Tenor/i.test(fam);
    return "'" + fam + "', " + (serif ? 'serif' : 'sans-serif');
  }

  // Build the layer model from extracted parts (rough auto-place).
  function buildLayers() {
    var layers = [];
    var imgParts = S.parts.slice();
    var photo = null, rest = [];
    imgParts.forEach(function (p) { if (!photo && /photo|family|hero|image/.test((p.kind || '') + (p.label || ''))) photo = p; else rest.push(p); });
    if (!photo && imgParts.length) { photo = imgParts[0]; rest = imgParts.slice(1); }

    if (photo) {
      var pw0 = photo.canvas.width, ph0 = photo.canvas.height;
      var w0 = Math.round(BANNER_W * 0.58);
      var h0 = Math.min(BANNER_H, Math.round(w0 * (ph0 / pw0)));
      layers.push(mkImgLayer(photo, 0, 0, w0, h0));
    }
    var rx = Math.round(BANNER_W * 0.60), ry = 12;
    rest.forEach(function (p) {
      var pw = p.canvas.width, ph = p.canvas.height;
      var scale = Math.min(120 / pw, 80 / ph, 1);
      layers.push(mkImgLayer(p, rx, ry, Math.round(pw * scale), Math.round(ph * scale)));
      ry += Math.round(ph * scale) + 8;
    });

    var ty = Math.max(ry, 90);
    (S.result.texts || []).slice(0, 5).forEach(function (t) {
      var L = { type: 'text', value: t.value, role: t.role,
        x: rx, y: ty, w: BANNER_W - rx - 14, h: 24,
        size: t.role === 'headline' ? 18 : 13,
        color: (S.result.brand_colors && S.result.brand_colors[1]) || '#1A3A3A',
        weight: (t.role === 'headline' || t.role === 'offer') ? 700 : 400,
        font: (t.role === 'headline') ? "'Fraunces', serif" : "'DM Sans', sans-serif",
        align: 'left',
        bg: 'transparent' };
      L.initial = snapshot(L);
      layers.push(L);
      ty += 26;
    });
    return layers;
  }

  // CROP MODEL (v0.3.3): the layer box is a free-shape CONTAINER. The
  // image fills it (cover) keeping its OWN aspect, and is pannable/zoomable
  // so you choose WHICH PART shows; the container clips the rest.
  //   natW/natH  = image's intrinsic pixels (drives true aspect)
  //   imgZoom    = user zoom multiplier ON TOP of cover-fit (1 = just cover)
  //   imgOx/imgOy= pan offset in container px (0 = centered)
  //   lockRatio  = when true, resizing the container holds its current ratio
  function mkImgLayer(part, x, y, w, h) {
    var L = {
      type: 'img', canvas: part.canvas, label: part.label, kind: part.kind,
      x: x, y: y, w: w, h: h, bg: 'transparent',
      natW: part.canvas.width, natH: part.canvas.height,
      imgZoom: 1, imgOx: 0, imgOy: 0, lockRatio: false
    };
    L.initial = snapshot(L);
    return L;
  }

  // Shallow snapshot for per-layer reset.
  function snapshot(L) {
    return { x: L.x, y: L.y, w: L.w, h: L.h, bg: L.bg,
      imgZoom: L.imgZoom, imgOx: L.imgOx, imgOy: L.imgOy,
      canvas: L.canvas, natW: L.natW, natH: L.natH,
      value: L.value, size: L.size, color: L.color, weight: L.weight,
      font: L.font, align: L.align };
  }

  // Compute the cover-fit dimensions of the image inside a container,
  // then apply user zoom. Returns {w,h,left,top} in container px.
  function coverGeom(L) {
    var cw = L.w, ch = L.h;
    var ar = L.natW / L.natH;            // image aspect
    var car = cw / ch;                   // container aspect
    var baseW, baseH;
    if (ar > car) { baseH = ch; baseW = ch * ar; }   // image wider → match height
    else { baseW = cw; baseH = cw / ar; }            // image taller → match width
    var z = L.imgZoom || 1;
    var iw = baseW * z, ih = baseH * z;
    // center, then apply pan
    var left = (cw - iw) / 2 + (L.imgOx || 0);
    var top = (ch - ih) / 2 + (L.imgOy || 0);
    return { w: iw, h: ih, left: left, top: top };
  }

  // ── Autosave / restore (v0.4.8) ──
  // Persist the editor's layers (incl. cropped canvases as dataURLs) to
  // localStorage, debounced, keyed per title+advertiser-context. Restores
  // on open so a refresh / accidental reload never throws away your work.
  function autosaveKey() {
    var cfg = CFG();
    var biz = (S.result && S.result.business_name || '').replace(/\W+/g, '').toLowerCase();
    return 'ixarf:' + (cfg.titleSlug || 't') + ':' + (biz || 'ad');
  }
  function serializeLayers() {
    return S.layers.map(function (L) {
      var o = {};
      for (var k in L) { if (k === 'canvas' || k === 'initial') continue; o[k] = L[k]; }
      if (L.canvas) { try { o._canvasData = L.canvas.toDataURL('image/png'); } catch (e) {} }
      return o;
    });
  }
  var _saveTimer = null;
  function persist() {
    if (!S.layers || !S.layers.length) return;
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(autosaveKey(), JSON.stringify({ t: Date.now(), layers: serializeLayers() }));
      } catch (e) { /* quota / disabled — non-fatal */ }
    }, 400);
  }
  function loadSaved() {
    try {
      var raw = localStorage.getItem(autosaveKey());
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function clearSaved() { try { localStorage.removeItem(autosaveKey()); } catch (e) {} }
  // Rebuild layers (incl. canvases) from a saved snapshot.
  function restoreLayers(saved, done) {
    var layers = saved.layers || [];
    var pending = 0, built = new Array(layers.length);
    layers.forEach(function (o, i) {
      var L = {}; for (var k in o) { if (k === '_canvasData') continue; L[k] = o[k]; }
      if (o._canvasData) {
        pending++;
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
          c.getContext('2d').drawImage(img, 0, 0);
          L.canvas = c; L.natW = c.width; L.natH = c.height;
          built[i] = L; if (--pending === 0) finish();
        };
        img.onerror = function () { built[i] = L; if (--pending === 0) finish(); };
        img.src = o._canvasData;
      } else { built[i] = L; }
    });
    function finish() { done(built); }
    if (pending === 0) done(built);
  }

  function openEditor() {
    S.selected = -1;
    var saved = loadSaved();
    if (saved && saved.layers && saved.layers.length &&
        confirm('Restore your previous banner edits for this ad? (Cancel starts fresh.)')) {
      restoreLayers(saved, function (layers) {
        S.layers = layers;
        layers.forEach(function (L) { L.initial = snapshot(L); });
        buildEditorShell();
      });
      return;
    }
    S.layers = buildLayers();
    buildEditorShell();
  }

  function buildEditorShell() {
    var root = document.getElementById('ix-arf-root');
    var existing = document.getElementById('ix-arf-editor');
    if (existing) existing.remove();
    var ed = document.createElement('div');
    ed.id = 'ix-arf-editor';
    ed.innerHTML =
      '<div class="ix-arf-lbl" style="margin-top:20px">Banner editor \u2014 700\u00d7235</div>' +
      '<div class="ix-arf-actionbar">' +
        '<button class="ix-arf-actbtn" id="ix-arf-addtext">+ Add text</button>' +
        '<button class="ix-arf-actbtn" id="ix-arf-delete" title="Delete selected (or press Delete)">\u2715 Delete</button>' +
        '<button class="ix-arf-actbtn" id="ix-arf-isolate">\u2B1A Isolate object</button>' +
        '<span class="ix-arf-acthint">Click a part to select \u00b7 drag to move \u00b7 corner to resize \u00b7 double-click text to edit</span>' +
      '</div>' +
      '<div class="ix-arf-brandbar">' +
        '<div class="ix-arf-brandkit" id="ix-arf-brandkit"></div>' +
        '<div class="ix-arf-logodrop" id="ix-arf-logodrop">' +
          '<div class="ix-arf-logodrop-in" id="ix-arf-logodrop-in">' +
            '<span class="ix-arf-logodrop-ic">\u2B06</span>' +
            '<span class="ix-arf-logodrop-t">Drop logo here or <u>browse</u></span>' +
            '<input type="file" id="ix-arf-logofile" accept="image/*" hidden>' +
          '</div>' +
          '<div class="ix-arf-logodrop-done" id="ix-arf-logodrop-done" style="display:none"></div>' +
        '</div>' +
      '</div>' +
      '<div class="ix-arf-edstage-wrap"><div class="ix-arf-edstage" id="ix-arf-edstage"></div></div>' +
      '<div class="ix-arf-export" id="ix-arf-export">' +
        '<div class="ix-arf-lbl">Finish</div>' +
        '<div class="ix-arf-exprow">' +
          '<label class="ix-arf-ltlbl" for="ix-arf-advertiser">Advertiser</label>' +
          '<select id="ix-arf-advertiser" class="ix-arf-adv"></select>' +
          '<button class="ix-btn ix-btn--secondary" id="ix-arf-download">\u2B07 Download PNG</button>' +
          '<button class="ix-btn ix-btn--primary" id="ix-arf-save">Save to advertiser \u2192</button>' +
          '<span class="ix-arf-status" id="ix-arf-savestatus"></span>' +
        '</div>' +
      '</div>';
    root.appendChild(ed);
    // The stage's only height source was aspect-ratio:700/235, and this
    // page's CSS ignores/overrides aspect-ratio (same reason the preview
    // needed an iframe) — so the stage collapsed to ZERO height and the
    // editor "didn't display". Set an explicit px height from the rendered
    // width and re-set it on resize. v0.3.3 fix.
    sizeStage();
    if (!S._stageResize) {
      S._stageResize = function () { sizeStage(); };
      window.addEventListener('resize', S._stageResize);
    }
    renderEditor();
    populateAdvertisers();
    wireExport();
    wireEditorActions();
    renderBrandKit();
    wireLogoDrop();
  }

  // Brand-info panel: extracted colors (click-to-copy hex) + identified
  // font names. Framed as reference — we can't embed an advertiser's
  // licensed font, so we surface the names to match in Canva if needed.
  function renderBrandKit() {
    var el = document.getElementById('ix-arf-brandkit'); if (!el) return;
    var colors = (S.result && S.result.brand_colors) || [];
    var fonts = brandFontNames();
    var cHtml = colors.map(function (c) {
      return '<button class="ix-arf-bk-chip" data-copy="' + esc(c) + '" title="Copy ' + esc(c) + '">' +
        '<span class="ix-arf-bk-sw" style="background:' + esc(c) + '"></span>' + esc(c) + '</button>';
    }).join('') || '<span class="ix-arf-bk-none">no colors detected</span>';
    var fHtml = fonts.length
      ? fonts.map(function (f) { return '<button class="ix-arf-bk-chip" data-copy="' + esc(f) + '" title="Copy font name">' + esc(f) + '</button>'; }).join('')
      : '<span class="ix-arf-bk-none">\u2014</span>';
    el.innerHTML =
      '<div class="ix-arf-bk-row"><span class="ix-arf-bk-lbl">Brand colors</span>' + cHtml + '</div>' +
      '<div class="ix-arf-bk-row"><span class="ix-arf-bk-lbl">Fonts (for Canva)</span>' + fHtml +
        '<span class="ix-arf-bk-note">names only \u2014 licensed fonts can\u2019t be embedded; match in Canva</span></div>';
    el.querySelectorAll('.ix-arf-bk-chip').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-copy');
        try { navigator.clipboard.writeText(v); } catch (e) {}
        var old = b.textContent; b.classList.add('copied');
        setTimeout(function () { b.classList.remove('copied'); }, 900);
      });
    });
  }
  // Best-effort font identification: the extractor doesn't return font
  // names today, so we surface the fonts the layers currently use (which
  // the operator picked) as the "kit" reference. If extraction later
  // returns real font names, wire them here.
  function brandFontNames() {
    var seen = {}, out = [];
    (S.layers || []).forEach(function (L) {
      if (L.type === 'text' && L.font) {
        var name = String(L.font).split(',')[0].replace(/['"]/g, '').trim();
        if (name && !seen[name]) { seen[name] = 1; out.push(name); }
      }
    });
    return out;
  }

  // Logo drop-zone: accept a dropped/picked image, upload to Uploadcare
  // immediately (conditioned URL), show the URL to copy, and offer
  // "Place on banner" to drop it as a layer. v0.4.9.
  function wireLogoDrop() {
    var zone = document.getElementById('ix-arf-logodrop');
    var inWrap = document.getElementById('ix-arf-logodrop-in');
    var fileInput = document.getElementById('ix-arf-logofile');
    if (!zone || !fileInput) return;
    inWrap.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () { if (fileInput.files[0]) handleLogoFile(fileInput.files[0]); });
    ['dragover', 'dragenter'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('over'); });
    });
    zone.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleLogoFile(f);
    });
  }

  function handleLogoFile(file) {
    if (!/^image\//.test(file.type)) return;
    var inWrap = document.getElementById('ix-arf-logodrop-in');
    var done = document.getElementById('ix-arf-logodrop-done');
    if (inWrap) inWrap.style.display = 'none';
    if (done) { done.style.display = 'block'; done.innerHTML = '<span class="ix-arf-logo-up">Uploading logo\u2026</span>'; }
    // Upload immediately to Uploadcare (conditioned URL). Reuses the same
    // upload path as banner save.
    uploadToUploadcare(file, function (up) {
      // keep a decoded canvas so "Place on banner" can add it as a layer
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        S._logo = { url: up.cdnUrl, canvas: c };
        renderLogoDone(up.cdnUrl);
      };
      img.onerror = function () { S._logo = { url: up.cdnUrl, canvas: null }; renderLogoDone(up.cdnUrl); };
      img.crossOrigin = 'anonymous';
      img.src = up.cdnUrl;
    }, function (msg) {
      if (done) done.innerHTML = '<span class="ix-arf-logo-err">' + esc(msg) + '</span>';
    });
  }

  function renderLogoDone(url) {
    var done = document.getElementById('ix-arf-logodrop-done'); if (!done) return;
    done.innerHTML =
      '<div class="ix-arf-logo-prev"><img src="' + esc(url) + '" alt="logo"></div>' +
      '<div class="ix-arf-logo-meta">' +
        '<button class="ix-arf-actbtn" id="ix-arf-logoplace">Place on banner</button>' +
        '<button class="ix-arf-bk-chip" data-copy="' + esc(url) + '" id="ix-arf-logocopy" title="Copy Uploadcare URL">Copy URL</button>' +
        '<a class="ix-revert" id="ix-arf-logoclear">use a different logo</a>' +
      '</div>' +
      '<div class="ix-arf-logo-url">' + esc(url) + '</div>';
    var place = document.getElementById('ix-arf-logoplace');
    if (place) place.addEventListener('click', placeLogoLayer);
    var copy = document.getElementById('ix-arf-logocopy');
    if (copy) copy.addEventListener('click', function () {
      try { navigator.clipboard.writeText(url); } catch (e) {}
      copy.textContent = 'Copied \u2713'; setTimeout(function () { copy.textContent = 'Copy URL'; }, 900);
    });
    var clear = document.getElementById('ix-arf-logoclear');
    if (clear) clear.addEventListener('click', function () {
      S._logo = null;
      var inWrap = document.getElementById('ix-arf-logodrop-in');
      done.style.display = 'none'; done.innerHTML = '';
      if (inWrap) inWrap.style.display = 'flex';
    });
  }

  function placeLogoLayer() {
    if (!S._logo || !S._logo.canvas) return;
    var c = S._logo.canvas;
    var w = Math.round(BANNER_W * 0.18);
    var h = Math.round(w * (c.height / c.width));
    var L = {
      type: 'img', canvas: c, label: 'logo', kind: 'logo',
      x: BANNER_W - w - 12, y: 12, w: w, h: h, bg: 'transparent',
      natW: c.width, natH: c.height, imgZoom: 1, imgOx: 0, imgOy: 0, lockRatio: false
    };
    L.initial = snapshot(L);
    S.layers.push(L);
    S.selected = S.layers.length - 1;
    renderEditor();
  }

  function wireEditorActions() {
    var add = document.getElementById('ix-arf-addtext');
    if (add) add.addEventListener('click', addTextLayer);
    var del = document.getElementById('ix-arf-delete');
    if (del) del.addEventListener('click', deleteSelected);
    var iso = document.getElementById('ix-arf-isolate');
    if (iso) iso.addEventListener('click', openIsolateTool);
    // keyboard delete (only when not editing text inline)
    if (!S._keyHandler) {
      S._keyHandler = function (e) {
        if (!document.getElementById('ix-arf-editor')) return;
        var editing = document.activeElement && document.activeElement.getAttribute('contenteditable') === 'true';
        if (editing) return;
        if ((e.key === 'Delete' || e.key === 'Backspace') && S.selected >= 0) {
          e.preventDefault(); deleteSelected();
        }
      };
      document.addEventListener('keydown', S._keyHandler);
    }
  }

  function addTextLayer() {
    var L = {
      type: 'text', value: 'New text', role: 'custom',
      x: Math.round(BANNER_W * 0.30), y: Math.round(BANNER_H * 0.42),
      w: Math.round(BANNER_W * 0.40), h: 30,
      size: 18, color: (S.result.brand_colors && S.result.brand_colors[1]) || '#1A3A3A',
      weight: 700, font: "'DM Sans', sans-serif", align: 'center', bg: 'transparent'
    };
    L.initial = snapshot(L);
    S.layers.push(L);
    S.selected = S.layers.length - 1;
    renderEditor();
    // Drop straight into inline edit. Target the TEXT span by class —
    // querySelector('div') grabbed the resize handle (first div), so the
    // edit attached to the wrong node and Add text "did nothing". v0.4.8.
    setTimeout(function () {
      var n = document.querySelector('.ix-arf-layer[data-i="' + S.selected + '"]');
      var sp = n && n.querySelector('.ix-arf-txt');
      if (n && sp) startInlineEdit(S.selected, n, sp);
    }, 0);
  }

  function deleteSelected() {
    if (S.selected < 0 || S.selected >= S.layers.length) return;
    S.layers.splice(S.selected, 1);
    S.selected = -1;
    renderEditor();
  }

  // Read advertisers from the page's hidden .customers-wrapper (the
  // authoritative source ASF/Components/PubPlan all use): each
  // .customers-wrapper[data-item] carries dataset.id + dataset.name.
  function readCustomers() {
    var seen = {}, out = [];
    var els = document.querySelectorAll('.customers-wrapper[data-item]');
    for (var i = 0; i < els.length; i++) {
      var d = els[i].dataset;
      var id = (d.id || '').trim(), name = (d.name || '').trim();
      if (id && !seen[id]) { seen[id] = true; out.push({ id: id, name: name || id }); }
    }
    out.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
    return out;
  }

  function populateAdvertisers() {
    var sel = document.getElementById('ix-arf-advertiser');
    if (!sel) return;
    var custs = readCustomers();
    var biz = (S.result && S.result.business_name || '').toLowerCase();
    var opts = '<option value="">\u2014 pick advertiser \u2014</option>';
    var preselect = '';
    custs.forEach(function (c) {
      // soft match the extracted business name to preselect
      if (!preselect && biz && c.name.toLowerCase().indexOf(biz.slice(0, 10)) !== -1) preselect = c.id;
      opts += '<option value="' + esc(c.id) + '" data-name="' + esc(c.name) + '">' + esc(c.name) + '</option>';
    });
    sel.innerHTML = opts;
    if (preselect) sel.value = preselect;
    if (!custs.length) {
      sel.innerHTML = '<option value="">no customers found on page</option>';
    }
  }

  function wireExport() {
    var dl = document.getElementById('ix-arf-download');
    if (dl) dl.addEventListener('click', function () {
      composeBanner(function (blob) {
        var u = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = u; a.download = bannerFilename(); a.click();
        URL.revokeObjectURL(u);
      });
    });
    var save = document.getElementById('ix-arf-save');
    if (save) save.addEventListener('click', saveBanner);
  }

  function bannerFilename() {
    var biz = (S.result && S.result.business_name || 'banner').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
    return (biz || 'banner') + '-banner-700x235.png';
  }

  // Compose the finished banner to a 2× (1400×470) canvas: background,
  // then every layer (image crops via drawImage cover-clip, text via
  // fillText) at true scale. Calls cb(blob).
  function composeBanner(cb) {
    // Canvas fillText draws the FALLBACK unless the font is already loaded in
    // the document. Preload every text layer's font (at its size/weight) via
    // the Font Loading API, THEN paint. v0.4.2.
    var fontReqs = [];
    S.layers.forEach(function (L) {
      if (L.type === 'text' && L.font) {
        var spec = (L.weight || 400) + ' ' + ((L.size || 13) * 2) + 'px ' + L.font;
        try { fontReqs.push(document.fonts.load(spec, L.value || 'Ag')); } catch (e) {}
      }
    });
    var done = function () { paintBanner(cb); };
    if (fontReqs.length && document.fonts && document.fonts.ready) {
      Promise.all(fontReqs).then(done, done);
    } else { done(); }
  }

  function paintBanner(cb) {
    var SCALE = 2;
    var cv = document.createElement('canvas');
    cv.width = BANNER_W * SCALE; cv.height = BANNER_H * SCALE;
    var ctx = cv.getContext('2d');
    var sx = SCALE;

    ctx.fillStyle = (S.result.brand_colors && S.result.brand_colors[0]) || '#ffffff';
    ctx.fillRect(0, 0, cv.width, cv.height);

    S.layers.forEach(function (L) {
      var x = L.x * sx, y = L.y * sx, w = L.w * sx, h = L.h * sx;
      if (L.bg && L.bg !== 'transparent') { ctx.fillStyle = L.bg; ctx.fillRect(x, y, w, h); }
      if (L.type === 'img' && L.canvas) {
        ctx.save();
        ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
        var g = coverGeom(L);
        ctx.drawImage(L.canvas, x + g.left * sx, y + g.top * sx, g.w * sx, g.h * sx);
        ctx.restore();
      } else if (L.type === 'text') {
        ctx.fillStyle = L.color || '#1A3A3A';
        ctx.font = (L.weight || 400) + ' ' + ((L.size || 13) * sx) + 'px ' + (L.font || "'DM Sans', sans-serif");
        ctx.textBaseline = 'middle';
        ctx.save();
        ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
        var tx = x + 2 * sx, align = L.align || 'left';
        if (align === 'center') { ctx.textAlign = 'center'; tx = x + w / 2; }
        else if (align === 'right') { ctx.textAlign = 'right'; tx = x + w - 2 * sx; }
        else { ctx.textAlign = 'left'; }
        ctx.fillText(L.value || '', tx, y + h / 2);
        ctx.restore();
      }
    });

    cv.toBlob(function (blob) { cb(blob); }, 'image/png');
  }

  // Upload PNG → Uploadcare → { uuid, cdnUrl }.
  function uploadToUploadcare(blob, cb, errCb, filename) {
    var cfg = CFG();
    var pub = cfg.uploadcarePublicKey;
    if (!pub) { errCb('Uploadcare key missing in TA_CONFIG.'); return; }
    var fd = new FormData();
    fd.append('UPLOADCARE_PUB_KEY', pub);
    fd.append('UPLOADCARE_STORE', '1');
    fd.append('file', blob, filename || bannerFilename());
    fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: fd })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.file) throw new Error('Uploadcare returned no file id');
        var base = (cfg.uploadcareBase || 'https://ucarecdn.com').replace(/\/$/, '');
        cb({ uuid: j.file, cdnUrl: base + '/' + j.file + '/' });
      })
      .catch(function (e) { errCb('Uploadcare upload failed: ' + (e.message || e)); });
  }

  // Full save chain: compose → upload → Scenario B (Route 4, reformatter)
  // → Scenario 104 (create AD assigned to advertiser, banner linked).
  function saveBanner() {
    var cfg = CFG();
    var sel = document.getElementById('ix-arf-advertiser');
    var btn = document.getElementById('ix-arf-save');
    var st = document.getElementById('ix-arf-savestatus');
    function status(kind, msg) { if (st) { st.className = 'ix-arf-status ' + (kind || ''); st.textContent = msg || ''; } }

    var customerId = sel ? sel.value : '';
    var customerName = (sel && sel.selectedOptions[0]) ? (sel.selectedOptions[0].getAttribute('data-name') || '') : '';
    if (!customerId) { status('err', 'Pick an advertiser first.'); return; }
    if (!cfg.makeConditioner || !cfg.makeCreateAssets) { status('err', 'Make webhook URL(s) missing in TA_CONFIG.'); return; }

    if (btn) { btn.disabled = true; btn.textContent = 'Saving\u2026'; }
    status('work', 'Composing banner\u2026');

    composeBanner(function (blob) {
      status('work', 'Uploading\u2026');
      uploadToUploadcare(blob, function (up) {
        status('work', 'Creating media\u2026');
        // Scenario B — Route 4 (sourceChannel:'reformatter'), module 124.
        var bPayload = {
          action: 'createMediaFromBrowserUpload',
          uploadcareUuid: up.uuid,
          uploadcareUrl: up.cdnUrl,
          originalFilename: bannerFilename(),
          mimeType: 'image/png',
          titleSlug: cfg.titleSlug || '',
          taItemId: cfg.taItemId || '',
          componentRole: '',
          autoAttach: false,
          sourceChannel: 'reformatter',
          source: 'ta-adreformat-v' + VERSION
        };
        fetch(cfg.makeConditioner, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bPayload) })
          .then(function (r) { return r.text().then(function (t) { return { ok: r.ok, t: t }; }); })
          .then(function (res) {
            var j; try { j = JSON.parse(res.t); } catch (e) { throw new Error('Scenario B returned non-JSON.'); }
            if (!res.ok || j.ok !== true || !(j.mediaId || j.mediaItemId)) throw new Error('Scenario B did not confirm the MEDIA create.');
            var mediaId = j.mediaId || j.mediaItemId;
            status('work', 'Creating ad\u2026');
            // Scenario 104 — create AD assigned to the advertiser.
            var payload104 = {
              titleSlug: cfg.titleSlug || '',   // 104's datastore search keys on this; was missing → empty search → no titleAdminId. v0.4.1 fix.
              taItemId: cfg.taItemId || '',
              fields: {
                adName: (customerName || 'Ad') + ' (Banner)',
                customerId: customerId,
                customerName: customerName,
                bannerImageMediaId: mediaId
              }
            };
            return fetch(cfg.makeCreateAssets, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload104) })
              .then(function (r) { return r.text().then(function (t) { return { ok: r.ok, t: t }; }); })
              .then(function (res2) {
                var j2 = {}; try { j2 = JSON.parse(res2.t); } catch (e) {}
                if (!res2.ok) throw new Error('Scenario 104 (create AD) failed.');
                status('ok', 'Saved \u2014 banner created for ' + (customerName || 'advertiser') + '.');
                clearSaved();   // draft persisted no longer needed once saved. v0.4.8.
                if (btn) { btn.textContent = '\u2705 Saved'; }
              });
          })
          .catch(function (err) {
            status('err', (err && err.message) ? err.message : 'Save failed.');
            if (btn) { btn.disabled = false; btn.textContent = 'Save to advertiser \u2192'; }
          });
      }, function (msg) {
        status('err', msg); if (btn) { btn.disabled = false; btn.textContent = 'Save to advertiser \u2192'; }
      });
    });
  }

  function sizeStage() {
    var stage = document.getElementById('ix-arf-edstage');
    var wrap = stage && stage.parentNode;
    if (!stage || !wrap) return;
    var w = wrap.clientWidth || 700;
    stage.style.height = Math.round(w * (BANNER_H / BANNER_W)) + 'px';
    stage.style.aspectRatio = 'auto';   // don't rely on it
  }

  function renderEditor() {
    var stage = document.getElementById('ix-arf-edstage');
    if (!stage) return;
    var bg = (S.result.brand_colors && S.result.brand_colors[0]) || '#ffffff';
    stage.style.setProperty('background-color', bg, 'important');
    stage.innerHTML = '';
    S.layers.forEach(function (L, i) {
      var node = document.createElement('div');
      node.className = 'ix-arf-layer' + (i === S.selected ? ' sel' : '');
      node.style.left = (L.x / BANNER_W * 100) + '%';
      node.style.top = (L.y / BANNER_H * 100) + '%';
      node.style.width = (L.w / BANNER_W * 100) + '%';
      node.style.height = (L.h / BANNER_H * 100) + '%';
      node.style.setProperty('background-color', (L.bg && L.bg !== 'transparent') ? L.bg : 'transparent', 'important');
      node.style.overflow = 'hidden';   // clip image to the frame
      node.dataset.i = i;
      if (L.type === 'img') {
        // Image fills the container (cover, keeping its own aspect),
        // positioned by pan + zoom; container clips the overflow. v0.3.3.
        var im = document.createElement('img');
        im.src = L.canvas.toDataURL('image/png');
        var g = coverGeom(L);
        im.style.cssText = 'position:absolute;display:block;pointer-events:none;' +
          'width:' + (g.w / L.w * 100) + '%;height:' + (g.h / L.h * 100) + '%;' +
          'left:' + (g.left / L.w * 100) + '%;top:' + (g.top / L.h * 100) + '%;';
        node.appendChild(im);
      } else {
        var sp = document.createElement('div');
        sp.className = 'ix-arf-txt';
        sp.textContent = L.value;
        var just = L.align === 'center' ? 'center' : (L.align === 'right' ? 'flex-end' : 'flex-start');
        sp.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:' + just + ';' +
          'overflow:hidden;padding:0 2px;box-sizing:border-box;text-align:' + (L.align || 'left') + ';' +
          'font:' + (L.weight || 400) + ' ' + (L.size || 13) + 'px/1.1 ' + (L.font || "'DM Sans',sans-serif") + ';' +
          'color:' + (L.color || '#1A3A3A') + ';pointer-events:none;white-space:nowrap;';
        // The page's `.publisher-wrapper * { background-color:#fff !important }`
        // paints this inner div white, hiding the layer's real background.
        // Force it transparent so the outer node's bg (or the banner) shows. v0.4.6.
        sp.style.setProperty('background-color', 'transparent', 'important');
        node.appendChild(sp);
        node.addEventListener('dblclick', function (e) {
          e.preventDefault(); e.stopPropagation();
          startInlineEdit(i, node, sp);
        });
      }
      var handle = document.createElement('div');
      handle.className = 'ix-arf-handle';
      handle.style.setProperty('background-color', '#5B7FFF', 'important');
      node.appendChild(handle);
      stage.appendChild(node);
      wireLayer(node, i, handle);
    });
    renderLayerToolbar();
    persist();   // autosave (debounced) — survives refresh/reload. v0.4.8.
  }

  // Inline edit: make the text span editable in place; commit on blur/Enter.
  function startInlineEdit(i, node, sp) {
    S.selected = i;
    sp.setAttribute('contenteditable', 'true');
    sp.style.pointerEvents = 'auto';
    sp.style.outline = '2px solid #5B7FFF';
    sp.style.whiteSpace = 'nowrap';
    sp.focus();
    // select all
    try {
      var rng = document.createRange(); rng.selectNodeContents(sp);
      var seln = window.getSelection(); seln.removeAllRanges(); seln.addRange(rng);
    } catch (e) {}
    function commit() {
      var v = sp.textContent.replace(/\s+/g, ' ').trim();
      S.layers[i].value = v;
      sp.removeEventListener('blur', commit);
      sp.removeEventListener('keydown', onKey);
      renderEditor();
    }
    function onKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); sp.blur(); }
      else if (e.key === 'Escape') { sp.textContent = S.layers[i].value; sp.blur(); }
    }
    sp.addEventListener('blur', commit);
    sp.addEventListener('keydown', onKey);
  }

  // Per-layer controls. Rows are LABELED and visually separated so
  // background vs text-color can't be confused (the v0.4.1 problem). v0.4.2.
  function renderLayerToolbar() {
    var ed = document.getElementById('ix-arf-editor'); if (!ed) return;
    var old = document.getElementById('ix-arf-ltbar'); if (old) old.remove();
    if (S.selected < 0 || !S.layers[S.selected]) return;
    var L = S.layers[S.selected];
    var bar = document.createElement('div');
    bar.id = 'ix-arf-ltbar'; bar.className = 'ix-arf-ltbar';

    // A "color button" shows the current color and opens a popover menu.
    function colorBtn(kind, label, current) {
      var isT = !current || current === 'transparent';
      var sw = isT
        ? 'background:#fff;background-image:linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,#fff 25%,#fff 75%,#ccc 75%);background-size:8px 8px;background-position:0 0,4px 4px;'
        : 'background:' + esc(current) + ';';
      return '<button class="ix-arf-colorbtn" data-kind="' + kind + '" title="' + esc(label) + '">' +
        '<span class="ix-arf-colorbtn-sw" style="' + sw + '"></span>' +
        '<span class="ix-arf-colorbtn-lbl">' + esc(label) + '</span>' +
        '<span class="ix-arf-colorbtn-car">\u25BE</span></button>';
    }

    var html = '<div class="ix-arf-fmtrow">';
    if (L.type === 'text') {
      var fontOpts = ARF_FONTS.map(function (fam) {
        var stack = fontStack(fam);
        return '<option value="' + esc(stack) + '"' + ((L.font || '') === stack ? ' selected' : '') + ' style="font-family:' + esc(stack) + '">' + esc(fam) + '</option>';
      }).join('');
      html +=
        '<select id="ix-arf-tfont" class="ix-arf-tsel" title="Font">' + fontOpts + '</select>' +
        '<input type="number" id="ix-arf-tsize" class="ix-arf-tnum" min="6" max="120" value="' + (L.size || 13) + '" title="Size"><span class="ix-arf-unit">px</span>' +
        '<span class="ix-arf-fmtsep"></span>' +
        '<button class="ix-arf-ltbtn' + ((L.weight || 400) >= 600 ? ' on' : '') + '" id="ix-arf-tbold" title="Bold">B</button>' +
        '<span class="ix-arf-talign">' +
          '<button class="ix-arf-ltbtn' + (L.align === 'left' || !L.align ? ' on' : '') + '" data-al="left" title="Align left">L</button>' +
          '<button class="ix-arf-ltbtn' + (L.align === 'center' ? ' on' : '') + '" data-al="center" title="Align center">C</button>' +
          '<button class="ix-arf-ltbtn' + (L.align === 'right' ? ' on' : '') + '" data-al="right" title="Align right">R</button>' +
        '</span>' +
        '<span class="ix-arf-fmtsep"></span>' +
        colorBtn('tc', 'Text color', L.color) +
        colorBtn('bg', 'Background', L.bg) +
        '<span class="ix-arf-fmtsep"></span>' +
        '<button class="ix-arf-ltbtn" id="ix-arf-torig" title="Replace with the ad\u2019s exact wording cropped as an image">Original as image</button>' +
        '<button class="ix-arf-ltbtn" id="ix-arf-layerreset" title="Restore original">Reset</button>';
    } else { // image
      html +=
        colorBtn('bg', 'Background', L.bg) +
        '<span class="ix-arf-fmtsep"></span>' +
        '<label class="ix-arf-ltchk" title="Hold the container\u2019s current shape while resizing">' +
          '<input type="checkbox" id="ix-arf-lockratio"' + (L.lockRatio ? ' checked' : '') + '> lock ratio</label>' +
        '<button class="ix-arf-ltbtn" id="ix-arf-cropsrc" title="Draw a crop box on the ORIGINAL ad">\u2702 Crop from source</button>' +
        '<button class="ix-arf-ltbtn" id="ix-arf-layerreset" title="Restore original">Reset</button>';
    }
    html += '</div>';
    bar.innerHTML = html;
    ed.appendChild(bar);
    // Keep the Finish/export box as the LAST element, below the toolbar.
    var exp = document.getElementById('ix-arf-export');
    if (exp && exp.parentNode === ed) ed.appendChild(exp);

    // ── wire format row ──
    bar.querySelectorAll('.ix-arf-colorbtn').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); openColorPopover(b, b.dataset.kind); });
    });

    var lock = document.getElementById('ix-arf-lockratio');
    if (lock) lock.addEventListener('change', function () { S.layers[S.selected].lockRatio = lock.checked; });

    var reset = document.getElementById('ix-arf-layerreset');
    if (reset) reset.addEventListener('click', function () {
      var L2 = S.layers[S.selected]; var ini = L2.initial || {};
      ['x', 'y', 'w', 'h', 'bg', 'imgZoom', 'imgOx', 'imgOy',
       'value', 'size', 'color', 'weight', 'font', 'align'].forEach(function (k) {
        if (ini[k] !== undefined) L2[k] = ini[k];
      });
      if (ini.canvas) L2.canvas = ini.canvas, L2.natW = ini.natW, L2.natH = ini.natH;
      renderEditor();
    });

    var cropBtn = document.getElementById('ix-arf-cropsrc');
    if (cropBtn) cropBtn.addEventListener('click', function () { openCropTool(S.selected); });

    var tfont = document.getElementById('ix-arf-tfont');
    if (tfont) tfont.addEventListener('change', function () { S.layers[S.selected].font = tfont.value; renderEditor(); });
    var tsize = document.getElementById('ix-arf-tsize');
    if (tsize) tsize.addEventListener('input', function () {
      var v = parseInt(tsize.value, 10); if (v >= 6 && v <= 120) { S.layers[S.selected].size = v; renderEditor(); }
    });
    var tbold = document.getElementById('ix-arf-tbold');
    if (tbold) tbold.addEventListener('click', function () {
      var L2 = S.layers[S.selected]; L2.weight = (L2.weight || 400) >= 600 ? 400 : 700; renderEditor();
    });
    bar.querySelectorAll('.ix-arf-talign [data-al]').forEach(function (b) {
      b.addEventListener('click', function () { S.layers[S.selected].align = b.dataset.al; renderEditor(); });
    });
    var torig = document.getElementById('ix-arf-torig');
    if (torig) torig.addEventListener('click', function () { openCropTool(S.selected, true); });
  }

  // Word-style color popover: swatch grid + Transparent + More colors…
  function openColorPopover(anchor, kind) {
    closeColorPopover();
    var L = S.layers[S.selected]; if (!L) return;
    var brand = (S.result.brand_colors || []);
    var base = ['#1A3A3A', '#000000', '#FFFFFF', '#5B7FFF', '#C4A35A', '#D49428', '#2F3856', '#888888'];
    var grid = base.concat(brand).filter(function (c, i, a) { return a.indexOf(c) === i; });
    var cur = (kind === 'tc') ? L.color : L.bg;

    var pop = document.createElement('div');
    pop.id = 'ix-arf-colorpop'; pop.className = 'ix-arf-colorpop';
    var swHtml = grid.map(function (c) {
      var sel = (cur || '').toUpperCase() === c.toUpperCase() ? ' sel' : '';
      return '<button class="ix-arf-popsw' + sel + '" data-c="' + esc(c) + '" title="' + esc(c) + '" style="background:' + esc(c) + ';"></button>';
    }).join('');
    pop.innerHTML =
      '<div class="ix-arf-popgrid">' + swHtml + '</div>' +
      '<button class="ix-arf-popopt" data-c="transparent">' +
        '<span class="ix-arf-popt-x"></span> ' + (kind === 'tc' ? 'No color' : 'No fill (transparent)') + '</button>' +
      '<label class="ix-arf-popopt"><span>\uFF0B</span> More colors\u2026' +
        '<input type="color" id="ix-arf-popcustom" value="' + (/^#/.test(cur || '') ? esc(cur) : '#1A3A3A') + '" style="margin-left:auto;"></label>';

    document.body.appendChild(pop);
    var r = anchor.getBoundingClientRect();
    pop.style.left = Math.round(r.left) + 'px';
    pop.style.top = Math.round(r.bottom + 4) + 'px';

    function apply(c) {
      var L2 = S.layers[S.selected];
      if (kind === 'tc') L2.color = c; else L2.bg = c;
      renderEditor();
    }
    pop.querySelectorAll('.ix-arf-popsw').forEach(function (b) {
      b.addEventListener('click', function () { apply(b.dataset.c); closeColorPopover(); });
    });
    pop.querySelector('.ix-arf-popopt[data-c="transparent"]').addEventListener('click', function () { apply('transparent'); closeColorPopover(); });
    var pc = document.getElementById('ix-arf-popcustom');
    if (pc) pc.addEventListener('input', function () { apply(pc.value); });
    if (pc) pc.addEventListener('change', function () { closeColorPopover(); });

    setTimeout(function () {
      S._popDismiss = function (e) { if (!pop.contains(e.target)) closeColorPopover(); };
      document.addEventListener('pointerdown', S._popDismiss);
    }, 0);
  }
  function closeColorPopover() {
    var p = document.getElementById('ix-arf-colorpop'); if (p) p.remove();
    if (S._popDismiss) { document.removeEventListener('pointerdown', S._popDismiss); S._popDismiss = null; }
  }

  function wireLayer(node, i, handle) {
    var stage = node.parentNode;
    function rect() { return stage.getBoundingClientRect(); }

    node.addEventListener('pointerdown', function (e) {
      if (e.target === handle) return;
      e.preventDefault();
      S.selected = i; renderEditor();
      var n = document.querySelector('.ix-arf-layer[data-i="' + i + '"]');
      var sr = rect(); var L = S.layers[i];
      var startX = e.clientX, startY = e.clientY;

      // Image layer + pan mode (or shift held) → PAN the image inside the
      // container (choose which PART shows). Offsets are container px. v0.3.3.
      if (L.type === 'img' && (S.panMode || e.shiftKey)) {
        var oox = L.imgOx, ooy = L.imgOy;
        var imEl = n.querySelector('img');
        function panMv(ev) {
          var dx = (ev.clientX - startX) / sr.width * BANNER_W;
          var dy = (ev.clientY - startY) / sr.height * BANNER_H;
          L.imgOx = Math.round(oox + dx);
          L.imgOy = Math.round(ooy + dy);
          var g = coverGeom(L);
          if (imEl) { imEl.style.left = (g.left / L.w * 100) + '%'; imEl.style.top = (g.top / L.h * 100) + '%'; }
        }
        function panUp() { document.removeEventListener('pointermove', panMv); document.removeEventListener('pointerup', panUp); }
        document.addEventListener('pointermove', panMv); document.addEventListener('pointerup', panUp);
        return;
      }

      // Otherwise MOVE the container on the banner.
      var ox = L.x, oy = L.y;
      function mv(ev) {
        var dx = (ev.clientX - startX) / sr.width * BANNER_W;
        var dy = (ev.clientY - startY) / sr.height * BANNER_H;
        L.x = Math.max(0, Math.min(BANNER_W - L.w, Math.round(ox + dx)));
        L.y = Math.max(0, Math.min(BANNER_H - L.h, Math.round(oy + dy)));
        n.style.left = (L.x / BANNER_W * 100) + '%';
        n.style.top = (L.y / BANNER_H * 100) + '%';
      }
      function up() { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });

    handle.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      S.selected = i; renderEditor();
      var n = document.querySelector('.ix-arf-layer[data-i="' + i + '"]');
      var sr = rect(); var L = S.layers[i];
      var startX = e.clientX, startY = e.clientY, ow = L.w, oh = L.h;
      // Container resizes FREELY (any shape) so you can make the slot a
      // square, wide strip, etc. If L.lockRatio is on, it holds its current
      // ratio. The IMAGE keeps its own aspect via cover-fit regardless. v0.3.3.
      var hold = !!L.lockRatio;
      var ratio = ow / oh;
      function mv(ev) {
        var dx = (ev.clientX - startX) / sr.width * BANNER_W;
        var dy = (ev.clientY - startY) / sr.height * BANNER_H;
        var nw = Math.max(16, Math.round(ow + dx));
        var nh = Math.max(12, Math.round(oh + dy));
        if (hold) nh = Math.round(nw / ratio);
        nw = Math.min(nw, BANNER_W - L.x);
        nh = Math.min(nh, BANNER_H - L.y);
        if (hold) nw = Math.round(nh * ratio);
        L.w = nw; L.h = nh;
        n.style.width = (L.w / BANNER_W * 100) + '%';
        n.style.height = (L.h / BANNER_H * 100) + '%';
        // re-cover the image to the new container live
        var imEl = n.querySelector('img');
        if (imEl) {
          var g = coverGeom(L);
          imEl.style.width = (g.w / L.w * 100) + '%';
          imEl.style.height = (g.h / L.h * 100) + '%';
          imEl.style.left = (g.left / L.w * 100) + '%';
          imEl.style.top = (g.top / L.h * 100) + '%';
        }
      }
      function up() { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
  }

  // ════════════════════════════════════════════════════════════
  //  CROP FROM SOURCE (v0.3.4) — draw a free rectangle on the
  //  ORIGINAL ad; Apply crops that region and replaces the chosen
  //  photo layer's image. Its own Apply / Cancel. This is the
  //  "basic crop" — operate on the raw ad, not on a bad auto-crop.
  // ════════════════════════════════════════════════════════════
  function openCropTool(layerIndex, asTextReplace) {
    if (!S.img) return;
    var ed = document.getElementById('ix-arf-editor'); if (!ed) return;
    // CRITICAL: a previous crop overlay must be removed first. Without this,
    // a SECOND "Crop from source" appended a 2nd id="ix-arf-crop" while the
    // first lived on — duplicate ids made getElementById return the STALE
    // surface/rect, so the new crop's dimming painted but nothing responded:
    // the "grey screen of death" on 2nd use. Also clear any open popover. v0.4.7.
    closeColorPopover();
    var stale = document.getElementById('ix-arf-crop');
    if (stale) stale.remove();
    var W = S.img.naturalWidth || S.img.width;
    var H = S.img.naturalHeight || S.img.height;

    var ov = document.createElement('div');
    ov.id = 'ix-arf-crop'; ov.className = 'ix-arf-crop';
    ov.innerHTML =
      '<div class="ix-arf-crop-bar">' +
        '<span class="ix-arf-crop-title">\u2702 Crop from source \u2014 drag a box over the part you want</span>' +
        '<span style="flex:1"></span>' +
        '<button class="ix-btn ix-btn--ghost" id="ix-arf-crop-cancel">Cancel</button>' +
        '<button class="ix-btn ix-btn--primary" id="ix-arf-crop-apply">Apply \u2713</button>' +
      '</div>' +
      '<div class="ix-arf-crop-surfwrap"><div class="ix-arf-crop-surf" id="ix-arf-crop-surf">' +
        '<canvas id="ix-arf-crop-canvas"></canvas>' +
        '<div class="ix-arf-crop-rect" id="ix-arf-crop-rect" style="display:none"></div>' +
      '</div></div>' +
      '<div class="ix-arf-edhint">Drag on the image to draw a crop region. Drag inside the box to move it, ' +
      'the corner to resize. Apply replaces the selected photo.</div>';
    ed.appendChild(ov);

    // draw the source onto the crop canvas (scaled by CSS to fit)
    var surf = document.getElementById('ix-arf-crop-surf');
    var cv = document.getElementById('ix-arf-crop-canvas');
    cv.width = W; cv.height = H;
    cv.getContext('2d').drawImage(S.img, 0, 0);
    // explicit display height (avoid aspect-ratio cascade issues)
    function sizeSurf() {
      var w = surf.clientWidth || 600;
      cv.style.width = '100%'; cv.style.height = Math.round(w * (H / W)) + 'px';
    }
    sizeSurf();

    // crop rect state in SOURCE pixels
    var box = null; // {x,y,w,h}
    var rectEl = document.getElementById('ix-arf-crop-rect');
    // Page rule whites the rect interior even though CSS says transparent;
    // force it (same fix as text bg). This is the long-owed white-crop-box. v0.4.6.
    rectEl.style.setProperty('background-color', 'transparent', 'important');
    function srfRect() { return surf.getBoundingClientRect(); }
    function toSrc(clientX, clientY) {
      var r = srfRect();
      return { x: (clientX - r.left) / r.width * W, y: (clientY - r.top) / r.height * H };
    }
    function paintRect() {
      if (!box) { rectEl.style.display = 'none'; return; }
      rectEl.style.display = 'block';
      rectEl.style.left = (box.x / W * 100) + '%';
      rectEl.style.top = (box.y / H * 100) + '%';
      rectEl.style.width = (box.w / W * 100) + '%';
      rectEl.style.height = (box.h / H * 100) + '%';
    }

    // draw a new box by dragging on empty surface
    cv.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var start = toSrc(e.clientX, e.clientY);
      box = { x: start.x, y: start.y, w: 0, h: 0 };
      function mv(ev) {
        var p = toSrc(ev.clientX, ev.clientY);
        box.x = Math.max(0, Math.min(start.x, p.x));
        box.y = Math.max(0, Math.min(start.y, p.y));
        box.w = Math.min(W - box.x, Math.abs(p.x - start.x));
        box.h = Math.min(H - box.y, Math.abs(p.y - start.y));
        paintRect();
      }
      function up() { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });

    // move the box by dragging inside it
    rectEl.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (!box) return;
      var start = toSrc(e.clientX, e.clientY); var ox = box.x, oy = box.y;
      function mv(ev) {
        var p = toSrc(ev.clientX, ev.clientY);
        box.x = Math.max(0, Math.min(W - box.w, ox + (p.x - start.x)));
        box.y = Math.max(0, Math.min(H - box.h, oy + (p.y - start.y)));
        paintRect();
      }
      function up() { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });

    document.getElementById('ix-arf-crop-cancel').addEventListener('click', function () { ov.remove(); });

    document.getElementById('ix-arf-crop-apply').addEventListener('click', function () {
      if (!box || box.w < 4 || box.h < 4) { ov.remove(); return; }
      // crop the source region into a fresh canvas
      var c = document.createElement('canvas');
      c.width = Math.round(box.w); c.height = Math.round(box.h);
      c.getContext('2d').drawImage(S.img,
        Math.round(box.x), Math.round(box.y), Math.round(box.w), Math.round(box.h),
        0, 0, Math.round(box.w), Math.round(box.h));
      var L = S.layers[layerIndex];
      if (asTextReplace && L.type === 'text') {
        // Convert this text layer into an IMAGE layer holding the original
        // wording, cropped pixel-exact from the ad. Keep its box position;
        // size height to the crop's aspect. v0.4.1.
        L.type = 'img'; L.canvas = c; L.natW = c.width; L.natH = c.height;
        L.imgZoom = 1; L.imgOx = 0; L.imgOy = 0; L.lockRatio = false;
        L.h = Math.max(12, Math.round(L.w * (c.height / c.width)));
        delete L.value; delete L.size; delete L.weight; delete L.color; delete L.font; delete L.align;
      } else {
        // replace the image + reset crop so the new part fills cleanly
        L.canvas = c; L.natW = c.width; L.natH = c.height;
        L.imgZoom = 1; L.imgOx = 0; L.imgOy = 0;
      }
      L.initial = snapshot(L);   // new baseline for Reset
      ov.remove();
      renderEditor();
    });
  }

  // ════════════════════════════════════════════════════════════
  //  ISOLATE OBJECT (v0.5.0) — WaveSpeed SAM3 via ix-object-isolator.
  //  Overlay on the SOURCE image. Tools: Box / Point / Text. Modes:
  //  Isolate (SAM3 cut-out on transparency) / Copy (plain crop).
  //  Two-stage: Box+Isolate crops the region client-side FIRST and
  //  sends only the crop (full-frame box prompt) — small objects get
  //  high-res masks. Single result + Re-run; a mask picker appears
  //  only if the API ever returns multiple outputs.
  // ════════════════════════════════════════════════════════════
  // HC — isolated-object component role hash (Hardcoding Tracker;
  // also in platform-data-reference with the other role hashes).
  var ISOLATED_ROLE_HASH = 'a976a8b7c21ddf0da94cf72d1aad30af';

  function isoFilename(customerName) {
    var base = (customerName || (S.result && S.result.business_name) || 'object')
      .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
    return (base || 'object') + '-isolated-' + Date.now() + '.png';
  }

  function openIsolateTool() {
    if (!S.img) return;
    var ed = document.getElementById('ix-arf-editor'); if (!ed) return;
    closeColorPopover();
    // v0.4.7 lesson: never allow a duplicate-id overlay to survive.
    var stale = document.getElementById('ix-arf-iso');
    if (stale) stale.remove();

    var W = S.img.naturalWidth || S.img.width;
    var H = S.img.naturalHeight || S.img.height;

    // overlay-local state
    var tool = 'box';           // 'box' | 'point' | 'text'
    var mode = 'isolate';       // 'isolate' | 'copy'
    var box = null;             // {x,y,w,h} in SOURCE px
    var pt = null;              // {x,y} in SOURCE px
    var cut = null;             // result canvas
    var busy = false;
    var hasRun = false;
    var saveAndDownload = false;

    var ov = document.createElement('div');
    ov.id = 'ix-arf-iso'; ov.className = 'ix-arf-iso';
    ov.innerHTML =
      '<div class="ix-arf-iso-bar">' +
        '<span class="ix-arf-iso-title">\u2B1A Isolate object \u2014 mark the target on the source</span>' +
        '<span class="ix-arf-iso-seg" id="ix-arf-iso-seg">' +
          '<button class="on" data-tool="box">Box</button>' +
          '<button data-tool="point">Point</button>' +
          '<button data-tool="text">Text</button>' +
        '</span>' +
        '<select class="ix-arf-iso-mode" id="ix-arf-iso-mode">' +
          '<option value="isolate">Isolate \u2014 cut onto transparency</option>' +
          '<option value="copy">Copy \u2014 plain crop, all layers</option>' +
        '</select>' +
        '<span style="flex:1"></span>' +
        '<button class="ix-btn ix-btn--ghost" id="ix-arf-iso-close">Close</button>' +
      '</div>' +
      '<div class="ix-arf-iso-bar" id="ix-arf-iso-txtrow" style="display:none">' +
        '<input type="text" class="ix-arf-iso-txt" id="ix-arf-iso-txtin" ' +
          'placeholder=\'Describe the target \u2014 e.g. "the truck"\'>' +
      '</div>' +
      '<div class="ix-arf-iso-surfwrap"><div class="ix-arf-iso-surf" id="ix-arf-iso-surf">' +
        '<canvas id="ix-arf-iso-canvas"></canvas>' +
        '<div class="ix-arf-iso-rect" id="ix-arf-iso-rect" style="display:none"></div>' +
        '<div class="ix-arf-iso-dot" id="ix-arf-iso-dot" style="display:none"></div>' +
      '</div></div>' +
      '<div class="ix-arf-iso-run">' +
        '<button class="ix-btn ix-btn--primary" id="ix-arf-iso-run" disabled>' +
          '<span class="ix-arf-spin" id="ix-arf-iso-spin" style="display:none"></span>' +
          '<span id="ix-arf-iso-runlbl">Isolate object</span></button>' +
        '<button class="ix-arf-iso-clear" id="ix-arf-iso-clear" style="display:none">Clear selection</button>' +
        '<span class="ix-arf-status" id="ix-arf-iso-status"></span>' +
      '</div>' +
      '<div class="ix-arf-iso-result" id="ix-arf-iso-result">' +
        '<div class="ix-arf-iso-frame" id="ix-arf-iso-frame"></div>' +
        '<div class="ix-arf-iso-meta" id="ix-arf-iso-meta"></div>' +
        '<div class="ix-arf-iso-acts">' +
          '<button class="ix-btn ix-btn--primary" id="ix-arf-iso-add">Add to Canvas</button>' +
          '<button class="ix-btn ix-btn--secondary" id="ix-arf-iso-save">Save as MEDIA Item</button>' +
          '<button class="ix-btn ix-btn--secondary" id="ix-arf-iso-savedl">Save &amp; Download</button>' +
        '</div>' +
        '<div class="ix-arf-iso-custrow" id="ix-arf-iso-custrow">' +
          '<label class="ix-arf-ltlbl" for="ix-arf-iso-cust">Assign to customer</label>' +
          '<select id="ix-arf-iso-cust" class="ix-arf-adv"></select>' +
          '<button class="ix-btn ix-btn--primary" id="ix-arf-iso-confirm" disabled>' +
            '<span class="ix-arf-spin" id="ix-arf-iso-savespin" style="display:none"></span>' +
            '<span id="ix-arf-iso-confirmlbl">Save \u2192</span></button>' +
          '<button class="ix-arf-iso-clear" id="ix-arf-iso-custcancel">cancel</button>' +
          '<span class="ix-arf-status" id="ix-arf-iso-savestatus"></span>' +
        '</div>' +
      '</div>';
    ed.appendChild(ov);

    // draw the source at native resolution
    var surf = document.getElementById('ix-arf-iso-surf');
    var cv = document.getElementById('ix-arf-iso-canvas');
    cv.width = W; cv.height = H;
    cv.getContext('2d').drawImage(S.img, 0, 0);
    function sizeSurf() {
      var w = surf.clientWidth || 600;
      cv.style.width = '100%'; cv.style.height = Math.round(w * (H / W)) + 'px';
    }
    sizeSurf();

    var rectEl = document.getElementById('ix-arf-iso-rect');
    var dotEl = document.getElementById('ix-arf-iso-dot');
    // page rule whites the rect interior + kills background-image; force. v0.4.6 lesson.
    rectEl.style.setProperty('background-color', 'transparent', 'important');
    rectEl.style.setProperty('background-image', 'none', 'important');
    dotEl.style.setProperty('background-color', 'rgba(196,163,90,.35)', 'important');

    function srfRect() { return surf.getBoundingClientRect(); }
    function toSrc(clientX, clientY) {
      var r = srfRect();
      return { x: (clientX - r.left) / r.width * W, y: (clientY - r.top) / r.height * H };
    }
    function paintRect() {
      if (!box) { rectEl.style.display = 'none'; return; }
      rectEl.style.display = 'block';
      rectEl.style.left = (box.x / W * 100) + '%';
      rectEl.style.top = (box.y / H * 100) + '%';
      rectEl.style.width = (box.w / W * 100) + '%';
      rectEl.style.height = (box.h / H * 100) + '%';
    }
    function paintDot() {
      if (!pt) { dotEl.style.display = 'none'; return; }
      dotEl.style.display = 'block';
      dotEl.style.left = (pt.x / W * 100) + '%';
      dotEl.style.top = (pt.y / H * 100) + '%';
    }
    function isoStatus(kind, msg) {
      var s = document.getElementById('ix-arf-iso-status');
      if (s) { s.className = 'ix-arf-status ' + (kind || ''); s.textContent = msg || ''; }
    }
    function syncRun() {
      var runBtn = document.getElementById('ix-arf-iso-run');
      var lbl = document.getElementById('ix-arf-iso-runlbl');
      var clr = document.getElementById('ix-arf-iso-clear');
      var txt = document.getElementById('ix-arf-iso-txtin');
      var ready = (tool === 'text') ? !!(txt && txt.value.trim())
                : (tool === 'point') ? !!pt : !!box;
      if (runBtn) runBtn.disabled = !ready || busy;
      if (lbl) lbl.textContent = (mode === 'copy') ? 'Copy region'
                              : (hasRun ? 'Re-run' : 'Isolate object');
      if (clr) clr.style.display = (box || pt) ? '' : 'none';
    }

    // tool tabs
    document.getElementById('ix-arf-iso-seg').querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.getElementById('ix-arf-iso-seg').querySelectorAll('button')
          .forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); tool = b.dataset.tool;
        document.getElementById('ix-arf-iso-txtrow').style.display = (tool === 'text') ? '' : 'none';
        box = null; pt = null; paintRect(); paintDot(); syncRun();
      });
    });
    // mode select — Copy needs a box (a point/text can't define a crop)
    document.getElementById('ix-arf-iso-mode').addEventListener('change', function (e) {
      mode = e.target.value;
      if (mode === 'copy' && tool !== 'box') {
        document.getElementById('ix-arf-iso-seg').querySelector('[data-tool="box"]').click();
        isoStatus('', 'Copy uses a box selection.');
      }
      syncRun();
    });
    document.getElementById('ix-arf-iso-txtin').addEventListener('input', syncRun);
    document.getElementById('ix-arf-iso-clear').addEventListener('click', function () {
      box = null; pt = null; paintRect(); paintDot(); isoStatus('', ''); syncRun();
    });
    document.getElementById('ix-arf-iso-close').addEventListener('click', function () { ov.remove(); });

    // gestures — draw box / place point (mirrors openCropTool)
    cv.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (tool === 'text') return;
      var start = toSrc(e.clientX, e.clientY);
      if (tool === 'point') { pt = { x: start.x, y: start.y }; paintDot(); syncRun(); return; }
      box = { x: start.x, y: start.y, w: 0, h: 0 };
      function mv(ev) {
        var p = toSrc(ev.clientX, ev.clientY);
        box.x = Math.max(0, Math.min(start.x, p.x));
        box.y = Math.max(0, Math.min(start.y, p.y));
        box.w = Math.min(W - box.x, Math.abs(p.x - start.x));
        box.h = Math.min(H - box.y, Math.abs(p.y - start.y));
        paintRect();
      }
      function up() { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); syncRun(); }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
    rectEl.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (!box) return;
      var start = toSrc(e.clientX, e.clientY); var ox = box.x, oy = box.y;
      function mv(ev) {
        var p = toSrc(ev.clientX, ev.clientY);
        box.x = Math.max(0, Math.min(W - box.w, ox + (p.x - start.x)));
        box.y = Math.max(0, Math.min(H - box.h, oy + (p.y - start.y)));
        paintRect();
      }
      function up() { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });

    // ── run ──
    function cropSrc(b) {
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(b.w)); c.height = Math.max(1, Math.round(b.h));
      c.getContext('2d').drawImage(S.img,
        Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h),
        0, 0, c.width, c.height);
      return c;
    }
    function fullSrcDataUrl() {
      var c = document.createElement('canvas');
      c.width = W; c.height = H;
      c.getContext('2d').drawImage(S.img, 0, 0);
      return c.toDataURL('image/jpeg', 0.92); // full source: jpeg keeps payload sane
    }
    function showCut(canvas, meta) {
      cut = canvas;
      var frame = document.getElementById('ix-arf-iso-frame');
      frame.innerHTML = '';
      // transparency checkerboard — page CSS kills background-image via
      // stylesheet, so it must be inline !important.
      frame.style.setProperty('background-image',
        'repeating-conic-gradient(#e8e4da 0% 25%, #f7f5ef 0% 50%)', 'important');
      frame.style.setProperty('background-size', '16px 16px', 'important');
      frame.style.setProperty('background-color', 'transparent', 'important');
      canvas.style.display = 'block'; canvas.style.width = '100%';
      frame.appendChild(canvas);
      document.getElementById('ix-arf-iso-meta').textContent = meta;
      document.getElementById('ix-arf-iso-result').style.display = 'block';
      hideCustRow();
    }

    document.getElementById('ix-arf-iso-run').addEventListener('click', function () {
      if (busy) return;
      if (mode === 'copy') {
        if (!box || box.w < 4 || box.h < 4) return;
        var c = cropSrc(box);
        showCut(c, 'COPY \u00b7 plain crop \u00b7 all layers \u00b7 ' + c.width + '\u00d7' + c.height + 'px');
        isoStatus('ok', 'Region copied.');
        hasRun = true; syncRun();
        return;
      }
      var worker = CFG().objectIsolatorWorker;
      if (!worker) { isoStatus('err', 'No objectIsolatorWorker configured in TA_CONFIG.'); return; }

      var payload = { return_base64: true };
      var txtVal = (document.getElementById('ix-arf-iso-txtin').value || '').trim();
      if (tool === 'box') {
        if (!box || box.w < 4 || box.h < 4) return;
        // two-stage: send ONLY the crop; the full-frame box prompt targets
        // the crop's dominant object at full mask resolution.
        var crop = cropSrc(box);
        payload.image = crop.toDataURL('image/png'); // png: keep crop edges lossless
        payload.box_prompts = [[0, 0, crop.width, crop.height]];
        if (txtVal) payload.prompt = txtVal; // optional text refinement
      } else if (tool === 'point') {
        if (!pt) return;
        payload.image = fullSrcDataUrl();
        payload.point_prompts = [[Math.round(pt.x), Math.round(pt.y)]];
      } else {
        if (!txtVal) return;
        payload.image = fullSrcDataUrl();
        payload.prompt = txtVal;
      }

      busy = true; syncRun();
      var spin = document.getElementById('ix-arf-iso-spin');
      var lbl = document.getElementById('ix-arf-iso-runlbl');
      if (spin) spin.style.display = 'inline-block';
      if (lbl) lbl.textContent = 'Isolating\u2026';
      isoStatus('work', (tool === 'box' ? 'crop \u2192 ' : '') + 'worker \u2192 SAM3\u2026');

      fetch(worker, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.text().then(function (t) { return { ok: r.ok, t: t }; }); })
        .then(function (res) {
          var d; try { d = JSON.parse(res.t); } catch (e) { throw new Error('Worker returned non-JSON: ' + res.t.slice(0, 120)); }
          if (!res.ok || d.ok !== true) {
            throw new Error((d.error || 'Isolation failed') + (d.detail ? ' \u2014 ' + String(d.detail).slice(0, 140) : ''));
          }
          // future-proof: if the API ever returns multiple outputs, surface
          // a picker; today it returns exactly one.
          return new Promise(function (resolve, reject) {
            var img = new Image();
            img.onload = function () { resolve({ img: img, ms: d.ms }); };
            img.onerror = function () {
              reject(new Error(d.data ? 'Could not decode cut-out.' :
                'Cut-out URL blocked (no base64 in response) \u2014 deploy isolator worker v1.3.0+.'));
            };
            if (d.data) img.src = 'data:' + (d.media_type || 'image/png') + ';base64,' + d.data;
            else if (d.url) { img.crossOrigin = 'anonymous'; img.src = d.url; }
            else reject(new Error('Worker response had neither data nor url.'));
          });
        })
        .then(function (out) {
          var c = document.createElement('canvas');
          c.width = out.img.naturalWidth; c.height = out.img.naturalHeight;
          c.getContext('2d').drawImage(out.img, 0, 0);
          showCut(c, 'ISOLATE \u00b7 SAM3 \u00b7 transparent PNG \u00b7 ' +
            c.width + '\u00d7' + c.height + 'px \u00b7 ' + (out.ms || '?') + 'ms');
          isoStatus('ok', 'Object isolated. Not right? Adjust the selection and Re-run.');
          hasRun = true;
        })
        .catch(function (err) { isoStatus('err', err.message || 'Isolation failed.'); })
        .finally(function () {
          busy = false;
          if (spin) spin.style.display = 'none';
          syncRun();
        });
    });

    // ── result actions ──
    document.getElementById('ix-arf-iso-add').addEventListener('click', function () {
      if (!cut) return;
      // intermediate: in-browser layer only — no Scenario B, no MEDIA row.
      var part = { label: 'isolated', kind: 'isolated-object', bbox: null, canvas: cut };
      var scale = Math.min((BANNER_W * 0.4) / cut.width, (BANNER_H * 0.9) / cut.height, 1);
      var L = mkImgLayer(part, 20, 20,
        Math.max(24, Math.round(cut.width * scale)),
        Math.max(24, Math.round(cut.height * scale)));
      S.layers.push(L);
      S.selected = S.layers.length - 1;
      renderEditor();
      isoStatus('ok', 'Added to canvas.');
    });

    // customer-assignment step — the arc's first CMS-writing dropdown:
    // gold dirty border while a selection is pending + cancel link
    // (edit-state invariants), tenant-scoped list from the page.
    function custSel() { return document.getElementById('ix-arf-iso-cust'); }
    function hideCustRow() {
      var row = document.getElementById('ix-arf-iso-custrow');
      if (row) row.style.display = 'none';
      var sel = custSel();
      if (sel) {
        sel.value = '';
        sel.classList.remove('ix-select--dirty');
        sel.style.removeProperty('border-color');
        sel.style.removeProperty('box-shadow');
      }
      var st = document.getElementById('ix-arf-iso-savestatus');
      if (st) { st.className = 'ix-arf-status'; st.textContent = ''; }
      var cf = document.getElementById('ix-arf-iso-confirm');
      if (cf) { cf.disabled = true; }
      var cl = document.getElementById('ix-arf-iso-confirmlbl');
      if (cl) cl.textContent = 'Save \u2192';
    }
    function openCustRow(withDownload) {
      if (!cut) return;
      saveAndDownload = !!withDownload;
      var row = document.getElementById('ix-arf-iso-custrow');
      var sel = custSel();
      // populate tenant-scoped customer list (same source as the banner save)
      var custs = readCustomers();
      var opts = '<option value="">\u2014 pick customer \u2014</option>';
      custs.forEach(function (c) {
        opts += '<option value="' + esc(c.id) + '" data-name="' + esc(c.name) + '">' + esc(c.name) + '</option>';
      });
      sel.innerHTML = custs.length ? opts : '<option value="">no customers found on page</option>';
      row.style.display = 'flex';
      var cl = document.getElementById('ix-arf-iso-confirmlbl');
      if (cl) cl.textContent = saveAndDownload ? 'Save & Download \u2192' : 'Save \u2192';
    }
    document.getElementById('ix-arf-iso-save').addEventListener('click', function () { openCustRow(false); });
    document.getElementById('ix-arf-iso-savedl').addEventListener('click', function () { openCustRow(true); });
    document.getElementById('ix-arf-iso-custcancel').addEventListener('click', hideCustRow);

    custSel().addEventListener('change', function () {
      var sel = custSel();
      var dirty = !!sel.value;
      sel.classList.toggle('ix-select--dirty', dirty);
      // page CSS wars: enforce the gold dirty border inline.
      if (dirty) {
        sel.style.setProperty('border-color', '#C4A35A', 'important');
        sel.style.setProperty('box-shadow', '0 0 0 3px rgba(196,163,90,.22)', 'important');
      } else {
        sel.style.removeProperty('border-color');
        sel.style.removeProperty('box-shadow');
      }
      document.getElementById('ix-arf-iso-confirm').disabled = !dirty;
    });

    function downloadCut(filename) {
      cut.toBlob(function (blob) {
        var u = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = u; a.download = filename; a.click();
        URL.revokeObjectURL(u);
      }, 'image/png');
    }

    document.getElementById('ix-arf-iso-confirm').addEventListener('click', function () {
      var cfg = CFG();
      var sel = custSel();
      var btn = document.getElementById('ix-arf-iso-confirm');
      var spin = document.getElementById('ix-arf-iso-savespin');
      var lbl = document.getElementById('ix-arf-iso-confirmlbl');
      var st = document.getElementById('ix-arf-iso-savestatus');
      function status(kind, msg) { if (st) { st.className = 'ix-arf-status ' + (kind || ''); st.textContent = msg || ''; } }

      var customerId = sel ? sel.value : '';
      var customerName = (sel && sel.selectedOptions[0]) ? (sel.selectedOptions[0].getAttribute('data-name') || '') : '';
      if (!customerId || !cut) { status('err', 'Pick a customer first.'); return; }
      if (!cfg.makeConditioner) { status('err', 'Make webhook URL missing in TA_CONFIG.'); return; }

      var fname = isoFilename(customerName);
      // Save & Download: fire the local download immediately, so a Make-side
      // failure never costs the operator the file.
      if (saveAndDownload) downloadCut(fname);

      btn.disabled = true;
      if (spin) spin.style.display = 'inline-block';
      if (lbl) lbl.textContent = 'Saving\u2026';
      status('work', 'Uploading\u2026');

      cut.toBlob(function (blob) {
        uploadToUploadcare(blob, function (up) {
          status('work', 'Creating MEDIA item\u2026');
          // Scenario B — Route 4 (sourceChannel:'reformatter'). The
          // customer reference + isolated-object role make this MEDIA row
          // part of the customer's component library. DELIVERABLE path.
          var bPayload = {
            action: 'createMediaFromBrowserUpload',
            uploadcareUuid: up.uuid,
            uploadcareUrl: up.cdnUrl,
            originalFilename: fname,
            mimeType: 'image/png',
            titleSlug: cfg.titleSlug || '',
            taItemId: cfg.taItemId || '',
            componentRole: ISOLATED_ROLE_HASH,
            customerId: customerId,
            customerName: customerName,
            autoAttach: false,
            sourceChannel: 'reformatter',
            source: 'ta-adreformat-v' + VERSION
          };
          fetch(cfg.makeConditioner, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bPayload) })
            .then(function (r) { return r.text().then(function (t) { return { ok: r.ok, t: t }; }); })
            .then(function (res) {
              var j; try { j = JSON.parse(res.t); } catch (e) { throw new Error('Scenario B returned non-JSON.'); }
              if (!res.ok || j.ok !== true || !(j.mediaId || j.mediaItemId)) throw new Error('Scenario B did not confirm the MEDIA create.');
              status('ok', 'Saved \u2014 MEDIA item created for ' + (customerName || 'customer') + '.');
              if (lbl) lbl.textContent = '\u2705 Saved';
              if (spin) spin.style.display = 'none';
              // selection is committed: clear the dirty edit-state.
              sel.classList.remove('ix-select--dirty');
              sel.style.removeProperty('border-color');
              sel.style.removeProperty('box-shadow');
            })
            .catch(function (err) {
              status('err', (err && err.message) ? err.message : 'Save failed.');
              btn.disabled = false;
              if (spin) spin.style.display = 'none';
              if (lbl) lbl.textContent = saveAndDownload ? 'Save & Download \u2192' : 'Save \u2192';
            });
        }, function (msg) {
          status('err', msg);
          btn.disabled = false;
          if (spin) spin.style.display = 'none';
          if (lbl) lbl.textContent = saveAndDownload ? 'Save & Download \u2192' : 'Save \u2192';
        }, fname);
      }, 'image/png');
    });

    syncRun();
  }


  // ── Studio wiring ──
  window.addEventListener('std:panel:generator', function () { setTimeout(function () { mount(); }, 0); });
  function tryInitialMount() { if (findContainer()) mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryInitialMount);
  else tryInitialMount();

  window.InbxAdReformat = { mount: mount, version: VERSION, _state: S };
  log('loaded (canvas-first) \u2014 listening for std:panel:generator');
})();
