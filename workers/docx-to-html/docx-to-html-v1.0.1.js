// ============================================================
// docx-to-html-worker.js
// INBXIFY · Cloudflare Worker · DOCX → HTML via Mammoth
// v1.0.1 — npm-style import for Cloudflare Workers bundler
//
// Endpoint: POST binary DOCX body → returns { html: "..." }
// Called by: Scenario F route 3 (article-body)
// ============================================================

import mammoth from "mammoth";

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (request.method !== "POST") {
      return json({ error: "POST required" }, 405);
    }

    // Optional shared-secret check
    if (env.DOCX_WORKER_SECRET) {
      const auth = request.headers.get("Authorization") || "";
      if (auth !== `Bearer ${env.DOCX_WORKER_SECRET}`) {
        return json({ error: "unauthorized" }, 401);
      }
    }

    try {
      const buffer = await request.arrayBuffer();
      if (!buffer || buffer.byteLength === 0) {
        return json({ error: "empty body" }, 400);
      }

      const options = {
        styleMap: [
          "p[style-name='Heading 1'] => h2",
          "p[style-name='Heading 2'] => h3",
          "p[style-name='Heading 3'] => h4",
          "p[style-name='Quote'] => blockquote > p",
          "p[style-name='Intense Quote'] => blockquote > p",
          "b => strong",
          "i => em",
        ],
        ignoreEmptyParagraphs: true,
      };

      const result = await mammoth.convertToHtml({ arrayBuffer: buffer }, options);
      const html = result.value || "";
      const messages = (result.messages || []).map(m => ({
        type: m.type,
        message: m.message,
      }));

      return json({
        html,
        length: html.length,
        messages,
      });
    } catch (err) {
      return json({
        error: "conversion_failed",
        detail: String(err && err.message ? err.message : err),
      }, 500);
    }
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
