---
phase: 07-performance-navigation
plan: 03
subsystem: ui
tags: [react, recharts, sparkline, navigation, dashboard]

# Dependency graph
requires:
  - phase: 07-01
    provides: EntriesDataContext and useEntriesData hook with cached entries array

provides:
  - Sparkline component (48x24px Recharts LineChart, no axes, primary blue stroke)
  - Dashboard section cards with clickable sparklines linking to /statistics/:sectionId
  - Weekly usage data derivation per section via sparklineDataBySection useMemo
  - StatisticsDetail back button (pre-existing, confirmed functional)

affects: [dashboard, statistics-detail, sparkline-navigation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Derive sparkline data inline via useMemo grouping entries by section_name then by ISO week"
    - "Sparkline wrapped in Link for navigation with hover:ring-1 hover:ring-primary/40 clickability affordance"

key-files:
  created:
    - frontend/src/components/charts/Sparkline.jsx
  modified:
    - frontend/src/pages/Dashboard.jsx

key-decisions:
  - "Sparkline uses fixed 48x24px via ResponsiveContainer — not percentage-based — for consistent mini-chart sizing"
  - "sparklineDataBySection keyed by section_name (not section.id) to match entries data shape from useEntriesData"
  - "StatisticsDetail back button pre-existed as t('statisticsDetail.back') = 'Back to Statistics' — no changes needed"

patterns-established:
  - "Sparkline: data prop is [{ value: number }], empty array renders flat line safely"

requirements-completed: [NAVI-01]

# Metrics
duration: 8min
completed: 2026-03-20
---

# Phase 07 Plan 03: Sparkline Navigation Summary

**Clickable 48x24px Recharts sparklines on Dashboard section cards showing 7-week usage trends, linking to /statistics/:sectionId**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-20T22:40:00Z
- **Completed:** 2026-03-20T22:48:00Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- Created Sparkline component with no axes, no tooltip, primary blue stroke, instant render
- Dashboard section cards now show real weekly usage sparklines in the top-right corner
- Sparklines wrapped in Link navigate to /statistics/:sectionId on click
- Hover ring effect (hover:ring-1 hover:ring-primary/40) provides clickability affordance
- aria-label="View {sectionName} statistics" added for accessibility
- StatisticsDetail already had a "Back to Statistics" button — confirmed functional

## Task Commits

1. **Task 1: Create Sparkline component** - `b6c47dc` (feat)
2. **Task 2: Add sparklines to Dashboard cards** - `c8716bb` (feat)

## Files Created/Modified

- `frontend/src/components/charts/Sparkline.jsx` - Mini 48x24 Recharts LineChart, no axes/tooltip, flat-line fallback for empty data
- `frontend/src/pages/Dashboard.jsx` - Added Sparkline import, sparklineDataBySection useMemo, restructured section card header to flex justify-between with sparkline link in top-right

## Decisions Made

- Sparkline fixed at 48x24px via ResponsiveContainer (not percentage) for predictable card layout
- Data keyed by `section_name` (not `section.id`) since entries from useEntriesData carry section_name
- StatisticsDetail back button was already implemented — no changes needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 07 complete — all 3 plans executed
- Dashboard sparklines provide navigation to statistics detail pages
- NAVI-01 requirement satisfied: clicking a section navigates to statistics with that section

---
*Phase: 07-performance-navigation*
*Completed: 2026-03-20*
