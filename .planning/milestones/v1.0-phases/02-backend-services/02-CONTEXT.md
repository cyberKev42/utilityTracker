# Phase 2: Backend Services - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

CRUD API for sections/meters and updated entries endpoint supporting both usage-amount and meter-reading modes. This phase delivers a complete, tested API contract that the frontend (Phases 3-6) can build against. No frontend work in this phase.

</domain>

<decisions>
## Implementation Decisions

### API response shapes
- GET /api/sections returns nested tree: each section contains a `meters` array inline, sorted by `sort_order`
- Archived sections/meters excluded by default; `?include_archived=true` query param to include them
- GET /api/entries/stats returns section-level totals with per-meter breakdown nested inside (one request for Statistics page)
- Stats support optional `?year=YYYY&month=MM` query params for time filtering; no params = all time

### Entry creation logic
- POST /api/entries accepts date range (`start_date`, `end_date`, `usage_amount`) and splits server-side into daily rows with shared `group_id`
- For meter-reading mode, backend auto-detects first reading (no prior entry for meter) and stores `usage_amount=0`; returns `is_initial: true` in response
- Full ownership chain validation: meter_id -> section_id -> user_id must match authenticated user
- No entry editing (PUT/PATCH) in this phase — create and delete only
- Single-entry deletion within a reading-mode meter recalculates the next entry's usage delta (per Phase 1 decision)

### Reorder mechanism
- Batch position update: PUT /api/sections/reorder accepts `{ order: [id1, id2, id3] }`, sets `sort_order` = array index
- Same pattern for meters: PUT /api/sections/:id/meters/reorder

### Delete/archive behavior
- Archiving a section cascade-archives all its meters; entries stay intact but excluded from default views and stats
- Unarchiving restores section + all meters; entries become visible again
- DELETE /api/sections/:id cascades immediately (meters + entries removed); frontend handles confirmation dialog
- DELETE /api/meters/:id cascades all entries for that meter — no delta recalculation since entire meter is removed
- Deleting a single entry within a reading-mode meter recalculates the next entry's delta

### Claude's Discretion
- Exact endpoint naming conventions (beyond what's specified above)
- Request validation details (field length limits, regex patterns)
- Error message wording
- Test structure and organization
- Whether to use transactions for multi-row operations

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/REQUIREMENTS.md` — Full requirements list; Phase 2 has no direct v1 requirements but enables all UI phases
- `.planning/ROADMAP.md` — Phase 2 success criteria (5 conditions that must be TRUE)
- `.planning/PROJECT.md` — Key decisions table (archive+delete, editable defaults, date-range splitting, first reading baseline)

### Phase 1 decisions (schema this API builds on)
- `.planning/phases/01-schema-migration/01-CONTEXT.md` — Schema decisions: date-range splitting with group_id, meter_reading column, entry mode per-meter (locked after first entry), archived_at column, CASCADE on delete

### Existing backend code
- `backend/services/entriesService.js` — Current entry CRUD and stats queries (must be updated for meter_id, group_id, meter_reading)
- `backend/services/settingsService.js` — Current settings UPSERT (must be updated for section_id)
- `backend/controllers/entriesController.js` — Current validation patterns and error handling
- `backend/controllers/breakdownController.js` — Current stats grouping by type (must change to section/meter joins)
- `backend/routes/entries.js` — Current route definitions
- `backend/db.js` — Database pool connection via getDb()
- `backend/middleware/auth.js` — Authentication middleware (req.user injection)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/db.js` — pg Pool with `getDb()`, reuse for all new queries
- `backend/middleware/auth.js` — `authenticate` middleware, apply to all new routes
- Controller validation patterns (regex, type checking) from `entriesController.js`
- UPSERT pattern from `settingsService.js`

### Established Patterns
- Route -> Controller -> Service layered architecture
- Raw SQL with parameterized queries (`$1`, `$2`) — no ORM
- Controllers validate input, call services, return JSON with appropriate status codes
- Services return `result.rows[0]` or `result.rows`
- Error responses as `{ error: 'message' }` with specific HTTP status codes

### Integration Points
- New route files: `backend/routes/sections.js`, updated `backend/routes/entries.js`
- New service files: `backend/services/sectionsService.js`, updated `backend/services/entriesService.js`
- New controller files: `backend/controllers/sectionsController.js`, updated `backend/controllers/entriesController.js`
- `backend/server.js` — Mount new section routes
- Existing `VALID_TYPES` constant must be removed; validation switches to meter_id/section_id UUID checks

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

*Phase: 02-backend-services*
*Context gathered: 2026-03-18*
