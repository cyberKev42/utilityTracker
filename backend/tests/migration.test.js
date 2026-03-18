import { describe, test, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { runMigration } from '../scripts/migrate.js';
import { getTestDb, closeTestDb } from './helpers/db.js';

let pool;

beforeAll(async () => {
  pool = getTestDb();

  // Ensure clean state: run down migration (ignore errors if not yet migrated)
  try {
    await runMigration('down', process.env.TEST_DATABASE_URL);
  } catch {
    // Ignore — tables may not exist yet on a fresh DB
  }

  // Create old schema tables if they don't exist (for fresh test DBs)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS utility_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      type TEXT,
      usage_amount NUMERIC(12,2),
      cost_amount NUMERIC(12,2),
      unit_price NUMERIC(12,4),
      unit TEXT,
      date DATE NOT NULL DEFAULT CURRENT_DATE
    );
    CREATE TABLE IF NOT EXISTS utility_settings (
      user_id UUID NOT NULL,
      type TEXT,
      unit_price NUMERIC(12,4),
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT utility_settings_user_id_type_key UNIQUE (user_id, type)
    );
  `);

  // Clear any pre-existing test data for our test user
  await pool.query(`
    DELETE FROM utility_entries WHERE user_id = '00000000-0000-0000-0000-000000000001';
    DELETE FROM utility_settings WHERE user_id = '00000000-0000-0000-0000-000000000001';
  `);

  // Insert test data matching the OLD schema
  await pool.query(`
    INSERT INTO utility_entries (user_id, type, usage_amount, cost_amount, unit_price, unit, date)
    VALUES
      ('00000000-0000-0000-0000-000000000001', 'water', 15.5, 10.00, 0.65, 'm³', '2025-01-15'),
      ('00000000-0000-0000-0000-000000000001', 'power', 150, 45.00, 0.30, 'kWh', '2025-01-15'),
      ('00000000-0000-0000-0000-000000000001', 'fuel', 50, 75.00, 1.50, 'L', '2025-01-15');
    INSERT INTO utility_settings (user_id, type, unit_price)
    VALUES
      ('00000000-0000-0000-0000-000000000001', 'water', 0.65),
      ('00000000-0000-0000-0000-000000000001', 'power', 0.30);
  `);

  // Run the up migration
  await runMigration('up', process.env.TEST_DATABASE_URL);
});

afterAll(async () => {
  await closeTestDb();
});

describe('Migration up', () => {
  test('tables exist', async () => {
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('utility_sections', 'utility_meters')
      ORDER BY table_name
    `);
    expect(result.rows.map(r => r.table_name)).toEqual(['utility_meters', 'utility_sections']);
  });

  test('UNIT-01: Power section has unit kWh', async () => {
    const result = await pool.query(`
      SELECT unit FROM utility_sections WHERE name = 'Power' AND user_id = '00000000-0000-0000-0000-000000000001'
    `);
    expect(result.rows[0].unit).toBe('kWh');
  });

  test('UNIT-02: Water section has unit m3', async () => {
    const result = await pool.query(`
      SELECT unit FROM utility_sections WHERE name = 'Water' AND user_id = '00000000-0000-0000-0000-000000000001'
    `);
    expect(result.rows[0].unit).toBe('m³');
  });

  test('backfill complete: all entries have meter_id', async () => {
    const result = await pool.query(`SELECT COUNT(*) as cnt FROM utility_entries WHERE meter_id IS NULL`);
    expect(parseInt(result.rows[0].cnt)).toBe(0);
  });

  test('settings backfill: all settings have section_id', async () => {
    const result = await pool.query(`SELECT COUNT(*) as cnt FROM utility_settings WHERE section_id IS NULL`);
    expect(parseInt(result.rows[0].cnt)).toBe(0);
  });

  test('type column dropped from utility_entries', async () => {
    const result = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'utility_entries' AND column_name = 'type'
    `);
    expect(result.rows.length).toBe(0);
  });

  test('rollback restores original schema', async () => {
    // Run down migration
    await runMigration('down', process.env.TEST_DATABASE_URL);

    // Verify type column exists again on utility_entries
    const typeCol = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'utility_entries' AND column_name = 'type'
    `);
    expect(typeCol.rows.length).toBe(1);

    // Verify utility_sections table does NOT exist
    const sections = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'utility_sections'
    `);
    expect(sections.rows.length).toBe(0);

    // Verify utility_meters table does NOT exist
    const meters = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'utility_meters'
    `);
    expect(meters.rows.length).toBe(0);

    // Re-run up migration to leave DB in migrated state
    await runMigration('up', process.env.TEST_DATABASE_URL);
  });
});
