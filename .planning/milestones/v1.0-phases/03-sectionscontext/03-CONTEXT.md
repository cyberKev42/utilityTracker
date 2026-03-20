# Phase 3: SectionsContext - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Global frontend state layer that fetches the sections+meters tree from the backend API and exposes it to all authenticated pages via React Context. Includes mutation functions for all section/meter CRUD operations. No UI pages are built in this phase — only the context provider, consumer hook, and frontend service layer.

</domain>

<decisions>
## Implementation Decisions

### State management approach
- Plain React Context with useState + useEffect — no new dependencies (no TanStack Query, no SWR)
- Matches existing AuthContext/LanguageContext pattern
- Context exposes mutation functions (createSection, updateSection, deleteSection, etc.) that call API and auto-refresh state
- New `frontend/src/services/sectionsService.js` service file sits between context and api.js — matches existing entriesService.js/settingsService.js pattern
- Context also exposes helper lookups: getSectionById(), getMeterById(), getSectionForMeter()
- Context wraps inside ProtectedRoute (not top-level App.jsx) — only fetches when authenticated
- Sections+meters only — no entry-related state (last reading, etc.)
- Auto-clear sections and refetch on auth state change (logout/login) to prevent stale data between sessions

### Mutation strategy
- Hybrid approach: wait for server on structural changes (create, delete, archive), optimistic on cosmetic changes (reorder, rename)
- Optimistic reorder: if server rejects, revert to previous order + show error toast
- Mutation functions return promises so pages can await them, show local spinners, and handle errors
- No global "mutating" flag — each page tracks its own loading state from the returned promise

### Loading & error states
- Block rendering with full-page spinner until initial sections fetch completes (small payload, fast load)
- On fetch failure: show error banner with "Retry" button instead of page content
- Expose simple `loading` and `error` booleans (not status enum) — matches AuthContext pattern

### Archived sections
- Default fetch excludes archived sections (GET /api/sections without query param)
- Context exposes a fetchWithArchived() helper for when Settings page needs archived sections (on-demand, not cached)
- Archive mutation waits for server confirmation, then refetches — consistent with "server-wait for structural changes" decision

### Claude's Discretion
- Exact context value shape and memoization strategy
- Whether to use useReducer vs multiple useState calls internally
- Error toast implementation (new component or reuse existing pattern)
- Retry logic details for the error banner

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/REQUIREMENTS.md` — Phase 3 has no direct v1 requirements but enables all UI phases (4-6)
- `.planning/ROADMAP.md` — Phase 3 success criteria (3 conditions that must be TRUE)
- `.planning/PROJECT.md` — Key decisions table, tech stack constraints

### Prior phase decisions (schema and API this context builds on)
- `.planning/phases/01-schema-migration/01-CONTEXT.md` — Schema decisions: sections/meters tables, archived_at column, entry mode per-meter
- `.planning/phases/02-backend-services/02-CONTEXT.md` — API contract: GET /api/sections returns nested tree, CRUD endpoints, reorder mechanism, archive/delete behavior, ?include_archived=true

### Existing frontend code (patterns to follow)
- `frontend/src/context/AuthContext.jsx` — Context + provider pattern to replicate
- `frontend/src/hooks/useAuth.js` — Consumer hook pattern to replicate
- `frontend/src/api.js` — Fetch wrapper with auth headers (all API calls go through this)
- `frontend/src/services/entriesService.js` — Frontend service layer pattern to replicate
- `frontend/src/App.jsx` — Provider nesting order and ProtectedRoute integration point

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/api.js` — Centralized fetch wrapper with auth; all section API calls go through this
- `frontend/src/context/AuthContext.jsx` — Template for context provider pattern (createContext, useState, useEffect, provider value)
- `frontend/src/hooks/useAuth.js` — Template for consumer hook pattern
- `frontend/src/services/entriesService.js` — Template for frontend service layer
- `frontend/src/components/ui/` — Radix/shadcn primitives available for error banner UI

### Established Patterns
- Context providers wrap app in App.jsx with dedicated consumer hooks
- Frontend services abstract API endpoints behind named functions
- `loading` boolean pattern for async state (used in AuthContext)
- ES6 modules with named exports for services, default exports for pages

### Integration Points
- `frontend/src/App.jsx` — SectionsProvider wraps inside ProtectedRoute/MainLayout
- `frontend/src/context/` — New SectionsContext.jsx file
- `frontend/src/hooks/` — New useSections.js consumer hook
- `frontend/src/services/` — New sectionsService.js
- AuthContext — Listen for auth changes to clear/refetch sections

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-sectionscontext*
*Context gathered: 2026-03-19*
