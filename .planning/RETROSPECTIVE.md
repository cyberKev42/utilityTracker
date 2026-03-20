# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-20
**Phases:** 6 | **Plans:** 14 | **Sessions:** ~12

### What Was Built
- Dynamic sections/meters system replacing hardcoded Water/Power/Fuel categories
- Dual entry modes: usage amount (single date + date range split) and meter reading (delta calculation)
- Full statistics rework: per-meter breakdowns, section aggregation, granularity toggles, dynamic charts
- Settings page with drag-and-drop section/meter management, icon picker, inline editing
- Schema migration with rollback support and zero data loss

### What Worked
- Strict dependency ordering (schema → API → context → UI) prevented integration surprises
- Write-before-read UI ordering (Settings → AddEntry → Statistics) ensured data existed before display
- SectionsContext as single shared state eliminated redundant API calls across pages
- Plan-per-task granularity kept each session focused and completable

### What Was Inefficient
- Phase 2 backend had 4 plans where 3 would have sufficed (test plan could have been folded in)
- ROADMAP progress table drifted from actual state — some phases showed "In Progress" after completion
- Some decisions (e.g., date range splitting strategy) could have been resolved in Phase 1 instead of deferred to Phase 5

### Patterns Established
- Phase plan naming: `XX-YY-PLAN.md` with phase number and sequence
- Success criteria as boolean assertions (what must be TRUE)
- Human verification plans as explicit final steps in UI phases
- Optimistic reorder mutations, server-wait for all other mutations

### Key Lessons
1. Seed data with separate INSERTs — UNION with gen_random_uuid() can produce deterministic duplicate UUIDs
2. Place static Express routes before parameterized routes (e.g., `/reorder` before `/:id`) to avoid param capture
3. SectionsProvider must be inside auth boundary — fetching sections for unauthenticated users wastes requests and causes errors
4. First meter reading = usage 0 is the cleanest baseline strategy; avoids negative delta edge cases
5. Cost stored per row at write time (not computed at read) simplifies stats queries significantly

### Cost Observations
- Model mix: primarily Opus for planning and implementation
- Sessions: ~12 across 3 days
- Notable: Subagent usage kept main context clean for multi-file changes

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~12 | 6 | Established dependency-driven phase ordering |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | Integration tests for schema + API | — | dnd-kit (drag-and-drop) |

### Top Lessons (Verified Across Milestones)

1. Dependency-driven phase ordering prevents integration rework
2. Write-before-read UI ordering ensures data availability
