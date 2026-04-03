# INBXIFY Ad System Architecture

> Living reference document for ad placement, collections, and display logic.
> Last updated: April 3, 2026

---

## 1. Ad Library

All ad creatives live in a single collection: **❇️ADS**

Each ad has a **Product Library** reference (SRF) that determines its type:
- **Banner Ad** — primary revenue source, appears in newsletters and on website
- **Sidebar Ad** — website sidebar + mobile inline placement
- **Text Ad** — text-only placement

The Product Library is per-Title, so Publisher #2 could have ad types that WLN doesn't.

Fields on ❇️ADS store creative for each type, but downstream visibility/controls are dictated by the Product Library selection.

---

## 2. Picker Architecture

Pickers assign ads to specific slots. Two picker patterns exist:

### 🅿️ Pickers — per-newsletter (tied to PubPlan)

Each has a reference to **PUBLICATION PLAN**, which chains to Title-Admin. One picker item per newsletter issue.

| Picker Collection | Slots | What it assigns |
|---|---|---|
| 🅿️ BANNER ADS | BA-1 through BA-6 | Banner ads 1–6 |
| 🅿️ 7+ BANNER ADS | BA-7 through BA-12 | Banner ads 7–12 |
| 🅿️ FEATURE ARTICLES | FA-1 through FA-4 | Feature article slots (SRF to ❇️ARTICLES) |
| 🅿️ THEMED SPOTS | TS-1 through TS-4 | Themed spotlight slots (SRF to ❇️ARTICLES) |
| 🅿️ EVENTS | EV-1 through EV-4 | Event slots |
| 🅿️ REAL ESTATE | RE-1 through RE-4 | Real estate listing slots |
| 🅿️ SIDEBAR ADS | SB-1 through SB-6 | Sidebar ad slots (per-newsletter, legacy) |

### 🔰 Pickers — time-based (not tied to individual newsletters)

One item per Title. Overwritten when the current set changes. Not tied to a specific issue.

| Picker Collection | Purpose |
|---|---|
| 🔰 NOW SIDEBARS | Current sidebar ads for the Title. One record per Title, filtered by Title on page. |
| 🔰 SPONSORSHIPS | Current section sponsorships (e.g., Pet Corner sponsored by Wyckoff Vet for 3 months). References to ❇️ADS per section. |

---

## 3. Revenue Types

Products fall into three revenue types:

| Revenue Type | How sold | Examples |
|---|---|---|
| **Sponsorable** | Time-based (e.g., 3-month section sponsorship) | Pet Corner, Sports Corner, Wellness Watch, Travel Corner, Book Corner, Recipe Corner, Real Estate section, Events section |
| **Paid Article** | Per-article (customer pays for placement) | Expert Contributor FA, Paid Regular FA/TS |
| **Paid Ad** | Per-ad creative (banner, sidebar, text) | Banner Ad, Sidebar Ad, Text Ad |

---

## 4. Where Ads Appear

### Newsletter (email)
- **12 Banner Ads** — fixed slot order in current WLN template: BA-1, FA-1, FA-2, BA-3, BA-4, etc.
- **Section sponsors** — bottom of FA, TS, Events, RE sections (from 🔰 SPONSORSHIPS)
- **Slot order is currently fixed per template** — future goal: configurable slot order per Title

### Newsletter page (online archive of same issue)
- Same ads as the email newsletter, rendered from same picker data
- Ads persist with the issue forever (archived)

### Website supporting pages
- **Article page** — sidebar ads (desktop), inline ad injection (mobile ≤999px)
- **Directory page** — sidebar ads (desktop), inline between cards (mobile ≤999px)
- **Archives page** — sidebar ads (desktop), inline between tiles (mobile ≤999px)
- Source: 🔰 NOW SIDEBARS (current set, not per-newsletter)

---

## 5. Sidebar Ad Display

### Desktop (all three page types)
- `.sidebar-25` column, right side of `.page-content` flex layout
- Ads from 🔰 NOW SIDEBARS collection list (`.sidebar-ads-wrap`)
- Up to 6 ads, 2 visible at a time, rotating every 10 seconds
- Sticky position below nav/filter bar

### Mobile (≤999px)
- Sidebar hidden
- Ads relocated into main content flow via JS
- **Article page**: 3 ad pairs injected inline in `.article-body-rte` at paragraph positions (after para 1, 4, 8) with H2 collision avoidance. Short articles (< 8 paragraphs) append remaining sections after content.
- **Directory page**: single ad (80% width, centered) after every 5th card. Cycles through inventory, repeats when exhausted. Label: "Local Partners"
- **Archives page**: TBD — likely single ad between every 2–3 tiles

### Data source for mobile injection
- **Articles**: `#sidebar-ads-data` JSON embed in page (ad image URLs + redirect URLs)
- **Directory/Archives**: hidden JSON data source (Option B approach — independent of sidebar DOM visibility)

---

## 6. Multi-Tenant Assessment

### Solid (works across publishers as-is)
- ❇️ADS library is global — any publisher's ads go in the same collection
- Pickers are filtered by PubPlan → Title-Admin chain — new title gets own pickers automatically
- 🔰 NOW SIDEBARS is one-per-title — new title gets own record
- Product Library is per-Title — Publisher #2 can have unique product types

### Rigid (would need work for different publisher formats)
- **Newsletter slot order is fixed** — BA-1, FA-1, FA-2, BA-3... is hardcoded in the Make.com template. A publisher with 3 FAs and 8 BAs can't be accommodated without a different template.
- **Slot counts are fixed** — 12 banner slots, 6 sidebar slots, 4 FA slots, 4 TS slots. Baked into collection field structure.
- **Page-level JS references specific slot numbers** — sidebar rotation assumes 6 ads, article injection assumes 3 pairs of 2.

### Future path (if publishers vary significantly)
- Store `ba-count`, `fa-count`, `ts-count` on Title-Admin — Make.com reads config and loops dynamically
- Move from fixed slot names (BA-1, BA-2) to a slot-type array on PubPlan
- JS reads ad count dynamically from a data attribute instead of hardcoding

---

## 7. Key Decisions Made

| Decision | Date | Context |
|---|---|---|
| All ad creative centralized in ❇️ADS | Dec 2025 | ISSUEBRIDGE CMS architecture session |
| 4 new ad types added (Paid Article Ad, Sponsor Ad, RE Sponsor Ad, Events Sponsor Ad) | Dec 2025 | Same session |
| 🅿️ SIDEBAR ADS expanded from 4 to 6 slots | Jan 2026 | Sidebar ads in article content chat |
| 🅿️ 7+ BANNER ADS created as separate collection | Jan 2026 | PUBPLAN modal picker system chat |
| Inversion of picker architecture rejected | Jan 2026 | ChatGPT proposed; Claude assessed as problematic in Webflow |
| Mobile sidebar ads: 3 pairs inline in article RTE | Jan 2026 | Articles page implementation |
| Mobile directory ads: single ad, 80% centered, every 5th card | Apr 2026 | This session |
| Mobile ad breakpoint: ≤999px across all pages | Apr 2026 | This session |
| Ad label: "Local Partners" (not "Advertisement") | Apr 2026 | This session |
| When ad inventory exhausted: cycle repeats | Apr 2026 | This session |
| Mobile ad data source: Option B (hidden JSON, not DOM scrape) | Apr 2026 | This session |

---

## 8. Related Documents

- **Tech Debt Tracker**: `INBXIFY-tech-debt-tracker.md` (GitHub)
- **Enhancements Backlog**: `ENHANCEMENTS-BACKLOG.md` (GitHub)
- **Content Inbox Transfer Doc**: `content-inbox-transfer-doc.docx` (project file)
- **Sponsorship Display System Technical Doc**: uploaded in Sponsorship & Paid Ad Display System chat
- **Ad & Image Specs**: `INBXIFY-Ad-Image-Specs.docx` (Google Drive, per-title)
