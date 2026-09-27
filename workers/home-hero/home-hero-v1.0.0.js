// home-hero-v1.0.0.js
export default {
  async fetch() {
    const src = "https://raw.githubusercontent.com/jbrady74/inbxify-site-code/main/public-site/inbxify-home-hero-v2.8.html";
    const r = await fetch(src, { cf: { cacheTtl: 60 } });
    const html = await r.text();
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};
