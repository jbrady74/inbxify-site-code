# manifests/

One file per operator page: the list of CSS and JS files that page loads, in order.
The two loader tags on the Webflow page never change. **Going live is committing a manifest. Rolling back is reverting that commit.**

| Manifest | Webflow page | Loader tags use |
|---|---|---|
| `quill.json` | quill-admin (static page) | `data-ix-page="quill"` |
| `portal.json` | PUBLISHERS Template | `data-ix-page="portal"` |

How it works: `ix-load-v1.0.0.js` (the tag on the page) reads `loaders/ix-load-<page>-<slot>.js`, which `tools/build-loaders.mjs` generates from the manifest. The **Loaders** GitHub Action runs the build on every push to `main` and to preview branches, purges jsDelivr and checks the CDN serves the new copy. A red run means the pages are still on the last good lists.

Rules:
- Name files by their exact versioned filename. Never edit a file under a live name.
- Before committing a manifest change, run `node tools/build-loaders.mjs` and commit `loaders/` with it. (If you forget, the Action does it.)
- Never edit `loaders/` by hand.
- `"confirmed": false` means the list was drafted and not yet checked against the live page's tags. Do not cut that page over.
- Page config (QUILL_CONFIG, TA_CONFIG, the PUBLISHERS embed) stays in Webflow. It is not code.

Preview on the live site, one browser tab only: add `?ixbranch=<branch>` to the page address. The branch must start with `reskin-`, `agent-` or `jeff-`. `?ixbranch=off` ends it.

The entry format is in the header of `tools/build-loaders.mjs`.
