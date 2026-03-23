/* ============================================================
   ta-page-body-v1.2.js
   INBXIFY Title-Admin Page — Body Scripts
   Sections:
     1–4: Existing code (PubPlan Modal, URL Tab Controller,
          Hash Tab Activator, Customer Manager Button)
     5:   Screenshot Transcriber — multi-image tray + compression
   v1.1: image compression (canvas/JPEG, max 1800px, 85% quality)
         multi-image tray (additive pastes, numbered, removable,
         reorderable, all sent to Claude in one API call)
   v1.2: stronger prompt — teaser targets 350–400 chars,
         summary targets 120–150 chars
         auto-sectionalize — Claude inserts H2s if none present
         generated H2s marked with class="sct-generated" (red)
         lean RTE toolbar — Bold, Italic, H2, Link,
         UL, OL, Indent, Outdent
   v1.2.3: success state — only success card shown, all others hidden
           Close button added to success panel
           step 5 label changed to SUCCESS, highlighted on save
   ============================================================ */

// ============================================================
// SECTION 1: PUBPLAN MODAL — V4.0
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 PubPlan Modal V4.0 Loaded");

  const modalWrapper = document.querySelector("#pubplan-modal");
  if (!modalWrapper) { console.error("❌ #pubplan-modal missing"); return; }

  const modalPanel = modalWrapper.querySelector(".pubplan-modal-panel");
  if (!modalPanel) { console.error("❌ .pubplan-modal-panel missing"); return; }

  const modalHeaderTitle     = modalPanel.querySelector(".modal-header-title");
  const modalHeaderSubtitle  = modalPanel.querySelector(".modal-header-subtitle");
  const modalCatGroupDisplay = modalPanel.querySelector(".modal-cat-group-display");
  const modalCatLabelDisplay = modalPanel.querySelector(".modal-cat-label-display");
  const modalSlotNumberValue = modalPanel.querySelector(".modal-slot-number-value");
  const modalCustomerDisplay = modalPanel.querySelector(".modal-customer");
  const modalArticleDisplay  = modalPanel.querySelector(".modal-content-label");
  const changeCustomerLink   = modalPanel.querySelector(".change-customer");
  const changeContentLink    = modalPanel.querySelector(".change-content");
  const sectionCategory      = modalPanel.querySelector(".modal-section-category");
  const sectionCustomer      = modalPanel.querySelector(".modal-section-customer");
  const sectionArticle       = modalPanel.querySelector(".modal-section-article");
  const formBlock            = modalPanel.querySelector(".form-block-359");
  const msgNoCat             = modalPanel.querySelector(".message-no-category");
  const selectCategory       = modalPanel.querySelector("#select-category");
  const selectCustomer       = modalPanel.querySelector("#select-customer");
  const selectArticle        = modalPanel.querySelector("#select-article");
  const hfCategoryID         = modalPanel.querySelector("#hidden-category-id");
  const hfCategoryLabel      = modalPanel.querySelector("#hidden-category-label");
  const hfCategoryGroup      = modalPanel.querySelector("#hidden-category-group");
  const hfCustomerID         = modalPanel.querySelector("#hidden-customer-id");
  const hfCustomerName       = modalPanel.querySelector("#hidden-customer-name");
  const hfCustomerPaidAdUrl  = modalPanel.querySelector("#hidden-customer-paid-ad-url");
  const hfArticleID          = modalPanel.querySelector("#hidden-article-id");
  const hfArticleTitle       = modalPanel.querySelector("#hidden-article-title");
  const hfSlotCode           = modalPanel.querySelector("#hidden-slot-code");
  const hfSlotLabel          = modalPanel.querySelector("#hidden-slot-label");
  const hfPubPlanID          = modalPanel.querySelector("#hidden-pubplan-id");
  const hfPubPlanName        = modalPanel.querySelector("#hidden-pubplan-name");
  const hfTitleAdminID       = modalPanel.querySelector("#hidden-titleadmin-id");
  const hfTitleAdminName     = modalPanel.querySelector("#hidden-titleadmin-name");
  const hfBaPickerId         = modalPanel.querySelector("#hidden-ba-picker-id");
  const closeBtn             = modalWrapper.querySelector(".close-x-out");
  const form                 = modalPanel.querySelector("form");
  const submitBtn            = modalPanel.querySelector("button[type='submit'], input[type='submit']");
  const EMPTY_LABEL          = "<not assigned>";

  function setSubmitLoading(isLoading) {
    if (!submitBtn) return;
    let overlay = submitBtn.parentElement.querySelector(".submit-overlay");
    if (isLoading) {
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "submit-overlay";
        overlay.style.cssText = "position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;font-size:14px;color:#666;border-radius:inherit;pointer-events:auto;cursor:not-allowed;";
        overlay.textContent = "Verifying...";
        submitBtn.parentElement.style.position = "relative";
        submitBtn.parentElement.appendChild(overlay);
      }
      overlay.style.display = "flex";
    } else {
      if (overlay) overlay.style.display = "none";
    }
  }

  let turnstileChecker = null;
  function triggerTurnstileLoading() {
    setSubmitLoading(true);
    if (turnstileChecker) clearInterval(turnstileChecker);
    let elapsed = 0;
    turnstileChecker = setInterval(() => {
      elapsed += 200;
      const tf = document.querySelector('input[name="cf-turnstile-response"]');
      if (tf && tf.value) { clearInterval(turnstileChecker); turnstileChecker = null; setSubmitLoading(false); return; }
      if (elapsed >= 8000) { clearInterval(turnstileChecker); turnstileChecker = null; setSubmitLoading(false); }
    }, 200);
  }

  const SINGLE_PRODUCT_SECTIONS = { "ba":"Banner Ads","sb":"Sidebar Ads","re":"Real Estate Listings","ev":"Events Calendar" };

  let currentSectionCode = "", currentSlotCode = "", currentCategoryId = "", currentCustomerId = "", currentCustomerRequired = true;
  let snapshot = null;

  function takeSnapshot() {
    snapshot = {
      categoryId: hfCategoryID?.value||"", categoryLabel: hfCategoryLabel?.value||"",
      categoryGroup: hfCategoryGroup?.value||"", customerId: hfCustomerID?.value||"",
      customerName: hfCustomerName?.value||"", customerPaidAdUrl: hfCustomerPaidAdUrl?.value||"",
      articleId: hfArticleID?.value||"", articleTitle: hfArticleTitle?.value||"",
      slotCode: hfSlotCode?.value||"", slotLabel: hfSlotLabel?.value||"",
      pubplanId: hfPubPlanID?.value||"", pubplanName: hfPubPlanName?.value||"",
      titleAdminId: hfTitleAdminID?.value||"", titleAdminName: hfTitleAdminName?.value||"",
      baPickerId: hfBaPickerId?.value||""
    };
  }

  function restoreSnapshot() {
    if (!snapshot) return;
    if (hfCategoryID)        hfCategoryID.value        = snapshot.categoryId;
    if (hfCategoryLabel)     hfCategoryLabel.value     = snapshot.categoryLabel;
    if (hfCategoryGroup)     hfCategoryGroup.value     = snapshot.categoryGroup;
    if (hfCustomerID)        hfCustomerID.value        = snapshot.customerId;
    if (hfCustomerName)      hfCustomerName.value      = snapshot.customerName;
    if (hfCustomerPaidAdUrl) hfCustomerPaidAdUrl.value = snapshot.customerPaidAdUrl;
    if (hfArticleID)         hfArticleID.value         = snapshot.articleId;
    if (hfArticleTitle)      hfArticleTitle.value      = snapshot.articleTitle;
    if (hfSlotCode)          hfSlotCode.value          = snapshot.slotCode;
    if (hfSlotLabel)         hfSlotLabel.value         = snapshot.slotLabel;
    if (hfPubPlanID)         hfPubPlanID.value         = snapshot.pubplanId;
    if (hfPubPlanName)       hfPubPlanName.value       = snapshot.pubplanName;
    if (hfTitleAdminID)      hfTitleAdminID.value      = snapshot.titleAdminId;
    if (hfTitleAdminName)    hfTitleAdminName.value    = snapshot.titleAdminName;
    if (hfBaPickerId)        hfBaPickerId.value        = snapshot.baPickerId;
  }

  const getData = (el, key) => el.getAttribute(`data-${key}`) || el.dataset[key] || "";

  const products = Array.from(document.querySelectorAll("[data-products-wrapper] [data-item]")).map(el => ({
    id: getData(el,"id"), name: getData(el,"name"), label: getData(el,"label"),
    group: getData(el,"group"), type: getData(el,"type"),
    customerRequired: !(el.querySelector('[data-customer-not-required="true"]') && getComputedStyle(el.querySelector('[data-customer-not-required="true"]')).display !== 'none')
  }));

  const customers = Array.from(document.querySelectorAll("[data-customers-wrapper] [data-item]")).map(el => ({
    id: getData(el,"id"), name: getData(el,"name"), paidAdUrl: getData(el,"paid-ad-url")
  }));

  const articles = Array.from(document.querySelectorAll("[data-articles-wrapper] [data-item]")).map(el => ({
    id: getData(el,"article-id")||getData(el,"id"), name: getData(el,"article-title")||getData(el,"name"),
    group: getData(el,"group"), type: getData(el,"type"),
    customerId: getData(el,"article-customer-id")||getData(el,"customer-id"), categoryId: getData(el,"category-id")
  }));

  const ads = Array.from(document.querySelectorAll("[data-ads-wrapper] [data-item]")).map(el => ({
    id: getData(el,"ad-id"), name: getData(el,"ad-title")||getData(el,"label"),
    group: getData(el,"group"), type: getData(el,"type"),
    customerId: getData(el,"ad-customer-id"), categoryId: getData(el,"category-id")
  }));

  const reItems = Array.from(document.querySelectorAll("[data-re-wrapper] [data-item]")).map(el => ({
    id: getData(el,"re-id")||getData(el,"id"), name: getData(el,"re-title")||getData(el,"name"),
    group: getData(el,"group")||"Real Estate",
    customerId: getData(el,"re-customer-id")||getData(el,"customer-id")||"", categoryId: getData(el,"category-id")
  }));

  const evItems = Array.from(document.querySelectorAll("[data-events-wrapper] [data-item]")).map(el => ({
    id: getData(el,"event-id")||getData(el,"id"), name: getData(el,"event-title")||getData(el,"name"),
    group: getData(el,"group")||"Events",
    customerId: getData(el,"event-customer-id")||getData(el,"customer-id")||"", categoryId: getData(el,"category-id")
  }));

  const resetSelect = (sel, placeholder) => {
    if (!sel) return;
    sel.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = ""; opt.textContent = placeholder;
    sel.appendChild(opt);
  };

  function populateCategorySelect(sectionName, currentCatId) {
    if (!selectCategory) return;
    resetSelect(selectCategory, "Select category");
    products.filter(p => !sectionName || p.group === sectionName).forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id; opt.textContent = p.label || p.name; opt.dataset.group = p.group || "";
      selectCategory.appendChild(opt);
    });
    if (currentCatId) selectCategory.value = currentCatId;
  }

  function populateCustomerSelect() {
    if (!selectCustomer) return;
    resetSelect(selectCustomer, "Select customer");
    customers.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id; opt.textContent = c.name;
      selectCustomer.appendChild(opt);
    });
    selectCustomer.value = "";
  }

  function populateContentSelect(sc, categoryId, customerId, currentContentId) {
    if (!selectArticle) return;
    resetSelect(selectArticle, "Select content");
    let items = sc==="fa"||sc==="ts" ? articles : sc==="tf"||sc==="ba"||sc==="sb" ? ads : sc==="re" ? reItems : sc==="ev" ? evItems : [];
    let assignedItem = currentContentId ? items.find(it => it.id === currentContentId) || null : null;
    const filtered = items.filter(it => {
      if (assignedItem && it.id === assignedItem.id) return true;
      if (categoryId && it.categoryId && it.categoryId !== categoryId) return false;
      if (currentCustomerRequired && customerId && it.customerId && it.customerId !== customerId) return false;
      return true;
    });
    filtered.forEach(it => {
      const opt = document.createElement("option");
      opt.value = it.id; opt.textContent = it.name || "(no name)";
      selectArticle.appendChild(opt);
    });
    if (currentContentId) selectArticle.value = currentContentId;
  }

  function applyVisibility() {
    const sc = currentSectionCode.toLowerCase();
    const isCatSlot = currentSlotCode.toLowerCase().includes("-cat");
    const hasCategory = !!(hfCategoryID && hfCategoryID.value);
    const hasCustomer = !!(hfCustomerID && hfCustomerID.value);
    const hasContent  = !!(hfArticleID && hfArticleID.value);

    if (sectionCategory) sectionCategory.style.display = "none";
    if (sectionCustomer) sectionCustomer.style.display = "none";
    if (sectionArticle)  sectionArticle.style.display  = "none";
    if (selectCategory)  selectCategory.style.display  = "none";
    if (selectCustomer)  selectCustomer.style.display  = "none";
    if (selectArticle)   selectArticle.style.display   = "none";
    if (changeCustomerLink) changeCustomerLink.style.display = "none";
    if (changeContentLink)  changeContentLink.style.display  = "none";
    if (msgNoCat)  msgNoCat.style.display  = "none";
    if (formBlock) formBlock.style.display = "block";

    if (isCatSlot && (sc==="fa"||sc==="ts"||sc==="tf")) {
      if (sectionCategory) sectionCategory.style.display = "flex";
      if (selectCategory)  selectCategory.style.display  = "flex";
      return;
    }

    if ((sc==="fa"||sc==="ts") && !isCatSlot) {
      if (!hasCategory) {
        if (sectionCategory) sectionCategory.style.display = "flex";
        if (formBlock) formBlock.style.display = "none";
        if (msgNoCat)  msgNoCat.style.display  = "flex";
        return;
      }
      if (currentCustomerRequired) {
        if (hasCustomer && hasContent) {
          if (sectionCustomer) sectionCustomer.style.display = "flex";
          if (sectionArticle)  sectionArticle.style.display  = "flex";
          if (changeCustomerLink) changeCustomerLink.style.display = "inline-block";
          if (changeContentLink)  changeContentLink.style.display  = "inline-block";
          if (formBlock) formBlock.style.display = "none";
        } else if (hasCustomer) {
          if (sectionCustomer) sectionCustomer.style.display = "flex";
          if (changeCustomerLink) changeCustomerLink.style.display = "inline-block";
          if (sectionArticle) sectionArticle.style.display = "flex";
          if (selectArticle)  selectArticle.style.display  = "flex";
        } else {
          if (sectionCustomer) sectionCustomer.style.display = "flex";
          if (selectCustomer)  selectCustomer.style.display  = "flex";
        }
      } else {
        if (hasContent) {
          if (sectionArticle) sectionArticle.style.display = "flex";
          if (changeContentLink) changeContentLink.style.display = "inline-block";
          if (formBlock) formBlock.style.display = "none";
        } else {
          if (sectionArticle) sectionArticle.style.display = "flex";
          if (selectArticle)  selectArticle.style.display  = "flex";
        }
      }
      return;
    }

    if (sc==="tf"||sc==="ba"||sc==="sb") {
      if (currentCustomerRequired) {
        if (hasCustomer && hasContent) {
          if (sectionCustomer) sectionCustomer.style.display = "flex";
          if (sectionArticle)  sectionArticle.style.display  = "flex";
          if (changeCustomerLink) changeCustomerLink.style.display = "inline-block";
          if (changeContentLink)  changeContentLink.style.display  = "inline-block";
          if (formBlock) formBlock.style.display = "none";
        } else if (hasCustomer) {
          if (sectionCustomer) sectionCustomer.style.display = "flex";
          if (changeCustomerLink) changeCustomerLink.style.display = "inline-block";
          if (sectionArticle) sectionArticle.style.display = "flex";
          if (selectArticle)  selectArticle.style.display  = "flex";
        } else {
          if (sectionCustomer) sectionCustomer.style.display = "flex";
          if (selectCustomer)  selectCustomer.style.display  = "flex";
        }
      } else {
        if (hasContent) {
          if (sectionArticle) sectionArticle.style.display = "flex";
          if (changeContentLink) changeContentLink.style.display = "inline-block";
          if (formBlock) formBlock.style.display = "none";
        } else {
          if (sectionArticle) sectionArticle.style.display = "flex";
          if (selectArticle)  selectArticle.style.display  = "flex";
        }
      }
      return;
    }

    if (sc==="re"||sc==="ev") {
      if (hasContent) {
        if (sectionArticle) sectionArticle.style.display = "flex";
        if (changeContentLink) changeContentLink.style.display = "inline-block";
        if (formBlock) formBlock.style.display = "none";
      } else {
        if (sectionArticle) sectionArticle.style.display = "flex";
        if (selectArticle)  selectArticle.style.display  = "flex";
      }
    }
  }

  document.querySelectorAll(".pubplan-slot-wrapper").forEach(slot => {
    slot.addEventListener("click", e => {
      const d = e.currentTarget;
      const slotCode     = d.getAttribute("data-slot-code")       || "";
      const sectionCode  = d.getAttribute("data-section-code")    || "";
      const sectionName  = d.getAttribute("data-section")         || "";
      const pubplanId    = d.getAttribute("data-pubplan-id")      || "";
      const pubplanName  = d.getAttribute("data-pubplan-name")    || "";
      const pubplanDate  = d.getAttribute("data-pubplan-date")    || "";
      const titleAdminId = d.getAttribute("data-titleadmin-id")   || "";
      const titleAdminName = d.getAttribute("data-titleadmin-name") || "";
      const presetCatId    = d.getAttribute("data-cat-id")        || "";
      const presetCatLabel = d.getAttribute("data-cat-label")     || "";
      const presetCustomerId   = d.getAttribute("data-customer-id")   || "";
      const presetCustomerName = d.getAttribute("data-customer-name") || "";
      const presetContentId = d.getAttribute("data-article-id")||d.getAttribute("data-ad-id")||d.getAttribute("data-re-id")||d.getAttribute("data-event-id")||"";
      const presetContentTitle = d.getAttribute("data-article-title")||d.getAttribute("data-ad-title")||d.getAttribute("data-re-title")||d.getAttribute("data-event-title")||"";

      currentSectionCode = sectionCode;
      currentSlotCode    = slotCode;
      currentCustomerId  = presetCustomerId;

      const sc        = sectionCode.toLowerCase();
      const isCatSlot = slotCode.toLowerCase().includes("-cat");
      const slotLabel = slotCode.toUpperCase().replace(/-CAT$/, "");
      let slotNum = "";
      if (slotCode && slotCode.includes("-")) { const p = slotCode.split("-"); const l = p[p.length-1]; if (!isNaN(parseInt(l,10))) slotNum = l; }

      let categoryId = presetCatId, categoryLabel = presetCatLabel, categoryGroup = sectionName;

      if (SINGLE_PRODUCT_SECTIONS[sc]) {
        const product = products.find(p => p.group === SINGLE_PRODUCT_SECTIONS[sc]);
        if (product) { categoryId = product.id; categoryLabel = product.label||product.name; categoryGroup = product.group; currentCustomerRequired = product.customerRequired; }
        else currentCustomerRequired = true;
      } else {
        if (categoryId) { const product = products.find(p => p.id === categoryId); currentCustomerRequired = product ? product.customerRequired : true; }
        else currentCustomerRequired = true;
      }

      currentCategoryId = categoryId;

      if (sc === "ba") {
        const baSlotNum = parseInt(slotCode.replace(/\D/g,""), 10);
        if (hfBaPickerId) hfBaPickerId.value = baSlotNum <= 6 ? "ba-picker-1" : "ba-picker-2";
      } else {
        if (hfBaPickerId) hfBaPickerId.value = "";
      }

      if (modalHeaderTitle)     modalHeaderTitle.textContent     = pubplanName || "";
      if (modalHeaderSubtitle)  modalHeaderSubtitle.textContent  = pubplanDate || "";
      if (modalCatGroupDisplay) modalCatGroupDisplay.textContent = sectionName || "—";
      if (modalCatLabelDisplay) modalCatLabelDisplay.textContent = categoryLabel || EMPTY_LABEL;
      if (modalSlotNumberValue) modalSlotNumberValue.textContent = slotNum || "—";
      if (modalCustomerDisplay) modalCustomerDisplay.textContent = presetCustomerName || EMPTY_LABEL;
      if (modalArticleDisplay) { let t = presetContentTitle||EMPTY_LABEL; if (t.length>25) t=t.substring(0,25)+"…"; modalArticleDisplay.textContent = t; }

      if (hfSlotCode)       hfSlotCode.value       = slotCode;
      if (hfSlotLabel)      hfSlotLabel.value      = slotLabel;
      if (hfPubPlanID)      hfPubPlanID.value      = pubplanId;
      if (hfPubPlanName)    hfPubPlanName.value    = pubplanName;
      if (hfTitleAdminID)   hfTitleAdminID.value   = titleAdminId;
      if (hfTitleAdminName) hfTitleAdminName.value = titleAdminName;
      if (hfCategoryID)     hfCategoryID.value     = categoryId;
      if (hfCategoryLabel)  hfCategoryLabel.value  = categoryLabel;
      if (hfCategoryGroup)  hfCategoryGroup.value  = categoryGroup;
      if (hfCustomerID)     hfCustomerID.value     = presetCustomerId;
      if (hfCustomerName)   hfCustomerName.value   = presetCustomerName;
      if (hfCustomerPaidAdUrl) { const c = customers.find(c => c.id===presetCustomerId); hfCustomerPaidAdUrl.value = c?.paidAdUrl||""; }
      if (hfArticleID)      hfArticleID.value      = presetContentId;
      if (hfArticleTitle)   hfArticleTitle.value   = presetContentTitle;

      takeSnapshot();

      if (isCatSlot && (sc==="fa"||sc==="ts"||sc==="tf")) populateCategorySelect(sectionName, categoryId);
      if (!isCatSlot && currentCustomerRequired && (sc==="fa"||sc==="ts"||sc==="tf"||sc==="ba"||sc==="sb")) {
        populateCustomerSelect();
        if (presetCustomerId) selectCustomer.value = presetCustomerId;
      }
      if (!isCatSlot) populateContentSelect(sc, currentCategoryId, currentCustomerRequired ? presetCustomerId : "", presetContentId);

      applyVisibility();
      modalWrapper.style.display = "flex";
      requestAnimationFrame(() => modalWrapper.classList.add("is-active"));
    });
  });

  if (selectCategory) selectCategory.addEventListener("change", () => {
    triggerTurnstileLoading();
    const opt = selectCategory.selectedOptions[0];
    const value = opt?.value||"";
    const prod = products.find(p => p.id===value);
    if (hfCategoryID)    hfCategoryID.value    = value;
    if (hfCategoryLabel) hfCategoryLabel.value = prod?.label||prod?.name||"";
    if (hfCategoryGroup) hfCategoryGroup.value = prod?.group||"";
    currentCustomerRequired = prod ? prod.customerRequired : true;
    currentCategoryId = value;
  });

  if (selectCustomer) selectCustomer.addEventListener("change", () => {
    triggerTurnstileLoading();
    const opt = selectCustomer.selectedOptions[0];
    const value = opt?.value||"", name = opt?.textContent||"";
    const customer = customers.find(c => c.id===value);
    if (hfCustomerID)        hfCustomerID.value        = value;
    if (hfCustomerName)      hfCustomerName.value      = name;
    if (hfCustomerPaidAdUrl) hfCustomerPaidAdUrl.value = customer?.paidAdUrl||"";
    currentCustomerId = value;
  });

  if (selectArticle) selectArticle.addEventListener("change", () => {
    triggerTurnstileLoading();
    const opt = selectArticle.selectedOptions[0];
    if (hfArticleID)    hfArticleID.value    = opt?.value||"";
    if (hfArticleTitle) hfArticleTitle.value = opt?.textContent||"";
  });

  if (changeCustomerLink) changeCustomerLink.addEventListener("click", e => {
    e.preventDefault();
    if (hfArticleID?.value && !confirm("Changing customer will clear the current content selection. Continue?")) return;
    if (hfCustomerID)        hfCustomerID.value        = "";
    if (hfCustomerName)      hfCustomerName.value      = "";
    if (hfCustomerPaidAdUrl) hfCustomerPaidAdUrl.value = "";
    if (hfArticleID)         hfArticleID.value         = "";
    if (hfArticleTitle)      hfArticleTitle.value      = "";
    currentCustomerId = "";
    populateCustomerSelect();
    resetSelect(selectArticle, "Select content");
    applyVisibility();
  });

  if (changeContentLink) changeContentLink.addEventListener("click", e => {
    e.preventDefault();
    if (hfArticleID)    hfArticleID.value    = "";
    if (hfArticleTitle) hfArticleTitle.value = "";
    populateContentSelect(currentSectionCode.toLowerCase(), currentCategoryId, currentCustomerRequired ? currentCustomerId : "", "");
    applyVisibility();
  });

  if (form) form.addEventListener("submit", () => {
    console.log("🚀 Form submitted", { slotCode: hfSlotCode?.value, baPickerId: hfBaPickerId?.value, category: hfCategoryID?.value, customer: hfCustomerID?.value, content: hfArticleID?.value });
  });

  function closeModal() {
    restoreSnapshot();
    if (turnstileChecker) { clearInterval(turnstileChecker); turnstileChecker = null; }
    setSubmitLoading(false);
    modalWrapper.classList.remove("is-active");
    setTimeout(() => { modalWrapper.style.display = "none"; }, 200);
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modalWrapper.addEventListener("click", e => { if (e.target === modalWrapper) closeModal(); });
});

// ============================================================
// SECTION 2: URL TAB & SCROLL CONTROLLER
// ============================================================
window.addEventListener('load', function() {
  setTimeout(function() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(window.location.search);
    if (hash) { const tabLink = document.querySelector('[data-w-tab="' + hash + '"]'); if (tabLink) tabLink.click(); }
    const scrollTarget = params.get('scrollto');
    if (scrollTarget) { setTimeout(function() { const el = document.getElementById(scrollTarget); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 100); }
  }, 100);
});

// ============================================================
// SECTION 3: HASH-BASED TAB ACTIVATOR
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash.replace("#", "");
  if (!hash) return;
  const tab = document.querySelector(`[data-tab="${hash}"]`);
  if (tab) tab.click();
});

// ============================================================
// SECTION 4: CUSTOMER MANAGER BUTTON — DYNAMIC URL
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  const publisherId = document.querySelector('[data-publisher-id]')?.dataset.publisherId;
  const btn = document.getElementById('customer-manager-btn');
  if (btn && publisherId) btn.href = '/customer-manager?publisher=' + publisherId;
});

document.addEventListener('DOMContentLoaded', function() {
  const params = new URLSearchParams(window.location.search);
  const scrollTarget = params.get('scrollto');
  if (scrollTarget) {
    setTimeout(function() {
      const target = document.getElementById(scrollTarget);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  }
});

document.addEventListener("DOMContentLoaded", function() {
  const addPubplanBtn = document.querySelector("[data-titleadmin-id]");
  if (!addPubplanBtn) return;
  addPubplanBtn.addEventListener("click", function(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("ta", this.dataset.titleadminId);
    params.set("name", this.dataset.titleadminName);
    params.set("short", this.dataset.titleadminShort);
    params.set("pub", this.dataset.publisherId);
    window.location.href = "/workspaces/build-a-pub-plan?" + params.toString();
  });
});


// ============================================================
// SECTION 5: SCREENSHOT TRANSCRIBER v1.1
// - Multi-image tray: additive pastes, numbered, removable
// - Canvas compression: max 1800px, JPEG 85% — stays under 5MB
// - All images sent to Claude in one API call (in tray order)
// Mounts into #screenshot-transcriber-mount on Transcriber tab
// Config from window.TA_CONFIG (set in Webflow page head)
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
  const mount = document.getElementById('screenshot-transcriber-mount');
  if (!mount) return;

  const CFG = {
    get proxyUrl()  { return window.TA_CONFIG?.anthropicProxy  || null; },
    get makeUrl()   { return window.TA_CONFIG?.makeTranscriber || ''; },
    get titleSlug() { return window.TA_CONFIG?.titleSlug || document.querySelector('[data-ta-slug]')?.dataset.taSlug || ''; },
    get taItemId()  { return window.TA_CONFIG?.taItemId  || document.querySelector('#title-admin-id')?.dataset.taId || ''; },
    get titleId()   { return window.TA_CONFIG?.titleId   || ''; },
  };

  // ── State ──
  // images: array of { id, base64, mime, dataUrl, label }
  let S = {
    images: [],
    mode: 'new', existingArticleId: null, existingArticleName: null,
    replaceMode: 'replace', resultsReady: false, processing: false,
    dragSrcIdx: null,
  };

  // ── Inject HTML ──
  mount.innerHTML = `
<div class="sct-root">
  <div class="sct-hdr">
    <div class="sct-hdr-left">
      <div class="sct-hdr-icon">📷</div>
      <div><h3>Screenshot Transcriber</h3><div class="sct-hdr-sub">Paste screenshots → Claude transcribes → Draft article created</div></div>
    </div>
    <span class="sct-badge">v1.1</span>
  </div>

  <div class="sct-steps">
    <span class="sct-step active" id="sct-s1"><span class="sct-step-dot"></span>1 Paste</span>
    <span class="sct-step-arr">→</span>
    <span class="sct-step" id="sct-s2"><span class="sct-step-dot"></span>2 Assign</span>
    <span class="sct-step-arr">→</span>
    <span class="sct-step" id="sct-s3"><span class="sct-step-dot"></span>3 Transcribe</span>
    <span class="sct-step-arr">→</span>
    <span class="sct-step" id="sct-s4"><span class="sct-step-dot"></span>4 Review</span>
    <span class="sct-step-arr">→</span>
    <span class="sct-step" id="sct-s5"><span class="sct-step-dot"></span>5 Success</span>
  </div>

  <!-- PASTE CARD -->
  <div class="sct-card" id="sct-paste-card">
    <div class="sct-card-bar"></div>
    <div class="sct-card-body">
      <div class="sct-card-title">Paste Screenshots</div>
      <div class="sct-card-sub" id="sct-paste-sub">Step 1 — Press Cmd+V to add each page · Multiple pages supported</div>

      <!-- Tray — shown once at least one image is added -->
      <div id="sct-tray" class="sct-hidden">
        <div class="sct-tray-grid" id="sct-tray-grid"></div>
        <div class="sct-tray-footer">
          <span class="sct-tray-hint">Drag to reorder · Click ✕ to remove</span>
          <button class="sct-browse-btn" onclick="document.getElementById('sct-file-input').click()">+ Add image</button>
        </div>
      </div>

      <!-- Drop zone — shown when tray is empty -->
      <div class="sct-paste-zone" id="sct-pz">
        <div class="sct-pz-icon">⌘V</div>
        <div class="sct-pz-label">Press Cmd+V anywhere to paste</div>
        <div class="sct-pz-hint">Works with Cmd+Shift+4 Mac screenshots · Paste again to add more pages</div>
        <div class="sct-pz-or">— or —</div>
        <button class="sct-browse-btn" onclick="document.getElementById('sct-file-input').click()">Browse image file</button>
      </div>

      <input type="file" id="sct-file-input" accept="image/*" style="display:none" onchange="sctHandleFile(this.files[0]);this.value=''">
    </div>
  </div>

  <!-- ASSIGN CARD -->
  <div class="sct-card sct-hidden" id="sct-assign-card">
    <div class="sct-card-bar"></div>
    <div class="sct-card-body">
      <div class="sct-card-title">Assign Article</div>
      <div class="sct-card-sub">Step 2 — New article or add to existing</div>
      <div class="sct-mode-toggle">
        <button class="sct-mode-opt active" id="sct-mode-new" onclick="sctSetMode('new')">New Article</button>
        <button class="sct-mode-opt" id="sct-mode-ex" onclick="sctSetMode('existing')">Add to Existing</button>
      </div>
      <div id="sct-new-body">
        <div class="sct-notice-box">A new draft article will be created in Webflow CMS. Review all fields before saving.</div>
      </div>
      <div id="sct-ex-body" class="sct-hidden">
        <label class="sct-fl">Find Existing Article</label>
        <input class="sct-finp" id="sct-art-search" type="text" placeholder="Search by title…" oninput="sctFilterArts(this.value)" style="margin-bottom:4px">
        <div class="sct-article-results sct-hidden" id="sct-art-results"></div>
        <div class="sct-replace-row sct-hidden" id="sct-replace-row">
          <span style="font-family:'DM Mono',monospace;font-size:10px;color:#8a8a7a;margin-right:4px">Body:</span>
          <label><input type="radio" name="sct-replace" value="replace" checked onchange="S.replaceMode=this.value"> Replace existing</label>
          <label><input type="radio" name="sct-replace" value="append" onchange="S.replaceMode=this.value"> Append to existing</label>
        </div>
      </div>
      <button class="sct-cancel" style="margin-top:8px" onclick="sctCancelAll()">✕ start over</button>
    </div>
  </div>

  <!-- TRANSCRIBE BUTTON -->
  <button class="sct-tx-btn sct-hidden" id="sct-tx-btn" onclick="sctDoTranscribe()">
    <span>✦</span> Transcribe &amp; Generate Fields
  </button>

  <!-- PROCESSING -->
  <div class="sct-hidden" id="sct-proc-wrap">
    <div class="sct-proc-bar"></div>
    <div class="sct-proc-msg" id="sct-proc-msg">Sending to Claude…</div>
  </div>

  <!-- RESULTS -->
  <div class="sct-results sct-hidden" id="sct-results">
    <div class="sct-results-bar"></div>
    <div class="sct-results-body">
      <div class="sct-results-title">Review &amp; Edit Fields</div>
      <div class="sct-results-sub">Step 4 — All fields pre-populated · Edit anything before saving</div>

      <div class="sct-frow"><div class="sct-ff">
        <label class="sct-fl">Article Title <span class="req">*</span></label>
        <input class="sct-finp" id="sct-f-title" type="text" placeholder="Article headline…" oninput="sctMark(this);sctValidate()">
      </div></div>
      <div class="sct-frow"><div class="sct-ff">
        <label class="sct-fl">Sub-Title</label>
        <input class="sct-finp" id="sct-f-subtitle" type="text" placeholder="Sub-title…" oninput="sctMark(this)">
      </div></div>

      <hr class="sct-divider">

      <label class="sct-fl" style="margin-bottom:8px">Writers</label>
      <div class="sct-writers-grid">
        <div><label class="sct-fl">Writer Name</label><input class="sct-finp" id="sct-f-wname" type="text" placeholder="Name…" oninput="sctMark(this)"></div>
        <div><label class="sct-fl">Writer Title</label><input class="sct-finp" id="sct-f-wtitle" type="text" placeholder="Role…" oninput="sctMark(this)"></div>
        <div><label class="sct-fl">Co-Writer Name</label><input class="sct-finp" id="sct-f-cwname" type="text" placeholder="Optional…" oninput="sctMark(this)"></div>
        <div><label class="sct-fl">Co-Writer Title</label><input class="sct-finp" id="sct-f-cwtitle" type="text" placeholder="Optional…" oninput="sctMark(this)"></div>
      </div>

      <hr class="sct-divider">

      <div class="sct-frow"><div class="sct-ff">
        <label class="sct-fl">Article Teaser Summary <span class="req">*</span> <span style="color:#a0a090;font-weight:400">(target 350–400 chars)</span></label>
        <textarea class="sct-ftxt" id="sct-f-teaser" rows="3" placeholder="Newsletter teaser…" oninput="sctMark(this);sctCount('sct-f-teaser','sct-c-teaser',400,300);sctValidate()"></textarea>
        <div class="sct-char-counter" id="sct-c-teaser">0 / 400</div>
      </div></div>
      <div class="sct-frow"><div class="sct-ff">
        <label class="sct-fl">Short Article Summary <span class="req">*</span> <span style="color:#a0a090;font-weight:400">(target 120–150 chars)</span></label>
        <textarea class="sct-ftxt" id="sct-f-short" rows="2" placeholder="One-liner…" oninput="sctMark(this);sctCount('sct-f-short','sct-c-short',150,100);sctValidate()"></textarea>
        <div class="sct-char-counter" id="sct-c-short">0 / 150</div>
      </div></div>

      <hr class="sct-divider">

      <label class="sct-fl" style="margin-bottom:4px">Article Body <span class="req">*</span> <span style="color:#a0a090;font-weight:400">(HTML — editable)</span></label>
      <div class="sct-toolbar" id="sct-toolbar">
        <button class="sct-tb-btn" onclick="sctFmt('bold')" title="Bold"><b>B</b></button>
        <button class="sct-tb-btn" onclick="sctFmt('italic')" title="Italic"><i>I</i></button>
        <span class="sct-tb-sep"></span>
        <button class="sct-tb-btn" onclick="sctFmtBlock('h2')" title="Section Header">H2</button>
        <span class="sct-tb-sep"></span>
        <button class="sct-tb-btn" onclick="sctInsertLink()" title="Link">🔗</button>
        <span class="sct-tb-sep"></span>
        <button class="sct-tb-btn" onclick="sctFmt('insertUnorderedList')" title="Bullet list">• List</button>
        <button class="sct-tb-btn" onclick="sctFmt('insertOrderedList')" title="Numbered list">1. List</button>
        <button class="sct-tb-btn" onclick="sctFmt('indent')" title="Indent">→</button>
        <button class="sct-tb-btn" onclick="sctFmt('outdent')" title="Outdent">←</button>
      </div>
      <div class="sct-rte" id="sct-f-body" contenteditable="true" oninput="sctMarkRte();sctValidate()"></div>
      <div class="sct-rte-meta"><span>Generated headers shown in <span style="color:#c0392b">red</span> — edit or accept</span><span id="sct-word-count"></span></div>

      <div class="sct-sub-bar">
        <button class="sct-cancel" onclick="sctCancelResults()">✕ discard &amp; retranscribe</button>
        <div class="sct-sub-right">
          <span class="sct-sub-info" id="sct-ready-msg"></span>
          <button class="sct-save-btn" id="sct-save-btn" onclick="sctDoSave()" disabled>Save Draft ✓</button>
        </div>
      </div>
    </div>
  </div>

  <!-- SUCCESS -->
  <div class="sct-card sct-hidden" id="sct-success">
    <div class="sct-card-body">
      <div class="sct-success">
        <div class="sct-success-icon">✅</div>
        <div class="sct-success-title">Draft Article Created</div>
        <div class="sct-success-sub" id="sct-success-sub">Saved to Webflow CMS as Draft.</div>
        <a class="sct-success-link" id="sct-success-link" href="#" target="_blank" style="display:none">Open in Webflow CMS ↗</a>
        <br>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:14px">
          <button class="sct-reset-btn" onclick="sctResetAll()">+ Transcribe Another Article</button>
          <button class="sct-reset-btn" onclick="sctClose()" style="border-color:#1a3a3a;color:#1a3a3a">✕ Close</button>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="sct-lightbox" id="sct-lb" onclick="sctCloseLb()">
  <div class="sct-lb-close" onclick="sctCloseLb()">✕</div>
  <img id="sct-lb-img" src="" alt="Full size">
</div>`;

  // ── Add tray CSS (appended to head) ──
  const trayStyle = document.createElement('style');
  trayStyle.textContent = `
.sct-tray-grid{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px}
.sct-tray-tile{position:relative;width:130px;flex-shrink:0;border:1.5px solid #e8e4d8;border-radius:4px;overflow:hidden;background:#faf9f5;cursor:grab;transition:all .15s}
.sct-tray-tile:active{cursor:grabbing}
.sct-tray-tile.drag-over-tile{border-color:#c4a35a;background:#fdfcf8;transform:scale(1.02)}
.sct-tray-tile img{width:100%;height:90px;object-fit:cover;display:block}
.sct-tray-tile-footer{display:flex;align-items:center;justify-content:space-between;padding:3px 6px;background:#fff}
.sct-tray-badge{font-family:'DM Mono',monospace;font-size:9px;color:#5a6a5a;letter-spacing:.04em}
.sct-tray-actions{display:flex;gap:4px}
.sct-tray-zoom,.sct-tray-remove{font-size:10px;background:none;border:none;cursor:pointer;padding:2px;line-height:1;color:#8a8a7a;transition:color .12s}
.sct-tray-zoom:hover{color:#1a3a3a}
.sct-tray-remove:hover{color:#c0392b}
.sct-tray-footer{display:flex;align-items:center;justify-content:space-between;margin-top:2px}
.sct-tray-hint{font-size:9px;font-family:'DM Mono',monospace;color:#a0a090;letter-spacing:.03em}
  `;
  document.head.appendChild(trayStyle);

  // ── Paste listener ──
  document.addEventListener('paste', function(e) {
    const txTab = document.querySelector('[data-w-tab="Transcriber"]');
    if (txTab && !txTab.classList.contains('w--current')) return;
    const items = (e.clipboardData||window.clipboardData||{}).items||[];
    for (let i=0; i<items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        sctReadBlob(items[i].getAsFile(), items[i].type);
        return;
      }
    }
  });

  // ── Drag & drop onto paste zone ──
  const pz = document.getElementById('sct-pz');
  pz.addEventListener('dragover', e => { e.preventDefault(); pz.classList.add('drag-over'); });
  pz.addEventListener('dragleave', () => pz.classList.remove('drag-over'));
  pz.addEventListener('drop', e => { e.preventDefault(); pz.classList.remove('drag-over'); const f=e.dataTransfer.files[0]; if(f&&f.type.startsWith('image/')) sctHandleFile(f); });

  window.sctHandleFile = f => { if(f) sctReadBlob(f, f.type); };

  // ── Compress + add to tray ──
  function sctReadBlob(blob, mime) {
    const r = new FileReader();
    r.onload = ev => {
      const img = new Image();
      img.onload = () => {
        // Compress: max 1800px on longest side, JPEG 85%
        const MAX = 1800;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          const ratio = Math.min(MAX/w, MAX/h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64  = dataUrl.split(',')[1];
        const id = 'img-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
        S.images.push({ id, base64, mime:'image/jpeg', dataUrl });
        sctRenderTray();
        sctUpdateUI();
      };
      img.src = ev.target.result;
    };
    r.readAsDataURL(blob);
  }

  // ── Render tray ──
  function sctRenderTray() {
    const hasTray = S.images.length > 0;
    document.getElementById('sct-tray').classList.toggle('sct-hidden', !hasTray);
    document.getElementById('sct-pz').classList.toggle('sct-hidden', hasTray);

    const grid = document.getElementById('sct-tray-grid');
    grid.innerHTML = S.images.map((img, i) => `
      <div class="sct-tray-tile" id="sct-tile-${img.id}"
           draggable="true"
           ondragstart="sctDragStart(${i})"
           ondragover="sctDragOver(event,${i})"
           ondragleave="sctDragLeave(${i})"
           ondrop="sctDrop(event,${i})">
        <img src="${img.dataUrl}" alt="Page ${i+1}"
             onclick="sctOpenLbImg('${img.dataUrl}')">
        <div class="sct-tray-tile-footer">
          <span class="sct-tray-badge">Page ${i+1}</span>
          <div class="sct-tray-actions">
            <button class="sct-tray-zoom" onclick="sctOpenLbImg('${img.dataUrl}')" title="View full size">🔍</button>
            <button class="sct-tray-remove" onclick="sctRemoveImg('${img.id}')" title="Remove">✕</button>
          </div>
        </div>
      </div>
    `).join('');

    // Update sub label
    const n = S.images.length;
    document.getElementById('sct-paste-sub').textContent =
      n === 0 ? 'Step 1 — Press Cmd+V to add each page · Multiple pages supported'
      : n === 1 ? 'Step 1 — 1 page added · Cmd+V to add more'
      : `Step 1 — ${n} pages added · Cmd+V to add more`;
  }

  // ── Drag reorder ──
  window.sctDragStart = idx => { S.dragSrcIdx = idx; };
  window.sctDragOver  = (e, idx) => {
    e.preventDefault();
    document.querySelectorAll('.sct-tray-tile').forEach(t => t.classList.remove('drag-over-tile'));
    const tile = document.getElementById('sct-tile-' + S.images[idx]?.id);
    if (tile) tile.classList.add('drag-over-tile');
  };
  window.sctDragLeave = idx => {
    const tile = document.getElementById('sct-tile-' + S.images[idx]?.id);
    if (tile) tile.classList.remove('drag-over-tile');
  };
  window.sctDrop = (e, toIdx) => {
    e.preventDefault();
    document.querySelectorAll('.sct-tray-tile').forEach(t => t.classList.remove('drag-over-tile'));
    if (S.dragSrcIdx === null || S.dragSrcIdx === toIdx) return;
    const moved = S.images.splice(S.dragSrcIdx, 1)[0];
    S.images.splice(toIdx, 0, moved);
    S.dragSrcIdx = null;
    sctRenderTray();
  };

  window.sctRemoveImg = id => {
    S.images = S.images.filter(img => img.id !== id);
    sctRenderTray();
    sctUpdateUI();
  };

  // ── Lightbox ──
  window.sctOpenLbImg = dataUrl => {
    document.getElementById('sct-lb-img').src = dataUrl;
    document.getElementById('sct-lb').classList.add('open');
  };
  window.sctOpenLb  = () => {};
  window.sctCloseLb = () => document.getElementById('sct-lb').classList.remove('open');
  document.addEventListener('keydown', e => { if(e.key==='Escape') window.sctCloseLb(); });

  // ── Mode toggle ──
  window.sctSetMode = m => {
    S.mode = m; S.existingArticleId = null;
    document.getElementById('sct-mode-new').classList.toggle('active', m==='new');
    document.getElementById('sct-mode-ex').classList.toggle('active', m==='existing');
    document.getElementById('sct-new-body').classList.toggle('sct-hidden', m!=='new');
    document.getElementById('sct-ex-body').classList.toggle('sct-hidden', m!=='existing');
    document.getElementById('sct-replace-row').classList.add('sct-hidden');
    sctUpdateUI();
  };

  window.sctFilterArts = q => {
    S.existingArticleId = null;
    document.getElementById('sct-replace-row').classList.add('sct-hidden');
    const res = document.getElementById('sct-art-results');
    res.classList.remove('sct-hidden');
    res.innerHTML = q.length < 2
      ? '<div style="padding:8px 10px;font-size:11px;font-family:\'DM Mono\',monospace;color:#a0a090">Type at least 2 characters…</div>'
      : '<div style="padding:8px 10px;font-size:11px;font-family:\'DM Mono\',monospace;color:#a0a090">Article search requires CMS connection — use New Article for now</div>';
    sctUpdateUI();
  };

  // ── UI state ──
  function sctUpdateUI() {
    const hasImg = S.images.length > 0;
    const assignReady = S.mode==='new' || !!S.existingArticleId;
    document.getElementById('sct-assign-card').classList.toggle('sct-hidden', !hasImg);
    const canTx = hasImg && assignReady && !S.processing;
    document.getElementById('sct-tx-btn').classList.toggle('sct-hidden', !canTx || S.resultsReady);
    document.getElementById('sct-tx-btn').disabled = !canTx;

    // Update transcribe button label
    if (canTx && !S.resultsReady) {
      const n = S.images.length;
      document.getElementById('sct-tx-btn').innerHTML =
        `<span>✦</span> Transcribe ${n > 1 ? n+' Pages' : 'Screenshot'} &amp; Generate Fields`;
    }

    sctSetStep(1, hasImg?'done':'active');
    sctSetStep(2, !hasImg?'':assignReady?'done':'active');
    sctSetStep(3, !assignReady?'':S.processing?'active':S.resultsReady?'done':'');
    sctSetStep(4, S.resultsReady?'active':'');
    sctSetStep(5, '');
  }

  function sctSetStep(n, cls) {
    const el = document.getElementById('sct-s'+n);
    if (el) el.className = 'sct-step' + (cls ? ' '+cls : '');
  }

  // ── Transcribe ──
  window.sctDoTranscribe = async () => {
    S.processing = true;
    sctUpdateUI();
    document.getElementById('sct-tx-btn').classList.add('sct-hidden');
    document.getElementById('sct-proc-wrap').classList.remove('sct-hidden');
    document.getElementById('sct-results').classList.add('sct-hidden');

    const n = S.images.length;
    const msgs = n > 1
      ? [`Sending ${n} pages to Claude…`, 'Reading article structure across pages…', 'Generating teaser and summary…', 'Formatting body HTML…']
      : ['Sending to Claude…', 'Reading article structure…', 'Generating teaser and summary…', 'Formatting body HTML…'];
    let mi = 0;
    const msgEl = document.getElementById('sct-proc-msg');
    const ticker = setInterval(() => { if(mi<msgs.length) msgEl.textContent=msgs[mi++]; }, 1500);

    try {
      const result = await sctCallClaude();
      clearInterval(ticker);
      S.processing = false; S.resultsReady = true;
      document.getElementById('sct-proc-wrap').classList.add('sct-hidden');
      document.getElementById('sct-results').classList.remove('sct-hidden');
      sctPopulate(result);
      sctSetStep(4,'active');
    } catch(err) {
      clearInterval(ticker);
      S.processing = false;
      document.getElementById('sct-proc-wrap').classList.add('sct-hidden');
      sctUpdateUI();
      alert('Transcription error: ' + err.message);
    }
  };

  // ── Claude API call — all images in one message ──
  async function sctCallClaude() {
    if (!CFG.proxyUrl) throw new Error('Anthropic proxy URL not configured. Add anthropicProxy to window.TA_CONFIG in the page head.');

    const n = S.images.length;
    const pageNote = n > 1
      ? `This article spans ${n} pages, provided in order. Treat them as one continuous article.`
      : 'Transcribe this article screenshot.';

    const system = `You are an expert article transcriber and editor for a local community newsletter publishing platform.

Extract and return ONLY valid JSON — no preamble, no backticks, no markdown:
{
  "title": "Article headline — clean, concise, reader-friendly",
  "subtitle": "Sub-title if visible, else empty string",
  "writername": "Primary writer name if visible, else empty string",
  "writertitle": "Primary writer title/role if visible, else empty string",
  "cowritername": "Co-writer name if visible, else empty string",
  "cowritertitle": "Co-writer title if visible, else empty string",
  "teaser": "SEE TEASER RULES BELOW",
  "shortsummary": "SEE SHORT SUMMARY RULES BELOW",
  "body": "SEE BODY RULES BELOW"
}

TEASER RULES — read carefully:
- Write an engaging, standalone newsletter teaser that makes readers want to read the full article
- Target length: 350–400 characters. This is a TARGET, not just a maximum — write enough to fill it
- Minimum acceptable length: 300 characters. If your draft is under 300 characters, expand it
- Maximum: 400 characters hard limit — do not exceed
- Count characters carefully before finalizing. If under 300, add a compelling detail or context
- Do not truncate or use ellipsis — write a complete, punchy teaser

SHORT SUMMARY RULES — read carefully:
- Write a punchy one-liner that captures the essence of the article
- Target length: 120–150 characters. Write to fill this range, not just stay under it
- Minimum acceptable length: 100 characters. If under 100, expand with a key detail
- Maximum: 150 characters hard limit — do not exceed
- This is used as a subtitle/preview — make it interesting and informative

BODY RULES:
- Transcribe all visible article text accurately and completely
- SECTION HEADERS: If the article has visible section headers, reproduce them as <h2 class="sct-transcribed">Header text</h2>
- AUTO-SECTIONALIZE: If the article has NO visible section headers, divide the content into 2–5 logical sections yourself and create descriptive, relevant H2 headers for each section. Mark these invented headers as <h2 class="sct-generated">Your invented header</h2>
- Use <p> for paragraphs
- Use <ul><li> for bullet lists, <ol><li> for numbered lists
- No inline styles. No wrapper divs. Start directly with content
- Preserve all substantive content — do not summarize or cut the body
- CRITICAL: Base64-encode the entire body HTML string. The "body" field in the JSON must contain ONLY the base64-encoded string — not raw HTML. This prevents HTML characters from breaking the JSON.
CRITICAL JSON RULES:
- Return ONLY the JSON object — no preamble, no explanation, no backticks
- Every field must be present — use empty string "" if the value is not visible or not applicable
- Never omit a field even if the article is partial or the screenshot is incomplete
- If no title is visible, use empty string for title — do not invent one`;

    // Build content array: all images first, then the instruction text
    const content = [
      ...S.images.map(img => ({
        type: 'image',
        source: { type: 'base64', media_type: img.mime, data: img.base64 }
      })),
      { type: 'text', text: pageNote }
    ];

    const res = await fetch(CFG.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 4000,
        system,
        messages: [{ role: 'user', content }]
      })
    });

    if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error?.message||'API error '+res.status); }
    const data = await res.json();
    const raw = data.content?.find(b=>b.type==='text')?.text||'';
    // Robust extraction: pull first {...} block regardless of any preamble or backtick fences
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Claude did not return valid JSON. Raw: ' + raw.substring(0,300));
    return JSON.parse(match[0]);
  }

  // ── Populate results fields ──
  function sctPopulate(r) {
    const set = (id,v) => { const el=document.getElementById(id); if(!el) return; el.value=v||''; el.classList.toggle('has-val',!!(v||'').trim()); };
    set('sct-f-title',   r.title);
    set('sct-f-subtitle',r.subtitle);
    set('sct-f-wname',   r.writername);
    set('sct-f-wtitle',  r.writertitle);
    set('sct-f-cwname',  r.cowritername);
    set('sct-f-cwtitle', r.cowritertitle);
    set('sct-f-teaser',  r.teaser);
    set('sct-f-short',   r.shortsummary);
    const body = document.getElementById('sct-f-body');
    // Body is base64-encoded by Claude to prevent HTML breaking JSON
    try {
      body.innerHTML = r.body ? atob(r.body) : '';
    } catch(e) {
      // Fallback: if not valid base64, use as-is (handles edge cases)
      body.innerHTML = r.body || '';
    }
    body.classList.toggle('has-val', !!(r.body||'').trim());
    sctCount('sct-f-teaser','sct-c-teaser',400,300);
    sctCount('sct-f-short','sct-c-short',150,100);
    sctWordCount();
    sctValidate();
  }

  // ── RTE toolbar ──
  window.sctFmt = cmd => {
    document.getElementById('sct-f-body').focus();
    document.execCommand(cmd, false, null);
  };
  window.sctFmtBlock = tag => {
    document.getElementById('sct-f-body').focus();
    document.execCommand('formatBlock', false, tag);
  };
  window.sctInsertLink = () => {
    const url = prompt('Enter URL (include https://):');
    if (!url) return;
    document.getElementById('sct-f-body').focus();
    document.execCommand('createLink', false, url);
  };

  window.sctMark = el => { el.classList.toggle('has-val', !!el.value.trim()); sctValidate(); };
  window.sctMarkRte = () => {
    const el=document.getElementById('sct-f-body');
    el.classList.toggle('has-val', !!el.innerHTML.trim());
    sctWordCount();
  };
  window.sctCount = (fid, cid, max, min) => {
    const len = (document.getElementById(fid)?.value||'').length;
    const el  = document.getElementById(cid); if (!el) return;
    el.textContent = len + ' / ' + max;
    if (len > max)           el.className = 'sct-char-counter over';
    else if (min && len < min) el.className = 'sct-char-counter under';
    else if (len > max * .9) el.className = 'sct-char-counter warn';
    else                     el.className = 'sct-char-counter ok';
  };
  function sctWordCount() {
    const t=(document.getElementById('sct-f-body')?.innerText||'').trim();
    const w=t?t.split(/\s+/).length:0;
    const el=document.getElementById('sct-word-count'); if(el) el.textContent=w+' words';
  }
  function sctValidate() {
    const title  = document.getElementById('sct-f-title')?.value?.trim();
    const teaser = document.getElementById('sct-f-teaser')?.value?.trim();
    const tLen   = (document.getElementById('sct-f-teaser')?.value||'').length;
    const sLen   = (document.getElementById('sct-f-short')?.value||'').length;
    const body   = document.getElementById('sct-f-body')?.innerHTML?.trim();
    const ok = !!title && !!teaser && !!body && tLen<=400 && sLen<=150;
    const btn = document.getElementById('sct-save-btn');
    if (btn) btn.disabled = !ok;
    const issues=[];
    if(!title) issues.push('title required');
    if(!teaser) issues.push('teaser required');
    if(tLen>400) issues.push('teaser over limit');
    if(sLen>150) issues.push('summary over limit');
    if(!body) issues.push('body required');
    const rm = document.getElementById('sct-ready-msg');
    if (rm) rm.textContent = ok ? '✓ ready to save' : issues.join(' · ');
    sctSetStep(5, ok ? 'active' : '');
  }

  // ── Save ──
  window.sctDoSave = async () => {
    const btn = document.getElementById('sct-save-btn');
    btn.disabled=true; btn.textContent='Saving…';
    const payload = {
      titleSlug:               CFG.titleSlug,
      taItemId:                CFG.taItemId,
      titleId:                 CFG.titleId,
      mode:                    S.mode,
      existingArticleId:       S.existingArticleId||'',
      replaceMode:             S.replaceMode,
      'article-title':         document.getElementById('sct-f-title').value,
      'sub-title':             document.getElementById('sct-f-subtitle').value,
      'writername':            document.getElementById('sct-f-wname').value,
      'writertitle':           document.getElementById('sct-f-wtitle').value,
      'co-writername':         document.getElementById('sct-f-cwname').value,
      'co-writertitle':        document.getElementById('sct-f-cwtitle').value,
      'article-summary':       document.getElementById('sct-f-teaser').value,
      'short-article-summary': document.getElementById('sct-f-short').value,
      'article-body-rte':      document.getElementById('sct-f-body').innerHTML,
    };
    try {
      const qs = new URLSearchParams();
      Object.entries(payload).forEach(([k,v]) => qs.append(k,v));
      await fetch(CFG.makeUrl+'?'+qs.toString(), { method:'GET', mode:'no-cors' });
      sctShowSuccess(payload['article-title']);
    } catch(err) {
      btn.disabled=false; btn.textContent='Save Draft ✓';
      alert('Save error: '+err.message);
    }
  };

  function sctShowSuccess(name) {
    // Hide everything except success panel
    ['sct-paste-card','sct-assign-card','sct-tx-btn','sct-proc-wrap','sct-results'].forEach(id => {
      const el = document.getElementById(id); if(el) el.classList.add('sct-hidden');
    });
    document.getElementById('sct-success').classList.remove('sct-hidden');
    const sub = document.getElementById('sct-success-sub');
    if (sub) sub.textContent = '"' + name + '" saved as Draft.';
    // All steps done, step 5 = SUCCESS highlighted
    [1,2,3,4].forEach(n => sctSetStep(n,'done'));
    sctSetStep(5,'active');
  }

  // ── Cancel / Reset ──
  window.sctCancelAll = () => {
    S.images = [];
    S = { ...S, mode:'new', existingArticleId:null, resultsReady:false, processing:false };
    sctRenderTray();
    ['sct-assign-card','sct-results','sct-proc-wrap','sct-success'].forEach(id => {
      const el=document.getElementById(id); if(el) el.classList.add('sct-hidden');
    });
    document.getElementById('sct-tx-btn').classList.add('sct-hidden');
    window.sctSetMode('new');
    sctUpdateUI();
  };

  window.sctCancelResults = () => {
    S.resultsReady = false;
    document.getElementById('sct-results').classList.add('sct-hidden');
    ['sct-f-title','sct-f-subtitle','sct-f-wname','sct-f-wtitle','sct-f-cwname','sct-f-cwtitle','sct-f-teaser','sct-f-short'].forEach(id => {
      const el=document.getElementById(id); if(el){el.value='';el.classList.remove('has-val');}
    });
    const body=document.getElementById('sct-f-body'); if(body){body.innerHTML='';body.classList.remove('has-val');}
    sctUpdateUI();
  };

  window.sctResetAll = () => {
    window.sctCancelAll();
    document.getElementById('sct-success').classList.add('sct-hidden');
    document.getElementById('sct-paste-card').classList.remove('sct-hidden');
    [1,2,3,4,5].forEach(n => sctSetStep(n, n===1?'active':''));
  };

  window.sctClose = () => {
    // Hide the entire transcriber root and reset state
    window.sctCancelAll();
    document.getElementById('sct-success').classList.add('sct-hidden');
    document.getElementById('sct-paste-card').classList.remove('sct-hidden');
    [1,2,3,4,5].forEach(n => sctSetStep(n, n===1?'active':''));
    // Optionally scroll back to top of T-A page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.SCT_STATE = S;
  sctRenderTray();
  sctUpdateUI();
  console.log('📷 Screenshot Transcriber v1.1 mounted (multi-image tray + compression)');
});
