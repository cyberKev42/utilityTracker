# Phase 4: Section & Meter Management UI - Research

**Researched:** 2026-03-19
**Domain:** React settings UI — CRUD, drag-and-drop reorder, expandable cards, inline editing, icon picker, i18n
**Confidence:** HIGH

## Summary

Phase 4 adds a full section and meter management interface to the existing Settings page. All core building blocks are already in place: SectionsContext exposes every needed mutation, the dialog/card/button/input shadcn components exist, and Framer Motion is used throughout the app. The only new dependency is @dnd-kit (core + sortable) for drag-and-drop reorder.

The architecture is additive — a new `SectionsManagement` card group inserted between Account and Language cards in `Settings.jsx`, backed by several focused sub-components: `SectionCard`, `SectionEditDialog`, `MeterRow`, `IconPickerGrid`, and an `ArchivedSectionsArea`. Each component is a thin consumer of `useSections()` and `useTranslation()` with no local data fetching.

The primary risk area is dnd-kit integration: pointer and keyboard sensors must be configured correctly, and drag-over visual feedback (drop indicator line + shadow lift) requires the `@dnd-kit/sortable` `useSortable` hook rather than vanilla `@dnd-kit/core`. All reorder operations go through the optimistic `reorderSections` / `reorderMeters` context mutations with error toast on failure.

**Primary recommendation:** Install `@dnd-kit/core` and `@dnd-kit/sortable`, decompose the UI into the five focused components listed above, wire every mutation through `useSections()`, and extend both translation files with a single `settings.sections.*` key namespace.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page placement & layout**
- Section & meter management lives on the existing Settings page as a new card group, positioned between Account and Language cards
- Each section is an expandable card: collapsed shows icon + name + unit + edit/drag handles; expanded reveals meter list
- Cards collapse/expand on click — keeps the page compact with many sections
- "Archived" area at the bottom of the sections list (collapsible) shows archived sections with restore and permanent delete options
- "+" Add Section button below the section list

**Section editing UX**
- Create and edit sections via a dialog/modal (reuse existing shadcn dialog.jsx)
- Dialog fields: name (text input), unit (dropdown), icon (picker grid)
- Same dialog for create and edit — pre-filled for edit, empty for create
- Section archive action available from the section card (not in the edit dialog)
- Meters use inline editing: click meter name to rename in-place, press Enter or blur to save
- "+" Add Meter inserts a new row at the bottom of the meter list in edit mode, auto-focused

**Unit selection**
- Dropdown with predefined common units: kWh, m³, L, gal, therms, etc.
- "Custom..." option at the bottom reveals a free text input for non-standard units
- Default units for seeded sections: Water = m³, Power = kWh, Fuel = L

**Icon selection**
- Predefined grid of ~30 utility-relevant icons from the HiOutline (Heroicons) set already in the project
- Icons displayed as a grid within the section edit dialog
- Consistent with existing Settings page icon style — professional SVG icons, same rendering everywhere
- No emoji — React Icons / HiOutline only

**Delete & archive behavior**
- Sections: archive first, then delete from the archived area (two-step safety)
- Archived sections shown in a collapsible "Archived" area at the bottom with restore and permanent delete options
- Permanent delete shows confirmation dialog warning about data loss
- Meters: direct delete with confirmation dialog ("Delete Meter X? This will remove all entries.")
- No archive layer for meters — simpler entities

**Drag-and-drop reorder**
- Library: @dnd-kit/core (new dependency)
- Both sections AND meters are reorderable via drag-and-drop
- Visual feedback: lifted card with shadow + drop indicator line between items
- Optimistic reorder (per Phase 3 SectionsContext decision) — reverts on server failure with error toast
- Drag handle visible on each section card and meter row

**Internationalization**
- All new UI labels (button text, dialog titles, field labels, confirmation messages, archived section area) added to both EN and DE translation files
- Section and meter names display as typed by the user (not translated) — per I18N-02

### Claude's Discretion
- Exact icon selection for the ~30 predefined icons
- Animation/transition details for expand/collapse and drag
- Exact layout spacing and responsive breakpoints
- Error toast implementation for failed operations
- Keyboard accessibility details for drag-and-drop

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SECT-01 | User can create a new utility section with name, unit, and icon | SectionEditDialog (create mode) → `createSection()` from SectionsContext |
| SECT-02 | User can edit a section's name, unit, and icon | SectionEditDialog (edit mode, pre-filled) → `updateSection()` |
| SECT-03 | User can reorder sections via drag-and-drop | @dnd-kit/sortable `SortableContext` + `useSortable` on each SectionCard → `reorderSections()` |
| SECT-04 | Default Water/Power/Fuel sections are editable like custom sections | No special-casing in schema or API; edit dialog works identically for seeded rows |
| METR-01 | User can add multiple meters to any section | "+" Add Meter row in expanded SectionCard → `createMeter()` |
| METR-02 | User can rename or delete a meter | MeterRow inline edit (Enter/blur → `updateMeter()`) + delete icon → confirmation dialog → `deleteMeter()` |
| I18N-01 | All new UI text displayed in the user's chosen language (EN or DE) | New `settings.sections.*` keys in `en/common.json` + `de/common.json`; all labels use `t()` |
| I18N-02 | Custom section/meter names display as-is (not translated) | Section/meter name values rendered directly from API data, never passed through `t()` |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | ^6.x (latest) | Drag sensors, DndContext, collision detection | Accessibility-first, works with React 19, no deprecated APIs |
| @dnd-kit/sortable | ^8.x (latest) | SortableContext + useSortable hook, auto drop indicators | Official companion to core for list reorder use-case |
| react-icons/hi2 | already installed (^5.5.0) | HiOutline icon set for icon picker | Already in project, consistent with Settings page |
| framer-motion | already installed (^11.18.2) | Expand/collapse animation, card lift on drag | Already in project, established pattern |
| react-i18next | already installed | t() for all UI labels | Already in project |
| @radix-ui/react-dialog | already installed (^1.1.4) | Section create/edit modal | Already wrapped in dialog.jsx shadcn component |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/utilities | bundled with core | CSS.Transform utility for drag transform style | Required to apply useSortable transform to DOM nodes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit/sortable | react-beautiful-dnd | rbd is unmaintained (last release 2022), does not support React 18+ StrictMode |
| @dnd-kit/sortable | HTML5 native drag | No accessible keyboard support, no mobile touch, no drop indicators |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Architecture Patterns

### Recommended Component Structure
```
frontend/src/
├── pages/
│   └── Settings.jsx               # Add <SectionsManagementCard /> between Account and Language
├── components/settings/
│   ├── SectionsManagementCard.jsx  # Outer card group, fetches archived, renders section list + archived area
│   ├── SectionCard.jsx             # Expandable card: collapsed header + expanded meter list; useSortable for drag
│   ├── SectionEditDialog.jsx       # Create/edit dialog: name, unit dropdown, icon picker; shared for both modes
│   ├── MeterRow.jsx                # Inline-editable meter row; useSortable for drag; delete confirmation
│   ├── IconPickerGrid.jsx          # Grid of ~30 HiOutline icons; highlights selected; used inside SectionEditDialog
│   └── ArchivedSectionsArea.jsx    # Collapsible list of archived sections; restore + permanent delete actions
└── i18n/locales/
    ├── en/common.json              # Add settings.sections.* keys
    └── de/common.json              # Add matching German translations
```

### Pattern 1: @dnd-kit/sortable List Reorder

**What:** Wrap a list in `SortableContext`, apply `useSortable` to each item, handle `onDragEnd` to compute new order and call context mutation.

**When to use:** Both the sections list and each section's meters list.

**Example:**
```jsx
// Source: https://docs.dndkit.com/presets/sortable
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableSectionList({ sections }) {
  const { reorderSections } = useSections();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      reorderSections(arrayMove(sections, oldIndex, newIndex));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        {sections.map((section) => (
          <SortableSectionCard key={section.id} section={section} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

// Inside SectionCard:
function SortableSectionCard({ section }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.15)' : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {/* drag handle: spread listeners only on the handle element, not the whole card */}
      <button {...attributes} {...listeners} aria-label="Drag to reorder">
        <HiOutlineBars3 />
      </button>
      {/* ...rest of card */}
    </div>
  );
}
```

### Pattern 2: Expandable Section Card (Accordion-style)

**What:** Local boolean state `isExpanded` controls visibility of meter list. Framer Motion `AnimatePresence` + `motion.div` for smooth height animation.

**When to use:** Each SectionCard; initial state is collapsed.

**Example:**
```jsx
import { AnimatePresence, motion } from 'framer-motion';
const [isExpanded, setIsExpanded] = useState(false);

<div onClick={() => setIsExpanded((v) => !v)}>
  {/* header row */}
</div>
<AnimatePresence initial={false}>
  {isExpanded && (
    <motion.div
      key="meters"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ overflow: 'hidden' }}
    >
      {/* meter list */}
    </motion.div>
  )}
</AnimatePresence>
```

### Pattern 3: Inline Meter Rename

**What:** Display meter name as text by default. On click, replace with a controlled `<input>` focused automatically. On Enter or blur, call `updateMeter()`, revert on error.

**When to use:** Every MeterRow.

**Example:**
```jsx
const [editing, setEditing] = useState(false);
const [value, setValue] = useState(meter.name);
const { updateMeter } = useSections();

const handleBlur = async () => {
  if (value.trim() && value !== meter.name) {
    try {
      await updateMeter(section.id, meter.id, { name: value.trim() });
    } catch {
      setValue(meter.name); // revert
    }
  } else {
    setValue(meter.name);
  }
  setEditing(false);
};

// Render: editing ? <input autoFocus .../> : <span onClick={() => setEditing(true)}>{meter.name}</span>
```

### Pattern 4: Unit Dropdown with Custom Option

**What:** A `<select>` with predefined units. Final option is "Custom..." — selecting it shows a text `<input>` below. The input value is what gets submitted.

**When to use:** Unit field inside SectionEditDialog.

**Predefined unit options:**
```
kWh, MWh, m³, L, gal, therms, kg, t, — Custom...
```

### Pattern 5: Icon Picker Grid

**What:** CSS grid of icon buttons. Clicking one sets selected icon state. Visual indicator (ring + bg) matches the language/currency selector pattern already in the app.

**When to use:** Icon field inside SectionEditDialog.

**30 predefined HiOutline icons (suggested selection):**
```
HiOutlineBolt, HiOutlineBeaker, HiOutlineFire, HiOutlineHomeModern,
HiOutlineWrenchScrewdriver, HiOutlineSun, HiOutlineMoon, HiOutlineCloud,
HiOutlineSnowflake, HiOutlineDroplet (water), HiOutlineTruck, HiOutlineGlobeAlt,
HiOutlineChartBar, HiOutlineCog6Tooth, HiOutlineCpuChip, HiOutlineBuildingOffice,
HiOutlineBuildingStorefront, HiOutlineShoppingCart, HiOutlineCurrencyEuro,
HiOutlineLeaf, HiOutlineArrowsRightLeft, HiOutlineSignal, HiOutlineWifi,
HiOutlineComputerDesktop, HiOutlineDevicePhoneMobile, HiOutlineCamera,
HiOutlineSpeakerWave, HiOutlinePaperAirplane, HiOutlineRocketLaunch,
HiOutlineSparkles
```
(Final selection is Claude's discretion per CONTEXT.md.)

### Pattern 6: Confirmation Dialog (Reusing shadcn Dialog)

**What:** Separate `<Dialog>` state for destructive actions (meter delete, section permanent delete). Single confirmation dialog component with configurable title + message + confirm button text.

**When to use:** Meter delete (one step), section permanent delete (from archived area).

### Anti-Patterns to Avoid

- **Nesting DndContext for meters inside a DndContext for sections:** Two separate `DndContext` instances on the same page interact poorly when a section card is expanded. Wrap the sections `DndContext` at the top level; use a separate `DndContext` inside each expanded section's meter list (isolated scope, no collision).
- **Spreading drag listeners on the whole card:** Click-to-expand and drag both trigger on the same element. Attach `listeners` only to the drag handle icon; attach `onClick` expand to the text/header area.
- **Passing section/meter names through `t()`:** User data must never go through the i18n translation function — render raw from API state (I18N-02).
- **Local state for sections list:** The source of truth is `useSections().sections`. Don't maintain a parallel local copy; use `arrayMove` only to compute the argument for `reorderSections()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop reorder | Custom mousedown/mousemove handlers | @dnd-kit/sortable | Touch, keyboard, scroll, collision, accessibility — all edge cases handled |
| Animated list height on expand | JS-measured pixel heights | Framer Motion `height: 'auto'` with `AnimatePresence` | Correct animation to/from dynamic content height without layout thrash |
| Dialog accessible modal | Raw `<div>` overlay with `z-index` | Radix Dialog (already wrapped in `dialog.jsx`) | Focus trap, scroll lock, `aria-modal`, Escape key — all handled |
| i18n key structure | Flat key names | Namespaced keys under `settings.sections.*` | Keeps translation files navigable; consistent with existing `settings.*` namespace |

---

## Common Pitfalls

### Pitfall 1: DndContext Nesting Conflict
**What goes wrong:** Dragging a meter row also triggers section drag logic.
**Why it happens:** A single `DndContext` cannot disambiguate which sortable list the drag belongs to.
**How to avoid:** Use separate, scoped `DndContext` + `SortableContext` for sections and for each section's meters list. They are independent instances.
**Warning signs:** `onDragEnd` receives an `active.id` that matches a meter ID when you expected a section ID.

### Pitfall 2: Drag Handle vs. Click-to-Expand Conflict
**What goes wrong:** Tapping a section card header triggers both expand toggle and drag start.
**Why it happens:** `listeners` spread on the entire card registers `pointerdown` globally.
**How to avoid:** Spread `{...listeners}` only on the drag handle icon button element. The card header text/area handles `onClick` for expand independently.

### Pitfall 3: Framer Motion + dnd-kit Transform Conflict
**What goes wrong:** Card animates its position via Framer Motion `layout` while dnd-kit also applies CSS transforms, causing jumpy visuals.
**Why it happens:** `layout` prop triggers Framer Motion to animate to the new DOM position after a reorder, double-animating.
**How to avoid:** Do NOT use `layout` prop on sortable items. Let dnd-kit own the drag transform; let the list re-render handle position after `reorderSections()` resolves.

### Pitfall 4: Archived Sections Missing from Context State
**What goes wrong:** Archived sections are not in `useSections().sections` (which only returns active sections).
**Why it happens:** The main context fetch calls `getSections()` which excludes archived rows.
**How to avoid:** Use `fetchWithArchived()` from context (returns a Promise, does not update state) to load archived sections into local component state inside `ArchivedSectionsArea`. Refresh after restore/delete actions.

### Pitfall 5: "Custom" Unit Input Not Submitted
**What goes wrong:** User types a custom unit but the form submits the "Custom..." placeholder value.
**Why it happens:** The form reads from the dropdown value instead of the free text input.
**How to avoid:** Track `unitMode: 'preset' | 'custom'` and `customUnitValue` as separate state. On submit, use `customUnitValue` when mode is `'custom'`.

### Pitfall 6: i18n Keys Missing in DE File
**What goes wrong:** EN labels work; DE shows raw key strings.
**Why it happens:** Key added to `en/common.json` but not `de/common.json`.
**How to avoid:** Always update both files in the same task. Use a structured key list to verify parity before marking complete.

---

## Code Examples

### useSections() Consumer Pattern (established in project)
```jsx
// Source: frontend/src/context/SectionsContext.jsx
import { useSections } from '../hooks/useSections';

function SectionsManagementCard() {
  const {
    sections,
    loading,
    createSection,
    updateSection,
    archiveSection,
    deleteSection,
    reorderSections,
    createMeter,
    updateMeter,
    deleteMeter,
    reorderMeters,
    fetchWithArchived,
  } = useSections();
  // ...
}
```

### Settings Page Card Pattern (established in project)
```jsx
// Source: frontend/src/pages/Settings.jsx
<motion.div variants={fadeUp}>
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <HiOutlineCog6Tooth className="h-[18px] w-[18px] text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-foreground">{t('settings.sections.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('settings.sections.description')}</p>
        </div>
      </div>
      {/* section list content */}
    </CardContent>
  </Card>
</motion.div>
```

### Translation Key Namespace (new keys to add)
```json
// en/common.json — settings.sections namespace
"sections": {
  "title": "Sections & Meters",
  "description": "Manage your utility sections and meters.",
  "addSection": "Add Section",
  "editSection": "Edit Section",
  "createSection": "Create Section",
  "saveChanges": "Save Changes",
  "cancel": "Cancel",
  "name": "Name",
  "namePlaceholder": "e.g. Solar",
  "unit": "Unit",
  "unitCustom": "Custom...",
  "unitCustomPlaceholder": "Enter unit",
  "icon": "Icon",
  "archiveSection": "Archive",
  "archivedSections": "Archived Sections",
  "restoreSection": "Restore",
  "deleteSection": "Delete",
  "deleteSectionTitle": "Delete Section",
  "deleteSectionMessage": "This will permanently delete the section and all its data. This cannot be undone.",
  "addMeter": "Add Meter",
  "deleteMeter": "Delete Meter",
  "deleteMeterTitle": "Delete Meter",
  "deleteMeterMessage": "Delete {{name}}? This will remove all entries for this meter.",
  "reorderHint": "Drag to reorder",
  "noSections": "No sections yet. Add your first section.",
  "saveError": "Failed to save. Please try again.",
  "reorderError": "Failed to save new order."
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | 2022 (rbd unmaintained) | Must use dnd-kit; rbd breaks in React 18+ StrictMode |
| `height: 0` toggle via className | Framer Motion `AnimatePresence` + `height: 'auto'` | Framer Motion v6+ | Smooth auto-height animation without JS measurement |
| Flat i18n keys | Namespaced keys (`settings.sections.*`) | Established in this project | Consistent with existing `settings.*` structure |

**Deprecated/outdated:**
- `react-beautiful-dnd`: unmaintained, StrictMode broken — do not use.
- HTML5 Drag API (`draggable` attribute): no touch support, no accessible keyboard — do not use.

---

## Open Questions

1. **Error toast implementation**
   - What we know: Framer Motion and Radix are available; no toast library is in package.json
   - What's unclear: Should a toast library (e.g. sonner) be added, or is a simple inline error message sufficient for phase 4?
   - Recommendation: Claude's discretion per CONTEXT.md — implement a simple inline error state (text below the card) for the MVP; a proper toast can be added in a later phase. Keep the error message in the same i18n namespace.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Not configured — no test files detected in frontend/ |
| Config file | None — Wave 0 task needed |
| Quick run command | `npm test --prefix frontend` (once configured) |
| Full suite command | `npm test --prefix frontend` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SECT-01 | Create section dialog submits name/unit/icon, calls createSection() | unit (component) | N/A — manual-only (no test framework) | No frontend test setup |
| SECT-02 | Edit dialog pre-fills section values, saves on submit | unit (component) | N/A — manual | No frontend test setup |
| SECT-03 | Drag reorder triggers reorderSections() with correct array | unit (component) | N/A — manual | No frontend test setup |
| SECT-04 | Seeded Water/Power/Fuel sections appear in list, edit dialog works | integration/manual | N/A — manual | No frontend test setup |
| METR-01 | Add meter row appears, autofocused, calls createMeter() on Enter | unit (component) | N/A — manual | No frontend test setup |
| METR-02 | Inline rename saves on blur; delete confirmation triggers deleteMeter() | unit (component) | N/A — manual | No frontend test setup |
| I18N-01 | All UI labels render from t() keys, language switch changes them | manual | N/A — manual | No frontend test setup |
| I18N-02 | Section/meter names render as raw string, not through t() | code review | N/A — manual | No frontend test setup |

### Sampling Rate
- **Per task commit:** Manual smoke test in browser (no automated runner)
- **Per wave merge:** Manual smoke test covering each requirement above
- **Phase gate:** All 5 success criteria manually verified before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No frontend test framework configured — this is a known project state; manual verification is the gate for phase 4.
- [ ] No vitest/jest config — installing would be out of scope for this phase.

*(Accepted: no automated test infrastructure for frontend; manual browser verification is the validation strategy for this phase.)*

---

## Sources

### Primary (HIGH confidence)
- `frontend/src/context/SectionsContext.jsx` — All available mutations verified by reading source
- `frontend/src/pages/Settings.jsx` — Card/motion patterns verified by reading source
- `frontend/src/components/ui/dialog.jsx` — Dialog component API verified by reading source
- `frontend/package.json` — Dependency versions verified; @dnd-kit not yet installed confirmed
- `frontend/src/i18n/locales/en/common.json` — Existing key namespace structure verified
- `https://docs.dndkit.com/presets/sortable` — @dnd-kit/sortable SortableContext + useSortable API (training knowledge, HIGH confidence for stable API)

### Secondary (MEDIUM confidence)
- @dnd-kit GitHub README — arrayMove, sensors, collision detection patterns; verified stable across versions 6.x
- Framer Motion docs — AnimatePresence + height: 'auto' pattern; verified present in v11 (installed version)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all deps verified in package.json; @dnd-kit is well-established
- Architecture: HIGH — follows exact patterns found in existing Settings.jsx and SectionsContext.jsx
- Pitfalls: HIGH — dnd-kit nesting and handle conflicts are well-documented and empirically common
- i18n patterns: HIGH — verified against existing en/de common.json structure

**Research date:** 2026-03-19
**Valid until:** 2026-09-19 (stable libraries, 180 days)
