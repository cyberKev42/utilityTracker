import { getDb } from '../db.js';

export async function getCurrency(userId) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const result = await pool.query(
    'SELECT currency FROM user_preferences WHERE user_id = $1',
    [userId]
  );

  return result.rows[0]?.currency || 'EUR';
}

export async function upsertCurrency(userId, currency) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const result = await pool.query(
    `INSERT INTO user_preferences (user_id, currency)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE
       SET currency = $2, updated_at = now()
     RETURNING *`,
    [userId, currency]
  );

  return result.rows[0];
}
