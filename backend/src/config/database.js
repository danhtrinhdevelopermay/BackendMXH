const { neonConfig } = require('@neondatabase/serverless');
const { Pool } = require('pg');

neonConfig.useSecureWebSocket = false;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', async (client) => {
  try {
    await client.query('SET search_path TO public');
  } catch (err) {
    console.error('Error setting search_path:', err);
  }
});

module.exports = pool;
