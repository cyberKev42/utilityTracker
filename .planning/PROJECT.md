# UtilityTracker

## What This Is

A personal utility tracking web app (React + Express + PostgreSQL) that lets users log consumption for any utility type across multiple meters, view statistics and cost breakdowns, with bilingual support (English/German).

## Core Value

Users can track any utility across multiple meters with accurate, flexible data entry — whether entering daily usage or reading meter values directly.

## Requirements

### Validated

- ✓ User authentication via Supabase (register, login, logout, session persistence) — existing
- ✓ CRUD entries for water, power, fuel with date, amount, notes — existing
- ✓ Dashboard with summary cards and recent entries — existing
- ✓ Statistics page with charts (pie, bar, line) and breakdowns — existing
- ✓ Settings page for unit prices per category — existing
- ✓ i18n support for English and German — existing
- ✓ Responsive UI with Tailwind CSS and Framer Motion animations — existing
- ✓ Year/month breakdown queries and trend calculations — existing
- ✓ Custom sections — user can create new utility sections with name, unit, and icon — v1.0
- ✓ Sections are fully editable — rename, reorder, delete, or archive (including default Water/Power/Fuel) — v1.0
- ✓ Subsections (meters) — each section supports multiple meters (e.g. Water Meter 1, Water Meter 2) — v1.0
- ✓ Per-meter and aggregated section statistics — v1.0
- ✓ Entry mode A: enter usage amount for a date or date range (split evenly across days), added to running total — v1.0
- ✓ Entry mode B: enter current meter reading, app calculates usage since last reading — v1.0
- ✓ First meter entry prompts for initial reading (usage = 0 for first entry) — v1.0
- ✓ Change default Power unit to "kWh" and Water unit to "m³" — v1.0
- ✓ All new UI text, labels, and messages translated into both English and German — v1.0

- ✓ SPA-like navigation — no loading spinners between pages, instant UI updates on settings changes — v1.1 Phase 7
- ✓ Mobile-optimized layout — no horizontal scroll or cut-off elements on any page — v1.1 Phase 8
- ✓ Comma accepted as decimal separator in entry fields — v1.1 Phase 8
- ✓ Section names translated in entry dropdown — v1.1 Phase 8
- ✓ Dashboard section click navigates to statistics with that section pre-selected — v1.1 Phase 7
- ✓ Dashboard toggle for usage vs cost display — v1.1 Phase 9
- ✓ Meter names editable inline in settings — v1.1 Phase 9
- ✓ Improved water icon options (droplet, wave, etc.) — v1.1 Phase 9

### Active

(None — define in next milestone via `/gsd:new-milestone`)

### Out of Scope

- Mobile native app — web-only for now
- Real-time multi-user collaboration — single-user tracking
- Import/export of data (CSV, etc.) — defer to future milestone
- Notifications or alerts for usage thresholds — future feature
- Archive + delete options for sections — deferred from v1.0 (SECT-05)

## Context

- App uses dynamic sections/meters system (shipped v1.0) — no more hardcoded Water/Power/Fuel
- Database has `utility_sections` (with `translation_key` column) and `utility_meters` tables with full CRUD API
- Statistics and charts render dynamically based on user-created sections
- Settings page supports section/meter management with drag-and-drop reordering and touch-friendly mobile drag
- SPA-like navigation via centralized EntriesDataContext — no page reloads
- Dashboard has sparklines, section-to-statistics linking, and cost/usage toggle
- Comma decimal input supported across all numeric fields
- 38 icons available in icon picker (30 HiOutline + 8 water-themed from fa6/lu)
- Deployed on Railway with Nixpacks
- Shipped v1.0 (2026-03-20) and v1.1 (2026-03-21)

## Constraints

- **Tech stack**: Must stay within React + Express + PostgreSQL + Supabase — no framework changes
- **i18n**: Every user-facing string must exist in both EN and DE translation files
- **Backwards compatibility**: Existing entry data must be migrated to the new schema without loss

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sections are fully editable including defaults | User wants flexibility to rename/reorder/delete Water/Power/Fuel | Shipped v1.0 — all sections treated equally |
| Both per-meter and section-level stats | User wants granular visibility into each meter plus rolled-up totals | Shipped v1.0 — meter tabs + section aggregation |
| Date range entries split evenly across days | Most intuitive for billing periods where daily usage is unknown | Shipped v1.0 — split preview in entry form |
| First meter reading has usage = 0 | Establishes baseline without assuming prior consumption | Shipped v1.0 — clean baseline, no negative deltas |
| Archive + delete options for sections | Preserve historical data when hiding, permanent removal when desired | Deferred to v2 (SECT-05) |
| Centralized EntriesDataContext | Fetch stats/entries/trend once, share across pages | ✓ v1.1 — eliminates per-page spinners |
| type=text + inputMode=decimal for numbers | Browsers block comma in type=number inputs | ✓ v1.1 — comma entry works everywhere |
| TouchSensor with 250ms delay for mobile drag | Prevents scroll-vs-drag conflict on touch devices | ✓ v1.1 — reliable on 390px viewport |
| Default toggle mode is 'usage' | Users tracking consumption want usage view first | ✓ v1.1 — localStorage persistence |

---
## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-21 after v1.1 milestone*
