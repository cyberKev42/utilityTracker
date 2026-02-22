import { getDb } from '../db.js';

export async function createEntry(userId, entryData) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const { type, usage_amount, cost_amount, unit, date } = entryData;

  const result = await pool.query(
    `INSERT INTO utility_entries (user_id, type, usage_amount, cost_amount, unit, date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, type, usage_amount, cost_amount, unit, date]
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

  const result = await pool.query(
    `SELECT
       type,
       COUNT(*)::int as entry_count,
       SUM(usage_amount)::float as total_usage,
       SUM(cost_amount)::float as total_cost,
       AVG(usage_amount)::float as avg_usage,
       AVG(cost_amount)::float as avg_cost,
       MIN(date) as first_entry,
       MAX(date) as last_entry
     FROM utility_entries
     WHERE user_id = $1
     GROUP BY type`,
    [userId]
  );

  return result.rows;
}
