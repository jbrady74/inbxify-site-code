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

# ENHANCEMENTS BACKLOG — DOCX Article Body Processing

## E-TXC-001 — Migrate DOCX → Claude processing to server-side Make scenario

**Status:** BACKLOG
**Priority:** LOW (revisit when pain emerges)
**Added:** April 19, 2026

### Context

The Transcriber's DOCX → HTML → Claude → structured subcomponents flow was
built browser-side in v1.x to match the existing screenshot-Transcriber
pattern. Browser calls Mammoth Worker, then anthropicProxy, then populates
the review panel. Save goes through Scenario E as with screenshots.

This works fine at WLN scale but has known limitations at higher volume
and multi-publisher scale.

### Migrate when any of these becomes true

- **Any publisher is processing 20+ DOCX articles per month.** At that
  volume, browser-side starts feeling slow enough that users want to walk
  away mid-process.
- **Batch processing requested.** "Process these 10 DOCX files in one
  click" is not feasible browser-side without tab-pinning workarounds.
  Server-side handles it natively.
- **User reports a lost conversion.** Browser-side loses state if the tab
  closes mid-Claude-call. If this bites anyone once, migrate.
- **Multi-tenant URL exposure becomes a concern.** Publisher #5's browser
  sees the anthropicProxy URL and Mammoth Worker URL. Not a security
  issue today, but a consolidation/governance concern later.
- **Publisher count exceeds 5.** The cognitive load of different browser
  behavior across different publishers' machines (slow wifi, old Chrome,
  etc.) tips server-side.

### What the migration looks like

Build a new Scenario (tentatively F3 or extend Scenario E) that:

1. **Trigger:** webhook POST from UI with `{fileId, titleSlug, action: 'processArticleBodyDocx'}`
2. **Module 1:** Data Store lookup by titleSlug
3. **Module 2:** Google Drive download by fileId
4. **Module 3:** HTTP POST to Mammoth Worker → get HTML
5. **Module 4:** HTTP POST to anthropicProxy with adapted prompt → get structured XML
6. **Module 5:** Parse XML into structured fields
7. **Module 6:** Webhook Response with full structured fields (title, subtitle, teaser, summary, body, etc.)
8. UI receives response, populates review panel (same UI as today — only the
   processing backend changes)

The review/save flow does NOT change. User still reviews output in the
Transcriber review panel, still saves via Scenario E to create a Draft
Article. Only the "how does the processed output get to the UI" step moves.

### What's preserved in the migration

- Transcriber review panel (no UI change)
- Scenario E save flow (no change)
- Claude prompt (same prompt, same XML output format)
- User experience of "review before save"

### What changes

- Browser no longer calls Mammoth Worker or anthropicProxy directly
- Browser calls a single Make webhook, receives structured fields
- UI loading state changes from "Mammoth → Claude" to "Processing…"
- Loses ability to show Mammoth-specific vs Claude-specific progress

### Migration cost estimate

- New Make scenario: 2-3 hours
- UI refactor (replace two fetch calls with one): 1 hour
- Testing: 1 hour
- **Total: ~4-5 hours of focused work**

### Related tech debt

- TD-XXX: anthropicProxy URL exposed in browser via window.TA_CONFIG.
  Acceptable today (Transcriber already exposes it). Not acceptable when
  migration complete — proxy URL should live in Make scenario config only.

### Do NOT migrate if

- Volume remains under 20 DOCX/month per publisher
- No complaints about browser-side UX
- No multi-batch use cases emerging

Premature migration to server-side trades today's simplicity for tomorrow's
scalability. At current scale, simplicity wins.

## Notes
- H = core workflow blocker
- M = needed before scale / second publisher
- L = nice to have
