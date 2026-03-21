# Phase 9: Dashboard & Settings Polish - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Dashboard shows usage or cost at user's choice, settings provides inline meter name editing, and water icons are improved.

Requirements: DASH-01, SETT-01, VISL-01

</domain>

<decisions>
## Implementation Decisions

### Usage/cost toggle (DASH-01)
- **D-01:** Segmented pill control (two-button toggle) matching LanguageSwitcher style — not a checkbox or switch
- **D-02:** Toggle placed inline with Dashboard heading — heading left-aligned, toggle right-aligned, same row
- **D-03:** Default mode is `'usage'` (not cost) — utility tracker focuses on consumption first
- **D-04:** User's choice persists via `localStorage` key `dashboard_display_mode` — remembered across sessions
- **D-05:** Toggle does NOT affect the "Total Spending" summary card — that always shows cost
- **D-06:** Usage display format: `{number} {unit}` (e.g. "42.3 m³") — unit sourced from `contextSections`, not stats API

### Meter inline edit affordance (SETT-01)
- **D-07:** Pencil icon (`HiOutlinePencilSquare`) appears on row hover via `group-hover:opacity-100` — matches existing delete/mode button pattern
- **D-08:** Pencil button positioned between mode-toggle and delete buttons in right-side action group
- **D-09:** Clicking pencil sets `editing=true` — same as clicking meter name span (additive affordance, not replacement)
- **D-10:** No logic changes to inline edit — only visual discoverability improvement

### Water icon expansion (VISL-01)
- **D-11:** 8 new icons added to `ICON_MAP`: `FaDroplet`, `FaWater`, `FaFaucet`, `FaFaucetDrip` (fa6), `LuDroplet`, `LuDroplets`, `LuGlassWater`, `LuWaves` (lu)
- **D-12:** Icons appear in existing flat grid — no new grouping or filtering UI
- **D-13:** No new npm packages — fa6 and lu already bundled with react-icons 5.5.0

### Claude's Discretion
- Exact toggle animation timing
- Usage value formatting for edge cases (null/zero)
- Error handling on meter rename failure
- Pencil icon exact sizing within the row

</decisions>

<specifics>
## Specific Ideas

No specific requirements — decisions above fully capture the user's intent. Toggle layout matches LanguageSwitcher pattern from Settings.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase specs
- `.planning/phases/09-dashboard-settings-polish/09-RESEARCH.md` — Full implementation patterns, pitfalls, code examples for all three requirements
- `.planning/phases/09-dashboard-settings-polish/09-UI-SPEC.md` — Visual contract: colors, spacing, typography, interaction contracts
- `.planning/ROADMAP.md` — Phase 9 success criteria (3 criteria)

### Prior phase context
- `.planning/phases/07-performance-navigation/7-CONTEXT.md` — Dashboard sparkline + navigation linking (D-10 through D-13)
- `.planning/phases/08-data-entry-mobile/8-CONTEXT.md` — Mobile layout fixes, translated section names, comma decimal input

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LanguageSwitcher.jsx`: Segmented pill toggle pattern — reuse for Dashboard cost/usage toggle
- `MeterRow.jsx`: Already has full inline-edit logic + `group-hover` pattern for action buttons
- `IconPickerGrid.jsx`: Has `ICON_MAP` — just add new entries
- `EntriesDataContext.jsx`: Stats API returns both `total_usage` and `total_cost` per section

### Established Patterns
- `localStorage` for preferences: used in `AddEntry.jsx` (last section/meter) and `CurrencyContext.jsx` (rates cache)
- `group-hover:opacity-100` for action buttons: used in `MeterRow.jsx` lines 126-143
- `motion.button` with `whileTap={{ scale: 0.98 }}`: project-wide interactive element pattern

### Integration Points
- `Dashboard.jsx` line 218: Currently renders `formatCurrency(section.total_cost)` — switch to conditional based on toggle
- `Dashboard.jsx` lines 85-88: `sectionLookup` already built from `contextSections` — use for `unit` field
- `MeterRow.jsx` lines 107-113: Meter name span with `onClick` — add pencil button nearby
- `IconPickerGrid.jsx`: Add imports from `react-icons/fa6` and `react-icons/lu`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-dashboard-settings-polish*
*Context gathered: 2026-03-21*
