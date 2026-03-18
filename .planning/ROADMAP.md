# Roadmap: UtilityTracker v2

## Overview

This milestone replaces hardcoded Water/Power/Fuel categories with a fully dynamic system of user-managed sections and meters. The build is strictly dependency-driven: schema migration first, then backend API, then frontend state layer, then UI pages in write-before-read order (Settings → AddEntry → Statistics). Every phase delivers a verifiable capability; no phase completes without the previous one working.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Schema Migration** - Replace type string with sections/meters schema and backfill existing data
- [ ] **Phase 2: Backend Services** - CRUD API for sections/meters and updated entries with mode logic
- [ ] **Phase 3: SectionsContext** - Global frontend state layer for sections and meters tree
- [ ] **Phase 4: Section & Meter Management UI** - Settings page with full section/meter creation, editing, and reordering
- [ ] **Phase 5: Dynamic Entry Form** - AddEntry with section/meter selectors and both entry modes
- [ ] **Phase 6: Statistics & Display** - Dynamic section-driven charts, per-meter breakdowns, and unit display

## Phase Details

### Phase 1: Schema Migration
**Goal**: The database reflects the new sections/meters model with all existing data preserved
**Depends on**: Nothing (first phase)
**Requirements**: UNIT-01, UNIT-02
**Success Criteria** (what must be TRUE):
  1. `utility_sections` and `utility_meters` tables exist with correct columns and FK constraints
  2. Default Water (m³), Power (kWh), and Fuel sections exist as rows in `utility_sections`
  3. All existing `utility_entries` rows reference a `meter_id` and have no orphaned `type` column values
  4. `utility_settings` rows reference `section_id` instead of type strings
  5. The migration is reversible — rollback restores original schema without data loss
**Plans:** 2 plans
Plans:
- [ ] 01-01-PLAN.md — Test infrastructure, migration SQL files (up + down), and Node runner script
- [ ] 01-02-PLAN.md — Integration tests and production migration verification

### Phase 2: Backend Services
**Goal**: A complete, tested API contract exists that the frontend can build against
**Depends on**: Phase 1
**Requirements**: (no direct v1 requirements — infrastructure phase enabling all UI phases)
**Success Criteria** (what must be TRUE):
  1. `GET /api/sections` returns all sections with their meters in sort order
  2. Section and meter CRUD endpoints (create, update, reorder, delete) return correct responses
  3. `POST /api/entries` accepts both usage-amount and meter-reading modes and stores correct `usage_amount`
  4. `GET /api/entries/stats` returns breakdowns grouped by section and meter dynamically (no hardcoded types)
  5. `GET /api/meters/:id/last-reading` returns the most recent entry for that meter
**Plans**: TBD

### Phase 3: SectionsContext
**Goal**: All frontend pages can access sections and meters from a single shared context without per-page fetching
**Depends on**: Phase 2
**Requirements**: (no direct v1 requirements — infrastructure phase enabling all UI phases)
**Success Criteria** (what must be TRUE):
  1. `SectionsContext` wraps the app and exposes sections+meters tree to all children
  2. Mutation functions (create, update, delete section/meter) invalidate and refresh context state
  3. No individual page makes a standalone `/api/sections` fetch outside the context
**Plans**: TBD

### Phase 4: Section & Meter Management UI
**Goal**: Users can define and manage their utility sections and meters from the Settings page
**Depends on**: Phase 3
**Requirements**: SECT-01, SECT-02, SECT-03, SECT-04, METR-01, METR-02, I18N-01, I18N-02
**Success Criteria** (what must be TRUE):
  1. User can create a new section with a name, unit, and icon and see it appear in the section list
  2. User can rename, change the unit, or change the icon of any section including Water, Power, and Fuel
  3. User can drag sections to reorder them and the order persists on page reload
  4. User can add, rename, and delete meters within any section
  5. All new UI labels and messages appear in the user's chosen language (EN or DE); section and meter names display as typed (not translated)
**Plans**: TBD

### Phase 5: Dynamic Entry Form
**Goal**: Users can log entries to any section and meter using either usage-amount or meter-reading input
**Depends on**: Phase 4
**Requirements**: ENTR-01, ENTR-02, ENTR-03, ENTR-04
**Success Criteria** (what must be TRUE):
  1. User can select any section and meter from the entry form and log a usage amount for a single date
  2. User can enter a date range and the app splits the usage evenly across each day in the range
  3. User can enter a current meter reading and the app calculates and stores the usage delta since the last reading
  4. When logging the first entry for a meter in reading mode, the app accepts an initial reading and records usage as zero
**Plans**: TBD

### Phase 6: Statistics & Display
**Goal**: Statistics, charts, and entry lists reflect all sections and meters dynamically with correct units
**Depends on**: Phase 5
**Requirements**: METR-03, METR-04, UNIT-03
**Success Criteria** (what must be TRUE):
  1. Statistics page displays charts for every section the user has created, not just Water/Power/Fuel
  2. User can view usage breakdown per individual meter within a section
  3. User can view aggregated totals rolled up to the section level
  4. All units shown throughout the app match each section's configured unit (e.g. a custom "Gas" section shows "m³" if that is its unit)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Schema Migration | 0/2 | Planning complete | - |
| 2. Backend Services | 0/TBD | Not started | - |
| 3. SectionsContext | 0/TBD | Not started | - |
| 4. Section & Meter Management UI | 0/TBD | Not started | - |
| 5. Dynamic Entry Form | 0/TBD | Not started | - |
| 6. Statistics & Display | 0/TBD | Not started | - |
