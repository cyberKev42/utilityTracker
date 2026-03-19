import { getDb } from '../db.js';

export async function getAll(userId, { includeArchived = false } = {}) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const archiveFilter = includeArchived
    ? ''
    : 'AND s.archived_at IS NULL AND (m.archived_at IS NULL OR m.id IS NULL)';

  const result = await pool.query(
    `SELECT
       s.id AS section_id, s.name AS section_name, s.unit, s.icon,
       s.sort_order AS section_sort_order, s.archived_at AS section_archived_at,
       s.created_at AS section_created_at, s.updated_at AS section_updated_at,
       m.id AS meter_id, m.name AS meter_name, m.entry_mode,
       m.sort_order AS meter_sort_order, m.archived_at AS meter_archived_at
     FROM utility_sections s
     LEFT JOIN utility_meters m ON m.section_id = s.id
     WHERE s.user_id = $1
     ${includeArchived ? '' : 'AND s.archived_at IS NULL'}
     ORDER BY s.sort_order, m.sort_order`,
    [userId]
  );

  // Group meters under their sections in JS
  const sectionsMap = new Map();
  for (const row of result.rows) {
    if (!sectionsMap.has(row.section_id)) {
      sectionsMap.set(row.section_id, {
        id: row.section_id,
        name: row.section_name,
        unit: row.unit,
        icon: row.icon,
        sort_order: row.section_sort_order,
        archived_at: row.section_archived_at,
        created_at: row.section_created_at,
        updated_at: row.section_updated_at,
        meters: [],
      });
    }

    if (row.meter_id) {
      const meter = {
        id: row.meter_id,
        name: row.meter_name,
        entry_mode: row.entry_mode,
        sort_order: row.meter_sort_order,
        archived_at: row.meter_archived_at,
      };
      // Filter out archived meters unless includeArchived
      if (includeArchived || !meter.archived_at) {
        sectionsMap.get(row.section_id).meters.push(meter);
      }
    }
  }

  return Array.from(sectionsMap.values());
}

export async function create(userId, { name, unit, icon }) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const result = await pool.query(
    icon
      ? `INSERT INTO utility_sections (user_id, name, unit, icon, sort_order)
         VALUES ($1, $2, $3, $4,
           COALESCE((SELECT MAX(sort_order) + 1 FROM utility_sections WHERE user_id = $1), 0))
         RETURNING *`
      : `INSERT INTO utility_sections (user_id, name, unit, sort_order)
         VALUES ($1, $2, $3,
           COALESCE((SELECT MAX(sort_order) + 1 FROM utility_sections WHERE user_id = $1), 0))
         RETURNING *`,
    icon ? [userId, name, unit, icon] : [userId, name, unit]
  );

  return result.rows[0];
}

export async function update(userId, sectionId, { name, unit, icon }) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const result = await pool.query(
    `UPDATE utility_sections
     SET name = $3, unit = $4, icon = COALESCE($5, icon), updated_at = now()
     WHERE id = $2 AND user_id = $1
     RETURNING *`,
    [userId, sectionId, name, unit, icon || null]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function remove(userId, sectionId) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const result = await pool.query(
    'DELETE FROM utility_sections WHERE id = $1 AND user_id = $2',
    [sectionId, userId]
  );

  return result.rowCount > 0;
}

export async function archive(userId, sectionId) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sectionResult = await client.query(
      `UPDATE utility_sections
       SET archived_at = now(), updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [sectionId, userId]
    );

    if (sectionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `UPDATE utility_meters
       SET archived_at = now(), updated_at = now()
       WHERE section_id = $1`,
      [sectionId]
    );

    await client.query('COMMIT');
    return sectionResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function unarchive(userId, sectionId) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sectionResult = await client.query(
      `UPDATE utility_sections
       SET archived_at = NULL, updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [sectionId, userId]
    );

    if (sectionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `UPDATE utility_meters
       SET archived_at = NULL, updated_at = now()
       WHERE section_id = $1`,
      [sectionId]
    );

    await client.query('COMMIT');
    return sectionResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function reorder(userId, orderIds) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  await pool.query(
    `UPDATE utility_sections
     SET sort_order = updates.new_order
     FROM (
       SELECT unnest($1::uuid[]) AS id,
              generate_series(0, $2) AS new_order
     ) AS updates
     WHERE utility_sections.id = updates.id
       AND utility_sections.user_id = $3`,
    [orderIds, orderIds.length - 1, userId]
  );
}

export async function createMeter(userId, sectionId, { name }) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  // Verify section ownership
  const ownerCheck = await pool.query(
    'SELECT id FROM utility_sections WHERE id = $1 AND user_id = $2',
    [sectionId, userId]
  );
  if (ownerCheck.rows.length === 0) return null;

  const result = await pool.query(
    `INSERT INTO utility_meters (section_id, name, sort_order)
     VALUES ($1, $2,
       COALESCE((SELECT MAX(sort_order) + 1 FROM utility_meters WHERE section_id = $1), 0))
     RETURNING *`,
    [sectionId, name]
  );

  return result.rows[0];
}

export async function updateMeter(userId, meterId, { name, entry_mode }) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const setClauses = ['updated_at = now()'];
  const params = [userId, meterId];
  let idx = 3;

  if (name !== undefined) {
    setClauses.push(`name = $${idx}`);
    params.push(name);
    idx++;
  }

  if (entry_mode !== undefined) {
    if (!['usage', 'reading'].includes(entry_mode)) {
      throw Object.assign(new Error('entry_mode must be "usage" or "reading"'), { status: 400 });
    }
    setClauses.push(`entry_mode = $${idx}`);
    params.push(entry_mode);
    idx++;
  }

  const result = await pool.query(
    `UPDATE utility_meters m
     SET ${setClauses.join(', ')}
     FROM utility_sections s
     WHERE m.id = $2
       AND m.section_id = s.id
       AND s.user_id = $1
     RETURNING m.*`,
    params
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function removeMeter(userId, meterId) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const result = await pool.query(
    `DELETE FROM utility_meters m
     USING utility_sections s
     WHERE m.id = $1
       AND m.section_id = s.id
       AND s.user_id = $2`,
    [meterId, userId]
  );

  return result.rowCount > 0;
}

export async function reorderMeters(userId, sectionId, orderIds) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  // Verify section ownership
  const ownerCheck = await pool.query(
    'SELECT id FROM utility_sections WHERE id = $1 AND user_id = $2',
    [sectionId, userId]
  );
  if (ownerCheck.rows.length === 0) return false;

  await pool.query(
    `UPDATE utility_meters
     SET sort_order = updates.new_order
     FROM (
       SELECT unnest($1::uuid[]) AS id,
              generate_series(0, $2) AS new_order
     ) AS updates
     WHERE utility_meters.id = updates.id
       AND utility_meters.section_id = $3`,
    [orderIds, orderIds.length - 1, sectionId]
  );

  return true;
}

export async function getLastReading(userId, meterId) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  // Ownership check via JOIN
  const ownerCheck = await pool.query(
    `SELECT m.id FROM utility_meters m
     JOIN utility_sections s ON s.id = m.section_id
     WHERE m.id = $1 AND s.user_id = $2`,
    [meterId, userId]
  );
  if (ownerCheck.rows.length === 0) return null;

  const result = await pool.query(
    `SELECT * FROM utility_entries
     WHERE meter_id = $1
     ORDER BY date DESC, created_at DESC
     LIMIT 1`,
    [meterId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}
