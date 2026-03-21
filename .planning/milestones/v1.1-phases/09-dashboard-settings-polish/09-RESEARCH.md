# Phase 9: Dashboard & Settings Polish - Research

**Researched:** 2026-03-21
**Domain:** React UI polish — toggle state, inline editing extension, icon library expansion
**Confidence:** HIGH

## Summary

Phase 9 contains three tightly-scoped UI tasks that extend existing patterns already established in the codebase. All three requirements have clear implementation paths with no API changes required.

DASH-01 (usage/cost toggle) is a purely frontend concern: the stats API already returns `total_usage` and `total_cost` per section. The toggle needs only local React state (or `localStorage` for persistence) and a formatting switch in `Dashboard.jsx`. The existing `formatCurrency` hook is used for cost display; usage display will need raw number formatting with the section's `unit` field.

SETT-01 (inline meter name editing) is already substantially implemented. `MeterRow.jsx` has full inline-edit logic: clicking the name text sets `editing=true`, renders an Input, and saves on blur/Enter. The `isNew` prop already triggers auto-edit on new meters. The gap is that the name is rendered as a plain `<span onClick={() => setEditing(true)}>` with no visual affordance (pencil icon or hover underline) matching how section names work via the edit dialog. The requirement says "editable inline, same as section names" — section names already open a modal dialog, whereas meters already edit truly inline. The meter approach is actually superior. No logic change is needed, only a visual affordance to make the inline edit discoverable.

VISL-01 (water icon expansion) requires adding new icon entries to `ICON_MAP` in `IconPickerGrid.jsx`. The project already imports `react-icons` (v5.5.0) and uses `hi2` (Heroicons 2). Heroicons 2 has no dedicated water/droplet icon — `HiOutlineEyeDropper` is the closest. The `react-icons` package also bundles `fa6` (Font Awesome 6) and `lu` (Lucide) which are already installed. `fa6` has `FaDroplet`, `FaWater`, `FaFaucet`, `FaFaucetDrip`; `lu` has `LuDroplet`, `LuDroplets`, `LuGlassWater`, `LuWaves`. These can be imported directly without adding any new npm package.

**Primary recommendation:** Extend existing patterns — no new libraries, no API changes, no new hooks. All three requirements are pure frontend edits to `Dashboard.jsx`, `MeterRow.jsx`, and `IconPickerGrid.jsx` respectively.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | Dashboard toggle: switch between usage amounts and cost values per section | Stats API already returns both `total_usage` and `total_cost`; toggle is local state in Dashboard.jsx |
| SETT-01 | Meter names editable inline, same as section names | MeterRow.jsx already has full inline-edit logic; only visual affordance (hover state + icon) needs polish |
| VISL-01 | Water sections offer improved icon options: droplet, wave, and additional water-themed icons | fa6 and lu packages (already bundled with react-icons) provide FaDroplet, FaWater, FaFaucet, LuDroplet, LuDroplets, LuGlassWater, LuWaves |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-icons | 5.5.0 | Icon library (hi2, fa6, lu sub-packages) | Already installed; fa6 and lu have water icons hi2 lacks |
| react (useState) | 19.1.0 | Toggle state management | Project-standard; no external state needed for simple boolean |
| framer-motion | 11.18.2 | Animate toggle transitions | Already used project-wide for all interactive elements |
| react-i18next | 16.5.4 | Translation keys for toggle labels | All user-visible strings must go through i18n |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage (native) | — | Persist toggle preference across sessions | Same pattern used for currency rates cache and last-used section/meter in AddEntry |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| localStorage for toggle | React state only (no persistence) | State-only is simpler but toggle resets on navigation; localStorage matches user expectation for a preference |
| fa6/lu icons | Install @heroicons/react separately | No benefit — react-icons already bundles all needed packages |

**Installation:** No new packages required. All libraries already installed.

---

## Architecture Patterns

### Recommended Project Structure

No new files required. All changes are modifications to existing files:

```
frontend/src/
├── pages/
│   └── Dashboard.jsx           # Add toggle state + conditional display logic
├── components/settings/
│   ├── MeterRow.jsx             # Add visual affordance for inline edit (pencil icon on hover)
│   └── IconPickerGrid.jsx       # Add water icons from fa6 and lu sub-packages
└── i18n/locales/
    ├── en/common.json           # Add dashboard toggle keys + icon aria labels
    └── de/common.json           # Same keys in German
```

### Pattern 1: Dashboard Usage/Cost Toggle

**What:** A two-state toggle (pill/segmented control) above the section cards that switches whether each card shows `total_cost` (formatted via `formatCurrency`) or `total_usage` (formatted as raw number + unit).

**When to use:** The stats API returns both fields per section object:
```json
{ "id": 1, "name": "Water", "total_cost": 12.50, "total_usage": 42.3, "entry_count": 5, "unit": "m³" }
```

**Current Dashboard.jsx behavior:** Line 218 always renders `formatCurrency(section.total_cost)`. The toggle switches this to either `formatCurrency(section.total_cost)` or `Number(section.total_usage).toLocaleString() + ' ' + section.unit`.

**State management:**
```jsx
// Local state — persist preference in localStorage
const [displayMode, setDisplayMode] = useState(
  () => localStorage.getItem('dashboard_display_mode') || 'cost'
);

const handleToggle = (mode) => {
  setDisplayMode(mode);
  localStorage.setItem('dashboard_display_mode', mode);
};
```

**Rendering the value:**
```jsx
// Replace the static formatCurrency(section.total_cost) call
{displayMode === 'cost'
  ? formatCurrency(section.total_cost)
  : `${Number(section.total_usage).toLocaleString()} ${section.unit || ''}`}
```

**Toggle UI:** A segmented two-button control styled consistently with the existing currency/language toggles in Settings. Use `motion.button` with `whileTap={{ scale: 0.98 }}`.

### Pattern 2: MeterRow Visual Affordance for Inline Edit

**What:** The inline edit is already fully functional in `MeterRow.jsx`. The only missing piece is discoverability — users don't know the name is clickable.

**Current state (lines 107-113 of MeterRow.jsx):**
```jsx
<span
  onClick={() => setEditing(true)}
  className="text-sm text-foreground cursor-pointer flex-1"
>
  {meter.name}
</span>
```

**Required change:** Add hover affordance. Two options:
1. Show a pencil icon on row hover (matches the group-hover pattern already used for delete/mode buttons on lines 137-143)
2. Add `hover:underline` to the span

The group-hover pattern is already established and preferred — add `HiOutlinePencilSquare` with `opacity-0 group-hover:opacity-100` before the delete button, clicking it calls `setEditing(true)`.

```jsx
<button
  type="button"
  onClick={() => setEditing(true)}
  className="flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
  aria-label={t('settings.sections.renameMeter')}
>
  <HiOutlinePencilSquare className="h-4 w-4" />
</button>
```

### Pattern 3: Water Icon Expansion in IconPickerGrid

**What:** Add water-specific icons to `ICON_MAP`. The current map has `HiOutlineEyeDropper` from hi2 but no dedicated water, droplet, or wave icons.

**Available icons from already-installed packages:**

From `react-icons/fa6` (Font Awesome 6):
- `FaDroplet` — single water droplet (canonical "water" icon)
- `FaWater` — wave/water surface
- `FaFaucet` — tap/faucet
- `FaFaucetDrip` — dripping faucet

From `react-icons/lu` (Lucide):
- `LuDroplet` — clean droplet outline
- `LuDroplets` — multiple droplets
- `LuGlassWater` — glass of water
- `LuWaves` — wave lines

**Minimum to satisfy VISL-01:** Droplet + Wave + at least 2 more. Recommend adding all 8 above (4 fa6 + 4 lu) for a comprehensive water group.

**Import pattern (matches existing style):**
```jsx
import { FaDroplet, FaWater, FaFaucet, FaFaucetDrip } from 'react-icons/fa6';
import { LuDroplet, LuDroplets, LuGlassWater, LuWaves } from 'react-icons/lu';
```

Then add to `ICON_MAP`:
```jsx
export const ICON_MAP = {
  // ... existing icons ...
  FaDroplet,
  FaWater,
  FaFaucet,
  FaFaucetDrip,
  LuDroplet,
  LuDroplets,
  LuGlassWater,
  LuWaves,
};
```

**Important:** `ICON_MAP` keys are stored as strings in the database (the `icon` field on sections). Adding new keys is backward-compatible — old sections that have no water icon are unaffected. No migration needed.

### Anti-Patterns to Avoid

- **Fetching new data for the toggle:** The API already returns both `total_usage` and `total_cost`. Do not add a new API endpoint or refetch on toggle — switch is purely display-layer.
- **Applying the toggle to the "Total Spending" summary card:** The top-left card shows `totalCost` (sum across all sections). Switching that to total usage is meaningless (it aggregates different units). Keep the summary card always showing cost.
- **Storing icon names with package prefix in UI state:** The `ICON_MAP` already uses component name as key (e.g. `HiOutlineBolt`). New icons must follow the same convention (`FaDroplet`, `LuWaves`). The key is stored in the DB — it must match the map key exactly.
- **Breaking existing sections with no icon:** `SectionCard.jsx` line 102 already guards: `const IconComponent = ICON_MAP[section.icon] || null`. Adding new keys cannot break sections that have old or undefined icons.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toggle UI component | Custom CSS toggle from scratch | Reuse `motion.button` pattern from Settings currency/language toggles | Already styled, accessible, mobile-friendly |
| Icon search/filtering | Custom search over icon names | Static curated list in ICON_MAP | 30 icons is manageable; search adds complexity with no user benefit at this scale |
| Usage number formatting | Custom formatter | `Number().toLocaleString()` + unit string | Already used in Dashboard line 290 for recent entries list |
| localStorage persistence | Custom hook | Inline `localStorage.getItem/setItem` | Same direct pattern used in AddEntry.jsx and CurrencyContext.jsx |

---

## Common Pitfalls

### Pitfall 1: Toggle applies to the summary "Total Spending" card
**What goes wrong:** If you switch the summary card to show total usage, the number is a sum of `m³ + kWh + L` — a meaningless mixed-unit aggregate.
**Why it happens:** The summary card is treated like the section cards in a naive implementation.
**How to avoid:** The toggle should only affect per-section cards. The "Total Spending" card always shows `formatCurrency(totalCost)`.
**Warning signs:** The summary card shows a raw number without a currency symbol.

### Pitfall 2: `total_usage` is null for sections with no cost entries
**What goes wrong:** Some entries may have no `usage_amount` or only cost data, yielding `null` or `0` for `total_usage`.
**Why it happens:** The stats aggregation does `SUM(usage_amount)` which returns null if no rows match.
**How to avoid:** Guard with `Number(section.total_usage || 0).toLocaleString()`.
**Warning signs:** Dashboard shows "NaN" or blank in usage mode.

### Pitfall 3: `section.unit` missing from stats API response
**What goes wrong:** Usage display shows "42.3 " with no unit because `unit` is not returned by the `/api/entries/stats` endpoint.
**Why it happens:** The stats endpoint returns section aggregates; `unit` is a property of the section record, not the entries aggregate.
**How to avoid:** Cross-reference against `sectionLookup` (already built from `contextSections` in Dashboard.jsx, line 85-88). Use `ctxSection?.unit || ''` for the unit label.
**Warning signs:** Usage values show without unit suffix.

### Pitfall 4: MeterRow edit pencil conflicts with drag handle click area
**What goes wrong:** On mobile, the pencil icon and drag handle are close together, causing accidental drags when tapping the edit button.
**Why it happens:** All icon buttons sit in the same right-side row.
**How to avoid:** The pencil button must have `e.stopPropagation()` consistent with the existing edit/archive buttons in `SectionCard.jsx` (lines 129, 139). The TouchSensor already has delay=250ms+tolerance=5px to prevent accidental drags.

### Pitfall 5: Icon key collision between packages
**What goes wrong:** If two packages have a component with the same export name, the second import shadows the first.
**Why it happens:** fa6 has `FaWater`; if another package also had `FaWater` and it was named identically, they'd collide in `ICON_MAP`.
**How to avoid:** All chosen icon names are unique across hi2, fa6, and lu. Verify no name overlap before adding.

---

## Code Examples

### Dashboard toggle state initialization with localStorage
```jsx
// In Dashboard component body
const [displayMode, setDisplayMode] = useState(
  () => localStorage.getItem('dashboard_display_mode') || 'cost'
);
```

### Segmented toggle control (matches Settings style)
```jsx
<div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
  {['cost', 'usage'].map((mode) => (
    <motion.button
      key={mode}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        setDisplayMode(mode);
        localStorage.setItem('dashboard_display_mode', mode);
      }}
      className={[
        'px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150',
        displayMode === mode
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      ].join(' ')}
    >
      {t(mode === 'cost' ? 'dashboard.toggleCost' : 'dashboard.toggleUsage')}
    </motion.button>
  ))}
</div>
```

### Conditional value display in section card
```jsx
// Replace static formatCurrency(section.total_cost) with:
{displayMode === 'cost'
  ? formatCurrency(section.total_cost)
  : `${Number(section.total_usage || 0).toLocaleString()} ${ctxSection?.unit || ''}`}
```

### Water icon imports for IconPickerGrid
```jsx
import { FaDroplet, FaWater, FaFaucet, FaFaucetDrip } from 'react-icons/fa6';
import { LuDroplet, LuDroplets, LuGlassWater, LuWaves } from 'react-icons/lu';
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Heroicons-only icons (hi2) | react-icons multi-package (hi2 + fa6 + lu) | Access to 200k+ icons without new dependencies |
| Always showing cost on Dashboard | Toggle between cost and usage | Users who track consumption (not cost) get more value |

---

## Open Questions

1. **Should the toggle state be per-user (server-persisted) or per-browser (localStorage)?**
   - What we know: All other preferences (language, currency) are stored client-side
   - What's unclear: Whether users want the preference synced across devices
   - Recommendation: Use `localStorage` for consistency with existing preference storage; no API change needed

2. **Should `unit` come from `contextSections` or should the stats API be extended to include it?**
   - What we know: `contextSections` (from `useSections` hook) already has `unit` per section; stats API may or may not include it
   - What's unclear: Whether `stats.sections[].unit` is already present in the API response
   - Recommendation: Use `sectionLookup[section.name]?.unit` from `contextSections` — already built in Dashboard.jsx (line 85-88). Zero API changes needed.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `frontend/vitest.config.js` |
| Quick run command | `cd frontend && npx vitest run` |
| Full suite command | `cd frontend && npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | Toggle switches section card from cost to usage display | manual-only | — | N/A |
| SETT-01 | Clicking meter name activates inline edit field | manual-only | — | N/A |
| VISL-01 | IconPickerGrid renders new water icons | manual-only | — | N/A |

**Manual-only justification:** These are all visual/interactive UI behaviors requiring a rendered browser environment. The existing vitest config uses `environment: 'node'` — no jsdom/happy-dom configured. Setting up a full component test environment (React Testing Library + jsdom) is disproportionate to the scope of three small UI polish tasks. Verification is best done by inspection in the running app.

### Sampling Rate
- **Per task commit:** Manual browser check of the changed component
- **Per wave merge:** Full app smoke-test in dev (dashboard loads, toggle works, meter name editable, water icons visible)
- **Phase gate:** All three success criteria verified by hand before `/gsd:verify-work`

### Wave 0 Gaps
None — no new test infrastructure required. Existing vitest setup is sufficient for the backend; frontend visual changes are verified manually.

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `Dashboard.jsx`, `MeterRow.jsx`, `IconPickerGrid.jsx`, `SectionCard.jsx`, `SectionsManagementCard.jsx`
- Direct code inspection: `i18n/locales/en/common.json`, `context/EntriesDataContext.jsx`
- Runtime verification: `node -e` against installed `react-icons` package to enumerate actual water-related icon exports

### Secondary (MEDIUM confidence)
- `backend/tests/api.test.js` lines 291-300: confirms `total_usage` and `total_cost` are present on stats section objects
- `frontend/package.json`: confirmed react-icons 5.5.0 installed, which bundles hi2, fa6, lu without additional installs

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against installed node_modules
- Architecture: HIGH — all patterns copied from existing working code in the same codebase
- Pitfalls: HIGH — derived from reading actual component code, not assumptions

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable dependencies, internal codebase)
