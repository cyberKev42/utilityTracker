# Roadmap: UtilityTracker

## Shipped Milestones

<details>
<summary>v1.0 — MVP (6 phases, 14 plans) ✅ Shipped 2026-03-20</summary>

Replaced hardcoded Water/Power/Fuel categories with dynamic sections/meters system.

- Phase 1: Schema Migration (2 plans)
- Phase 2: Backend Services (4 plans)
- Phase 3: SectionsContext (2 plans)
- Phase 4: Section & Meter Management UI (2 plans)
- Phase 5: Dynamic Entry Form (2 plans)
- Phase 6: Statistics & Display (2 plans)

[Full details](milestones/v1.0-ROADMAP.md)
</details>

## Current Milestone

### v1.1 Polish & UX

**Milestone Goal:** Eliminate loading friction, fix mobile layout issues, and deliver UX improvements across navigation, data entry, dashboard, and settings.

## Phases

- [x] **Phase 7: Performance & Navigation** - SPA-like navigation and instant settings UI updates (completed 2026-03-20)
- [ ] **Phase 8: Data Entry & Mobile** - Comma decimal support, translated dropdowns, and mobile layout fixes
- [ ] **Phase 9: Dashboard & Settings Polish** - Usage/cost toggle, inline meter name editing, and improved water icons

## Phase Details

### Phase 7: Performance & Navigation
**Goal**: The app feels instant — no page reloads between routes and no refresh required after settings changes
**Depends on**: Phase 6 (v1.0 complete)
**Requirements**: PERF-01, PERF-02, NAVI-01
**Success Criteria** (what must be TRUE):
  1. User navigates between Dashboard, Statistics, AddEntry, and Settings without a full-page reload or loading spinner appearing
  2. User creates or edits a section or meter in Settings and the change appears immediately in the UI without refreshing the page
  3. User clicks a section card on the Dashboard and lands on the Statistics page with that section already selected
**Plans:** 3/3 plans complete

Plans:
- [x] 07-01-PLAN.md — Centralized EntriesDataContext + consume in Dashboard/Statistics (PERF-01)
- [x] 07-02-PLAN.md — Optimistic mutations in SectionsContext + withRetry (PERF-02)
- [x] 07-03-PLAN.md — Dashboard sparklines + statistics linking + back button (NAVI-01)

### Phase 8: Data Entry & Mobile
**Goal**: Data entry works correctly across locales and all pages render without layout breakage on mobile
**Depends on**: Phase 7
**Requirements**: ENTR-01, ENTR-02, MOBI-01
**Success Criteria** (what must be TRUE):
  1. User types a comma as a decimal separator (e.g. "1,5") in any numeric entry field and the value is accepted and parsed correctly
  2. User views the new entry form with German active and section names appear in German in the section dropdown
  3. User opens any page on a mobile device and no horizontal scroll bar appears and no UI element is clipped or cut off
**Plans:** 1/3 plans executed

Plans:
- [x] 08-01-PLAN.md — DB migration + utility functions + i18n keys (ENTR-01, ENTR-02)
- [ ] 08-02-PLAN.md — Comma decimal input + section name translation across all pages (ENTR-01, ENTR-02)
- [ ] 08-03-PLAN.md — Mobile responsive grids + touch-friendly drag-and-drop (MOBI-01)

### Phase 9: Dashboard & Settings Polish
**Goal**: Dashboard shows usage or cost at user's choice, settings provides inline meter name editing, and water icons are improved
**Depends on**: Phase 8
**Requirements**: DASH-01, SETT-01, VISL-01
**Success Criteria** (what must be TRUE):
  1. User sees a toggle on the Dashboard and can switch between displaying raw usage amounts and calculated cost values for each section
  2. User clicks a meter name in Settings and edits it inline, the same way section names are already editable
  3. User selects an icon for a water-related section and sees options including droplet, wave, and at least two additional water-themed icons
**Plans**: TBD

## Progress

**Execution Order:** 7 → 8 → 9

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Schema Migration | v1.0 | 2/2 | Complete | 2026-03-18 |
| 2. Backend Services | v1.0 | 4/4 | Complete | 2026-03-18 |
| 3. SectionsContext | v1.0 | 2/2 | Complete | 2026-03-18 |
| 4. Section & Meter Management UI | v1.0 | 2/2 | Complete | 2026-03-19 |
| 5. Dynamic Entry Form | v1.0 | 2/2 | Complete | 2026-03-19 |
| 6. Statistics & Display | v1.0 | 2/2 | Complete | 2026-03-20 |
| 7. Performance & Navigation | v1.1 | 3/3 | Complete   | 2026-03-20 |
| 8. Data Entry & Mobile | v1.1 | 1/3 | In Progress|  |
| 9. Dashboard & Settings Polish | v1.1 | 0/TBD | Not started | - |
