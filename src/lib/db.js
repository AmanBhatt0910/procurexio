import mysql from 'mysql2/promise';

// Single shared connection pool for the entire app
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'procurement_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

/**
 * Execute a parameterized query.
 * Usage:  const [rows] = await query('SELECT * FROM users WHERE id = ?', [id]);
 */
export async function query(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results;
}

/**
 * Get a raw connection for transactions.
 * Remember to conn.release() when done.
 */
export async function getConnection() {
  return pool.getConnection();
}

export default pool;