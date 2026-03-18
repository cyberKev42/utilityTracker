# Codebase Concerns

**Analysis Date:** 2026-03-18

## Tech Debt

**No Test Coverage:**
- Issue: The project has zero automated tests across frontend and backend
- Files: `frontend/`, `backend/`
- Impact: Cannot safely refactor, cannot catch regressions, cannot verify edge cases
- Fix approach: Implement unit tests for services (Jest/Vitest), integration tests for API endpoints, component tests for React pages

**Debug Code in Production:**
- Issue: Console.log left in codebase before build
- Files: `frontend/src/main.jsx` (line 7)
- Impact: Noisy logs in production, unprofessional appearance
- Fix approach: Remove all console.log/debug statements, use proper logging framework if needed

**Manual State Synchronization:**
- Issue: No centralized state management; multiple components load same data independently
- Files: `frontend/src/pages/Dashboard.jsx`, `frontend/src/pages/AddEntry.jsx`, `frontend/src/pages/Statistics.jsx`
- Impact: Potential for stale data, race conditions on concurrent updates, no cache invalidation strategy
- Fix approach: Consider React Query or Redux for data fetching and caching, implement cache invalidation after mutations

## Known Bugs

**Cost Calculation State Bug (Potential):**
- Symptoms: Manual cost override may not persist correctly across component re-renders if dependencies change
- Files: `frontend/src/pages/AddEntry.jsx` (lines 61-75, 128-135)
- Trigger: User manually sets cost, then changes usage or unit price rapidly
- Workaround: Form resets between submissions, so issue only manifests within single entry session
- Root cause: `manualCost` flag and auto-calculation logic could race if autoCalculate effect fires at wrong time

**Missing Error Boundaries:**
- Symptoms: Component crashes on data fetch errors display generic error state, but no error boundary wraps tree
- Files: `frontend/src/pages/Dashboard.jsx` (line 72-73), `frontend/src/pages/Entries.jsx` (line 86)
- Trigger: Unhandled promise rejection if API call fails in unexpected way
- Current mitigation: Try/catch in load functions, but no boundary for synchronous render errors
- Recommendation: Add React Error Boundary wrapper in `frontend/src/layouts/MainLayout.jsx`

## Security Considerations

**Weak SSL Configuration:**
- Risk: Database connection uses `ssl: { rejectUnauthorized: false }` which bypasses certificate validation
- Files: `backend/db.js` (line 62)
- Current mitigation: Only applies to database connections, not exposed to users
- Recommendations: Use proper certificate validation in production. Set `rejectUnauthorized: true` when SSL certificates are properly configured. Document why this is necessary (e.g., Supabase self-signed certs).

**Missing CSRF Protection:**
- Risk: No CSRF tokens on form submissions; relies only on Authorization header
- Files: `frontend/src/api.js`, `backend/server.js`
- Current mitigation: Uses Bearer token auth which is more resistant to CSRF, but still vulnerable to cross-origin attacks
- Recommendations: Either enforce SameSite cookies or add CSRF token verification for state-changing operations

**Plaintext Database Errors:**
- Risk: Database error details exposed to clients in some error paths
- Files: `backend/controllers/entriesController.js` (lines 81, 123, 144, 156)
- Current mitigation: Errors are generic ("Failed to create entry"), database-specific errors are not leaked
- Recommendations: Keep current approach - do not expose database error messages to clients

**No Input Rate Limiting:**
- Risk: No rate limiting on API endpoints allows abuse (create many entries, fetch repeatedly)
- Files: `backend/server.js`
- Current mitigation: None
- Recommendations: Add express-rate-limit or similar middleware on POST/DELETE endpoints

**Supabase Client Misconfiguration Risk:**
- Risk: If VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are not set, authentication silently fails
- Files: `frontend/src/lib/supabase.js`
- Current mitigation: Frontend gracefully degrades but allows login attempts that will fail
- Recommendations: Add startup check that warns if Supabase is not configured; prevent app from initializing without auth provider

## Performance Bottlenecks

**N+1 Query Pattern Risk:**
- Problem: Dashboard fetches stats, entries, and trend in parallel, but each requires separate database query
- Files: `frontend/src/pages/Dashboard.jsx` (lines 64-68)
- Cause: Service functions don't batch queries; each endpoint hits database separately
- Improvement path: Combine stats and trend into single API endpoint to reduce roundtrips

**Inefficient Chart Re-renders:**
- Problem: Charts in StatisticsDetail render entire chart on every prop change
- Files: `frontend/src/pages/StatisticsDetail.jsx` (lines 150-200)
- Cause: No memoization of chart components; Recharts can be expensive on large datasets
- Improvement path: Memoize chart components with React.memo, use useMemo for chart data transformation

**No Pagination on Entries:**
- Problem: Loads all entries at once (no pagination); scales poorly with large datasets
- Files: `backend/services/entriesService.js` (line 56-61), `frontend/src/services/entriesService.js` (line 7-13)
- Cause: No offset/limit parameters in query or service
- Improvement path: Add pagination (limit, offset) to getEntries, implement virtual scrolling on frontend or standard pagination UI

**Database Connection Pool Not Tuned:**
- Problem: Uses default pg connection pool settings; unknown performance characteristics under load
- Files: `backend/db.js` (line 60)
- Cause: No explicit pool size configuration
- Improvement path: Set max: 10, min: 2 (or tune to deployment environment)

## Fragile Areas

**AddEntry Cost Calculation Logic:**
- Files: `frontend/src/pages/AddEntry.jsx` (lines 60-75, 128-135, 204-211)
- Why fragile: Multiple interacting state pieces (usageAmount, unitPrice, costAmount, manualCost) with complex conditional logic. Changing one may break assumptions about another.
- Safe modification: Add comprehensive tests for all combinations of auto-calculate vs manual override. Document the state machine clearly.
- Test coverage: Zero; no tests exist for form logic

**Supabase Auth Integration:**
- Files: `frontend/src/context/AuthContext.jsx`, `backend/middleware/auth.js`
- Why fragile: Tightly coupled to Supabase SDK; if Supabase returns unexpected session shape or token format, auth silently fails
- Safe modification: Wrap Supabase calls in utility functions that validate response shape. Add logging to track auth failures.
- Test coverage: Zero; no auth tests

**Database Schema Unknown:**
- Files: All backend services reference tables (utility_entries, utility_settings) with no schema file in repo
- Why fragile: Cannot verify if columns exist, cannot test against correct schema, onboarding new developers is hard
- Safe modification: Create migrations directory with schema definition (or SQL file documenting expected schema)
- Test coverage: Zero; cannot test without database

## Scaling Limits

**Single Database Server:**
- Current capacity: Depends on Supabase plan; likely 10,000-100,000 entries before slowdown
- Limit: No caching layer; every query hits database. Concurrent users will see degradation.
- Scaling path: Add Redis cache for stats/trends, implement query batching, add database read replicas

**Frontend Bundle Size:**
- Current capacity: Likely 200-300KB gzipped (React + deps + UI library)
- Limit: Charts library (Recharts) and animations (Framer Motion) add significant overhead
- Scaling path: Lazy-load chart components, consider lighter chart library for mobile devices

**Real-Time Updates Not Supported:**
- Current capacity: Manual refresh only; multiple users editing entries won't see updates
- Limit: Stale data is possible; no conflict resolution
- Scaling path: Implement polling or WebSocket subscriptions via Supabase realtime

## Dependencies at Risk

**React 19 (New):**
- Risk: Very recent version, limited production usage, breaking changes possible in 19.x
- Impact: Type of issues could include compatibility with older browser features, subtle rendering differences
- Migration plan: Monitor React 19 releases closely, test new versions in staging. Pin to 19.1.0 until 19.2+ is stable.

**Express 5.1.0:**
- Risk: Express 5.x is still in active development; major version bump
- Impact: API changes, security patches may require code updates
- Migration plan: Stay on 4.x (latest 4.18.x) until 5.x reaches stable release. Current 5.1.0 is bleeding edge.
- Current issue: Backend uses `await app.listen()` syntax which is Express 5+ only; cannot roll back to 4.x without code change

**Supabase SDK Version Mismatch:**
- Risk: Frontend uses @supabase/supabase-js ^2.97.0, backend uses @supabase/supabase-js ^2.49.1
- Impact: Different versions may have incompatible session formats or auth token handling
- Migration plan: Upgrade backend to ^2.97.0 or newer, or downgrade frontend to match backend

## Missing Critical Features

**No Settings Persistence:**
- Problem: Settings (unit prices) are saved but UI doesn't allow users to update them easily
- Blocks: Cannot adjust electricity/water/fuel unit prices without restarting and editing database
- Current workaround: Prices auto-fill if previously entered in an entry

**No Data Export:**
- Problem: No way to export entries (CSV, JSON) for backup or analysis
- Blocks: Users cannot analyze data outside the app, cannot backup their data

**No Deletion Confirmation UI Improvements:**
- Problem: Delete confirmation dialog works but UX could be clearer
- Blocks: Not critical, but users might accidentally delete entries
- Current workaround: Confirmation dialog requires explicit button click

## Test Coverage Gaps

**No Backend Unit Tests:**
- What's not tested: Database service functions (entriesService.js, settingsService.js), controller validation logic
- Files: `backend/services/entriesService.js`, `backend/controllers/entriesController.js`, `backend/controllers/breakdownController.js`
- Risk: SQL injection could slip through undetected, edge cases in filtering not verified, breaking changes unknown
- Priority: High - backend is security-critical

**No Frontend Component Tests:**
- What's not tested: Form validation in AddEntry, filter logic in Entries, chart rendering in StatisticsDetail
- Files: `frontend/src/pages/AddEntry.jsx`, `frontend/src/pages/Entries.jsx`, `frontend/src/pages/StatisticsDetail.jsx`
- Risk: UI logic bugs are only caught manually, regression issues on updates
- Priority: High - complex state logic in AddEntry

**No Integration Tests:**
- What's not tested: End-to-end flow (login → add entry → view stats → delete entry), error handling across frontend/backend
- Files: All
- Risk: Breaking changes between frontend/backend not caught until runtime
- Priority: Medium - manual testing catches most issues but time-consuming

**No API Contract Tests:**
- What's not tested: API endpoint response schemas, error codes, validation boundaries
- Files: `backend/routes/`, `frontend/src/services/`
- Risk: Frontend expects different response shape than backend provides, or vice versa
- Priority: Medium - currently working by convention

---

*Concerns audit: 2026-03-18*
