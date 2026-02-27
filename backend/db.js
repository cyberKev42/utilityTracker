import pg from 'pg';

const { Pool } = pg;

let pool = null;

let dbStatus = 'not_configured';
let dbErrorCode = null;
let dbErrorMessage = null;
let dbErrorHint = null;

const DB_ENV_KEYS = [
  'DB_URL_OVERRIDE',
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

function sanitizeUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || 5432}`;
  } catch {
    return '(unparseable)';
  }
}

export function getDatabaseEnvKey() {
  const resolved = resolveDatabaseUrl();
  return resolved ? resolved.key : null;
}

export function getDiagnostics() {
  return { dbStatus, dbErrorCode, dbErrorMessage, dbErrorHint };
}

export async function connect() {
  const resolved = resolveDatabaseUrl();

  if (!resolved) {
    dbStatus = 'not_configured';
    console.error('No supported database env var found. Checked:', DB_ENV_KEYS.join(', '));
    return null;
  }

  console.log(`Database env: ${resolved.key} -> ${sanitizeUrl(resolved.url)}`);

  try {
    pool = new Pool({
      connectionString: resolved.url,
      ssl: { rejectUnauthorized: false },
    });

    await pool.query('SELECT 1');
    dbStatus = 'connected';
    dbErrorCode = null;
    dbErrorMessage = null;
    dbErrorHint = null;
    console.log('Database connected using', resolved.key);
    return pool;
  } catch (error) {
    pool = null;
    dbStatus = 'connection_failed';
    dbErrorCode = error.code || null;
    dbErrorMessage = error.message || 'Unknown connection error';

    if (error.code === 'ENETUNREACH' && resolved.url.includes('[')) {
      dbErrorHint = 'Database host appears unreachable (likely IPv6 route issue). Use provider IPv4/pooler URL instead (commonly port 6543 for Supabase pooler).';
    } else if (error.code === 'ENETUNREACH') {
      dbErrorHint = 'Database host unreachable from runtime. Check if the URL is correct and the database is online.';
    } else if (error.code === 'ENOTFOUND') {
      dbErrorHint = 'Database hostname not found. The Supabase project may be paused or the URL is incorrect.';
    } else if (error.code === 'ECONNREFUSED') {
      dbErrorHint = 'Connection refused. The database server may be down or the port is wrong.';
    } else {
      dbErrorHint = null;
    }

    console.error(`Failed to connect (${resolved.key}): [${dbErrorCode}] ${dbErrorMessage}`);
    if (dbErrorHint) console.error('Hint:', dbErrorHint);
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
