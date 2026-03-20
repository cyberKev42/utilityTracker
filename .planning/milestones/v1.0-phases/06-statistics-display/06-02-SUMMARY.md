---
phase: 06-statistics-display
plan: 02
subsystem: ui
tags: [react, recharts, i18n]

requires:
  - phase: 06-01
    provides: StatisticsDetail base, entriesService year/limit, i18n keys
provides:
  - Usage/Cost toggle on Statistics overview
  - Unit display on section cards
  - Granularity toggle (Daily/Weekly/Monthly) on SpendingLineChart
  - Granularity toggle on StatisticsDetail unified chart
  - Unit suffixes in all chart tooltips
affects: []

tech-stack:
  added: []
  patterns: [granularity toggle pattern, unified chart card]

key-files:
  created: []
  modified:
    - frontend/src/pages/Statistics.jsx
    - frontend/src/components/charts/SpendingLineChart.jsx
    - frontend/src/pages/StatisticsDetail.jsx
    - frontend/src/i18n/locales/en/common.json
    - frontend/src/i18n/locales/de/common.json

key-decisions:
  - "Unified single chart card with granularity toggle replaces separate monthly/daily cards on detail page"
  - "Tooltips show units in usage mode and currency in cost mode"
  - "Weekly granularity as default for both overview and detail charts"

patterns-established:
  - "Granularity toggle: segmented control with daily/weekly/monthly options"
---

## What Changed

### Statistics Overview (Statistics.jsx)
- Usage/Cost segmented toggle top-right, defaults to Usage
- Section cards show total usage with unit suffix (e.g. "245 kWh") or currency
- SpendingLineChart receives viewMode and granularity toggle

### SpendingLineChart
- Daily/Weekly/Monthly granularity toggle (Weekly default)
- Tooltip shows unit suffix in usage mode, currency in cost mode
- Accepts optional `unit` prop for tooltip display

### StatisticsDetail
- Replaced separate Monthly Overview + Daily Breakdown cards with single unified Overview chart
- Granularity toggle (Daily/Weekly/Monthly, defaults Weekly) controls chart type
- Monthly = bar chart, Daily/Weekly = area chart
- Added weekly derivation functions (single + stacked meter variants)
- All tooltips show units in usage mode

### i18n
- Added `statisticsDetail.overview` and `statisticsDetail.overviewDesc` keys (EN + DE)

## Self-Check: PASSED
- Build succeeds
- All chart tooltips include units
- Granularity toggle present on both overview and detail pages
