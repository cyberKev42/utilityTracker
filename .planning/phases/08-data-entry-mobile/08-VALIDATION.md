---
phase: 8
slug: data-entry-mobile
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-21
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `frontend/vitest.config.js` (created in Wave 0, Plan 08-01 Task 0) |
| **Quick run command** | `cd frontend && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd frontend && npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd frontend && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 8-01-00 | 01 | 1 | ENTR-01/02 | scaffold | `cd frontend && npx vitest run` | Created in Wave 0 | ⬜ pending |
| 8-01-01 | 01 | 1 | ENTR-01 | unit | `cd frontend && npx vitest run` | normalizeDecimal.test.js | ⬜ pending |
| 8-01-02 | 01 | 1 | ENTR-02 | unit | `cd frontend && npx vitest run` | sectionName.test.js | ⬜ pending |
| 8-02-01 | 02 | 2 | ENTR-01 | grep | grep for normalizeDecimal usage | N/A | ⬜ pending |
| 8-02-02 | 02 | 2 | ENTR-02 | grep | grep for getSectionDisplayName usage | N/A | ⬜ pending |
| 8-03-01 | 03 | 3 | MOBI-01 | grep | grep for responsive classes | N/A | ⬜ pending |
| 8-03-02 | 03 | 3 | MOBI-01 | grep | grep for TouchSensor | N/A | ⬜ pending |
| 8-03-03 | 03 | 3 | MOBI-01 | manual | browser resize test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Test framework setup (vitest installed in frontend — Plan 08-01 Task 0)
- [x] Test stubs for ENTR-01 decimal parsing (normalizeDecimal.test.js — Plan 08-01 Task 0)
- [x] Test stubs for ENTR-02 section translation (sectionName.test.js — Plan 08-01 Task 0)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile layout no horizontal scroll | MOBI-01 | Visual/viewport behavior | Open each page at 390px width, verify no horizontal scrollbar |
| Touch drag reorder | MOBI-01 | Touch interaction | Test drag-and-drop on mobile device or emulator |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
