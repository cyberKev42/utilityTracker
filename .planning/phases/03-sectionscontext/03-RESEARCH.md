# Phase 3: SectionsContext - Research

**Researched:** 2026-03-19
**Domain:** React Context, frontend service layer, optimistic updates
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Plain React Context with useState + useEffect — no new dependencies (no TanStack Query, no SWR)
- Matches existing AuthContext/LanguageContext pattern
- Context exposes mutation functions (createSection, updateSection, deleteSection, etc.) that call API and auto-refresh state
- New `frontend/src/services/sectionsService.js` service file sits between context and api.js — matches existing entriesService.js/settingsService.js pattern
- Context also exposes helper lookups: getSectionById(), getMeterById(), getSectionForMeter()
- Context wraps inside ProtectedRoute (not top-level App.jsx) — only fetches when authenticated
- Sections+meters only — no entry-related state (last reading, etc.)
- Auto-clear sections and refetch on auth state change (logout/login) to prevent stale data between sessions
- Hybrid mutation strategy: wait for server on structural changes (create, delete, archive), optimistic on cosmetic changes (reorder, rename)
- Optimistic reorder: if server rejects, revert to previous order + show error toast
- Mutation functions return promises so pages can await them, show local spinners, and handle errors
- No global "mutating" flag — each page tracks its own loading state from the returned promise
- Block rendering with full-page spinner until initial sections fetch completes
- On fetch failure: show error banner with "Retry" button instead of page content
- Expose simple `loading` and `error` booleans (not status enum) — matches AuthContext pattern
- Default fetch excludes archived sections (GET /api/sections without query param)
- Context exposes a fetchWithArchived() helper for when Settings page needs archived sections (on-demand, not cached)
- Archive mutation waits for server confirmation, then refetches

### Claude's Discretion
- Exact context value shape and memoization strategy
- Whether to use useReducer vs multiple useState calls internally
- Error toast implementation (new component or reuse existing pattern)
- Retry logic details for the error banner

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 3 builds the frontend state layer for sections and meters. The decisions are fully locked: plain React Context with useState/useEffect, a sectionsService.js sitting between context and api.js, and a useSections.js consumer hook. No new libraries are needed — all patterns exist in the codebase already (AuthContext, CurrencyContext, entriesService.js).

The most non-trivial design challenge is the hybrid mutation strategy: some mutations are optimistic (reorder, rename) with rollback on server rejection, others wait for server confirmation before updating state (create, delete, archive). This requires careful state snapshot management for the rollback case.

Integration with AuthContext is the other key concern: the context must watch for user changes (via useAuth) and clear/refetch sections when the user logs in or switches. CurrencyContext demonstrates this pattern directly — it uses `useEffect(() => { if (!user) return; ... }, [user])` to scope data loading to authenticated users.

**Primary recommendation:** Mirror CurrencyContext for the overall structure (useAuth inside provider, effect on user change), and AuthContext for the loading/error boolean pattern. Use useReducer internally for cleaner optimistic rollback handling.

---

## Standard Stack

### Core (no new installs needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (createContext, useState, useEffect, useCallback, useReducer, useMemo) | Already installed | Context + state | Project uses React throughout |
| `frontend/src/api.js` | Existing | Auth-aware fetch wrapper | All API calls go through this |

### Supporting
| Library | Purpose | When to Use |
|---------|---------|-------------|
| Radix/shadcn components in `frontend/src/components/ui/` | Error banner UI (Alert/Card + Button) | For the fetch-failure banner with Retry |

**Installation:** None required — all dependencies exist.

---

## Architecture Patterns

### Recommended File Structure
```
frontend/src/
├── context/
│   └── SectionsContext.jsx    # Provider + createContext
├── hooks/
│   └── useSections.js         # Consumer hook (mirrors useAuth.js)
└── services/
    └── sectionsService.js     # API calls (mirrors entriesService.js)
```

### Pattern 1: Provider using useAuth for auth-scoped fetching
**What:** Context provider calls useAuth, listens to user changes, clears and refetches when user changes.
**When to use:** Any context that holds per-user server data.
**Example (based on CurrencyContext.jsx):**
```jsx
// Source: frontend/src/context/CurrencyContext.jsx — adapted
import { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as sectionsService from '../services/sectionsService';

export const SectionsContext = createContext(null);

export function SectionsProvider({ children }) {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sectionsService.getSections();
      setSections(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setSections([]);
      setLoading(false);
      return;
    }
    fetchSections();
  }, [user, fetchSections]);

  // ...mutations...

  return (
    <SectionsContext.Provider value={{ sections, loading, error, retry: fetchSections }}>
      {children}
    </SectionsContext.Provider>
  );
}
```

### Pattern 2: Consumer hook (mirrors useAuth.js exactly)
```js
// Source: frontend/src/hooks/useAuth.js — mirrored
import { useContext } from 'react';
import { SectionsContext } from '../context/SectionsContext';

export function useSections() {
  const context = useContext(SectionsContext);
  if (!context) {
    throw new Error('useSections must be used within a SectionsProvider');
  }
  return context;
}
```

### Pattern 3: Service layer (mirrors entriesService.js exactly)
```js
// Source: frontend/src/services/entriesService.js — mirrored
import { api } from '../api';

export async function getSections() {
  return api.get('/api/sections');
}

export async function getSectionsWithArchived() {
  return api.get('/api/sections?include_archived=true');
}

export async function createSection(data) {
  return api.post('/api/sections', data);
}

export async function updateSection(id, data) {
  return api.put(`/api/sections/${id}`, data);
}

export async function deleteSection(id) {
  return api.delete(`/api/sections/${id}`);
}

export async function archiveSection(id) {
  return api.put(`/api/sections/${id}/archive`);
}

export async function reorderSections(order) {
  return api.put('/api/sections/reorder', { order });
}

export async function createMeter(sectionId, data) {
  return api.post(`/api/sections/${sectionId}/meters`, data);
}

export async function updateMeter(meterId, data) {
  return api.put(`/api/meters/${meterId}`, data);
}

export async function deleteMeter(meterId) {
  return api.delete(`/api/meters/${meterId}`);
}

export async function reorderMeters(sectionId, order) {
  return api.put(`/api/sections/${sectionId}/meters/reorder`, { order });
}
```

### Pattern 4: Optimistic mutation with rollback
**What:** Save current state snapshot before applying optimistic update. On server rejection, restore snapshot and show error toast.
**When to use:** Reorder and rename mutations per locked decision.
```jsx
const reorderSections = useCallback(async (newOrder) => {
  const previous = sections; // snapshot
  setSections(newOrder);     // optimistic
  try {
    await sectionsService.reorderSections(newOrder.map(s => s.id));
  } catch (err) {
    setSections(previous);   // rollback
    // show error toast — implementation at caller's discretion
    throw err;
  }
}, [sections]);
```

### Pattern 5: Server-wait mutation (create/delete/archive)
```jsx
const createSection = useCallback(async (data) => {
  const result = await sectionsService.createSection(data);
  await fetchSections(); // refetch to get server state
  return result;
}, [fetchSections]);
```

### Pattern 6: Helper lookups in context value
```jsx
const getSectionById = useCallback((id) =>
  sections.find(s => s.id === id) ?? null,
[sections]);

const getMeterById = useCallback((id) => {
  for (const section of sections) {
    const meter = section.meters?.find(m => m.id === id);
    if (meter) return meter;
  }
  return null;
}, [sections]);

const getSectionForMeter = useCallback((meterId) =>
  sections.find(s => s.meters?.some(m => m.id === meterId)) ?? null,
[sections]);
```

### Pattern 7: Provider placement in App.jsx
**What:** SectionsProvider wraps inside ProtectedRoute so it only mounts for authenticated users.
**Current App.jsx structure** has ProtectedRoute wrapping MainLayout. SectionsProvider should wrap MainLayout (or go inside ProtectedRoute's children) to avoid fetching for unauthenticated routes.

```jsx
// In App.jsx — add SectionsProvider import and wrap inside ProtectedRoute
<Route
  element={
    <ProtectedRoute>
      <SectionsProvider>
        <MainLayout />
      </SectionsProvider>
    </ProtectedRoute>
  }
>
```

Note: SectionsProvider uses useAuth internally, so it must be a descendant of AuthProvider. AuthProvider is at App root — this is already satisfied.

### Pattern 8: Error banner with Retry
**What:** Full-page replacement when initial fetch fails. Uses existing shadcn Card/Button primitives.
```jsx
if (error) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-destructive">Failed to load sections</p>
        <Button onClick={retry}>Retry</Button>
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **fetchWithArchived() caching the result:** Decision says on-demand, not cached. Return data directly from the call, do not merge into context state.
- **Global loading flag for mutations:** Decision says no global "mutating" flag — return the promise, let callers manage their own loading state.
- **Fetching outside SectionsProvider:** Phase success criterion #3 — no page should call `/api/sections` directly. All access through useSections().
- **Wrapping SectionsProvider above AuthProvider:** SectionsProvider depends on useAuth, so it must be below AuthProvider in the tree.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth-aware API calls | Custom fetch with token logic | `api.js` (existing) | Already handles Supabase token retrieval and error normalization |
| Sections API endpoints | Direct fetch calls | `sectionsService.js` (new, pattern from entriesService.js) | Centralizes endpoint strings, makes mocking easy for tests |

---

## Common Pitfalls

### Pitfall 1: useEffect dependency array with fetchSections
**What goes wrong:** If `fetchSections` is defined inside the component without useCallback, it re-creates on every render, causing an infinite fetch loop when placed in `useEffect([user, fetchSections])`.
**Why it happens:** New function reference on each render triggers the effect.
**How to avoid:** Wrap `fetchSections` in `useCallback` with stable dependencies (empty `[]` since it uses only `api.js` which is stable).
**Warning signs:** Network tab showing continuous GET /api/sections requests.

### Pitfall 2: Stale sections after optimistic rollback
**What goes wrong:** Snapshot is taken from a stale closure — if two optimistic updates fire in quick succession, the second rollback restores the pre-first-update state.
**Why it happens:** Closures capture `sections` at time of creation, not at rollback time.
**How to avoid:** Use functional setState form for rollback (`setSections(() => previous)`) and ensure mutations are not parallelized at the UI level. Since no global mutating flag exists, document that callers should await one mutation before firing another.

### Pitfall 3: SectionsProvider inside Router but outside AuthProvider
**What goes wrong:** `useAuth()` throws "must be used within an AuthProvider".
**Why it happens:** Wrong provider nesting order.
**How to avoid:** AuthProvider is at the root of App.jsx — SectionsProvider anywhere below it is safe. Never move SectionsProvider above AuthProvider.

### Pitfall 4: fetchWithArchived result leaking into context state
**What goes wrong:** Archived sections become visible in normal page views after Settings page calls fetchWithArchived.
**Why it happens:** If fetchWithArchived calls setSections, it overwrites the filtered list.
**How to avoid:** fetchWithArchived must return data directly without touching context state. It's a one-shot fetch for the caller.

### Pitfall 5: loading=true blocking render when user logs out
**What goes wrong:** After logout user is null, but loading stays true, showing an infinite spinner.
**Why it happens:** The useEffect clears sections but forgets to setLoading(false).
**How to avoid:** In the `if (!user)` branch: setSections([]), setLoading(false), setError(null).

---

## Code Examples

### Complete SectionsContext.jsx skeleton
```jsx
// Based on: frontend/src/context/AuthContext.jsx + CurrencyContext.jsx patterns
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as sectionsService from '../services/sectionsService';

export const SectionsContext = createContext(null);

export function SectionsProvider({ children }) {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sectionsService.getSections();
      setSections(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setSections([]);
      setError(null);
      setLoading(false);
      return;
    }
    fetchSections();
  }, [user, fetchSections]);

  // Server-wait mutations
  const createSection = useCallback(async (data) => {
    const result = await sectionsService.createSection(data);
    await fetchSections();
    return result;
  }, [fetchSections]);

  // Optimistic mutation with rollback
  const reorderSections = useCallback(async (newOrder) => {
    const previous = sections;
    setSections(newOrder);
    try {
      await sectionsService.reorderSections(newOrder.map(s => s.id));
    } catch (err) {
      setSections(previous);
      throw err;
    }
  }, [sections]);

  // Helper lookups
  const getSectionById = useCallback((id) =>
    sections.find(s => s.id === id) ?? null, [sections]);

  const getMeterById = useCallback((id) => {
    for (const section of sections) {
      const meter = section.meters?.find(m => m.id === id);
      if (meter) return meter;
    }
    return null;
  }, [sections]);

  const getSectionForMeter = useCallback((meterId) =>
    sections.find(s => s.meters?.some(m => m.id === meterId)) ?? null,
  [sections]);

  // On-demand, does NOT update context state
  const fetchWithArchived = useCallback(async () => {
    return sectionsService.getSectionsWithArchived();
  }, []);

  const value = useMemo(() => ({
    sections,
    loading,
    error,
    retry: fetchSections,
    createSection,
    reorderSections,
    getSectionById,
    getMeterById,
    getSectionForMeter,
    fetchWithArchived,
    // ... other mutations
  }), [sections, loading, error, fetchSections, createSection, reorderSections,
      getSectionById, getMeterById, getSectionForMeter, fetchWithArchived]);

  return (
    <SectionsContext.Provider value={value}>
      {children}
    </SectionsContext.Provider>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Per-page API fetches | Single shared context | Eliminates duplicate requests, consistent state across pages |
| Global loading flag for mutations | Promise-returning mutations (caller-managed loading) | Pages can show granular spinners without context coupling |

---

## Open Questions

1. **useReducer vs multiple useState**
   - What we know: Both work. useReducer makes optimistic rollback cleaner (dispatch ROLLBACK action with snapshot).
   - What's unclear: Whether complexity justifies useReducer for this scope.
   - Recommendation: Start with multiple useState (simpler, matches AuthContext). Only switch to useReducer if rollback logic becomes unwieldy during implementation.

2. **Error toast for optimistic rollback**
   - What we know: No existing toast/notification component found in `frontend/src/components/ui/`.
   - What's unclear: Whether to add a new toast component or use browser alert as placeholder.
   - Recommendation: Check if shadcn Toaster is available; if not, a simple inline error state on the returned error from the thrown promise is sufficient — pages can display it.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (backend only — no frontend test setup detected) |
| Config file | `backend/vitest.config.js` |
| Quick run command | `cd backend && npx vitest run` |
| Full suite command | `cd backend && npx vitest run` |

### Phase Requirements → Test Map

Phase 3 has no direct v1 requirements (infrastructure phase). Validation is behavioral:

| Behavior | Test Type | Notes |
|----------|-----------|-------|
| SectionsContext exposes sections+meters tree | Manual smoke | No frontend test framework exists; verify in browser |
| Mutation functions invalidate and refresh state | Manual smoke | Create/delete section, verify context updates |
| No individual page fetches /api/sections outside context | Code review | Grep for `api.get('/api/sections')` outside SectionsContext.jsx |

### Wave 0 Gaps
- No frontend test framework (Vitest/Jest + React Testing Library) is configured.
- For this phase: validation is manual smoke testing + code review grep.
- If frontend unit tests are desired in future phases: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom` + vitest.config.js in `frontend/`.

*(Note: Adding frontend test infrastructure is out of scope for Phase 3 per phase boundary.)*

---

## Sources

### Primary (HIGH confidence)
- `frontend/src/context/AuthContext.jsx` — Definitive context pattern for this project
- `frontend/src/context/CurrencyContext.jsx` — Definitive pattern for auth-scoped data fetching (useAuth + user effect)
- `frontend/src/hooks/useAuth.js` — Consumer hook template
- `frontend/src/services/entriesService.js` — Service layer template
- `frontend/src/App.jsx` — Provider nesting order; ProtectedRoute integration point
- `.planning/phases/03-sectionscontext/03-CONTEXT.md` — All mutation and loading decisions locked here
- `.planning/phases/02-backend-services/02-CONTEXT.md` — API contract (endpoint paths, reorder body shape, archive behavior)

### Secondary (MEDIUM confidence)
- React documentation (createContext, useCallback, useMemo, useReducer) — standard APIs, no staleness risk

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all patterns directly observable in codebase
- Architecture: HIGH — all decisions locked in CONTEXT.md, existing code confirms patterns
- Pitfalls: HIGH — derived from direct code reading and locked decisions, not inference

**Research date:** 2026-03-19
**Valid until:** Stable — decisions are locked, no fast-moving dependencies
