---
phase: 08-data-entry-mobile
plan: 01
subsystem: database, ui, testing
tags: [vitest, i18n, migration, postgres, react]

# Dependency graph
requires: []
provides:
  - vitest test infrastructure for frontend
  - DB migration 002 adding translation_key to utility_sections
  - normalizeDecimal utility (comma-to-dot normalization)
  - getSectionDisplayName utility (i18n-aware section names with null guard)
  - sectionNames i18n keys for EN and DE (water/power/fuel)
affects: [08-02, 08-03]

# Tech tracking
tech-stack:
  added: [vitest]
  patterns:
    - TDD RED/GREEN wave — test scaffolds created before source files
    - translation_key null guard — getSectionDisplayName only calls t() when translation_key is truthy

key-files:
  created:
    - frontend/vitest.config.js
    - frontend/src/utils/normalizeDecimal.js
    - frontend/src/utils/normalizeDecimal.test.js
    - frontend/src/utils/sectionName.js
    - frontend/src/utils/sectionName.test.js
    - backend/migrations/002_add_translation_key.up.sql
    - backend/migrations/002_add_translation_key.down.sql
  modified:
    - frontend/src/i18n/locales/en/common.json
    - frontend/src/i18n/locales/de/common.json
    - frontend/package.json

key-decisions:
  - "Used sectionNames namespace (not sections) to avoid collision with existing sections.loadError UI strings"
  - "getSectionDisplayName guards null/empty translation_key — never passes null key to t()"
  - "Migration 002 backfills water/power/fuel translation_key for all existing default sections"

patterns-established:
  - "normalizeDecimal: String(value ?? '') handles null/undefined; .replace(',', '.') handles comma"
  - "getSectionDisplayName: if (!section.translation_key) return section.name — explicit guard pattern"

requirements-completed: [ENTR-01, ENTR-02]

# Metrics
duration: 15min
completed: 2026-03-21
---

# Phase 8 Plan 01: Foundation Summary

**vitest scaffold, DB migration adding translation_key to utility_sections, normalizeDecimal and getSectionDisplayName utilities, plus EN/DE sectionNames i18n keys**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-21T16:10:00Z
- **Completed:** 2026-03-21T16:25:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Frontend vitest installed and configured with 10 passing unit tests
- DB migration 002 applied — translation_key column added, water/power/fuel backfilled
- normalizeDecimal handles comma, dot, non-string, null, undefined inputs correctly
- getSectionDisplayName guards null translation_key to avoid calling t() with null key
- EN and DE i18n files updated with sectionNames.water/power/fuel (additive, no existing keys removed)

## Task Commits

1. **Task 0: Wave 0 vitest scaffolds** - `069e29c` (test)
2. **Task 1: DB migration + utility functions** - `5b4631b` (feat)
3. **Task 2: sectionNames i18n keys** - `d145619` (feat)

## Files Created/Modified

- `frontend/vitest.config.js` - vitest config with node environment
- `frontend/src/utils/normalizeDecimal.js` - comma-to-dot with null/non-string safety
- `frontend/src/utils/normalizeDecimal.test.js` - 6 unit tests
- `frontend/src/utils/sectionName.js` - i18n-aware section name with null guard
- `frontend/src/utils/sectionName.test.js` - 4 unit tests
- `backend/migrations/002_add_translation_key.up.sql` - ALTER TABLE + UPDATE backfill
- `backend/migrations/002_add_translation_key.down.sql` - DROP COLUMN rollback
- `frontend/src/i18n/locales/en/common.json` - added sectionNames.water/power/fuel
- `frontend/src/i18n/locales/de/common.json` - added Wasser/Strom/Brennstoff
- `frontend/package.json` - added vitest devDependency

## Decisions Made

- Used `sectionNames` namespace (not `sections`) to avoid collision with existing `sections.loadError` UI strings
- getSectionDisplayName guards with `if (section.translation_key)` — never passes null to `t()` (Pitfall 3 from RESEARCH.md)
- migrate.js only handles 001; migration 002 run via inline node script against DB directly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The existing `migrate.js` script hardcodes `001_schema_migration` filename, so migration 002 was applied via a direct inline node script rather than the CLI runner. Migration files are created per plan spec; a generalized runner is out of scope for this plan.

## Next Phase Readiness

- All Wave 0 tests pass GREEN (10/10)
- DB has translation_key column, default sections backfilled
- normalizeDecimal and getSectionDisplayName ready for use in 08-02 (entry form wiring)
- i18n keys ready for 08-03 (section dropdown translation)

---
*Phase: 08-data-entry-mobile*
*Completed: 2026-03-21*
