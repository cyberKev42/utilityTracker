# Domain Pitfalls

**Domain:** Dynamic utility tracking — custom sections, sub-meters, dual entry modes
**Researched:** 2026-03-18
**Confidence:** HIGH (derived from direct codebase analysis + domain reasoning)

---

## Critical Pitfalls

Mistakes that cause rewrites or break existing data.

---

### Pitfall 1: Hardcoded `VALID_TYPES` Array Persists After Schema Migration

**What goes wrong:**
The backend has `const VALID_TYPES = ['electricity', 'water', 'fuel']` in both `entriesController.js` and `breakdownController.js`. If the database schema is migrated to dynamic sections but the validation arrays are not removed, new custom sections will be silently rejected with a 400 error. This appears correct behavior at first glance, making it hard to debug.

**Why it happens:**
Developers focus on the database migration and API routes for sections/meters but forget that existing entry-creation and breakdown controllers have their own inline type whitelists that are entirely disconnected from the database.

**Consequences:**
Users can create custom sections in the UI but cannot log entries to them. The failure message ("Type must be one of: electricity, water, fuel") appears as a server validation error that looks intentional.

**Prevention:**
Replace all static `VALID_TYPES` guards with a database lookup against the sections table scoped to the requesting user. Alternatively, accept any non-empty string `type` and validate foreign key constraints at the DB level instead.

**Detection:**
- Any 400 error on entry creation for a non-default section type
- Test: create a custom section, attempt to log an entry → if rejected, the guard is still hardcoded
- Search codebase for `VALID_TYPES` before closing the migration phase

**Phase:** Schema + API migration phase (earliest, foundational)

---

### Pitfall 2: Meter Reading Delta Calculation Breaks on Entry Deletion

**What goes wrong:**
Entry mode B stores raw meter readings. Usage is derived as `current_reading - previous_reading`. If a user deletes an intermediate entry, all subsequent usage calculations silently produce wrong values — gaps become phantom consumption or negative usage.

**Why it happens:**
The delete endpoint (`DELETE /entries/:id`) does not recalculate downstream deltas. It removes the row and returns success. The integrity of the derived usage chain is the application's responsibility, not the database's.

**Consequences:**
Statistics show incorrect totals for a meter. Charts spike or dip. The user has no indication anything is wrong.

**Prevention:**
One of these strategies — choose before building entry deletion:
1. **Recalculate on read**: Never store derived `usage_amount` for meter-reading entries; always compute it at query time from ordered readings. Adds query complexity but ensures correctness.
2. **Cascade recalculate on delete**: After deleting a reading entry, recalculate and update `usage_amount` on the next reading entry in that meter's sequence.
3. **Soft-delete only**: Meter-reading entries can only be archived, not deleted.

Strategy 1 is the most correct but requires a schema separation between raw-reading rows and derived-usage rows.

**Detection:**
- Delete a middle entry in a meter with 3+ readings → check if subsequent entry's usage is now wrong
- Negative `usage_amount` values in the database are a warning sign

**Phase:** Entry mode B implementation; deletion logic must account for this before UI is shipped

---

### Pitfall 3: Statistics and Charts Assume Exactly Three Fixed Categories

**What goes wrong:**
`Statistics.jsx` hardcodes `['electricity', 'water', 'fuel'].map(...)` to render section cards. `TYPE_CONFIG` maps each to a fixed icon and color class. `CategoryBarChart` and `DistributionPieChart` receive `stats.byType` which groups by the `type` string column. When custom sections exist, charts may silently drop them or render without color/icon because the config object has no key for the new type.

**Why it happens:**
The current architecture assumes the frontend "knows" all types at build time. Dynamic sections break this assumption.

**Consequences:**
Custom sections never appear in statistics. Users log data to them but see no charts or breakdowns. This can go unnoticed until a user explicitly looks for their data.

**Prevention:**
- Remove `TYPE_CONFIG` as a static map. Fetch section configuration (name, icon identifier, color) from the backend alongside stats.
- Pass icon and color as data, not as component imports keyed by type string. Use a generic fallback icon for any section without an explicit icon set.
- Replace the hardcoded `['electricity', 'water', 'fuel'].map(...)` with `stats.byType.map(...)` or a sections-list API response.

**Detection:**
- Add a custom section → visit Statistics page → custom section card missing from the 3-column grid
- `CategoryBarChart` renders but custom section bar is absent

**Phase:** Statistics refactor; must coincide with sections API work, not deferred

---

### Pitfall 4: Date-Range Entry Split Creates Fractional Amounts That Don't Re-aggregate Cleanly

**What goes wrong:**
Entry mode A allows entering a billing-period total split evenly across days. `total / days` produces floating point values (e.g. 100 kWh / 31 days = 3.225806...). When these daily rows are summed for a monthly report, floating point drift causes the monthly total to differ slightly from the original entry amount.

**Why it happens:**
IEEE 754 floating point. Splitting 100 across 31 days in JavaScript and storing as `FLOAT` in PostgreSQL will accumulate rounding error when re-summed.

**Consequences:**
Monthly totals show values like `99.9999999` instead of `100`. Small but visible to users who verify their bills. Worse: if the start/end date straddles two months, the monthly-total reports for both months will each be slightly wrong.

**Prevention:**
- Store the total amount on the parent entry and compute daily splits only for display/querying purposes, not as independent rows.
- Alternatively, store `usage_amount` as `NUMERIC(12,4)` (not `FLOAT`) in PostgreSQL, and use integer arithmetic for the split (last day absorbs rounding remainder).
- Consider a `parent_entry_id` column that groups split rows so the original total is always recoverable.

**Detection:**
- Enter 100 units across 31 days → query `SUM(usage_amount)` → if result is not exactly 100.0, drift exists
- Cross-month date ranges are the highest-risk scenario

**Phase:** Date-range entry mode design; must be addressed in schema design before implementation

---

### Pitfall 5: i18n Translation Keys for Dynamic Section Names

**What goes wrong:**
The current i18n setup uses static translation keys like `t('statistics.electricity')`. Custom section names are user-defined strings, not translatable keys. If any part of the UI tries to run `t(\`statistics.${sectionSlug}\`)` for a user-created section, it will fall back to the raw key string (e.g. "statistics.my_solar_panels") or an empty string depending on i18n library configuration.

**Why it happens:**
The existing pattern works for the three hardcoded types. Developers extend the same pattern for dynamic sections without accounting for the fact that user-created names can't be in translation files.

**Consequences:**
Custom section names either display as cryptic key strings or disappear from the UI in unexpected places. This is especially likely in chart legends, page titles, and breadcrumbs.

**Prevention:**
- Treat section names as data strings, never as translation keys.
- Use `t('statistics.section', { name: section.name })` (interpolated) instead of `t(\`statistics.${type}\`)`.
- Audit every call to `t()` that includes a dynamic type or section identifier and replace with data-driven display.

**Detection:**
- Create a custom section with a name that does not match any existing translation key → check Statistics page, chart legends, AddEntry type selector for raw key strings
- Search for `t(\`...${type}...\`)` and `t(\`...${section}...\`)` patterns in the frontend

**Phase:** UI implementation of custom sections; catch during code review before merge

---

## Moderate Pitfalls

---

### Pitfall 6: Settings Page Unit Price Keyed on Static Type String

**What goes wrong:**
`utility_settings` stores `unit_price` keyed on `(user_id, type)` where `type` is a hardcoded string ('electricity', 'water', 'fuel'). When sections become dynamic, pricing for new sections will have no home unless the settings schema is updated to reference a `section_id` foreign key instead.

**Prevention:**
Migrate `utility_settings` to use `section_id` (FK to the new sections table) rather than a `type` string. Provide a migration that creates the sections table first, maps the three defaults, then updates settings rows to reference the new IDs.

**Detection:**
- Create a custom section, set a unit price → add an entry → verify cost is auto-calculated correctly

**Phase:** Database migration phase

---

### Pitfall 7: First Meter Reading Edge Case at Midnight Boundary

**What goes wrong:**
The "first entry = usage 0" rule requires knowing whether a given reading is the chronologically first for a meter. If a user enters two readings for the same date (e.g. data entry correction), which is "first" is ambiguous. Using `date` alone (no timestamp) to determine reading order is insufficient.

**Prevention:**
- Order readings by `(date, created_at)` so that for same-date entries, insertion order breaks ties.
- Store `created_at` as `TIMESTAMPTZ` (already likely the case with Supabase but verify).
- Enforce: only one reading per meter per date, or clearly document that multiple same-day readings sum usage in insertion order.

**Detection:**
- Enter two meter readings for the same date and meter → check which is treated as baseline

**Phase:** Entry mode B implementation

---

### Pitfall 8: Deleting a Section with Existing Entries

**What goes wrong:**
If a user deletes a section (not just archives it), existing entries referencing that section become orphaned. The application may crash or silently omit historical data in statistics.

**Prevention:**
- Use `ON DELETE RESTRICT` on the FK from entries to sections by default. Force the user to explicitly archive or migrate entries before hard deletion.
- The PROJECT.md correctly distinguishes archive vs. delete. Implement archive first; hard delete should require confirmation that all entries will be permanently removed.
- Never allow hard delete of a section that has entries without explicit user confirmation and data count shown.

**Detection:**
- Create section, add entries, delete section → run statistics query → verify no crash and no orphaned rows

**Phase:** Section management CRUD implementation

---

## Minor Pitfalls

---

### Pitfall 9: Section Reordering Stored as Integer Position

**What goes wrong:**
Storing display order as an integer `position` column leads to fragmentation: reordering requires updating many rows. A common naive implementation reads positions, recomputes all values, and fires N updates — a concurrency hazard if two requests run simultaneously.

**Prevention:**
Use a fractional indexing scheme (e.g. store position as `FLOAT`, insert between two items as the midpoint) or batch the reorder in a single transaction. For a single-user app, a full-replace of position values in one transaction is acceptable and simple.

**Phase:** Section reorder UI

---

### Pitfall 10: Chart Color Assignment for Arbitrary Sections

**What goes wrong:**
With dynamic sections the chart library needs colors. If colors are assigned by array index at render time, the same section may get different colors on different renders (if sections are added/removed), creating a confusing legend.

**Prevention:**
Store a `color` (hex or palette index) on the section record in the database. Assign deterministically at creation time, not at render time.

**Phase:** Section creation UI

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Database migration | Unit price settings keyed on type string | Migrate to section_id FK before building sections CRUD |
| Schema design | Date-range float drift | Use NUMERIC not FLOAT; design parent-entry grouping before coding |
| Entry mode B | Delta breaks on deletion | Decide recalculate-on-read vs cascade-recalculate before implementation |
| Statistics refactor | TYPE_CONFIG static map | Replace with data-driven config fetched from sections API |
| Custom section CRUD | Hard delete with existing entries | Enforce archive-first; block hard delete via FK RESTRICT |
| i18n | Dynamic names used as translation keys | Audit all `t()` calls with dynamic type strings at code review |
| First meter entry | Same-date ambiguity | Use (date, created_at) ordering; enforce or document same-date behavior |

---

## Sources

- Direct codebase analysis: `backend/controllers/entriesController.js`, `breakdownController.js`, `services/entriesService.js`, `frontend/src/pages/Statistics.jsx`, `frontend/src/pages/AddEntry.jsx`
- Project requirements: `.planning/PROJECT.md`
- Domain reasoning: IEEE 754 float arithmetic, PostgreSQL FK constraint semantics, react-i18next fallback behavior, delta-chain integrity in time-series data
