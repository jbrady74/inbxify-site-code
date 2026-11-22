# canva-app · the inbxify app inside Canva

The side panel Jeff opens in Canva (Apps → inbxify) on a design that Ad Maker sent there. It shows the match sheet for
that design: the colours read off the original ad with their hex codes, and each block of text with the closest Canva
font, weight, size and colour. **Add** places one block on the design; **Add all words** places every block. Blocks
keep their places when the design has the original ad's proportions, and stack down the left when the shape changed.

- App: "inbxify" in Canva's developer portal, App ID `AAHOGMgrrlE`, Teams account The Healthiest.
- Backend: ix-canva v0.3.0 `GET /app/job` (Canva user token + design token, both verified against the app's JWKS).
- The sheet itself is read by Ad Maker (ta-admaker v4.11.2) when Edit in Canva is pressed, and stored on the job.

## Only the app's own file lives here

`src/intents/design_editor/app.tsx` is the whole app. Everything else is Canva's starter kit, unchanged.

## Build

```
git clone --depth 1 https://github.com/canva-sdks/canva-apps-sdk-starter-kit.git canva-kit
cd canva-kit && cp .env.template .env
# in .env: CANVA_APP_ID=AAHOGMgrrlE and CANVA_BACKEND_HOST=https://ix-canva.jeff-2cd.workers.dev
npm install
cp ../inbxify-site-code/canva-app/src/intents/design_editor/app.tsx src/intents/design_editor/app.tsx
rm -rf src/intents/design_editor/__tests__
npm run build        # → dist/app.js
```

Upload `dist/app.js` in the developer portal (App source → JavaScript file), then Preview.

## History

- v0.1.0 (18 Nov 2026, Ad Maker Build S1): colours, fonts, sizes, Add / Add all words.
