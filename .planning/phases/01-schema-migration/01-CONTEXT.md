# Phase 1: Schema Migration - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the hardcoded `type` string column in `utility_entries` and `utility_settings` with proper `utility_sections` and `utility_meters` tables. Backfill existing Water/Power/Fuel data into the new schema. Migration must be reversible. New tables must support the entry modes and archive/delete behavior needed by later phases.

</domain>

<decisions>
## Implementation Decisions

### Date-range entry storage
- Split into individual daily rows at insert time (e.g., 50 kWh over 10 days = 10 rows of 5 kWh each)
- Add nullable `group_id` UUID column to link rows from the same range entry
- No separate range metadata table — original range reconstructable from MIN/MAX date and SUM of the group
- Deleting one row from a group deletes only that row (remaining rows stay, total decreases)
- Fractional amounts rounded to 2 decimal places; last row absorbs rounding remainder so sum is exact

### Meter reading chain
- Add nullable `meter_reading` column on `utility_entries` — NULL for usage-amount entries, raw reading value for reading entries
- Computed usage delta stored in `usage_amount` (current reading - previous reading)
- On deletion of a mid-chain reading, recalculate the next entry's usage delta at delete time
- Entry mode is per-meter (stored on `utility_meters` table), not per-entry — all entries for a meter use the same mode
- Mode is locked after first entry — user must create a new meter to use a different mode

### Section/meter schema
- Section icons stored as icon name strings (e.g., 'droplet', 'zap', 'flame') — frontend maps to icon library
- `archived_at` nullable timestamp column for soft-delete; hard delete removes the row entirely (CASCADE entries)
- Each default section gets one default meter during migration: 'Water Meter 1', 'Power Meter 1', 'Fuel Meter 1'
- Existing `utility_entries` rows are assigned to these default meters via `meter_id`
- Old `type` column is dropped after backfill — clean break, rollback migration can restore it
- `utility_settings` rows updated to reference `section_id` instead of type strings

### Claude's Discretion
- Migration tooling choice (raw SQL files, migration library, or Supabase migrations)
- Exact column types, constraints, and index strategy
- Rollback implementation details
- Sort order column implementation for sections and meters

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements are fully captured in decisions above and in these project files:

### Project context
- `.planning/REQUIREMENTS.md` — UNIT-01, UNIT-02 are this phase's direct requirements (default units for Power=kWh, Water=m³)
- `.planning/ROADMAP.md` — Phase 1 success criteria (5 conditions that must be TRUE)
- `.planning/PROJECT.md` — Key decisions table (archive+delete, editable defaults, date-range splitting, first reading baseline)

### Existing code (current schema inferred from)
- `backend/services/entriesService.js` — Current `utility_entries` table shape: id, user_id, type, usage_amount, cost_amount, unit_price, unit, date
- `backend/services/settingsService.js` — Current `utility_settings` table shape: user_id, type, unit_price (unique on user_id+type)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/db.js` — pg Pool connection with env var resolution; all queries go through `getDb()`

### Established Patterns
- Raw SQL queries via `pool.query()` with parameterized values — no ORM
- Services layer (`backend/services/`) contains all DB access; controllers call services
- `utility_settings` uses UPSERT pattern (`ON CONFLICT ... DO UPDATE`)

### Integration Points
- `entriesService.js` — Must be updated to use `meter_id` instead of `type`, add `group_id` and `meter_reading` columns
- `settingsService.js` — Must be updated to use `section_id` instead of `type`
- `breakdownController.js` — Uses `type` for GROUP BY; must change to section/meter joins

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

*Phase: 01-schema-migration*
*Context gathered: 2026-03-18*
