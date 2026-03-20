---
phase: 4
slug: section-meter-management-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no frontend test framework configured |
| **Config file** | None — out of scope for this phase |
| **Quick run command** | Manual browser smoke test |
| **Full suite command** | Manual browser verification of all 5 success criteria |
| **Estimated runtime** | ~60 seconds (manual) |

---

## Sampling Rate

- **After every task commit:** Manual browser smoke test of affected feature
- **After every plan wave:** Manual walkthrough of all success criteria touched by wave
- **Before `/gsd:verify-work`:** All 5 success criteria manually verified
- **Max feedback latency:** N/A (manual verification)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-XX-01 | TBD | 1 | SECT-01 | manual | N/A | N/A | ⬜ pending |
| 04-XX-02 | TBD | 1 | SECT-02 | manual | N/A | N/A | ⬜ pending |
| 04-XX-03 | TBD | 1 | SECT-03 | manual | N/A | N/A | ⬜ pending |
| 04-XX-04 | TBD | 1 | SECT-04 | manual | N/A | N/A | ⬜ pending |
| 04-XX-05 | TBD | 1 | METR-01 | manual | N/A | N/A | ⬜ pending |
| 04-XX-06 | TBD | 1 | METR-02 | manual | N/A | N/A | ⬜ pending |
| 04-XX-07 | TBD | 1 | I18N-01 | manual | N/A | N/A | ⬜ pending |
| 04-XX-08 | TBD | 1 | I18N-02 | code review | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure state: No frontend test framework. Manual browser verification is the accepted gate for phase 4. Installing vitest/jest is out of scope.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Create section with name/unit/icon | SECT-01 | No test framework | Open Settings → Add Section → Fill form → Verify appears in list |
| Edit section name/unit/icon | SECT-02 | No test framework | Click edit on section → Change values → Save → Verify updated |
| Drag reorder sections | SECT-03 | No test framework | Drag section to new position → Reload page → Verify order persists |
| Seeded sections editable | SECT-04 | No test framework | Verify Water/Power/Fuel appear → Edit each → Verify saves |
| Add meter to section | METR-01 | No test framework | Expand section → Add meter → Verify appears in meter list |
| Rename/delete meter | METR-02 | No test framework | Click meter name → Rename → Blur → Verify. Click delete → Confirm → Verify removed |
| UI labels in EN/DE | I18N-01 | No test framework | Switch language → Verify all UI labels change |
| User names not translated | I18N-02 | No test framework | Create section "Heizung" → Switch to EN → Verify name stays "Heizung" |

---

## Validation Sign-Off

- [ ] All tasks have manual verification instructions
- [ ] Sampling continuity: manual smoke test after every task commit
- [ ] Wave 0: N/A — no automated infrastructure needed
- [ ] No watch-mode flags
- [ ] Feedback latency: manual (accepted)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
