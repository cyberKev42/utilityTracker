---
phase: 02-backend-services
plan: 04
status: complete
started: 2026-03-19
completed: 2026-03-19
---

# Plan 02-04: Integration Tests

## What Was Built

16 integration tests covering all 5 Phase 2 success criteria, running against the real database via `TEST_DATABASE_URL`.

## Key Files

### Created
- `backend/tests/api.test.js` — 16 tests across 5 describe blocks (SC-1 through SC-5)

### Modified
- `backend/services/entriesService.js` — Fixed: added `unit` column to all INSERTs (NOT NULL constraint), changed entry_mode check from `'meter_reading'` to `'reading'` to match DB CHECK constraint
- `backend/services/sectionsService.js` — Fixed: handle null `icon` in `create()` by omitting from INSERT (lets DB DEFAULT 'zap' apply), handle null `icon` in `update()` via COALESCE

## Deviations

- **Schema mismatches discovered and fixed**: The entries service was missing the `unit` column in INSERT statements and using `'meter_reading'` instead of `'reading'` for the entry_mode check. These were bugs in plans 02-01/02-02 that only surfaced when running against the real database.
- **Test helper**: Tests use `backend/tests/helpers/db.js` for a separate Pool to the test database (for setup/teardown), while service functions use the app's `db.js` connection pointed at the same DB via `DB_URL_OVERRIDE`.

## Self-Check: PASSED

All 16 tests pass against the production database schema.
