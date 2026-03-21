# Phase 8: Data Entry & Mobile - Research

**Researched:** 2026-03-21
**Domain:** React form input normalization, i18n translation lookup, Tailwind responsive layout, @dnd-kit mobile touch sensors
**Confidence:** HIGH

## Summary

This phase has three distinct tracks: (1) comma decimal input normalization across all numeric fields, (2) a DB migration plus translation lookup layer for section names, and (3) Tailwind responsive fixes plus a mobile-friendly drag-and-drop replacement. All three tracks are surgical — no new libraries are needed beyond what is already installed.

The most complex track is ENTR-01. The existing inputs use `type="number"`, which browsers reject on comma input before React even sees it. Switching to `type="text"` with `inputMode="decimal"` is the correct fix. Comma normalization (replace `,` with `.`) must happen before `parseFloat()` at both validation time and submit time, because the `handleFieldChange` → `validateField` → `handleSubmit` pipeline currently calls `parseFloat(value)` on the raw string.

The ENTR-02 track requires a DB migration (add `translation_key` column to `utility_sections`) and a pure-frontend lookup helper. No API changes are needed — the `translation_key` is returned with existing section data, and the frontend resolves it with `t(`sections.${translation_key}`)` falling back to `section.name` for user-created sections.

**Primary recommendation:** Build in task order — migration first (no UI dep), then comma input (isolated to form fields), then section translation (spread across multiple pages), then mobile layout fixes last (pure CSS/JSX changes).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Switch numeric inputs from `type="number"` to `type="text"` with `inputMode="decimal"`
- D-02: Auto-convert comma to dot on input or blur (normalize to standard float format before parsing)
- D-03: No thousand separator handling — only single comma-as-decimal
- D-04: Invalid input prevents form submission — red border on field, submit button disabled
- D-05: Comma support applies to every numeric input across the entire app (AddEntry fields, Settings unit price, any future numeric inputs)
- D-06: Add `translation_key` column to `utility_sections` table for future extensibility
- D-07: Default sections (Water, Power, Fuel) get translation keys (`water`, `power`, `fuel`) mapped to existing i18n entries in EN/DE JSON files
- D-08: User-created sections have `translation_key = NULL` — displayed as the user typed them, untranslated
- D-09: Translated names shown everywhere section names appear: Dashboard cards, Statistics headers, Entries list, AddEntry dropdown — not just the entry form
- D-10: Naming sections is the user's responsibility — no auto-translation of custom section names
- D-11: Fix Statistics page `grid-cols-3` → add responsive breakpoint so cards don't cramp on phones
- D-12: Fix AddEntry side-by-side date fields → collapse to stacked layout on mobile
- D-13: Target device width: iPhone 12+ (390px viewport) — not targeting older/smaller devices
- D-14: Fix drag-and-drop reorder on mobile — currently broken/finicky, replace with mobile-friendly alternative (e.g. up/down arrow buttons on mobile, keep drag on desktop)
- D-15: Full mobile audit deferred — only fix known issues in this phase

### Claude's Discretion
- Exact comma normalization timing (on every keystroke vs on blur)
- How to structure the `translation_key` lookup helper (utility function vs hook)
- Mobile reorder UX specifics (up/down buttons, long-press, or other pattern)
- Statistics grid breakpoint values (1-col vs 2-col on mobile)
- Validation error styling details (border color, animation)

### Deferred Ideas (OUT OF SCOPE)
- Full mobile audit across all pages and edge cases
- Auto-translation of user-created section names
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENTR-01 | Comma (",") accepted as decimal separator in numeric entry fields alongside period (".") | type="text" + inputMode="decimal" + normalization before parseFloat() — see Architecture Patterns |
| ENTR-02 | Section names in new entry dropdown translated to active language | DB migration adds translation_key; useSectionName() helper resolves via i18n fallback to raw name |
| MOBI-01 | All pages render correctly on mobile without horizontal scroll or cut-off elements | Three targeted Tailwind changes + dnd-kit TouchSensor or up/down button replacement |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-i18next | existing | Translation lookup via `t()` | Already used for all i18n; `useSectionName()` will call `t()` |
| @dnd-kit/core | existing | Drag-and-drop on desktop | Already wired in SectionsManagementCard; need TouchSensor for mobile |
| tailwindcss | existing | Responsive layout via `sm:` breakpoints | Already used throughout; `grid-cols-1 sm:grid-cols-3` pattern |
| PostgreSQL | existing | DB migration for translation_key column | Standard ALTER TABLE migration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/core TouchSensor | existing (bundled) | Touch drag on mobile | Already in package; just needs to be added to `useSensors()` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Up/down buttons (mobile reorder) | Touch drag via TouchSensor | TouchSensor works on mobile with activation distance config; up/down buttons are simpler and always reliable |
| `sections.*` i18n namespace | Keep `dashboard.water` etc. scattered | Consolidation is cleaner but adds key migration risk; can do additive (add `sections.*`, leave old keys in place) |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Pattern 1: Comma Decimal Normalization (ENTR-01)

**What:** Normalize user input by replacing `,` with `.` before any numeric operation.

**Where it runs:**
- `validateField()` in AddEntry.jsx — already calls `parseFloat(value)` at lines 163, 170, 175. Must normalize first.
- `handleSubmit()` in AddEntry.jsx — calls `parseFloat(usageAmount)`, `parseFloat(meterReading)`, `parseFloat(unitPrice)` at lines 261–267. Must normalize first.
- Settings unit price input (if it exists with its own `parseFloat`) — same treatment.

**Timing decision (Claude's discretion):** Normalize on every keystroke (`onChange`) so the displayed value immediately reflects valid input, AND normalize in `validateField` and `handleSubmit` as a safety net. This means the user typing "1,5" sees "1.5" replace it automatically OR the field retains "1,5" and we normalize at parse time — the simpler and less jarring approach is to normalize only at parse/validate time (keep the user's comma visible, normalize internally). Recommendation: **normalize at parse time only** (don't rewrite the field value). This avoids cursor-jumping and feels natural to German users who expect to see their comma.

```javascript
// Source: pattern derived from codebase analysis
function normalizeDecimal(value) {
  if (typeof value !== 'string') return value;
  return value.replace(',', '.');
}

// Usage in validateField():
case 'usageAmount': {
  if (value === '' || value == null) return t('addEntry.validation.usageRequired');
  const num = parseFloat(normalizeDecimal(value));
  if (isNaN(num) || num <= 0) return t('addEntry.validation.usagePositive');
  return '';
}

// Usage in handleSubmit():
payload.usage_amount = parseFloat(normalizeDecimal(usageAmount));
```

**Input element change:**
```jsx
// Before:
<Input type="number" inputMode="decimal" ... />

// After:
<Input type="text" inputMode="decimal" ... />
// Note: remove step="any" and min="0" — those are type="number" attributes
// Validation now handled by validateField(), not browser
```

**Validation UX:** The `validateField` call on blur already sets `fieldErrors` which drives the red border. No change to styling needed — the existing `border-destructive` pattern handles it. Submit button disabled state should be derived from `Object.values(fieldErrors).some(Boolean)` — verify this is already the case or add it.

### Pattern 2: Section Name Translation (ENTR-02)

**What:** A utility function that takes a section object and returns the translated display name.

**Helper location (Claude's discretion):** Utility function in `frontend/src/utils/sectionName.js` is cleanest — avoids hook overhead when called in map callbacks. Import `useTranslation` at the call site and pass `t` in.

```javascript
// Source: derived from codebase i18n patterns
// frontend/src/utils/sectionName.js
export function getSectionDisplayName(section, t) {
  if (section.translation_key) {
    return t(`sections.${section.translation_key}`, section.name);
  }
  return section.name;
}
```

**i18n file additions needed** (additive — do not remove existing keys):
```json
// en/common.json — add under existing "sections" key:
"sections": {
  "water": "Water",
  "power": "Power",
  "fuel": "Fuel",
  ...existing keys...
}

// de/common.json — add under existing "sections" key:
"sections": {
  "water": "Wasser",
  "power": "Strom",
  "fuel": "Brennstoff",
  ...existing keys...
}
```

Note: The DE values already exist under `dashboard.water`, `entries.water`, etc. The `sections.*` keys are new additions, not renames. Existing scattered keys (`dashboard.power`, `statistics.fuel`, etc.) can remain and be cleaned up in a future phase.

**DB migration** (new migration file):
```sql
-- Add translation_key column, nullable for user-created sections
ALTER TABLE utility_sections ADD COLUMN translation_key TEXT;

-- Seed default sections' translation keys by name match
UPDATE utility_sections SET translation_key = 'water' WHERE LOWER(name) = 'water';
UPDATE utility_sections SET translation_key = 'power' WHERE LOWER(name) = 'power';
UPDATE utility_sections SET translation_key = 'fuel'  WHERE LOWER(name) = 'fuel';
```

**Backend API:** The existing `getSections()` query returns `*` from `utility_sections` — once `translation_key` column exists, it is automatically included in the response. No backend code change required.

**Call sites for `getSectionDisplayName()`:**
- `AddEntry.jsx` line 365: `{s.name}` → `{getSectionDisplayName(s, t)}`
- `Dashboard.jsx`: wherever `section.name` renders in cards
- `Statistics.jsx` line ~188: section card titles (`section.name`)
- `Entries.jsx`: section/type column render
- `StatisticsDetail.jsx`: page title interpolation

### Pattern 3: Mobile Layout Fixes (MOBI-01)

**Statistics grid fix (D-11):**
```jsx
// Before:
<div className="grid grid-cols-3 gap-3">

// After:
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
// Or 2-col on mobile for readability:
<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
// Recommendation: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 — gives each card full width at 390px
```

**AddEntry date fields fix (D-12):**
```jsx
// Before (line 485):
<div className="grid grid-cols-2 gap-3">

// After:
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
```

**Drag-and-drop mobile fix (D-14):**

The current `SectionsManagementCard` uses `PointerSensor` and `KeyboardSensor`. `PointerSensor` technically handles touch events on mobile but has poor activation behavior — it fires immediately on touch, fighting with scroll. The standard @dnd-kit fix is to add `TouchSensor` with an activation constraint:

```javascript
// Source: @dnd-kit documentation pattern
import { TouchSensor, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }, // prevents accidental drag on click
  }),
  useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 }, // long-press to activate on mobile
  }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);
```

This approach retains drag on both desktop and mobile, with a 250ms long-press to initiate. Alternative (up/down buttons) is simpler and always reliable but requires more UI code. **Recommendation:** Try `TouchSensor` with delay first — it's a 3-line change. If testing reveals it's still unreliable, fall back to responsive up/down buttons (hidden on `sm:` and above, shown on mobile only).

### Anti-Patterns to Avoid

- **Do not** call `normalizeDecimal()` inside `onChange` and rewrite the field value — this causes cursor position to jump and surprises German users who expect to see their comma while typing.
- **Do not** rename existing i18n keys (`dashboard.water` etc.) — additive only to avoid breaking any future references.
- **Do not** change `type="number"` on date inputs — only change numeric amount/price inputs.
- **Do not** apply `translation_key` lookup to user-created sections when `translation_key` is NULL — always fall back to `section.name`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile drag sort | Custom touch event handlers | @dnd-kit TouchSensor (already installed) | Touch event handling is complex; @dnd-kit handles scroll conflict, activation thresholds |
| Decimal parsing across locales | Custom locale-aware parser | Simple `value.replace(',', '.')` + `parseFloat` | Only comma-as-decimal needed (D-03); full Intl.NumberFormat parsing is overkill |
| Translation fallback | Manual null checks everywhere | `t('sections.key', defaultValue)` — i18next second arg is the fallback | i18next `t()` already returns the key or second arg when key missing |

---

## Common Pitfalls

### Pitfall 1: type="number" silently drops comma input
**What goes wrong:** Browser with `type="number"` rejects commas before React's `onChange` fires. The user types "1,5", the field shows "1" or empty, React state never sees the comma.
**Why it happens:** HTML spec defines `type="number"` value validity — comma is not a valid number character in most locales at the browser level.
**How to avoid:** Switch to `type="text"` with `inputMode="decimal"` (D-01). The `inputMode="decimal"` hint shows a numeric keyboard with decimal key on mobile.
**Warning signs:** If comma input is tested in Chrome DevTools device mode, it may appear to work because the desktop keyboard is used — test on real device or with input simulation.

### Pitfall 2: Validation runs before normalization
**What goes wrong:** `validateField('usageAmount', '1,5')` calls `parseFloat('1,5')` which returns `1` (partial parse), not `NaN`. The validation passes with value `1` but `handleSubmit` sends `1.0` instead of `1.5`.
**Why it happens:** `parseFloat` stops at the first invalid character — comma — and returns the numeric prefix.
**How to avoid:** Call `normalizeDecimal(value)` inside `validateField` before `parseFloat`, AND inside `handleSubmit` before building the payload.

### Pitfall 3: Section translation_key NULL on non-default sections
**What goes wrong:** `t('sections.undefined', section.name)` is called when `translation_key` is `null` — the key `sections.undefined` may exist in i18n files or return the literal string "sections.undefined".
**Why it happens:** `null` coerced to template string becomes `"null"`, not `undefined`.
**How to avoid:** Guard explicitly: `if (section.translation_key) { return t(...) } return section.name`.

### Pitfall 4: dnd-kit TouchSensor conflicts with page scroll
**What goes wrong:** On mobile, dragging a section card also scrolls the page. The drag never activates cleanly.
**Why it happens:** Touch events are shared between scroll and drag — without an activation delay, both fire simultaneously.
**How to avoid:** Use `activationConstraint: { delay: 250, tolerance: 5 }` on `TouchSensor`. The 250ms delay distinguishes long-press (drag intent) from tap (scroll intent).

---

## Code Examples

### Numeric input field (text + inputMode)
```jsx
// All numeric amount/price inputs — after change
<Input
  id="usageAmount"
  type="text"
  inputMode="decimal"
  placeholder={t('addEntry.usageAmountPlaceholder')}
  value={usageAmount}
  onChange={(e) => handleFieldChange('usageAmount', e.target.value)}
  onBlur={() => handleBlur('usageAmount')}
  className={`h-11 ${
    touched.usageAmount && fieldErrors.usageAmount
      ? 'border-destructive focus-visible:ring-destructive'
      : ''
  }`}
/>
```

### normalizeDecimal utility
```javascript
// frontend/src/utils/normalizeDecimal.js
export function normalizeDecimal(value) {
  if (typeof value !== 'string') return String(value ?? '');
  return value.replace(',', '.');
}
```

### getSectionDisplayName utility
```javascript
// frontend/src/utils/sectionName.js
export function getSectionDisplayName(section, t) {
  if (!section) return '';
  if (section.translation_key) {
    return t(`sections.${section.translation_key}`, { defaultValue: section.name });
  }
  return section.name;
}
```

### DB migration (new file)
```sql
-- backend/migrations/002_add_translation_key.up.sql
BEGIN;
ALTER TABLE utility_sections ADD COLUMN translation_key TEXT;
UPDATE utility_sections SET translation_key = 'water' WHERE LOWER(name) = 'water';
UPDATE utility_sections SET translation_key = 'power' WHERE LOWER(name) = 'power';
UPDATE utility_sections SET translation_key = 'fuel'  WHERE LOWER(name) = 'fuel';
COMMIT;
```

```sql
-- backend/migrations/002_add_translation_key.down.sql
BEGIN;
ALTER TABLE utility_sections DROP COLUMN translation_key;
COMMIT;
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (vitest.config.js present in backend/) |
| Config file | `/Users/kevinbrauer/Documents/Projects/claude/utilityTracker/backend/vitest.config.js` |
| Quick run command | `cd /Users/kevinbrauer/Documents/Projects/claude/utilityTracker/backend && npx vitest run` |
| Full suite command | `cd /Users/kevinbrauer/Documents/Projects/claude/utilityTracker/backend && npx vitest run` |

Note: No frontend test framework detected. Tests are backend-only. Frontend changes are verified by manual smoke test or browser DevTools mobile simulation.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENTR-01 | normalizeDecimal('1,5') returns '1.5' | unit | `npx vitest run --reporter=verbose` targeting utils test | Wave 0 gap |
| ENTR-01 | normalizeDecimal('1.5') returns '1.5' (passthrough) | unit | same | Wave 0 gap |
| ENTR-02 | getSectionDisplayName with translation_key returns translated string | unit | same | Wave 0 gap |
| ENTR-02 | getSectionDisplayName with null translation_key returns section.name | unit | same | Wave 0 gap |
| MOBI-01 | No horizontal scroll at 390px viewport | manual | Chrome DevTools → iPhone 12 → check each page | manual-only |

### Sampling Rate
- **Per task commit:** `cd backend && npx vitest run` (backend tests only)
- **Per wave merge:** full backend suite + manual mobile check in Chrome DevTools
- **Phase gate:** All backend tests green + manual mobile verification before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/tests/utils/normalizeDecimal.test.js` — covers ENTR-01 normalization logic
- [ ] `backend/tests/utils/sectionName.test.js` — covers ENTR-02 lookup helper (or place in frontend if frontend test infra is added)

*(Alternatively, if utility functions live in frontend only, Wave 0 gap is: add Vitest to frontend with a single test file. Decision left to planner based on effort tradeoff.)*

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `type="number"` for decimal inputs | `type="text"` + `inputMode="decimal"` | React/HTML best practice for locale-aware input | Allows comma input; removes browser validation; requires explicit JS validation |
| Hardcoded section names in i18n | `translation_key` column + lookup helper | Phase 8 | Section names are data-driven; new sections are untranslated by design |

---

## Open Questions

1. **Settings unit price input location**
   - What we know: Settings.jsx contains `SectionsManagementCard` which handles section/meter management. The unit price input per section likely lives in `SectionEditDialog.jsx` or `SectionCard.jsx`.
   - What's unclear: Whether there is a standalone unit price input in Settings.jsx itself (the file was only partially read).
   - Recommendation: Planner should include a task to audit Settings numeric inputs and apply the same `type="text"` + normalize pattern (D-05 requires all numeric inputs across the app).

2. **Migration runner mechanism**
   - What we know: One migration file exists (`001_schema_migration.up.sql`). How migrations are applied (manual psql, a Node script, or auto-run on startup) is not confirmed.
   - What's unclear: Whether a migration runner script exists in `backend/scripts/`.
   - Recommendation: Check `backend/scripts/` and `backend/package.json` for a migration command before writing the migration task.

---

## Sources

### Primary (HIGH confidence)
- Codebase direct read — AddEntry.jsx, SectionsManagementCard.jsx, SectionsContext.jsx, input.jsx, en/common.json, de/common.json, 001_schema_migration.up.sql
- CONTEXT.md — locked decisions D-01 through D-15

### Secondary (MEDIUM confidence)
- @dnd-kit TouchSensor activation constraint pattern — standard documented approach, consistent with dnd-kit README and GitHub examples

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already present, verified by import statements in source
- Architecture: HIGH — normalization pattern is simple and verified against actual parseFloat call sites; translation pattern verified against existing i18n structure
- Pitfalls: HIGH — type="number" comma behavior is a well-known browser constraint; NULL translation_key guard is a straightforward code correctness issue

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable stack, no fast-moving dependencies)
