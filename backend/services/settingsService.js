import { getDb } from '../db.js';

// Map from frontend type identifiers to section names in the DB
const TYPE_TO_SECTION = {
  electricity: 'Power',
  water: 'Water',
  fuel: 'Fuel',
};

function typeToSectionName(type) {
  return TYPE_TO_SECTION[type] ?? type;
}

export async function getUnitPrice(userId, type) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const sectionName = typeToSectionName(type);

  const result = await pool.query(
    `SELECT us.*
     FROM utility_settings us
     JOIN utility_sections s ON s.id = us.section_id
     WHERE us.user_id = $1 AND LOWER(s.name) = LOWER($2)`,
    [userId, sectionName]
  );

  return result.rows[0] || null;
}

export async function upsertUnitPrice(userId, type, unitPrice) {
  const pool = getDb();
  if (!pool) throw new Error('Database not configured');

  const sectionName = typeToSectionName(type);

  // Look up section_id for this user + type
  const sectionResult = await pool.query(
    `SELECT id FROM utility_sections WHERE user_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
    [userId, sectionName]
  );

  if (sectionResult.rows.length === 0) {
    throw new Error(`No section found for type: ${type}`);
  }

  const sectionId = sectionResult.rows[0].id;

  const result = await pool.query(
    `INSERT INTO utility_settings (user_id, section_id, unit_price)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, section_id) DO UPDATE
       SET unit_price = $3, updated_at = now()
     RETURNING *`,
    [userId, sectionId, unitPrice]
  );

  return result.rows[0];
}
