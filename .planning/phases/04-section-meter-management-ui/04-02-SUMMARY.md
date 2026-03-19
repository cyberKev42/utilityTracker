---
phase: 04-section-meter-management-ui
plan: 02
subsystem: ui
tags: [react, dnd-kit, framer-motion, settings, sections, meters]

requires:
  - phase: 04-section-meter-management-ui
    plan: 01
    provides: IconPickerGrid/ICON_MAP, SectionEditDialog, MeterRow, 32 i18n keys

provides:
  - SectionCard: expandable sortable section card with meter DndContext
  - ArchivedSectionsArea: collapsible archived sections with restore/delete
  - SectionsManagementCard: top-level orchestrator with DndContext, add button, archived area
  - Settings.jsx: SectionsManagementCard integrated between Account and Language cards

affects: [Settings page]

tech-stack:
  added: []
  patterns:
    - "Nested DndContext: SectionsManagementCard owns section-level DndContext; SectionCard owns meter-level DndContext (independent scopes)"
    - "SectionCard spreads dnd-kit listeners only on drag handle button, not on card"
    - "No Framer Motion layout prop on sortable items"
    - "AnimatePresence + motion.div height:0→auto for expand/collapse"

key-files:
  created:
    - frontend/src/components/settings/SectionCard.jsx
    - frontend/src/components/settings/ArchivedSectionsArea.jsx
    - frontend/src/components/settings/SectionsManagementCard.jsx
  modified:
    - frontend/src/pages/Settings.jsx
    - frontend/src/components/settings/IconPickerGrid.jsx

key-decisions:
  - "Nested DndContext per RESEARCH.md anti-pattern warning: meter DndContext scoped inside SectionCard, section DndContext in SectionsManagementCard"
  - "HiOutlineSnowflake/HiOutlineDroplets/HiOutlineLeaf unavailable in installed react-icons version — replaced with HiOutlineAdjustmentsHorizontal/HiOutlineEyeDropper/HiOutlineSwatch"

metrics:
  duration: 3min
  completed: 2026-03-19
  tasks: 2
  files: 5
---

# Phase 4 Plan 02: Section Management UI Assembly Summary

**SectionCard (expandable, sortable, meter DndContext), ArchivedSectionsArea (restore/delete), SectionsManagementCard (DndContext orchestrator) assembled and integrated into Settings.jsx between Account and Language cards**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-19T11:08:59Z
- **Completed:** 2026-03-19T11:11:45Z
- **Tasks:** 2 of 3 (Task 3 is human verification checkpoint)
- **Files modified:** 5

## Accomplishments
- SectionCard: expandable/collapsible with AnimatePresence, sortable via useSortable, drag handle with listeners only on handle, separate inner DndContext for meter reorder, archive/edit actions, ICON_MAP icon lookup
- ArchivedSectionsArea: loads archived sections on mount and on expand, restore/delete with delete confirmation dialog
- SectionsManagementCard: DndContext + SortableContext for section reorder, Add Section button with create dialog, empty state, ArchivedSectionsArea below
- Settings.jsx: SectionsManagementCard inserted between Account and Language cards
- Fixed pre-existing build-breaking import errors in IconPickerGrid.jsx (3 missing icons replaced with available equivalents)

## Task Commits

1. **Task 1: Create SectionCard, ArchivedSectionsArea, SectionsManagementCard** - `fa1f76c` (feat)
2. **Task 2: Integrate SectionsManagementCard into Settings.jsx and verify build** - `38163a1` (feat)

## Files Created/Modified
- `frontend/src/components/settings/SectionCard.jsx` — expandable sortable card with meter management
- `frontend/src/components/settings/ArchivedSectionsArea.jsx` — collapsible archived section list
- `frontend/src/components/settings/SectionsManagementCard.jsx` — top-level orchestrator
- `frontend/src/pages/Settings.jsx` — SectionsManagementCard inserted between Account and Language cards
- `frontend/src/components/settings/IconPickerGrid.jsx` — fixed 3 unavailable icon imports

## Decisions Made
- Nested DndContext: meter reorder scoped to SectionCard (independent from section reorder in SectionsManagementCard), per RESEARCH.md anti-pattern warning
- Listeners spread only on drag handle button (HiOutlineBars3), not on the card element — prevents accidental drag when clicking to expand
- HiOutlineSnowflake, HiOutlineDroplets, HiOutlineLeaf not exported by installed react-icons/hi2 version — replaced with HiOutlineAdjustmentsHorizontal, HiOutlineEyeDropper, HiOutlineSwatch

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unavailable react-icons imports in IconPickerGrid.jsx**
- **Found during:** Task 2 (vite build)
- **Issue:** `HiOutlineSnowflake`, `HiOutlineDroplets`, `HiOutlineLeaf` not exported by `react-icons/hi2` installed version — build failed
- **Fix:** Replaced with `HiOutlineAdjustmentsHorizontal`, `HiOutlineEyeDropper`, `HiOutlineSwatch`
- **Files modified:** `frontend/src/components/settings/IconPickerGrid.jsx`
- **Commit:** `38163a1`

## Issues Encountered
- None beyond the icon import fix above

## User Setup Required
None — `npm run dev` then visit /settings.

## Next Phase Readiness
- Task 3 is human verification — user must review /settings page
- After approval, plan is complete

## Self-Check: PASSED
- `frontend/src/components/settings/SectionCard.jsx` — FOUND
- `frontend/src/components/settings/ArchivedSectionsArea.jsx` — FOUND
- `frontend/src/components/settings/SectionsManagementCard.jsx` — FOUND
- Commit `fa1f76c` — FOUND
- Commit `38163a1` — FOUND
