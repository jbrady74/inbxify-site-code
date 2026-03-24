# INBXIFY Content Inbox — Enhancements Backlog
Last updated: March 23, 2026

## Format
Each item: ID · Title · Description · Priority (H/M/L)

---

## Content Inbox / Content Manager

### E-001 — Trash/Skip files from Inbox UI
Ability to remove a file from the inbox without assigning it. Marks row in Sheet as SKIPPED. File moves to a Skipped folder or is trashed from Drive.
**Priority:** M

### E-002 — Scenario D — Sort & Copy (multi-title publishers)
For publishers with multiple titles, Scenario A currently auto-sorts to a single title. Need a Sort & Copy scenario that routes files to the correct title's Pre-processing folder based on filename prefix or subfolder naming convention.
**Priority:** M — required before second multi-title publisher onboards

### E-003 — Publisher Inbox Sorting UI
UI for multi-title publishers to manually sort files into the correct title when auto-sort can't determine it.
**Priority:** M — companion to E-002

### E-004 — PDF Decision UI
Subtab on Content Manager showing PDFs with AWAITING_DECISION status. Per-file dropdown: "Convert to JPEG" (→ Scenario D) or "Transcribe as Article Body" (→ Scenario E). On decision, re-triggers the appropriate scenario with chosen action.
**Priority:** H — PDFs are stuck in Pre-processing until this is built

### E-005 — Article Body RTE view in Content Manager
Rich text preview of article body in the assignment panel before committing the assignment.
**Priority:** L

### E-006 — Auto-refresh Inbox UI polling
Content Manager auto-polls Scenario C every 60 seconds while the tab is active, so newly conditioned files appear without manual refresh.
**Priority:** L

### E-007 — Nested folder flattening (level 2+)
Scenario A currently flattens one level of folders. If Doug uploads a folder containing subfolders, the subfolders are not flattened. Need recursive flattening.
**Priority:** M

### E-008 — Duplicate file detection
Before logging a file to the Inbox Sheet, check if a file with the same name already exists. Flag as duplicate rather than processing twice.
**Priority:** L

### E-009 — Transcriber: Add to Existing Article mode
Currently only New Article mode is wired to Scenario E. Add to Existing mode needs Make scenario support: look up existing article by ID, update Article Body RTE field (replace or append).
**Priority:** M

### E-010 — Transcriber: Inline image insertion in body
Allow user to insert an image from the Ready for Assignment tray directly into the article body at cursor position. Requires T-A RTE Editor component (see T-A RTE Editor session).
**Priority:** M — part of T-A RTE Editor session

### E-011 — Transcriber: Pull quote / callout text formatting
Add pull quote and callout text as formatting options in the article body RTE toolbar.
**Priority:** M — part of T-A RTE Editor session

### E-012 — Transcriber: "Store Body" mode
Third assignment option alongside "New Article" and "Add to Existing". Sends only the article body HTML to Scenario E, creates an unnamed Webflow Draft Article with body populated but title/teaser/summary blank. Visible in Content Manager Drafts tab for later completion and assignment.
**Priority:** M

---

## T-A RTE Editor (separate session)

### RTE-001 — Shared rich text editor component
Build a standalone `ta-rte-v1.0.js` component that renders a full-featured RTE toolbar and manages a contenteditable div. Self-contained, no dependencies. Wire into Transcriber body field and System 2 Content Assembly.

**Full toolbar:** Bold, Italic, H2, H3, Link, UL, OL, Indent, Outdent, Pull Quote (blockquote), Inline Image (from Ready for Assignment tray or direct upload)

**Publisher-facing:** Doug and future publishers use this as their CMS editor. They never touch Webflow Designer.
**Priority:** H — required for full publisher self-service

---

## Platform / Multi-tenant

### MT-001 — Convert all WLN hardcodes to dynamic
Track in TECH-DEBT.md. All HC-* items must be resolved before second publisher goes live.
**Priority:** H

### MT-002 — Advertiser click performance dashboard
Four-phase: Make.com + Cloudflare Workers + Memberstack-gated Webflow advertiser portals. Rotating banner ad system. Nexstar + Mailchimp unified reporting.
**Priority:** M — post-launch

### MT-003 — Local Source Development (LSD) service
Bundle for first 2–3 publishers, then $350/month add-on. Separate session.
**Priority:** L

### MT-004 — Local Syndicated Advertiser Offer (LSAO)
Network ad sales across publishers, 30–40% revenue share. Activate at 3+ live titles, 48-hour publisher rejection window.
**Priority:** L — activate at scale

---

## Notes
- H = core workflow blocker
- M = needed before scale / second publisher
- L = nice to have
