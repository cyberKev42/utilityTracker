---
phase: 1
slug: schema-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `backend/vitest.config.js` — Wave 0 creates this |
| **Quick run command** | `cd backend && npx vitest run tests/migration.test.js` |
| **Full suite command** | `cd backend && npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx vitest run tests/migration.test.js`
- **After every plan wave:** Run `cd backend && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | — | setup | `cd backend && npx vitest --version` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 0 | — | setup | `test -f backend/tests/helpers/db.js` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | UNIT-01 | integration | `npx vitest run tests/migration.test.js -t "UNIT-01"` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | UNIT-02 | integration | `npx vitest run tests/migration.test.js -t "UNIT-02"` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | — | integration | `npx vitest run tests/migration.test.js -t "backfill complete"` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | — | integration | `npx vitest run tests/migration.test.js -t "settings backfill"` | ❌ W0 | ⬜ pending |
| 01-02-05 | 02 | 1 | — | integration | `npx vitest run tests/migration.test.js -t "type column dropped"` | ❌ W0 | ⬜ pending |
| 01-02-06 | 02 | 1 | — | smoke | `npx vitest run tests/migration.test.js -t "tables exist"` | ❌ W0 | ⬜ pending |
| 01-02-07 | 02 | 1 | — | integration | `npx vitest run tests/migration.test.js -t "rollback"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `cd backend && npm install --save-dev vitest` — Install test framework
- [ ] `backend/vitest.config.js` — Vitest configuration
- [ ] `backend/tests/helpers/db.js` — Test DB connection helper using `TEST_DATABASE_URL`
- [ ] `backend/tests/migration.test.js` — Migration verification test stubs for UNIT-01, UNIT-02, backfill, rollback

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `SELECT DISTINCT type FROM utility_entries` returns only `water`, `power`, `fuel` | — | Requires production DB access | Run query against production before migration |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
