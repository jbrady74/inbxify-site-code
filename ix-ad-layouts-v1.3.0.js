/* ix-ad-layouts-v1.3.0.js
   v1.3.0 (8 Nov 2026, SS-Fork B · Creative S7): a second background panel.
   sr.bg2 = { color: 'main'|'accent'|'white'|'#hex', w: share of the width (0.05..0.8), side: 'right'|'left' }.
   Painted after the layout's rects, under every piece; a piece whose centre falls inside it is coloured
   for contrast against it. Carried in the recipe (recipe v2 keeps its number; bg2 is optional).
   Earlier history follows. */
/* ix-ad-layouts-v1.3.0.js
   ════════════════════════════════════════════════════════════════
   INBXIFY ix series — AD LAYOUTS (shared)

   The ten platform-wide layouts for newsletter ads, and the one painter
   that draws them. Ad Maker (Studio, S5) is the first caller. Anything
   that needs to draw or rebuild a banner or sidebar uses this file.

   Load in the TITLES-ADMIN Template page BODY custom code, before the
   Ad Maker script. No CSS. No network calls except loading the images a
   recipe names (rebuild only). No publisher or title value lives here:
   every value that belongs to an advertiser (wording, colours, logo,
   photo, fonts) comes in from the caller.

   ── v1.0.1 · SS-Fork B · Creative S4 (6 Nov 2026) ──
   After Jeff's proof review (32 of 35 drafts good enough to send):
   the logo on a photo no longer covers the picture.
     • Photo with a subject box: the logo moves to the photo corner that
       keeps clear of the subject (top left, top right, bottom left,
       bottom right, in that order). If every corner touches it, the
       least-covered corner is used and a check says so.
     • Graphic: it is fitted whole in the part of the slot the logo
       leaves free (beside or below the logo, whichever is bigger).
   BF's photo is visible only left of its panel, so corners stay there.

   ── v1.0.0 · SS-Fork B · Creative S4 (6 Nov 2026) ──
   Replaces ta-adreformat v0.6.0's buildLayers() auto-layout, which the
   quality test found to be the main problem. paintBanner()'s 2× canvas
   paint is kept and extended to the sidebar.

   API (window.IxAdLayouts)
     VERSION                       '1.0.0'
     CONST                         every platform constant, one place
     LAYOUTS                       the ten layouts, by code
     shapes() → { banner:{w,h}, sidebar:{w,h} }
         read from TA_CONFIG.elementTypes.ads (closes HC-P-SSB-1).
         Throws, naming what is missing, when a size is not there.
     choose(input) → { banner:[draft], sidebar:[draft], leftOut:'one line' }
         the layouts that suit this ad. Each draft is a shape recipe:
         { shape, layout, crop, sizes }. Photo layouts come twice,
         Wide and Close. Graphics come once, fitted whole.
     paint(input, shapeRecipe) → Promise<{ canvas, checks, fit, shape, layout }>
         paints one shape at 2×. canvas is ready for toBlob().
     cropFor(input, shape, layout, mode) → crop  ('wide' | 'close')
     recipe.make({ input, banner, sidebar }) → recipe object
     recipe.stringify(r) / recipe.parse(text)
         the text saved in ADS reformat-recipe. parse() throws on a bad
         recipe; it never guesses.
     rebuild(recipe, opts) → Promise<{ banner, sidebar }>
         loads the images the recipe names and paints both shapes again.
         opts.resolve(url) may return an image instead of loading it.
     contrast(a, b), textOn(bg)    colour helpers the UI can reuse

   input
     {
       name:     'Titanium Plumbing & Heating',   used when there is no logo
       wording:  { headline, headline2, supporting, button, phone,
                   website, small_print },        the confirmed plan slots
       headlineSlot: 'headline' | 'headline2',    which headline is shown
       colors:   { main:'#RRGGBB', accent:'#RRGGBB' }   CUSTOMERS brand colours
       fonts:    { head:'Manrope', headWeight:800, body:'Manrope' }
       logo:     { main:img|null, light:img|null, source:'customer'|'print',
                   url, lightUrl, nativeWidth? }
       photo:    { img, kind:'photo'|'graphic', url, nativeWidth?,
                   focus:{x,y}?, subject:{x,y,w,h}? }   fractions of the picture
                 or null for no photo
     }
     img is anything canvas can draw: HTMLImageElement, canvas, ImageBitmap.

   shape recipe
     { shape:'banner'|'sidebar', layout:'BP', crop:{mode,cx,cy,zoom}|null,
       sizes:{ logo, headline, supporting, button, phone },      1 = 100%
       style:{ <piece>: { font, weight, color, fill, dy, show } },  v1.1.0, all optional
       style.logo.variant: 'dark'|'light'  v1.2.0: force which logo file paints (auto when absent)
       bg:'main'|'accent'|'white'|'#hex'|null, plate:true|false|null }
     v1.1.0: style, bg and plate are per piece and per shape; a missing
     key means "as the layout decides", so every v1 recipe paints as
     before. dy is a vertical nudge in design px inside the piece's cell.

   checks
     [{ id, level:'ok'|'warn'|'bad', text }]   plain words, ready to show.
     Checks warn. They never block a paint or a Save.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var VERSION = '1.3.0';

  // ══════════════════════════════════════════════════════════════
  //  CONSTANTS — every platform value in one place.
  //  Platform-wide by the 3 Nov ruling: the same for every client.
  // ══════════════════════════════════════════════════════════════
  var CONST = {
    // HC-P-SSB-3 · check thresholds
    PAINT_SCALE: 2,              // paint at 2× for sharp screens
    SHARP_FACTOR: 2,             // sharpness measured against 2× the display size
    SOFT_RATIO: 0.5,             // at or above 1 = sharp; at or above this = soft; below = too small
    PHOTO_SHARE_MIN: 0.5,        // photo share below this is flagged
    TEXT_CONTRAST_MIN: 4.5,      // text against its background
    // HC-P-SSB4-1 · logo against its background (WCAG non-text contrast)
    LOGO_CONTRAST_MIN: 3,
    // HC-P-SSB-5 · neutral colours when a brand colour is missing (always flagged)
    NEUTRAL_MAIN: '#33393F',
    NEUTRAL_ACCENT: '#FFFFFF',
    // Fixed inks used by every layout
    INK: '#1E2A3A',
    PAPER: '#FFFFFF',
    WHITE: '#FFFFFF',
    MUTED: '#5A6478',
    // HC-P-SSB-7 · size slider range
    SIZE_MIN: 0.7,
    SIZE_MAX: 1.4,
    SIZE_PIECES: ['logo', 'headline', 'supporting', 'button', 'phone'],
    // v1.1.0 · per-piece style (HC-P-SSB7-1)
    STYLE_PIECES: ['logo', 'headline', 'supporting', 'button', 'phone', 'website', 'small_print'],
    NUDGE_STEP: 2,               // design px per nudge step (Jeff, 7 Nov)
    SIZE_FREE_MIN: 0.3, SIZE_FREE_MAX: 3,   // typed size range; the sliders keep SIZE_MIN..SIZE_MAX
    FONT_WEIGHTS: [300, 400, 500, 600, 700, 800, 900],
    // HC-P-SSB4-2 · Close crop
    CLOSE_ZOOM: 1.4,             // zoom when the photo has no subject box
    CLOSE_MARGIN: 0.15,          // space kept round a subject box
    CLOSE_MIN_ZOOM: 1.15,        // a Close crop nearer Wide than this is not offered
    ZOOM_MAX: 3,
    // HC-P-SSB4-3 · fonts used when the caller gives none (flagged)
    DEFAULT_FONTS: { head: 'Manrope', headWeight: 800, body: 'Manrope' },
    // Drawing details
    LINE_HEIGHT: 1.1,
    BUTTON_PAD_X: 16,
    BUTTON_TEXT: 0.46,           // button text max = height × this
    BUTTON_TEXT_MIN: 10,
    CHIP_PAD_X: 8, CHIP_PAD_Y: 6, CHIP_RADIUS: 4,
    BOX_PAD: 10, BOX_RADIUS: 6,
    GRAPHIC_PAD: 16,
    LOGO_GAP: 8,                 // space kept between a logo and a graphic beside it
    // Shape ids in TA_CONFIG.elementTypes.ads
    SHAPE_IDS: { banner: 'banner-ad', sidebar: 'sidebar-ad' },
    // The sizes the layout geometry below was drawn at. When TA_CONFIG
    // gives another size, geometry scales to it.
    DESIGN: { banner: { w: 700, h: 235 }, sidebar: { w: 480, h: 400 } }
  };

  // ══════════════════════════════════════════════════════════════
  //  THE TEN LAYOUTS (HC-P-SSB-2). Geometry in px at the DESIGN size.
  //  Element kinds:
  //    rect   x y w h fill('main'|'paper'|'white')
  //    tile   x y w h            white tile, rounded
  //    photo  x y w h
  //    chip   x y h maxw on      logo at a fixed height, width from its shape
  //    lbox   x y w h on         logo fitted inside a box
  //    text   slot x y w h max min font weight align mid on ink
  //    button x y h maxw on
  //  on  = what the piece sits on: 'main' | 'paper' | 'white' | 'photo'
  //  ink = 'auto' (white or ink, by contrast) | 'brand' (main colour or
  //        ink, by contrast) | 'ink' | 'muted'
  // ══════════════════════════════════════════════════════════════
  function T(slot, x, y, w, h, max, min, o) {
    o = o || {};
    return { k: 'text', slot: slot, x: x, y: y, w: w, h: h, max: max, min: min,
      font: o.font || 'body', weight: o.weight || 500, align: o.align || 'left',
      mid: !!o.mid, on: o.on || 'main', ink: o.ink || 'auto' };
  }
  var HEAD = { font: 'head' };
  var LAYOUTS = {
    BP: { code: 'BP', shape: 'banner', name: 'Photo left', usesPhoto: true, els: [
      { k: 'photo', x: 0, y: 0, w: 322, h: 235 },
      { k: 'rect', x: 322, y: 0, w: 378, h: 235, fill: 'main' },
      { k: 'chip', x: 344, y: 18, h: 40, maxw: 200, on: 'main' },
      T('headline', 344, 68, 334, 76, 34, 18, HEAD),
      T('supporting', 344, 148, 334, 36, 15, 11),
      { k: 'button', x: 344, y: 192, h: 30, maxw: 170, on: 'main' },
      T('phone', 524, 192, 154, 30, 17, 11, { weight: 800, align: 'right', mid: true })
    ] },
    BF: { code: 'BF', shape: 'banner', name: 'Photo full', usesPhoto: true, needsWide: true, els: [
      { k: 'photo', x: 0, y: 0, w: 700, h: 235, vw: 420 },
      { k: 'rect', x: 420, y: 0, w: 280, h: 235, fill: 'main' },
      { k: 'chip', x: 16, y: 179, h: 40, maxw: 220, on: 'photo' },
      T('headline', 440, 20, 240, 100, 30, 16, HEAD),
      T('supporting', 440, 124, 240, 44, 14, 11),
      { k: 'button', x: 440, y: 176, h: 30, maxw: 150, on: 'main' },
      T('phone', 440, 210, 240, 18, 14, 10, { weight: 800 })
    ] },
    BR: { code: 'BR', shape: 'banner', name: 'Photo right', usesPhoto: true, els: [
      { k: 'rect', x: 0, y: 0, w: 465, h: 235, fill: 'main' },
      { k: 'photo', x: 465, y: 0, w: 235, h: 235 },
      { k: 'chip', x: 22, y: 18, h: 40, maxw: 220, on: 'main' },
      T('headline', 22, 66, 421, 78, 34, 18, HEAD),
      T('supporting', 22, 148, 421, 36, 15, 11),
      { k: 'button', x: 22, y: 192, h: 30, maxw: 170, on: 'main' },
      T('phone', 240, 192, 203, 30, 17, 11, { weight: 800, align: 'right', mid: true })
    ] },
    BL: { code: 'BL', shape: 'banner', name: 'Logo led', els: [
      { k: 'rect', x: 0, y: 0, w: 700, h: 235, fill: 'paper' },
      { k: 'lbox', x: 20, y: 22, w: 196, h: 146, on: 'paper' },
      { k: 'rect', x: 236, y: 28, w: 2, h: 136, fill: 'main' },
      T('headline', 256, 22, 424, 82, 32, 18, { font: 'head', on: 'paper', ink: 'brand' }),
      T('supporting', 256, 108, 424, 58, 16, 11, { on: 'paper', ink: 'ink' }),
      { k: 'rect', x: 0, y: 186, w: 700, h: 49, fill: 'main' },
      T('phone', 20, 196, 200, 29, 20, 12, { weight: 800, mid: true }),
      T('website', 232, 196, 270, 29, 15, 10, { weight: 600, mid: true }),
      { k: 'button', x: 520, y: 195, h: 31, maxw: 160, on: 'main' }
    ] },
    BB: { code: 'BB', shape: 'banner', name: 'Brand block', els: [
      { k: 'rect', x: 0, y: 0, w: 700, h: 235, fill: 'main' },
      { k: 'tile', x: 20, y: 20, w: 190, h: 195 },
      { k: 'lbox', x: 30, y: 30, w: 170, h: 175, on: 'white' },
      T('headline', 232, 22, 448, 92, 32, 18, HEAD),
      T('supporting', 232, 118, 448, 44, 15, 11),
      { k: 'button', x: 232, y: 180, h: 32, maxw: 170, on: 'main' },
      T('phone', 420, 180, 260, 32, 20, 12, { weight: 800, align: 'right', mid: true })
    ] },
    BS: { code: 'BS', shape: 'banner', name: 'Split', els: [
      { k: 'rect', x: 0, y: 0, w: 450, h: 235, fill: 'main' },
      { k: 'rect', x: 450, y: 0, w: 250, h: 235, fill: 'paper' },
      T('headline', 22, 22, 406, 92, 32, 18, HEAD),
      T('supporting', 22, 118, 406, 44, 15, 11),
      { k: 'button', x: 22, y: 182, h: 32, maxw: 170, on: 'main' },
      T('phone', 210, 182, 218, 32, 20, 12, { weight: 800, align: 'right', mid: true }),
      { k: 'lbox', x: 470, y: 16, w: 210, h: 158, on: 'paper' },
      T('website', 470, 180, 210, 22, 15, 10, { weight: 700, align: 'center', mid: true, on: 'paper', ink: 'ink' }),
      T('small_print', 470, 204, 210, 18, 12, 9, { align: 'center', mid: true, on: 'paper', ink: 'muted' })
    ] },
    SP: { code: 'SP', shape: 'sidebar', name: 'Photo top', usesPhoto: true, els: [
      { k: 'photo', x: 0, y: 0, w: 480, h: 196 },
      { k: 'chip', x: 20, y: 16, h: 46, maxw: 240, on: 'photo' },
      { k: 'rect', x: 0, y: 196, w: 480, h: 204, fill: 'main' },
      T('headline', 24, 214, 432, 74, 30, 18, HEAD),
      T('supporting', 24, 292, 432, 44, 16, 11),
      { k: 'button', x: 24, y: 346, h: 36, maxw: 200, on: 'main' },
      T('phone', 236, 346, 220, 36, 21, 12, { weight: 800, align: 'right', mid: true })
    ] },
    SQ: { code: 'SQ', shape: 'sidebar', name: 'Tall photo', usesPhoto: true, els: [
      { k: 'photo', x: 0, y: 0, w: 480, h: 262 },
      { k: 'chip', x: 20, y: 16, h: 46, maxw: 240, on: 'photo' },
      { k: 'rect', x: 0, y: 262, w: 480, h: 138, fill: 'main' },
      T('headline', 24, 276, 432, 58, 28, 16, HEAD),
      { k: 'button', x: 24, y: 346, h: 36, maxw: 200, on: 'main' },
      T('phone', 236, 346, 220, 36, 21, 12, { weight: 800, align: 'right', mid: true })
    ] },
    SB: { code: 'SB', shape: 'sidebar', name: 'Brand block', els: [
      { k: 'rect', x: 0, y: 0, w: 480, h: 400, fill: 'main' },
      { k: 'chip', x: 24, y: 20, h: 74, maxw: 300, on: 'main' },
      T('headline', 24, 102, 432, 118, 40, 20, HEAD),
      T('supporting', 24, 226, 432, 62, 18, 12),
      { k: 'button', x: 24, y: 300, h: 40, maxw: 200, on: 'main' },
      T('phone', 24, 352, 220, 28, 21, 12, { weight: 800, mid: true }),
      T('website', 250, 352, 206, 28, 15, 10, { weight: 600, align: 'right', mid: true })
    ] },
    SL: { code: 'SL', shape: 'sidebar', name: 'Logo led', els: [
      { k: 'rect', x: 0, y: 0, w: 480, h: 400, fill: 'paper' },
      { k: 'lbox', x: 90, y: 18, w: 300, h: 128, on: 'paper' },
      T('headline', 24, 156, 432, 82, 30, 18, { font: 'head', align: 'center', on: 'paper', ink: 'brand' }),
      T('supporting', 24, 240, 432, 58, 16, 11, { align: 'center', on: 'paper', ink: 'ink' }),
      { k: 'rect', x: 0, y: 316, w: 480, h: 84, fill: 'main' },
      { k: 'button', x: 24, y: 330, h: 40, maxw: 190, on: 'main' },
      T('phone', 236, 330, 220, 40, 22, 12, { weight: 800, align: 'right', mid: true }),
      T('website', 24, 374, 432, 20, 13, 10, { weight: 600, mid: true })
    ] }
  };
  // Order drafts are offered in, per shape
  var ORDER = { banner: ['BP', 'BR', 'BF', 'BL', 'BB', 'BS'], sidebar: ['SP', 'SQ', 'SB', 'SL'] };
  var SLOT_WORDS = { headline: 'Headline', supporting: 'Supporting line', phone: 'Phone',
    website: 'Website', small_print: 'Small print', button: 'Button' };

  // ══════════════════════════════════════════════════════════════
  //  Small helpers
  // ══════════════════════════════════════════════════════════════
  function log() { try { console.log.apply(console, ['[IxAdLayouts v' + VERSION + ']'].concat([].slice.call(arguments))); } catch (e) {} }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function hexOk(h) { return typeof h === 'string' && /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h.trim()); }
  function hexNorm(h) {
    var c = h.trim().replace('#', '');
    if (c.length === 3) c = c.split('').map(function (x) { return x + x; }).join('');
    return '#' + c.toUpperCase();
  }
  function lumHex(h) {
    var c = hexNorm(h).slice(1);
    var v = [0, 2, 4].map(function (i) {
      var x = parseInt(c.substr(i, 2), 16) / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function ratio(l1, l2) { return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  function contrast(a, b) { return ratio(lumHex(a), lumHex(b)); }
  // White or ink, whichever reads; white wins when both pass.
  function textOn(bg) {
    var w = contrast(bg, CONST.WHITE), k = contrast(bg, CONST.INK);
    if (w >= CONST.TEXT_CONTRAST_MIN) return { color: CONST.WHITE, ratio: w };
    if (k >= CONST.TEXT_CONTRAST_MIN) return { color: CONST.INK, ratio: k };
    return w >= k ? { color: CONST.WHITE, ratio: w } : { color: CONST.INK, ratio: k };
  }
  function fontStack(fam) {
    var serif = /Serif|Garamond|Baskerville|Caslon|Fraunces|Playfair|Spectral|Bevan|Abril|Rosarivo|Castoro|Tenor/i.test(fam);
    return "'" + String(fam).replace(/'/g, '') + "', " + (serif ? 'serif' : 'sans-serif');
  }
  function natW(img) { return img ? (img.naturalWidth || img.videoWidth || img.width || 0) : 0; }
  function natH(img) { return img ? (img.naturalHeight || img.videoHeight || img.height || 0) : 0; }
  function round1(n) { return Math.round(n * 10) / 10; }
  function pct(n) { return Math.round(n * 100) + '%'; }

  // ══════════════════════════════════════════════════════════════
  //  Shapes from TA_CONFIG.elementTypes.ads
  //  Accepts the list form [{ id:'banner-ad', l:'Banner Ad (700x235)' }]
  //  or a map form { 'banner-ad': { w, h } | { l } }.
  // ══════════════════════════════════════════════════════════════
  function shapes() {
    var cfg = window.TA_CONFIG || {};
    var ads = cfg.elementTypes && cfg.elementTypes.ads;
    var out = {}, missing = [];
    Object.keys(CONST.SHAPE_IDS).forEach(function (shape) {
      var id = CONST.SHAPE_IDS[shape], row = null;
      if (Array.isArray(ads)) { for (var i = 0; i < ads.length; i++) if (ads[i] && ads[i].id === id) row = ads[i]; }
      else if (ads && typeof ads === 'object') row = ads[id];
      var w = row && +row.w, h = row && +row.h;
      if (!(w > 0 && h > 0) && row) {
        var m = String(row.l || row.label || '').match(/(\d+)\s*[x\u00d7]\s*(\d+)/i);
        if (m) { w = +m[1]; h = +m[2]; }
      }
      if (w > 0 && h > 0) out[shape] = { w: w, h: h, id: id };
      else missing.push(id);
    });
    if (missing.length) {
      throw new Error('TA_CONFIG.elementTypes.ads has no size for ' + missing.join(' and ') +
        '. Add it in the TITLES-ADMIN Template page head, for example { id:\'banner-ad\', l:\'Banner Ad (700x235)\' }.');
    }
    return out;
  }

  // ══════════════════════════════════════════════════════════════
  //  Input normalising: colours, fonts, wording. Every fallback is
  //  reported as a check; nothing is filled in silently.
  // ══════════════════════════════════════════════════════════════
  function prepare(input) {
    input = input || {};
    var notes = [];
    var c = input.colors || {};
    var main = hexOk(c.main) ? hexNorm(c.main) : null;
    var accent = hexOk(c.accent) ? hexNorm(c.accent) : null;
    if (!main) notes.push({ id: 'colour-main', level: 'warn', text: 'Brand colour missing: neutral colour used' });
    if (main && !accent) notes.push({ id: 'colour-accent', level: 'warn', text: 'Accent colour missing: neutral button used' });
    var f = input.fonts || {};
    var fonts = {
      head: f.head || CONST.DEFAULT_FONTS.head,
      headWeight: +f.headWeight || CONST.DEFAULT_FONTS.headWeight,
      body: f.body || CONST.DEFAULT_FONTS.body
    };
    if (!f.head || !f.body) notes.push({ id: 'fonts', level: 'warn', text: 'No fonts given: platform default ' + CONST.DEFAULT_FONTS.head + ' used' });
    var w = input.wording || {};
    var hs = input.headlineSlot === 'headline2' ? 'headline2' : 'headline';
    if (!clean(w[hs]) && clean(w[hs === 'headline' ? 'headline2' : 'headline'])) hs = hs === 'headline' ? 'headline2' : 'headline';
    return {
      name: clean(input.name),
      main: main || CONST.NEUTRAL_MAIN,
      accent: accent || CONST.NEUTRAL_ACCENT,
      fonts: fonts,
      words: {
        headline: clean(w[hs]), supporting: clean(w.supporting), button: clean(w.button),
        phone: clean(w.phone), website: clean(w.website), small_print: clean(w.small_print)
      },
      headlineSlot: hs,
      logo: input.logo || null,
      photo: (input.photo && input.photo.img) ? input.photo : null,
      notes: notes
    };
  }
  function clean(s) { return s == null ? '' : String(s).replace(/\s+/g, ' ').trim(); }

  // ══════════════════════════════════════════════════════════════
  //  Logo tone: mean luminance of the logo's solid pixels, and whether
  //  it has transparency at all. Measured once per image.
  // ══════════════════════════════════════════════════════════════
  var toneCache = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;
  function logoTone(img) {
    if (!img) return null;
    if (toneCache && toneCache.has(img)) return toneCache.get(img);
    var W = natW(img), H = natH(img), res = { lum: 0, transparent: false, ok: false };
    try {
      var s = Math.min(1, 160 / Math.max(W, H)), cw = Math.max(1, Math.round(W * s)), ch = Math.max(1, Math.round(H * s));
      var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
      var g = cv.getContext('2d'); g.drawImage(img, 0, 0, cw, ch);
      var d = g.getImageData(0, 0, cw, ch).data, sum = 0, n = 0, clear = 0;
      for (var i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 128) { clear++; continue; }
        var v = [d[i], d[i + 1], d[i + 2]].map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
        sum += 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; n++;
      }
      res.lum = n ? sum / n : 0; res.transparent = clear > (d.length / 4) * 0.02; res.ok = true;
    } catch (e) { res.ok = false; }   // a tainted image: tone unknown, said in the checks
    if (toneCache) toneCache.set(img, res);
    return res;
  }

  // Decide how a logo sits on a background.
  // Returns { img, variant:'main'|'light'|'name', box:null|colour, why }
  function logoPlan(P, on, want) {
    var L = P.logo || {}, main = L.main || null, light = L.light || null;
    if (!main && !light) return { img: null, variant: 'name', box: null, why: 'no-logo' };
    var bg = on === 'main' ? P.main : on === 'photo' ? null : CONST.WHITE;
    var tm = main && logoTone(main), tl = light && logoTone(light);
    var reads = function (t, colour) { return t && t.ok && ratio(t.lum, lumHex(colour)) >= CONST.LOGO_CONTRAST_MIN; };
    // v1.2.0: a forced variant paints that file; it gets a box only when it would not read on its panel.
    if (want === 'dark' && main) return { img: main, variant: 'main', box: bg && reads(tm, bg) ? null : (reads(tm, CONST.WHITE) ? CONST.WHITE : P.main), why: 'forced' };
    if (want === 'light' && light) return { img: light, variant: 'light', box: bg && reads(tl, bg) ? null : P.main, why: 'forced' };
    // A logo with no transparency carries its own background: draw it as it is.
    if (main && tm && tm.ok && !tm.transparent) return { img: main, variant: 'main', box: null, why: 'opaque' };
    if (bg) {
      if (main && reads(tm, bg)) return { img: main, variant: 'main', box: null, why: '' };
      if (light && reads(tl, bg)) return { img: light, variant: 'light', box: null, why: '' };
    }
    // Needs a box. A dark logo goes on white; a light logo goes on the main colour.
    if (main && reads(tm, CONST.WHITE)) return { img: main, variant: 'main', box: CONST.WHITE, why: light ? 'box' : 'no-light' };
    if (light && reads(tl, P.main)) return { img: light, variant: 'light', box: P.main, why: 'light-box' };
    if (main && reads(tm, P.main)) return { img: main, variant: 'main', box: P.main, why: 'light-box' };
    return { img: main || light, variant: main ? 'main' : 'light', box: CONST.WHITE, why: 'unknown' };
  }

  // ══════════════════════════════════════════════════════════════
  //  Crops. A crop is { mode, cx, cy, zoom } over the WHOLE picture.
  //  zoom 1 = Wide: the most of the picture the slot's shape allows.
  // ══════════════════════════════════════════════════════════════
  function slotOf(layoutCode) {
    var L = LAYOUTS[layoutCode]; if (!L) return null;
    for (var i = 0; i < L.els.length; i++) if (L.els[i].k === 'photo') return L.els[i];
    return null;
  }
  function baseRect(IW, IH, sa) {   // largest rect of aspect sa inside the picture
    return (IW / IH > sa) ? { w: IH * sa, h: IH } : { w: IW, h: IW / sa };
  }
  function cropRect(IW, IH, slotW, slotH, crop) {
    var b = baseRect(IW, IH, slotW / slotH), z = clamp(crop.zoom || 1, 1, CONST.ZOOM_MAX);
    var w = b.w / z, h = b.h / z;
    var x = clamp(crop.cx * IW - w / 2, 0, IW - w), y = clamp(crop.cy * IH - h / 2, 0, IH - h);
    return { x: x, y: y, w: w, h: h, share: (w * h) / (IW * IH) };
  }
  function cropFor(input, shape, layoutCode, mode) {
    var ph = input.photo, slot = slotOf(layoutCode);
    if (!ph || !ph.img || !slot) return null;
    if (ph.kind === 'graphic') return { mode: 'whole', cx: 0.5, cy: 0.5, zoom: 1 };
    var IW = natW(ph.img), IH = natH(ph.img), sub = ph.subject, fo = ph.focus;
    var cx = sub ? sub.x + sub.w / 2 : (fo ? fo.x : 0.5), cy = sub ? sub.y + sub.h / 2 : (fo ? fo.y : 0.5);
    if (mode !== 'close') return { mode: 'wide', cx: round3(cx), cy: round3(cy), zoom: 1 };
    var z = CONST.CLOSE_ZOOM;
    if (sub && sub.w > 0 && sub.h > 0) {
      var b = baseRect(IW, IH, slot.w / slot.h), m = 1 + 2 * CONST.CLOSE_MARGIN;
      z = Math.min(b.w / (sub.w * IW * m), b.h / (sub.h * IH * m));
    }
    return { mode: 'close', cx: round3(cx), cy: round3(cy), zoom: round3(clamp(z, 1, CONST.ZOOM_MAX)) };
  }
  function round3(n) { return Math.round(n * 1000) / 1000; }
  function shareOf(input, layoutCode, crop) {
    var ph = input.photo, slot = slotOf(layoutCode);
    if (!ph || !ph.img || !slot || ph.kind === 'graphic') return 1;
    return cropRect(natW(ph.img), natH(ph.img), slot.w, slot.h, crop || { cx: 0.5, cy: 0.5, zoom: 1 }).share;
  }

  // ══════════════════════════════════════════════════════════════
  //  Layout choice
  // ══════════════════════════════════════════════════════════════
  function sizes1() { var s = {}; CONST.SIZE_PIECES.forEach(function (k) { s[k] = 1; }); return s; }
  function choose(input) {
    var P = prepare(input), out = { banner: [], sidebar: [], leftOut: '' }, left = [], noClose = [];
    var photo = P.photo, graphic = photo && photo.kind === 'graphic';
    ['banner', 'sidebar'].forEach(function (shape) {
      ORDER[shape].forEach(function (code) {
        var L = LAYOUTS[code];
        if (L.usesPhoto && !photo) { left.push({ code: code, why: 'no photo' }); return; }
        if (L.needsWide && graphic) { left.push({ code: code, why: 'a graphic is fitted whole, never stretched across the banner' }); return; }
        if (L.usesPhoto && !graphic) {
          var wide = cropFor(input, shape, code, 'wide'), sh = shareOf(input, code, wide);
          if (code === 'BF' && sh < CONST.PHOTO_SHARE_MIN) { left.push({ code: code, why: 'it would show only ' + pct(sh) + ' of this photo' }); return; }
          out[shape].push({ shape: shape, layout: code, crop: wide, sizes: sizes1() });
          var close = cropFor(input, shape, code, 'close');
          if (close.zoom >= CONST.CLOSE_MIN_ZOOM) out[shape].push({ shape: shape, layout: code, crop: close, sizes: sizes1() });
          else noClose.push(code);
          return;
        }
        out[shape].push({ shape: shape, layout: code, crop: L.usesPhoto ? cropFor(input, shape, code, 'wide') : null, sizes: sizes1() });
      });
    });
    out.leftOut = summariseLeftOut(left) + (noClose.length ? ' No Close crop for ' + noClose.join(', ') +
      ': the subject already fills the Wide crop.' : '');
    return out;
  }
  function summariseLeftOut(left) {
    if (!left.length) return 'All ten layouts suit this ad.';
    var by = {};
    left.forEach(function (x) { (by[x.why] = by[x.why] || []).push(x.code); });
    return 'Left out: ' + Object.keys(by).map(function (why) {
      var codes = by[why].map(function (c) { return c + ' (' + LAYOUTS[c].name + ')'; });
      return codes.join(', ') + ', because ' + why;
    }).join('; ') + '.';
  }

  // ══════════════════════════════════════════════════════════════
  //  Text fitting. Shrinks until it fits, never below the minimum.
  // ══════════════════════════════════════════════════════════════
  function setFont(g, weight, size, fam) { g.font = weight + ' ' + size + 'px ' + fontStack(fam); }
  function wrap(g, text, w, hard) {
    var words = text.split(' '), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var wd = words[i];
      if (g.measureText(wd).width > w) {
        if (!hard) return null;
        if (cur) { lines.push(cur); cur = ''; }
        var piece = '';
        for (var j = 0; j < wd.length; j++) {
          if (g.measureText(piece + wd[j]).width > w && piece) { lines.push(piece); piece = ''; }
          piece += wd[j];
        }
        cur = piece; continue;
      }
      var t = cur ? cur + ' ' + wd : wd;
      if (g.measureText(t).width <= w) cur = t; else { lines.push(cur); cur = wd; }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  // Even out the lines (like CSS text-wrap: balance): the narrowest width
  // that keeps the same number of lines, so no word is left on its own.
  function balance(g, text, w, lines) {
    if (lines.length < 2) return lines;
    var lo = w / lines.length, hi = w, best = lines;
    for (var i = 0; i < 12; i++) {
      var mid = (lo + hi) / 2, l = wrap(g, text, mid, false);
      if (l && l.length === lines.length) { best = l; hi = mid; } else lo = mid;
    }
    return best;
  }
  function ellipsize(g, line, w) {
    if (g.measureText(line + '\u2026').width <= w) return line + '\u2026';
    while (line.length && g.measureText(line + '\u2026').width > w) line = line.slice(0, -1);
    return line.replace(/\s+$/, '') + '\u2026';
  }
  function fitText(g, text, w, h, max, min, weight, fam, singleLine) {
    var lh = CONST.LINE_HEIGHT;
    for (var s = max; s >= min; s--) {
      setFont(g, weight, s, fam);
      var lines = singleLine ? (g.measureText(text).width <= w ? [text] : null) : wrap(g, text, w, false);
      if (lines && lines.length * s * lh <= h + 0.5) return { size: s, lines: balance(g, text, w, lines), over: false };
    }
    setFont(g, weight, min, fam);
    var keep = Math.max(1, Math.floor((h + 0.5) / (min * lh)));
    var all = singleLine ? [text] : wrap(g, text, w, true);
    var shown = all.slice(0, keep);
    var cut = all.length > keep || g.measureText(shown[shown.length - 1]).width > w;
    if (cut) shown[shown.length - 1] = ellipsize(g, all.length > keep ? shown[shown.length - 1] : shown[shown.length - 1], w);
    return { size: min, lines: shown, over: true };
  }
  function drawLines(g, fit, x, y, w, h, align, mid, colour) {
    var lh = fit.size * CONST.LINE_HEIGHT, total = fit.lines.length * lh;
    var top = mid ? y + (h - total) / 2 : y;
    g.fillStyle = colour; g.textBaseline = 'middle';
    g.textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
    var tx = align === 'center' ? x + w / 2 : align === 'right' ? x + w : x;
    g.save(); g.beginPath(); g.rect(x - 2, y - 2, w + 4, h + 4); g.clip();
    fit.lines.forEach(function (ln, i) { g.fillText(ln, tx, top + (i + 0.5) * lh); });
    g.restore();
  }
  function rrect(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  // ══════════════════════════════════════════════════════════════
  //  Fonts must be loaded before canvas draws, or it draws the fallback.
  // ══════════════════════════════════════════════════════════════
  function loadFonts(P, sr) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve([]);
    var extra = [];
    if (sr && sr.style) Object.keys(sr.style).forEach(function (k) { var f = sr.style[k] && sr.style[k].font; if (f && extra.indexOf(String(f)) < 0) extra.push(String(f)); });
    extra.forEach(ensureFont);
    var want = [
      P.fonts.headWeight + ' 20px ' + fontStack(P.fonts.head),
      '500 20px ' + fontStack(P.fonts.body), '600 20px ' + fontStack(P.fonts.body),
      '700 20px ' + fontStack(P.fonts.body), '800 20px ' + fontStack(P.fonts.body)
    ];
    extra.forEach(function (f) { CONST.FONT_WEIGHTS.forEach(function (w) { want.push(w + ' 20px ' + fontStack(f)); }); });
    return Promise.all(want.map(function (f) { return document.fonts.load(f).catch(function () { return []; }); }))
      .then(function () {
        var miss = [];
        [P.fonts.head, P.fonts.body].concat(extra).forEach(function (fam) {
          if (miss.indexOf(fam) < 0 && !document.fonts.check('20px ' + fontStack(fam))) miss.push(fam);
        });
        return miss;
      });
  }

  // ══════════════════════════════════════════════════════════════
  //  Paint one shape at 2×
  // ══════════════════════════════════════════════════════════════
  function sizeOf(sr, piece) {
    var v = sr && sr.sizes && +sr.sizes[piece];
    return clamp(isFinite(v) && v > 0 ? v : 1, CONST.SIZE_FREE_MIN, CONST.SIZE_FREE_MAX);
  }
  // v1.1.0 · per-piece style. A missing key means "as the layout decides".
  function styleOf(sr, piece) { var st = sr && sr.style && sr.style[piece]; return st && typeof st === 'object' ? st : {}; }
  function shown(sr, piece) { return styleOf(sr, piece).show !== false; }
  function nudge(sr, piece, cellH, kt) { var dy = +styleOf(sr, piece).dy || 0; return dy ? clamp(dy, -cellH, cellH) * kt : 0; }
  function colourOf(sr, piece, auto) { var c = styleOf(sr, piece).color; return hexOk(c) ? { color: hexNorm(c), ratio: auto.bg != null ? contrast(hexNorm(c), auto.bg) : auto.ratio, chosen: true } : auto; }
  function fontOf(sr, piece, famAuto, wtAuto) { var st = styleOf(sr, piece); return { fam: st.font ? String(st.font) : famAuto, wt: st.weight && CONST.FONT_WEIGHTS.indexOf(+st.weight) >= 0 ? +st.weight : wtAuto }; }
  function bg2Of(sr, P) {
    var b = sr && sr.bg2; if (!b || !b.color) return null;
    var c = b.color === 'main' ? P.main : b.color === 'accent' ? P.accent : b.color === 'white' ? CONST.WHITE : (hexOk(b.color) ? hexNorm(b.color) : null);
    if (!c) return null;
    return { color: c, w: clamp(+b.w || 0.35, 0.05, 0.8), side: b.side === 'left' ? 'left' : 'right' };
  }
  function bgOfShape(sr, P) { var b = sr && sr.bg; if (!b) return null; if (b === 'main') return P.main; if (b === 'accent') return P.accent; if (b === 'white') return CONST.WHITE; return hexOk(b) ? hexNorm(b) : null; }
  // Google Fonts are fetched on demand so the canvas can draw them (HC-P-SSB7-2: the URL pattern).
  var fontLinks = {};
  function ensureFont(fam) {
    if (!fam || fontLinks[fam] || typeof document === 'undefined') return;
    fontLinks[fam] = true;
    var l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(fam).replace(/%20/g, '+') + ':wght@300;400;500;600;700;800;900&display=swap';
    document.head.appendChild(l);
  }
  function sharpClass(r) { return r >= 1 ? 'ok' : r >= CONST.SOFT_RATIO ? 'warn' : 'bad'; }
  var SHARP_WORD = { ok: 'sharp', warn: 'soft', bad: 'too small' };

  function paint(input, sr) {
    var P = prepare(input);
    var L = LAYOUTS[sr && sr.layout];
    if (!L) return Promise.reject(new Error('Unknown layout: ' + (sr && sr.layout)));
    var SH = shapes()[L.shape], D = CONST.DESIGN[L.shape];
    var kx = SH.w / D.w, ky = SH.h / D.h, kt = Math.min(kx, ky);
    return loadFonts(P, sr).then(function (missingFonts) {
      var S = CONST.PAINT_SCALE, cv = document.createElement('canvas');
      cv.width = Math.round(SH.w * S); cv.height = Math.round(SH.h * S);
      var g = cv.getContext('2d'); g.scale(S, S);
      g.fillStyle = CONST.PAPER; g.fillRect(0, 0, SH.w, SH.h);
      var checks = P.notes.slice(), fit = {}, pics = [];
      missingFonts.forEach(function (fam) { checks.push({ id: 'font-' + fam, level: 'bad', text: 'Font ' + fam + ' is not loaded on this page: the fallback was drawn' }); });
      var X = function (v) { return v * kx; }, Y = function (v) { return v * ky; };
      var shapeBg = bgOfShape(sr, P), MAIN = shapeBg || P.main;   // v1.1.0: a chosen background replaces the layout's main panel
      // v1.3.0: a second background panel, sr.bg2 = { color, w (0..0.8 of the width), side: 'right'|'left' }.
      // Drawn after the layout's rects and before anything that sits on them; pieces whose centre falls inside it read their colour against it.
      var BG2 = bg2Of(sr, P), bg2Rect = BG2 ? { x: BG2.side === 'left' ? 0 : SH.w * (1 - BG2.w), w: SH.w * BG2.w } : null, bg2Drawn = false;
      var inBg2 = function (e) { if (!bg2Rect || !e) return false; var cx = X(e.x) + X(e.w || e.maxw || 0) / 2; return cx >= bg2Rect.x && cx <= bg2Rect.x + bg2Rect.w; };
      var bgOf = function (on, e) { if (inBg2(e)) return BG2.color; return on === 'main' ? MAIN : on === 'photo' ? null : CONST.WHITE; };
      var logoNoted = false;
      var plateWanted = sr && typeof sr.plate === 'boolean' ? sr.plate : null;
      // A logo that sits on the photo must not cover it. Find both pieces.
      var phEl = null, chipEl = null;
      L.els.forEach(function (e) { if (e.k === 'photo') phEl = e; if (e.k === 'chip' && e.on === 'photo') chipEl = e; });
      var chipBox = (phEl && chipEl) ? chipSize(g, P, chipEl, sizeOf(sr, 'logo'), kt) : null;
      var chipAt = null;   // where the chip is drawn, once decided
      if (chipBox) chipAt = { x: X(chipEl.x), y: Y(chipEl.y) };

      L.els.forEach(function (e) {
        var x = X(e.x), y = Y(e.y), w = X(e.w || 0), h = Y(e.h || 0);
        if (BG2 && !bg2Drawn && e.k !== 'rect' && e.k !== 'tile') { bg2Drawn = true; g.fillStyle = BG2.color; g.fillRect(bg2Rect.x, 0, bg2Rect.w, SH.h); }
        if (e.k === 'rect') { g.fillStyle = e.fill === 'main' ? MAIN : CONST.WHITE; g.fillRect(x, y, w, h); }
        else if (e.k === 'tile') { g.fillStyle = CONST.WHITE; rrect(g, x, y, w, h, CONST.CHIP_RADIUS); g.fill(); }
        else if (e.k === 'photo') {
          var area = null;
          if (chipBox && P.photo && P.photo.kind === 'graphic') area = graphicArea(x, y, w, h, chipAt, chipBox, kt);
          var pic = drawPhoto(g, P, sr, x, y, w, h, area);
          pics.push(pic);
          if (chipBox && pic && pic.subject) {
            var place = placeChip(x, y, X(e.vw || e.w), h, chipAt, chipBox, pic.subject);
            chipAt = place.at;
            if (place.overlap > 0) checks.push({ id: 'logo-subject', level: 'warn', text: 'Logo covers ' + pct(place.overlap) + ' of the subject in every corner' });
          }
        }
        else if (e.k === 'chip' || e.k === 'lbox') {
          if (!shown(sr, 'logo')) return;
          if (e === chipEl && chipAt) { x = chipAt.x; y = chipAt.y; }
          y += nudge(sr, 'logo', e.h || h, kt);
          var r = drawLogo(g, P, e, x, y, w, h, sizeOf(sr, 'logo'), kt, bgOf(e.on, e), plateWanted, styleOf(sr, 'logo').variant || null);
          if (r.pic) pics.push(r.pic);
          if (r.fit) fit.logo = r.fit;
          if (!logoNoted) { logoNoted = true; r.notes.forEach(function (n) { checks.push(n); }); }
        }
        else if (e.k === 'text') {
          var txt = P.words[e.slot]; if (!txt || !shown(sr, e.slot)) return;
          var bg = bgOf(e.on, e), col;
          y += nudge(sr, e.slot, e.h, kt);
          if (e.ink === 'ink') col = { color: CONST.INK, ratio: contrast(bg, CONST.INK) };
          else if (e.ink === 'muted') col = { color: CONST.MUTED, ratio: contrast(bg, CONST.MUTED) };
          else if (e.ink === 'brand') col = contrast(P.main, bg) >= CONST.TEXT_CONTRAST_MIN ? { color: P.main, ratio: contrast(P.main, bg) } : { color: CONST.INK, ratio: contrast(bg, CONST.INK) };
          else col = textOn(bg);
          if (bg != null) col.bg = bg;
          col = colourOf(sr, e.slot, col);
          var piece = sizeOf(sr, e.slot);
          var min = Math.max(1, Math.round(e.min * kt)), max = Math.max(min, Math.round(e.max * kt * piece));
          if (piece < 1) min = Math.min(min, max);   // a size below 100% may go under the layout's floor on purpose
          var fo = fontOf(sr, e.slot, e.font === 'head' ? P.fonts.head : P.fonts.body, e.font === 'head' ? P.fonts.headWeight : e.weight), fam = fo.fam, wt = fo.wt;
          var single = e.mid && e.h <= 40;
          var f = fitText(g, txt, w, h, max, min, wt, fam, single);
          drawLines(g, f, x, y, w, h, e.align, e.mid, col.color);
          fit[e.slot] = { size: f.size, over: f.over, lines: f.lines.length, contrast: round1(col.ratio) };
          if (f.over) checks.push({ id: 'fit-' + e.slot, level: 'bad', text: SLOT_WORDS[e.slot] + ' does not fit at the smallest size (' + min + ' px)' });
          if (col.ratio < CONST.TEXT_CONTRAST_MIN) checks.push({ id: 'contrast-' + e.slot, level: 'warn', text: SLOT_WORDS[e.slot] + ' contrast ' + round1(col.ratio) + ' to 1, below 4.5' + (col.chosen ? ' (your colour)' : '') });
        }
        else if (e.k === 'button') {
          if (!P.words.button || !shown(sr, 'button')) return;
          y += nudge(sr, 'button', e.h, kt);
          var bst = styleOf(sr, 'button'), bfill = hexOk(bst.fill) ? hexNorm(bst.fill) : P.accent;
          var bf = sizeOf(sr, 'button'), bh = Y(e.h) * bf, maxw = X(e.maxw) * bf;
          var bcol = textOn(bfill), pad = CONST.BUTTON_PAD_X * kt; bcol.bg = bfill; bcol = colourOf(sr, 'button', bcol);
          var bfo = fontOf(sr, 'button', P.fonts.body, 800);
          var bmin = Math.max(1, Math.round(CONST.BUTTON_TEXT_MIN * kt)), bmax = Math.max(bmin, Math.round(e.h * CONST.BUTTON_TEXT * kt * bf));
          var bfit = fitText(g, P.words.button, maxw - 2 * pad, bh, bmax, bmin, bfo.wt, bfo.fam, true);
          setFont(g, bfo.wt, bfit.size, bfo.fam);
          var bw = Math.min(maxw, g.measureText(bfit.lines[0]).width + 2 * pad);
          g.fillStyle = bfill; rrect(g, x, y, bw, bh, bh / 2); g.fill();
          drawLines(g, bfit, x + pad, y, bw - 2 * pad, bh, 'center', true, bcol.color);
          fit.button = { size: bfit.size, over: bfit.over, lines: 1, contrast: round1(bcol.ratio) };
          if (bfit.over) checks.push({ id: 'fit-button', level: 'bad', text: 'Button does not fit at the smallest size (' + bmin + ' px)' });
          if (bcol.ratio < CONST.TEXT_CONTRAST_MIN) checks.push({ id: 'contrast-button', level: 'warn', text: 'Button contrast ' + round1(bcol.ratio) + ' to 1, below 4.5' });
          if (contrast(bfill, bgOf(e.on, e)) < 1.2) checks.push({ id: 'button-blend', level: 'warn', text: 'Button colour matches the panel behind it' });
        }
      });

      // Picture checks, one line each
      pics.forEach(function (p) {
        if (!p) return;
        if (p.kind === 'photo' && p.share != null) {
          checks.push({ id: 'share', level: p.share >= CONST.PHOTO_SHARE_MIN ? 'ok' : 'warn',
            text: 'Photo shows ' + pct(p.share) + ' of the picture' });
        }
        if (p.have && p.need) {
          var cl = sharpClass(p.have / p.need);
          checks.push({ id: 'sharp-' + p.kind, level: cl,
            text: p.label + ' ' + Math.round(p.have) + ' px: ' + SHARP_WORD[cl] + ' (needs ' + Math.round(p.need) + ')' });
        }
      });
      var anyOver = checks.some(function (c) { return /^fit-/.test(c.id); });
      if (!anyOver) checks.unshift({ id: 'fit', level: 'ok', text: 'All text fits' });
      return { canvas: cv, checks: order(checks), fit: fit, shape: L.shape, layout: L.code, width: SH.w, height: SH.h };
    });
  }
  function order(checks) {
    var rank = { bad: 0, warn: 1, ok: 2 }, seen = {};
    return checks.filter(function (c) { if (seen[c.id]) return false; seen[c.id] = 1; return true; })
      .sort(function (a, b) { return rank[a.level] - rank[b.level]; });
  }

  // The chip's size before it is drawn, so the photo can make room for it.
  function chipSize(g, P, e, f, kt) {
    var ch = e.h * kt * f, cmax = e.maxw * kt * f, px = CONST.CHIP_PAD_X * kt, py = CONST.CHIP_PAD_Y * kt;
    var plan = logoPlan(P, e.on);
    if (!plan.img) {
      var nmin = Math.max(1, Math.round(14 * kt));
      var nf = fitText(g, P.name || '', cmax - 2 * px, ch, Math.max(nmin, Math.round(ch * 0.52)), nmin, P.fonts.headWeight, P.fonts.head, true);
      setFont(g, P.fonts.headWeight, nf.size, P.fonts.head);
      return { w: Math.min(cmax, g.measureText(nf.lines[0]).width + 2 * px), h: ch };
    }
    var ar = natW(plan.img) / natH(plan.img), inH = ch - 2 * py, dw = inH * ar;
    if (dw > cmax - 2 * px) dw = cmax - 2 * px;
    return { w: dw + 2 * px, h: ch };
  }
  // Where a graphic goes when a logo sits in the same slot: beside it or
  // below it, whichever lets the graphic be drawn bigger.
  function graphicArea(x, y, w, h, at, box, kt) {
    var gap = CONST.LOGO_GAP * kt;
    var right = { x: at.x + box.w + gap, y: y, w: x + w - (at.x + box.w + gap), h: h };
    var below = { x: x, y: at.y + box.h + gap, w: w, h: y + h - (at.y + box.h + gap) };
    return { right: right, below: below };
  }
  // The photo corner where the chip covers least of the subject.
  function placeChip(x, y, vw, h, at, box, sub) {
    var dx = at.x - x, dy = at.y - y;
    var cands = [
      { x: at.x, y: at.y },
      { x: x + vw - dx - box.w, y: at.y },
      { x: at.x, y: y + h - dy - box.h },
      { x: x + vw - dx - box.w, y: y + h - dy - box.h }
    ];
    var best = null;
    cands.forEach(function (c) {
      var ox = Math.max(0, Math.min(c.x + box.w, sub.x + sub.w) - Math.max(c.x, sub.x));
      var oy = Math.max(0, Math.min(c.y + box.h, sub.y + sub.h) - Math.max(c.y, sub.y));
      var ov = (ox * oy) / Math.max(1, sub.w * sub.h);
      if (!best || ov < best.overlap - 1e-9) best = { at: c, overlap: ov };
    });
    return best;
  }

  function drawPhoto(g, P, sr, x, y, w, h, area) {
    var ph = P.photo; if (!ph) { g.fillStyle = '#DDDDDD'; g.fillRect(x, y, w, h); return null; }
    var img = ph.img, IW = natW(img), IH = natH(img), have = +ph.nativeWidth || IW;
    var label = ph.kind === 'graphic' ? 'Graphic' : 'Photo';
    if (ph.kind === 'graphic') {   // fitted whole, never cropped, on its own edge colour
      g.fillStyle = edgeColour(img); g.fillRect(x, y, w, h);
      var pad = CONST.GRAPHIC_PAD, box = { x: x, y: y, w: w, h: h };
      if (area) {   // a logo shares the slot: use the free part that fits it biggest
        var sc = function (a) { return a.w > 2 * pad && a.h > 2 * pad ? Math.min((a.w - 2 * pad) / IW, (a.h - 2 * pad) / IH) : 0; };
        box = sc(area.right) >= sc(area.below) ? area.right : area.below;
      }
      var s = Math.min((box.w - 2 * pad) / IW, (box.h - 2 * pad) / IH);
      var dw = IW * s, dh = IH * s;
      g.drawImage(img, box.x + (box.w - dw) / 2, box.y + (box.h - dh) / 2, dw, dh);
      return { kind: 'graphic', label: label, have: have, need: dw * CONST.SHARP_FACTOR };
    }
    var crop = (sr && sr.crop) || { cx: 0.5, cy: 0.5, zoom: 1 };
    var r = cropRect(IW, IH, w, h, crop);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.drawImage(img, r.x, r.y, r.w, r.h, x, y, w, h);
    g.restore();
    var sub = ph.subject, sRect = null;
    if (sub && sub.w > 0 && sub.h > 0) {   // the subject box, in canvas position
      var k = w / r.w;
      sRect = { x: x + (sub.x * IW - r.x) * k, y: y + (sub.y * IH - r.y) * k, w: sub.w * IW * k, h: sub.h * IH * k };
    }
    // source pixels across the slot, in the picture's own (native) pixels
    return { kind: 'photo', label: label, share: r.share, have: r.w * (have / IW), need: w * CONST.SHARP_FACTOR, subject: sRect };
  }

  // The colour round a graphic's edge, so the slot matches its background.
  function edgeColour(img) {
    try {
      var cv = document.createElement('canvas'); cv.width = 24; cv.height = 24;
      var c = cv.getContext('2d'); c.drawImage(img, 0, 0, 24, 24);
      // the commonest border colour, so a subject touching the edge does not tint it
      var d = c.getImageData(0, 0, 24, 24).data, buckets = {}, best = null;
      for (var i = 0; i < 24; i++) for (var j = 0; j < 24; j++) {
        if (i > 0 && i < 23 && j > 0 && j < 23) continue;
        var k = (j * 24 + i) * 4; if (d[k + 3] < 128) continue;
        var key = (d[k] >> 4) + '-' + (d[k + 1] >> 4) + '-' + (d[k + 2] >> 4);
        var bk = buckets[key] = buckets[key] || { n: 0, r: 0, g: 0, b: 0 };
        bk.n++; bk.r += d[k]; bk.g += d[k + 1]; bk.b += d[k + 2];
        if (!best || bk.n > best.n) best = bk;
      }
      if (!best) return CONST.WHITE;
      var hx = function (v) { return ('0' + Math.round(v / best.n).toString(16)).slice(-2); };
      return '#' + hx(best.r) + hx(best.g) + hx(best.b);
    } catch (e) { return CONST.WHITE; }
  }

  function drawLogo(g, P, e, x, y, w, h, f, kt, bg, plateWanted, variant) {
    var plan = logoPlan(P, e.on, variant), notes = [], src = (P.logo && P.logo.source) || '';
    if (plateWanted === true && plan.img && !plan.box) plan.box = CONST.WHITE;    // v1.1.0: plate forced on
    if (plateWanted === false && plan.img && e.on !== 'photo') plan.box = null;     // v1.1.0: plate forced off (never on a photo)
    if (!plan.img) {   // no logo: the business name in the heading font
      // the name sits on the panel, on white paper, or on a white chip over a photo
      var onPhoto = e.on === 'photo', chip = e.k === 'chip';
      var bH = chip ? h * f : h, bW = chip ? e.maxw * kt * f : w, ip = onPhoto ? CONST.CHIP_PAD_X * kt : 0;
      if (chip && onPhoto) bW = chipSize(g, P, e, f, kt).w;
      var col = e.on === 'main' ? textOn(P.main).color
        : (contrast(P.main, CONST.WHITE) >= CONST.TEXT_CONTRAST_MIN ? P.main : CONST.INK);
      if (onPhoto) { g.fillStyle = CONST.WHITE; rrect(g, x, y, bW, bH, CONST.CHIP_RADIUS * kt); g.fill(); }
      var nmax = Math.round((chip ? bH * 0.52 : 44 * kt * f)), nmin = Math.max(1, Math.round(14 * kt));
      var nf = fitText(g, P.name || '', bW - 2 * ip, bH, Math.max(nmin, nmax), nmin, P.fonts.headWeight, P.fonts.head, chip);
      drawLines(g, nf, x + ip, y, bW - 2 * ip, bH, chip ? 'left' : 'center', true, col);
      notes.push({ id: 'logo-none', level: 'warn', text: 'No logo: the name is set in type' });
      return { notes: notes, fit: { size: nf.size, over: nf.over } };
    }
    var img = plan.img, IW = natW(img), IH = natH(img), ar = IW / IH;
    var have = (plan.variant === 'main' ? +(P.logo.nativeWidth) : +(P.logo.lightNativeWidth)) || IW;
    var dx, dy, dw, dh, boxed = !!plan.box || e.on === 'photo';
    var boxCol = plan.box || CONST.WHITE;
    if (e.k === 'chip') {
      var ch = e.h * kt * f, cmax = e.maxw * kt * f, px = CONST.CHIP_PAD_X * kt, py = CONST.CHIP_PAD_Y * kt;
      var inH = boxed ? ch - 2 * py : ch, inMax = boxed ? cmax - 2 * px : cmax;
      dh = inH; dw = dh * ar; if (dw > inMax) { dw = inMax; dh = dw / ar; }
      dx = x + (boxed ? px : 0); dy = y + (boxed ? py : 0) + (inH - dh) / 2;
      if (boxed) { g.fillStyle = boxCol; rrect(g, x, y, dw + 2 * px, ch, CONST.CHIP_RADIUS * kt); g.fill(); }
    } else {
      var pad = boxed ? CONST.BOX_PAD * kt : 0;
      var s = Math.min((w - 2 * pad) / IW, (h - 2 * pad) / IH) * f;
      dw = IW * s; dh = IH * s; dx = x + (w - dw) / 2; dy = y + (h - dh) / 2;
      if (boxed) { g.fillStyle = boxCol; rrect(g, dx - pad, dy - pad, dw + 2 * pad, dh + 2 * pad, CONST.BOX_RADIUS * kt); g.fill(); }
    }
    g.drawImage(img, dx, dy, dw, dh);
    if (plan.why === 'opaque') notes.push({ id: 'logo-opaque', level: 'warn', text: 'Logo is not transparent: it shows its own background' });
    else if (boxed && boxCol === CONST.WHITE && e.on !== 'photo' && !(P.logo && P.logo.light)) notes.push({ id: 'logo-box', level: 'warn', text: 'No light logo: the logo sits on a white box' });
    else if (boxed && boxCol !== CONST.WHITE) notes.push({ id: 'logo-box', level: 'warn', text: 'Logo is light: it sits on a dark box' });
    if (plan.why === 'unknown') notes.push({ id: 'logo-tone', level: 'warn', text: 'Logo colour could not be measured: check it reads' });
    if (plan.variant === 'light') notes.push({ id: 'logo-light', level: 'ok', text: 'Light logo used on the dark colour' });
    if (src === 'print') notes.push({ id: 'logo-print', level: 'warn', text: 'Logo cut from print: check it' });
    return { notes: notes, pic: { kind: 'logo', label: 'Logo', have: have, need: dw * CONST.SHARP_FACTOR } };
  }

  // ══════════════════════════════════════════════════════════════
  //  Recipe: what ADS reformat-recipe holds, so a version can be
  //  reopened and rebuilt exactly. Wording is shared by both shapes.
  // ══════════════════════════════════════════════════════════════
  function shapePart(sr) {
    if (!sr) return null;
    var s = {}; CONST.STYLE_PIECES.forEach(function (k) { if (sr.sizes && sr.sizes[k] != null) s[k] = round3(sizeOf(sr, k)); });
    CONST.SIZE_PIECES.forEach(function (k) { if (s[k] == null) s[k] = round3(sizeOf(sr, k)); });
    var st = null;
    if (sr.style) { st = {}; Object.keys(sr.style).forEach(function (k) { var v = sr.style[k]; if (!v || typeof v !== 'object') return; var o = {};
      if (v.font) o.font = String(v.font); if (v.weight) o.weight = +v.weight; if (hexOk(v.color)) o.color = hexNorm(v.color); if (hexOk(v.fill)) o.fill = hexNorm(v.fill);
      if (v.dy) o.dy = Math.round(+v.dy); if (v.show === false) o.show = false; if (v.variant === 'dark' || v.variant === 'light') o.variant = v.variant;
      if (Object.keys(o).length) st[k] = o; }); if (!Object.keys(st).length) st = null; }
    var out = { layout: sr.layout, crop: sr.crop ? { mode: sr.crop.mode, cx: round3(sr.crop.cx), cy: round3(sr.crop.cy), zoom: round3(sr.crop.zoom) } : null, sizes: s };
    if (st) out.style = st;
    if (sr.bg) out.bg = sr.bg;
    if (sr.bg2 && sr.bg2.color) out.bg2 = { color: sr.bg2.color, w: round3(sr.bg2.w || 0.35), side: sr.bg2.side === 'left' ? 'left' : 'right' };   // v1.3.0
    if (typeof sr.plate === 'boolean') out.plate = sr.plate;
    return out;
  }
  var recipe = {
    make: function (o) {
      var inp = o.input || {}, w = inp.wording || {};
      return {
        v: 2,
        made: { module: 'ix-ad-layouts', version: VERSION, at: new Date().toISOString() },
        wording: {
          headline: clean(w.headline), headline2: clean(w.headline2), supporting: clean(w.supporting),
          button: clean(w.button), phone: clean(w.phone), website: clean(w.website), small_print: clean(w.small_print)
        },
        headlineSlot: inp.headlineSlot === 'headline2' ? 'headline2' : 'headline',
        name: clean(inp.name),
        colors: { main: (inp.colors && inp.colors.main) || '', accent: (inp.colors && inp.colors.accent) || '' },
        fonts: inp.fonts || null,
        logo: inp.logo ? { source: inp.logo.source || '', url: inp.logo.url || '', lightUrl: inp.logo.lightUrl || '',
          nativeWidth: inp.logo.nativeWidth || null, lightNativeWidth: inp.logo.lightNativeWidth || null } : null,
        photo: inp.photo ? { url: inp.photo.url || '', kind: inp.photo.kind || 'photo', nativeWidth: inp.photo.nativeWidth || null,
          focus: inp.photo.focus || null, subject: inp.photo.subject || null } : null,
        banner: shapePart(o.banner), sidebar: shapePart(o.sidebar)
      };
    },
    stringify: function (r) { return JSON.stringify(r, null, 1); },
    parse: function (text) {
      var r; try { r = JSON.parse(text); } catch (e) { throw new Error('Recipe is not valid JSON.'); }
      if (!r || (r.v !== 1 && r.v !== 2)) throw new Error('Recipe version not recognised (expected v 1 or 2).');
      ['banner', 'sidebar'].forEach(function (k) {
        if (r[k] && !LAYOUTS[r[k].layout]) throw new Error('Recipe ' + k + ' names an unknown layout: ' + r[k].layout);
        if (r[k] && LAYOUTS[r[k].layout].shape !== k) throw new Error('Recipe ' + k + ' layout ' + r[k].layout + ' is not a ' + k + ' layout.');
      });
      if (!r.banner && !r.sidebar) throw new Error('Recipe holds no shape.');
      return r;
    }
  };
  function loadImage(url, resolve) {
    if (!url) return Promise.resolve(null);
    if (resolve) { var got = resolve(url); if (got) return Promise.resolve(got); }
    return new Promise(function (ok, bad) {
      var i = new Image(); i.crossOrigin = 'anonymous';
      i.onload = function () { ok(i); }; i.onerror = function () { bad(new Error('Could not load ' + url)); };
      i.src = url;
    });
  }
  function rebuild(r, opts) {
    opts = opts || {};
    if (typeof r === 'string') r = recipe.parse(r);
    var res = opts.resolve;
    return Promise.all([
      loadImage(r.logo && r.logo.url, res), loadImage(r.logo && r.logo.lightUrl, res), loadImage(r.photo && r.photo.url, res)
    ]).then(function (imgs) {
      var input = {
        name: r.name, wording: r.wording, headlineSlot: r.headlineSlot, colors: r.colors, fonts: r.fonts,
        logo: r.logo ? { main: imgs[0], light: imgs[1], source: r.logo.source, url: r.logo.url, lightUrl: r.logo.lightUrl,
          nativeWidth: r.logo.nativeWidth, lightNativeWidth: r.logo.lightNativeWidth } : null,
        photo: (r.photo && imgs[2]) ? { img: imgs[2], kind: r.photo.kind, url: r.photo.url, nativeWidth: r.photo.nativeWidth,
          focus: r.photo.focus, subject: r.photo.subject } : null
      };
      var job = function (k) { return r[k] ? paint(input, { shape: k, layout: r[k].layout, crop: r[k].crop, sizes: r[k].sizes, style: r[k].style || null, bg: r[k].bg || null, bg2: r[k].bg2 || null, plate: typeof r[k].plate === 'boolean' ? r[k].plate : null }) : Promise.resolve(null); };
      return Promise.all([job('banner'), job('sidebar')]).then(function (out) { return { banner: out[0], sidebar: out[1], input: input }; });
    });
  }

  window.IxAdLayouts = {
    VERSION: VERSION, CONST: CONST, LAYOUTS: LAYOUTS, ORDER: ORDER,
    shapes: shapes, choose: choose, paint: paint, cropFor: cropFor,
    recipe: recipe, rebuild: rebuild, contrast: contrast, textOn: textOn,
    ensureFont: ensureFont, styleOf: styleOf, logoTone: logoTone
  };
  log('ready');
})();
