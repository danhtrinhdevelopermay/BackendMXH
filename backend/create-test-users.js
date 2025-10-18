require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const primaryPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const secondaryPool = new Pool({
  connectionString: process.env.DATABASE_URL_SECONDARY,
  ssl: { rejectUnauthorized: false }
});

async function createTestUsers() {
  try {
    const password1 = await bcrypt.hash('test123', 10);
    const password2 = await bcrypt.hash('test456', 10);

    console.log('Creating test user 1 in PRIMARY database...');
    const result1 = await primaryPool.query(
      `INSERT INTO users (username, email, password_hash, full_name) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (username) DO UPDATE SET password_hash = $3
       RETURNING id, username, email`,
      ['testuser1', 'test1@example.com', password1, 'Test User 1']
    );
    console.log('✅ Created in PRIMARY:', result1.rows[0]);

    console.log('\nCreating test user 2 in SECONDARY database...');
    const result2 = await secondaryPool.query(
      `INSERT INTO users (username, email, password_hash, full_name) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (username) DO UPDATE SET password_hash = $3
       RETURNING id, username, email`,
      ['testuser2', 'test2@example.com', password2, 'Test User 2']
    );
    console.log('✅ Created in SECONDARY:', result2.rows[0]);

    console.log('\n🎉 Both test users created successfully!');
    console.log('\nYou can now login with:');
    console.log('1. Username: testuser1, Password: test123 (from PRIMARY database)');
    console.log('2. Username: testuser2, Password: test456 (from SECONDARY database)');

  } catch (error) {
    console.error('Error creating test users:', error.message);
  } finally {
    await primaryPool.end();
    await secondaryPool.end();
  }
}

createTestUsers();
