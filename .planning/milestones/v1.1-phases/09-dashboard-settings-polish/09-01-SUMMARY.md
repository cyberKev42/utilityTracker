---
phase: 09-dashboard-settings-polish
plan: 01
subsystem: frontend
tags: [dashboard, toggle, i18n, localStorage]
dependency_graph:
  requires: []
  provides: [dashboard-usage-cost-toggle]
  affects: [Dashboard.jsx]
tech_stack:
  added: []
  patterns: [localStorage persistence, segmented pill toggle, conditional rendering]
key_files:
  created: []
  modified:
    - frontend/src/pages/Dashboard.jsx
    - frontend/src/i18n/locales/en/common.json
    - frontend/src/i18n/locales/de/common.json
decisions:
  - Default toggle mode is 'usage' per D-03 requirement
  - Toggle persists to localStorage key 'dashboard_display_mode'
  - Total Spending card always shows cost regardless of toggle state
metrics:
  duration_minutes: 1
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_modified: 3
---

# Phase 9 Plan 1: Dashboard Usage/Cost Toggle Summary

**One-liner:** Segmented pill toggle (Cost/Usage) on Dashboard switches section card values between formatted currency and raw usage amounts with units, defaulting to usage mode with localStorage persistence.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add i18n keys for dashboard toggle labels | 52361f9 | en/common.json, de/common.json |
| 2 | Implement usage/cost segmented toggle on Dashboard | b42f7c7 | Dashboard.jsx |

## What Was Built

- Added `toggleCost` and `toggleUsage` i18n keys to both EN (`"Cost"`, `"Usage"`) and DE (`"Kosten"`, `"Verbrauch"`) locale files
- Added `useState` import and `displayMode` state to `Dashboard.jsx`, initialized from `localStorage.getItem('dashboard_display_mode')` with default `'usage'`
- Added segmented pill toggle UI in the heading row (heading left, toggle right) using `motion.button` with `whileTap={{ scale: 0.98 }}`, `bg-muted` container, and `bg-background shadow-sm` active pill styling matching the LanguageSwitcher pattern
- Toggle click handler calls both `setDisplayMode(mode)` and `localStorage.setItem('dashboard_display_mode', mode)` for persistence
- Section cards conditionally render `formatCurrency(section.total_cost)` in cost mode or `${Number(section.total_usage || 0).toLocaleString()} ${ctxSection?.unit || ''}` in usage mode
- Total Spending summary card unchanged — always shows `formatCurrency(totalCost)` regardless of toggle

## Verification

- All 10 existing frontend tests pass
- Toggle renders in heading row with correct styling
- Section cards switch display based on mode
- Total Spending card unaffected
- Preference persists across navigation via localStorage

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — data is wired from real API data (`section.total_usage`, `ctxSection?.unit`).

## Self-Check: PASSED

- frontend/src/pages/Dashboard.jsx: exists and contains all required patterns
- frontend/src/i18n/locales/en/common.json: contains toggleCost and toggleUsage
- frontend/src/i18n/locales/de/common.json: contains toggleCost and toggleUsage
- Commits 52361f9 and b42f7c7 exist in git log
