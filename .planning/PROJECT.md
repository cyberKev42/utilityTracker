# UtilityTracker v2

## What This Is

A personal utility tracking web app (React + Express + PostgreSQL) that lets users log water, power, and fuel consumption, view statistics and cost breakdowns, with bilingual support (English/German). This milestone adds custom sections, sub-meters, flexible entry modes, and corrected units.

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

### Active

- [ ] Custom sections — user can create new utility sections with name, unit, and icon
- [ ] Sections are fully editable — rename, reorder, delete, or archive (including default Water/Power/Fuel)
- [ ] Subsections (meters) — each section supports multiple meters (e.g. Water Meter 1, Water Meter 2)
- [ ] Per-meter and aggregated section statistics
- [ ] Entry mode A: enter usage amount for a date or date range (split evenly across days), added to running total
- [ ] Entry mode B: enter current meter reading, app calculates usage since last reading
- [ ] First meter entry prompts for initial reading (usage = 0 for first entry)
- [ ] Change default Power unit to "kWh" and Water unit to "m³"
- [ ] All new UI text, labels, and messages translated into both English and German

### Out of Scope

- Mobile native app — web-only for now
- Real-time multi-user collaboration — single-user tracking
- Import/export of data (CSV, etc.) — defer to future milestone
- Notifications or alerts for usage thresholds — future feature

## Context

- Existing app has hardcoded Water/Power/Fuel categories in both frontend and backend
- Database schema will need new tables for sections, subsections (meters), and updated entries schema
- Statistics and charts currently assume 3 fixed categories — must become dynamic
- Settings page manages unit prices per category — needs to support dynamic sections
- Deployed on Railway with Nixpacks

## Constraints

- **Tech stack**: Must stay within React + Express + PostgreSQL + Supabase — no framework changes
- **i18n**: Every user-facing string must exist in both EN and DE translation files
- **Backwards compatibility**: Existing entry data must be migrated to the new schema without loss

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sections are fully editable including defaults | User wants flexibility to rename/reorder/delete Water/Power/Fuel | — Pending |
| Both per-meter and section-level stats | User wants granular visibility into each meter plus rolled-up totals | — Pending |
| Date range entries split evenly across days | Most intuitive for billing periods where daily usage is unknown | — Pending |
| First meter reading has usage = 0 | Establishes baseline without assuming prior consumption | — Pending |
| Archive + delete options for sections | Preserve historical data when hiding, permanent removal when desired | — Pending |

---
*Last updated: 2026-03-18 after initialization*
