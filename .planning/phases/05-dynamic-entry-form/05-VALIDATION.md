---
phase: 5
slug: dynamic-entry-form
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (backend), manual browser (frontend) |
| **Config file** | backend/jest.config.js |
| **Quick run command** | `cd backend && npx jest --testPathPattern=entries` |
| **Full suite command** | `cd backend && npx jest` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx jest --testPathPattern=entries`
- **After every plan wave:** Run `cd backend && npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | ENTR-01 | integration | `cd backend && npx jest --testPathPattern=entries` | ✅ | ⬜ pending |
| 05-01-02 | 01 | 1 | ENTR-02 | integration | `cd backend && npx jest --testPathPattern=entries` | ✅ | ⬜ pending |
| 05-01-03 | 01 | 1 | ENTR-03 | integration | `cd backend && npx jest --testPathPattern=entries` | ✅ | ⬜ pending |
| 05-01-04 | 01 | 1 | ENTR-04 | integration | `cd backend && npx jest --testPathPattern=entries` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cascading section→meter dropdowns render correctly | ENTR-01 | Visual UI interaction | Select section, verify meter list updates |
| Date range split preview displays correct values | ENTR-02 | Visual rendering | Enter date range with amount, verify split preview |
| First-reading banner appears for new meters | ENTR-04 | Visual rendering | Select meter with no entries in reading mode, verify banner |
| localStorage remembers last-used section/meter | ENTR-01 | Browser state | Log entry, reload page, verify pre-selected values |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
