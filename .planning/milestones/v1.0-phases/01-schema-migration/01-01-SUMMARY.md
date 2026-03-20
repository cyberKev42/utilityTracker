---
phase: 01-schema-migration
plan: 01
subsystem: database
tags: [postgres, sql, migration, vitest, pg]

# Dependency graph
requires: []
provides:
  - Forward migration SQL creating utility_sections and utility_meters tables
  - Rollback migration SQL fully reversing all changes
  - Node migrate.js runner with programmatic runMigration export
  - Vitest test infrastructure with test DB helper
affects: [02-api-layer, 03-frontend]

# Tech tracking
tech-stack:
  added: [vitest]
  patterns:
    - SQL migrations wrapped in single BEGIN/COMMIT transaction
    - LOWER() case-safe backfill matching
    - DO $$ block assertion before destructive DROP COLUMN
    - programmatic runMigration(direction, connectionString) export for test usage

key-files:
  created:
    - backend/migrations/001_schema_migration.up.sql
    - backend/migrations/001_schema_migration.down.sql
    - backend/scripts/migrate.js
    - backend/vitest.config.js
    - backend/tests/helpers/db.js
  modified:
    - backend/package.json

key-decisions:
  - "Seed three separate INSERT statements per section type (Water/Power/Fuel) to avoid UNION with gen_random_uuid() non-determinism"
  - "Assert backfill completeness with RAISE EXCEPTION before DROP COLUMN to prevent silent data loss"
  - "Use LOWER() matching for case-safe type-to-section name backfill"
  - "Export runMigration(direction, connectionString) from migrate.js for programmatic test use"

patterns-established:
  - "Migration SQL: single BEGIN/COMMIT transaction with intermediate assertion DO block"
  - "Test helper: getTestDb()/closeTestDb() pattern using TEST_DATABASE_URL env var"

requirements-completed: [UNIT-01, UNIT-02]

# Metrics
duration: 15min
completed: 2026-03-18
---

# Phase 1 Plan 01: Schema Migration Infrastructure Summary

**SQL migration that replaces hardcoded type strings with utility_sections and utility_meters tables, seeds Water/Power/Fuel defaults with correct units, backfills via LOWER() matching with integrity assertion, and adds Vitest + test DB helper**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-18T00:00:00Z
- **Completed:** 2026-03-18
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Forward migration creates utility_sections and utility_meters with all columns and FK constraints
- Seeds Water (m³), Power (kWh), and Fuel (L) sections with default meters per user
- LOWER() backfill with DO $$ assertion prevents data loss before destructive DROP COLUMN
- Rollback migration fully reverses all changes including re-adding original type unique constraint
- migrate.js runner works both via CLI (process.argv[2]) and programmatic import (runMigration)
- Vitest installed with 30s timeouts; test DB helper exports getTestDb/closeTestDb using TEST_DATABASE_URL

## Task Commits

Each task was committed atomically:

1. **Task 1: Install vitest and create test infrastructure** - `a87961d` (chore)
2. **Task 2: Write forward migration SQL (up.sql)** - `9dcfb3c` (feat)
3. **Task 3: Write rollback migration SQL (down.sql) and Node runner** - `b46061f` (feat)

## Files Created/Modified
- `backend/migrations/001_schema_migration.up.sql` - Forward migration DDL+DML in single transaction
- `backend/migrations/001_schema_migration.down.sql` - Rollback migration restoring original schema
- `backend/scripts/migrate.js` - Node runner with CLI and programmatic runMigration export
- `backend/vitest.config.js` - Vitest configuration with 30s timeouts
- `backend/tests/helpers/db.js` - Test DB helper with getTestDb/closeTestDb
- `backend/package.json` - Added vitest devDependency and test script

## Decisions Made
- Three separate INSERT statements for seeding sections (not UNION) to avoid gen_random_uuid() appearing in SELECT list which would cause determinism issues across UNION branches
- RAISE EXCEPTION assertion checks all entries have meter_id and all settings have section_id before proceeding to DROP COLUMN — guarantees zero data loss on forward migration
- DB URL resolution in migrate.js mirrors db.js priority order (DB_URL_OVERRIDE first, then DATABASE_URL, etc.)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required for this plan. The migration requires a running Postgres instance, but that is covered by the existing DATABASE_URL / SUPABASE_DB_URL env vars already in use.

## Next Phase Readiness
- All migration artifacts are in place; Phase 2 (API layer) can import runMigration for integration tests
- TEST_DATABASE_URL must be set before running any integration tests against real DB
- Production migration execution (running up.sql against live Supabase DB) is a separate manual step outside this plan

---
*Phase: 01-schema-migration*
*Completed: 2026-03-18*

## Self-Check: PASSED

- FOUND: backend/migrations/001_schema_migration.up.sql
- FOUND: backend/migrations/001_schema_migration.down.sql
- FOUND: backend/scripts/migrate.js
- FOUND: backend/vitest.config.js
- FOUND: backend/tests/helpers/db.js
- FOUND commits: a87961d, 9dcfb3c, b46061f
