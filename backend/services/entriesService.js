import { getDb } from '../db.js';
import { randomUUID } from 'node:crypto';

/**
 * Internal helper: split a usage amount over a date range into individual daily rows.
 * Last row absorbs rounding remainder for both usage and cost.
 *
 * @param {string} startDate - 'YYYY-MM-DD'
 * @param {string} endDate   - 'YYYY-MM-DD'
 * @param {number} usageAmount
 * @param {number} unitPrice
 * @returns {{ date: string, usage_amount: number, cost_amount: number }[]}
 */
function splitIntoDailyRows(startDate, endDate, usageAmount, unitPrice) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.round((end - start) / 86400000) + 1; // inclusive

  const perDayUsage = Math.round((usageAmount / days) * 100) / 100;
  const perDayCost = Math.round((usageAmount * unitPrice / days) * 100) / 100;

  const rows = [];
  let accumulatedUsage = 0;
  let accumulatedCost = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const isLast = i === days - 1;

    const usage = isLast
      ? Math.round((usageAmount - accumulatedUsage) * 100) / 100
      : perDayUsage;

    const cost = isLast
      ? Math.round((usageAmount * unitPrice - accumulatedCost) * 100) / 100
      : perDayCost;

    accumulatedUsage += usage;
    accumulatedCost += cost;

    rows.push({
      date: date.toISOString().slice(0, 10),
      usage_amount: usage,
      cost_amount: cost,
    });
  }

  return rows;
}

/**
 * Create a new entry for a meter.
 *
 * @param {string} userId
 * @param {{ meter_id, start_date, end_date, usage_amount, meter_reading, unit_price }} params
 */
export async function createEntry(userId, {
  meter_id,
  start_date,
  end_date,
  usage_amount,
  meter_reading,
  unit_price,
}) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  // Ownership check — single JOIN query, also fetch unit for entries
  const ownerCheck = await pool.query(
    `SELECT m.id, m.entry_mode, m.section_id, s.unit
     FROM utility_meters m
     JOIN utility_sections s ON s.id = m.section_id
     WHERE m.id = $1 AND s.user_id = $2`,
    [meter_id, userId]
  );

  if (ownerCheck.rows.length === 0) {
    throw Object.assign(new Error('Meter not found'), { status: 404 });
  }

  const { entry_mode, section_id, unit } = ownerCheck.rows[0];

  // Resolve effective unit price
  let effectiveUnitPrice = unit_price;
  if (effectiveUnitPrice == null) {
    const settingsResult = await pool.query(
      `SELECT unit_price FROM utility_settings WHERE user_id = $1 AND section_id = $2`,
      [userId, section_id]
    );
    effectiveUnitPrice = settingsResult.rows.length > 0
      ? parseFloat(settingsResult.rows[0].unit_price)
      : 0;
  }

  // ----- meter_reading mode -----
  if (entry_mode === 'reading') {
    if (meter_reading == null) {
      throw Object.assign(new Error('meter_reading is required for meter_reading mode'), { status: 400 });
    }

    const prior = await pool.query(
      `SELECT meter_reading, date FROM utility_entries
       WHERE meter_id = $1
       ORDER BY date DESC, created_at DESC
       LIMIT 1`,
      [meter_id]
    );

    const is_initial = prior.rows.length === 0;
    const usageAmount = is_initial
      ? 0
      : Math.round((meter_reading - prior.rows[0].meter_reading) * 100) / 100;
    const cost_amount = Math.round(usageAmount * effectiveUnitPrice * 100) / 100;

    const result = await pool.query(
      `INSERT INTO utility_entries (user_id, meter_id, date, meter_reading, usage_amount, cost_amount, unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, meter_id, start_date, meter_reading, usageAmount, cost_amount, unit]
    );

    return { ...result.rows[0], is_initial };
  }

  // ----- usage_amount mode -----
  if (usage_amount == null) {
    throw Object.assign(new Error('usage_amount is required for usage_amount mode'), { status: 400 });
  }

  if (start_date === end_date) {
    // Single-day insert
    const cost_amount = Math.round(usage_amount * effectiveUnitPrice * 100) / 100;
    const result = await pool.query(
      `INSERT INTO utility_entries (user_id, meter_id, date, usage_amount, cost_amount, unit)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, meter_id, start_date, usage_amount, cost_amount, unit]
    );
    return result.rows[0];
  }

  // Date-range insert — split into daily rows with shared group_id
  const group_id = randomUUID();
  const dailyRows = splitIntoDailyRows(start_date, end_date, usage_amount, effectiveUnitPrice);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inserted = [];
    for (const row of dailyRows) {
      const result = await client.query(
        `INSERT INTO utility_entries (user_id, meter_id, date, usage_amount, cost_amount, group_id, unit)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, meter_id, row.date, row.usage_amount, row.cost_amount, group_id, unit]
      );
      inserted.push(result.rows[0]);
    }

    await client.query('COMMIT');
    return inserted;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Delete an entry. For meter_reading meters, recalculates next entry's delta.
 *
 * @param {string} userId
 * @param {string} entryId
 */
export async function deleteEntry(userId, entryId) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  // Fetch entry + meter mode
  const entryResult = await pool.query(
    `SELECT e.*, m.entry_mode
     FROM utility_entries e
     JOIN utility_meters m ON m.id = e.meter_id
     WHERE e.id = $1 AND e.user_id = $2`,
    [entryId, userId]
  );

  if (entryResult.rows.length === 0) {
    throw Object.assign(new Error('Entry not found'), { status: 404 });
  }

  const entry = entryResult.rows[0];

  if (entry.entry_mode === 'reading') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Find the chronologically next entry
      const nextResult = await client.query(
        `SELECT id, meter_reading FROM utility_entries
         WHERE meter_id = $1
           AND (date > $2 OR (date = $2 AND created_at > $3))
         ORDER BY date ASC, created_at ASC
         LIMIT 1`,
        [entry.meter_id, entry.date, entry.created_at]
      );

      if (nextResult.rows.length > 0) {
        const next = nextResult.rows[0];

        // Find entry immediately before the deleted one
        const beforeResult = await client.query(
          `SELECT meter_reading FROM utility_entries
           WHERE meter_id = $1
             AND (date < $2 OR (date = $2 AND created_at < $3))
           ORDER BY date DESC, created_at DESC
           LIMIT 1`,
          [entry.meter_id, entry.date, entry.created_at]
        );

        const newDelta = beforeResult.rows.length === 0
          ? 0 // next entry becomes the new first reading
          : Math.round((next.meter_reading - beforeResult.rows[0].meter_reading) * 100) / 100;

        // Look up unit_price for cost recalculation
        const settingsResult = await client.query(
          `SELECT unit_price FROM utility_settings
           WHERE user_id = $1
             AND section_id = (SELECT section_id FROM utility_meters WHERE id = $2)`,
          [userId, entry.meter_id]
        );
        const unitPrice = settingsResult.rows.length > 0
          ? parseFloat(settingsResult.rows[0].unit_price)
          : 0;

        const newCost = Math.round(newDelta * unitPrice * 100) / 100;

        await client.query(
          `UPDATE utility_entries SET usage_amount = $1, cost_amount = $2 WHERE id = $3`,
          [newDelta, newCost, next.id]
        );
      }

      await client.query(
        `DELETE FROM utility_entries WHERE id = $1 AND user_id = $2`,
        [entryId, userId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    // usage_amount mode — simple delete
    await pool.query(
      `DELETE FROM utility_entries WHERE id = $1 AND user_id = $2`,
      [entryId, userId]
    );
  }

  return { deleted: true };
}

/**
 * Get entries for a user with optional filters.
 *
 * @param {string} userId
 * @param {{ meter_id?, section_id?, year?, month?, limit?, offset? }} filters
 */
export async function getEntries(userId, filters = {}) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const conditions = ['e.user_id = $1'];
  const params = [userId];
  let paramIndex = 2;

  if (filters.meter_id) {
    conditions.push(`e.meter_id = $${paramIndex}`);
    params.push(filters.meter_id);
    paramIndex++;
  }

  if (filters.section_id) {
    conditions.push(`m.section_id = $${paramIndex}`);
    params.push(filters.section_id);
    paramIndex++;
  }

  if (filters.year) {
    conditions.push(`EXTRACT(YEAR FROM e.date) = $${paramIndex}`);
    params.push(filters.year);
    paramIndex++;
  }

  if (filters.month) {
    conditions.push(`EXTRACT(MONTH FROM e.date) = $${paramIndex}`);
    params.push(filters.month);
    paramIndex++;
  }

  const where = conditions.join(' AND ');

  let query = `
    SELECT e.*, m.name AS meter_name, s.name AS section_name, s.unit
    FROM utility_entries e
    JOIN utility_meters m ON m.id = e.meter_id
    JOIN utility_sections s ON s.id = m.section_id
    WHERE ${where}
    ORDER BY e.date DESC, e.created_at DESC`;

  if (filters.limit != null) {
    query += ` LIMIT $${paramIndex}`;
    params.push(filters.limit);
    paramIndex++;
  }

  if (filters.offset != null) {
    query += ` OFFSET $${paramIndex}`;
    params.push(filters.offset);
    paramIndex++;
  }

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get month-over-month cost trend for a user.
 * Compares current calendar month total cost to prior calendar month total cost.
 *
 * @param {string} userId
 * @returns {{ currentMonth: number, previousMonth: number, trendPercent: number|null }}
 */
export async function getMonthlyTrend(userId) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const result = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM e.date) = EXTRACT(YEAR FROM CURRENT_DATE)
                          AND EXTRACT(MONTH FROM e.date) = EXTRACT(MONTH FROM CURRENT_DATE)
                     THEN e.cost_amount ELSE 0 END), 0)::float AS current_month,
       COALESCE(SUM(CASE WHEN e.date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                          AND e.date < DATE_TRUNC('month', CURRENT_DATE)
                     THEN e.cost_amount ELSE 0 END), 0)::float AS previous_month
     FROM utility_entries e
     JOIN utility_meters m ON m.id = e.meter_id
     JOIN utility_sections s ON s.id = m.section_id
     WHERE e.user_id = $1 AND s.archived_at IS NULL`,
    [userId]
  );

  const { current_month, previous_month } = result.rows[0];

  let trendPercent = null;
  if (previous_month > 0) {
    trendPercent = Math.round(((current_month - previous_month) / previous_month) * 1000) / 10;
  }

  return { currentMonth: current_month, previousMonth: previous_month, trendPercent };
}

/**
 * Get stats aggregated by section with nested per-meter breakdown.
 *
 * @param {string} userId
 * @param {{ year?, month? }} filters
 * @returns {{ sections: Array }}
 */
export async function getStats(userId, { year, month } = {}) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  // Build optional date filter clause
  const dateParams = [userId];
  let dateFilter = '';
  let paramIndex = 2;

  if (year != null) {
    dateFilter += ` AND EXTRACT(YEAR FROM e.date) = $${paramIndex}`;
    dateParams.push(year);
    paramIndex++;
  }

  if (month != null) {
    dateFilter += ` AND EXTRACT(MONTH FROM e.date) = $${paramIndex}`;
    dateParams.push(month);
    paramIndex++;
  }

  // Section totals
  const sectionStats = await pool.query(
    `SELECT s.id, s.name, s.unit,
       COALESCE(SUM(e.usage_amount), 0)::float AS total_usage,
       COALESCE(SUM(e.cost_amount), 0)::float AS total_cost,
       COUNT(e.id)::int AS entry_count
     FROM utility_sections s
     LEFT JOIN utility_meters m ON m.section_id = s.id AND m.archived_at IS NULL
     LEFT JOIN utility_entries e ON e.meter_id = m.id${dateFilter}
     WHERE s.user_id = $1 AND s.archived_at IS NULL
     GROUP BY s.id, s.name, s.unit
     ORDER BY s.sort_order`,
    dateParams
  );

  // Meter totals
  const meterStats = await pool.query(
    `SELECT m.id, m.name, m.section_id,
       COALESCE(SUM(e.usage_amount), 0)::float AS total_usage,
       COALESCE(SUM(e.cost_amount), 0)::float AS total_cost,
       COUNT(e.id)::int AS entry_count
     FROM utility_meters m
     LEFT JOIN utility_entries e ON e.meter_id = m.id${dateFilter}
     JOIN utility_sections s ON s.id = m.section_id
     WHERE s.user_id = $1 AND m.archived_at IS NULL AND s.archived_at IS NULL
     GROUP BY m.id, m.name, m.section_id`,
    dateParams
  );

  // Merge in JavaScript
  const metersBySection = {};
  for (const row of meterStats.rows) {
    if (!metersBySection[row.section_id]) metersBySection[row.section_id] = [];
    metersBySection[row.section_id].push(row);
  }

  return {
    sections: sectionStats.rows.map((s) => ({
      ...s,
      meters: metersBySection[s.id] ?? [],
    })),
  };
}
