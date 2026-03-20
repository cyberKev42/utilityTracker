# Phase 5: Dynamic Entry Form - Research

**Researched:** 2026-03-19
**Domain:** React form refactoring, cascading dropdowns, localStorage persistence, date-range split preview
**Confidence:** HIGH

## Summary

Phase 5 is a **refactor and extension**, not a greenfield build. `AddEntry.jsx` already implements the full dual-mode form (usage_amount + reading), date range fields, cost preview, and success state. The gap is that it uses a flat meter dropdown where sections are `<optgroup>` labels — the context decisions require **cascading section → meter dropdowns** instead.

The backend (`POST /api/entries`) already handles all four ENTR requirements: single-day usage, date-range splitting (ENTR-02), reading-delta calculation (ENTR-03), and initial baseline detection returning `is_initial: true` (ENTR-04). No backend changes are needed.

The frontend work is: replace the single meter selector with cascading dropdowns, wire localStorage for last-used section+meter on page load, add the "first reading" inline banner triggered by `is_initial` from an API call to `GET /api/sections/meters/:meterId/last-reading`, add the split preview below the date fields, extend cost preview to pull `unit_price` from the section data in SectionsContext instead of requiring user manual input, and add new i18n keys.

**Primary recommendation:** Modify `AddEntry.jsx` in-place — do not create a new component. The existing patterns (AnimatePresence, per-field validation on blur, success/reset state) are correct and should be extended, not replaced.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Cascading dropdowns: first pick a section, then pick a meter within it
- Form remembers the last-used section+meter (localStorage) for quicker repeat entries
- Entry mode determined automatically by the meter's `entry_mode` setting — no toggle on the entry form
- Show the section's unit next to the input field, plus the last meter reading or usage amount for reference
- Two separate date fields (start date, end date) using native date pickers — no calendar range picker library
- Single-day entries default the date to today
- When a date range is entered, show a split preview below the fields: "120 kWh over 30 days = 4.0 kWh/day"
- End date defaults to today for range entries
- Inline info banner within the form when a reading-mode meter has no prior entries: "This is the first reading for this meter. Enter the current value — usage will start from the next entry."
- After initial reading saved (usage=0), show success message with "Add another" button — matches existing AddEntry success pattern
- No separate wizard or modal step
- When the section has a unit price configured in settings, show "Estimated cost: €XX.XX" below the amount field
- Already partially implemented in AddEntry.jsx — extend to work with dynamic sections
- Keep dedicated /add-entry page route (no dialog or dashboard widget)
- On success, show success screen with "Add another" button
- "Add another" resets ALL fields including meter selection (user picks fresh each time)
- Last-used meter memory only applies when first navigating to the page, not on "Add another"

### Claude's Discretion
- Exact validation error message wording and placement
- Animation/transition details for mode switching and split preview
- Responsive layout adjustments for mobile
- How to fetch and display the last reading for the selected meter

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENTR-01 | User can enter a usage amount for a single date, added to the meter's running total | AddEntry.jsx already implements this; refactor to use cascading section/meter selection |
| ENTR-02 | User can enter a usage amount for a date range, split evenly across the days | Backend splitIntoDailyRows() already handles this; add split preview UI below date fields |
| ENTR-03 | User can enter a current meter reading and the app calculates usage since last reading | Backend reading-delta logic exists in entriesService.createEntry(); AddEntry.jsx already has reading mode; wire last-reading display via existing GET /api/sections/meters/:meterId/last-reading |
| ENTR-04 | First entry for a meter in reading mode accepts initial reading and records usage as zero | Backend returns is_initial:true; show inline banner when last-reading API returns null for a reading-mode meter |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x (existing) | Form state, hooks | Already in project |
| framer-motion | existing | AnimatePresence for conditional fields and split preview | Already used in AddEntry.jsx |
| react-i18next | existing | All new strings must be i18n keys | Already used in AddEntry.jsx |
| shadcn/ui | existing | Input, Label, Button, Card | Already used in AddEntry.jsx |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage (browser API) | native | Persist last-used sectionId + meterId | On page load only; cleared on "Add another" |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native date inputs | Date picker library | User decided: native only |
| Cascading dropdowns | Single grouped select | User decided: cascading |

**Installation:**
No new packages required. All dependencies are already in the project.

---

## Architecture Patterns

### Recommended Project Structure
No new files required. Changes are confined to:
```
frontend/src/
├── pages/AddEntry.jsx           # Modify in-place
├── i18n/locales/en/common.json  # Add new keys
└── i18n/locales/de/common.json  # Add translated keys
```

### Pattern 1: Cascading Section → Meter Dropdowns
**What:** Two separate `<select>` elements. Section dropdown is always visible. Meter dropdown only appears after a section is selected. On section change, reset meterId and mode-specific fields.
**When to use:** Required per user decision; replaces current single optgroup select.
**Example:**
```jsx
// Source: existing AddEntry.jsx pattern, extended
const [sectionId, setSectionId] = useState('');
const [meterId, setMeterId] = useState('');

const selectedSection = sections.find(s => s.id === sectionId) ?? null;
const availableMeters = selectedSection?.meters ?? [];
const selectedMeter = availableMeters.find(m => m.id === meterId) ?? null;
const entryMode = selectedMeter?.entry_mode ?? 'usage_amount';

// On section change: reset meter and downstream fields
const handleSectionChange = (newSectionId) => {
  setSectionId(newSectionId);
  setMeterId('');
  setUsageAmount('');
  setMeterReading('');
  setFieldErrors({});
  setTouched(prev => ({ sectionId: true }));
};
```

### Pattern 2: localStorage Last-Used Meter
**What:** On mount, read `addEntry.lastUsed` from localStorage. If the stored sectionId and meterId still exist in SectionsContext data, pre-select them. On successful submission, do NOT update localStorage. On page load only.
**When to use:** Only applied once when component mounts; "Add another" skips this entirely.
**Example:**
```jsx
// Source: browser localStorage API
const STORAGE_KEY = 'addEntry.lastUsed';

useEffect(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved?.sectionId && saved?.meterId) {
      const sec = sections.find(s => s.id === saved.sectionId);
      const met = sec?.meters?.find(m => m.id === saved.meterId);
      if (sec && met) {
        setSectionId(saved.sectionId);
        setMeterId(saved.meterId);
      }
    }
  } catch { /* ignore corrupt storage */ }
}, []); // empty deps: runs once on mount only

// Save on meter selection change (not on submit)
useEffect(() => {
  if (sectionId && meterId) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sectionId, meterId }));
  }
}, [sectionId, meterId]);
```

### Pattern 3: Last Reading Display + First-Reading Banner
**What:** When a reading-mode meter is selected, fetch `GET /api/sections/meters/:meterId/last-reading`. If null, the meter has no prior entries — show the inline first-reading banner. If present, show "Last reading: X unit on YYYY-MM-DD".
**When to use:** Whenever `isReadingMode && meterId` is truthy.
**Example:**
```jsx
const [lastReading, setLastReading] = useState(null); // null = loading/unknown
const [lastReadingLoaded, setLastReadingLoaded] = useState(false);

useEffect(() => {
  if (!isReadingMode || !meterId) {
    setLastReading(null);
    setLastReadingLoaded(false);
    return;
  }
  setLastReadingLoaded(false);
  api.get(`/api/sections/meters/${meterId}/last-reading`)
    .then(data => { setLastReading(data); setLastReadingLoaded(true); })
    .catch(() => { setLastReading(null); setLastReadingLoaded(true); });
}, [meterId, isReadingMode]);

// Banner condition:
const showFirstReadingBanner = isReadingMode && lastReadingLoaded && lastReading === null;
```

Note: The backend `getLastReading` returns `null` (HTTP 200 with null body) when no prior entries exist, not a 404. Verify the API response shape from `sectionsController.getLastReading`.

### Pattern 4: Date Range Split Preview
**What:** When startDate !== endDate in usage_amount mode, compute and display the per-day amount as an animated inline callout below the date fields. The preview is purely client-side math.
**When to use:** Only in usage_amount mode, only when both dates are valid and different, and usageAmount > 0.
**Example:**
```jsx
const splitPreview = useMemo(() => {
  if (isReadingMode) return null;
  if (!startDate || !endDate || startDate === endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) return null;
  const days = Math.round((end - start) / 86400000) + 1;
  const usage = parseFloat(usageAmount);
  if (isNaN(usage) || usage <= 0) return null;
  const perDay = Math.round((usage / days) * 100) / 100;
  return { days, perDay };
}, [startDate, endDate, usageAmount, isReadingMode]);
```

Display: `"{usageAmount} {unit} over {days} days = {perDay} {unit}/day"`

### Pattern 5: Cost Preview from SectionsContext
**What:** The existing cost preview uses a manual `unitPrice` input. The decision requires auto-fetching from section settings. The `unit_price` field in `utility_settings` is already resolved by the backend — the frontend should read it from section data if exposed, or continue showing the manual input field and let the backend resolve it silently.
**When to use:** The section's `unit_price` may not be in the SectionsContext payload. Check what `getSections()` returns. If not present, keep the optional manual input field. The backend already auto-resolves unit_price from settings at write time.

**Important:** Verify whether `utility_settings.unit_price` is returned in the sections API response before assuming it can be used for cost preview. If not, the simplest approach is to keep the existing optional unit price field and let backend handle cost calculation — which it already does.

### Anti-Patterns to Avoid
- **Creating a new component:** The existing AddEntry.jsx has all validation, error handling, and success state. Don't rebuild from scratch.
- **Calling last-reading API on every render:** Only fetch when meterId changes in reading mode.
- **Saving to localStorage on "Add another":** The reset should skip localStorage write. The save-on-meter-selection effect handles this correctly since sectionId/meterId will be empty after reset.
- **Assuming `null` vs `{}` from last-reading API:** The backend returns the entry row or null. Handle both cases explicitly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date-range splitting | Custom daily split logic | Backend `splitIntoDailyRows()` via `POST /api/entries` | Backend already handles rounding remainder correctly |
| Reading delta calculation | Frontend delta math | Backend `createEntry()` reading mode | Backend has the full entry history; frontend can't trust its own cached state |
| First-reading detection | Track entry count in frontend | Backend returns `is_initial: true` on response | Single source of truth, no race conditions |
| Currency formatting | Custom number format | `useCurrency()` / `formatCurrency()` hook | Already used in AddEntry.jsx, handles locale formatting |

**Key insight:** The backend already handles all the complex math (delta, splitting, rounding). The frontend's job is form state and display only.

---

## Common Pitfalls

### Pitfall 1: lastReading API returns null vs no-entry-exists
**What goes wrong:** Treating a null lastReading as a fetch error instead of "no prior entries" (ENTR-04 trigger).
**Why it happens:** HTTP 200 with a null body looks like an empty response.
**How to avoid:** Use a separate `lastReadingLoaded` boolean flag. Only show the first-reading banner when loaded AND data is null.
**Warning signs:** Banner never shows, or shows even when entries exist.

### Pitfall 2: Section change doesn't reset meter error state
**What goes wrong:** Validation error for "Please select a meter" persists visually after section changes because fieldErrors and touched are not reset.
**Why it happens:** The existing `useEffect` on `meterId` clears mode-specific fields but the section change also needs to clear `meterId`-related errors.
**How to avoid:** In `handleSectionChange`, explicitly clear `fieldErrors.meterId` and `touched.meterId` alongside resetting `meterId`.

### Pitfall 3: localStorage sectionId/meterId stale after settings changes
**What goes wrong:** User deletes a meter in settings, then navigates to Add Entry. localStorage still has the old IDs. Form attempts to pre-select a meter that no longer exists.
**Why it happens:** localStorage is not invalidated on section/meter deletions.
**How to avoid:** Always validate stored IDs against current `sections` data before pre-selecting. The Pattern 2 example above does this with `sections.find()` checks.

### Pitfall 4: Split preview showing during validation errors
**What goes wrong:** Split preview appears even when endDate is before startDate, confusing the user.
**Why it happens:** Preview computed independently from validation.
**How to avoid:** The splitPreview useMemo should check `end >= start` before returning a value (already shown in Pattern 4 example above).

### Pitfall 5: "Add another" triggers last-used localStorage load
**What goes wrong:** After "Add another", the form pre-fills the previous meter instead of starting fresh.
**Why it happens:** If the mount-time localStorage load effect runs again after reset.
**How to avoid:** Track a `hasLoadedFromStorage` ref so the localStorage init effect only runs once per mount, not on re-renders triggered by state resets.

```jsx
const hasLoadedFromStorage = useRef(false);
useEffect(() => {
  if (hasLoadedFromStorage.current) return;
  hasLoadedFromStorage.current = true;
  // ... load from localStorage
}, []);
```

---

## Code Examples

Verified patterns from existing codebase:

### Existing animation pattern (for split preview)
```jsx
// Source: AddEntry.jsx (existing cost preview pattern)
<AnimatePresence>
  {splitPreview !== null && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <div className="rounded-lg bg-accent/40 border border-border/30 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {t('addEntry.splitPreview', {
            total: usageAmount,
            unit: selectedSection?.unit,
            days: splitPreview.days,
            perDay: splitPreview.perDay,
          })}
        </span>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

### Info banner pattern (for first-reading)
```jsx
// Pattern: inline info banner (no existing example — use muted-foreground/info styling)
{showFirstReadingBanner && (
  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted border border-border/50">
    <HiInformationCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
    <p className="text-sm text-muted-foreground">{t('addEntry.firstReadingInfo')}</p>
  </div>
)}
```

### i18n keys to add (EN)
```json
{
  "addEntry": {
    "section": "Section",
    "sectionPlaceholder": "Select a section",
    "lastReading": "Last reading: {{value}} {{unit}} on {{date}}",
    "lastUsage": "Last entry: {{value}} {{unit}} on {{date}}",
    "firstReadingInfo": "This is the first reading for this meter. Enter the current value — usage will start from the next entry.",
    "splitPreview": "{{total}} {{unit}} over {{days}} days = {{perDay}} {{unit}}/day"
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single grouped `<select>` with `<optgroup>` | Cascading section → meter dropdowns | Phase 5 decision | Better UX, clearer selection flow |
| Manual unit price input required for cost preview | Auto-resolve from section settings; manual field optional | Phase 5 decision | Backend already does this; frontend can keep optional input |

---

## Open Questions

1. **Does `getSections()` API return `unit_price` from utility_settings?**
   - What we know: `utility_settings` table has `unit_price`; backend resolves it at write time
   - What's unclear: Whether the sections list API joins and returns it for use in the cost preview
   - Recommendation: Before implementing cost preview, read `backend/routes/sections.js` and `sectionsService.getSections()`. If not returned, keep the optional manual input field — this is simpler and the backend auto-resolves anyway.

2. **Response shape of GET /api/sections/meters/:meterId/last-reading**
   - What we know: Returns the last entry row or null (from `sectionsService.getLastReading`)
   - What's unclear: HTTP status when no entry exists (200 with null, or 404?)
   - Recommendation: Read `sectionsController.getLastReading` (line 239) before implementing the fetch — confirm null vs 404 handling.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | backend/package.json (`"test": "vitest run"`) |
| Quick run command | `cd backend && npm test` |
| Full suite command | `cd backend && npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENTR-01 | Single-day usage entry saved correctly | integration | `cd backend && npm test -- --grep "SC-3"` | ✅ backend/tests/api.test.js |
| ENTR-02 | Date-range entry split evenly across days | integration | `cd backend && npm test -- --grep "date range"` | ✅ backend/tests/api.test.js |
| ENTR-03 | Reading mode calculates delta since last reading | integration | `cd backend && npm test -- --grep "SC-3"` | ✅ backend/tests/api.test.js |
| ENTR-04 | First entry for meter in reading mode: usage=0, is_initial=true | integration | `cd backend && npm test -- --grep "initial"` | ✅ backend/tests/api.test.js (partial — verify coverage) |

### Sampling Rate
- **Per task commit:** `cd backend && npm test`
- **Per wave merge:** `cd backend && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Verify ENTR-04 `is_initial` test case exists in `backend/tests/api.test.js` — grep for "initial" or "first reading"
- [ ] Frontend has no automated tests; ENTR-01 through ENTR-04 UI behaviors require manual verification per the success criteria

---

## Sources

### Primary (HIGH confidence)
- Direct code read: `frontend/src/pages/AddEntry.jsx` — full form implementation, existing patterns
- Direct code read: `backend/services/entriesService.js` — createEntry, splitIntoDailyRows, reading delta logic
- Direct code read: `frontend/src/context/SectionsContext.jsx` — useSections hook, available data shape
- Direct code read: `frontend/src/services/entriesService.js` — createEntry API wrapper
- Direct code read: `backend/routes/sections.js` — last-reading endpoint exists at GET /api/sections/meters/:meterId/last-reading
- Direct code read: `backend/services/sectionsService.js` — getLastReading returns row or null
- Direct code read: `frontend/src/i18n/locales/en/common.json` — existing addEntry i18n keys
- Direct code read: `.planning/phases/05-dynamic-entry-form/05-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)
- `backend/tests/api.test.js` — confirms SC-3 entry tests exist; ENTR-04 first-reading test coverage not fully verified

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from existing codebase
- Architecture: HIGH — patterns derived directly from existing AddEntry.jsx code
- Pitfalls: HIGH — derived from direct code inspection, localStorage behavior, and backend API shapes
- Open questions: LOW confidence on two specific API details that require a quick code read before implementation

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable — no external dependencies changing)
