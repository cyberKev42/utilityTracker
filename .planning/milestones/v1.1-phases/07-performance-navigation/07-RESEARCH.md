# Phase 7: Performance & Navigation - Research

**Researched:** 2026-03-20
**Domain:** React SPA caching, optimistic mutations, sparkline charts
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Stale-while-revalidate pattern — pages render cached data instantly, refresh in background
- **D-02:** First Dashboard visit may show a loading state; subsequent page visits within the same session must be instant (no spinners)
- **D-03:** Data changes ~once daily, so aggressive client-side caching is safe
- **D-04:** Per-page useEffect fetching replaced with centralized data that persists across navigation
- **D-05:** Create and update mutations appear in UI within 300ms max, no spinner — brief delay acceptable
- **D-06:** Silent retry on failure (2-3 attempts), then revert changes if still failing
- **D-07:** Delete operations wait for server confirmation before removing from UI
- **D-08:** Delete button shows a subtle animation while waiting for confirmation
- **D-09:** Mutation changes in Settings propagate to Dashboard/Statistics on next visit (not immediately cross-page)
- **D-10:** Each dashboard section card has a clickable mini sparkline chart icon showing that section's actual weekly usage/cost data as a curve
- **D-11:** Clicking the sparkline navigates to `/statistics/:sectionId` — a section-specific stats view, not the dropdown-based general view
- **D-12:** Section stats page has a "Back to Statistics" button instead of a dropdown for section switching
- **D-13:** Sparkline icon has a hover effect to indicate clickability

### Claude's Discretion
- Specific caching implementation (in-memory vs localStorage for page data)
- Background refresh timing/debouncing
- Retry strategy details (delay, backoff)
- Sparkline chart library or implementation approach
- Loading skeleton vs blank space for first-visit loading
- Framer Motion transition adjustments if needed

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERF-01 | App navigates between pages without full-page reload or loading spinners — feels like a single-page app | Centralized data cache in SectionsContext + new EntriesContext eliminates per-page fetch spinners |
| PERF-02 | Creating/editing sections and meters in settings updates the UI instantly without page refresh | Optimistic mutations in SectionsContext — update local state before awaiting server |
| NAVI-01 | Clicking a section on the dashboard navigates to the statistics page with that section pre-selected | Dashboard cards link to `/statistics/:sectionId`; route already exists in App.jsx |
</phase_requirements>

---

## Summary

This phase addresses three distinct but related concerns: (1) eliminating per-page loading spinners by centralizing and caching data fetched from the API, (2) converting server-wait mutations to optimistic updates so Settings changes appear instantly, and (3) wiring Dashboard section cards to the Statistics detail page with a mini sparkline.

The core insight is that the app already has `SectionsContext` as a global data layer for sections/meters, but Dashboard, Statistics, and other pages each do their own isolated `useEffect` fetches for entries/stats data. This means every navigation triggers a new network request and a spinner. The fix is to lift entries/stats data into a new `EntriesDataContext` that fetches once, caches the result, and revalidates in the background — mirroring the `CurrencyContext` pattern already in the project (localStorage cache with TTL).

Optimistic mutations are already proven in this codebase via `reorderSections` and `reorderMeters`. Extending the same pattern to `createSection`, `updateSection`, `createMeter`, `updateMeter` is mechanical: update local state immediately, fire the API call, rollback on error. Deletes remain server-confirmed per D-07, but get an animation on the button.

For sparklines, Recharts is already installed (recharts ^3.7.0). A tiny inline `<LineChart>` or `<AreaChart>` from Recharts — without axes or tooltip — renders as a miniature curve. No new dependency needed.

**Primary recommendation:** Add `EntriesDataContext` for centralized entries/stats cache with stale-while-revalidate; convert SectionsContext create/update mutations to optimistic; add Recharts sparkline to Dashboard cards linking to `/statistics/:sectionId`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^19.1.0 | Component model + Context API | Already installed |
| react-router-dom | ^7.13.0 | SPA navigation (no page reloads) | Already installed |
| recharts | ^3.7.0 | Sparkline charts | Already installed; used for all other charts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| framer-motion | ^11.18.2 | Delete button animation | Already installed; used for all page transitions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts sparkline | react-sparklines, victory-sparkline | No new dependency with Recharts; sparklines are just a small LineChart with no axes |
| In-memory context cache | localStorage cache | In-memory is simpler and sufficient per D-03 (data changes ~once daily, session-level cache is acceptable) |
| Manual fetch + cache | TanStack Query | TanStack Query is excellent for this pattern but is a significant new dependency; the existing CurrencyContext pattern is sufficient |

---

## Architecture Patterns

### Pattern 1: Centralized Data Context with Stale-While-Revalidate

The project already has two examples of this:

1. `SectionsContext` — fetches once on mount, exposes data to all children
2. `CurrencyContext` — localStorage cache with 4-hour TTL, fetches once per session

The new `EntriesDataContext` follows the same shape:

```jsx
// Source: existing CurrencyContext + SectionsContext patterns in this codebase
export function EntriesDataProvider({ children }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [entries, setEntries] = useState([]);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);  // only true on FIRST load

  const fetchAll = useCallback(async () => {
    try {
      const [statsData, entriesData, trendData] = await Promise.all([
        getStats(),
        getEntries({ limit: 500 }),
        getTrend(),
      ]);
      setStats(statsData);
      setEntries(entriesData);
      setTrend(trendData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchAll();  // initial load; subsequent visits use cached state
  }, [user, fetchAll]);

  // Expose a refresh function for post-mutation revalidation
  const revalidate = useCallback(() => {
    // Does NOT set loading=true — background refresh, no spinner
    fetchAll();
  }, [fetchAll]);

  // ...
}
```

**Key:** `loading` is only `true` on the initial mount. Once data arrives, it stays in state across navigation. Subsequent visits to Dashboard or Statistics render immediately from context state. Background `revalidate()` runs after mutations to keep data fresh.

### Pattern 2: Optimistic Mutations

Already proven in `SectionsContext.reorderSections`. The pattern is:

```jsx
// Source: existing SectionsContext.reorderSections in this codebase
const createSection = useCallback(async (data) => {
  // 1. Optimistic: generate a temporary ID, append to local state
  const tempId = `temp-${Date.now()}`;
  const optimistic = { id: tempId, ...data, meters: [] };
  setSections((prev) => [...prev, optimistic]);
  try {
    // 2. Send to server
    const result = await sectionsService.createSection(data);
    // 3. Replace temp entry with real server response
    setSections((prev) => prev.map((s) => s.id === tempId ? result : s));
    return result;
  } catch (err) {
    // 4. Rollback
    setSections((prev) => prev.filter((s) => s.id !== tempId));
    throw err;
  }
}, []);
```

For updates, the rollback stores the previous value:

```jsx
const updateSection = useCallback(async (id, data) => {
  const previous = sections.find((s) => s.id === id);
  setSections((prev) => prev.map((s) => s.id === id ? { ...s, ...data } : s));
  try {
    const result = await sectionsService.updateSection(id, data);
    // Replace with server truth
    setSections((prev) => prev.map((s) => s.id === id ? result : s));
    return result;
  } catch (err) {
    setSections((prev) => prev.map((s) => s.id === id ? previous : s));
    throw err;
  }
}, [sections]);
```

**Deletes remain server-confirmed** (D-07). Only the button gets a loading/animation state — the item stays in the list until the server confirms removal.

### Pattern 3: Retry with Backoff (D-06)

Simple exponential backoff utility, no library needed:

```js
async function withRetry(fn, attempts = 3, delayMs = 400) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, i)));
    }
  }
}
```

### Pattern 4: Recharts Sparkline

Recharts `<LineChart>` with no axes, no tooltip, no grid, fixed small dimensions renders as a clean sparkline:

```jsx
// Source: Recharts docs — LineChart without axes
import { LineChart, Line, ResponsiveContainer } from 'recharts';

function Sparkline({ data, color }) {
  // data: [{ value: number }, ...]
  return (
    <ResponsiveContainer width={48} height={24}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Data source:** The `entries` array already fetched into `EntriesDataContext` — filter by `section_id`, group by week (last 7 weeks), sum `usage_amount` or `cost_amount`. This reuses the `deriveWeeklyData` function already in `Statistics.jsx`.

### Recommended Project Structure Changes

No new directories needed. Changes are additive:

```
frontend/src/
├── context/
│   ├── SectionsContext.jsx     # MODIFY: optimistic create/update/delete mutations
│   └── EntriesDataContext.jsx  # NEW: centralized stats + entries cache
├── pages/
│   ├── Dashboard.jsx           # MODIFY: consume EntriesDataContext, add sparklines
│   ├── Statistics.jsx          # MODIFY: consume EntriesDataContext (no local fetch)
│   └── StatisticsDetail.jsx    # MODIFY: entries fetched from context or per-section cache
```

### Anti-Patterns to Avoid

- **Loading=true on background refresh:** If `revalidate()` sets `loading=true`, every mutation causes a full-page spinner. Only set `loading=true` on the very first fetch.
- **Race conditions with optimistic rollbacks:** Always capture `previous` state before mutation, not after. The functional updater `setSections(prev => ...)` pattern is safer than capturing `sections` directly in closures.
- **Sparkline re-fetching on every card render:** Derive sparkline data inside `useMemo` keyed on the entries array, not inside the render body.
- **StatisticsDetail context mismatch:** `StatisticsDetail` fetches per-`sectionId` + `year`. That parameterized data is NOT suitable for the global entries cache — it should remain a local fetch with its own loading state. Only the global stats/entries (no `sectionId` filter, current year) go into `EntriesDataContext`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sparkline chart | Custom SVG path generator | Recharts LineChart (already installed) | Edge cases: empty data, single point, negative values |
| Data cache TTL | Custom timer/interval system | Simple `fetchedAt` timestamp check (same as CurrencyContext) | Already proven in project |
| Retry logic | npm retry library | 10-line `withRetry` utility | No dependency, sufficient for 2-3 attempts |

---

## Common Pitfalls

### Pitfall 1: SectionsContext renders a full-screen spinner while loading
**What goes wrong:** `SectionsContext` currently returns a full-screen spinner when `loading === true` (lines 178-184 of SectionsContext.jsx). After making mutations optimistic, a `fetchSections()` call would set `loading=true` and flash a full-screen spinner.
**Why it happens:** The existing `loading` guard is at the provider level.
**How to avoid:** Remove the full-screen spinner from `SectionsContext` entirely once mutations are optimistic. The initial load spinner (while sections first arrive) can remain if needed, but mutations must never trigger it. Alternatively, add a separate `initializing` flag distinct from `loading`.
**Warning signs:** Any mutation in Settings causes the entire app to go blank momentarily.

### Pitfall 2: EntriesDataContext providing stale data after mutation
**What goes wrong:** User adds a new entry, but Dashboard still shows old stats because `EntriesDataContext` hasn't revalidated.
**Why it happens:** The context caches data and only refreshes on initial load.
**How to avoid:** `EntriesDataContext` must expose a `revalidate()` function. Call it after any mutation that affects stats (entry create/delete). `AddEntry` page already has a `createEntry` call — after success, call `revalidate()`.
**Warning signs:** Dashboard shows outdated total cost after adding an entry.

### Pitfall 3: Sparkline data shape mismatch
**What goes wrong:** Recharts `<Line dataKey="value">` renders nothing because the data objects use a different key.
**Why it happens:** `deriveWeeklyData` returns `{ month: string, total_cost: number }` — the key is `total_cost`, not `value`.
**How to avoid:** Either use `dataKey="total_cost"` in the sparkline, or normalize to `{ value }` when building sparkline data. Be explicit about the key.
**Warning signs:** Sparkline renders as a flat zero line.

### Pitfall 4: StatisticsDetail duplicate-fetch conflict
**What goes wrong:** `StatisticsDetail` reads from `EntriesDataContext` (all entries) but needs entries filtered by `sectionId` and `year`. Filtering all entries client-side works only if all entries are loaded.
**Why it happens:** `EntriesDataContext` fetches with `limit: 500` which may not include all historical entries.
**How to avoid:** Keep `StatisticsDetail`'s per-section, per-year fetch local (as it currently is). `EntriesDataContext` only serves Dashboard and the general Statistics page. This is consistent with D-09 (cross-page propagation only on next visit).
**Warning signs:** StatisticsDetail shows incomplete chart data for users with >500 entries.

---

## Code Examples

### Remove full-screen spinner from SectionsContext

```jsx
// In SectionsContext.jsx — remove the early return block at lines 178-196
// Before (REMOVE):
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin ..." />
    </div>
  );
}

// After: let children render; individual pages handle their own skeleton/empty state
// SectionsContext should never block the entire render tree after initial hydration
```

### Dashboard consuming EntriesDataContext

```jsx
// Dashboard.jsx — replace local useEffect fetch with context
import { useEntriesData } from '../hooks/useEntriesData';

export default function Dashboard() {
  const { stats, entries: recentEntries, trend, loading } = useEntriesData();
  // loading is only true on first session load — subsequent navigations: false
  // ...render immediately with cached data
}
```

### Delete button animation pattern (D-08)

```jsx
const [deleting, setDeleting] = useState(false);

const handleDelete = async () => {
  setDeleting(true);
  try {
    await deleteSection(id);
  } finally {
    setDeleting(false);
  }
};

// Button:
<Button
  variant="destructive"
  disabled={deleting}
  className={deleting ? 'opacity-60' : ''}
>
  {deleting
    ? <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1 }}>Deleting…</motion.span>
    : 'Delete'}
</Button>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-page useEffect fetches | Centralized context with SWR pattern | React 16+ (hooks era) | Eliminates per-navigation spinners |
| Server-wait mutations | Optimistic updates with rollback | Standard since ~2019 | Sub-300ms UI response |

---

## Open Questions

1. **Should `EntriesDataContext` serve `StatisticsDetail`?**
   - What we know: `StatisticsDetail` needs entries filtered by `sectionId` + `year`, currently fetches locally
   - What's unclear: Whether a 500-entry limit in the global cache would silently truncate data for power users
   - Recommendation: Keep `StatisticsDetail` local fetch. Only Dashboard + Statistics (global) consume `EntriesDataContext`.

2. **Sparkline: usage or cost mode?**
   - What we know: D-10 says "actual weekly usage/cost data" — both are valid
   - What's unclear: Which is more meaningful as a tiny icon-level chart
   - Recommendation: Use `usage_amount` (unit-based) as default since it's more concrete; it's just a visual indicator, not a precise chart.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No test framework detected in package.json |
| Config file | None |
| Quick run command | N/A — no tests configured |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-01 | Navigate Dashboard → Statistics → Settings without spinner | manual smoke | N/A | ❌ |
| PERF-02 | Create section in Settings → appears instantly, no reload | manual smoke | N/A | ❌ |
| NAVI-01 | Click section card on Dashboard → lands on `/statistics/:sectionId` | manual smoke | N/A | ❌ |

### Sampling Rate
- **Per task commit:** Manual browser check — navigate between pages, confirm no spinner appears on second visit
- **Per wave merge:** Full manual smoke of all 3 success criteria
- **Phase gate:** All 3 success criteria verified manually before `/gsd:verify-work`

### Wave 0 Gaps
- No test infrastructure exists. All validation is manual browser testing.
- Recommend verifying with the dev server (`npm run dev` in `frontend/`) after each task.

*(No automated test infrastructure — all validation is manual smoke testing via browser.)*

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `SectionsContext.jsx`, `CurrencyContext.jsx`, `Dashboard.jsx`, `Statistics.jsx`, `StatisticsDetail.jsx`, `App.jsx` — architecture patterns, existing code, integration points
- `frontend/package.json` — confirmed recharts ^3.7.0, framer-motion ^11.18.2, react-router-dom ^7.13.0 already installed
- `7-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- Recharts LineChart API (sparkline pattern) — standard usage, confirmed by direct inspection of how recharts is already used in SpendingLineChart/StatisticsDetail

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, versions confirmed from package.json
- Architecture: HIGH — patterns are extensions of existing code already in the project
- Pitfalls: HIGH — identified by direct inspection of existing code (SectionsContext spinner, entry limits)

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable React/Recharts patterns)
