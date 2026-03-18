import { getDb } from '../db.js';

// Map from frontend type identifiers to section names in the DB
// and vice versa.
const TYPE_TO_SECTION = {
  electricity: 'Power',
  water: 'Water',
  fuel: 'Fuel',
};

const SECTION_TO_TYPE = {
  power: 'electricity',
  water: 'water',
  fuel: 'fuel',
};

function sectionNameToType(name) {
  return SECTION_TO_TYPE[name.toLowerCase()] ?? name.toLowerCase();
}

function typeToSectionName(type) {
  return TYPE_TO_SECTION[type] ?? type;
}

export async function createEntry(userId, entryData) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const { type, usage_amount, cost_amount, unit_price, unit, date } = entryData;

  // Resolve the meter_id for this user + type
  const sectionName = typeToSectionName(type);
  const meterResult = await pool.query(
    `SELECT m.id
     FROM utility_meters m
     JOIN utility_sections s ON s.id = m.section_id
     WHERE s.user_id = $1 AND LOWER(s.name) = LOWER($2)
     LIMIT 1`,
    [userId, sectionName]
  );

  if (meterResult.rows.length === 0) {
    throw new Error(`No meter found for type: ${type}`);
  }

  const meterId = meterResult.rows[0].id;

  const result = await pool.query(
    `INSERT INTO utility_entries (user_id, meter_id, usage_amount, cost_amount, unit_price, unit, date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, meterId, usage_amount, cost_amount, unit_price, unit, date]
  );

  // Save latest unit_price for this type — now keyed by section_id
  const sectionResult = await pool.query(
    `SELECT id FROM utility_sections WHERE user_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
    [userId, sectionName]
  );

  if (sectionResult.rows.length > 0) {
    const sectionId = sectionResult.rows[0].id;
    await pool.query(
      `INSERT INTO utility_settings (user_id, section_id, unit_price)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, section_id) DO UPDATE
         SET unit_price = $3, updated_at = now()`,
      [userId, sectionId, unit_price]
    );
  }

  return { ...result.rows[0], type };
}

export async function getEntries(userId, filters = {}) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const conditions = ['e.user_id = $1'];
  const params = [userId];
  let paramIndex = 2;

  if (filters.type) {
    const sectionName = typeToSectionName(filters.type);
    conditions.push(`LOWER(s.name) = LOWER($${paramIndex})`);
    params.push(sectionName);
    paramIndex++;
  }

  if (filters.from) {
    conditions.push(`e.date >= $${paramIndex}`);
    params.push(filters.from);
    paramIndex++;
  }

  if (filters.to) {
    conditions.push(`e.date <= $${paramIndex}`);
    params.push(filters.to);
    paramIndex++;
  }

  const where = conditions.join(' AND ');

  const result = await pool.query(
    `SELECT e.*, s.name AS section_name
     FROM utility_entries e
     JOIN utility_meters m ON m.id = e.meter_id
     JOIN utility_sections s ON s.id = m.section_id
     WHERE ${where}
     ORDER BY e.date DESC`,
    params
  );

  return result.rows.map((row) => ({
    ...row,
    type: sectionNameToType(row.section_name),
  }));
}

export async function deleteEntry(userId, entryId) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const result = await pool.query(
    'DELETE FROM utility_entries WHERE id = $1 AND user_id = $2 RETURNING *',
    [entryId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Entry not found');
  }

  return result.rows[0];
}

export async function getStats(userId) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const [totalsResult, byTypeResult, monthlyResult] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*)::int AS entry_count,
         COALESCE(SUM(e.cost_amount), 0)::float AS total_cost,
         COALESCE(SUM(e.usage_amount), 0)::float AS total_usage,
         COALESCE(AVG(e.cost_amount), 0)::float AS avg_cost,
         COALESCE(AVG(e.usage_amount), 0)::float AS avg_usage,
         MIN(e.date) AS first_entry,
         MAX(e.date) AS last_entry
       FROM utility_entries e
       WHERE e.user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT
         s.name AS section_name,
         COUNT(*)::int AS entry_count,
         COALESCE(SUM(e.cost_amount), 0)::float AS total_cost,
         COALESCE(SUM(e.usage_amount), 0)::float AS total_usage,
         COALESCE(AVG(e.cost_amount), 0)::float AS avg_cost,
         COALESCE(AVG(e.usage_amount), 0)::float AS avg_usage,
         MIN(e.date) AS first_entry,
         MAX(e.date) AS last_entry
       FROM utility_entries e
       JOIN utility_meters m ON m.id = e.meter_id
       JOIN utility_sections s ON s.id = m.section_id
       WHERE e.user_id = $1
       GROUP BY s.name
       ORDER BY s.name`,
      [userId]
    ),
    pool.query(
      `SELECT
         TO_CHAR(CAST(e.date AS DATE), 'YYYY-MM') AS month,
         COUNT(*)::int AS entry_count,
         COALESCE(SUM(e.cost_amount), 0)::float AS total_cost,
         COALESCE(SUM(e.usage_amount), 0)::float AS total_usage
       FROM utility_entries e
       WHERE e.user_id = $1
       GROUP BY TO_CHAR(CAST(e.date AS DATE), 'YYYY-MM')
       ORDER BY month DESC`,
      [userId]
    ),
  ]);

  return {
    totals: totalsResult.rows[0],
    byType: byTypeResult.rows.map((row) => ({
      ...row,
      type: sectionNameToType(row.section_name),
    })),
    monthly: monthlyResult.rows,
  };
}

export async function getMonthlyTrend(userId) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const result = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN TO_CHAR(CAST(e.date AS DATE), 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM') THEN e.cost_amount ELSE 0 END), 0)::float AS current_month_total,
       COALESCE(SUM(CASE WHEN TO_CHAR(CAST(e.date AS DATE), 'YYYY-MM') = TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM') THEN e.cost_amount ELSE 0 END), 0)::float AS previous_month_total
     FROM utility_entries e
     WHERE e.user_id = $1
       AND TO_CHAR(CAST(e.date AS DATE), 'YYYY-MM') IN (
         TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
         TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM')
       )`,
    [userId]
  );

  const { current_month_total, previous_month_total } = result.rows[0];

  const trendPercent = previous_month_total === 0
    ? null
    : Math.round(((current_month_total - previous_month_total) / previous_month_total) * 10000) / 100;

  return {
    currentMonthTotal: current_month_total,
    previousMonthTotal: previous_month_total,
    trendPercent,
  };
}
