import { getDb } from '../db.js';

export async function createEntry(userId, entryData) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const { type, usage_amount, cost_amount, unit_price, unit, date } = entryData;

  const result = await pool.query(
    `INSERT INTO utility_entries (user_id, type, usage_amount, cost_amount, unit_price, unit, date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, type, usage_amount, cost_amount, unit_price, unit, date]
  );

  // Save latest unit_price for this type so it auto-fills next time
  await pool.query(
    `INSERT INTO utility_settings (user_id, type, unit_price)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, type) DO UPDATE
       SET unit_price = $3, updated_at = now()`,
    [userId, type, unit_price]
  );

  return result.rows[0];
}

export async function getEntries(userId, filters = {}) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const conditions = ['user_id = $1'];
  const params = [userId];
  let paramIndex = 2;

  if (filters.type) {
    conditions.push(`type = $${paramIndex}`);
    params.push(filters.type);
    paramIndex++;
  }

  if (filters.from) {
    conditions.push(`date >= $${paramIndex}`);
    params.push(filters.from);
    paramIndex++;
  }

  if (filters.to) {
    conditions.push(`date <= $${paramIndex}`);
    params.push(filters.to);
    paramIndex++;
  }

  const where = conditions.join(' AND ');

  const result = await pool.query(
    `SELECT * FROM utility_entries WHERE ${where} ORDER BY date DESC`,
    params
  );

  return result.rows;
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
         COALESCE(SUM(cost_amount), 0)::float AS total_cost,
         COALESCE(SUM(usage_amount), 0)::float AS total_usage,
         COALESCE(AVG(cost_amount), 0)::float AS avg_cost,
         COALESCE(AVG(usage_amount), 0)::float AS avg_usage,
         MIN(date) AS first_entry,
         MAX(date) AS last_entry
       FROM utility_entries
       WHERE user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT
         type,
         COUNT(*)::int AS entry_count,
         COALESCE(SUM(cost_amount), 0)::float AS total_cost,
         COALESCE(SUM(usage_amount), 0)::float AS total_usage,
         COALESCE(AVG(cost_amount), 0)::float AS avg_cost,
         COALESCE(AVG(usage_amount), 0)::float AS avg_usage,
         MIN(date) AS first_entry,
         MAX(date) AS last_entry
       FROM utility_entries
       WHERE user_id = $1
       GROUP BY type
       ORDER BY type`,
      [userId]
    ),
    pool.query(
      `SELECT
         TO_CHAR(CAST(date AS DATE), 'YYYY-MM') AS month,
         COUNT(*)::int AS entry_count,
         COALESCE(SUM(cost_amount), 0)::float AS total_cost,
         COALESCE(SUM(usage_amount), 0)::float AS total_usage
       FROM utility_entries
       WHERE user_id = $1
       GROUP BY TO_CHAR(CAST(date AS DATE), 'YYYY-MM')
       ORDER BY month DESC`,
      [userId]
    ),
  ]);

  return {
    totals: totalsResult.rows[0],
    byType: byTypeResult.rows,
    monthly: monthlyResult.rows,
  };
}
