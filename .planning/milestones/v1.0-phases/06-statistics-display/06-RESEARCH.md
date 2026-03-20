# Phase 6: Statistics & Display - Research

**Researched:** 2026-03-20
**Domain:** Recharts data visualization, React state management, multi-meter aggregation
**Confidence:** HIGH

## Summary

Phase 6 extends an existing statistics UI to support dynamic sections, per-meter drill-down, usage/cost toggle, and configurable unit display. The backend data layer is already well-prepared: `getStats()` returns both `total_usage` and `total_cost` per section AND per meter, entries rows carry `usage_amount` alongside `cost_amount`, and `getEntries()` already accepts `meter_id` and `section_id` filters.

The frontend work is entirely client-side derivation and rendering. No backend query changes are required. The key structural changes are: (1) add a meter tab bar to `StatisticsDetail`, (2) swap `deriveMonthly`/`deriveDaily` functions to support both cost and usage modes, (3) add a usage/cost segmented control toggle, (4) add granularity toggle (Daily/Weekly/Monthly) to `SpendingLineChart`, and (5) propagate section unit strings to chart Y-axes and stat card suffixes.

The stacked area chart for the "All" tab is the most novel chart pattern — Recharts supports stacked `<Area>` components natively via `stackId`. Each meter gets its own `<Area>` with a shared `stackId`, producing the stacked area fill. An additional line-only `<Area>` with no fill and `stackId` omitted shows the aggregate total.

**Primary recommendation:** All changes are pure frontend. Work in `StatisticsDetail.jsx`, `Statistics.jsx`, and `SpendingLineChart.jsx`. Don't alter the backend.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Tab bar on section detail page: "All" tab + one tab per meter
- Hide tab bar when section has only one meter — no unnecessary UI
- "All" tab shows a stacked area chart: single aggregated total line with the area below colored per-meter (stacked segments)
- Individual meter tabs show the same chart layout (monthly bar + daily area) filtered to that meter
- Global toggle (segmented control) on both main Statistics overview and section detail pages
- Toggle switches between "Usage" and "Cost" view — all charts on the page switch together
- Default to Usage (not cost)
- Usage mode: Y-axis values use the section's configured unit; Cost mode: Y-axis uses currency
- Chart Y-axis label shows the unit (e.g., "kWh", "m³") when in usage mode
- Summary stat cards on detail page show unit suffix (e.g., "1,245 kWh")
- Section cards on main Statistics overview show total usage with unit
- Tooltips do NOT show units (keep them clean/numeric)
- SpendingLineChart gets a granularity toggle: Weekly / Monthly / Daily; Weekly is the default
- Summary stats at top: Total usage + unit, Total cost, Average per day
- No entry count stat
- Year selector (dropdown or arrows) to switch between years
- No recent entries list — detail page is charts + stats only
- Chart arrangement: monthly bar chart, then daily area chart (plus meter tabs)

### Claude's Discretion
- Exact tab bar styling and animation
- Chart color palette assignment for meters
- Granularity toggle placement and styling
- Loading skeleton design
- Empty state handling per meter tab

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| METR-03 | User can view statistics per individual meter | Meter tab bar in StatisticsDetail; entries already filterable by meter_id; `getStats()` returns per-meter totals |
| METR-04 | User can view aggregated statistics rolled up to the section level | Section-level aggregation already returned by `getStats()`; "All" tab stacked area chart shows per-meter contribution to section total |
| UNIT-03 | Custom sections display their user-defined unit throughout the app | `section.unit` is available in stats response and entries rows; propagate to Y-axis label, stat cards, and section overview cards |
</phase_requirements>

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | installed | Chart rendering | Already used in StatisticsDetail and all chart components |
| framer-motion | installed | Animation | Already used for stagger/fadeUp/cardHover patterns |
| react-i18next | installed | i18n | All user-visible strings must go through useTranslation() |
| shadcn/ui (Card, Button) | installed | UI primitives | Project-wide UI standard |

### No new packages required
All rendering capabilities needed (StackedArea, Bar, Area, ResponsiveContainer, Tooltip, XAxis, YAxis) are already available via the installed recharts version.

## Architecture Patterns

### Recommended Project Structure
No new directories needed. All changes are within:
```
frontend/src/
├── pages/
│   ├── Statistics.jsx          # Add usage/cost toggle + unit display on section cards
│   └── StatisticsDetail.jsx    # Major rework: tabs, usage/cost toggle, year selector
├── components/charts/
│   └── SpendingLineChart.jsx   # Add granularity toggle (Weekly/Monthly/Daily)
└── i18n/locales/
    ├── en/common.json          # New keys for stats UI
    └── de/common.json          # Same keys, German translation
```

### Pattern 1: Usage/Cost Toggle State
**What:** A single `viewMode` state string (`'usage'` | `'cost'`) at the page level. All derive functions and formatters read this prop.
**When to use:** Both `Statistics.jsx` and `StatisticsDetail.jsx` need this independently.
**Example:**
```jsx
const [viewMode, setViewMode] = useState('usage'); // 'usage' | 'cost'

// Derive chart data based on mode
function deriveMonthly(entries, mode) {
  const byMonth = {};
  for (const e of entries) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { month: key, total: 0 };
    byMonth[key].total += Number(mode === 'usage' ? e.usage_amount : e.cost_amount) || 0;
  }
  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
}
```

### Pattern 2: Meter Tab Bar
**What:** A tab list rendered from `section.meters`. Active tab index drives a filtered entry set passed to chart derivation functions.
**When to use:** `StatisticsDetail.jsx` only. Hidden when `section.meters.length <= 1`.
**Example:**
```jsx
const [activeMeter, setActiveMeter] = useState('all'); // 'all' | meter.id

const filteredEntries = activeMeter === 'all'
  ? entries
  : entries.filter(e => e.meter_id === activeMeter);
```

### Pattern 3: Stacked Area Chart for "All" Tab
**What:** Recharts `<AreaChart>` with one `<Area>` per meter sharing `stackId="meters"`. Each meter gets its own color from SECTION_COLORS palette assigned by meter index.
**When to use:** Only when `activeMeter === 'all'` and the section has multiple meters.
**Example:**
```jsx
// Data shape for stacked chart
// Each data point: { month: '2026-01', 'meter-uuid-1': 45.2, 'meter-uuid-2': 12.1 }

function deriveStackedMonthly(entries, meters) {
  const byMonth = {};
  for (const e of entries) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) {
      byMonth[key] = { month: key };
      meters.forEach(m => { byMonth[key][m.id] = 0; });
    }
    if (byMonth[key][e.meter_id] !== undefined) {
      byMonth[key][e.meter_id] += Number(e.usage_amount) || 0;
    }
  }
  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
}

// Render
{meters.map((meter, idx) => (
  <Area
    key={meter.id}
    type="monotone"
    dataKey={meter.id}
    stackId="meters"
    stroke={METER_COLORS[idx % METER_COLORS.length]}
    fill={METER_COLORS[idx % METER_COLORS.length]}
    fillOpacity={0.6}
    dot={false}
  />
))}
```

### Pattern 4: Granularity Toggle for SpendingLineChart
**What:** Props `granularity` (`'daily'` | `'weekly'` | `'monthly'`) and `onGranularityChange` passed to `SpendingLineChart`. Parent (`Statistics.jsx`) owns the state.
**When to use:** Overview `SpendingLineChart` only.
**Example:**
```jsx
// Weekly aggregation helper
function deriveWeeklyData(entries) {
  const byWeek = {};
  for (const entry of entries) {
    const d = new Date(entry.date);
    // ISO week: get Monday of the week
    const day = d.getDay() || 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + 1);
    const key = monday.toISOString().slice(0, 10);
    if (!byWeek[key]) byWeek[key] = { week: key, total_cost: 0 };
    byWeek[key].total_cost += Number(entry.cost_amount) || 0;
  }
  return Object.values(byWeek).sort((a, b) => a.week.localeCompare(b.week));
}
```

### Pattern 5: Unit Display in Y-Axis
**What:** Pass `unit` string from section to chart component. Render as Y-axis label using Recharts `<YAxis label>` prop.
**When to use:** Usage mode only. In cost mode, use currency formatting instead.
**Example:**
```jsx
<YAxis
  tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
  tickLine={false}
  axisLine={false}
  tickFormatter={(v) => v.toLocaleString()}
  width={52}
  tickCount={5}
  label={viewMode === 'usage' && unit
    ? { value: unit, angle: -90, position: 'insideLeft', fontSize: 10, fill: CHART_COLORS.muted, dx: 12 }
    : undefined
  }
/>
```

### Pattern 6: Year Selector
**What:** Replace the current fixed `year = currentYear` with stateful year picker. Simple arrow-button controls or native `<select>`.
**When to use:** `StatisticsDetail.jsx` — year selection drives re-fetch.
**Example:**
```jsx
const [year, setYear] = useState(currentYear);

// Re-fetch entries when year changes
useEffect(() => {
  async function load() {
    const data = await getEntries({ section_id: sectionId, year });
    setEntries(data);
  }
  load();
}, [sectionId, year]);
```

Note: `getEntries` already accepts `year` as a filter and the backend `getEntries` service already handles `EXTRACT(YEAR FROM e.date)` filtering (confirmed in code).

### Anti-Patterns to Avoid
- **Fetching entries per meter separately:** The entries API already returns `meter_id` on each row. Filter client-side — no extra API calls needed when switching meter tabs.
- **Fetching stats for unit info:** Unit comes from `section.unit` (available via `useSections()` context) — no additional API call.
- **Hardcoding section types:** Statistics.jsx already uses `useSections()` dynamically. Don't add any `if (type === 'Water')` checks.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stacked chart | Custom SVG stacked bars | Recharts `<Area stackId>` | Recharts handles rendering, animation, tooltips |
| Date formatting | Custom date string parser | `toLocaleDateString()` with existing helpers | Already established pattern in codebase |
| Currency display | Custom format function | `useCurrency()` hook + `formatCurrency()` | Already used in StatisticsDetail |
| ISO week calculation | Custom week algorithm | ISO week formula (Monday anchor) | Simple formula, but test edge cases (year boundary) |

## Common Pitfalls

### Pitfall 1: entries.filter vs. re-fetch for meter tabs
**What goes wrong:** Fetching entries from the API each time a meter tab is clicked — causes unnecessary loading states and latency.
**Why it happens:** Developers treat each tab as a separate "page".
**How to avoid:** Fetch ALL entries for the section once (already done in current code with `getEntries({ section_id })`). Each entry row already includes `meter_id`. Filter in-memory when meter tab changes.
**Warning signs:** `useEffect` that fires on meter tab change calling `getEntries`.

### Pitfall 2: Stacked area chart tooltip shows per-stack values
**What goes wrong:** Recharts default tooltip shows each stacked area's individual value in the tooltip. Decision is to keep tooltips numeric-only (no units) and ideally only show the total.
**How to avoid:** Use a custom `content` prop on `<Tooltip>` that sums the payload values and renders only the total (matching the existing custom tooltip pattern in the codebase).

### Pitfall 3: Year filter not passed to `getEntries`
**What goes wrong:** Current code fetches all entries for a section with no year filter — works with small data but returns everything. The year selector won't work if the API call ignores `year`.
**How to avoid:** Pass `year` to `getEntries({ section_id: sectionId, year })`. The backend already supports this filter.

### Pitfall 4: Missing default limit on `getEntries`
**What goes wrong:** The controller defaults to `limit: 50` if not specified. For statistics that need full-year data, this silently truncates entries.
**How to avoid:** When fetching for statistics, explicitly pass a high limit (e.g., `limit: 500`) or pass `year` to narrow the dataset. Alternatively, the backend service accepts unlimited via explicit param — confirm with the controller code (current default is `Math.min(parseInt(limitRaw) || 50, 500)`). For year-scoped stats pass `year` — this naturally bounds the result set.

### Pitfall 5: `total_cost` vs `total` field name mismatch
**What goes wrong:** `SpendingLineChart` reads `dataKey="total_cost"` from `Statistics.jsx` monthly data, but `StatisticsDetail.jsx` uses `dataKey="total"`. These are two different derivation patterns already in the codebase.
**How to avoid:** When extending chart data derivation for usage/cost toggle, pick one consistent field name per component and keep it. Don't mix `total_cost` and `total` in the same data structure.

### Pitfall 6: Single-meter section shows unnecessary tab bar
**What goes wrong:** Showing a tab bar with only one "Main Meter" tab wastes space.
**How to avoid:** Conditionally render tab bar: `{section.meters?.length > 1 && <TabBar ... />}`.

## Code Examples

### Segmented Control (Usage / Cost Toggle)
```jsx
// Minimal segmented control — use existing Button + shadcn primitives
const MODES = [
  { value: 'usage', label: t('statistics.usage') },
  { value: 'cost', label: t('statistics.cost') },
];

<div className="flex rounded-lg border border-border/40 overflow-hidden text-xs font-medium">
  {MODES.map(({ value, label }) => (
    <button
      key={value}
      onClick={() => setViewMode(value)}
      className={cn(
        'px-3 py-1.5 transition-colors',
        viewMode === value
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </button>
  ))}
</div>
```

### Meter Tab Bar
```jsx
const tabs = [{ id: 'all', label: t('statisticsDetail.allMeters') }, ...meters];

<div className="flex gap-1 overflow-x-auto">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveMeter(tab.id)}
      className={cn(
        'px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
        activeMeter === tab.id
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {tab.label || tab.name}
    </button>
  ))}
</div>
```

### Summary Stat Card with Unit
```jsx
// Usage mode
<p className="text-2xl font-bold tabular-nums">
  {totalUsage.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{section.unit}</span>
</p>

// Cost mode
<p className="text-2xl font-bold tabular-nums">{formatCurrency(totalCost)}</p>
```

### Granularity-aware data derivation for SpendingLineChart
```jsx
// Parent passes data based on granularity
function buildChartData(entries, granularity) {
  if (granularity === 'monthly') return deriveMonthlyData(entries);
  if (granularity === 'weekly') return deriveWeeklyData(entries);
  return deriveDailyData(entries);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cost-only stats | Usage + cost in entries rows | Phase 5 / backend service | `usage_amount` now persisted per row — no schema change needed |
| Section-level stats only | Section + per-meter nested stats | getStats() already returns meters[] | Per-meter drill-down is pure UI work |
| No year filter on getEntries | `year` filter supported in backend | Already present | Year selector can simply pass `year` to existing API |

## Open Questions

1. **getEntries default limit of 50**
   - What we know: Backend controller caps at 500, defaults to 50
   - What's unclear: For a full year with multiple meters, could exceed 50 entries easily (365+ rows)
   - Recommendation: Always pass `limit=500` (or `year` + large limit) when fetching for statistics. Document this explicitly in the task.

2. **Locale-aware i18n strings for new UI**
   - What we know: `en/common.json` and `de/common.json` must be updated
   - What's unclear: German translations — need to be provided or confirmed
   - Recommendation: Planner should include a task for i18n key additions with placeholder German translations matching existing DE style.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (backend) |
| Config file | `backend/vitest.config.js` |
| Quick run command | `cd backend && npx vitest run tests/api.test.js` |
| Full suite command | `cd backend && npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| METR-03 | Per-meter entry filtering | manual (UI) | Visual verification in browser | N/A |
| METR-04 | Section aggregated stats | manual (UI) | Visual verification in browser | N/A |
| UNIT-03 | Custom unit shown in charts/cards | manual (UI) | Visual verification in browser | N/A |

**Note:** Phase 6 is entirely frontend rendering logic with no new backend endpoints or queries. The backend `getStats()` is already tested indirectly in `api.test.js`. All new behavior (tab switching, toggle, unit display) is UI-level and verified visually. No new automated tests are required beyond existing backend suite.

### Sampling Rate
- **Per task commit:** `cd backend && npx vitest run` (ensures no backend regression)
- **Per wave merge:** `cd backend && npx vitest run`
- **Phase gate:** Full suite green + visual UI verification before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers backend. Frontend has no test framework configured; visual verification is the established project pattern.

## Sources

### Primary (HIGH confidence)
- Direct code read: `backend/services/entriesService.js` — confirmed `usage_amount` in all entry rows, `getStats()` already returns per-meter totals, `getEntries()` accepts `meter_id`, `section_id`, and `year` filters
- Direct code read: `frontend/src/pages/StatisticsDetail.jsx` — confirmed existing chart patterns, `deriveMonthly`/`deriveDaily` functions, color palette, Recharts usage
- Direct code read: `frontend/src/pages/Statistics.jsx` — confirmed dynamic section rendering via `useSections()`
- Direct code read: `frontend/src/components/charts/SpendingLineChart.jsx` — confirmed monthly-only, cost-only current implementation
- Direct code read: `backend/controllers/entriesController.js` — confirmed default `limit: 50`, max 500
- Direct code read: `frontend/src/i18n/locales/en/common.json` — confirmed existing i18n keys

### Secondary (MEDIUM confidence)
- Recharts stacked area: `stackId` prop on `<Area>` is the standard Recharts pattern for stacked charts (training data; verified against multiple Recharts usage examples in codebase)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all confirmed installed and in use
- Architecture: HIGH — derived from direct reading of existing source files
- Pitfalls: HIGH — identified from actual code (limit default, field name inconsistency, year filter)
- Stacked area chart: MEDIUM — Recharts `stackId` is standard but not verified against Context7 (Recharts not in project's Context7 index)

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable codebase, no fast-moving dependencies)
