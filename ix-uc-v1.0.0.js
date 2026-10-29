/* ix-uc-v1.0.0.js
   INBXIFY · ix-uc · Uploadcare pictures sized where they are shown.

   v1.0.0 (29 Oct 2026, Image Fields S1). Jeff's ruling (29 Oct): each asset
   keeps one clean Main URL (host and photo ID, nothing after) and every size
   is made where the picture is shown. This is the browser's one place for
   that, the twin of the Data Worker's ucSized and ASM.uc (ix-issue-data
   v1.0.123+). Every T-A and IPP file that shows a stored picture link asks
   here instead of adding its own recipe.

     IxUc.base(url)          https://<host>/<photo ID>/ with everything after
                             the photo ID dropped (a stored resize, an old
                             crop, a file name). '' when the link is not an
                             Uploadcare link.
     IxUc.sized(url, name)   base + the named recipe. A link that is not
                             Uploadcare (a Webflow-hosted copy) comes back as
                             given, so callers never lose a picture.
     IxUc.recipes            the recipe names and values (a copy).

   Works the same on today's links (with a stored size) and on clean ones.
   Load it once, early in the page body (before any file that uses it).

   HARDCODING (provisional, Image Fields S1):
     HC-P-IF1-3  RECIPES below. card must equal the Worker's ASM.uc.card.
     HC-P-IF1-2  Uploadcare's CDN host names (same list as the Worker).
*/
(function () {
  'use strict';
  var VERSION = '1.0.0';
  var RECIPES = {
    thumb: '-/preview/480x480/-/format/auto/-/quality/smart/',   // tiles and lists: whole photo, at most 480, never enlarged
    card:  '-/resize/1400x/-/format/auto/-/quality/smart/'       // previews and cards: whole photo, 1400 wide (= Worker ASM.uc.card)
  };
  var HOSTS = /(^|\.)(ucarecd\.net|ucarecdn\.com)$/i;
  var ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var warned = {};

  function base(url) {
    var s = String(url == null ? '' : url).trim();
    var m = /^https?:\/\/([^\/?#]+)\/([^\/?#]+)/i.exec(s);
    if (!m || !HOSTS.test(m[1]) || !ID.test(m[2])) return '';
    return 'https://' + m[1].toLowerCase() + '/' + m[2].toLowerCase() + '/';
  }
  function sized(url, name) {
    var b = base(url);
    if (!b) return String(url == null ? '' : url).trim();
    if (!Object.prototype.hasOwnProperty.call(RECIPES, name)) {
      if (!warned[name]) { warned[name] = 1; try { console.warn('[ix-uc] No recipe named "' + name + '"; showing the photo unsized.'); } catch (e) {} }
      return b;
    }
    return b + RECIPES[name];
  }
  var copy = {}; Object.keys(RECIPES).forEach(function (k) { copy[k] = RECIPES[k]; });
  window.IxUc = { version: VERSION, base: base, sized: sized, recipes: copy };
})();
