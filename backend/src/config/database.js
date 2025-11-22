const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const primaryPool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: true
});

let secondaryPool = null;
if (process.env.DATABASE_URL_SECONDARY) {
  secondaryPool = new Pool({ 
    connectionString: process.env.DATABASE_URL_SECONDARY,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: true
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

  async queryAll(text, params) {
    const results = await this.queryBoth(text, params);
    const allRows = [];
    
    if (results.primary && results.primary.rows) {
      allRows.push(...results.primary.rows);
    }
    
    if (results.secondary && results.secondary.rows) {
      allRows.push(...results.secondary.rows);
    }
    
    const uniqueRows = [];
    const seenIds = new Set();
    
    for (const row of allRows) {
      if (row.id && !seenIds.has(row.id)) {
        seenIds.add(row.id);
        uniqueRows.push(row);
      } else if (!row.id) {
        uniqueRows.push(row);
      }
    }
    
    if (uniqueRows.length > 0 && uniqueRows[0].created_at) {
      uniqueRows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (uniqueRows.length > 0 && uniqueRows[0].updated_at) {
      uniqueRows.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }
    
    return { rows: uniqueRows, rowCount: uniqueRows.length };
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
