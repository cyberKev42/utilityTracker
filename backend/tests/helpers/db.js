import pg from 'pg';
const { Pool } = pg;

let pool = null;

export function getTestDb() {
  if (!pool) {
    const url = process.env.TEST_DATABASE_URL;
    if (!url) {
      throw new Error('TEST_DATABASE_URL environment variable is required for integration tests');
    }
    pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function closeTestDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
