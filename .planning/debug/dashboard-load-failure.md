---
status: verifying
trigger: "User gets Failed to load dashboard data error when opening the dashboard. It used to work but now fails every time."
created: 2026-03-18T00:00:00Z
updated: 2026-03-18T00:00:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED - Dashboard.jsx line 245-246 has an unguarded lookup `const config = TYPE_CONFIG[entry.type]; const Icon = config.icon;` - if entry.type is not one of electricity/water/fuel, config is undefined and config.icon throws TypeError. This render error has no error boundary catch, so it propagates up through MainLayout (which renders the nav), unmounting everything. The previous fix made API calls succeed (returning data), which now triggers this render path for the first time.
test: read Dashboard.jsx render and backend getEntries response shape
expecting: crash site confirmed at config.icon, fix by adding null guard on config
next_action: apply fix - guard against unknown entry types and add error boundary

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

- timestamp: 2026-03-18
  checked: Dashboard.jsx render path after API success
  found: line 245-246 `const config = TYPE_CONFIG[entry.type]; const Icon = config.icon;` - no null guard on config; if entry.type is any value not in TYPE_CONFIG, throws TypeError
  implication: render-time crash, not caught by async try/catch in load(), propagates to React root and unmounts everything including nav

- timestamp: 2026-03-18
  checked: App.jsx and MainLayout.jsx
  found: no React error boundary anywhere in the component tree between React root and Dashboard
  implication: any render error in Dashboard unmounts the entire app (nav, layout, everything)

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: Two-stage failure. (1) Schema migration dropped `type` column, backend queries broke - fixed previously. (2) After fix, API calls now succeed and return data, but Dashboard.jsx line 245-246 has an unguarded property lookup `const config = TYPE_CONFIG[entry.type]; const Icon = config.icon;` - if entry.type is any unexpected value, config is undefined and config.icon throws TypeError. There is no React error boundary anywhere in the component tree, so this render error propagates all the way to the root, unmounting the entire app including the nav/layout.
fix: (1) Added null fallback in Dashboard.jsx recentEntries.map: `TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.electricity` - prevents crash if type is unrecognized. (2) Created PageErrorBoundary component and wrapped <Outlet /> in MainLayout with it, keyed by pathname - prevents any page render crash from unmounting the nav/layout.
verification: awaiting human verification
files_changed:
  - backend/services/entriesService.js
  - backend/services/settingsService.js
  - backend/controllers/breakdownController.js
  - frontend/src/pages/Dashboard.jsx
  - frontend/src/layouts/MainLayout.jsx
  - frontend/src/components/PageErrorBoundary.jsx
