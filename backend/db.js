import pg from 'pg';

const { Pool } = pg;

let pool = null;

export async function connect() {
  const databaseUrl = process.env.DATABASE_URL;

  // Skip connection if no DATABASE_URL provided
  if (!databaseUrl) {
    return null;
  }

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    // Test the connection
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

// #PLACEHOLDER - Remove this function when user starts to work on his project
export async function testConnection() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return {
      connected: false,
      message: 'DATABASE_URL not configured'
    };
  }

  try {
    const testPool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    const result = await testPool.query('SELECT NOW() as current_time');
    await testPool.end();

    return {
      connected: true,
      message: `Database connected (${result.rows[0].current_time})`
    };
  } catch (error) {
    return {
      connected: false,
      message: `Database connection failed: ${error.message}`
    };
  }
}
