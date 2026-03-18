import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestDb, closeTestDb } from './helpers/db.js';
import { connect, close as closeDb } from '../db.js';
import {
  getAll,
  create,
  update,
  remove,
  archive,
  unarchive,
  reorder,
  createMeter,
  getLastReading,
} from '../services/sectionsService.js';
import {
  createEntry,
  getStats,
} from '../services/entriesService.js';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

let pool;

beforeAll(async () => {
  // Point db.js to the test database so service functions use it
  process.env.DB_URL_OVERRIDE = process.env.TEST_DATABASE_URL;
  await connect();

  pool = getTestDb();
});

afterAll(async () => {
  // Final cleanup
  await pool.query(
    `DELETE FROM utility_entries WHERE user_id = $1`,
    [TEST_USER_ID]
  );
  await pool.query(
    `DELETE FROM utility_meters m USING utility_sections s
     WHERE m.section_id = s.id AND s.user_id = $1`,
    [TEST_USER_ID]
  );
  await pool.query(
    `DELETE FROM utility_sections WHERE user_id = $1`,
    [TEST_USER_ID]
  );

  await closeDb();
  await closeTestDb();
});

beforeEach(async () => {
  // Clean slate before each test
  await pool.query(
    `DELETE FROM utility_entries WHERE user_id = $1`,
    [TEST_USER_ID]
  );
  await pool.query(
    `DELETE FROM utility_meters m USING utility_sections s
     WHERE m.section_id = s.id AND s.user_id = $1`,
    [TEST_USER_ID]
  );
  await pool.query(
    `DELETE FROM utility_sections WHERE user_id = $1`,
    [TEST_USER_ID]
  );
});

// ---------------------------------------------------------------------------
// SC-1: GET /api/sections returns nested tree in sort order
// ---------------------------------------------------------------------------
describe('SC-1: GET /api/sections nested tree', () => {
  it('returns sections in sort order with nested meters', async () => {
    const water = await create(TEST_USER_ID, { name: 'Water', unit: 'm³', icon: null });
    const power = await create(TEST_USER_ID, { name: 'Power', unit: 'kWh', icon: null });

    await createMeter(TEST_USER_ID, water.id, { name: 'Main meter' });
    await createMeter(TEST_USER_ID, power.id, { name: 'Electric meter' });

    const result = await getAll(TEST_USER_ID, { includeArchived: false });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);

    // Water created first → lower sort_order → comes first
    expect(result[0].name).toBe('Water');
    expect(result[0].unit).toBe('m³');
    expect(Array.isArray(result[0].meters)).toBe(true);
    expect(result[0].meters.length).toBe(1);

    const meter = result[0].meters[0];
    expect(meter).toHaveProperty('id');
    expect(meter).toHaveProperty('name');
    expect(meter).toHaveProperty('entry_mode');

    expect(result[1].name).toBe('Power');
  });
});

// ---------------------------------------------------------------------------
// SC-2: Section/meter CRUD + reorder
// ---------------------------------------------------------------------------
describe('SC-2: Section/meter CRUD + reorder', () => {
  it('creates a section with correct fields', async () => {
    const section = await create(TEST_USER_ID, { name: 'Water', unit: 'm³', icon: null });

    expect(section).toHaveProperty('id');
    expect(section.name).toBe('Water');
    expect(section.unit).toBe('m³');
  });

  it('updates section name', async () => {
    const section = await create(TEST_USER_ID, { name: 'Water', unit: 'm³', icon: null });
    const updated = await update(TEST_USER_ID, section.id, { name: 'Hot Water', unit: 'm³', icon: null });

    expect(updated.name).toBe('Hot Water');
  });

  it('creates a meter in a section', async () => {
    const section = await create(TEST_USER_ID, { name: 'Water', unit: 'm³', icon: null });
    const meter = await createMeter(TEST_USER_ID, section.id, { name: 'Main' });

    expect(meter).toHaveProperty('id');
    expect(meter.name).toBe('Main');
  });

  it('reorders sections correctly', async () => {
    const a = await create(TEST_USER_ID, { name: 'A', unit: 'L', icon: null });
    const b = await create(TEST_USER_ID, { name: 'B', unit: 'L', icon: null });
    const c = await create(TEST_USER_ID, { name: 'C', unit: 'L', icon: null });

    // Reorder to [C, A, B]
    await reorder(TEST_USER_ID, [c.id, a.id, b.id]);

    const result = await getAll(TEST_USER_ID, { includeArchived: false });
    expect(result.map(s => s.name)).toEqual(['C', 'A', 'B']);
  });

  it('deletes section — no longer in getAll', async () => {
    const section = await create(TEST_USER_ID, { name: 'Temp', unit: 'L', icon: null });
    await remove(TEST_USER_ID, section.id);

    const result = await getAll(TEST_USER_ID, { includeArchived: false });
    expect(result.find(s => s.id === section.id)).toBeUndefined();
  });

  it('archives section — excluded from default, included with includeArchived=true', async () => {
    const section = await create(TEST_USER_ID, { name: 'Archive Me', unit: 'L', icon: null });
    await archive(TEST_USER_ID, section.id);

    const defaultResult = await getAll(TEST_USER_ID, { includeArchived: false });
    expect(defaultResult.find(s => s.id === section.id)).toBeUndefined();

    const allResult = await getAll(TEST_USER_ID, { includeArchived: true });
    expect(allResult.find(s => s.id === section.id)).toBeDefined();
  });

  it('unarchives section — appears again in default getAll', async () => {
    const section = await create(TEST_USER_ID, { name: 'Revive Me', unit: 'L', icon: null });
    await archive(TEST_USER_ID, section.id);
    await unarchive(TEST_USER_ID, section.id);

    const result = await getAll(TEST_USER_ID, { includeArchived: false });
    expect(result.find(s => s.id === section.id)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// SC-3: POST /api/entries handles both usage-amount and meter-reading modes
// ---------------------------------------------------------------------------
describe('SC-3: POST /api/entries both modes', () => {
  it('usage-amount single day: returns entry with usage_amount and cost_amount', async () => {
    const section = await create(TEST_USER_ID, { name: 'Water', unit: 'm³', icon: null });
    const meter = await createMeter(TEST_USER_ID, section.id, { name: 'Main' });

    const entry = await createEntry(TEST_USER_ID, {
      meter_id: meter.id,
      start_date: '2025-01-15',
      end_date: '2025-01-15',
      usage_amount: 10,
      unit_price: 0.5,
    });

    expect(parseFloat(entry.usage_amount)).toBe(10);
    expect(parseFloat(entry.cost_amount)).toBeCloseTo(5.0, 2);
  });

  it('usage-amount date range: returns array of entries with group_id and sum = total', async () => {
    const section = await create(TEST_USER_ID, { name: 'Water', unit: 'm³', icon: null });
    const meter = await createMeter(TEST_USER_ID, section.id, { name: 'Main' });

    const entries = await createEntry(TEST_USER_ID, {
      meter_id: meter.id,
      start_date: '2025-01-01',
      end_date: '2025-01-10',
      usage_amount: 50,
      unit_price: 1,
    });

    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBe(10);

    const totalUsage = entries.reduce((sum, e) => sum + parseFloat(e.usage_amount), 0);
    expect(totalUsage).toBeCloseTo(50, 1);

    const groupIds = new Set(entries.map(e => e.group_id));
    expect(groupIds.size).toBe(1);
    expect([...groupIds][0]).not.toBeNull();
  });

  it('meter-reading first entry: is_initial=true, usage_amount=0', async () => {
    const section = await create(TEST_USER_ID, { name: 'Power', unit: 'kWh', icon: null });

    // Create meter with entry_mode='reading' via direct SQL
    const meterResult = await pool.query(
      `INSERT INTO utility_meters (section_id, name, entry_mode, sort_order)
       VALUES ($1, $2, 'reading', 0)
       RETURNING *`,
      [section.id, 'Smart meter']
    );
    const meter = meterResult.rows[0];

    const entry = await createEntry(TEST_USER_ID, {
      meter_id: meter.id,
      start_date: '2025-01-15',
      meter_reading: 100,
      unit_price: 0.3,
    });

    expect(entry.is_initial).toBe(true);
    expect(parseFloat(entry.usage_amount)).toBe(0);
  });

  it('meter-reading subsequent entry: usage_amount = delta from prior reading', async () => {
    const section = await create(TEST_USER_ID, { name: 'Power', unit: 'kWh', icon: null });

    const meterResult = await pool.query(
      `INSERT INTO utility_meters (section_id, name, entry_mode, sort_order)
       VALUES ($1, $2, 'reading', 0)
       RETURNING *`,
      [section.id, 'Smart meter']
    );
    const meter = meterResult.rows[0];

    // First (initial) reading
    await createEntry(TEST_USER_ID, {
      meter_id: meter.id,
      start_date: '2025-01-01',
      meter_reading: 100,
      unit_price: 0.3,
    });

    // Second reading
    const entry = await createEntry(TEST_USER_ID, {
      meter_id: meter.id,
      start_date: '2025-01-15',
      meter_reading: 150,
      unit_price: 0.3,
    });

    expect(entry.is_initial).toBeFalsy();
    expect(parseFloat(entry.usage_amount)).toBeCloseTo(50, 2);
  });
});

// ---------------------------------------------------------------------------
// SC-4: GET /api/entries/stats returns dynamic section/meter breakdown
// ---------------------------------------------------------------------------
describe('SC-4: GET /api/entries/stats dynamic breakdown', () => {
  it('returns sections array with totals and nested meters', async () => {
    const water = await create(TEST_USER_ID, { name: 'Water', unit: 'm³', icon: null });
    const power = await create(TEST_USER_ID, { name: 'Power', unit: 'kWh', icon: null });
    const wMeter = await createMeter(TEST_USER_ID, water.id, { name: 'Main' });
    const pMeter = await createMeter(TEST_USER_ID, power.id, { name: 'Electric' });

    await createEntry(TEST_USER_ID, {
      meter_id: wMeter.id, start_date: '2025-01-15', end_date: '2025-01-15',
      usage_amount: 20, unit_price: 0.5,
    });
    await createEntry(TEST_USER_ID, {
      meter_id: pMeter.id, start_date: '2025-01-15', end_date: '2025-01-15',
      usage_amount: 100, unit_price: 0.3,
    });

    const result = await getStats(TEST_USER_ID, {});

    expect(result).toHaveProperty('sections');
    expect(result.sections.length).toBe(2);

    for (const section of result.sections) {
      expect(section).toHaveProperty('total_usage');
      expect(section).toHaveProperty('total_cost');
      expect(section).toHaveProperty('entry_count');
      expect(Array.isArray(section.meters)).toBe(true);
    }

    const waterSection = result.sections.find(s => s.name === 'Water');
    expect(waterSection.total_usage).toBeCloseTo(20, 2);
    expect(waterSection.meters.length).toBe(1);
    expect(waterSection.meters[0].total_usage).toBeCloseTo(20, 2);
  });

  it('year/month filtering returns only matching entries', async () => {
    const section = await create(TEST_USER_ID, { name: 'Water', unit: 'm³', icon: null });
    const meter = await createMeter(TEST_USER_ID, section.id, { name: 'Main' });

    // January 2025 entry
    await createEntry(TEST_USER_ID, {
      meter_id: meter.id, start_date: '2025-01-15', end_date: '2025-01-15',
      usage_amount: 10, unit_price: 1,
    });
    // February 2025 entry
    await createEntry(TEST_USER_ID, {
      meter_id: meter.id, start_date: '2025-02-15', end_date: '2025-02-15',
      usage_amount: 20, unit_price: 1,
    });

    const janStats = await getStats(TEST_USER_ID, { year: 2025, month: 1 });
    const waterJan = janStats.sections.find(s => s.name === 'Water');
    expect(waterJan.entry_count).toBe(1);
    expect(waterJan.total_usage).toBeCloseTo(10, 2);
  });
});

// ---------------------------------------------------------------------------
// SC-5: GET /api/meters/:id/last-reading returns most recent entry
// ---------------------------------------------------------------------------
describe('SC-5: GET /api/meters/:id/last-reading', () => {
  it('returns most recent entry for meter_reading meter', async () => {
    const section = await create(TEST_USER_ID, { name: 'Power', unit: 'kWh', icon: null });

    const meterResult = await pool.query(
      `INSERT INTO utility_meters (section_id, name, entry_mode, sort_order)
       VALUES ($1, $2, 'reading', 0)
       RETURNING *`,
      [section.id, 'Smart meter']
    );
    const meter = meterResult.rows[0];

    // Older entry
    await createEntry(TEST_USER_ID, {
      meter_id: meter.id, start_date: '2025-01-01',
      meter_reading: 100, unit_price: 0.3,
    });
    // Newer entry
    await createEntry(TEST_USER_ID, {
      meter_id: meter.id, start_date: '2025-01-15',
      meter_reading: 150, unit_price: 0.3,
    });

    const last = await getLastReading(TEST_USER_ID, meter.id);

    expect(last).not.toBeNull();
    expect(last).toHaveProperty('meter_reading');
    expect(parseFloat(last.meter_reading)).toBe(150);
  });

  it('returns null when no entries exist for the meter', async () => {
    const section = await create(TEST_USER_ID, { name: 'Power', unit: 'kWh', icon: null });

    const meterResult = await pool.query(
      `INSERT INTO utility_meters (section_id, name, entry_mode, sort_order)
       VALUES ($1, $2, 'reading', 0)
       RETURNING *`,
      [section.id, 'Empty meter']
    );
    const meter = meterResult.rows[0];

    const last = await getLastReading(TEST_USER_ID, meter.id);
    expect(last).toBeNull();
  });
});
