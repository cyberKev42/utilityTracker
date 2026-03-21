---
phase: 07-performance-navigation
plan: 02
subsystem: frontend/context
tags: [optimistic-ui, performance, mutations, animations]
dependency_graph:
  requires: []
  provides: [optimistic-mutations, withRetry, delete-animation]
  affects: [frontend/src/context/SectionsContext.jsx, frontend/src/utils/withRetry.js, frontend/src/components/settings/MeterRow.jsx, frontend/src/components/settings/ArchivedSectionsArea.jsx]
tech_stack:
  added: [withRetry utility]
  patterns: [optimistic UI with rollback, exponential backoff retry, framer-motion opacity pulse]
key_files:
  created:
    - frontend/src/utils/withRetry.js
  modified:
    - frontend/src/context/SectionsContext.jsx
    - frontend/src/components/settings/MeterRow.jsx
    - frontend/src/components/settings/ArchivedSectionsArea.jsx
decisions:
  - "Keep error fallback gated on initialLoading so mutation errors don't show full-screen error"
  - "deletingId pattern in ArchivedSectionsArea since multiple archived sections may be visible"
metrics:
  duration: ~15min
  completed: 2026-03-20
  tasks_completed: 2
  files_changed: 4
---

# Phase 07 Plan 02: Optimistic Mutations + Delete Animation Summary

**One-liner:** SectionsContext create/update mutations now update UI instantly with rollback on failure, deletes stay server-confirmed with framer-motion opacity-pulse animation.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create withRetry utility + convert SectionsContext to optimistic mutations | f772b67 | frontend/src/utils/withRetry.js, frontend/src/context/SectionsContext.jsx |
| 2 | Pulsing delete animation in MeterRow and ArchivedSectionsArea | 20a5413 | frontend/src/components/settings/MeterRow.jsx, frontend/src/components/settings/ArchivedSectionsArea.jsx |

## What Was Built

### withRetry utility (`frontend/src/utils/withRetry.js`)
Exponential backoff retry: 3 attempts, 400ms base delay doubling per attempt. Used for all mutations.

### SectionsContext optimistic mutations
- `createSection` / `createMeter`: adds optimistic item with `temp-{timestamp}` id immediately; replaces with real server result on success, or removes on failure
- `updateSection` / `updateMeter`: saves previous state, applies update immediately; reverts on failure
- `deleteSection` / `deleteMeter`: server-confirmed (waits for response), then removes from local state — no `fetchSections()` round-trip
- `archiveSection`: server-confirmed, removes from local state
- `unarchiveSection`: server-confirmed, re-fetches to get correct sort position
- Full-screen loading spinner removed; `initialLoading` added so error fallback only shows on first-load failure
- `initialLoading` exported in context value for consumers to differentiate initial load vs mutation state

### Delete animations
- Both `MeterRow` and `ArchivedSectionsArea` delete confirm buttons show `<motion.span>` with `opacity: [1, 0.4, 1]` infinite loop at 1s duration while awaiting server
- Button disabled during deletion to prevent double-submit

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- frontend/src/utils/withRetry.js: FOUND
- frontend/src/context/SectionsContext.jsx: FOUND (withRetry imported, tempId present, spinner removed)
- frontend/src/components/settings/MeterRow.jsx: FOUND (motion.span, deleting state)
- frontend/src/components/settings/ArchivedSectionsArea.jsx: FOUND (motion.span, deletingId state)
- Commits f772b67 and 20a5413: verified in git log
- Build: passes (vite build ✓)
