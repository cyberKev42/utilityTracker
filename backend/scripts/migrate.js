import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
      return process.env[key];
    }
  }
  return null;
}

function getSqlPath(direction) {
  return path.resolve(__dirname, `../migrations/001_schema_migration.${direction}.sql`);
}

export async function runMigration(direction, connectionString) {
  if (direction !== 'up' && direction !== 'down') {
    throw new Error(`Invalid direction: "${direction}". Use "up" or "down".`);
  }

  const sqlPath = getSqlPath(direction);
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query(sql);
  } finally {
    await pool.end();
  }
}

// CLI entry point
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const direction = process.argv[2];

  if (!direction || (direction !== 'up' && direction !== 'down')) {
    console.error('Usage: node backend/scripts/migrate.js <up|down>');
    process.exit(1);
  }

  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    console.error('No database URL found. Checked:', DB_ENV_KEYS.join(', '));
    process.exit(1);
  }

  console.log(`Running migration: ${direction}`);

  runMigration(direction, connectionString)
    .then(() => {
      console.log(`Migration ${direction} completed successfully.`);
    })
    .catch((err) => {
      console.error(`Migration ${direction} failed:`, err);
      process.exit(1);
    });
}
