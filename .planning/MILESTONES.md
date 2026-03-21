# Milestones

## v1.1 Polish & UX (Shipped: 2026-03-21)

**Phases completed:** 3 phases, 8 plans, 14 tasks

**Key accomplishments:**

- Centralized React context fetching stats/entries/trend once on mount, eliminating per-page spinners on Dashboard and Statistics with skeleton card loading on first visit
- One-liner:
- Clickable 48x24px Recharts sparklines on Dashboard section cards showing 7-week usage trends, linking to /statistics/:sectionId
- vitest scaffold, DB migration adding translation_key to utility_sections, normalizeDecimal and getSectionDisplayName utilities, plus EN/DE sectionNames i18n keys
- Comma decimal input wired into all AddEntry numeric fields and getSectionDisplayName applied to every section display point across Dashboard, Statistics, Entries, and AddEntry
- Responsive grids on Statistics/AddEntry (1→2→3 cols) and TouchSensor long-press drag on Settings via dnd-kit, fulfilling MOBI-01 at 390px viewport
- One-liner:
- Pencil inline-edit affordance on meter row hover (HiOutlinePencilSquare) plus 8 water-themed icons (fa6 + lu) in the icon picker grid

---

## v1.0 — MVP

**Shipped:** 2026-03-20
**Duration:** 3 days (2026-03-18 to 2026-03-20)
**Phases:** 6 | **Plans:** 14 | **Requirements:** 17/17

### Key Accomplishments

- Replaced hardcoded Water/Power/Fuel categories with fully dynamic user-managed sections
- Added sub-meter support with per-meter and section-level statistics
- Implemented dual entry modes: usage amount (with date range splitting) and meter reading (with delta calculation)
- Rebuilt statistics page with dynamic charts, granularity toggles, and correct unit display
- Full i18n coverage for all new UI in English and German
- Schema migration with zero data loss and rollback support

### Archive

- [Roadmap](milestones/v1.0-ROADMAP.md)
- [Requirements](milestones/v1.0-REQUIREMENTS.md)
- [Phase Plans](milestones/v1.0-phases/)
