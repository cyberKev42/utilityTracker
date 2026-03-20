# Phase 6: Statistics & Display - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Statistics, charts, and entry lists reflect all sections and meters dynamically with correct units. Per-meter breakdowns within sections, usage/cost toggle across all chart views, and proper unit display throughout the app.

</domain>

<decisions>
## Implementation Decisions

### Per-meter breakdown
- Tab bar on section detail page: "All" tab + one tab per meter
- Hide tab bar when section has only one meter — no unnecessary UI
- "All" tab shows a stacked area chart: single aggregated total line with the area below colored per-meter (stacked segments) so users see which meter contributes how much
- Individual meter tabs show the same chart layout (monthly bar + daily area) filtered to that meter

### Usage vs Cost charting
- Global toggle (segmented control) on both the main Statistics overview and section detail pages
- Toggle switches between "Usage" and "Cost" view — all charts on the page switch together
- Default to **Usage** (not cost)
- When in Usage mode, Y-axis values use the section's configured unit; when in Cost mode, Y-axis uses currency

### Unit display
- Chart Y-axis label shows the unit (e.g., "kWh", "m³") when in usage mode
- Summary stat cards on detail page show unit suffix (e.g., "1,245 kWh")
- Section cards on the main Statistics overview show total usage with unit
- Tooltips do NOT show units (keep them clean/numeric)

### Overview chart granularity
- SpendingLineChart (main overview) gets a granularity toggle: Weekly / Monthly / Daily
- Replaces the current monthly-only aggregation which is too coarse
- Weekly is the default granularity — more detail than monthly

### Section detail layout
- Summary stats at top: Total usage + unit, Total cost, Average per day
- No entry count stat
- Year selector (dropdown or arrows) to switch between years
- No recent entries list — detail page is charts + stats only, entries viewable on Entries page
- Chart arrangement: monthly bar chart, then daily area chart (same as current, plus meter tabs)

### Claude's Discretion
- Exact tab bar styling and animation
- Chart color palette assignment for meters
- Granularity toggle placement and styling
- Loading skeleton design
- Empty state handling per meter tab

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Statistics pages
- `frontend/src/pages/Statistics.jsx` — Main overview page with section cards and charts
- `frontend/src/pages/StatisticsDetail.jsx` — Section detail page (monthly bar + daily area charts)
- `frontend/src/components/charts/SpendingLineChart.jsx` — Overview spending line chart (needs granularity update)
- `frontend/src/components/charts/CategoryBarChart.jsx` — Category bar chart
- `frontend/src/components/charts/DistributionPieChart.jsx` — Distribution pie chart

### Data layer
- `frontend/src/hooks/useSections.js` — Sections context hook (provides sections + meters tree)
- `frontend/src/services/entriesService.js` — getStats(), getEntries() API calls
- `backend/src/services/entriesService.js` — Stats query (must return usage_amount alongside cost_amount)

### Requirements
- `.planning/REQUIREMENTS.md` — METR-03 (per-meter stats), METR-04 (aggregated section stats), UNIT-03 (custom unit display)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Statistics.jsx` already uses `useSections()` and dynamically renders section cards — no hardcoded types
- `StatisticsDetail.jsx` has monthly bar chart + daily area chart pattern — can be extended with meter tabs
- `SECTION_COLORS` array exists in both pages for consistent coloring
- `ICON_MAP` from IconPickerGrid for section icons
- Recharts library (ResponsiveContainer, BarChart, AreaChart, etc.) already installed and used
- `useCurrency` hook for cost formatting
- Framer Motion animation patterns (stagger, fadeUp, cardHover) established

### Established Patterns
- Chart data derived client-side from entries (deriveMonthly, deriveDaily functions)
- Tooltips use custom components with dark theme styling
- Cards use shadcn/ui Card/CardContent components
- i18n via useTranslation() for all labels

### Integration Points
- Stats API (`GET /api/entries/stats`) — may need to return `usage_amount` breakdowns per meter, not just per section
- Entries API (`GET /api/entries`) — already accepts `section_id` filter, may need `meter_id` filter
- Router: `/statistics/:sectionId` route already exists in StatisticsDetail

</code_context>

<specifics>
## Specific Ideas

- "All" tab stacked area visualization: user specifically wants a total line with colored stacked areas beneath showing per-meter contribution — like a stacked area chart where each meter's share is visible
- Weekly granularity as default for overview chart — current monthly view is "too broad" with values like "Feb 26, Mar 26" only

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-statistics-display*
*Context gathered: 2026-03-20*
