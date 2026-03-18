# Project Research Summary

**Project:** UtilityTracker v2 — Dynamic Sections & Meters Milestone
**Domain:** Personal utility tracker — dynamic categories, sub-metering, dual entry modes
**Researched:** 2026-03-18
**Confidence:** MEDIUM (stack versions MEDIUM; features and architecture HIGH)

## Executive Summary

UtilityTracker is a single-user personal utility tracker built on a locked React + Express + PostgreSQL + Supabase stack. This milestone replaces three hardcoded utility types (electricity, water, fuel) with a fully dynamic, user-managed system of sections (categories) and meters (sub-units within sections). This is a greenfield feature layer on top of a working app, not a rewrite — every change must preserve existing data and existing page behavior. The recommended approach is a staged, backend-first build: schema migration → backend services → SectionsContext → page-by-page UI updates.

The principal architectural decision is replacing the `type` string column with a two-level foreign key hierarchy (`section_id` → `meter_id`). A single migration must backfill all existing rows into the new structure before the old column is dropped. SectionsContext (a React context provider modeled on existing AuthContext) is the correct state management solution for this milestone — it avoids per-page re-fetching without requiring a React Query migration that would touch every existing page.

The key risks are all known in advance and documented: (1) residual hardcoded `VALID_TYPES` guards in backend controllers will silently reject entries to new sections if not removed, (2) meter-reading delta chains break on entry deletion and the resolution strategy must be chosen before implementation, and (3) Statistics.jsx and chart components will silently drop custom sections from reports until the static `TYPE_CONFIG` map is replaced with data-driven configuration. All three are prevention tasks, not discovery tasks — they must be explicitly checked at implementation time.

---

## Key Findings

### Recommended Stack

The existing stack is locked and requires no framework changes. Three new frontend dependencies are required: `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop reordering (chosen over the unmaintained `react-beautiful-dnd`), `react-hook-form` for the restructured AddEntry form, and additional Radix UI primitives (`@radix-ui/react-select`, `@radix-ui/react-tabs`) consistent with the existing Radix Dialog already in use. One backend devDependency is required: `node-pg-migrate` for tracked, reversible schema migrations — mandatory given the complexity of the schema change and the flagged lack of any existing migration history.

See `.planning/research/STACK.md` for full rationale and alternatives considered.

**Core new technologies:**
- `@dnd-kit/core` + `@dnd-kit/sortable`: section/meter drag-and-drop reordering — actively maintained, React 19 compatible, ~15KB gzipped
- `node-pg-migrate`: schema migration management — Node.js native, SQL-based, rollback support; critical given no prior migration history exists
- `react-hook-form`: AddEntry form state — avoids compounding the existing flagged fragility of the useState-based form with two more dependent fields
- `@radix-ui/react-select` + `@radix-ui/react-tabs`: section/meter dropdowns and entry mode toggle — extends existing Radix usage, consistent accessibility patterns
- `SectionsContext` (no new library): global sections/meters state — zero new dependencies, follows existing AuthContext/LanguageContext patterns

### Expected Features

See `.planning/research/FEATURES.md` for full feature tree and dependency graph.

**Must have (table stakes):**
- Custom section creation with name, unit, icon, sort order — core premise, nothing else works without this
- Rename, reorder, archive, and delete sections — full ownership of structure expected
- Multiple meters per section — real households commonly have sub-meters
- Entry mode A: direct usage amount (existing behavior, made section-aware)
- Entry mode B: cumulative meter reading input with delta calculation and first-entry baseline UX
- Section-aware entry form: section → meter → entry mode → amount/reading selection flow
- Per-section unit prices in Settings (replacing hardcoded three-type settings rows)
- Dynamic statistics: section-driven charts replacing hardcoded electricity/water/fuel breakdown
- Full EN/DE i18n for all new strings, added continuously alongside each feature

**Should have (differentiators):**
- Per-meter statistics alongside section rollup
- Last reading display on entry form (polish for meter-reading mode)
- Date range entry (billing period data)
- Section icon picker from react-icons subset

**Defer (v2+):**
- Full icon search UI — curated 20-30 icon subset is sufficient
- Meter color customization — cosmetic
- React Query migration — right long-term, too cross-cutting for this milestone
- CSV import/export, notifications, multi-currency, OCR — all explicitly out of scope per PROJECT.md

### Architecture Approach

The build extends the existing layered pattern (React pages → frontend services → API client → Express routes → controllers → backend services → PostgreSQL) by adding `utility_sections` and `utility_meters` tables, updating `utility_entries` to reference `meter_id` instead of a `type` string, and updating `utility_settings` to reference `section_id`. The frontend gains a `SectionsContext` provider that loads the full sections+meters tree once at app mount and exposes mutation functions; all pages consume this context, eliminating per-page fetching of the same data.

See `.planning/research/ARCHITECTURE.md` for full schema DDL, component boundaries, data flow diagrams, and build order.

**Major components:**
1. `utility_sections` + `utility_meters` tables — source of truth for user-defined hierarchy
2. `sectionsService.js` + `sectionsController.js` (backend, new) — CRUD and archive/reorder for sections and meters
3. `SectionsContext.jsx` (frontend, new) — global state cache for sections/meters tree; invalidates on mutation
4. Modified `entriesService.js` — entry creation with mode logic, JOIN-based stats queries
5. Modified `Statistics.jsx` + chart components — dynamic, data-driven rendering replacing static `TYPE_CONFIG`

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for full detection/prevention guidance per phase.

1. **Residual `VALID_TYPES` guards in backend controllers** — custom sections silently rejected with 400; replace with DB-backed validation or FK constraints before any section CRUD is built
2. **Meter reading delta chain breaks on entry deletion** — choose recalculate-on-read vs. cascade-recalculate vs. soft-delete-only before implementing entry mode B; do not defer this decision
3. **`TYPE_CONFIG` static map in Statistics.jsx drops custom sections from charts** — replace with data-driven config from sections API; must coincide with sections API work, not be deferred to a statistics-only phase
4. **i18n dynamic section names mistaken for translation keys** — treat section names as data strings, never pass them through `t()`; audit all `t()` calls with dynamic type/section strings before merge
5. **Settings `unit_price` keyed on type string orphans new sections** — migrate `utility_settings` to `section_id` FK in the database migration phase before building section CRUD

---

## Implications for Roadmap

Based on combined research, the build order is strictly dependency-driven. Every phase depends on the one before it. Six phases are suggested.

### Phase 1: Database Migration

**Rationale:** Every other layer — backend services, frontend context, UI — depends on the schema. No code should be written against the new data model until the migration is run and verified. This is also the phase with the highest data-integrity risk (backfilling existing entries).

**Delivers:** `utility_sections`, `utility_meters` tables; `meter_id` FK on `utility_entries`; `section_id` FK on `utility_settings`; existing Water/Power/Fuel rows backfilled; `type` column dropped.

**Addresses:** Table stakes items "Section + meter data model"; "Unit price per section"

**Avoids:** Pitfall 1 (VALID_TYPES), Pitfall 6 (settings type string), Pitfall 4 (float drift — use NUMERIC schema)

**Research flag:** Standard pattern (node-pg-migrate, FK backfill). No research-phase needed.

---

### Phase 2: Backend Services & API

**Rationale:** Frontend cannot be built until the API contract exists. Backend services are also where the meter-reading delta strategy must be implemented correctly — this decision affects schema design (whether `usage_amount` is stored or computed).

**Delivers:** `/api/sections`, `/api/sections/:id/meters` CRUD endpoints; updated `/api/entries` with mode logic; updated `/api/entries/stats` with JOIN-based dynamic grouping; `GET /api/meters/:id/last-reading`.

**Addresses:** Section/meter CRUD, entry modes A and B, server-side reading delta validation

**Avoids:** Pitfall 1 (remove VALID_TYPES here), Pitfall 2 (choose delta strategy here), Pitfall 8 (FK RESTRICT on section delete)

**Research flag:** Standard Express/pg patterns. No research-phase needed.

---

### Phase 3: SectionsContext & Frontend Service Layer

**Rationale:** All frontend pages depend on SectionsContext. It must exist before any page is modified. This phase is quick but is the correct dependency point.

**Delivers:** `frontend/src/services/sectionsService.js`; `SectionsContext.jsx` wrapping the app with sections+meters tree, mutation functions, and invalidation.

**Addresses:** Anti-pattern 3 (per-page fetching), manual state synchronization concern from CONCERNS.md

**Uses:** No new library — follows AuthContext/LanguageContext pattern exactly

**Research flag:** Standard React context pattern. No research-phase needed.

---

### Phase 4: Settings — Section Management UI

**Rationale:** Users must be able to create custom sections before entries can be logged to them. This is also the first page to validate the full sections API round-trip. Unit price rows per section replace the hardcoded three-row settings layout.

**Delivers:** Section create/rename/reorder (drag-and-drop)/archive/delete UI; meter create/rename/delete within sections; unit price row per section.

**Addresses:** All "Section management" and "Meter management" table stakes features; icon picker (curated subset); section color assignment

**Avoids:** Pitfall 9 (reorder via single-transaction batch update), Pitfall 10 (assign color at creation time), Pitfall 8 (archive-first, hard-delete confirmation)

**Uses:** `@dnd-kit/sortable`, `@radix-ui/react-select`, react-icons subset

**Research flag:** Standard patterns. No research-phase needed.

---

### Phase 5: AddEntry — Dynamic Form with Entry Modes

**Rationale:** With sections created, the entry form becomes the critical user-facing path. This is the most complex UI change: section selector, meter selector, mode toggle (usage vs. reading), conditional fields, and last-reading fetch.

**Delivers:** Fully section/meter-aware entry form; entry mode A (usage amount); entry mode B (meter reading with delta preview, first-entry baseline UX); date range entry; last reading display.

**Addresses:** All entry form table stakes; entry mode B differentiator; last reading display differentiator

**Avoids:** Pitfall 2 (delta chain integrity, using server-validated approach), Pitfall 7 (same-date ordering via (date, created_at)), Pitfall 5 (i18n: section names never passed to `t()`)

**Uses:** `react-hook-form`, `@radix-ui/react-tabs`

**Research flag:** Entry mode B delta logic and date-range split are non-trivial. Consider a targeted research-phase or design spike before implementation.

---

### Phase 6: Statistics — Dynamic Section-Driven Charts

**Rationale:** Statistics is read-only — it can only be fully updated after the write path (phases 1–5) works. Deferring to last reduces regression risk on existing charts.

**Delivers:** Statistics page rendered dynamically from sections API; section rollup charts; per-meter breakdown charts; `TYPE_CONFIG` eliminated; Entries list showing section/meter names; filter dropdown section-aware.

**Addresses:** Statistics table stakes, per-meter statistics differentiator, Entries list section badge

**Avoids:** Pitfall 3 (replace TYPE_CONFIG with data-driven config), Pitfall 5 (i18n audit for dynamic labels)

**Research flag:** Standard Recharts + dynamic data pattern. No research-phase needed.

---

### Phase Ordering Rationale

- Schema first because it is the single dependency for all other layers
- Backend before frontend because the API contract drives frontend service shapes
- SectionsContext before pages because all modified pages depend on it
- Settings before AddEntry because sections must exist before entries can reference them (default seeded sections cover the initial case, but custom sections must be testable end-to-end)
- Statistics last because it is read-only and can be updated after write paths are proven — deferring it reduces risk of regressions on working charts

### Research Flags

Phases needing deeper research or design spikes during planning:
- **Phase 5 (AddEntry entry mode B):** meter-reading delta chain integrity, first-entry baseline UX, and date-range float rounding all require explicit design decisions before coding. A design spike (not a full research-phase) is recommended.

Phases with standard, well-documented patterns (no research-phase needed):
- **Phase 1:** node-pg-migrate, FK backfill — established pattern
- **Phase 2:** Express + pg service layer — existing project pattern
- **Phase 3:** React context provider — existing project pattern (AuthContext)
- **Phase 4:** Radix UI + dnd-kit — well-documented libraries
- **Phase 6:** Recharts dynamic data — standard usage

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | New library versions (dnd-kit, react-hook-form, node-pg-migrate) unverified against current npm registry; run `npm info <package> version` before installing |
| Features | HIGH | Derived from direct codebase analysis + PROJECT.md requirements + established utility domain conventions |
| Architecture | HIGH | Extends existing project patterns directly; schema and component boundaries derived from codebase |
| Pitfalls | HIGH | Identified from direct codebase analysis of specific files and functions; not speculative |

**Overall confidence:** MEDIUM-HIGH. Architecture and pitfall analysis are reliable. Stack version numbers need npm verification before pinning.

### Gaps to Address

- **Library version verification:** Before installing `@dnd-kit/core`, `react-hook-form`, `node-pg-migrate`, run `npm info <package> version` to confirm latest stable version. Current training data recommends 6.x, 7.x, 7.x respectively.
- **Entry mode B delta strategy:** Recalculate-on-read vs. cascade-recalculate vs. soft-delete-only must be decided and documented before Phase 5 begins. This is a design decision, not a research gap.
- **Date-range entry representation:** Store as single entry with range fields vs. split to daily rows — must be resolved in Phase 1 schema design before Phase 5 implementation.
- **Existing database schema:** No migration history exists in the repo. Before writing Phase 1 migrations, inspect actual production schema via Supabase dashboard to confirm current column names match what CONCERNS.md documents.

---

## Sources

### Primary (HIGH confidence)
- Codebase: `backend/controllers/entriesController.js`, `breakdownController.js`, `services/entriesService.js`, `frontend/src/pages/Statistics.jsx`, `AddEntry.jsx`, `Settings.jsx`
- Codebase: `frontend/package.json`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`
- Project requirements: `.planning/PROJECT.md`

### Secondary (MEDIUM confidence)
- Training data (cutoff Aug 2025): @dnd-kit/core, react-hook-form, node-pg-migrate — version numbers unverified against current npm registry
- Domain knowledge: utility meter reading conventions, billing period delta calculation, IEEE 754 float behavior, PostgreSQL FK semantics

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
