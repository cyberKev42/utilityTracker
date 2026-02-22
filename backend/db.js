import pg from 'pg';

const { Pool } = pg;

let pool = null;

async function initializeSchema() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS utility_entries (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('electricity', 'water', 'fuel')),
      usage_amount NUMERIC NOT NULL,
      cost_amount NUMERIC NOT NULL,
      unit VARCHAR(20) NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_utility_entries_user_id ON utility_entries(user_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_utility_entries_user_date ON utility_entries(user_id, date DESC)
  `);
}

export async function connect() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return null;
  }

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    });

    await pool.query('SELECT 1');
    await initializeSchema();
    return pool;
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    return null;
  }
}

export function getDb() {
  return pool;
}

export async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
