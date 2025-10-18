require('dotenv').config();
const { Pool } = require('pg');

// Neon database configuration (optional)
// Only use neonConfig if @neondatabase/serverless is installed
let neonConfig;
try {
  neonConfig = require('@neondatabase/serverless').neonConfig;
  if (neonConfig) {
    neonConfig.useSecureWebSocket = false;
    neonConfig.pipelineConnect = false;
    console.log('✅ Neon serverless config loaded');
  }
} catch (err) {
  console.log('ℹ️ Using standard PostgreSQL connection (Neon config not available)');
}

if (!process.env.DATABASE_URL) {
  console.error('Available environment variables:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const primaryPool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false
  }
});

let secondaryPool = null;
if (process.env.DATABASE_URL_SECONDARY) {
  secondaryPool = new Pool({ 
    connectionString: process.env.DATABASE_URL_SECONDARY,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false
    }
  });
  console.log('✅ Secondary database configured for failover');
}

primaryPool.on('error', (err) => {
  console.error('Primary database error:', err.message);
});

if (secondaryPool) {
  secondaryPool.on('error', (err) => {
    console.error('Secondary database error:', err.message);
  });
}

primaryPool.on('connect', async (client) => {
  try {
    await client.query('SET search_path TO public');
  } catch (err) {
    console.error('Error setting search_path on primary:', err);
  }
});

if (secondaryPool) {
  secondaryPool.on('connect', async (client) => {
    try {
      await client.query('SET search_path TO public');
    } catch (err) {
      console.error('Error setting search_path on secondary:', err);
    }
  });
}

class DualDatabasePool {
  constructor(primary, secondary) {
    this.primary = primary;
    this.secondary = secondary;
    this.useSecondary = false;
  }

  async query(text, params) {
    try {
      if (this.useSecondary && this.secondary) {
        return await this.secondary.query(text, params);
      }
      return await this.primary.query(text, params);
    } catch (error) {
      if (this.secondary && !this.useSecondary) {
        console.warn('⚠️ Primary database failed, switching to secondary...', error.message);
        try {
          this.useSecondary = true;
          const result = await this.secondary.query(text, params);
          console.log('✅ Successfully switched to secondary database');
          return result;
        } catch (secondaryError) {
          this.useSecondary = false;
          console.error('❌ Both databases failed:', secondaryError.message);
          throw error;
        }
      }
      throw error;
    }
  }

  async connect() {
    try {
      if (this.useSecondary && this.secondary) {
        return await this.secondary.connect();
      }
      return await this.primary.connect();
    } catch (error) {
      if (this.secondary && !this.useSecondary) {
        console.warn('⚠️ Primary database connection failed, using secondary...');
        this.useSecondary = true;
        return await this.secondary.connect();
      }
      throw error;
    }
  }

  on(event, handler) {
    this.primary.on(event, handler);
    if (this.secondary) {
      this.secondary.on(event, handler);
    }
  }

  async queryBoth(text, params) {
    const results = { primary: null, secondary: null };
    
    try {
      results.primary = await this.primary.query(text, params);
    } catch (error) {
      console.warn('⚠️ Primary database query failed:', error.message);
    }
    
    if (this.secondary) {
      try {
        results.secondary = await this.secondary.query(text, params);
      } catch (error) {
        console.warn('⚠️ Secondary database query failed:', error.message);
      }
    }
    
    return results;
  }

  async end() {
    await this.primary.end();
    if (this.secondary) {
      await this.secondary.end();
    }
  }
}

const pool = new DualDatabasePool(primaryPool, secondaryPool);

module.exports = pool;
