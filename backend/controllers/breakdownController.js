import { getDb } from '../db.js';

const VALID_TYPES = ['power', 'water', 'fuel'];
const YEAR_REGEX = /^\d{4}$/;
const MONTH_REGEX = /^\d{1,2}$/;

function isDbUnavailable(error) {
  return error.message === 'Database not configured' || error.message === 'Database unavailable';
}

export async function getBreakdown(req, res) {
  try {
    const { type } = req.params;
    const { year, month } = req.query;

    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Type must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    if (!year || !YEAR_REGEX.test(year)) {
      return res.status(400).json({ error: 'year is required and must be a valid 4-digit year' });
    }

    if (month != null && month !== '') {
      if (!MONTH_REGEX.test(month)) {
        return res.status(400).json({ error: 'month must be a number between 1 and 12' });
      }
      const m = parseInt(month, 10);
      if (m < 1 || m > 12) {
        return res.status(400).json({ error: 'month must be a number between 1 and 12' });
      }
    }

    const pool = getDb();
    if (!pool) throw new Error('Database not configured');

    // Monthly breakdown for the given year
    const monthlyResult = await pool.query(
      `SELECT
         TO_CHAR(date_trunc('month', CAST(date AS DATE)), 'YYYY-MM') AS month,
         COALESCE(SUM(cost_amount), 0)::float AS total
       FROM utility_entries
       WHERE user_id = $1
         AND type = $2
         AND EXTRACT(YEAR FROM CAST(date AS DATE)) = $3
       GROUP BY date_trunc('month', CAST(date AS DATE))
       ORDER BY month ASC`,
      [req.user.id, type, parseInt(year, 10)]
    );

    // Daily breakdown (only if month is provided)
    let daily = [];
    if (month != null && month !== '') {
      const m = parseInt(month, 10);
      const paddedMonth = String(m).padStart(2, '0');

      const dailyResult = await pool.query(
        `SELECT
           TO_CHAR(CAST(date AS DATE), 'YYYY-MM-DD') AS date,
           COALESCE(SUM(cost_amount), 0)::float AS total
         FROM utility_entries
         WHERE user_id = $1
           AND type = $2
           AND EXTRACT(YEAR FROM CAST(date AS DATE)) = $3
           AND EXTRACT(MONTH FROM CAST(date AS DATE)) = $4
         GROUP BY CAST(date AS DATE)
         ORDER BY date ASC`,
        [req.user.id, type, parseInt(year, 10), m]
      );

      daily = dailyResult.rows;
    }

    res.json({
      monthly: monthlyResult.rows,
      daily,
    });
  } catch (error) {
    if (isDbUnavailable(error)) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    res.status(500).json({ error: 'Failed to fetch breakdown' });
  }
}
