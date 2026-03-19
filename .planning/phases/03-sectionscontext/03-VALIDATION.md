---
phase: 3
slug: sectionscontext
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (backend only — no frontend test setup) |
| **Config file** | `backend/vitest.config.js` |
| **Quick run command** | `cd backend && npx vitest run` |
| **Full suite command** | `cd backend && npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx vitest run`
- **After every plan wave:** Run `cd backend && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SC-1 (context exposes tree) | manual | Grep: no standalone fetch | N/A | ⬜ pending |
| 03-01-02 | 01 | 1 | SC-2 (mutations invalidate) | manual | Browser smoke test | N/A | ⬜ pending |
| 03-01-03 | 01 | 1 | SC-3 (no page-level fetch) | code review | `grep -r "api.get.*sections" frontend/src --include="*.jsx" --include="*.js"` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No frontend test framework is in scope for Phase 3 (infrastructure phase — validation is manual smoke testing + code review grep).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SectionsContext exposes sections+meters tree | SC-1 | No frontend test framework | Load app, verify sections render from context |
| Mutation functions invalidate and refresh state | SC-2 | No frontend test framework | Create/delete section, verify UI updates |
| No standalone /api/sections fetch outside context | SC-3 | Code review sufficient | `grep -r "api.get.*sections" frontend/src` — only SectionsContext.jsx should match |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
