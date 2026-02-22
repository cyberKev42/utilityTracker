import pg from 'pg';

const { Pool } = pg;

let pool = null;

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
