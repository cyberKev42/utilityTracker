import pg from 'pg';

const { Pool } = pg;

let pool = null;

const DB_ENV_KEYS = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRESQL_URL',
  'SUPABASE_DB_URL',
  'SUPABASE_DATABASE_URL',
];

function resolveDatabaseUrl() {
  for (const key of DB_ENV_KEYS) {
    if (process.env[key]) {
      return { key, url: process.env[key] };
    }
  }
  return null;
}

export function getDatabaseEnvKey() {
  const resolved = resolveDatabaseUrl();
  return resolved ? resolved.key : null;
}

export async function connect() {
  const resolved = resolveDatabaseUrl();

  if (!resolved) {
    console.error('No supported database env var found. Checked:', DB_ENV_KEYS.join(', '));
    return null;
  }

  try {
    pool = new Pool({
      connectionString: resolved.url,
      ssl: { rejectUnauthorized: false },
    });

    await pool.query('SELECT 1');
    console.log('Database connected using', resolved.key);
    return pool;
  } catch (error) {
    console.error(`Failed to connect to database (${resolved.key}):`, error.message);
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
