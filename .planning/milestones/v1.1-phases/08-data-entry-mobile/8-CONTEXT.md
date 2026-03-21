# Phase 8: Data Entry & Mobile - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Data entry works correctly across locales and all pages render without layout breakage on mobile. Comma decimal input, translated section names, and mobile layout fixes.

Requirements: ENTR-01, ENTR-02, MOBI-01

</domain>

<decisions>
## Implementation Decisions

### Comma decimal input (ENTR-01)
- **D-01:** Switch numeric inputs from `type="number"` to `type="text"` with `inputMode="decimal"` — allows comma input natively
- **D-02:** Auto-convert comma to dot on input or blur (normalize to standard float format before parsing)
- **D-03:** No thousand separator handling — only single comma-as-decimal
- **D-04:** Invalid input prevents form submission — red border on field, submit button disabled
- **D-05:** Comma support applies to every numeric input across the entire app (AddEntry fields, Settings unit price, any future numeric inputs)

### Section name translation (ENTR-02)
- **D-06:** Add `translation_key` column to `utility_sections` table for future extensibility
- **D-07:** Default sections (Water, Power, Fuel) get translation keys (`water`, `power`, `fuel`) mapped to existing i18n entries in EN/DE JSON files
- **D-08:** User-created sections have `translation_key = NULL` — displayed as the user typed them, untranslated
- **D-09:** Translated names shown everywhere section names appear: Dashboard cards, Statistics headers, Entries list, AddEntry dropdown — not just the entry form
- **D-10:** Naming sections is the user's responsibility — no auto-translation of custom section names

### Mobile layout fixes (MOBI-01)
- **D-11:** Fix Statistics page `grid-cols-3` → add responsive breakpoint so cards don't cramp on phones
- **D-12:** Fix AddEntry side-by-side date fields → collapse to stacked layout on mobile
- **D-13:** Target device width: iPhone 12+ (390px viewport) — not targeting older/smaller devices
- **D-14:** Fix drag-and-drop reorder on mobile — currently broken/finicky, replace with mobile-friendly alternative (e.g. up/down arrow buttons on mobile, keep drag on desktop)
- **D-15:** Full mobile audit deferred — only fix known issues in this phase

### Claude's Discretion
- Exact comma normalization timing (on every keystroke vs on blur)
- How to structure the `translation_key` lookup helper (utility function vs hook)
- Mobile reorder UX specifics (up/down buttons, long-press, or other pattern)
- Statistics grid breakpoint values (1-col vs 2-col on mobile)
- Validation error styling details (border color, animation)

</decisions>

<specifics>
## Specific Ideas

- German placeholders already show `"0,00"` in translation files — these should work correctly once comma input is enabled
- Drag-and-drop on mobile "didn't really work" per user testing — needs a real fix, not just a tweak
- The dead translation keys (`dashboard.power`, `entries.water`, etc.) in i18n files can be consolidated under a single `sections.*` namespace

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/REQUIREMENTS.md` — ENTR-01, ENTR-02, MOBI-01 requirement definitions
- `.planning/ROADMAP.md` — Phase 8 success criteria (3 criteria)
- `.planning/PROJECT.md` — Tech stack constraints (React + Express + PostgreSQL), i18n requirement

### Prior phase context
- `.planning/phases/07-performance-navigation/7-CONTEXT.md` — Phase 7 decisions on data caching and optimistic mutations (D-01 through D-13)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/i18n/locales/en/common.json` and `de/common.json`: Already have translation keys for Water/Power/Fuel under `dashboard.*`, `entries.*`, `statistics.*` — consolidate to `sections.*`
- `frontend/src/components/ui/input.jsx`: Thin wrapper around `<input>` — extend or wrap for comma-aware numeric input
- `frontend/src/context/SectionsContext.jsx`: Central section/meter state — add translation key resolution here

### Established Patterns
- Context API + custom hooks (`useSections()`, `useLanguage()`) — translation lookup should follow this pattern
- `parseFloat()` used at AddEntry.jsx lines 163, 170, 175, 261, 263, 267 — all need comma normalization
- Tailwind responsive classes used throughout (`sm:`, `md:`, `lg:` breakpoints)

### Integration Points
- `AddEntry.jsx` — numeric inputs (usageAmount, meterReading, unitPrice) need comma handling
- `Settings.jsx` — unit price input needs same comma handling
- `AddEntry.jsx` line 365 — section dropdown renders `s.name`, needs translation lookup
- `Dashboard.jsx`, `Statistics.jsx`, `Entries.jsx` — all render `section.name` directly, need translation lookup
- `Statistics.jsx` line 187 — `grid grid-cols-3` needs responsive breakpoint
- `AddEntry.jsx` line 485 — `grid grid-cols-2` date fields need responsive collapse
- `Settings.jsx` — drag-and-drop reorder needs mobile-friendly alternative
- Backend: `utility_sections` table needs `translation_key` column migration

</code_context>

<deferred>
## Deferred Ideas

- Full mobile audit across all pages and edge cases — capture as future task
- Auto-translation of user-created section names — out of scope, user names their own sections

</deferred>

---

*Phase: 08-data-entry-mobile*
*Context gathered: 2026-03-21*
