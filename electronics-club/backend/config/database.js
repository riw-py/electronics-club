const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'electronics_club',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset: 'utf8mb4'
});

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('\x1b[32m✓ MySQL connected successfully\x1b[0m');
    conn.release();
  } catch (err) {
    console.error('\x1b[31m✗ MySQL connection failed:', err.message, '\x1b[0m');
  }
})();

module.exports = pool;
