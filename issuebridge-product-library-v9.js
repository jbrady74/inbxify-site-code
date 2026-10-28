// ====================================================================
// LEGACY — ISSUEBRIDGE v9.x PRODUCT LIBRARY TEMPLATE CODE
// Retired 28 Oct 2026 (Code-Built Site S6). Kept verbatim for reference.
// Replaced on the PRODUCT LIBRARY template by PL1 (head) and PL2 (before
// body): ix-shell v1.0.9 + ix-franchise v1.0.0. See HC-P-CB-33.
//
// This file is NOT loaded anywhere. It records exactly what was in the
// three Webflow custom-code boxes before replacement.
// ====================================================================

// --------------------------------------------------------------------
// HEAD box (two lines)
// --------------------------------------------------------------------
/*
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
*/

// --------------------------------------------------------------------
// BEFORE BODY box — script 1 (unified engine)
// --------------------------------------------------------------------
// ====================================================================
// ISSUEBRIDGE v9.x — UNIFIED ENGINE (SINGLE FORM ON PRODUCT LIBRARY TEMPLATE)
//  - TA + PUB from URL
//  - TA Name injection via Make + local cache
//  - Hidden TA field
//  - Customer dropdown (by Publisher) — NO SORTING (stability)
//  - 22-product visibility engine
//  - 3 conditional redirect fields (Ad / Real Estate / Event)
//  - Price formatting + URL normalization
//  - Flatpickr auto-expiration
//  - Lightweight console diagnostic
// ====================================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("🟧 ISSUEBRIDGE — Unified Engine Boot");

  // ---------------------------------------------------------
  // UTILITIES
  // ---------------------------------------------------------
  function waitForEl(selector, callback, timeoutMs = 8000) {
    const start = performance.now();
    (function check() {
      const el = document.querySelector(selector);
      if (el) return callback(el);
      if (performance.now() - start > timeoutMs) {
        console.warn("⏱ waitForEl timeout:", selector);
        return;
      }
      requestAnimationFrame(check);
    })();
  }

  // ---------------------------------------------------------
  // URL PARAMS (TA + PUB)
  // ---------------------------------------------------------
  const params     = new URLSearchParams(window.location.search);
  const TA_ID_URL  = params.get("ta")  || "";
  const PUB_ID_URL = params.get("pub") || "";

  window.IB_TA_ID  = TA_ID_URL;
  window.IB_PUB_ID = PUB_ID_URL;

  console.log("🔶 TA from URL:", TA_ID_URL);
  console.log("🔶 PUB from URL:", PUB_ID_URL);

  // ---------------------------------------------------------
  // TA NAME INJECTION + HIDDEN TA FIELD
  // ---------------------------------------------------------
  if (!TA_ID_URL) {
    console.error("❌ No TA_ID in URL — TA name + hidden field will not be set.");
  } else {
    const cacheKey   = "TA_NAME_CACHE_" + TA_ID_URL;
    const cachedName = localStorage.getItem(cacheKey);

    // Always set hidden field as early as possible
    waitForEl("input[name='title-admin-id']", (hidden) => {
      hidden.value = TA_ID_URL;
      console.log("✅ Hidden TA field populated:", TA_ID_URL);
    });

    // Instant heading from cache, if present
    if (cachedName) {
      waitForEl("#title-display-name", (heading) => {
        heading.textContent = cachedName;
        console.log("⚡ Loaded cached TA Name from cache:", cachedName);
      });
    }

    // Call Make webhook for fresh name
    fetch("https://hook.us1.make.com/4frt8d856vg5t6zooisfrypqi7k18t4o", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ta_id: TA_ID_URL })
    })
      .then(res => res.json())
      .then(data => {
        console.log("🔶 Make returned:", data);
        if (!data || !data.ta_name) {
          console.error("❌ Make returned no TA Name");
          return;
        }

        waitForEl("#title-display-name", (heading) => {
          heading.textContent = data.ta_name;
          console.log("✨ Injected TA Name:", data.ta_name);
        });

        waitForEl("input[name='title-admin-id']", (hidden) => {
          hidden.value = TA_ID_URL;
        });

        localStorage.setItem(cacheKey, data.ta_name);
      })
      .catch(err => console.error("❌ Make Webhook Error:", err));
  }

  // ---------------------------------------------------------
  // CUSTOMER DROPDOWN (FILTERED — NO SORTING)
  // ---------------------------------------------------------
  if (PUB_ID_URL) {
    setTimeout(() => {
      console.log("📥 ISSUEBRIDGE — Customer Dropdown Builder");

      const select = document.querySelector("[name='customer_id']");
      if (!select) {
        console.warn("⚠️ No <select name='customer_id'> found — skipping customer dropdown build.");
        return;
      }

      // Reset
      select.innerHTML = "";

      // Placeholder
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Select customer";
      select.appendChild(placeholder);

      // Append customers in DOM order (stability)
      let count = 0;
      document.querySelectorAll(".customer-source").forEach(src => {
        const cusId = src.dataset.customerId;
        const pubId = src.dataset.publisherId;
        const name  = (src.textContent || "").trim();

        if (!cusId || !pubId || !name) return;
        if (pubId !== PUB_ID_URL) return;

        const opt = document.createElement("option");
        opt.value = cusId;
        opt.textContent = name;
        select.appendChild(opt);
        count++;
      });

      console.log(`✅ Customer dropdown populated (no sort): ${count}`);
    }, 80);
  }
  // ---------------------------------------------------------
  // CUSTOMER → REDIRECT URL AUTO-FILL (LIVE, NO SUBMIT)
  // ---------------------------------------------------------
  (function attachCustomerRedirectHandler() {
    const customerSelect = document.querySelector("[name='customer_id']");
    if (!customerSelect) return;

    customerSelect.addEventListener("change", () => {
      const selectedCustomerId = customerSelect.value;
      if (!selectedCustomerId) return;

      // Find matching customer-source node
      const src = document.querySelector(
        `.customer-source[data-customer-id="${selectedCustomerId}"]`
      );
      if (!src) {
        console.warn("⚠️ No customer-source found for:", selectedCustomerId);
        return;
      }

      const websiteUrl = (src.dataset.websiteUrl || "").trim();
      if (!websiteUrl) {
        console.warn("⚠️ No website URL for customer:", selectedCustomerId);
        return;
      }

      // Populate ONLY the visible redirect field(s)
      const redirectInputs = [
        "input[name='ad_redirect_url']",
        "input[name='re_redirect_url']",
        "input[name='event_redirect_url']",
        "input[name='article_redirect_url']"
      ];

      redirectInputs.forEach(sel => {
        const input = document.querySelector(sel);
        if (!input) return;

        // only populate if field is currently visible and empty
        const wrapper = input.closest("[class*='field-']");
        const isVisible =
          wrapper &&
          window.getComputedStyle(wrapper).display !== "none";

        if (isVisible && !input.value) {
          input.value = websiteUrl;
          console.log("🔗 Redirect auto-filled:", sel, websiteUrl);
        }
      });
    });
  })();

  // ---------------------------------------------------------
  // PRODUCT CONTEXT (#pl-context)
  // ---------------------------------------------------------
  const ctx = document.querySelector("#pl-context");
  if (!ctx) {
    console.error("❌ Missing #pl-context embed — visibility engine will be limited.");
  }

  const uploadType  = ctx ? (ctx.getAttribute("data-upload-type") || "") : "";
  const customerReq = ctx ? (ctx.getAttribute("data-customer-required") === "true") : false;
  let   productSlug = ctx ? (ctx.getAttribute("data-product-slug") || "") : "";
  productSlug = productSlug.split("?")[0]; // clean querystring junk

  console.log("📌 Upload Type:", uploadType);
  console.log("📌 Product Slug:", productSlug);
  console.log("📌 Customer Required (context):", customerReq);

  // ---------------------------------------------------------
  // RULE TABLE (22 PRODUCTS)
  //   Redirect flags are now:
  //     redirectAd    => Ads + The Find (ad_redirect_url)
  //     redirectRe    => Real Estate only (re_redirect_url)
  //     redirectEvent => Events only (event_redirect_url)
  // ---------------------------------------------------------
  function buildRuleTable(customerRequiredFlag) {
    const ARTICLE_RULE = {
      article: true,
      spotlight: false,
      banner: false,
      sidebar: false,
      find: false,
      events: false,
      realEstate: false,
      customer: customerRequiredFlag,
      redirectAd: false,
      redirectRe: false,
      redirectEvent: false,
      redirectArticle: true

    };

    const SPOTLIGHT_RULE = {
      article: false,
      spotlight: true,
      banner: false,
      sidebar: false,
      find: false,
      events: false,
      realEstate: false,
      customer: customerRequiredFlag,
      redirectAd: false,
      redirectRe: false,
      redirectEvent: false,
      redirectArticle: true

    };

    const BANNER_RULE = {
      article: false,
      spotlight: false,
      banner: true,
      sidebar: false,
      find: false,
      events: false,
      realEstate: false,
      customer: customerRequiredFlag,
      redirectAd: true,
      redirectRe: false,
      redirectEvent: false,
      redirectArticle: false

    };

    const SIDEBAR_RULE = {
      article: false,
      spotlight: false,
      banner: false,
      sidebar: true,
      find: false,
      events: false,
      realEstate: false,
      customer: customerRequiredFlag,
      redirectAd: true,
      redirectRe: false,
      redirectEvent: false,
      redirectArticle: false

    };

    const FIND_RULE = {
      article: false,
      spotlight: false,
      banner: false,
      sidebar: false,
      find: true,
      events: false,
      realEstate: false,
      customer: customerRequiredFlag,
      redirectAd: true,
      redirectRe: false,
      redirectEvent: false,
      redirectArticle: false

    };

    const EVENT_RULE = {
      article: false,
      spotlight: false,
      banner: false,
      sidebar: false,
      find: false,
      events: true,
      realEstate: false,
      customer: false, // events never require customer
      redirectAd: false,
      redirectRe: false,
      redirectEvent: true,
      redirectArticle: false,

    };

    const RE_RULE = {
      article: false,
      spotlight: false,
      banner: false,
      sidebar: false,
      find: false,
      events: false,
      realEstate: true,
      customer: customerRequiredFlag,
      redirectAd: false,
      redirectRe: true,
      redirectEvent: false,
      redirectArticle: false

    };

    return {
      // THE FIND — 7
      "the-find-around-town":        FIND_RULE,
      "the-find-fitness-outdoors":   FIND_RULE,
      "the-find-entertainment-arts": FIND_RULE,
      "the-find-holidays":           FIND_RULE,
      "the-find-senior-living":      FIND_RULE,
      "the-find-restaurants-retail": FIND_RULE,
      "the-find-home-garden":        FIND_RULE,

      // FEATURE ARTICLE — 4
      "community-news":  ARTICLE_RULE,
      "family-feature":  ARTICLE_RULE,
      "general-article": ARTICLE_RULE,
      "ec-article":      ARTICLE_RULE,

      // THEMED SPOTLIGHT — 7
      "travel-corner":        SPOTLIGHT_RULE,
      "wellness-watch":       SPOTLIGHT_RULE,
      "recipe-corner":        SPOTLIGHT_RULE,
      "sports-corner":        SPOTLIGHT_RULE,
      "book-corner":          SPOTLIGHT_RULE,
      "pet-corner":           SPOTLIGHT_RULE,
      "contractor-spotlight": SPOTLIGHT_RULE,

      // REAL ESTATE LISTINGS — 1
      "real-estate-listing":  RE_RULE,

      // EVENTS CALENDAR — 1
      "local-event":          EVENT_RULE,

      // SIDEBAR ADS — 1
      "sidebar-ad":           SIDEBAR_RULE,

      // BANNER ADS — 1
      "banner-ad":            BANNER_RULE
    };
  }

  const RULES       = buildRuleTable(customerReq);
  const ACTIVE_RULE = productSlug ? RULES[productSlug] : null;

  if (!ACTIVE_RULE && productSlug) {
    console.error("❌ No visibility rules for slug:", productSlug);
  }

  // ---------------------------------------------------------
  // VISIBILITY ENGINE (FIELDS)
  // ---------------------------------------------------------
  setTimeout(() => {
    console.log("🎛️ ISSUEBRIDGE — Visibility Engine Init");

    if (!ACTIVE_RULE) {
      console.warn("⚠️ Skipping visibility engine — no ACTIVE_RULE");
      return;
    }

    function showWrapper(cls, state) {
      document.querySelectorAll("." + cls).forEach(el => {
        el.style.setProperty("display", state ? "block" : "none", "important");
        el.style.visibility = state ? "visible" : "hidden";
      });
    }

    function resetAllFields() {
      const allClasses = [
        // Article fields
        "field-article-title",
        "field-article-subtitle",
        "field-article-summary",
        "field-article-body",
        "field-article-writer",
        "field-article-cowriter",        // ADD
				"field-article-short-summary",   // ADD
        "field-article-feature-image",
        "field-article-spotlight-image",

        // Ad fields
        "field-banner-image",
        "field-sidebar-image",
        "field-ad-name",

        // The Find
        "field-find-logo",
        "field-find-heading",
        "field-find-body",

        // Events
        "field-event-name",
        "field-event-location",
        "field-event-date-start",
        "field-event-date-end",
        "field-event-start-time",
        "field-event-end-time",
        "field-event-description",
        "field-event-image",

        // Real Estate
        "field-property-address",
        "field-property-price",
        "field-property-features",
        "field-property-image",
        "field-property-mls-number",
        "field-property-listing-status",

        // Redirect wrappers (new)
        "field-redirect-ad",
        "field-redirect-event",
        "field-redirect-re",
        "field-redirect-article",

        // Customer wrapper
        "field-customer"
      ];
      allClasses.forEach(c => showWrapper(c, false));
    }

    function applyFeatureArticle(on) {
      if (!on) return;
      showWrapper("field-article-title", true);
      showWrapper("field-article-subtitle", true);
      showWrapper("field-article-summary", true);
      showWrapper("field-article-body", true);
      showWrapper("field-article-writer", true);
      showWrapper("field-article-cowriter", true);        // ADD
			showWrapper("field-article-short-summary", true);   // ADD
      showWrapper("field-article-feature-image", true);
    }

    function applySpotlight(on) {
      if (!on) return;
      showWrapper("field-article-title", true);
      showWrapper("field-article-subtitle", true);
      showWrapper("field-article-summary", true);
      showWrapper("field-article-body", true);
      showWrapper("field-article-writer", true);
      showWrapper("field-article-cowriter", true);        // ADD
			showWrapper("field-article-short-summary", true);   // ADD
      showWrapper("field-article-spotlight-image", true);
    }

    function applyBanner(on) {
      showWrapper("field-banner-image", on);
      showWrapper("field-ad-name",      on);
    }

    function applySidebar(on) {
      showWrapper("field-sidebar-image", on);
      showWrapper("field-ad-name",       on);
    }

    function applyFind(on) {
      showWrapper("field-find-logo",    on);
      showWrapper("field-find-heading", on);
      showWrapper("field-find-body",    on);
      showWrapper("field-ad-name",      on);
    }

    function applyEvents(on) {
      showWrapper("field-event-name",        on);
      showWrapper("field-event-location",    on);
      showWrapper("field-event-date-start",  on);
      showWrapper("field-event-date-end",    on);
      showWrapper("field-event-start-time",  on);
      showWrapper("field-event-end-time",    on);
      showWrapper("field-event-description", on);
      showWrapper("field-event-image",       on);
    }

    function applyRealEstate(on) {
      showWrapper("field-property-address",        on);
      showWrapper("field-property-price",          on);
      showWrapper("field-property-features",       on);
      showWrapper("field-property-image",          on);
      showWrapper("field-property-mls-number",     on);
      showWrapper("field-property-listing-status", on);
    }

    console.log("📊 Applied Rule:", ACTIVE_RULE);

    resetAllFields();

    applyFeatureArticle(!!ACTIVE_RULE.article);
    applySpotlight(!!ACTIVE_RULE.spotlight);
    applyBanner(!!ACTIVE_RULE.banner);
    applySidebar(!!ACTIVE_RULE.sidebar);
    applyFind(!!ACTIVE_RULE.find);
    applyEvents(!!ACTIVE_RULE.events);
    applyRealEstate(!!ACTIVE_RULE.realEstate);

    // Redirect wrappers
    showWrapper("field-redirect-re",    !!ACTIVE_RULE.redirectRe);
    showWrapper("field-redirect-event", !!ACTIVE_RULE.redirectEvent);
    showWrapper("field-redirect-ad",    !!ACTIVE_RULE.redirectAd);
    showWrapper("field-redirect-article", !!ACTIVE_RULE.redirectArticle);


    // Customer wrapper
    showWrapper("field-customer",       !!ACTIVE_RULE.customer);

    console.log("✅ Visibility Applied");
  }, 60);

  // ---------------------------------------------------------
  // PRICE FORMAT + URL NORMALIZATION
  // ---------------------------------------------------------
  const priceInput = document.querySelector("[name='property_price']");
  if (priceInput) {
    priceInput.addEventListener("blur", () => {
      let v = priceInput.value.replace(/[^0-9.]/g, "");
      if (v) {
        priceInput.value = Number(v).toLocaleString("en-US", {
          style: "currency",
          currency: "USD"
        });
      }
    });
  }

  // Normalize only the three redirect inputs (explicit + safe)
  const redirectSelectors = [
    "input[name='re_redirect_url']",
    "input[name='ad_redirect_url']",
    "input[name='event_redirect_url']",
    "input[name='article_redirect_url']"

  ];

  document.querySelectorAll(redirectSelectors.join(",")).forEach(input => {
    input.addEventListener("blur", () => {
      let v = (input.value || "").trim();
      if (v && !/^https?:\/\//i.test(v)) {
        input.value = "https://" + v;
      }
    });
  });

  // ---------------------------------------------------------
  // FLATPICKR AUTO-EXPIRATION
  // ---------------------------------------------------------
  const startInput = document.querySelector("[name='content_first_use_date']");
  const endInput   = document.querySelector("[name='content_expiration_date']");

  if (startInput && endInput && window.flatpickr) {
    let userTouchedEnd = false;

    const endPicker = flatpickr(endInput, {
      dateFormat: "Y-m-d",
      onOpen: () => { userTouchedEnd = true; }
    });

    const startPicker = flatpickr(startInput, {
      dateFormat: "Y-m-d",
      defaultDate: "today",
      onChange: (dates) => {
        if (!userTouchedEnd && dates[0]) {
          const d = new Date(dates[0]);
          d.setDate(d.getDate() + 180);
          endPicker.setDate(d, true);
        }
      }
    });

    if (!startInput.value) {
      startPicker.setDate("today", true);
    }

    if (!endInput.value) {
      const d = new Date(startPicker.selectedDates[0] || new Date());
      d.setDate(d.getDate() + 180);
      endPicker.setDate(d, true);
    }

    console.log("✅ Flatpickr auto-expiration initialized");
  } else {
    console.warn("⚠️ Flatpickr not initialized — missing fields or library");
  }

  // ---------------------------------------------------------
  // LIGHTWEIGHT DIAGNOSTIC (CONSOLE ONLY)
  // ---------------------------------------------------------
  if (ACTIVE_RULE) {
    console.log("🔍 ISSUEBRIDGE — Diagnostic Snapshot");
    const checkClasses = [
      "field-article-title",
      "field-article-subtitle",
      "field-article-summary",
      "field-article-body",
      "field-article-writer",
      "field-article-cowriter",        // ADD
			"field-article-short-summary",   // ADD
      "field-article-feature-image",
      "field-article-spotlight-image",
      "field-banner-image",
      "field-sidebar-image",
      "field-ad-name",
      "field-find-logo",
      "field-find-heading",
      "field-find-body",
      "field-event-name",
      "field-event-location",
      "field-event-date-start",
      "field-event-date-end",
      "field-event-start-time",
      "field-event-end-time",
      "field-event-description",
      "field-event-image",
      "field-property-address",
      "field-property-price",
      "field-property-features",
      "field-property-image",
      "field-property-mls-number",
      "field-property-listing-status",
      "field-redirect-ad",
      "field-redirect-event",
      "field-redirect-re",
      "field-redirect-article",

      "field-customer"
    ];

    function isVisible(el) {
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return style.display !== "none" &&
             style.visibility !== "hidden" &&
             style.opacity !== "0";
    }

    checkClasses.forEach(cls => {
      const node = document.querySelector("." + cls);
      const vis  = isVisible(node);
      console.log(` • .${cls} =>`, node ? (vis ? "VISIBLE" : "HIDDEN") : "MISSING");
    });
  }

  // ---------------------------------------------------------
  // SUBMIT DEBUG (CONSOLE ONLY)
  // ---------------------------------------------------------
  const form = document.querySelector("form");
  if (form) {
    form.addEventListener("submit", () => {
      const select = document.querySelector("[name='customer_id']");
      console.log("🔴 SUBMIT DEBUG:");
      console.log("  • Selected index:", select?.selectedIndex);
      console.log("  • Selected value:", select?.value);
      console.log("  • Selected text:", select?.options?.[select.selectedIndex]?.textContent);

      const formData = new FormData(form);
      for (let [key, value] of formData.entries()) {
        console.log(`  • FormData[${key}]:`, value);
      }
    });
  }
});

// --------------------------------------------------------------------
// BEFORE BODY box — script 2 (Back button)
// --------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("ib-back-btn");
  if (!backBtn) return;

  backBtn.addEventListener("click", e => {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const taSlug = params.get("taSlug");

    if (!taSlug) {
      alert("Missing Title-Admin slug");
      return;
    }

    window.location.href =
      `https://inbxify.com/title-admin/${taSlug}#UploadContent`;
  });
});
