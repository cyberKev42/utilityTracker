import { getDb } from '../db.js';

const VALID_TYPES = ['power', 'water', 'fuel'];
const YEAR_REGEX = /^\d{4}$/;
const MONTH_REGEX = /^\d{1,2}$/;

// Map from frontend type identifiers to section names in the DB
const TYPE_TO_SECTION = {
  electricity: 'Power',
  water: 'Water',
  fuel: 'Fuel',
};

function typeToSectionName(type) {
  return TYPE_TO_SECTION[type] ?? type;
}

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

    const sectionName = typeToSectionName(type);

    // Monthly breakdown for the given year
    const monthlyResult = await pool.query(
      `SELECT
         TO_CHAR(date_trunc('month', CAST(e.date AS DATE)), 'YYYY-MM') AS month,
         COALESCE(SUM(e.cost_amount), 0)::float AS total
       FROM utility_entries e
       JOIN utility_meters m ON m.id = e.meter_id
       JOIN utility_sections s ON s.id = m.section_id
       WHERE e.user_id = $1
         AND LOWER(s.name) = LOWER($2)
         AND EXTRACT(YEAR FROM CAST(e.date AS DATE)) = $3
       GROUP BY date_trunc('month', CAST(e.date AS DATE))
       ORDER BY month ASC`,
      [req.user.id, sectionName, parseInt(year, 10)]
    );

    // Daily breakdown (only if month is provided)
    let daily = [];
    if (month != null && month !== '') {
      const m = parseInt(month, 10);

      const dailyResult = await pool.query(
        `SELECT
           TO_CHAR(CAST(e.date AS DATE), 'YYYY-MM-DD') AS date,
           COALESCE(SUM(e.cost_amount), 0)::float AS total
         FROM utility_entries e
         JOIN utility_meters m ON m.id = e.meter_id
         JOIN utility_sections s ON s.id = m.section_id
         WHERE e.user_id = $1
           AND LOWER(s.name) = LOWER($2)
           AND EXTRACT(YEAR FROM CAST(e.date AS DATE)) = $3
           AND EXTRACT(MONTH FROM CAST(e.date AS DATE)) = $4
         GROUP BY CAST(e.date AS DATE)
         ORDER BY date ASC`,
        [req.user.id, sectionName, parseInt(year, 10), m]
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
