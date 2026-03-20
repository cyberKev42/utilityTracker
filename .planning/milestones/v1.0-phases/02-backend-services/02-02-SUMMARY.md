---
phase: 02-backend-services
plan: "02"
subsystem: api
tags: [postgres, nodejs, esm, sql, transactions]

requires:
  - phase: 01-schema-migration
    provides: "utility_entries with meter_id, group_id, meter_reading, entry_mode columns; archived_at on sections and meters"

provides:
  - "entriesService.js with meter-aware createEntry (usage_amount and meter_reading modes)"
  - "Date-range splitting into daily rows with shared group_id and rounding remainder on last day"
  - "Meter-reading delta calculation and first-reading detection returning is_initial: true"
  - "Delete with next-entry delta recalculation in a transaction for meter_reading meters"
  - "Dynamic getEntries with optional meter_id, section_id, year, month, limit, offset filters"
  - "getStats returning section totals with nested per-meter breakdown via two-query JS merge"

affects: [03-frontend, 04-ui, entriesController, entries-routes, api-tests]

tech-stack:
  added: []
  patterns:
    - "splitIntoDailyRows internal helper: inclusive day count via (end - start) / 86400000 + 1, remainder on last row"
    - "Ownership chain: single JOIN query (meters JOIN sections WHERE user_id) to avoid multiple round-trips"
    - "Two-query stats merge: section totals + meter totals fetched separately, merged in JS by section_id"
    - "Transaction wrapper: pool.connect() + BEGIN/COMMIT/ROLLBACK + client.release() in finally block"
    - "Error with status: Object.assign(new Error(msg), { status: N }) for 404/400 from service layer"

key-files:
  created: []
  modified:
    - backend/services/entriesService.js

key-decisions:
  - "unit_price falls back to utility_settings lookup (section-level) if not provided in request; defaults to 0 if not found"
  - "cost_amount stored per row (both in single-day and date-range inserts); not computed at read time"
  - "Negative meter-reading deltas stored as-is; validation is a UI concern"
  - "usage_amount mode simple DELETE (no recalculation); meter_reading mode DELETE triggers next-entry recalc in transaction"

patterns-established:
  - "splitIntoDailyRows: 86400000ms divisor for day count, last-row remainder absorption"
  - "getStats two-query merge: avoids N+1, both queries use same date filter params"

requirements-completed: [SC-03, SC-05]

duration: 5min
completed: 2026-03-18
---

# Phase 02 Plan 02: Entries Service Rewrite Summary

**Meter-aware entriesService.js with date-range splitting, meter-reading delta + first-reading detection, delete-with-recalculation, and two-query stats merge**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-18T21:15:29Z
- **Completed:** 2026-03-18T21:20:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Rewrote entriesService.js from scratch — removed all deprecated VALID_TYPES / type-string mapping code
- Implemented `createEntry` supporting both usage_amount (single-day and date-range with group_id) and meter_reading (delta + first-reading detection) modes
- Implemented `deleteEntry` with transaction-safe next-entry delta recalculation for meter_reading meters
- Implemented `getEntries` with optional meter_id, section_id, year, month, limit, and offset filters
- Implemented `getStats` via two-query merge pattern returning `{ sections: [..., meters: [...]] }` with archived_at exclusions

## Task Commits

1. **Task 1: Rewrite entriesService.js with meter-aware entry logic** - `dcac26f` (feat)

## Files Created/Modified

- `backend/services/entriesService.js` - Fully rewritten with all 4 exports and splitIntoDailyRows helper

## Decisions Made

- Unit price falls back to utility_settings at section level when not provided in the request body; defaults to 0 if settings row absent
- cost_amount is stored per row rather than computed at read time, including in date-range splits (proportional distribution)
- Negative meter-reading deltas are accepted and stored as-is per research recommendation; UI validation is out of scope
- Error objects from the service carry a `.status` property (404, 400) that controllers can use for HTTP status codes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - syntax verification passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- entriesService.js is ready for consumption by entriesController and entries routes
- The controller layer will need to pass `meter_id`, `start_date`, `end_date` (not `type`, `date`) — controller update is in a subsequent plan
- getStats requires `year` and `month` as numbers (not strings) — controller must parse query params before passing

---
*Phase: 02-backend-services*
*Completed: 2026-03-18*
