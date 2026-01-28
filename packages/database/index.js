const { Pool } = require('pg');

// Shared database connection pool
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'postgres-service',
  database: process.env.POSTGRES_DB || 'platformdb',
  password: process.env.POSTGRES_PASSWORD || 'mysecretpassword',
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database pool...');
  await pool.end();
  process.exit(0);
});

module.exports = { pool };
