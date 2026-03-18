# Phase 1: Schema Migration - Research

**Researched:** 2026-03-18
**Domain:** PostgreSQL schema migration — new tables, data backfill, reversibility
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Date-range entry storage**
- Split into individual daily rows at insert time (e.g., 50 kWh over 10 days = 10 rows of 5 kWh each)
- Add nullable `group_id` UUID column to link rows from the same range entry
- No separate range metadata table — original range reconstructable from MIN/MAX date and SUM of the group
- Deleting one row from a group deletes only that row (remaining rows stay, total decreases)
- Fractional amounts rounded to 2 decimal places; last row absorbs rounding remainder so sum is exact

**Meter reading chain**
- Add nullable `meter_reading` column on `utility_entries` — NULL for usage-amount entries, raw reading value for reading entries
- Computed usage delta stored in `usage_amount` (current reading - previous reading)
- On deletion of a mid-chain reading, recalculate the next entry's usage delta at delete time
- Entry mode is per-meter (stored on `utility_meters` table), not per-entry — all entries for a meter use the same mode
- Mode is locked after first entry — user must create a new meter to use a different mode

**Section/meter schema**
- Section icons stored as icon name strings (e.g., 'droplet', 'zap', 'flame') — frontend maps to icon library
- `archived_at` nullable timestamp column for soft-delete; hard delete removes the row entirely (CASCADE entries)
- Each default section gets one default meter during migration: 'Water Meter 1', 'Power Meter 1', 'Fuel Meter 1'
- Existing `utility_entries` rows are assigned to these default meters via `meter_id`
- Old `type` column is dropped after backfill — clean break, rollback migration can restore it
- `utility_settings` rows updated to reference `section_id` instead of type strings

### Claude's Discretion
- Migration tooling choice (raw SQL files, migration library, or Supabase migrations)
- Exact column types, constraints, and index strategy
- Rollback implementation details
- Sort order column implementation for sections and meters

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UNIT-01 | Power section defaults to "kWh" unit | Default meter for Power seeded with `unit = 'kWh'` in migration |
| UNIT-02 | Water section defaults to "m³" unit | Default meter for Water seeded with `unit = 'm³'` in migration |
</phase_requirements>

---

## Summary

This phase replaces the hardcoded `type` string column in `utility_entries` and `utility_settings` with two new normalized tables: `utility_sections` and `utility_meters`. All existing data is backfilled into the new schema, the old `type` column is dropped, and the migration is wrapped in a transaction so it is fully reversible via a rollback script.

The project uses raw SQL via `pg` pool — no ORM, no migration library. The correct tooling choice is therefore a pair of plain SQL files: an `up.sql` that runs inside a single transaction block (DDL + DML), and a `down.sql` that restores the original schema. This matches the existing codebase pattern perfectly, avoids new dependencies, and can be executed directly against the Supabase PostgreSQL endpoint.

UNIT-01 and UNIT-02 are satisfied by the seed data in the migration: the Power section row seeds with `unit = 'kWh'` and the Water section row seeds with `unit = 'm³'`. These default sections are editable after migration (no special-casing in code).

**Primary recommendation:** Write two raw SQL files (`up.sql` / `down.sql`) executed as a transaction via `psql` or a thin Node runner script; no migration library required.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pg` | 8.13.1 | PostgreSQL client | Already in use; all queries go through this |
| PostgreSQL | (Supabase-managed) | Database engine | Existing infrastructure |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `psql` CLI | — | Execute migration scripts manually | One-time migration against Supabase DB |
| Node script (thin runner) | — | Wrap up.sql/down.sql in JS for CI/automated rollout | If psql is unavailable in Railway build context |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw SQL files | Flyway / node-pg-migrate / Knex migrations | Adds dependency, config overhead, and onboarding cost; not justified for a single-person project with no existing migration history |
| Raw SQL files | Supabase migrations (supabase CLI) | Requires supabase CLI toolchain locally and linking project; overhead exceeds benefit when all DDL can run via psql or pg directly |

**Installation:** No new packages needed for migration execution.

---

## Architecture Patterns

### Recommended Migration File Structure
```
backend/
└── migrations/
    ├── 001_schema_migration.up.sql    # Forward migration (wrapped in transaction)
    └── 001_schema_migration.down.sql  # Rollback (restores original schema)
```

A thin Node runner is optional but useful:
```
backend/
└── scripts/
    └── migrate.js   # reads up.sql/down.sql, runs via pool.query() in sequence
```

### Pattern 1: Single-Transaction DDL + DML Migration
**What:** Wrap all DDL (CREATE TABLE, ALTER TABLE, DROP COLUMN) and DML (INSERT seed data, UPDATE backfill) inside `BEGIN` / `COMMIT`. If anything fails, `ROLLBACK` leaves the database untouched.
**When to use:** Always for migrations that combine schema changes with data backfill. PostgreSQL supports transactional DDL (unlike MySQL), so this is safe.
**Example:**
```sql
-- 001_schema_migration.up.sql

BEGIN;

-- 1. Create new tables
CREATE TABLE utility_sections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  name        TEXT NOT NULL,
  unit        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'zap',
  sort_order  INT  NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE utility_meters (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id   UUID NOT NULL REFERENCES utility_sections(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  entry_mode   TEXT NOT NULL DEFAULT 'usage' CHECK (entry_mode IN ('usage', 'reading')),
  sort_order   INT  NOT NULL DEFAULT 0,
  archived_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add new columns to existing tables (nullable so existing rows are valid)
ALTER TABLE utility_entries
  ADD COLUMN meter_id      UUID REFERENCES utility_meters(id) ON DELETE CASCADE,
  ADD COLUMN group_id      UUID,
  ADD COLUMN meter_reading NUMERIC(12,2);

ALTER TABLE utility_settings
  ADD COLUMN section_id UUID REFERENCES utility_sections(id) ON DELETE CASCADE;

-- 3. Seed default sections for every distinct user_id that has entries
INSERT INTO utility_sections (id, user_id, name, unit, icon, sort_order)
SELECT
  gen_random_uuid(), u.user_id,
  'Water', 'm³', 'droplet', 0
FROM (SELECT DISTINCT user_id FROM utility_entries) u

UNION ALL

SELECT
  gen_random_uuid(), u.user_id,
  'Power', 'kWh', 'zap', 1
FROM (SELECT DISTINCT user_id FROM utility_entries) u

UNION ALL

SELECT
  gen_random_uuid(), u.user_id,
  'Fuel', 'L', 'flame', 2
FROM (SELECT DISTINCT user_id FROM utility_entries) u;

-- Also seed sections for users with settings but no entries
INSERT INTO utility_sections (id, user_id, name, unit, icon, sort_order)
SELECT gen_random_uuid(), s.user_id, 'Water', 'm³', 'droplet', 0
FROM (SELECT DISTINCT user_id FROM utility_settings
      WHERE user_id NOT IN (SELECT DISTINCT user_id FROM utility_entries)) s
-- (repeat for Power, Fuel)
;

-- 4. Seed one default meter per section per user
-- (Use a CTE to get the newly-inserted section IDs)
WITH meters AS (
  INSERT INTO utility_meters (id, section_id, name, entry_mode, sort_order)
  SELECT
    gen_random_uuid(),
    s.id,
    s.name || ' Meter 1',
    'usage',
    0
  FROM utility_sections s
  RETURNING id, section_id
)
-- Capture nothing here; referencing happens in next step via subquery

-- 5. Backfill meter_id on utility_entries matching type → meter name prefix
UPDATE utility_entries e
SET meter_id = m.id
FROM utility_meters m
JOIN utility_sections s ON s.id = m.section_id
WHERE s.user_id = e.user_id
  AND (
    (e.type = 'water' AND s.name = 'Water') OR
    (e.type = 'power' AND s.name = 'Power') OR
    (e.type = 'fuel'  AND s.name = 'Fuel')
  )
  AND m.name = s.name || ' Meter 1';

-- 6. Backfill section_id on utility_settings
UPDATE utility_settings us
SET section_id = s.id
FROM utility_sections s
WHERE s.user_id = us.user_id
  AND (
    (us.type = 'water' AND s.name = 'Water') OR
    (us.type = 'power' AND s.name = 'Power') OR
    (us.type = 'fuel'  AND s.name = 'Fuel')
  );

-- 7. Drop the old type column (clean break)
ALTER TABLE utility_entries  DROP COLUMN type;
ALTER TABLE utility_settings DROP COLUMN type;

-- 8. Now that all rows have meter_id / section_id, add NOT NULL constraints
ALTER TABLE utility_entries  ALTER COLUMN meter_id   SET NOT NULL;
ALTER TABLE utility_settings ALTER COLUMN section_id SET NOT NULL;

COMMIT;
```

### Pattern 2: Rollback (down.sql)
**What:** Reverse every step in the up migration. Re-add `type` column, backfill values from the new tables, remove new columns, drop new tables.
**When to use:** Any time the migration must be undone without data loss.
```sql
-- 001_schema_migration.down.sql

BEGIN;

-- Re-add type column (nullable first, fill, then constrain)
ALTER TABLE utility_entries  ADD COLUMN type TEXT;
ALTER TABLE utility_settings ADD COLUMN type TEXT;

-- Backfill type from sections via meters
UPDATE utility_entries e
SET type = LOWER(s.name)
FROM utility_meters m
JOIN utility_sections s ON s.id = m.section_id
WHERE m.id = e.meter_id;

UPDATE utility_settings us
SET type = LOWER(s.name)
FROM utility_sections s
WHERE s.id = us.section_id;

-- Remove new columns
ALTER TABLE utility_entries  DROP COLUMN meter_id, DROP COLUMN group_id, DROP COLUMN meter_reading;
ALTER TABLE utility_settings DROP COLUMN section_id;

-- Drop new tables (CASCADE handles FK references)
DROP TABLE utility_meters;
DROP TABLE utility_sections;

COMMIT;
```

### Pattern 3: Two-Step NOT NULL (safe backfill)
**What:** Add column nullable → backfill all rows → add NOT NULL constraint. PostgreSQL 12+ table rewrite for NOT NULL is fast (just a constraint mark when done in one transaction after backfill).
**When to use:** Any time you add a required FK column to an existing table with data.

### Anti-Patterns to Avoid
- **Adding NOT NULL before backfill:** Will fail immediately on any existing row. Always add nullable, backfill, then constrain.
- **Running DDL and DML in separate transactions:** If backfill succeeds but DROP COLUMN fails, schema is in a mixed state. Always use a single transaction.
- **Using ALTER TABLE … ADD COLUMN with a DEFAULT that triggers table rewrite:** PostgreSQL 11+ stores the default without a rewrite, but if using a volatile function as default (e.g., `now()`), test this. `gen_random_uuid()` is stable per-row, fine.
- **Dropping `type` before verifying 100% of rows are backfilled:** Add an assertion before DROP. If any `meter_id IS NULL` remains, abort.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom ID generator | `gen_random_uuid()` (PostgreSQL built-in) | Available in all Supabase-hosted Postgres without extension |
| Soft delete timestamps | Custom flag column | `archived_at TIMESTAMPTZ` (nullable) | Standard pattern; NULL = active, value = archived |
| Cascade deletes | Manual DELETE in code | `ON DELETE CASCADE` FK constraint | DB enforces referential integrity at write time |
| Sort ordering | Bitmask or float tricks | Simple `INT sort_order` column | Sufficient for small lists; gaps allow reordering without renumbering |
| Transactional migration | Separate DDL then DML | Single `BEGIN; ... COMMIT;` block | PostgreSQL's transactional DDL is the whole point |

**Key insight:** PostgreSQL's transactional DDL eliminates the most dangerous class of migration failures. Always wrap in a single transaction.

---

## Common Pitfalls

### Pitfall 1: Missing users with only settings but no entries
**What goes wrong:** The seed step only queries `DISTINCT user_id FROM utility_entries`. Users who have `utility_settings` rows but zero entries never get default sections seeded. Their settings rows fail the NOT NULL constraint on `section_id`.
**Why it happens:** Easy to miss when entries and settings come from separate tables.
**How to avoid:** Seed sections for the union of `(SELECT DISTINCT user_id FROM utility_entries) UNION (SELECT DISTINCT user_id FROM utility_settings)`.
**Warning signs:** `ERROR: null value in column "section_id"` when adding NOT NULL after backfill.

### Pitfall 2: Case mismatch on type strings
**What goes wrong:** Existing `type` values may be `'Water'`, `'water'`, or `'WATER'` inconsistently. The UPDATE backfill using `e.type = 'water'` misses rows stored as `'Water'`.
**Why it happens:** No CHECK constraint on the original `type` column — the app may have inserted different casings over time.
**How to avoid:** Use `LOWER(e.type)` in the WHERE clause comparison, or inspect actual distinct values with `SELECT DISTINCT type FROM utility_entries;` before writing the migration.
**Warning signs:** `meter_id IS NULL` rows remaining after backfill UPDATE.

### Pitfall 3: Assertion gap before DROP COLUMN
**What goes wrong:** DROP COLUMN executes even when some rows failed backfill, silently deleting the `type` value that would have allowed recovery.
**How to avoid:** Add a hard assertion inside the transaction before DROP:
```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM utility_entries WHERE meter_id IS NULL) THEN
    RAISE EXCEPTION 'Backfill incomplete: % rows missing meter_id',
      (SELECT COUNT(*) FROM utility_entries WHERE meter_id IS NULL);
  END IF;
END $$;
```
If this raises, the transaction rolls back automatically.
**Warning signs:** Any exception after the INSERT/UPDATE steps.

### Pitfall 4: `gen_random_uuid()` availability
**What goes wrong:** On older PostgreSQL versions, `gen_random_uuid()` requires the `pgcrypto` extension.
**Why it happens:** Supabase enables `pgcrypto` by default, but self-hosted Postgres may not.
**How to avoid:** Add `CREATE EXTENSION IF NOT EXISTS pgcrypto;` at top of migration (Supabase already has it; this is a no-op).
**Warning signs:** `ERROR: function gen_random_uuid() does not exist`.

### Pitfall 5: CTE INSERT not visible in subsequent UPDATE in same statement
**What goes wrong:** A CTE that does `INSERT INTO utility_meters ... RETURNING id` is not directly joinable in a sibling UPDATE CTE in PostgreSQL (data-modifying CTEs are isolated).
**Why it happens:** PostgreSQL evaluates all CTE arms before executing downstream queries.
**How to avoid:** Break the migration into sequential statements: INSERT sections → INSERT meters → UPDATE entries. All within the same transaction.
**Warning signs:** 0 rows updated in the backfill step despite meters existing.

---

## Code Examples

Verified patterns from the existing codebase:

### Existing pool.query() pattern (from backend/services/entriesService.js)
```javascript
// Pattern already used in the project — migration runner can follow this
const pool = getDb();
await pool.query(`BEGIN`);
try {
  await pool.query(upSql);
  await pool.query(`COMMIT`);
} catch (err) {
  await pool.query(`ROLLBACK`);
  throw err;
}
```

### Assertion before destructive DDL
```sql
DO $$
DECLARE
  missing_count INT;
BEGIN
  SELECT COUNT(*) INTO missing_count FROM utility_entries WHERE meter_id IS NULL;
  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Aborting: % entries have no meter_id after backfill', missing_count;
  END IF;
END $$;
ALTER TABLE utility_entries ALTER COLUMN meter_id SET NOT NULL;
ALTER TABLE utility_entries DROP COLUMN type;
```

### Sort order column (integer, gaps allowed)
```sql
-- Insert at the end
INSERT INTO utility_sections (name, unit, icon, sort_order, user_id)
VALUES ('Water', 'm³', 'droplet', 0, $1);

-- Reorder: shift everything above a point up by 1
UPDATE utility_sections
SET sort_order = sort_order + 1
WHERE user_id = $1 AND sort_order >= $2;
```

### Entry mode lock check (future service layer pattern)
```sql
-- Check before allowing mode change
SELECT COUNT(*) FROM utility_entries WHERE meter_id = $1;
-- If > 0, reject mode change; mode is locked
```

---

## Target Schema (Post-Migration)

### `utility_sections`
```sql
CREATE TABLE utility_sections (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL,
  name        TEXT        NOT NULL,
  unit        TEXT        NOT NULL,
  icon        TEXT        NOT NULL DEFAULT 'zap',
  sort_order  INT         NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `utility_meters`
```sql
CREATE TABLE utility_meters (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  UUID        NOT NULL REFERENCES utility_sections(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  entry_mode  TEXT        NOT NULL DEFAULT 'usage' CHECK (entry_mode IN ('usage', 'reading')),
  sort_order  INT         NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `utility_entries` (modified)
New columns added, `type` removed:
- `meter_id UUID NOT NULL REFERENCES utility_meters(id) ON DELETE CASCADE`
- `group_id UUID` (nullable, links split-range rows)
- `meter_reading NUMERIC(12,2)` (nullable, NULL for usage-amount entries)

### `utility_settings` (modified)
New column added, `type` removed:
- `section_id UUID NOT NULL REFERENCES utility_sections(id) ON DELETE CASCADE`

---

## Open Questions

1. **Actual type string casing in production data**
   - What we know: Code inserts `type` values; we can see the app uses 'water', 'power', 'fuel' (lowercase) in service calls
   - What's unclear: Whether any historical rows used different casing or values not matching these three
   - Recommendation: Before running migration, execute `SELECT DISTINCT type FROM utility_entries;` against production DB and confirm. CONCERNS.md flags "Database Schema Unknown" as a fragile area.

2. **Users with zero entries**
   - What we know: `utility_settings` can exist without entries (unit prices auto-saved on first entry)
   - What's unclear: Whether any user has settings rows but no entries
   - Recommendation: Seed sections using UNION of both tables as described in Pitfall 1 above.

3. **Empty database case**
   - What we know: Migration must handle a fresh DB with no entries or settings
   - What's unclear: Nothing — the INSERT ... SELECT FROM (SELECT DISTINCT ...) pattern returns 0 rows safely on empty tables; no special handling needed.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None currently — Wave 0 must install Vitest |
| Config file | `backend/vitest.config.js` — Wave 0 creates this |
| Quick run command | `cd backend && npx vitest run tests/migration.test.js` |
| Full suite command | `cd backend && npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UNIT-01 | `utility_sections` row for Power has `unit = 'kWh'` | integration (DB) | `npx vitest run tests/migration.test.js -t "UNIT-01"` | ❌ Wave 0 |
| UNIT-02 | `utility_sections` row for Water has `unit = 'm³'` | integration (DB) | `npx vitest run tests/migration.test.js -t "UNIT-02"` | ❌ Wave 0 |
| — | All `utility_entries` rows have non-null `meter_id` | integration (DB) | `npx vitest run tests/migration.test.js -t "backfill complete"` | ❌ Wave 0 |
| — | All `utility_settings` rows have non-null `section_id` | integration (DB) | `npx vitest run tests/migration.test.js -t "settings backfill"` | ❌ Wave 0 |
| — | `type` column does not exist post-migration | integration (DB) | `npx vitest run tests/migration.test.js -t "type column dropped"` | ❌ Wave 0 |
| — | `utility_sections` and `utility_meters` tables exist | smoke | `npx vitest run tests/migration.test.js -t "tables exist"` | ❌ Wave 0 |
| — | Rollback restores `type` column and drops new tables | integration (DB) | `npx vitest run tests/migration.test.js -t "rollback"` | ❌ Wave 0 |

**Note:** These are integration tests requiring a live or test DB connection. Tests should connect to a test database (separate from production). A `TEST_DATABASE_URL` env var should be used. If no test DB is available, these become manual verification steps — the migration assertion DO block covers the critical cases at runtime.

### Sampling Rate
- **Per task commit:** `cd backend && npx vitest run tests/migration.test.js`
- **Per wave merge:** `cd backend && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/vitest.config.js` — Vitest config for backend
- [ ] `backend/tests/migration.test.js` — Migration verification tests
- [ ] Framework install: `cd backend && npm install --save-dev vitest`
- [ ] `backend/tests/helpers/db.js` — Test DB connection helper using `TEST_DATABASE_URL`

---

## Sources

### Primary (HIGH confidence)
- Direct read of `backend/services/entriesService.js` — confirmed current schema shape: `type, usage_amount, cost_amount, unit_price, unit, date`
- Direct read of `backend/services/settingsService.js` — confirmed `user_id, type, unit_price` with UPSERT on `(user_id, type)`
- Direct read of `backend/db.js` — confirmed `pg` Pool, `getDb()` pattern
- `.planning/phases/01-schema-migration/01-CONTEXT.md` — all locked schema decisions
- PostgreSQL documentation (transactional DDL, gen_random_uuid, NOT NULL constraints) — general knowledge, HIGH confidence

### Secondary (MEDIUM confidence)
- `.planning/codebase/CONCERNS.md` — "Database Schema Unknown" fragile area confirms no existing migrations file
- `.planning/codebase/TESTING.md` — confirmed zero test infrastructure; Vitest recommended for backend

### Tertiary (LOW confidence)
- Assumption that existing `type` values are lowercase `'water'`, `'power'`, `'fuel'` — confirmed by code but not verified against production data rows. Must `SELECT DISTINCT type FROM utility_entries` before migration.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pg and raw SQL are already the established pattern; no new tooling
- Architecture: HIGH — single-transaction DDL+DML is standard PostgreSQL practice; all steps derived from actual schema inspection
- Pitfalls: HIGH — type case sensitivity and backfill assertion are common migration gotchas, well-documented
- UNIT-01/02 coverage: HIGH — trivially satisfied by seed INSERT with hardcoded unit values

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable domain — PostgreSQL DDL patterns do not change rapidly)
