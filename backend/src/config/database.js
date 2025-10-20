require('dotenv').config();
const { neonConfig } = require('@neondatabase/serverless');
const { Pool } = require('pg');

neonConfig.useSecureWebSocket = false;
neonConfig.pipelineConnect = false;

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
    this.writeToPrimary = false;
  }

  async query(text, params) {
    const isWriteQuery = text.trim().toUpperCase().startsWith('INSERT') || 
                         text.trim().toUpperCase().startsWith('UPDATE') || 
                         text.trim().toUpperCase().startsWith('DELETE');
    
    const targetPool = isWriteQuery 
      ? (this.writeToPrimary ? this.primary : (this.secondary || this.primary))
      : this.primary;

    try {
      const result = await targetPool.query(text, params);
      
      if (isWriteQuery) {
        console.log(`📝 Write operation to ${this.writeToPrimary ? 'PRIMARY' : 'SECONDARY'} database`);
      }
      
      return result;
    } catch (error) {
      if (isWriteQuery && this.secondary && targetPool === this.primary) {
        console.warn('⚠️ Primary database write failed, trying secondary...', error.message);
        try {
          const result = await this.secondary.query(text, params);
          console.log('✅ Successfully wrote to secondary database');
          return result;
        } catch (secondaryError) {
          console.error('❌ Both databases failed for write:', secondaryError.message);
          throw error;
        }
      } else if (isWriteQuery && this.primary && targetPool === this.secondary) {
        console.warn('⚠️ Secondary database write failed, trying primary...', error.message);
        try {
          const result = await this.primary.query(text, params);
          console.log('✅ Successfully wrote to primary database');
          return result;
        } catch (primaryError) {
          console.error('❌ Both databases failed for write:', primaryError.message);
          throw error;
        }
      }
      throw error;
    }
  }

  setWriteTarget(usePrimary) {
    this.writeToPrimary = usePrimary;
    console.log(`🔄 Write target switched to ${usePrimary ? 'PRIMARY' : 'SECONDARY'} database`);
  }

  getWriteTarget() {
    return this.writeToPrimary ? 'primary' : 'secondary';
  }

  getDatabaseStatus() {
    return {
      writeTarget: this.writeToPrimary ? 'primary' : 'secondary',
      hasPrimary: !!this.primary,
      hasSecondary: !!this.secondary,
      primaryUrl: process.env.DATABASE_URL ? '***configured***' : null,
      secondaryUrl: process.env.DATABASE_URL_SECONDARY ? '***configured***' : null
    };
  }

  async connect() {
    try {
      return await this.primary.connect();
    } catch (error) {
      if (this.secondary) {
        console.warn('⚠️ Primary database connection failed, using secondary...');
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
