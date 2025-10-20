const { neonConfig } = require('@neondatabase/serverless');
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

neonConfig.useSecureWebSocket = false;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const CONFIG_FILE = path.join(__dirname, '../../database-config.json');

class MultiDatabasePool {
  constructor() {
    this.databases = new Map();
    this.writeTargetId = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    const primaryPool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: {
        rejectUnauthorized: false
      }
    });

    primaryPool.on('error', (err) => {
      console.error('Primary database error:', err.message);
    });

    primaryPool.on('connect', async (client) => {
      try {
        await client.query('SET search_path TO public');
      } catch (err) {
        console.error('Error setting search_path on primary:', err);
      }
    });

    this.databases.set('primary', {
      id: 'primary',
      name: 'Primary Database',
      pool: primaryPool,
      connectionString: process.env.DATABASE_URL,
      isPrimary: true,
      isActive: true
    });

    if (process.env.DATABASE_URL_SECONDARY) {
      const secondaryPool = new Pool({ 
        connectionString: process.env.DATABASE_URL_SECONDARY,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: {
          rejectUnauthorized: false
        }
      });

      secondaryPool.on('error', (err) => {
        console.error('Secondary database error:', err.message);
      });

      secondaryPool.on('connect', async (client) => {
        try {
          await client.query('SET search_path TO public');
        } catch (err) {
          console.error('Error setting search_path on secondary:', err);
        }
      });

      this.databases.set('secondary', {
        id: 'secondary',
        name: 'Secondary Database',
        pool: secondaryPool,
        connectionString: process.env.DATABASE_URL_SECONDARY,
        isPrimary: false,
        isActive: true
      });

      console.log('✅ Secondary database configured for failover');
    }

    await this.loadAdditionalDatabases();
    
    this.writeTargetId = 'secondary';
    this.initialized = true;
  }

  async loadAdditionalDatabases() {
    try {
      const configData = await fs.readFile(CONFIG_FILE, 'utf8');
      const config = JSON.parse(configData);
      
      if (config.databases && Array.isArray(config.databases)) {
        for (const dbConfig of config.databases) {
          if (!this.databases.has(dbConfig.id)) {
            await this.addDatabase(dbConfig.id, dbConfig.name, dbConfig.connectionString, false);
          }
        }
        console.log(`✅ Loaded ${config.databases.length} additional database(s) from config`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading database config:', error.message);
      }
    }
  }

  async saveConfig() {
    const additionalDbs = Array.from(this.databases.values())
      .filter(db => !db.isPrimary && db.id !== 'secondary')
      .map(db => ({
        id: db.id,
        name: db.name,
        connectionString: db.connectionString,
        isActive: db.isActive
      }));

    await fs.writeFile(CONFIG_FILE, JSON.stringify({ databases: additionalDbs }, null, 2));
  }

  async addDatabase(id, name, connectionString, save = true) {
    if (this.databases.has(id)) {
      throw new Error(`Database with ID '${id}' already exists`);
    }

    const pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: {
        rejectUnauthorized: false
      }
    });

    pool.on('error', (err) => {
      console.error(`Database ${id} error:`, err.message);
    });

    pool.on('connect', async (client) => {
      try {
        await client.query('SET search_path TO public');
      } catch (err) {
        console.error(`Error setting search_path on ${id}:`, err);
      }
    });

    await pool.query('SELECT 1');

    this.databases.set(id, {
      id,
      name,
      pool,
      connectionString,
      isPrimary: false,
      isActive: true
    });

    if (save) {
      await this.saveConfig();
    }

    console.log(`✅ Database '${name}' (${id}) added successfully`);
    return true;
  }

  async removeDatabase(id) {
    if (id === 'primary' || id === 'secondary') {
      throw new Error('Cannot remove primary or secondary database');
    }

    const db = this.databases.get(id);
    if (!db) {
      throw new Error(`Database '${id}' not found`);
    }

    await db.pool.end();
    this.databases.delete(id);

    if (this.writeTargetId === id) {
      this.writeTargetId = 'primary';
    }

    await this.saveConfig();
    console.log(`✅ Database '${db.name}' (${id}) removed`);
  }

  async query(text, params) {
    const isWriteQuery = text.trim().toUpperCase().startsWith('INSERT') || 
                         text.trim().toUpperCase().startsWith('UPDATE') || 
                         text.trim().toUpperCase().startsWith('DELETE');
    
    if (isWriteQuery) {
      const writeDb = this.databases.get(this.writeTargetId);
      const targetPool = writeDb ? writeDb.pool : this.databases.get('primary').pool;
      
      try {
        const result = await targetPool.query(text, params);
        console.log(`📝 Write operation to ${writeDb ? writeDb.name.toUpperCase() : 'PRIMARY'}`);
        return result;
      } catch (error) {
        console.warn(`⚠️ Write to ${this.writeTargetId} failed, trying fallback...`, error.message);
        
        for (const [id, db] of this.databases) {
          if (id !== this.writeTargetId && db.isActive) {
            try {
              const result = await db.pool.query(text, params);
              console.log(`✅ Successfully wrote to ${db.name}`);
              return result;
            } catch (fallbackError) {
              console.warn(`Fallback to ${id} also failed:`, fallbackError.message);
            }
          }
        }
        console.error('❌ All databases failed for write operation');
        throw error;
      }
    } else {
      console.log(`📖 Reading from ALL databases (${this.databases.size} total)`);
      return await this.queryAll(text, params);
    }
  }

  setWriteTarget(targetId) {
    if (!this.databases.has(targetId)) {
      throw new Error(`Database '${targetId}' not found`);
    }
    this.writeTargetId = targetId;
    const db = this.databases.get(targetId);
    console.log(`🔄 Write target switched to ${db.name.toUpperCase()}`);
  }

  getWriteTarget() {
    return this.writeTargetId;
  }

  getDatabaseStatus() {
    const databases = Array.from(this.databases.values()).map(db => ({
      id: db.id,
      name: db.name,
      isPrimary: db.isPrimary,
      isActive: db.isActive,
      isWriteTarget: db.id === this.writeTargetId,
      hasConnection: !!db.connectionString
    }));

    return {
      writeTarget: this.writeTargetId,
      databases,
      totalDatabases: this.databases.size
    };
  }

  async connect() {
    const primaryDb = this.databases.get('primary');
    if (!primaryDb) {
      throw new Error('Primary database not configured');
    }
    
    try {
      return await primaryDb.pool.connect();
    } catch (error) {
      for (const [id, db] of this.databases) {
        if (id !== 'primary' && db.isActive) {
          try {
            console.warn(`⚠️ Primary database connection failed, using ${db.name}...`);
            return await db.pool.connect();
          } catch (fallbackError) {
            continue;
          }
        }
      }
      throw error;
    }
  }

  on(event, handler) {
    for (const db of this.databases.values()) {
      db.pool.on(event, handler);
    }
  }

  async queryBoth(text, params) {
    const results = {};
    
    for (const [id, db] of this.databases) {
      if (db.isActive) {
        try {
          results[id] = await db.pool.query(text, params);
        } catch (error) {
          console.warn(`⚠️ ${db.name} query failed:`, error.message);
          results[id] = null;
        }
      }
    }
    
    return results;
  }

  async queryAll(text, params) {
    const results = await this.queryBoth(text, params);
    const allRows = [];
    
    for (const [id, result] of Object.entries(results)) {
      if (result && result.rows) {
        allRows.push(...result.rows);
      }
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
    for (const db of this.databases.values()) {
      await db.pool.end();
    }
  }

  async exportSchema() {
    const primaryDb = this.databases.get('primary');
    if (!primaryDb) {
      throw new Error('Primary database not available');
    }

    const schemaPath = path.join(__dirname, '../../schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    return schema;
  }

  async pushSchemaToDatabase(targetId) {
    const targetDb = this.databases.get(targetId);
    if (!targetDb) {
      throw new Error(`Database '${targetId}' not found`);
    }

    const schema = await this.exportSchema();
    
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📤 Pushing schema to ${targetDb.name}...`);
    let successCount = 0;
    
    for (const statement of statements) {
      try {
        await targetDb.pool.query(statement);
        successCount++;
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.warn(`Warning while executing schema statement:`, error.message);
        }
      }
    }

    console.log(`✅ Schema pushed to ${targetDb.name} (${successCount} statements executed)`);
    return true;
  }
}

const pool = new MultiDatabasePool();

pool.initialize().catch(err => {
  console.error('Failed to initialize database pool:', err);
  process.exit(1);
});

module.exports = pool;
