---
phase: 03-sectionscontext
plan: 01
subsystem: ui
tags: [react, context, hooks, sections, meters]

requires:
  - phase: 02-backend-services
    provides: REST API endpoints for sections and meters at /api/sections

provides:
  - sectionsService.js — API abstraction for all 12 section/meter endpoints
  - SectionsContext.jsx — SectionsProvider with full state management and UI states
  - useSections.js — consumer hook with guard error

affects:
  - 04-sections-list
  - 05-entry-form
  - 06-settings

tech-stack:
  added: []
  patterns:
    - "Service layer pattern: api.js calls wrapped in named async exports"
    - "Auth-scoped context: useEffect watching user clears/refetches on auth change"
    - "Optimistic mutation with snapshot rollback: reorder operations update state immediately, rollback on API error"
    - "Server-wait mutation: mutate via API then await full fetchSections() refresh"

key-files:
  created:
    - frontend/src/services/sectionsService.js
    - frontend/src/context/SectionsContext.jsx
    - frontend/src/hooks/useSections.js
  modified: []

key-decisions:
  - "reorderSections and reorderMeters use optimistic updates with snapshot rollback; all other mutations are server-wait"
  - "updateSection is server-wait (not optimistic) because it changes unit/icon, not just cosmetic rename"
  - "fetchWithArchived does not update context state — callers own the returned data"
  - "Loading spinner blocks children render; error banner replaces entire page with Retry button"

patterns-established:
  - "useSections follows same pattern as useAuth: useContext + guard throw"
  - "All server-wait mutations: await API call, then await fetchSections(), return result"
  - "Optimistic mutations: snapshot previous, setSections optimistically, catch rollbacks and rethrows"

requirements-completed: []

duration: 15min
completed: 2026-03-18
---

# Phase 3 Plan 01: SectionsContext Summary

**SectionsContext provider with 12-function service layer, auth-scoped fetching, optimistic reorder mutations, and useSections consumer hook**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-18T23:42:00Z
- **Completed:** 2026-03-18T23:57:27Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- sectionsService.js with all 12 backend endpoint functions (correct HTTP methods including POST for archive/unarchive)
- SectionsContext.jsx with full provider: auth-scoped fetching, 8 server-wait mutations, 2 optimistic mutations, 3 helper lookups, loading spinner, error banner with i18n
- useSections.js consumer hook mirroring useAuth pattern

## Task Commits

1. **Task 1: Create sectionsService.js and useSections.js** - `fe5621f` (feat)
2. **Task 2: Create SectionsContext.jsx with full provider** - `ff8c864` (feat)

## Files Created/Modified

- `frontend/src/services/sectionsService.js` — 12 async functions for all section/meter API endpoints
- `frontend/src/context/SectionsContext.jsx` — SectionsProvider with state management, mutations, helpers, loading/error UI
- `frontend/src/hooks/useSections.js` — Consumer hook with guard error

## Decisions Made

- reorderSections and reorderMeters are optimistic (instant UI feedback); all other mutations are server-wait (simpler correctness)
- updateSection is server-wait even though rename is cosmetic — it also changes unit/icon, and server-wait is simpler
- fetchWithArchived does not touch context state; caller receives data directly (used for settings/archive views)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three files are ready for Phase 4 (sections list UI) to import SectionsProvider and useSections
- SectionsProvider must be mounted above any component that calls useSections()
- Phases 4, 5, 6 can now consume sections + meters state without making their own API calls

---
*Phase: 03-sectionscontext*
*Completed: 2026-03-18*
