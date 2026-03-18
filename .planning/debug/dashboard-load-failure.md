---
status: verifying
trigger: "User gets Failed to load dashboard data error when opening the dashboard. It used to work but now fails every time."
created: 2026-03-18T00:00:00Z
updated: 2026-03-18T00:00:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED - migration 001 dropped `type` column from utility_entries and utility_settings, but all backend service queries still reference `type` directly, causing SQL errors on every API call
test: read migration SQL and compare against service queries
expecting: every service query using `type` column will fail with "column type does not exist"
next_action: update all service files to use the new meter_id/section_id join pattern

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: Dashboard loads and displays data normally
actual: Error message "Failed to load dashboard data" shown on every page load
errors: "Failed to load dashboard data"
reproduction: Every page load - 100% reproducible
started: worked before, recently broke

## Eliminated
<!-- APPEND only - prevents re-investigating -->

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-03-18
  checked: migration 001_schema_migration.up.sql Step 11
  found: ALTER TABLE utility_entries DROP COLUMN type; ALTER TABLE utility_settings DROP COLUMN type;
  implication: type column no longer exists in these tables

- timestamp: 2026-03-18
  checked: git commit 04c29fa message
  found: "type column dropped from utility_entries" - migration applied to production
  implication: production DB has no type column - all queries using it will throw SQL errors

- timestamp: 2026-03-18
  checked: backend/services/entriesService.js
  found: getEntries uses WHERE type=$N, getStats uses GROUP BY type, createEntry inserts type
  implication: all three dashboard API calls (getStats, getEntries, getTrend via getMonthlyTrend) will fail with column error

- timestamp: 2026-03-18
  checked: backend/services/settingsService.js, backend/controllers/breakdownController.js
  found: both still reference type column in queries
  implication: settings and breakdown endpoints also broken

- timestamp: 2026-03-18
  checked: migration seeded section names
  found: sections named 'Water', 'Power', 'Fuel' (not 'electricity','water','fuel'); backfill used LOWER comparison
  implication: type concept now derived from utility_sections.name via meter_id join

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: Schema migration 001 dropped the `type` column from utility_entries and utility_settings, replacing it with meter_id (FK to utility_meters -> utility_sections). The backend service layer was never updated and still queries the non-existent `type` column, causing SQL errors on every dashboard API call.
fix: Updated backend/services/entriesService.js, backend/services/settingsService.js, and backend/controllers/breakdownController.js to join through utility_meters -> utility_sections instead of using the dropped `type` column. Added TYPE_TO_SECTION / SECTION_TO_TYPE maps to translate between frontend type identifiers (electricity/water/fuel) and DB section names (Power/Water/Fuel). All query results now return `type` field derived from section name.
verification: awaiting human verification
files_changed:
  - backend/services/entriesService.js
  - backend/services/settingsService.js
  - backend/controllers/breakdownController.js
