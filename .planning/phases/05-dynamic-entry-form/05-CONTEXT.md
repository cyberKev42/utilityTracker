# Phase 5: Dynamic Entry Form - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can log entries to any section and meter using either usage-amount or meter-reading input. The form dynamically adapts based on the selected meter's entry_mode. Covers ENTR-01 through ENTR-04.

</domain>

<decisions>
## Implementation Decisions

### Meter selection flow
- Cascading dropdowns: first pick a section, then pick a meter within it
- Form remembers the last-used section+meter (localStorage) for quicker repeat entries
- Entry mode determined automatically by the meter's `entry_mode` setting — no toggle on the entry form
- Show the section's unit next to the input field, plus the last meter reading or usage amount for reference

### Date range entry UX
- Two separate date fields (start date, end date) using native date pickers — no calendar range picker library
- Single-day entries default the date to today
- When a date range is entered, show a split preview below the fields: "120 kWh over 30 days = 4.0 kWh/day"
- End date defaults to today for range entries

### First reading onboarding
- Inline info banner within the form when a reading-mode meter has no prior entries: "This is the first reading for this meter. Enter the current value — usage will start from the next entry."
- After initial reading saved (usage=0), show success message with "Add another" button — matches existing AddEntry success pattern
- No separate wizard or modal step

### Cost preview
- When the section has a unit price configured in settings, show "Estimated cost: €XX.XX" below the amount field
- Already partially implemented in AddEntry.jsx — extend to work with dynamic sections

### Post-submission behavior
- Keep dedicated /add-entry page route (no dialog or dashboard widget)
- On success, show success screen with "Add another" button
- "Add another" resets ALL fields including meter selection (user picks fresh each time)
- Last-used meter memory only applies when first navigating to the page, not on "Add another"

### Claude's Discretion
- Exact validation error message wording and placement
- Animation/transition details for mode switching and split preview
- Responsive layout adjustments for mobile
- How to fetch and display the last reading for the selected meter

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — ENTR-01 through ENTR-04 define the four entry mode requirements for this phase

### Prior phase decisions
- `.planning/phases/01-schema-migration/01-CONTEXT.md` — Schema: utility_entries table structure, entry_mode per-meter, group_id for multi-day
- `.planning/phases/02-backend-services/02-CONTEXT.md` — API contract: POST /api/entries, reading delta calculation, date range split logic
- `.planning/phases/03-sectionscontext/03-CONTEXT.md` — SectionsContext: provides sections with nested meters, entry_mode, mutation functions
- `.planning/phases/04-section-meter-management-ui/04-CONTEXT.md` — Settings UI: entry_mode toggle per meter, section/meter CRUD

### Existing implementation
- `frontend/src/pages/AddEntry.jsx` — Current entry form with dual-mode support, validation, success state
- `backend/services/entriesService.js` — Entry creation: reading delta calc, date range splitting, unit_price resolution
- `frontend/src/context/SectionsContext.jsx` — Section/meter data provider with lookups

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AddEntry.jsx`: Full entry form with reading/usage mode switching, validation, cost preview — refactor to use dynamic sections
- `SectionsContext` + `useSections()`: Provides sections, meters, entry_mode, lookups (getSectionById, getMeterById)
- `entriesService.js` (frontend): createEntry API wrapper
- `entriesService.js` (backend): Reading delta calculation, date range splitting with group_id, unit_price auto-resolution
- UI components: Input, Label, Button, Card, Dialog (shadcn), AnimatePresence for transitions

### Established Patterns
- Controlled form with individual useState hooks and per-field validation on blur
- AnimatePresence + motion.div for conditional field visibility
- Success state renders a separate success view with "Add Another" reset
- Server errors displayed as red text below form with Framer Motion animation

### Integration Points
- `useSections()` for section/meter dropdowns and entry_mode detection
- `POST /api/entries` for submission (already handles both modes + date range splits)
- Navigation: existing /add-entry route in the app router
- localStorage for last-used meter memory

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions captured above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-dynamic-entry-form*
*Context gathered: 2026-03-19*
