import { getDb } from '../db.js';

export async function getUnitPrice(userId, type) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const result = await pool.query(
    'SELECT * FROM utility_settings WHERE user_id = $1 AND type = $2',
    [userId, type]
  );

  return result.rows[0] || null;
}

export async function upsertUnitPrice(userId, type, unitPrice) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const result = await pool.query(
    `INSERT INTO utility_settings (user_id, type, unit_price)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, type) DO UPDATE
       SET unit_price = $3, updated_at = now()
     RETURNING *`,
    [userId, type, unitPrice]
  );

  return result.rows[0];
}
