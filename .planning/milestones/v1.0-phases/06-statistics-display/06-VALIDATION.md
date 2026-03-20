---
phase: 6
slug: statistics-display
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (if exists) or vite.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | METR-03 | manual | Browser: verify charts render per section | N/A | ⬜ pending |
| TBD | 01 | 1 | METR-04 | manual | Browser: verify meter breakdown within section | N/A | ⬜ pending |
| TBD | 01 | 1 | UNIT-03 | manual | Browser: verify units display correctly | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. Phase 6 is primarily UI rendering — validation is visual/manual.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Charts render for every user-created section | METR-03 | Visual rendering + dynamic data | Navigate to Statistics, verify each section has a chart |
| Per-meter usage breakdown visible | METR-04 | UI interaction (tab switching) | Click into a section, verify meter tabs show individual data |
| Section-level aggregated totals shown | METR-03 | Visual aggregation check | Verify section summary shows rolled-up totals |
| Units match section config throughout | UNIT-03 | Cross-page visual consistency | Check units on charts, entry lists, and summaries match section's configured unit |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
