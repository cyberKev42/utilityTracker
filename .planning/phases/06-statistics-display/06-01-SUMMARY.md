---
phase: 06-statistics-display
plan: 01
subsystem: frontend
tags: [statistics, charts, i18n, recharts, meter-tabs, usage-cost-toggle]
dependency_graph:
  requires: []
  provides: [StatisticsDetail meter tabs, usage/cost toggle, year selector, stacked area chart, summary stats, i18n keys]
  affects: [frontend/src/pages/StatisticsDetail.jsx, frontend/src/services/entriesService.js]
tech_stack:
  added: []
  patterns: [stacked recharts AreaChart with stackId, client-side meter filtering, derive functions with mode param]
key_files:
  created: []
  modified:
    - frontend/src/pages/StatisticsDetail.jsx
    - frontend/src/services/entriesService.js
    - frontend/src/i18n/locales/en/common.json
    - frontend/src/i18n/locales/de/common.json
decisions:
  - Stacked bar chart used for monthly overview on All tab (not separate chart type)
  - Empty state shows section vs meter wording based on activeMeter state
  - Backend regression test failures are pre-existing (missing TEST_DATABASE_URL), not caused by this plan
metrics:
  duration: ~25 minutes
  completed: 2026-03-20
---

# Phase 6 Plan 1: Statistics Detail Rework Summary

StatisticsDetail.jsx fully reworked with per-meter drill-down tabs, usage/cost toggle, year selector, stacked area/bar charts for the All tab, and summary stat cards showing section unit.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update entriesService and add all i18n keys | 3f76afb | entriesService.js, en/common.json, de/common.json |
| 2 | Rework StatisticsDetail with meter tabs, toggle, year selector, stacked charts | 90c2db5 | StatisticsDetail.jsx |

## What Was Built

**entriesService.js** — Added `year` and `limit` query params to `getEntries` filter builder after the existing `to` param.

**i18n (EN + DE)** — Added `statistics.usage`, `statistics.cost`, `statistics.granularity.*`, and all `statisticsDetail.*` keys (allMeters, totalUsage, totalCost, dailyAvg, emptyMeter, emptySection, errorLoad). Updated `statisticsDetail.description` wording in both languages.

**StatisticsDetail.jsx** — Complete rewrite retaining existing animation patterns. Key additions:
- `viewMode` state ('usage'|'cost'), `activeMeter` state ('all'|meter.id), `year` now stateful
- `getEntries` called with `{ section_id, year, limit: 500 }`, refetches on year change
- `deriveMonthly`/`deriveDaily` accept `mode` param and read `usage_amount` or `cost_amount`
- `deriveStackedMonthly`/`deriveStackedDaily` for All tab with multiple meters — keyed by meter.id
- Summary stat row: 3 cards (Total Usage + unit suffix, Total Cost, Daily Avg)
- Meter tab bar (only when `section.meters.length > 1`): All tab + per-meter tabs
- Monthly BarChart: stacked bars via `stackId="meters"` in All tab, single bar otherwise
- Daily AreaChart: stacked Areas via `stackId="meters"` in All tab, single Area otherwise
- Y-axis label shows `section.unit` in usage mode
- Tooltips sum all payload values, display numeric-only (no unit strings)
- Year selector: arrow buttons with disabled state at current year
- Usage/Cost segmented control per UI-SPEC
- Empty states: section-level (no entries at all) vs meter-level (meter has no data)
- All axis tick `fontSize: 14`, stat values `text-2xl font-semibold tabular-nums tracking-tight`

## Success Criteria Check

- METR-03: Meter tab bar renders per-meter filtered charts — DONE
- METR-04: All tab shows stacked area/bar with aggregated section totals — DONE
- UNIT-03: Y-axis labels and stat card suffixes display section.unit — DONE
- Usage/Cost toggle switches all chart data between usage_amount and cost_amount — DONE
- Year selector allows navigating between years — DONE
- Tooltips show numeric values only — DONE

## Deviations from Plan

None — plan executed exactly as written. The stacked bar chart was applied to the monthly BarChart (in addition to the daily AreaChart) for consistency on the All tab, which is consistent with the spec's intent for stacked display.

## Self-Check: PASSED
