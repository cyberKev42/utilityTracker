# Phase 7: Performance & Navigation - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

The app feels instant — no page reloads between routes and no refresh required after settings changes. Dashboard section cards link to statistics for that section.

Requirements: PERF-01, PERF-02, NAVI-01

</domain>

<decisions>
## Implementation Decisions

### Data fetching strategy
- **D-01:** Stale-while-revalidate pattern — pages render cached data instantly, refresh in background
- **D-02:** First Dashboard visit may show a loading state; subsequent page visits within the same session must be instant (no spinners)
- **D-03:** Data changes ~once daily, so aggressive client-side caching is safe
- **D-04:** Per-page useEffect fetching replaced with centralized data that persists across navigation

### Optimistic mutations
- **D-05:** Create and update mutations appear in UI within 300ms max, no spinner — brief delay acceptable
- **D-06:** Silent retry on failure (2-3 attempts), then revert changes if still failing
- **D-07:** Delete operations wait for server confirmation before removing from UI
- **D-08:** Delete button shows a subtle animation while waiting for confirmation
- **D-09:** Mutation changes in Settings propagate to Dashboard/Statistics on next visit (not immediately cross-page)

### Dashboard-to-statistics linking
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

</decisions>

<specifics>
## Specific Ideas

- Mini sparkline on dashboard cards should display the actual data curve (real weekly usage/cost), not a placeholder — this is a distinctive visual element
- Delete button animation should feel purposeful (not just a generic spinner)

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above and in:

### Project specs
- `.planning/REQUIREMENTS.md` — PERF-01, PERF-02, NAVI-01 requirement definitions
- `.planning/ROADMAP.md` — Phase 7 success criteria (3 criteria)
- `.planning/PROJECT.md` — Tech stack constraints (React + Express + PostgreSQL)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SectionsContext` (`frontend/src/context/SectionsContext.jsx`): Already manages sections/meters state centrally, already has optimistic reorder — extend pattern to other mutations
- `api.js` (`frontend/src/api.js`): Custom fetch wrapper with JWT auth — mutations go through here
- `CurrencyContext`: Already caches exchange rates in localStorage with 4-hour TTL — similar pattern usable for page data
- Framer Motion page transitions already in place in layouts

### Established Patterns
- Context API + custom hooks (`useAuth()`, `useSections()`, `useCurrency()`, `useLanguage()`) — new caching layer should follow this pattern
- Optimistic update with rollback already implemented for section/meter reordering in SectionsContext
- Route `/statistics/:sectionId` already exists in App.jsx router config

### Integration Points
- `SectionsContext` mutations (`createSection`, `updateSection`, `deleteSection`, `createMeter`, `updateMeter`, `deleteMeter`) — convert from server-wait to optimistic (except delete)
- Dashboard page (`frontend/src/pages/Dashboard.jsx`) — add sparkline icons to section cards
- Statistics page (`frontend/src/pages/Statistics.jsx`) — handle `:sectionId` param for section-specific view + back button
- Per-page loading states in Dashboard, Statistics, Entries — replace with cached data pattern

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-performance-navigation*
*Context gathered: 2026-03-20*
