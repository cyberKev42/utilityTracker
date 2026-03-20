---
phase: 7
slug: performance-navigation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.js (vitest inline config) or vitest.config.js |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | PERF-01 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | PERF-02 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 2 | NAVI-01 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install vitest + @testing-library/react if not present
- [ ] Create test setup file with React Router + context providers
- [ ] Stub test files for navigation, optimistic mutations, and dashboard linking

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No full-page reload between routes | PERF-01 | Requires browser observation | Navigate between all 4 routes, verify no white flash or full reload |
| Instant UI update after settings change | PERF-02 | Requires visual confirmation | Create/edit section in Settings, verify immediate UI reflection |
| Dashboard card → Statistics with section selected | NAVI-01 | Requires end-to-end browser flow | Click section card on Dashboard, verify Statistics page opens with correct section |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
