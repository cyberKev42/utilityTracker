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

## Milestone: v1.1 — Polish & UX

**Shipped:** 2026-03-21
**Phases:** 3 | **Plans:** 8 | **Sessions:** ~4

### What Was Built
- SPA-like navigation via centralized EntriesDataContext — eliminates per-page loading spinners
- Optimistic mutations in SectionsContext for instant settings UI feedback
- Dashboard sparklines (48x24px Recharts) with section-to-statistics click-through
- Comma decimal input across all numeric fields (type=text + inputMode=decimal)
- Translated section names via translation_key + getSectionDisplayName
- Mobile-responsive grids (1→2→3 cols) and TouchSensor long-press drag
- Dashboard cost/usage segmented toggle with localStorage persistence
- Pencil edit affordance on meter rows + 8 water-themed icons

### What Worked
- 3-phase structure (perf → data → polish) kept each phase tightly scoped
- Parallel plan execution in Wave 1 — both Phase 9 plans ran simultaneously with no conflicts
- UI-SPEC contracts prevented ambiguity on toggle styling and icon placement
- Research phases identified key pitfalls early (comma input requires type=text, not type=number)

### What Was Inefficient
- Both Phase 9 plans touched the same i18n files — could have caused merge conflicts in parallel (didn't, but risky)
- Some SUMMARY.md one-liner fields were empty — template compliance could be tighter

### Patterns Established
- normalizeDecimal applied at parse time only, not onChange — preserves comma visibility
- TouchSensor delay=250ms / tolerance=5px as mobile drag standard
- Segmented pill toggle pattern (bg-muted container, bg-background active) reusable from LanguageSwitcher
- e.stopPropagation() on action buttons inside draggable rows

### Key Lessons
1. type=number blocks comma entry in all browsers — must use type=text + inputMode=decimal
2. Translation keys in DB (translation_key column) enable runtime i18n without hardcoded mappings
3. Sparkline sizing must be fixed (not responsive) inside card layouts to prevent layout thrash
4. localStorage for UI preferences (display mode) is simpler and more appropriate than server state

### Cost Observations
- Model mix: Opus orchestrator + Sonnet executors (balanced profile)
- Sessions: ~4 across 2 days
- Notable: Parallel executor agents completed Phase 9 in ~2 minutes total

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~12 | 6 | Established dependency-driven phase ordering |
| v1.1 | ~4 | 3 | Parallel executor agents, UI-SPEC contracts |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | Integration tests for schema + API | — | dnd-kit (drag-and-drop) |
| v1.1 | vitest scaffold + 10 unit tests | — | react-icons/fa6, react-icons/lu (already installed) |

### Top Lessons (Verified Across Milestones)

1. Dependency-driven phase ordering prevents integration rework
2. Write-before-read UI ordering ensures data availability
3. type=text + inputMode=decimal is the only reliable cross-browser pattern for comma decimal entry
4. Parallel executor agents work well when plans touch different files; shared files (i18n) need ordering or conflict awareness
