# Feature Landscape

**Domain:** Personal utility tracker with dynamic categories, sub-metering, and flexible data entry
**Researched:** 2026-03-18
**Confidence:** HIGH — derived from codebase analysis plus domain knowledge of metering systems

---

## Existing Features (Baseline)

The app already ships:
- CRUD entries for electricity/water/fuel with date, amount, unit, cost
- Auto-calculated cost from unit price (with manual override)
- Dashboard with summary cards and recent entries
- Statistics: pie, bar, line charts with year/month breakdown
- Settings: unit prices per category, language, account
- Filter entries by type and date range
- Auth via Supabase

---

## Table Stakes

Features users expect from a customizable utility tracker. Missing = product feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Create custom sections with name and unit | Core premise of the milestone — without this nothing else works | Medium | Section needs: name, unit (e.g. "kWh"), icon or color, sort order |
| Rename and reorder existing sections | Users expect full ownership of structure; hardcoded names feel limiting | Low | Affects both UI labels and any string-keyed lookups — must de-string-key section references |
| Delete/archive sections | Users need to hide old sections without losing historical data | Medium | Archive = soft-delete, keep entries; Delete = permanent with cascade or block |
| Multiple meters per section (sub-meters) | Real households often have >1 meter (flat + garage, main + garden water) | Medium | Meter belongs to section; entries belong to meter |
| Aggregate section statistics from sub-meter data | Without rollup stats, sub-metering is useless overhead | Medium | SUM across meters for totals; also show per-meter breakdown |
| Entry mode A: direct usage amount input | Existing behavior — must work for all custom sections, not just hardcoded types | Low | Already implemented; needs to be section-aware |
| Entry mode B: meter reading input (cumulative) | Standard in gas/water/electricity billing — readings not usage | High | Requires last-reading lookup; first entry needs baseline prompt; usage = current - previous |
| First-entry baseline prompt for meter-reading mode | Without it, first calculated usage is meaningless or wrong | Medium | Must communicate to user: "first entry sets baseline, usage = 0" |
| Unit price per section (dynamic, not hardcoded) | Settings currently tied to 3 fixed types; must generalize | Low | Settings page needs section-based price rows |
| Section-aware entry form | Form must let user pick section AND meter before logging | Medium | Selection flow: section → meter → entry mode → amount/reading |
| Entries list shows section and meter name | Users must be able to tell entries apart when multiple sections exist | Low | Replaces hardcoded type badge |
| Date range entry (usage spread across days) | Useful for billing period data without daily granularity | Medium | User enters total for a date range; app divides evenly per day; or stores as single entry with range fields |
| Correct default units (kWh, m³) | Current code has correct values but PROJECT.md flags this — verify defaults are preserved | Low | Electricity = kWh, Water = m³ already in AddEntry.jsx |
| Full EN/DE translation for all new strings | Existing i18n discipline — every new label needs both locales | Low | Non-negotiable for this codebase |

---

## Differentiators

Features that make this tracker more capable than a basic spreadsheet or generic tracker.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Per-meter statistics alongside section rollup | Lets user see which meter is driving usage (e.g. garden hose vs. household) | Medium | Two levels of chart data: section total, per-meter breakdown |
| Entry mode switch per meter (not per section) | Different meters for the same utility may have different data sources | Low | e.g. smart meter gives readings, old meter requires manual usage entry |
| Meter color or label customization | When viewing charts with multiple meters, distinguishable colors help readability | Low | Simple metadata field, no logic change |
| Last reading display on entry form | When using meter-reading mode, showing the previous reading helps user verify input | Low | Fetch last entry for the meter before rendering form |
| Duplicate/clone section | Useful when adding a second property or meter with same settings | Low | Copy section config; user renames |
| Section icon picker (from react-icons subset) | Gives each custom section a visual identity, improving scanability | Medium | Need to define allowed icon set; icons must be bundleable |

---

## Anti-Features

Features to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Complex billing period modeling | Bill periods vary, time-of-use tariffs are complex; over-engineering before validating need | Simple date range entry split evenly is sufficient |
| Automated meter reading via OCR or API | Way out of scope for personal tracker; adds infra complexity | Manual entry; future milestone if ever needed |
| Multi-currency support | Single-user personal tracker; currency formatting uses browser locale already | Use Intl.NumberFormat with locale (already done) |
| Shared/team utility tracking | Single-user product by design | Auth already scoped per user; no sharing layer needed |
| Push notifications for thresholds | Adds significant infra (service worker, push subscriptions) for uncertain value | Explicitly out of scope per PROJECT.md |
| CSV import/export | Explicitly deferred per PROJECT.md | Future milestone |
| Meter reading history graph / regression analysis | Nice but premature; basic statistics already exist | The line chart already handles trends; no need for separate analysis view yet |
| Section templates / marketplace | Over-engineered for a personal tool | User creates custom sections manually |

---

## Feature Dependencies

```
Custom sections
  └── Meter CRUD (create meters within sections)
        └── Entry form (must select section + meter)
              ├── Entry mode A (usage amount) — low dep, adapts current flow
              └── Entry mode B (meter reading)
                    └── Last reading lookup
                          └── First entry baseline UX

Custom sections
  └── Settings page unit prices (per section, not per hardcoded type)

Custom sections
  └── Statistics page (charts must become section-aware)
        └── Per-meter breakdown stat queries
        └── Section aggregate queries

Section management (rename, reorder, delete, archive)
  └── Entries list (badge/label must use section name dynamically)
  └── Entries filter (filter dropdown must be section-aware)
  └── Dashboard summary cards (cards must iterate sections dynamically)
```

---

## MVP Recommendation

For this milestone, prioritize in this order:

1. **Section + meter data model** — database schema for sections, meters, updated entries table; migration for existing data
2. **Section management UI** — create, rename, reorder, archive, delete sections; this gate-keeps all downstream features
3. **Meter management UI** — create/rename/delete meters within a section
4. **Entry form: section + meter selection** — replaces hardcoded type selector
5. **Entry mode A (usage amount)** — minimal change to current flow, now section/meter-aware
6. **Entry mode B (meter reading)** — new logic for delta calculation, first-entry baseline
7. **Date range entry** — entry mode extension; store range or split to daily records
8. **Settings: per-section unit prices** — generalize existing settings row structure
9. **Statistics: dynamic sections** — refactor charts off hardcoded [electricity, water, fuel]
10. **Per-meter statistics** — rollup aggregation + breakdown charts
11. **i18n for all new strings** — continuous, do alongside each feature not at the end

Defer:
- **Section icon picker** — default to a generic icon; full picker in next milestone
- **Last reading display on entry form** — polish; add after core meter-reading mode works
- **Meter color customization** — purely cosmetic; low priority

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Table stakes | HIGH | Derived from codebase + PROJECT.md requirements; domain conventions are well-established |
| Entry mode B behavior | HIGH | Meter-reading delta calculation is a standard utility industry pattern; first-entry = baseline is correct UX |
| Differentiators | MEDIUM | Reasonable based on domain; some (icon picker) are cosmetic and could be skipped |
| Anti-features | HIGH | Clearly out of scope per PROJECT.md or clearly premature optimization |

---

## Sources

- Codebase analysis: `/frontend/src/pages/AddEntry.jsx`, `Entries.jsx`, `Settings.jsx`, `services/entriesService.js`
- Project requirements: `.planning/PROJECT.md`
- Domain knowledge: utility meter reading conventions (cumulative meter readings, billing period entry, sub-metering) — HIGH confidence, industry-standard patterns
