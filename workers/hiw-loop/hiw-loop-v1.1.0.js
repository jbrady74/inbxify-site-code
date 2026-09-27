/**
 * INBXIFY — HIW animated-loop server Worker
 *
 * Purpose: serve the diagram HTML with Content-Type: text/html so it renders
 * inside an iframe. jsDelivr serves .html as text/plain (shows source) and
 * githack gates rawcdn behind an interstitial — both break iframe embedding.
 * This Worker pulls the file from GitHub raw and re-serves it correctly.
 *
 * Deploy:
 *   - New Worker (e.g. "hiw-loop") in the same account as your other Workers.
 *   - Paste this in, deploy. URL will be like:
 *       https://hiw-loop.jeff-2cd.workers.dev/
 *   - To update the diagram version later, change DIAGRAM_FILE below (or pass ?v=).
 *
 * Cache: short edge cache so version bumps propagate; bump ?v= to force-refresh.
 */

const REPO_RAW = 'https://raw.githubusercontent.com/jbrady74/inbxify-site-code/main/';
const DIAGRAM_FILE = 'hiw-animated-loop-v2.3.html'; // <-- update on version bump

export default {
  async fetch(request) {
    const url = new URL(request.url);
    // Allow ?file= override for testing other versions without redeploy.
    const file = url.searchParams.get('file') || DIAGRAM_FILE;

    // Only allow our own diagram filenames (no open proxy).
    if (!/^hiw-animated-loop-v[\d._]+\.html$/.test(file)) {
      return new Response('Not found', { status: 404 });
    }

    const upstream = await fetch(REPO_RAW + file, {
      cf: { cacheTtl: 300, cacheEverything: true },
    });

    if (!upstream.ok) {
      return new Response('Upstream fetch failed: ' + upstream.status, { status: 502 });
    }

    const html = await upstream.text();

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
