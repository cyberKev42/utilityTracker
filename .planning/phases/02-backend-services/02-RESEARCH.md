# Phase 2: Backend Services - Research

**Researched:** 2026-03-18
**Domain:** Express.js REST API, PostgreSQL raw SQL, Node.js ESM
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **GET /api/sections** returns nested tree: each section contains a `meters` array inline, sorted by `sort_order`
- Archived sections/meters excluded by default; `?include_archived=true` query param to include them
- **GET /api/entries/stats** returns section-level totals with per-meter breakdown nested inside (one request for Statistics page)
- Stats support optional `?year=YYYY&month=MM` query params for time filtering; no params = all time
- **POST /api/entries** accepts date range (`start_date`, `end_date`, `usage_amount`) and splits server-side into daily rows with shared `group_id`
- For meter-reading mode, backend auto-detects first reading (no prior entry for meter) and stores `usage_amount=0`; returns `is_initial: true` in response
- Full ownership chain validation: meter_id -> section_id -> user_id must match authenticated user
- No entry editing (PUT/PATCH) in this phase — create and delete only
- Single-entry deletion within a reading-mode meter recalculates the next entry's usage delta (per Phase 1 decision)
- Batch position update: PUT /api/sections/reorder accepts `{ order: [id1, id2, id3] }`, sets `sort_order` = array index
- Same pattern for meters: PUT /api/sections/:id/meters/reorder
- Archiving a section cascade-archives all its meters; entries stay intact but excluded from default views and stats
- Unarchiving restores section + all meters; entries become visible again
- DELETE /api/sections/:id cascades immediately (meters + entries removed); frontend handles confirmation dialog
- DELETE /api/meters/:id cascades all entries for that meter — no delta recalculation since entire meter is removed
- Deleting a single entry within a reading-mode meter recalculates the next entry's delta

### Claude's Discretion

- Exact endpoint naming conventions (beyond what's specified above)
- Request validation details (field length limits, regex patterns)
- Error message wording
- Test structure and organization
- Whether to use transactions for multi-row operations

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 2 delivers the complete REST API contract on top of the Phase 1 schema. The existing codebase already follows a strict Route → Controller → Service layered pattern with raw SQL (`pg` pool) and no ORM. All new code must follow this pattern exactly.

The most complex logic in this phase is: (1) date-range splitting into daily rows at insert time with a shared `group_id`, (2) meter-reading delta calculation and first-reading detection, and (3) entry deletion that recalculates the next reading's delta. Everything else is standard CRUD with ownership checks.

The test infrastructure is Vitest with an integration-style approach against `TEST_DATABASE_URL`. Phase 2 must add a new integration test file (`backend/tests/api.test.js`) covering the five success criteria. The existing `helpers/db.js` and the migration test pattern are directly reusable.

**Primary recommendation:** Follow the existing controller/service split precisely. Use PostgreSQL transactions for multi-row operations (date-range splitting, archive cascade, reorder batch). Do NOT add supertest or any new test dependencies — integration tests query the database directly, same as migration tests.

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| express | ^5.1.0 | HTTP routing | Existing server framework |
| pg | ^8.13.1 | PostgreSQL client | Existing DB client via `getDb()` |
| @supabase/supabase-js | ^2.49.1 | JWT auth verification | Existing auth middleware |
| vitest | ^4.1.0 | Test runner | Existing test framework |

### No New Dependencies Required

All required functionality is already available. The phase is purely code, not infrastructure changes.

**Installation:**
```bash
# No new packages needed
```

---

## Architecture Patterns

### Existing Project Structure (must follow exactly)
```
backend/
├── routes/         # Router files — import controller, apply authenticate middleware
├── controllers/    # Validate input, call service, return JSON + status
├── services/       # All SQL queries via getDb()
├── middleware/     # auth.js — authenticate function
├── tests/
│   ├── helpers/db.js  # getTestDb() / closeTestDb() for integration tests
│   └── migration.test.js  # Pattern to follow for new tests
└── server.js       # Mounts all route files
```

### New files for Phase 2
```
backend/
├── routes/sections.js                  # new
├── controllers/sectionsController.js   # new
├── services/sectionsService.js         # new
├── tests/api.test.js                   # new (integration tests)
```

### Modified files
```
backend/
├── routes/entries.js                   # add /api/entries/stats route update + meter-aware POST
├── controllers/entriesController.js    # replace VALID_TYPES with meter_id ownership check
├── services/entriesService.js          # full rewrite of createEntry, deleteEntry, getStats
└── server.js                           # mount /api/sections
```

---

### Pattern 1: Route File
**What:** Minimal — just imports controller, applies `authenticate`, defines HTTP verbs.
**When to use:** All new routes.
```javascript
// Source: backend/routes/entries.js (existing pattern)
import { Router } from 'express';
import * as sectionsController from '../controllers/sectionsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', sectionsController.getAll);
router.post('/', sectionsController.create);
// ...

export default router;
```

### Pattern 2: Controller Function
**What:** Validate all inputs, call service, return JSON. Never put SQL here.
**When to use:** Every endpoint handler.
```javascript
// Source: backend/controllers/entriesController.js (existing pattern)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function create(req, res) {
  try {
    const { name, unit, icon } = req.body;
    if (!name || !unit) {
      return res.status(400).json({ error: 'Required fields: name, unit' });
    }
    const section = await sectionsService.createSection(req.user.id, { name, unit, icon });
    res.status(201).json(section);
  } catch (error) {
    if (isDbUnavailable(error)) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    res.status(500).json({ error: 'Failed to create section' });
  }
}
```

### Pattern 3: Service Query
**What:** Raw SQL with `$1/$2` parameterized values. Returns `result.rows` or `result.rows[0]`.
**When to use:** All DB access.
```javascript
// Source: backend/services/entriesService.js (existing pattern)
export async function createSection(userId, data) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const result = await pool.query(
    `INSERT INTO utility_sections (user_id, name, unit, icon, sort_order)
     VALUES ($1, $2, $3, $4,
       COALESCE((SELECT MAX(sort_order) + 1 FROM utility_sections WHERE user_id = $1), 0))
     RETURNING *`,
    [userId, data.name, data.unit, data.icon ?? null]
  );
  return result.rows[0];
}
```

### Pattern 4: Ownership Chain Validation
**What:** Verify meter belongs to a section owned by the authenticated user before any write. Must be a single JOIN query, not multiple round-trips.
**When to use:** Any entry create/delete that takes `meter_id` from the client.
```javascript
// Ownership check — single query
const ownerCheck = await pool.query(
  `SELECT m.id, m.entry_mode
   FROM utility_meters m
   JOIN utility_sections s ON s.id = m.section_id
   WHERE m.id = $1 AND s.user_id = $2`,
  [meterId, userId]
);
if (ownerCheck.rows.length === 0) {
  // Return 404 (don't reveal existence to wrong user)
  throw Object.assign(new Error('Meter not found'), { status: 404 });
}
const { entry_mode } = ownerCheck.rows[0];
```

### Pattern 5: Date-Range Splitting
**What:** Split a usage amount over a date range into individual daily rows with a shared `group_id`. Last row absorbs rounding remainder.
**When to use:** POST /api/entries when `start_date !== end_date`.
```javascript
// Source: Phase 1 context decision
// Example: 50 kWh over 10 days = 10 rows of 5 kWh each
// Fractional amounts rounded to 2 decimal places; last row absorbs remainder
function splitIntoDailyRows(startDate, endDate, usageAmount) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.round((end - start) / 86400000) + 1;  // inclusive
  const perDay = Math.round((usageAmount / days) * 100) / 100;
  const rows = [];
  let accumulated = 0;
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const isLast = i === days - 1;
    const amount = isLast
      ? Math.round((usageAmount - accumulated) * 100) / 100
      : perDay;
    accumulated += amount;
    rows.push({ date: date.toISOString().slice(0, 10), usage_amount: amount });
  }
  return rows;
}
```

### Pattern 6: Meter-Reading Delta + First-Reading Detection
**What:** For meter-reading mode entries, compute delta from previous reading. If no prior entry exists, this is the first reading (baseline): store `usage_amount = 0`, return `is_initial: true`.
**When to use:** POST /api/entries when meter's `entry_mode = 'meter_reading'`.
```javascript
// Look up prior reading
const prior = await pool.query(
  `SELECT meter_reading, date FROM utility_entries
   WHERE meter_id = $1
   ORDER BY date DESC, created_at DESC
   LIMIT 1`,
  [meterId]
);

const isInitial = prior.rows.length === 0;
const usageAmount = isInitial
  ? 0
  : Math.round((meterReading - prior.rows[0].meter_reading) * 100) / 100;
```

### Pattern 7: Delete-with-Delta-Recalculation
**What:** When deleting a single entry from a meter-reading meter, find the chronologically next entry and recalculate its delta.
**When to use:** DELETE /api/entries/:id when meter's `entry_mode = 'meter_reading'`.
```javascript
// Find the entry being deleted and the one right after it
const [deleted, next] = await Promise.all([
  pool.query(`SELECT * FROM utility_entries WHERE id = $1`, [entryId]),
  pool.query(
    `SELECT id, meter_reading FROM utility_entries
     WHERE meter_id = $1 AND date > $2
     ORDER BY date ASC, created_at ASC
     LIMIT 1`,
    [meterId, deletedDate]
  ),
]);

if (next.rows.length > 0) {
  // Re-find the entry before the deleted one to compute new delta
  const before = await pool.query(
    `SELECT meter_reading FROM utility_entries
     WHERE meter_id = $1 AND date < $2
     ORDER BY date DESC LIMIT 1`,
    [meterId, deletedDate]
  );
  const newDelta = before.rows.length === 0
    ? 0  // next entry becomes the new first reading
    : next.rows[0].meter_reading - before.rows[0].meter_reading;

  await pool.query(
    `UPDATE utility_entries SET usage_amount = $1 WHERE id = $2`,
    [Math.round(newDelta * 100) / 100, next.rows[0].id]
  );
}
await pool.query(`DELETE FROM utility_entries WHERE id = $1 AND user_id = $2`, [entryId, userId]);
```

### Pattern 8: Batch Reorder
**What:** Accept an ordered array of IDs and set `sort_order` equal to array index using `unnest`.
**When to use:** PUT /api/sections/reorder and PUT /api/sections/:id/meters/reorder.
```javascript
// Source: logical deduction from Phase 2 context decision
// PostgreSQL unnest trick — single UPDATE for N rows
await pool.query(
  `UPDATE utility_sections
   SET sort_order = updates.new_order
   FROM (
     SELECT unnest($1::uuid[]) AS id,
            generate_series(0, $2) AS new_order
   ) AS updates
   WHERE utility_sections.id = updates.id AND utility_sections.user_id = $3`,
  [orderIds, orderIds.length - 1, userId]
);
```

### Pattern 9: Stats with Nested Per-Meter Breakdown
**What:** Build section-level totals with meters nested inside in a single query (or two at most) to avoid N+1.
**When to use:** GET /api/entries/stats.
```javascript
// Two-query approach: section totals + meter totals, then merge in JS
// Section totals
const sectionStats = await pool.query(
  `SELECT s.id, s.name, s.unit,
     COALESCE(SUM(e.usage_amount), 0)::float AS total_usage,
     COALESCE(SUM(e.cost_amount), 0)::float AS total_cost,
     COUNT(e.id)::int AS entry_count
   FROM utility_sections s
   LEFT JOIN utility_meters m ON m.section_id = s.id
   LEFT JOIN utility_entries e ON e.meter_id = m.id ${whereClause}
   WHERE s.user_id = $1 AND s.archived_at IS NULL
   GROUP BY s.id, s.name, s.unit
   ORDER BY s.sort_order`,
  params
);

// Meter totals
const meterStats = await pool.query(
  `SELECT m.id, m.name, m.section_id,
     COALESCE(SUM(e.usage_amount), 0)::float AS total_usage,
     COALESCE(SUM(e.cost_amount), 0)::float AS total_cost,
     COUNT(e.id)::int AS entry_count
   FROM utility_meters m
   LEFT JOIN utility_entries e ON e.meter_id = m.id ${whereClause}
   JOIN utility_sections s ON s.id = m.section_id
   WHERE s.user_id = $1 AND m.archived_at IS NULL
   GROUP BY m.id, m.name, m.section_id`,
  params
);

// Merge in JavaScript
const metersBySection = {};
for (const row of meterStats.rows) {
  if (!metersBySection[row.section_id]) metersBySection[row.section_id] = [];
  metersBySection[row.section_id].push(row);
}
return sectionStats.rows.map(s => ({ ...s, meters: metersBySection[s.id] ?? [] }));
```

### Anti-Patterns to Avoid
- **VALID_TYPES constant:** The existing `VALID_TYPES = ['power', 'water', 'fuel']` pattern is hardcoded to the old schema. Remove it entirely; validate by UUID existence + ownership query instead.
- **Type string mapping (TYPE_TO_SECTION etc.):** The `sectionNameToType` / `typeToSectionName` functions in `entriesService.js` and `breakdownController.js` are compatibility shims for the old schema. Remove them in Phase 2 rewrites.
- **Multiple round-trips for ownership:** Never do `SELECT section WHERE user_id = X` then `SELECT meter WHERE section_id = Y` as two queries. Use a JOIN.
- **Skipping transactions for multi-row writes:** Date-range splitting inserts N rows atomically. Reorder batch, archive cascade, and delete-with-recalculation should also use transactions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom ID generator | `gen_random_uuid()` in SQL DEFAULT | Already in schema from Phase 1 |
| Timestamp management | Application-layer timestamps | `now()` in SQL DEFAULT | Consistent, no clock drift |
| Transaction management | Manual BEGIN/COMMIT strings | `pool.query('BEGIN')` + try/catch + `ROLLBACK` | pg client pattern |
| Batch update across N rows | N individual UPDATE queries | `unnest($1::uuid[])` + `generate_series` | Single round-trip |
| Auth token parsing | Custom JWT decode | `supabase.auth.getUser(token)` in existing middleware | Already implemented |

---

## Common Pitfalls

### Pitfall 1: Forgetting `archived_at IS NULL` in queries
**What goes wrong:** Archived sections/meters appear in GET /api/sections and stats responses.
**Why it happens:** Every query that touches sections or meters needs an explicit `archived_at IS NULL` filter.
**How to avoid:** Add `AND s.archived_at IS NULL AND m.archived_at IS NULL` to every default query. Only omit when `?include_archived=true` is passed.
**Warning signs:** Test with an archived section — if it appears in the default response, filter is missing.

### Pitfall 2: N+1 queries in stats endpoint
**What goes wrong:** Fetching section totals then running a separate query per section for meter totals. With many sections this causes slow responses.
**How to avoid:** Use the two-query merge pattern (all section totals + all meter totals, merge in JS) rather than querying inside a loop.

### Pitfall 3: Delta recalculation race condition
**What goes wrong:** Concurrent deletes on the same meter's reading chain corrupt the delta. The "find next entry" query can return wrong results without a lock.
**How to avoid:** Wrap the delete+recalculate in a transaction. In practice, single-user app reduces likelihood, but the transaction provides correctness guarantee.

### Pitfall 4: Date arithmetic off-by-one for date range splitting
**What goes wrong:** A range from 2025-01-01 to 2025-01-10 should produce 10 rows (inclusive), not 9.
**How to avoid:** Use `Math.round((end - start) / 86400000) + 1` for day count. Verify with unit test: 1-day range (same start/end date) produces 1 row.

### Pitfall 5: Negative delta on meter reading entries
**What goes wrong:** If a user enters a meter reading that is lower than the previous reading (meter reset or data entry error), the delta becomes negative.
**How to avoid:** At this phase, store the delta as-is (negative is valid data). Do not throw an error; that is a UI concern for a later phase.

### Pitfall 6: `sort_order` gaps after delete
**What goes wrong:** After deleting a section or meter, `sort_order` values have gaps (0, 1, 3, 5). The reorder endpoint fixes this when called, but gaps cause no functional harm.
**How to avoid:** The reorder endpoint normalizes positions. Do not auto-renumber on delete — it is unnecessary complexity.

### Pitfall 7: Missing `group_id` generation for date-range entries
**What goes wrong:** Forgetting to generate and share a `group_id` UUID across all rows from a date-range split. Without it, rows cannot be identified as a group for future delete-group operations.
**How to avoid:** Generate one UUID with `crypto.randomUUID()` (Node.js built-in) before the insert loop and pass the same value to every row.

---

## Code Examples

### GET /api/sections — response shape
```json
[
  {
    "id": "uuid",
    "name": "Water",
    "unit": "m³",
    "icon": "droplet",
    "sort_order": 0,
    "archived_at": null,
    "meters": [
      { "id": "uuid", "name": "Water Meter 1", "entry_mode": "usage_amount", "sort_order": 0 }
    ]
  }
]
```

### POST /api/entries — request shape
```json
{
  "meter_id": "uuid",
  "start_date": "2025-01-01",
  "end_date": "2025-01-10",
  "usage_amount": 50.0,
  "unit_price": 0.30
}
```
For meter-reading mode:
```json
{
  "meter_id": "uuid",
  "start_date": "2025-01-10",
  "end_date": "2025-01-10",
  "meter_reading": 1234.5,
  "unit_price": 0.30
}
```

### POST /api/entries — response (first reading)
```json
{
  "id": "uuid",
  "meter_id": "uuid",
  "date": "2025-01-10",
  "usage_amount": 0,
  "meter_reading": 1234.5,
  "is_initial": true
}
```

### GET /api/entries/stats — response shape
```json
{
  "sections": [
    {
      "id": "uuid",
      "name": "Water",
      "unit": "m³",
      "total_usage": 150.0,
      "total_cost": 97.50,
      "entry_count": 30,
      "meters": [
        { "id": "uuid", "name": "Water Meter 1", "total_usage": 150.0, "total_cost": 97.50 }
      ]
    }
  ]
}
```

### GET /api/meters/:id/last-reading — response shape
```json
{
  "id": "uuid",
  "meter_id": "uuid",
  "date": "2025-01-10",
  "meter_reading": 1234.5,
  "usage_amount": 50.0
}
```
Returns `404` if no entries exist for the meter.

### Transaction wrapper pattern
```javascript
// Source: standard pg transaction pattern
const pool = getDb();
if (!pool) throw new Error('Database not configured');
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ... multiple queries using client.query(...)
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `VALID_TYPES = ['power', 'water', 'fuel']` | Ownership chain validation via UUID JOIN | Phase 2 | All entry endpoints must be rewritten |
| `type` string column on entries | `meter_id` foreign key | Phase 1 | `createEntry` must use `meter_id` not `type` |
| Stats grouped by `type` string | Stats grouped by section/meter via JOINs | Phase 2 | `getStats` and `breakdownController` must change |
| `utility_settings` keyed by `(user_id, type)` | `utility_settings` keyed by `(user_id, section_id)` | Phase 1 | `settingsService` partially updated in Phase 1 |

**Deprecated/outdated:**
- `TYPE_TO_SECTION` / `SECTION_TO_TYPE` mapping objects in `entriesService.js` and `breakdownController.js`: Remove entirely in Phase 2.
- `VALID_TYPES` constant in `entriesController.js` and `breakdownController.js`: Remove entirely.

---

## Open Questions

1. **Does `utility_settings` also need a `meter_id` column, or does it stay at section level?**
   - What we know: Current schema stores unit_price per section. Phase 1 CONTEXT says `section_id` replaces `type`.
   - What's unclear: The entry POST sends `unit_price` — is this stored on the section or the meter?
   - Recommendation: Keep `utility_settings` at section level (unit_price per section, not per meter) since that matches the existing schema and the Phase 1 decisions. Revisit in Phase 5 if needed.

2. **`cost_amount` calculation in POST /api/entries**
   - What we know: Old controller calculates `cost_amount = usage_amount * unit_price` automatically. For meter-reading mode, `usage_amount` is the computed delta.
   - What's unclear: Should `cost_amount` be stored per daily row for date-range entries, or just computed at read time?
   - Recommendation: Store `cost_amount` per row (matching existing schema). For date-range entries, distribute cost proportionally (same split logic as usage). For meter-reading entries with `usage_amount = 0`, `cost_amount = 0`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `backend/vitest.config.js` |
| Quick run command | `cd backend && npx vitest run tests/api.test.js` |
| Full suite command | `cd backend && npx vitest run` |

### Phase Requirements → Test Map

Phase 2 has no direct v1 requirement IDs but has 5 success criteria that must be tested:

| Success Criteria | Behavior | Test Type | Automated Command | File Exists? |
|-----------------|----------|-----------|-------------------|-------------|
| SC-1 | GET /api/sections returns nested tree in sort order | integration | `cd backend && npx vitest run tests/api.test.js` | ❌ Wave 0 |
| SC-2 | Section/meter CRUD + reorder endpoints return correct responses | integration | `cd backend && npx vitest run tests/api.test.js` | ❌ Wave 0 |
| SC-3 | POST /api/entries handles both modes, stores correct usage_amount | integration | `cd backend && npx vitest run tests/api.test.js` | ❌ Wave 0 |
| SC-4 | GET /api/entries/stats returns dynamic section/meter breakdown | integration | `cd backend && npx vitest run tests/api.test.js` | ❌ Wave 0 |
| SC-5 | GET /api/meters/:id/last-reading returns most recent entry | integration | `cd backend && npx vitest run tests/api.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && npx vitest run tests/api.test.js`
- **Per wave merge:** `cd backend && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/tests/api.test.js` — covers all 5 success criteria above
- [ ] Test requires `TEST_DATABASE_URL` env var (already in use by `migration.test.js` — same pattern)
- [ ] `backend/tests/helpers/db.js` already exists — reuse directly

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `backend/services/entriesService.js` — existing query patterns, current schema state
- Direct code inspection: `backend/controllers/entriesController.js` — validation patterns, error handling
- Direct code inspection: `backend/db.js` — pool connection, `getDb()` function
- Direct code inspection: `backend/middleware/auth.js` — `authenticate` middleware, `req.user` shape
- Direct code inspection: `backend/server.js` — route mounting pattern
- Direct code inspection: `backend/tests/migration.test.js` — integration test pattern, `beforeAll`/`afterAll` lifecycle
- `.planning/phases/02-backend-services/02-CONTEXT.md` — all locked decisions
- `.planning/phases/01-schema-migration/01-CONTEXT.md` — schema decisions (group_id, meter_reading, entry_mode, archived_at)

### Secondary (MEDIUM confidence)
- PostgreSQL `unnest` + `generate_series` batch update: standard pg pattern, widely documented
- `crypto.randomUUID()` as Node.js built-in (Node 20.x confirmed in `package.json`)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already installed, code inspected directly
- Architecture: HIGH — patterns extracted from existing codebase, not assumed
- Pitfalls: HIGH — derived from schema decisions in CONTEXT.md + code inspection
- SQL patterns: MEDIUM — logic is correct but exact column names must be confirmed against Phase 1 migration output before writing queries

**Research date:** 2026-03-18
**Valid until:** Until Phase 1 migration is applied (column names may vary slightly from assumptions)
