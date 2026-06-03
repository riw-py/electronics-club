const { Pool } = require('pg');

const config = {
  host:     process.env.DB_SERVER   || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_DATABASE || 'electronics_club',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'Password123!',
};

const pool = new Pool(config);

pool.on('error', err => {
  console.error('\x1b[31m✗ PostgreSQL connection error:', err.message, '\x1b[0m');
});

pool.connect()
  .then(() => {
    console.log('\x1b[32m✓ PostgreSQL connected successfully\x1b[0m');
  })
  .catch(err => {
    console.error('\x1b[31m✗ PostgreSQL connection failed:', err.message, '\x1b[0m');
  });

/**
 * Execute a SQL query.
 * For compatibility, converts MySQL-style ? placeholders to PostgreSQL $1, $2, etc.
 * if no params are passed, it runs the query directly.
 */
const execute = async (text, params = []) => {
  let queryText = text;
  
  // Quick replace ? with $1, $2 ...
  if (params.length > 0 && queryText.includes('?')) {
    let i = 1;
    queryText = queryText.replace(/\?/g, () => `$${i++}`);
  }

  const { rows } = await pool.query(queryText, params);
  return [rows]; // Return wrapped in array to match old mssql behavior `const [rows] = await execute()`
};

/**
 * Execute an INSERT statement and return the inserted ID.
 * Expects the query to NOT have RETURNING id at the end, we will append it.
 */
const executeInsert = async (text, params = []) => {
  let queryText = text;
  
  // Quick replace ? with $1, $2 ...
  if (params.length > 0 && queryText.includes('?')) {
    let i = 1;
    queryText = queryText.replace(/\?/g, () => `$${i++}`);
  }

  // Append RETURNING id to get the inserted ID
  if (!queryText.toLowerCase().includes('returning id')) {
    queryText += ' RETURNING id';
  }

  const { rows } = await pool.query(queryText, params);
  return rows[0] ? rows[0].id : null;
};

module.exports = { pool, execute, executeInsert };
