// ============================================================
// content-library-v1.0.49.js
// INBXIFY Asset Library — T-A Page Tab
// v1.0.49: PIECE 2 — durable PubPlan assignment status from NL-BLOCKS. Reads the
//          nlblocks[] array now returned by List Assets (paged) v2 and marks each
//          asset assigned iff an NL-BLOCKS row (this title) references it. Survives
//          refresh (no longer reverts to available). Title match client-side per
//          multi-tenant rule. Same data also serves Bundles. Requires List Assets
//          (paged) v2 imported (returns nlblocks per branch).
// v1.0.48: Init log version string corrected to match filename (was stuck at
//          v1.0.44). No behavior change vs v1.0.47 — complete-replacement bump
//          per no-reuse-filename rule (v1.0.47 never deployed; config comma bug).
// v1.0.47: PUBPLAN-LEVEL ASSIGN + BATCH SAVE. Scope = Article/Event/RE only
//          (Ads handled in PubPlan grid). Drawer redesigned: PubPlan (Issue) +
//          Block-Type (Article FA/TS/BL; Event EV / RE RE locked). SLOT field
//          DELETED (planning-stage has no slot). Selections PERSIST across rows
//          (S.armed batch map) with ix-form-controls dirty border
//          (.ix-picker-input--changed) + ix-revert cancel link. New fixed
//          bottom-pinned batch tray (high-z, to <body>) — Cancel all / Save with
//          async feedback. POST → TA_CONFIG.makeBlockWriter (Scenario 124 v1.3):
//          op=save, pubplanId→publication-plan, newsletter empty, stage=planning,
//          assetType+assetId, blockType+blockTypeHash, titleAdminId. Optimistic
//          status flip on save; reload for durable NL-BLOCKS read (Piece 2).
//          #1 filter toggle icon + #2 filter bar hidden by default. #3 Assignment
//          header → "PubPlan" (dropped Newsletter/Section/Slot sub-label).
//          #4 stray box recolored electric-blue/white via ix-btn--sm.is-armed.
//          #5 Assign generalized to Article/Event/RE on ix-btn. PubPlans = IP only.
//          Legacy single-row slot saveEdit RETIRED (dormant as _legacy_saveEdit).
// v1.0.46: Renamed "Content Library" → "Asset Library". All filters converted
//          to dropdowns (Section/Product/Customer/Newsletter/PubPlan/Status/
//          Assignment/Sort), each with a down-arrow. Empty dropdowns show
//          "(none)". Search: border removed, font set to page font (DM Sans).
// v1.0.45: ALL FOUR TYPES now load via the webhook (paged, newest-first,
//          multi-tenant) — ads/events/RE join articles. Per-type field maps
//          translate each collection's fieldData → the internal item shape.
//          Each tab pages independently. DOM readers retired for the list
//          (kept only as dead code refs; safe). Field slugs for ad/event/RE
//          are best-effort from the article pattern + known fields; confirm
//          via curl per type and tighten TYPE_MAPS if any field is blank.
// v1.0.44: ARTICLES now load via WEBHOOK (paged, newest-first) instead of
//          the DOM Collection List (which capped at 100). Uses makeListAssets
//          (Make "List Assets" scenario → Webflow API, sortBy=createdOn DESC).
//          Lazy-loads 100/page on scroll until total reached. Multi-tenant:
//          filters each page to associated-title === TA_CONFIG.taItemId. Maps
//          webhook fieldData → the same internal item shape readArticles
//          produced, so render/filter/sort are unchanged. Ads/Events/RE still
//          read DOM for now (next: same webhook pattern, assetType=ad/event/re).
// v1.0.43: Tab/search polish — (1) Option A "gap break": rail under tabs
//          and a SEPARATE rail under search, with a gap between (two zones).
//          (2) Tab counts removed. (3) Tabs fixed-width 118px, centered.
//          (4) Search: no border, DM Sans normal weight (matches tabs),
//          flush in its own rail. ix-btn--tab/--pill primitives unchanged.
// v1.0.42: Filter controls rebuilt on the SHARED ix-btn--pill primitive
//          (ix-buttons-v1.0.4) instead of bespoke .cl-seg. This fixes the
//          invisible-"All" active state (my custom .on rule was losing to
//          page/button styles) by using the same active mechanism every
//          other surface uses: class="ix-btn ix-btn--pill" + data-active.
//          Section / Status / Assignment all migrated. Active = system blue
//          (Option A — no custom color). Bespoke .cl-seg CSS retired.
// v1.0.41: Harmonize main tabs with the STUDIO subtab design. The four
//          main tabs (Articles/Ads/Events/RE) now render as the Studio
//          ix-btn--tab style (underline-active, electric-blue active, on a
//          1px rail) inside a .std-subtabs-style strip, with the search box
//          kept on the RIGHT of that row. Also: active filter tile in each
//          subsection (Section/Status/Assignment) now uses #142e2e.
// v1.0.40: Date sort FIX. DOM dates are human strings ("May 31, 2026"), and
//          the sort used localeCompare → alphabetical-by-month-name, not
//          chronological (why "newest first" looked frozen). Now parses to a
//          real timestamp (Date.parse) and sorts numerically. Also reads
//          articleUpdated as a fallback when articleCreated is blank.
// v1.0.39: (1) Active-state text contrast bumped (tab count + active "All"
//          segment were too dim). (2) Defaults: Assignment=All (was
//          Available, which hid assigned items), Sort=Newest first (was
//          Title A-Z). NOTE: date sort needs data-created bound on the
//          articles-wrapper DOM list — if absent, newest-first can't work
//          (see console check).
// v1.0.38: Removed the magnifier icon entirely (overlap kept recurring);
//          search input now uses normal left padding, no icon slot.
// v1.0.37: Wider search box (flex 380 -> 520, grows to fill the row).
// v1.0.36: Search icon overlap — bulletproof fix. Bumped input left-padding
//          to 44px and pinned the icon in a fixed 16px slot at left:16px so
//          the placeholder can never sit under it, regardless of font.
// v1.0.35: Redesign polish — search box larger + icon overlap fixed; stray
//          beige underline under tabrow removed; main tabs reimagined as
//          bold pill/segment buttons; "All" segment legibility fixed.
// v1.0.34: REDESIGN. Search moved inline beside the tab bar (no longer eats
//          a row). Filter strip rebuilt as labeled segmented controls — every
//          control now shows its text (fixes invisible-label "All" buttons).
//          Row contrast added: zebra striping + stronger hover. Tighter,
//          scannable layout.
// v1.0.33: + Events & Real Estate main tabs (readEvents / readRE), all 4
//          asset types now shown. Events read .events-wrapper (live: 14);
//          RE reads .real-estate-wrapper (NOT yet bound in Webflow — tab
//          shows empty until that hidden Collection List is added, then
//          populates automatically, no code change). + Per-tab SEARCH box
//          (filters visible list by name + customer name, live).
// Mounts into #content-library-mount on ContentLibrary tab
// Config from window.TA_CONFIG
//
// v1.0.32: openView() now launches the Asset Workbench
//          (window.InbxAssetWorkbench.open) for the clicked item,
//          mapping collection → assetType. Falls back to the legacy
//          inline detail modal if the Workbench script is absent.
//          No other behavior change.
//
// v1.0.31: PUBLISH-STATUS MIGRATION
//          Webflow field migration: `article-status` → `publish-status`.
//          Both fields carry the same Draft/Live schema but the new
//          field has different option hashes.
//          - DOM read: d.articleStatus → d.publishStatus. Articles-
//            wrapper must now bind data-publish-status on the T-A page.
//          - ARTICLE_STATUS_MAP hash values updated to new publish-
//            status hashes (Draft = daaf373..., Live = 5561293...).
//          - HC-CL-004 comment updated with new hashes and renamed
//            source field.
//          Deploy prereq: Webflow Designer rebinding. Keep old
//          data-article-status binding alongside during migration
//          for zero downtime; remove after all articles reassigned.
//          Paired with ta-studio v1.1.6 in the same deploy.
// v1.0.30: REFRESH HASH RETURN
//          Refresh button sets window.location.hash='content-library'
//          before reload so user returns to Content Library tab.
//          Same hash applied to webhook reload (both resp.ok and
//          no-cors fallback) so assignment completes back on this tab.
//          On init, after render(): checks for #content-library hash,
//          clicks [data-w-tab="ContentLibrary"] after 300ms, clears hash.
// v1.0.26: ASSIGNMENT SOURCE OF TRUTH FIX
//          Removed ASSIGNMENT_MAP slot wrapper cross-reference.
//          Assignment display now reads from article's own
//          data-newsletter-name and data-newsletter-date attributes.
//          Article record is the single source of truth for
//          newsletter assignment, not PubPlan slot wrappers.
//          Added newsletterName and newsletterDate to article reader.
// v1.0.25: Version bump (Jeff)
// v1.0.24: Version bump (Jeff)
// v1.0.23: Modal appends to document.body (escapes stacking context).
//          Overlay harmonized with Uploads Processor: rgba(26,58,58,0.7),
//          border-radius:8px, box-shadow, round close button.
//          Tab style harmonized: DM Sans 12px 600, gold bottom border.
// v1.0.22: Modal body-append + overlay harmonization (superseded by v23).
// v1.0.21: Split buttons: "Assign" (gold, available articles only) +
//          "View" (opens detail modal). Modal shows title, status,
//          section, customer, assignment, revenue type, elements.
//          PubPlan dropdown: shows In Progress OR future date.
//          Button column widened to 110px for two buttons.
//          Subtab toolbar merged to one row: Section + Product +
//          Content + Assignment + Sort. "All" removed from Content
//          and Assignment filters. Labels matched to DM Mono 10px.
//          Product dropdown width reduced 40%.
//          Subtitle removed from header.
// v1.0.20: Assignment column 350px. Slot pill moved inline with
//          issue/date (WLN-109 | April 12 | FA-1). MNLS name on
//          second line. All assignment text uniform DM Mono 10px.
// v1.0.19: Default filters: Content=All, Assignment=Available.
//          Assignment header on one line.
//          Customer font: DM Mono 11px. MNLS name: DM Mono 10px.
//          Grid columns: 1fr 1fr 200px 60px (title/customer 50/50).
// v1.0.17-18: Column ratio adjustments, purge/deploy iterations.
// v1.0.16: New table-style layout — fixed columns for vertical scanning.
//          Lifecycle flows left to right: dot+title, customer, assignment, edit.
//          Status dot (green=live, yellow=draft) replaces status badge.
//          Assignment column stacks newsletter+date, MNLS name, slot pill.
//          Edit/View button in rightmost column.
//          Column headers with grid alignment.
// v1.0.15: Article status reads from data-article-status hash.
//          HC-CL-004 added for status hashes.
// v1.0.14: data-mnls-id reverted, productId reads from data-category-id.
//          mnlsName reads from data-mnls-name. hidden-category-group
//          sends mnlsName directly.
//         Cross-references articleId in slot wrappers to build
//         assignment map at init. Assigned badge shows issue name.
//         PubPlan dropdown filtered to Planning Status = "In Progress"
//         (reads data-planning-status from slot wrappers).
//         Falls back to showing all if attribute not yet bound.
// v1.0.8: Uppercase slot labels (fa-1→FA-1) in webhook payload.
//         Added hidden-product-id to payload.
// v1.0.7: Webhook payload uppercase + product ID (superseded by v1.0.8)
// v1.0.6: Webhook integration — fires TA_CONFIG.pubplanWebhooks[section]
//         with hidden-* URLSearchParams payload (GET, no-cors).
//         Reads slot occupancy from DOM (articleId on slot wrappers).
//         Slot dropdown shows open/taken/current status.
//         PubPlan dropdown shows issue name + date, sorted newest first.
//         Assign button replaces Save button.
// v1.0.5: Articles assignment checks data-newsletter-id (NEWSLETTER ref).
//         Renamed "Unassigned" → "Available" everywhere.
//         Default view: Live + Available.
// v1.0.4: Ad wrapper selector fix (.ad-source not .ads-wrapper).
// v1.0.3: Version bump (Jeff)
// v1.0.2: Fix selector + fix attribute names.
//         Wrapper class IS the data-item element (no descendant space).
//         Articles use articleId, articleTitle, articleCustomerName,
//         articleCategoryCode, etc. Separate readers per collection
//         instead of generic readCmsItem.
// v1.0.1: Renamed file (Jeff)
// v1.0.0: Initial build
//   - Main tabs: Articles / Ads
//   - Sub-tabs by MNLS section (FA, TS, BA, SA, TF)
//   - Product Library dropdown filter
//   - Dual status filters: Content (Draft/Live) + Assignment
//     (Assigned/Available)
//   - Sort: Title A-Z, Customer A-Z, Newest First
//   - PubPlan + Slot assignment per item with gold dirty borders
//   - Cancel link reverts to original state
//   - Reads from hidden DOM collection lists:
//       .articles-wrapper, .ad-source, .customers-wrapper,
//       .products-wrapper
//   - Reads pubplans from .pubplan-slot-wrapper elements
//   - Uses shared .cm-hdr classes from ta-page-head-v1.4.css
//
// HARDCODE DECISIONS:
//   HC-CL-003: Planning Status Option hashes from Webflow:
//     In Progress = cbad0e93deea996b0769d71d808d59c5
//     Locked      = e13edebeb1ba9d07a0f7f000786e0586
//   HC-CL-004: Publish Status Option hashes from Webflow:
//     (v1.0.31: migrated from `article-status` → `publish-status`)
//     Draft = daaf373fb13b9970b489d0131d36c396
//     Live  = 5561293d8d8a03909ee3d2e8849d7cc1
//   All other data read from DOM — no derivation.
//   Collection type read from data-content-type (Product Library CMS).
//   Section abbreviation read from data-abbr (Product Library CMS).
//   Section color read from computed backgroundColor (Dynamic Style Setting).
//   CONTENT_TYPE_MAP maps CMS option labels to collection keys —
//   if new Content Type options are added in CMS, add them to the map.
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var mount = document.getElementById('content-library-mount');
  if (!mount) return;

  // ── Config ──
  var CFG = {
    get titleSlug()  { return (window.TA_CONFIG && window.TA_CONFIG.titleSlug) || (document.querySelector('[data-ta-slug]') || {}).dataset && document.querySelector('[data-ta-slug]').dataset.taSlug || ''; },
    get taItemId()   { return (window.TA_CONFIG && window.TA_CONFIG.taItemId)  || (document.querySelector('#title-admin-id') || {}).dataset && document.querySelector('#title-admin-id').dataset.ta || ''; },
    get titleName()  { return (window.TA_CONFIG && window.TA_CONFIG.titleName) || (document.querySelector('[data-title-name]') || {}).dataset && document.querySelector('[data-title-name]').dataset.titleName || ''; },
  };

  // ── Style injection ──
  var style = document.createElement('style');
  style.textContent = [
    '.cl-mtabs{display:flex;gap:0;margin-bottom:0;align-items:flex-end}',
    '.cl-mtab{font-family:"DM Sans",system-ui,sans-serif;font-size:14px;font-weight:700;padding:9px 18px;border:none;background:transparent;color:#7a8472;cursor:pointer;transition:all .15s;border-radius:8px;display:inline-flex;align-items:center;gap:6px;letter-spacing:.01em}',
    '.cl-mtab:hover{color:#1a3a3a;background:rgba(255,255,255,.6)}',
    '.cl-mtab.on{color:#1a3a3a;background:#fff;box-shadow:0 1px 4px rgba(26,58,58,.12)}',
    '.cl-mtab .tc{font-size:11px;background:#e3dfd2;color:#7a8472;padding:1px 7px;border-radius:9px;margin-left:2px;font-weight:600}',
    '.cl-mtab.on .tc{background:#1a3a3a;color:#fff}',
    '.cl-mtab.on .tc{background:#1a3a3a;color:#f5f1e6}',

    '.cl-toolbar{display:flex;align-items:center;gap:4px;margin-top:10px;margin-bottom:14px;flex-wrap:wrap}',
    '.cl-toolbar-label{font-family:"DM Mono",monospace;font-size:10px;color:#a0a090;letter-spacing:.04em;text-transform:uppercase;margin-right:2px}',
    '.cl-pill{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:4px 12px;border-radius:4px;border:1.5px solid #e8e4d8;background:#fff;color:#5a6a5a;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:5px}',
    '.cl-pill:hover{border-color:#1a3a3a;color:#1a3a3a}',
    '.cl-pill.on{background:#1a3a3a;color:#fff;border-color:#1a3a3a}',
    '.cl-pill .pc{font-size:9px;opacity:.7}',
    '.cl-sep{width:1px;height:18px;background:#e8e4d8;margin:0 6px}',
    '.cl-sort{font-family:"DM Mono",monospace;font-size:10px;color:#5a6a5a;background:#fff;border:1.5px solid #e8e4d8;border-radius:4px;padding:4px 20px 4px 8px;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'5\'%3E%3Cpath d=\'M1 1l3 3 3-3\' fill=\'none\' stroke=\'%238a8a7a\' stroke-width=\'1.2\' stroke-linecap=\'round\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 6px center;outline:none;transition:all .15s}',
    '.cl-sort:hover{border-color:#1a3a3a;color:#1a3a3a}',
    '.cl-sort:focus{border-color:#1a3a3a}',

    '.cl-thead{display:grid;grid-template-columns:1fr 1fr 350px 110px;gap:0;border-bottom:2px solid #1a3a3a;padding:6px 0;align-items:end}',
    '.cl-th{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;padding:0 10px}',
    '.cl-th-sub{font-size:8px;color:#a0a090;letter-spacing:.03em;text-transform:none;margin-left:4px}',

    '.cl-list{display:flex;flex-direction:column;gap:3px;margin-top:4px}',
    '.cl-card{background:#fff;border:1.5px solid #e8e4d8;border-radius:4px;transition:border-color .12s;overflow:hidden}',
    '.cl-card:hover{border-color:#c4a35a}',
    '.cl-card.editing{border-color:#c4a35a;background:#fdfcf8;box-shadow:0 2px 10px rgba(26,58,58,.06)}',
    '.cl-card-main{display:grid;grid-template-columns:1fr 1fr 350px 110px;gap:0;align-items:center;padding:11px 0;cursor:pointer}',
    '.cl-cell{padding:0 10px;min-width:0;overflow:hidden}',
    '.cl-title-cell{display:flex;align-items:center;gap:8px;padding:0 10px;min-width:0}',
    '.cl-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}',
    '.cl-dot-live{background:#27ae60}',
    '.cl-dot-draft{background:#e8a030}',
    '.cl-title{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}',
    '.cl-cust{font-family:"DM Mono",monospace;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.cl-cust-name{color:#1a3a3a}',
    '.cl-cust-none{color:#c4c0b0}',
    '.cl-assign{font-size:11px;line-height:1.5}',
    '.cl-assign-issue{font-family:"DM Mono",monospace;font-size:10px;color:#1a3a3a;font-weight:500}',
    '.cl-assign-mnls{font-family:"DM Mono",monospace;font-size:10px;color:#5a6a5a}',
    '.cl-assign-slot{font-family:"DM Mono",monospace;font-size:10px;color:#1a3a3a;font-weight:500}',
    '.cl-assign-avail{font-family:"DM Mono",monospace;font-size:10px;color:#c4a35a}',
    '.cl-btn{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.04em;padding:4px 8px;border-radius:3px;border:1px solid #e8e4d8;background:transparent;color:#1a3a3a;cursor:pointer;white-space:nowrap;transition:all .12s}',
    '.cl-btn:hover{border-color:#1a3a3a;background:#1a3a3a;color:#f0edd8}',

    '.cl-expand{padding:0 10px 10px;border-top:1px dashed #e8e4d8}',
    '.cl-expand-hdr{display:flex;align-items:center;justify-content:space-between;padding:7px 0 5px}',
    '.cl-expand-title{font-size:11px;font-weight:700;color:#1a3a3a}',
    '.cl-cancel{font-size:10px;font-family:"DM Mono",monospace;color:#c0392b;cursor:pointer;background:none;border:none;padding:0}',
    '.cl-cancel:hover{opacity:.7}',
    '.cl-form-row{display:flex;gap:10px;margin-bottom:7px;flex-wrap:wrap}',
    '.cl-ff{flex:1;min-width:130px}',
    '.cl-fl{display:block;font-size:9px;font-family:"DM Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;margin-bottom:3px}',
    '.cl-sel{width:100%;font-family:"DM Sans",sans-serif;font-size:11px;color:#1a3a3a;background:#faf9f5;border:1.5px solid #ddd9c8;border-radius:3px;padding:5px 22px 5px 7px;outline:none;transition:border-color .12s,box-shadow .12s;appearance:none;-webkit-appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'5\'%3E%3Cpath d=\'M1 1l3 3 3-3\' fill=\'none\' stroke=\'%238a8a7a\' stroke-width=\'1.2\' stroke-linecap=\'round\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 6px center}',
    '.cl-sel:focus{border-color:#1a3a3a;box-shadow:0 0 0 2px rgba(26,58,58,.08)}',
    '.cl-sel.changed{border-color:#c4a35a;box-shadow:0 0 0 2px rgba(196,163,90,.15)}',
    '.cl-sel:disabled{opacity:.5;cursor:not-allowed}',

    '.cl-submit-row{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:6px;padding-top:6px;border-top:1px solid #f0ede4}',
    '.cl-save-btn{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:5px 14px;border-radius:3px;border:none;background:#c4a35a;color:#fff;cursor:pointer;transition:all .12s}',
    '.cl-save-btn:hover{background:#b8860b}',
    '.cl-save-btn:disabled{opacity:.4;cursor:not-allowed}',
    '.cl-save-info{font-size:9px;font-family:"DM Mono",monospace;color:#a0a090}',
    '.cl-empty{text-align:center;padding:28px 16px;color:#8a8a7a;font-family:"DM Mono",monospace;font-size:11px}',
    '.cl-btn-assign{background:#c4a35a;color:#fff;border-color:#c4a35a}',
    '.cl-btn-assign:hover{background:#b8860b;border-color:#b8860b;color:#fff}',
    '.cl-modal-overlay{position:fixed;inset:0;background:rgba(26,58,58,0.7);z-index:10000;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}',
    '.cl-modal{background:#fff;border-radius:8px;width:520px;max-width:95vw;max-height:80vh;overflow-y:auto;font-family:"DM Sans",sans-serif;color:#1a3a3a;box-shadow:0 20px 60px rgba(0,0,0,0.3)}',
    '.cl-modal-bar{height:4px;background:linear-gradient(90deg,#1a3a3a,#c4a35a);border-radius:8px 8px 0 0}',
    '.cl-modal-body{padding:16px 18px}',
    '.cl-modal-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}',
    '.cl-modal-title{font-size:15px;font-weight:700}',
    '.cl-modal-meta{font-family:"DM Mono",monospace;font-size:10px;color:#8a8a7a;display:flex;gap:8px;align-items:center;margin-top:2px}',
    '.cl-modal-close{width:28px;height:28px;border-radius:50%;border:1.5px solid #e8e4d8;background:#fff;cursor:pointer;font-size:14px;color:#8a8a7a;transition:all .15s;flex-shrink:0;display:flex;align-items:center;justify-content:center}',
    '.cl-modal-close:hover{border-color:#c0392b;color:#c0392b}',
    '.cl-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:12px;padding:10px 0;border-top:1px solid #e8e4d8;border-bottom:1px solid #e8e4d8;margin-bottom:12px}',
    '.cl-modal-label{font-family:"DM Mono",monospace;font-size:9px;color:#8a8a7a;letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px}',
    '.cl-modal-val{font-weight:500}',
    '.cl-modal-section{font-family:"DM Mono",monospace;font-size:9px;color:#8a8a7a;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}',
    '.cl-modal-elem{display:flex;align-items:center;gap:8px;padding:7px 10px;background:#faf9f5;border:1px solid #e8e4d8;border-radius:4px;margin-bottom:4px}',
    '.cl-modal-elem-icon{width:36px;height:36px;background:#e8e4d8;border-radius:3px;display:flex;align-items:center;justify-content:center;font-family:"DM Mono",monospace;font-size:11px;flex-shrink:0;color:#5a6a5a}',
    '.cl-modal-elem-name{font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}',
    '.cl-modal-elem-type{font-family:"DM Mono",monospace;font-size:9px;color:#8a8a7a}',
    '.cl-modal-footer{display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid #e8e4d8}',

    /* ── v1.0.34 redesign ── */
    /* Tab row + inline search on one line */
    '.cl-tabrow{display:flex;align-items:flex-end;justify-content:space-between;gap:40px;margin-bottom:16px}',
    '.cl-tabrow .cl-mtabs.std-subtabs{margin-bottom:0;flex:0 0 auto;border-bottom:1px solid #e4e0d4}',
    /* v1.0.43: fixed-width centered tabs (fits "Real Estate") */
    '.cl-mtab.ix-btn--tab{width:118px;text-align:center;margin-right:0 !important;padding-left:0 !important;padding-right:0 !important;justify-content:center}',
    /* count chip inside ix-btn--tab — subtle, inherits tab color */
    '.cl-mtab .tc{font-size:11px;margin-left:6px;opacity:.55;font-weight:600}',
    '.cl-mtab[data-active="true"] .tc{opacity:.9}',
    '.cl-searchrail{flex:1 1 520px;max-width:640px;border-bottom:1px solid #e4e0d4;display:flex;align-items:flex-end}',
    '.cl-searchbox{position:relative;width:100%;margin-bottom:0}',
    '.cl-searchbox .cl-search-ico{position:absolute;left:15px;top:50%;transform:translateY(-50%);width:16px;height:16px;opacity:.45;pointer-events:none;z-index:1}',
    '.cl-search-input{width:100%;box-sizing:border-box;font-family:"DM Sans",system-ui,sans-serif;font-size:14px;padding:11px 16px;border:1.5px solid #e3dfd2;border-radius:10px;background:#fff;color:#1a3a3a;outline:none;transition:border-color .15s,box-shadow .15s}',
    '.cl-search-input:focus{outline:none;border:none;box-shadow:none}',
    '.cl-search-input::placeholder{color:#b0ac9c}',

    /* Filter strip — labeled groups, always-visible text, includes an All segment */
    '.cl-fstrip{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:16px;padding:10px 12px;background:#faf9f5;border:1px solid #efece1;border-radius:9px}',
    '.cl-dd{font-family:"DM Sans",system-ui,sans-serif;font-size:12px;color:#1a3a3a;background:#fff;border:1.5px solid #e3dfd2;border-radius:7px;padding:6px 26px 6px 10px;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\'%3E%3Cpath d=\'M1 1l4 4 4-4\' fill=\'none\' stroke=\'%235a6a5a\' stroke-width=\'1.4\' stroke-linecap=\'round\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 9px center;outline:none;transition:border-color .15s;min-width:90px}',
    '.cl-dd:hover{border-color:#1a3a3a}',
    '.cl-dd:focus{border-color:#142e2e;box-shadow:0 0 0 3px rgba(20,46,46,.06)}',
    '.cl-fgroup{display:flex;align-items:center;gap:7px}',
    '.cl-flabel{font-family:"DM Mono",monospace;font-size:9px;color:#a0a090;letter-spacing:.07em;text-transform:uppercase}',
    /* v1.0.42: pill row — just spacing; the pills are shared ix-btn--pill */
    '.cl-pillrow{display:inline-flex;gap:6px;flex-wrap:wrap;align-items:center}',
    /* count chip inside a pill; dims on active (white text) */
    '.cl-pc{font-size:9px;opacity:.6;margin-left:5px}',
    '.ix-btn--pill[data-active="true"] .cl-pc{opacity:.85}',
    '.cl-fspacer{flex:1 1 auto;min-width:8px}',

    /* ── v1.0.47 ── */
    /* #1 filter toggle icon sits left of the search box */
    '.cl-searchrail{gap:12px}',
    '.cl-filter-toggle{flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;height:44px;padding:0 16px;align-self:flex-end;margin-bottom:1px;border-radius:10px;font-size:13px;font-weight:500;white-space:nowrap}',
    '.cl-filter-toggle svg{flex:0 0 auto}',
    '.cl-filter-label{font-family:"DM Sans",sans-serif}',
    '.cl-filter-toggle[data-active="true"]{background:#c4a35a !important;color:#fff !important;border-color:#c4a35a !important}',
    /* #4 armed Assign button — electric blue bg, white text (was the unstyled stray box) */
    '.ix-btn--sm.is-armed{background:#185fa5 !important;color:#fff !important;border-color:#185fa5 !important}',
    /* ix-picker dirty border bridge — gold, matches ix-form-controls --changed (in case page CSS lags) */
    '.ix-picker-input{width:100%;font-family:"DM Sans",sans-serif;font-size:11px;color:#1a3a3a;background:#faf9f5;border:1.5px solid #ddd9c8;border-radius:3px;padding:5px 22px 5px 7px;outline:none;appearance:none;-webkit-appearance:none;cursor:pointer}',
    '.ix-picker-input--changed{border-color:#c4a35a !important;box-shadow:0 0 0 2px rgba(196,163,90,.18) !important}',
    '.ix-picker-input:disabled{opacity:.6;cursor:not-allowed}',
    '.ix-revert{font-size:10px;font-family:"DM Mono",monospace;color:#993556;cursor:pointer;background:none;border:none;padding:0}',
    '.ix-revert:hover{opacity:.7}',
    /* batch tray — fixed bottom, high z, escapes T-A overflow chain */
    '.cl-batch-tray{position:fixed;left:0;right:0;bottom:0;z-index:99999;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 24px;background:#0c447c;box-shadow:0 -4px 20px rgba(0,0,0,.22)}',
    '.cl-batch-count{font-family:"DM Mono",monospace;font-size:12px;color:#b5d4f4}',
    '.cl-batch-actions{display:flex;gap:8px}',
    '.cl-batch-tray .ix-btn{background:transparent;color:#b5d4f4;border:1px solid #378add}',
    '.cl-batch-tray .ix-btn--primary{background:#378add;color:#fff;border-color:#378add}',
    '.cl-batch-tray .ix-btn.is-loading{opacity:.7}',

    /* Zebra rows + stronger contrast */
    '.cl-list{gap:0 !important}',
    '.cl-card{border:none !important;border-radius:0 !important;border-bottom:1px solid #efece1 !important}',
    '.cl-card:nth-child(odd){background:#fbfaf6}',
    '.cl-card:nth-child(even){background:#ffffff}',
    '.cl-card:hover{background:#f5f1e6 !important;border-color:transparent !important}',
    '.cl-card.editing{background:#fdf8ec !important;border-left:3px solid #c4a35a !important}',
    '.cl-card-main{padding:13px 0 !important}',
    '.cl-thead{background:#1a3a3a;border-bottom:none;border-radius:7px 7px 0 0;padding:9px 0}',
    '.cl-th{color:#d8d2be}',
    '.cl-th-sub{color:#a8b0a0}',
  ].join('\n');
  document.head.appendChild(style);

  // ══════════════════════════════════════════════
  // DOM DATA READERS
  // ══════════════════════════════════════════════

  // ── Publish Status hash → label mapping ──
  // HC-CL-004: Webflow Option field hashes for "Publish Status"
  // v1.0.31: migrated from the old `article-status` field. Constant
  // name kept as ARTICLE_STATUS_MAP to minimize diff surface; values
  // and data attribute source are both new.
  var ARTICLE_STATUS_MAP = {
    'daaf373fb13b9970b489d0131d36c396': 'draft',
    '5561293d8d8a03909ee3d2e8849d7cc1': 'live',
  };
  function mapArticleStatus(hash) {
    return ARTICLE_STATUS_MAP[hash] || hash.toLowerCase() || 'draft';
  }

  // ── Read MNLS sections from products-wrapper ──
  // All data comes from DOM attributes — no string derivation.
  //   data-group        = MNLS Name (full label, e.g. "Feature Article")
  //   data-abbr  = Abbreviation from Product Library (FA, TS, BA, etc.)
  //   data-content-type = Collection category from Product Library
  //                       ("Article", "Ad", "Event", "Real Estate Listing")
  //   background-color  = Section color from Dynamic Style Settings
  //                       (Header Color bound to BG Color on products-wrapper)
  function readMnlsSections() {
    var sections = {};
    var items = document.querySelectorAll('.products-wrapper[data-item="true"]');
    items.forEach(function (el) {
      var group = (el.dataset.group || '').trim();
      var abbr = (el.dataset.abbr || '').trim().toUpperCase();
      var contentType = (el.dataset.contentType || '').trim();
      if (!group || !abbr) return;
      if (sections[abbr]) return; // one entry per abbreviation

      // Read color from computed background-color (Dynamic Style Setting)
      var rawColor = getComputedStyle(el).backgroundColor || '';
      var color = rgbToHex(rawColor) || '#5a6a5a';

      // Map Content Type label to collection key
      var collection = contentTypeToCollection(contentType);

      sections[abbr] = {
        id: abbr,
        label: group,
        abbr: abbr,
        color: color,
        collection: collection,
      };
    });
    return sections;
  }

  // Convert rgb(r,g,b) string to #hex
  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '';
    var match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return rgb; // already hex or unknown format
    var r = parseInt(match[1], 10);
    var g = parseInt(match[2], 10);
    var b = parseInt(match[3], 10);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Map CMS Content Type option label → collection key
  // Reads the exact label strings from Product Library "Content Type" option field.
  // If new option values are added in CMS, add them here.
  var CONTENT_TYPE_MAP = {
    'Article': 'articles',
    'Ad': 'ads',
    'Event': 'events',
    'Real Estate Listing': 're',
  };
  function contentTypeToCollection(label) {
    return CONTENT_TYPE_MAP[label] || 'ads';
  }

  // ── Read Products from products-wrapper ──
  function readProducts() {
    var out = [];
    var items = document.querySelectorAll('.products-wrapper[data-item="true"]');
    items.forEach(function (el) {
      var id = (el.dataset.id || '').trim();
      var name = (el.dataset.name || '').trim();
      var group = (el.dataset.group || '').trim();
      var abbr = (el.dataset.abbr || '').trim().toUpperCase();
      var contentType = (el.dataset.contentType || '').trim();
      var reqCust = !!el.querySelector('[data-customer-required="true"]');
      if (!id || !name) return;
      out.push({
        id: id,
        name: name,
        group: group,
        mnlsId: abbr,  // matches MNLS_SECTIONS key
        contentType: contentType,
        collection: contentTypeToCollection(contentType),
        reqCust: reqCust,
      });
    });
    return out;
  }

  // ── Read Customers from customers-wrapper ──
  function readCustomers() {
    var out = [];
    var items = document.querySelectorAll('.customers-wrapper[data-item="true"]');
    items.forEach(function (el) {
      var id = (el.dataset.id || '').trim();
      var name = (el.dataset.name || '').trim();
      if (!id || !name) return;
      out.push({ id: id, name: name });
    });
    return out.sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  // ── v1.0.45: per-type fieldData → internal shape maps ──
  // Each entry names the fieldData slug for that concept. Article slugs are
  // confirmed (from live curl). ad/event/realestate are best-effort — confirm
  // by curling each type and adjust here if a column is blank.
  var TYPE_MAPS = {
    articles: {
      collection:'articles', name:['name','slug'], status:'publish-status',
      customerId:'associated-business-coc', productId:'product',
      mnlsId:'major-nl-section', newsletterId:'associated-newsletter',
      title:'associated-title',
      image:['main-image-ulc-link---1-1-ratio'], mediaItems:'media-items'
    },
    ads: {
      collection:'ads', name:['name','slug'], status:'status',
      customerId:['customer','associated-business-coc','associated-customer'],
      productId:['product','ad-product'], mnlsId:['major-nl-section'],
      title:['associated-title','title-admin'],
      image:['ad-image-ulc-link','main-image-ulc-link---1-1-ratio'], mediaItems:'media-items'
    },
    events: {
      collection:'events', name:['name','event-title','slug'], status:null,
      customerId:['customer','associated-customer'], productId:['category','event-category'],
      mnlsId:null, title:['associated-title','title-admin'],
      date:['event-date','date'], image:['event-image-ulc-link'], mediaItems:'media-items'
    },
    realestate: {
      collection:'realestate', name:['name','listing-title','property-address','slug'],
      status:['listing-status','status'],
      customerId:['customer','associated-customer','agent'],
      productId:['category'], mnlsId:null,
      title:['associated-title','title-admin'],
      image:['listing-photo-ulc-link','main-image-ulc-link---1-1-ratio'], mediaItems:'media-items'
    }
  };

  // pick first non-empty fieldData value from a slug or array of slugs
  function fdPick(fd, key) {
    if (!key) return null;
    var keys = Array.isArray(key) ? key : [key];
    for (var i=0;i<keys.length;i++){ var v=fd[keys[i]]; if (v!=null && v!=='') return v; }
    return null;
  }

  // ── v1.0.45: generic webhook record → internal item shape ──
  function mapWebhookRecord(rec, tabKey) {
    var fd = rec.fieldData || {};
    var m  = TYPE_MAPS[tabKey] || TYPE_MAPS.articles;
    var img = fdPick(fd, m.image);
    if (!img && fd['main-image'] && fd['main-image'].url) img = fd['main-image'].url;
    var mediaItems = fdPick(fd, m.mediaItems);
    return {
      id: rec.id || fd['this-article-s-item-id'] || '',
      name: fdPick(fd, m.name) || '',
      collection: m.collection,
      status: m.status ? mapArticleStatus((fdPick(fd, m.status)||'').toString().trim()) : 'live',
      isDraft: !!rec.isDraft,
      customerId: fdPick(fd, m.customerId),
      customerName: null,
      productId: fdPick(fd, m.productId),
      categoryId: fdPick(fd, m.productId),
      mnlsId: fdPick(fd, m.mnlsId),
      mnlsName: null, productName: null, mnlsGroup: '', mnlsAbbr: '',
      newsletterId: fdPick(fd, m.newsletterId),
      newsletterName: null, newsletterDate: null,
      pubplanId: null, pubplanName: null, slot: null,
      created: rec.createdOn || rec.lastPublished || fdPick(fd, m.date) || null,
      associatedTitle: fdPick(fd, m.title),
      mainImage: img || null,
      assetCount: Array.isArray(mediaItems) ? mediaItems.length : 0,
    };
  }

  // ── v1.0.44: map a webhook article record → internal item shape ──
  // Mirrors readArticles() output so render/filter/sort are unchanged.
  function mapWebhookArticle(rec) {
    var fd = rec.fieldData || {};
    return {
      id: rec.id || fd['this-article-s-item-id'] || '',
      name: fd.name || fd.slug || '',
      collection: 'articles',
      status: mapArticleStatus((fd['publish-status'] || '').trim()),
      isDraft: !!rec.isDraft,
      customerId: fd['associated-business-coc'] || null,
      customerName: null,                 // resolved later from CUSTOMERS if needed
      productId: fd.product || null,
      categoryId: fd.product || null,
      mnlsId: fd['major-nl-section'] || null,
      mnlsName: null,
      productName: null,
      mnlsGroup: '',
      mnlsAbbr: '',
      newsletterId: fd['associated-newsletter'] || null,
      newsletterName: null,
      newsletterDate: null,
      pubplanId: null,
      pubplanName: null,
      slot: null,
      // createdOn is the authoritative sort key (ISO → sorts correctly)
      created: rec.createdOn || rec.lastPublished || null,
      associatedTitle: fd['associated-title'] || null,
      mainImage: fd['main-image-ulc-link---1-1-ratio'] || (fd['main-image'] && fd['main-image'].url) || null,
      assetCount: Array.isArray(fd['media-items']) ? fd['media-items'].length : 0,
    };
  }

  // ── v1.0.45: fetch one page for ANY type from the list webhook ──
  function fetchAssetPage(tabKey, offset) {
    if (!LIST_WEBHOOK) return Promise.resolve(null);
    var at = ASSET_TYPE_PARAM[tabKey] || 'article';
    var url = LIST_WEBHOOK + (LIST_WEBHOOK.indexOf('?') === -1 ? '?' : '&') +
      'assetType=' + at + '&taItemId=' + encodeURIComponent(TA_ITEM_ID) +
      '&offset=' + offset + '&limit=' + PAGE_SIZE;
    return fetch(url, { method: 'GET' })
      .then(function (r) { return r.text().then(function (t) {
        var s = (t || '').trim();
        if (!s || (s[0] !== '{' && s[0] !== '[')) throw new Error('non-JSON: ' + s.slice(0,40));
        return JSON.parse(s);
      }); })
      .catch(function (e) { console.warn('[CL] ' + tabKey + ' page fetch failed', e); return null; });
  }

  // ── v1.0.45: load one page for a type, append, re-render ──
  function loadAssets(tabKey) {
    var pg = paging[tabKey];
    if (!pg || pg.loading || pg.done) return Promise.resolve();
    pg.loading = true;
    var off = pg.offset;
    return fetchAssetPage(tabKey, off).then(function (resp) {
      pg.loading = false;
      if (!resp) { pg.done = true; return; }
      var arr = Array.isArray(resp.items) ? resp.items
              : (resp.items && Array.isArray(resp.items.items)) ? resp.items.items
              : Array.isArray(resp) ? resp : [];
      var total = (resp.total != null) ? resp.total
                : (resp.items && resp.items.pagination && resp.items.pagination.total) || null;
      pg.total = total;
      var mapped = arr.map(function (r) { return mapWebhookRecord(r, tabKey); })
                      .filter(function (a) {
                        return !TA_ITEM_ID || !a.associatedTitle || a.associatedTitle === TA_ITEM_ID;
                      });

      // v1.0.49 (Piece 2): durable assignment status from NL-BLOCKS.
      // List Assets v2 returns nlblocks[] alongside the assets. Build a set of
      // asset ids referenced by a planning/locked NL-BLOCKS row FOR THIS TITLE
      // (title match client-side per multi-tenant rule — Webflow can't ref-filter
      // server-side). An asset is "assigned" iff an NL-BLOCKS row references it.
      var nlb = (resp.nlblocks && Array.isArray(resp.nlblocks)) ? resp.nlblocks
              : (resp.nlblocks && Array.isArray(resp.nlblocks.items)) ? resp.nlblocks.items : [];
      if (nlb.length) {
        var refMap = {};   // assetId -> { pubplanId }
        nlb.forEach(function (row) {
          var fd = row.fieldData || {};
          // tenant scope: only this title's blocks count
          var ta = fd['title-admin'];
          if (TA_ITEM_ID && ta && ta !== TA_ITEM_ID) return;
          var aid = fd['asset-article'] || fd['asset-event'] || fd['asset-re'] || '';
          if (!aid) return;
          refMap[aid] = { pubplanId: fd['publication-plan'] || '', newsletterId: fd['newsletter'] || '' };
        });
        mapped.forEach(function (a) {
          var ref = refMap[a.id];
          if (ref) {
            a.pubplanId = ref.pubplanId || a.pubplanId;
            a.newsletterId = ref.newsletterId || a.newsletterId;
            var pp = PUBPLANS.find(function (p) { return p.id === a.pubplanId; });
            if (pp) a.pubplanName = pp.label;
          }
        });
      }

      ALL_ITEMS = ALL_ITEMS.concat(mapped);
      enrichItems(mapped);
      pg.offset = off + arr.length;
      if (!arr.length || (total != null && pg.offset >= total)) pg.done = true;
      render();
    });
  }

  // ensure a type's first page is loaded (called on tab switch)
  function ensureLoaded(tabKey) {
    var pg = paging[tabKey];
    if (pg && pg.offset === 0 && !pg.loading && !pg.done) loadAssets(tabKey);
  }

  // ── Read Articles from articles-wrapper ──
  // DOM attributes: articleId, articleTitle, articleCustomerName,
  //   articleCustomerId, articleCategoryCode, articleCategory,
  //   categoryId, label, type, item
  function readArticles() {
    var out = [];
    var items = document.querySelectorAll('.articles-wrapper[data-item="true"]');
    items.forEach(function (el) {
      var d = el.dataset;
      var id = (d.articleId || d.id || '').trim();
      var name = (d.articleTitle || d.name || d.label || '').trim();
      if (!id && !name) return;
      out.push({
        id: id,
        name: name,
        collection: 'articles',
        status: mapArticleStatus((d.publishStatus || '').trim()),
        customerId: (d.articleCustomerId || d.customerId || '').trim() || null,
        customerName: (d.articleCustomerName || d.customerName || '').trim() || null,
        productId: (d.categoryId || '').trim() || null,  // Product Library Item ID (from data-category-id)
        categoryId: (d.categoryId || '').trim() || null,
        mnlsId: (d.mnlsId || '').trim() || null,         // MNLS Item ID (from data-mnls-id)
        mnlsName: (d.mnlsName || '').trim() || null,     // MNLS label e.g. "Feature Article" (from data-mnls-name)
        productName: (d.type || d.productName || '').trim() || null,
        mnlsGroup: (d.mnlsName || d.articleCategory || d.group || '').trim(),  // prefer mnlsName
        mnlsAbbr: (d.articleCategoryCode || d.abbr || '').trim().toUpperCase() || '',
        newsletterId: (d.newsletterId || '').trim() || null,
        newsletterName: (d.newsletterName || '').trim() || null,
        newsletterDate: (d.newsletterDate || '').trim() || null,
        pubplanId: (d.pubplanId || '').trim() || null,
        pubplanName: (d.pubplanName || '').trim() || null,
        slot: (d.slot || '').trim() || null,
        created: (d.created || d.articleCreated || d.articleUpdated || '').trim() || null,
        assetCount: parseInt(d.assetCount || '0', 10),
      });
    });
    return out;
  }

  // ── Read Ads from ads-wrapper ──
  // DOM attributes may use ad- prefix (adId, adTitle, etc.)
  // or generic names — read both with fallbacks
  function readAds() {
    var out = [];
    var items = document.querySelectorAll('.ad-source[data-item="true"]');
    items.forEach(function (el) {
      var d = el.dataset;
      var id = (d.adId || d.id || '').trim();
      var name = (d.adTitle || d.adName || d.name || d.label || '').trim();
      if (!id && !name) return;
      out.push({
        id: id,
        name: name,
        collection: 'ads',
        status: (d.status || d.adStatus || 'draft').trim().toLowerCase(),
        customerId: (d.adCustomerId || d.customerId || '').trim() || null,
        customerName: (d.adCustomerName || d.customerName || '').trim() || null,
        productId: (d.productId || '').trim() || null,
        productName: (d.type || d.productName || '').trim() || null,
        mnlsGroup: (d.adCategory || d.group || '').trim(),
        mnlsAbbr: (d.adCategoryCode || d.abbr || '').trim().toUpperCase() || '',
        pubplanId: (d.pubplanId || '').trim() || null,
        pubplanName: (d.pubplanName || '').trim() || null,
        slot: (d.slot || '').trim() || null,
        created: (d.created || d.adCreated || '').trim() || null,
        assetCount: parseInt(d.assetCount || '0', 10),
      });
    });
    return out;
  }

  // ── Read Events from .events-wrapper ──
  // dataset: eventTitle, eventDate, categoryId, customerId, label,
  //          eventId, customerName, group, type. No status attr → 'live'.
  function readEvents() {
    var out = [];
    var items = document.querySelectorAll('.events-wrapper[data-item="true"]');
    items.forEach(function (el) {
      var d = el.dataset;
      var id = (d.eventId || d.id || '').trim();
      var name = (d.eventTitle || d.eventName || d.name || d.label || '').trim();
      if (!id && !name) return;
      out.push({
        id: id,
        name: name,
        collection: 'events',
        status: 'live',                      // no status bound on events
        customerId: (d.customerId || '').trim() || null,
        customerName: (d.customerName || '').trim() || null,
        productId: (d.categoryId || '').trim() || null,
        productName: (d.type || '').trim() || null,
        mnlsGroup: (d.group || 'Event').trim(),
        mnlsAbbr: 'EV',
        eventDate: (d.eventDate || '').trim() || null,
        created: (d.eventDate || '').trim() || null,
        assetCount: parseInt(d.assetCount || '0', 10),
      });
    });
    return out;
  }

  // ── Read Real Estate from .real-estate-wrapper ──
  // NOTE: this hidden Collection List is NOT yet bound on the T-A page
  // (0 elements as of v1.0.33). Tab renders empty until it's added in
  // Webflow with data-item="true" + the attributes read below. Attribute
  // names are best-effort; confirm/adjust once the list is bound.
  function readRE() {
    var out = [];
    var items = document.querySelectorAll('.real-estate-wrapper[data-item="true"]');
    items.forEach(function (el) {
      var d = el.dataset;
      var id = (d.reId || d.listingId || d.id || '').trim();
      var name = (d.reTitle || d.propertyAddress || d.name || d.label || '').trim();
      if (!id && !name) return;
      out.push({
        id: id,
        name: name,
        collection: 'realestate',
        status: (d.reStatus || d.status || 'live').trim().toLowerCase(),
        customerId: (d.customerId || '').trim() || null,
        customerName: (d.customerName || '').trim() || null,
        productId: (d.categoryId || '').trim() || null,
        productName: (d.type || '').trim() || null,
        mnlsGroup: (d.group || 'Real Estate').trim(),
        mnlsAbbr: 'RE',
        created: (d.created || '').trim() || null,
        assetCount: parseInt(d.assetCount || '0', 10),
      });
    });
    return out;
  }

  // ── Read PubPlans from pubplan-slot-wrapper elements ──
  // Only includes PubPlans with planningStatus = "In Progress"
  function readPubplans() {
    var seen = {};
    var out = [];
    var items = document.querySelectorAll('.pubplan-slot-wrapper[data-pubplan-id]');
    items.forEach(function (el) {
      var id = (el.dataset.pubplanId || '').trim();
      var name = (el.dataset.pubplanName || '').trim();
      var date = (el.dataset.pubplanDate || '').trim();
      var status = (el.dataset.planningStatus || '').trim();
      if (!id || seen[id]) return;
      seen[id] = true;
      out.push({
        id: id,
        name: name || 'Issue ' + id.slice(-3),
        date: date,
        label: name + (date ? ' \u2014 ' + date : ''),
        planningStatus: status,
      });
    });
    // Sort newest first by name (WLN-110 > WLN-109)
    out.sort(function (a, b) { return b.name.localeCompare(a.name); });
    return out;
  }

  // Assignment map removed — article's own data-newsletter-name/date
  // is the source of truth, not slot wrapper cross-reference.

  // ── Read content slots for a given section + pubplan from DOM ──
  // Returns array of {code, articleId, articleTitle, catId, catLabel, customerId, customerName}
  // Excludes category slots (those containing "cat")
  function readContentSlots(sectionCode, pubplanId) {
    var sc = sectionCode.toLowerCase();
    var slots = [];
    var items = document.querySelectorAll('.pubplan-slot-wrapper[data-pubplan-id="' + pubplanId + '"]');
    items.forEach(function (el) {
      var d = el.dataset;
      if ((d.sectionCode || '').toLowerCase() !== sc) return;
      var code = (d.slotCode || '').toLowerCase();
      // Skip category slots
      if (code.indexOf('cat') !== -1) return;
      slots.push({
        code: code,
        label: code.toUpperCase().replace('-', '-'), // fa-1 → FA-1 display
        articleId: (d.articleId || '').trim() || null,
        articleTitle: (d.articleTitle || '').trim() || null,
        catId: (d.catId || '').trim() || null,
        catLabel: (d.catLabel || '').trim() || null,
        customerId: (d.customerId || '').trim() || null,
        customerName: (d.customerName || '').trim() || null,
        sectionId: (d.sectionId || '').trim() || null,
        titleadminId: (d.titleadminId || '').trim() || null,
      });
    });
    // Sort numerically
    slots.sort(function (a, b) {
      var numA = parseInt(a.code.split('-')[1], 10) || 0;
      var numB = parseInt(b.code.split('-')[1], 10) || 0;
      return numA - numB;
    });
    return slots;
  }

  // ══════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════

  var MNLS_SECTIONS = {};  // populated on init
  var PRODUCTS = [];
  var CUSTOMERS = [];
  var ALL_ITEMS = [];      // combined articles + ads

  // ── v1.0.44: webhook article paging ──
  var LIST_WEBHOOK = (window.TA_CONFIG && window.TA_CONFIG.makeListAssets) || '';
  var TA_ITEM_ID   = (window.TA_CONFIG && window.TA_CONFIG.taItemId) || '';
  var PAGE_SIZE    = 100;
  // v1.0.45: per-type paging state.
  var paging = {
    articles:   { offset: 0, total: null, loading: false, done: false },
    ads:        { offset: 0, total: null, loading: false, done: false },
    events:     { offset: 0, total: null, loading: false, done: false },
    realestate: { offset: 0, total: null, loading: false, done: false }
  };
  // CL tab name → webhook assetType param.
  var ASSET_TYPE_PARAM = { articles:'article', ads:'ad', events:'event', realestate:'realestate' };
  var PUBPLANS = [];

  var S = {
    mainTab: 'articles',   // articles | ads | events | realestate
    q: '',                 // v1.0.33 search query (per current tab)
    subTab: 'all',         // all | FA | TS | etc.
    contentStatus: 'all',  // all | draft | live
    assignStatus: 'all', // all | assigned | available
    customerFilter: 'all',     // v1.0.46
    newsletterFilter: 'all',   // v1.0.46
    pubplanFilter: 'all',      // v1.0.46
    productFilter: 'all',      // v1.0.46 (separated from subTab)
    sortBy: 'date',   // v1.0.39: newest first by default        // name | customer | date
    editingId: null,       // which row's drawer is OPEN (one at a time)
    edit: {},              // open drawer's working selection { pubplan, blockType }
    armed: {},             // v1.0.47: batch — rowId -> { pubplan, blockType } committed but unsaved
    saving: false,         // v1.0.47: batch save in flight
    showFilters: false,    // v1.0.47: filter bar hidden by default (#2), toggled by filter icon (#1)
    viewingId: null,       // Article detail modal
  };

  // v1.0.47: block-type roster per asset type (PICK-TARGET, UI side).
  // Article = real choice (FA/TS/BL); Event/RE = single, locked.
  // Ads are OUT of Library scope (handled in PubPlan grid).
  function blockTypesForCollection(coll) {
    if (coll === 'articles') return ['FA', 'TS', 'BL'];
    if (coll === 'events')   return ['EV'];
    if (coll === 'realestate' || coll === 're') return ['RE'];
    return [];
  }
  function blockTypeHash(code) {
    var bt = (window.TA_CONFIG && window.TA_CONFIG.optionIds && window.TA_CONFIG.optionIds.blockType) || {};
    return bt[code] || '';
  }
  // assetType param + ref field for the 124 payload, by collection.
  function assetTypeFor(coll) {
    if (coll === 'articles') return 'article';
    if (coll === 'events')   return 'event';
    if (coll === 'realestate' || coll === 're') return 're';
    return '';
  }

  // ══════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════

  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function mnlsForTab(tab) {
    var out = [];
    var targetCollection = tab === 'articles' ? 'articles' : 'ads';
    Object.keys(MNLS_SECTIONS).forEach(function (key) {
      var m = MNLS_SECTIONS[key];
      if (m.collection === targetCollection) out.push(m);
    });
    return out;
  }

  // Find MNLS section for a given item by looking up its product's mnlsId
  function findMnlsForItem(item) {
    // If item has a direct abbr, use it
    if (item.mnlsAbbr && MNLS_SECTIONS[item.mnlsAbbr]) return MNLS_SECTIONS[item.mnlsAbbr];
    // Otherwise look up via product
    if (item.productId) {
      var prod = PRODUCTS.find(function (p) { return p.id === item.productId; });
      if (prod && MNLS_SECTIONS[prod.mnlsId]) return MNLS_SECTIONS[prod.mnlsId];
    }
    // Fallback: match by group name
    return Object.values(MNLS_SECTIONS).find(function (m) { return m.label === item.mnlsGroup; }) || null;
  }

  function itemsForTab(tab) {
    // v1.0.33: tab name === collection name for all 4 types.
    var targetCollection = tab;
    return ALL_ITEMS.filter(function (i) { return i.collection === targetCollection; });
  }

  function getFiltered() {
    var items = itemsForTab(S.mainTab);

    // Sub-tab filter by MNLS abbreviation
    if (S.subTab !== 'all') {
      items = items.filter(function (i) {
        var m = findMnlsForItem(i);
        return m && m.id === S.subTab;
      });
    }

    // Content status
    if (S.contentStatus !== 'all') {
      items = items.filter(function (i) { return i.status === S.contentStatus; });
    }

    // Assignment status
    // Articles: assigned = has newsletterId (used in a newsletter)
    // Ads: assigned = has pubplanId and slot
    if (S.assignStatus === 'assigned') {
      items = items.filter(function (i) {
        return i.collection === 'articles' ? !!i.newsletterId : (i.pubplanId && i.slot);
      });
    } else if (S.assignStatus === 'available') {
      items = items.filter(function (i) {
        return i.collection === 'articles' ? !i.newsletterId : (!i.pubplanId || !i.slot);
      });
    }

    // v1.0.46: Product filter
    if (S.productFilter && S.productFilter !== 'all') {
      items = items.filter(function (i) { return i.productId === S.productFilter; });
    }
    // v1.0.46: Customer filter
    if (S.customerFilter && S.customerFilter !== 'all') {
      items = items.filter(function (i) { return i.customerId === S.customerFilter; });
    }
    // v1.0.46: Newsletter filter
    if (S.newsletterFilter && S.newsletterFilter !== 'all') {
      items = items.filter(function (i) { return i.newsletterId === S.newsletterFilter; });
    }
    // v1.0.46: Pub Plan filter
    if (S.pubplanFilter && S.pubplanFilter !== 'all') {
      items = items.filter(function (i) { return i.pubplanId === S.pubplanFilter; });
    }

    // v1.0.33: search filter — name + customer name, case-insensitive.
    if (S.q && S.q.trim()) {
      var q = S.q.trim().toLowerCase();
      items = items.filter(function (i) {
        return ((i.name || '').toLowerCase().indexOf(q) !== -1) ||
               ((i.customerName || '').toLowerCase().indexOf(q) !== -1);
      });
    }

    // Sort
    items.sort(function (a, b) {
      if (S.sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (S.sortBy === 'customer') {
        var ca = a.customerName || '\uffff';
        var cb = b.customerName || '\uffff';
        return ca.localeCompare(cb);
      }
      if (S.sortBy === 'date') {
        // v1.0.40: dates are human strings ("May 31, 2026") — parse to a
        // timestamp and compare numerically (newest first). Unparseable /
        // missing dates sink to the bottom.
        var ta = a.created ? Date.parse(a.created) : NaN;
        var tb = b.created ? Date.parse(b.created) : NaN;
        var va = isNaN(ta) ? -Infinity : ta;
        var vb = isNaN(tb) ? -Infinity : tb;
        return vb - va;   // newest first
      }
      return 0;
    });

    return items;
  }

  // getAssignedSlots removed — replaced by readContentSlots() which reads
  // slot occupancy directly from the DOM (articleId on each slot wrapper)

  // ══════════════════════════════════════════════
  // ACTIONS
  // ══════════════════════════════════════════════

  function setMain(tab) { S.mainTab = tab; S.subTab = 'all'; S.q = ''; S.editingId = null; render(); ensureLoaded(tab); }
  // v1.0.33: search setter. Preserve focus/caret across re-render by NOT
  // re-rendering the input itself (see render: input keeps its value via DOM).
  function setQ(val) { S.q = val || ''; render(); }
  function setSub(val) { S.subTab = val; S.editingId = null; render(); }
  function setCS(val) { S.contentStatus = val; render(); }
  function setAS(val) { S.assignStatus = val; render(); }
  function setSort(val) { S.sortBy = val; render(); }

  // v1.0.47: open a row's drawer. Pre-load any armed selection so re-opening
  // shows what the operator already chose (persistence rule).
  function startEdit(id) {
    var item = ALL_ITEMS.find(function (i) { return i.id === id; });
    if (!item) return;
    if (assetTypeFor(item.collection) === '') return;  // Article/Event/RE only
    S.editingId = id;
    var armed = S.armed[id];
    var defType = blockTypesForCollection(item.collection)[0] || '';
    S.edit = armed
      ? { pubplan: armed.pubplan, blockType: armed.blockType }
      : { pubplan: '', blockType: (item.collection === 'articles' ? '' : defType) };
    render();
  }

  // v1.0.47: close the drawer WITHOUT discarding an armed selection.
  function cancelEdit() {
    S.editingId = null;
    S.edit = {};
    render();
  }

  // v1.0.47: commit the open drawer's selection into the batch (armed) set,
  // then close the drawer. Nothing is written until batch Save.
  function commitEdit() {
    var id = S.editingId;
    if (!id) return;
    if (!S.edit.pubplan || !S.edit.blockType) return;
    S.armed[id] = { pubplan: S.edit.pubplan, blockType: S.edit.blockType };
    S.editingId = null;
    S.edit = {};
    render();
  }

  // v1.0.47: remove one row from the batch (its inline "cancel").
  function disarm(id) {
    delete S.armed[id];
    render();
  }

  // v1.0.47: clear the entire batch (tray "Cancel all").
  function cancelAll() {
    S.armed = {};
    S.editingId = null;
    S.edit = {};
    render();
  }

  // v1.0.47: BATCH SAVE — loop armed rows, POST each PubPlan-level NL-BLOCKS
  // row to scenario 124 (makeBlockWriter). publication-plan set, newsletter
  // empty, stage=planning. Optimistic status flip on success; reload after all.
  function saveBatch() {
    var ids = Object.keys(S.armed);
    if (!ids.length || S.saving) return;
    var url = (window.TA_CONFIG && window.TA_CONFIG.makeBlockWriter) || '';
    if (!url) { console.error('[ASSET-LIBRARY] TA_CONFIG.makeBlockWriter missing'); return; }

    S.saving = true;
    render();
    studioToast('Saving ' + ids.length + ' assignment' + (ids.length > 1 ? 's' : '') + '\u2026');

    var done = 0, failed = 0;
    ids.forEach(function (id) {
      var item = ALL_ITEMS.find(function (i) { return i.id === id; });
      var sel = S.armed[id];
      if (!item || !sel) { done++; return; }

      var params = new URLSearchParams();
      params.set('op', 'save');                       // 124 router branch
      params.set('pubplanId', sel.pubplan);           // → publication-plan ref
      params.set('newsletterId', '');                 // empty at PubPlan level
      params.set('assetType', assetTypeFor(item.collection));
      params.set('assetId', item.id);
      params.set('blockType', sel.blockType);
      params.set('blockTypeHash', blockTypeHash(sel.blockType));
      params.set('titleAdminId', CFG.taItemId || TA_ITEM_ID || '');
      params.set('stage', 'planning');
      params.set('source', 'asset-library');

      var finish = function (ok) {
        if (ok) {
          // optimistic flip — mark assigned locally so status reflects reality now
          item.pubplanId = sel.pubplan;
          var pp = PUBPLANS.find(function (p) { return p.id === sel.pubplan; });
          if (pp) item.pubplanName = pp.label;
          delete S.armed[id];
        } else { failed++; }
        done++;
        if (done === ids.length) {
          S.saving = false;
          if (failed) {
            studioToast(failed + ' failed \u2014 see console', true);
            render();
          } else {
            studioToast('Assigned to PubPlan \u2713');
            // CMS is source of truth — reload so the durable status read (Piece 2) lands
            window.location.hash = 'content-library';
            window.location.reload();
          }
        }
      };

      fetch(url + '?' + params.toString())
        .then(function (r) { finish(r.ok); })
        .catch(function () {
          fetch(url + '?' + params.toString(), { mode: 'no-cors' })
            .then(function () { finish(true); })
            .catch(function (e) { console.error('[ASSET-LIBRARY] POST failed', item.name, e); finish(false); });
        });
    });
  }

  // v1.0.47: minimal toast (reuses studio-toast if present on the page).
  function studioToast(msg, isErr) {
    try {
      if (window.studioToast) { window.studioToast(msg, isErr); return; }
    } catch (e) {}
    console.log('[ASSET-LIBRARY]', msg);
  }

  // ── LEGACY single-row slot save (v1.0.5–1.0.26) — RETIRED in v1.0.47.
  //    Kept dormant only for reference; not wired to any handler. ──
  function _legacy_saveEdit() {
    var item = ALL_ITEMS.find(function (i) { return i.id === S.editingId; });
    if (!item) return;

    var ppChanged = S.edit.pubplan !== (item.pubplanId || '');
    var slotChanged = S.edit.slot !== (item.slot || '');

    if (!ppChanged && !slotChanged) { cancelEdit(); return; }

    // Look up webhook URL by section code from TA_CONFIG.pubplanWebhooks
    var mnlsForWebhook = findMnlsForItem(item);
    var sectionCode = mnlsForWebhook ? mnlsForWebhook.abbr.toLowerCase() : '';
    var webhooks = (window.TA_CONFIG && window.TA_CONFIG.pubplanWebhooks) || {};
    var webhookUrl = webhooks[sectionCode] || '';
    if (!webhookUrl) {
      console.error('[CONTENT-LIBRARY] No webhook for section "' + sectionCode + '" in TA_CONFIG.pubplanWebhooks');
      return;
    }

    // Read slot wrapper data for the selected slot
    var slotData = null;
    if (S.edit.pubplan && S.edit.slot) {
      var mnls = findMnlsForItem(item);
      var sc = mnls ? mnls.abbr.toLowerCase() : '';
      var contentSlots = sc ? readContentSlots(sc, S.edit.pubplan) : [];
      slotData = contentSlots.find(function (s) { return s.code === S.edit.slot; });
    }

    // Build payload — same hidden-* field names as PubPlan tile UI
    var slotLabel = (S.edit.slot || '').toUpperCase();
    var sectionCodeVal = slotData ? slotData.code.split('-')[0].toUpperCase() : sectionCode.toUpperCase();
    var params = new URLSearchParams();
    params.set('hidden-pubplan-id', S.edit.pubplan || '');
    params.set('hidden-slot-label', slotLabel);
    params.set('hidden-titleadmin-id', (slotData && slotData.titleadminId) || CFG.taItemId || '');
    params.set('hidden-section-code', sectionCodeVal);
    params.set('hidden-article-id', item.id || '');
    params.set('hidden-article-name', item.name || '');
    params.set('hidden-product-id', item.categoryId || '');
    params.set('hidden-category-id', item.categoryId || (slotData && slotData.catId) || '');
    params.set('hidden-category-name', (item.productName || (slotData && slotData.catLabel) || ''));
    var mnlsSection = findMnlsForItem(item);
    params.set('hidden-category-group', item.mnlsName || (mnlsSection ? mnlsSection.label : '') || '');
    params.set('hidden-customer-id', item.customerId || '');
    params.set('hidden-customer-name', item.customerName || '');
    params.set('hidden-source', 'content-library');

    console.log('[CONTENT-LIBRARY] Submitting:', Object.fromEntries(params));

    // Show saving state
    S.edit.saving = true;
    render();

    // Fire webhook
    fetch(webhookUrl + '?' + params.toString())
      .then(function (resp) {
        if (resp.ok) {
          console.log('[CONTENT-LIBRARY] \u2705 Assigned', item.name, '\u2192', slotLabel);
          // Reload page — CMS is the source of truth, not local state
          window.location.hash = 'content-library';
          window.location.reload();
        } else {
          console.error('[CONTENT-LIBRARY] \u274C Webhook failed:', resp.status, resp.statusText);
          S.edit.saving = false;
          S.edit.error = 'Failed (' + resp.status + ')';
          render();
        }
      })
      .catch(function (err) {
        // CORS error or network failure — fall back to no-cors retry
        console.warn('[CONTENT-LIBRARY] CORS blocked, retrying no-cors:', err.message);
        fetch(webhookUrl + '?' + params.toString(), { mode: 'no-cors' })
          .then(function () {
            console.log('[CONTENT-LIBRARY] \u2705 Sent (no-cors) for', item.name, '\u2192', slotLabel);
            // Reload page — CMS is the source of truth
            window.location.hash = 'content-library';
            window.location.reload();
          })
          .catch(function (err2) {
            console.error('[CONTENT-LIBRARY] \u274C Webhook error:', err2);
            S.edit.saving = false;
            S.edit.error = 'Network error';
            render();
          });
      });
  }

  function setEditField(key, val) {
    S.edit[key] = val;
    render();
  }

  function openView(id) {
    // v1.0.32 — open the Asset Workbench (detail/in-situ surface) instead
    // of the old inline detail modal. Maps the item's collection to the
    // Workbench assetType. Falls back to the legacy modal if the Workbench
    // script isn't loaded.
    var item = ALL_ITEMS.find(function (i) { return i.id === id; });
    var coll = item ? item.collection : 'articles';
    var typeMap = {
      articles:    'article',
      ads:         'ad',
      events:      'event',
      'real-estate':'realestate',
      realestate:  'realestate'
    };
    var assetType = typeMap[coll] || 'article';
    if (window.InbxAssetWorkbench && typeof window.InbxAssetWorkbench.open === 'function') {
      window.InbxAssetWorkbench.open({ assetType: assetType, assetId: id });
      return;
    }
    // Fallback: legacy inline detail modal
    S.viewingId = id;
    render();
  }

  function closeView() {
    S.viewingId = null;
    render();
  }

  // Expose to onclick handlers
  window._clSetMain = setMain;
  window._clSetSub = setSub;
  window._clSetQ = setQ;   // v1.0.33
  window._clSetCS = setCS;
  window._clSetAS = setAS;
  window._clSetSort = setSort;
  function setCustomer(v){ S.customerFilter=v; render(); }
  function setNewsletter(v){ S.newsletterFilter=v; render(); }
  function setPubplan(v){ S.pubplanFilter=v; render(); }
  function setProduct(v){ S.productFilter=v; render(); }
  window._clSetCustomer=setCustomer;
  window._clSetNewsletter=setNewsletter;
  window._clSetPubplan=setPubplan;
  window._clSetProduct=setProduct;
  window._clStartEdit = startEdit;
  window._clCancelEdit = cancelEdit;
  window._clCommitEdit = commitEdit;     // v1.0.47: add open drawer to batch
  window._clDisarm = disarm;             // v1.0.47: remove one row from batch
  window._clCancelAll = cancelAll;       // v1.0.47: tray Cancel all
  window._clSaveBatch = saveBatch;       // v1.0.47: tray Save
  window._clToggleFilters = function () { S.showFilters = !S.showFilters; render(); };  // v1.0.47 #1/#2
  window._clSetEd = setEditField;
  window._clOpenView = openView;
  window._clCloseView = closeView;

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  function render() {
    // v1.0.42: shared pill emitter — uses the ix-btn--pill primitive so the
    // active state matches the rest of the platform (no bespoke styling).
    function pill(active, onclick, label, count) {
      var c = (count != null) ? ('<span class="cl-pc">' + count + '</span>') : '';
      return '<button class="ix-btn ix-btn--pill" data-active="' + (active ? 'true' : 'false') +
             '" onclick="' + onclick + '">' + label + c + '</button>';
    }
    var items = getFiltered();
    var allMnls = mnlsForTab(S.mainTab);
    var artCt = itemsForTab('articles').length;
    var adCt = itemsForTab('ads').length;
    var evCt = itemsForTab('events').length;       // v1.0.33
    var reCt = itemsForTab('realestate').length;   // v1.0.33
    var titleName = CFG.titleName || 'Asset Library';

    var h = '';

    // ── Header (shared .cm-hdr from ta-page-head) ──
    h += '<div class="cm-hdr"><div class="cm-hdr-left">';
    h += '<div class="cm-hdr-icon">\uD83D\uDCDA</div>';
    h += '<div><h3>Asset Library</h3></div>';
    h += '</div><button class="cl-btn" onclick="window.location.hash=\'content-library\';window.location.reload()" style="font-size:10px;padding:5px 12px">\u21BB Refresh</button></div>';

    // ── Tab row: main tabs + inline search (v1.0.34) ──
    h += '<div class="cl-tabrow">';
    // v1.0.41: Studio subtab design — ix-btn ix-btn--tab on a std-subtabs strip
    h += '<div class="cl-mtabs std-subtabs">';
    function mtab(key, label) {
      var on = S.mainTab === key;
      return '<button class="ix-btn ix-btn--tab cl-mtab" data-active="' + (on ? 'true' : 'false') + '" onclick="_clSetMain(\'' + key + '\')">' +
             esc(label) + '</button>';
    }
    h += mtab('articles', 'Articles');
    h += mtab('ads', 'Ads');
    h += mtab('events', 'Events');
    h += mtab('realestate', 'Real Estate');
    h += '</div>';
    // inline search (no longer its own row)
    var searchLabel = S.mainTab === 'realestate' ? 'real estate' : S.mainTab;
    h += '<div class="cl-searchrail">';
    // v1.0.47 (#1): filter toggle — labeled pill button, funnel glyph, left of search
    h += '<button class="ix-btn cl-filter-toggle" data-active="' + (S.showFilters ? 'true' : 'false') +
         '" title="Show filters" aria-label="Toggle filters" onclick="_clToggleFilters()">' +
         '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>' +
         '<span class="cl-filter-label">Filters</span></button>';
    h += '<div class="cl-searchbox">';
    h += '<input id="cl-search" class="cl-search-input" type="text" placeholder="Search ' + esc(searchLabel) + ' by name or customer\u2026" value="' + esc(S.q || '') + '" oninput="_clSetQ(this.value)">';
    h += '</div></div>';
    h += '</div>'; // /cl-tabrow

    // ── Filter strip — v1.0.47 (#2): hidden by default, revealed by the filter icon ──
    if (S.showFilters) {
    h += '<div class="cl-fstrip">';

    // v1.0.46: reusable dropdown emitter. opts = [{value,label,group?}]
    function dd(label, handler, current, opts) {
      var html = '<div class="cl-fgroup"><span class="cl-flabel">' + esc(label) + '</span>';
      html += '<select class="cl-dd" onchange="' + handler + '(this.value)">';
      if (!opts.length) {
        html += '<option value="all">(none)</option>';
      } else {
        html += '<option value="all"' + (current==='all'?' selected':'') + '>All</option>';
        var lastGroup = null;
        opts.forEach(function (o) {
          if (o.group && o.group !== lastGroup) {
            if (lastGroup !== null) html += '</optgroup>';
            html += '<optgroup label="' + esc(o.group) + '">';
            lastGroup = o.group;
          }
          html += '<option value="' + esc(o.value) + '"' + (current===o.value?' selected':'') + '>' + esc(o.label) + '</option>';
        });
        if (lastGroup !== null) html += '</optgroup>';
      }
      html += '</select></div>';
      return html;
    }

    var tabItems = itemsForTab(S.mainTab);

    // 1. Newsletter Section
    var sectionOpts = allMnls.map(function (m) { return { value: m.id, label: m.label || m.abbr }; });
    h += dd('Newsletter Section', '_clSetSub', S.subTab, sectionOpts);

    // 2. Product (grouped by section)
    var relProds = PRODUCTS.filter(function (p) { return allMnls.some(function (m) { return m.id === p.mnlsId; }); });
    var prodOpts = relProds.map(function (p) {
      var sec = allMnls.find(function (m) { return m.id === p.mnlsId; });
      return { value: p.id, label: p.name, group: sec ? (sec.label || sec.abbr) : null };
    });
    h += dd('Product', '_clSetProduct', S.productFilter, prodOpts);

    // 3. Customer
    var custOpts = (CUSTOMERS || []).map(function (c) { return { value: c.id, label: c.name }; })
                    .sort(function (a,b){ return (a.label||'').localeCompare(b.label||''); });
    h += dd('Customer', '_clSetCustomer', S.customerFilter, custOpts);

    // 4. Newsletter (ref may be unpopulated → derives from loaded items)
    var nlMap = {};
    ALL_ITEMS.forEach(function (i) { if (i.newsletterId) nlMap[i.newsletterId] = i.newsletterName || i.newsletterId; });
    var nlOpts = Object.keys(nlMap).map(function (k) { return { value: k, label: nlMap[k] }; });
    h += dd('Newsletter', '_clSetNewsletter', S.newsletterFilter, nlOpts);

    // 5. Pub Plan
    var ppOpts = (PUBPLANS || []).map(function (p) { return { value: p.id, label: p.name || p.id }; });
    h += dd('Pub Plan', '_clSetPubplan', S.pubplanFilter, ppOpts);

    // 6. Status
    h += dd('Status', '_clSetCS', S.contentStatus, [
      { value:'draft', label:'Draft' }, { value:'live', label:'Live' }
    ]);

    // 7. Assignment
    h += dd('Assignment', '_clSetAS', S.assignStatus, [
      { value:'assigned', label:'Assigned' }, { value:'available', label:'Available' }
    ]);

    h += '<span class="cl-fspacer"></span>';

    // 8. Sort
    h += '<div class="cl-fgroup"><span class="cl-flabel">Sort</span>';
    h += '<select class="cl-dd" onchange="_clSetSort(this.value)">';
    h += '<option value="date"' + (S.sortBy === 'date' ? ' selected' : '') + '>Newest first</option>';
    h += '<option value="name"' + (S.sortBy === 'name' ? ' selected' : '') + '>Title A\u2013Z</option>';
    h += '<option value="customer"' + (S.sortBy === 'customer' ? ' selected' : '') + '>Customer A\u2013Z</option>';
    h += '</select></div>';

    h += '</div>'; // /cl-fstrip
    } // /S.showFilters

    // ── Column headers ──
    h += '<div class="cl-thead">';
    h += '<div class="cl-th" style="padding-left:28px">Title</div>';
    h += '<div class="cl-th">Customer</div>';
    h += '<div class="cl-th">PubPlan</div>';
    h += '<div class="cl-th"></div>';
    h += '</div>';

    // ── Item list ──
    if (!items.length) {
      h += '<div class="cl-empty">No items match these filters</div>';
    } else {
      h += '<div class="cl-list">';
      items.forEach(function (item) {
        var mnls = findMnlsForItem(item);
        var isEd = S.editingId === item.id;
        // v1.0.47: assigned = referenced by a PubPlan-level OR newsletter-level
        // NL-BLOCKS row. (Durable NL-BLOCKS read = Piece 2; optimistic flip sets pubplanId.)
        var isAssigned = !!(item.newsletterId || item.pubplanId);
        var dotClass = item.status === 'live' ? 'cl-dot-live' : 'cl-dot-draft';

        h += '<div class="cl-card ' + (isEd ? 'editing' : '') + '">';
        // Card click: only opens assignment for available articles, never for assigned
        var cardClick = '';
        if (!isEd && item.collection === 'articles' && !isAssigned) {
          cardClick = '_clStartEdit(\'' + item.id + '\')';
        }
        h += '<div class="cl-card-main" onclick="' + cardClick + '" style="' + (cardClick ? 'cursor:pointer' : 'cursor:default') + '">';

        // Col 1: Dot + Title
        h += '<div class="cl-title-cell"><span class="cl-dot ' + dotClass + '"></span><span class="cl-title">' + esc(item.name) + '</span></div>';

        // Col 2: Customer
        h += '<div class="cl-cell">';
        if (item.customerName) {
          h += '<span class="cl-cust cl-cust-name">' + esc(item.customerName) + '</span>';
        } else {
          h += '<span class="cl-cust cl-cust-none">-</span>';
        }
        h += '</div>';

        // Col 3: Assignment
        h += '<div class="cl-cell cl-assign">';
        if (isAssigned && item.newsletterName) {
          h += '<div class="cl-assign-issue">' + esc(item.newsletterName);
          if (item.newsletterDate) h += ' &nbsp;|&nbsp; ' + esc(item.newsletterDate);
          if (item.slot) h += ' &nbsp;|&nbsp; <span class="cl-assign-slot">' + esc(item.slot) + '</span>';
          h += '</div>';
          var mnlsLabel = item.mnlsName || (mnls ? mnls.label : '');
          if (mnlsLabel) h += '<div class="cl-assign-mnls">' + esc(mnlsLabel) + '</div>';
        } else if (item.pubplanName) {
          h += '<div class="cl-assign-issue">' + esc(item.pubplanName);
          var assignPp = PUBPLANS.find(function (p) { return p.id === item.pubplanId; });
          if (assignPp && assignPp.date) h += ' &nbsp;|&nbsp; ' + esc(assignPp.date);
          h += '</div>';
          var mnlsLabel2 = item.mnlsName || (mnls ? mnls.label : '');
          if (mnlsLabel2) h += '<div class="cl-assign-mnls">' + esc(mnlsLabel2) + '</div>';
        } else if (S.armed[item.id]) {
          // v1.0.47: armed-but-unsaved — show the pending PubPlan in gold
          var apn = PUBPLANS.find(function (p) { return p.id === S.armed[item.id].pubplan; });
          h += '<div class="cl-assign-issue" style="color:#c4a35a">' + esc(apn ? apn.label : 'PubPlan') +
               ' &nbsp;|&nbsp; ' + esc(S.armed[item.id].blockType) + ' <span class="cl-assign-mnls" style="color:#c4a35a">(unsaved)</span></div>';
        } else {
          h += '<span class="cl-assign-avail">available</span>';
        }
        h += '</div>';

        // Col 4: Action buttons — View always right-aligned, Assign before it.
        // v1.0.47 (#5): Assign for Article/Event/RE (NOT Ads — those go via PubPlan grid).
        h += '<div class="cl-cell" style="display:flex;gap:4px;justify-content:flex-end;padding-right:12px">';
        var canAssign = assetTypeFor(item.collection) !== '' && !isAssigned;
        if (canAssign) {
          var armedHere = !!S.armed[item.id];
          h += '<button class="ix-btn ix-btn--sm' + (armedHere ? ' is-armed' : '') + '" onclick="event.stopPropagation();_clStartEdit(\'' + item.id + '\')">' +
               (armedHere ? 'Edit' : 'Assign') + '</button>';
        }
        h += '<button class="ix-btn ix-btn--sm" onclick="event.stopPropagation();_clOpenView(\'' + item.id + '\')">View</button>';
        h += '</div>';

        h += '</div>'; // end cl-card-main

        // ── v1.0.47: PubPlan assignment drawer — PubPlan (Issue) + Block-Type.
        //    SLOT deleted (planning-stage has no slot). Article/Event/RE only. ──
        if (isEd) {
          var es = S.edit;
          var btOptions = blockTypesForCollection(item.collection);
          var btLocked = btOptions.length <= 1;   // Event/RE single → locked
          var ppCh = !!es.pubplan;                 // selection-present = distinctive border
          var btCh = !!es.blockType;
          var canAdd = es.pubplan && es.blockType;

          h += '<div class="cl-expand">';
          h += '<div class="cl-expand-hdr"><span class="cl-expand-title">PubPlan Assignment</span>' +
               '<button class="ix-revert" onclick="_clCancelEdit()">\u2715 cancel</button></div>';

          h += '<div class="cl-form-row">';

          // PubPlan dropdown — IN-PROGRESS only (future dates are IP by default)
          h += '<div class="cl-ff"><label class="cl-fl">PubPlan (Issue)</label>';
          h += '<select class="ix-picker-input' + (ppCh ? ' ix-picker-input--changed' : '') + '" onchange="_clSetEd(\'pubplan\',this.value)">';
          h += '<option value="">Select issue\u2026</option>';
          PUBPLANS.forEach(function (pp) {
            var isInProgress = !pp.planningStatus || pp.planningStatus === 'cbad0e93deea996b0769d71d808d59c5';
            var isFutureDate = pp.date && new Date(pp.date) >= new Date();
            if (!isInProgress && !isFutureDate) return;   // IP only
            h += '<option value="' + esc(pp.id) + '"' + (es.pubplan === pp.id ? ' selected' : '') + '>' + esc(pp.label) + '</option>';
          });
          h += '</select></div>';

          // Block-Type dropdown — Article FA/TS/BL; Event EV / RE RE locked
          h += '<div class="cl-ff"><label class="cl-fl">Block Type</label>';
          h += '<select class="ix-picker-input' + (btCh ? ' ix-picker-input--changed' : '') + '"' +
               (btLocked ? ' disabled' : '') + ' onchange="_clSetEd(\'blockType\',this.value)">';
          if (!btLocked) h += '<option value="">Select type\u2026</option>';
          btOptions.forEach(function (code) {
            h += '<option value="' + code + '"' + (es.blockType === code ? ' selected' : '') + '>' + code + '</option>';
          });
          h += '</select></div>';

          h += '</div>';

          // Commit row — adds to the batch (tray Saves). Persistence: re-open shows armed selection.
          h += '<div class="cl-submit-row">';
          h += '<button class="ix-btn ix-btn--primary ix-btn--sm"' + (canAdd ? '' : ' disabled') +
               ' onclick="_clCommitEdit()">Add to batch</button>';
          h += '</div>';
          h += '</div>';
        }

        h += '</div>';
      });
      h += '</div>';
    }

    mount.innerHTML = h;

    // v1.0.33: restore focus + caret to the search box after re-render so
    // typing isn't interrupted (oninput → setQ → render rebuilds the input).
    if (S.q) {
      var si = document.getElementById('cl-search');
      if (si) {
        si.focus();
        var L = si.value.length;
        try { si.setSelectionRange(L, L); } catch (e) {}
      }
    }

    // ── v1.0.47: Batch save tray — fixed bottom-pinned, high-z, to <body> so it
    //    escapes the T-A page's overflow/stacking chain. Appears on first armed row. ──
    var existingTray = document.getElementById('cl-batch-tray');
    if (existingTray) existingTray.remove();
    var armedIds = Object.keys(S.armed);
    if (armedIds.length) {
      var tray = document.createElement('div');
      tray.id = 'cl-batch-tray';
      tray.className = 'cl-batch-tray';
      var n = armedIds.length;
      var th = '<span class="cl-batch-count">' + n + ' row' + (n > 1 ? 's' : '') + ' armed to save</span>';
      th += '<div class="cl-batch-actions">';
      if (S.saving) {
        th += '<button class="ix-btn ix-btn--sm" disabled>Cancel all</button>';
        th += '<button class="ix-btn ix-btn--primary ix-btn--sm is-loading" disabled>Saving\u2026</button>';
      } else {
        th += '<button class="ix-btn ix-btn--sm" onclick="_clCancelAll()">Cancel all</button>';
        th += '<button class="ix-btn ix-btn--primary ix-btn--sm" onclick="_clSaveBatch()">Save</button>';
      }
      th += '</div>';
      tray.innerHTML = th;
      document.body.appendChild(tray);
    }

    // ── View Modal — rendered outside mount to escape stacking context ──
    var existingModal = document.getElementById('cl-modal-root');
    if (existingModal) existingModal.remove();

    if (S.viewingId) {
      var vItem = ALL_ITEMS.find(function (i) { return i.id === S.viewingId; });
      if (vItem) {
        var vMnls = findMnlsForItem(vItem);
        var vAssigned = vItem.collection === 'articles' ? !!vItem.newsletterId : (vItem.pubplanId && vItem.slot);
        var vDotClass = vItem.status === 'live' ? 'cl-dot-live' : 'cl-dot-draft';

        var mh = '<div id="cl-modal-root" class="cl-modal-overlay" onclick="_clCloseView()">';
        mh += '<div class="cl-modal" onclick="event.stopPropagation()">';
        mh += '<div class="cl-modal-bar"></div>';
        mh += '<div class="cl-modal-body">';

        mh += '<div class="cl-modal-hdr"><div>';
        mh += '<div class="cl-modal-title">' + esc(vItem.name) + '</div>';
        mh += '<div class="cl-modal-meta">';
        mh += '<span style="display:inline-flex;align-items:center;gap:4px"><span class="cl-dot ' + vDotClass + '"></span> ' + esc(vItem.status) + '</span>';
        if (vMnls) mh += '<span>' + esc(vMnls.abbr) + '</span>';
        if (vItem.productName) mh += '<span>' + esc(vItem.productName) + '</span>';
        mh += '</div></div>';
        mh += '<button class="cl-modal-close" onclick="_clCloseView()">×</button>';
        mh += '</div>';

        mh += '<div class="cl-modal-grid">';
        mh += '<div><div class="cl-modal-label">Customer</div><div class="cl-modal-val">' + (vItem.customerName ? esc(vItem.customerName) : '<span style="color:#c4c0b0">-</span>') + '</div></div>';
        mh += '<div><div class="cl-modal-label">Assignment</div><div style="font-family:\'DM Mono\',monospace;font-size:10px;font-weight:500">';
        if (vItem.pubplanName && vItem.slot) {
          mh += esc(vItem.pubplanName) + ' | ' + esc(vItem.slot);
        } else {
          mh += '<span style="color:#c4a35a">available</span>';
        }
        mh += '</div></div>';
        mh += '<div><div class="cl-modal-label">Section</div><div class="cl-modal-val">' + (vItem.mnlsName || (vMnls ? esc(vMnls.label) : '-')) + '</div></div>';
        mh += '<div><div class="cl-modal-label">Revenue type</div><div style="font-family:\'DM Mono\',monospace;font-size:10px">' + (vItem.productName ? esc(vItem.productName) : '-') + '</div></div>';
        mh += '</div>';

        mh += '<div class="cl-modal-section">Elements</div>';
        if (vItem.assetCount > 0) {
          mh += '<div style="font-family:\'DM Mono\',monospace;font-size:10px;color:#8a8a7a;margin-bottom:8px">' + vItem.assetCount + ' file' + (vItem.assetCount > 1 ? 's' : '') + ' attached</div>';
        } else {
          mh += '<div style="font-family:\'DM Mono\',monospace;font-size:10px;color:#a0a090;margin-bottom:8px">No elements attached</div>';
        }

        mh += '<div class="cl-modal-footer">';
        mh += '<button class="cl-modal-close" onclick="_clCloseView()">×</button>';
        mh += '<div style="display:flex;gap:8px;align-items:center">';
        if (vItem.assetCount > 0) mh += '<span style="font-family:\'DM Mono\',monospace;font-size:9px;color:#a0a090">' + vItem.assetCount + ' element' + (vItem.assetCount > 1 ? 's' : '') + '</span>';
        mh += '</div></div>';

        mh += '</div></div></div>';

        var modalDiv = document.createElement('div');
        modalDiv.innerHTML = mh;
        document.body.appendChild(modalDiv.firstChild);
      }
    }
  }

  // ══════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════

  // v1.0.44: deferred product enrichment, reusable for DOM + webhook items.
  function enrichItems(items) {
    items.forEach(function (item) {
      if (item.productId) {
        var prod = PRODUCTS.find(function (p) { return p.id === item.productId; });
        if (prod) {
          if (!item.mnlsAbbr) item.mnlsAbbr = prod.mnlsId;
          if (!item.mnlsGroup) item.mnlsGroup = prod.group;
          item.collection = prod.collection;
        }
      }
    });
  }

  // v1.0.44: lazy-load trigger — when viewing Articles and scrolled near the
  // page bottom, fetch the next page. Throttled by the active tab's paging.loading/done.
  var _scrollWired = false;
  function wireLazyScroll() {
    if (_scrollWired) return;
    _scrollWired = true;
    window.addEventListener('scroll', function () {
      var pg = paging[S.mainTab];
      if (!pg || pg.loading || pg.done) return;
      var nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 600);
      if (nearBottom) loadAssets(S.mainTab);
    }, { passive: true });
  }

  function init() {
    // Read DOM data
    MNLS_SECTIONS = readMnlsSections();
    PRODUCTS = readProducts();
    CUSTOMERS = readCustomers();
    PUBPLANS = readPubplans();

    // v1.0.45: all types load via webhook. Start empty; load the active tab.
    ALL_ITEMS = [];
    loadAssets(S.mainTab || 'articles');
    wireLazyScroll();

    console.log('[CONTENT-LIBRARY v1.0.49] Init:', {
      mnlsSections: Object.keys(MNLS_SECTIONS).length,
      products: PRODUCTS.length,
      customers: CUSTOMERS.length,
      pubplans: PUBPLANS.length,
      listWebhook: !!LIST_WEBHOOK,
      taItemId: TA_ITEM_ID,
    });

    render();

    // Hash return: if page was reloaded with #content-library, click the tab to return here
    if (window.location.hash === '#content-library') {
      setTimeout(function () {
        var tabBtn = document.querySelector('[data-w-tab="ContentLibrary"]');
        if (tabBtn) tabBtn.click();
        // Clear hash so it doesn't interfere with future navigation
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }, 300);
    }
  }

  // Wait for Memberstack auth gate (same pattern as Content Processor)
  var attempts = 0;
  var maxAttempts = 20;
  function waitForData() {
    attempts++;
    // v1.0.44: articles load via webhook, so don't gate on .articles-wrapper.
    // Gate on the supporting DOM lists (products/customers/ads) or timeout.
    var hasSupport = document.querySelectorAll('.products-wrapper[data-item="true"]').length > 0
                  || document.querySelectorAll('.ad-source[data-item="true"]').length > 0;

    if (hasSupport || attempts >= maxAttempts) {
      init();
    } else {
      setTimeout(waitForData, 250);
    }
  }

  waitForData();
});
