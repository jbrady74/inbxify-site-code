# manifests/

One file per operator page: the list of CSS and JS files that page loads, in order.
The two loader tags on the Webflow page never change. **Going live is committing a manifest. Rolling back is reverting that commit.**

| Manifest | Webflow page | Loader tags use |
|---|---|---|
| `quill.json` | quill-admin (static page) | `data-ix-page="quill"` |
| `portal.json` | PUBLISHERS Template | `data-ix-page="portal"` |
| `ta.json` | TITLES-ADMIN Template (TA Studio) | `data-ix-page="ta"` |
| `ipp.json` | PUBLICATION PLAN Template (the IPP) | `data-ix-page="ipp"` |
| `review.json` | review (static page, /review) | `data-ix-page="review"` |

How it works: `ix-load-v1.0.0.js` (the tag on the page) reads `loaders/ix-load-<page>-<slot>.js`, a small stub that never changes. The stub reads the real list, `ix-load-<page>-<slot>.list.js`, which `tools/build-loaders.mjs` generates from the manifest.

- **On main** the stub reads the list from **GitHub Pages** (`https://jbrady74.github.io/inbxify-site-code/`). The **Loaders** Action publishes it there on every push to main, with every file named at that exact commit (`@<sha>`). Nothing waits on a jsDelivr purge, so a merge reaches every browser about a minute after the Action's Pages job finishes. If Pages ever does not answer, the stub falls back to the jsDelivr copy of the `.list.js`.
- **On a preview branch** (`?ixbranch=`) the stub reads the branch's `.list.js` on jsDelivr, as before.

A red Loaders run means the pages are still on the last good lists. A HELD BACK warning about a `.list.js` on main is only the fallback copy and holds nothing up.

Rules:
- Name files by their exact versioned filename. Never edit a file under a live name.
- Before committing a manifest change, run `node tools/build-loaders.mjs` and commit `loaders/` with it. (If you forget, the Action does it.)
- Never edit `loaders/` by hand.
- `"confirmed": false` means the list was drafted and not yet checked against the live page's tags. Do not cut that page over.
- Page config (QUILL_CONFIG, TA_CONFIG, PP_WEBHOOKS, the PUBLISHERS embed) stays in Webflow, above the head loader tag. It is not code.
- `ta.json` lists `ta-converter` as a repo file. The old TITLES-ADMIN body read it from rawcdn.githack.com; on the loader it comes from jsDelivr like every other file, so previews and the CDN check cover it.

Preview on the live site, one browser tab only: add `?ixbranch=<branch>` to the page address. The branch must start with `reskin-`, `agent-` or `jeff-`. `?ixbranch=off` ends it.

The entry format is in the header of `tools/build-loaders.mjs`.
