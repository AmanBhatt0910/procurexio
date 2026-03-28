// src/lib/db.js

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
 * Execute a parameterized query using prepared statements (pool.execute).
 * Safe for all queries EXCEPT those with LIMIT/OFFSET placeholders —
 * mysql2's prepared-statement path rejects integer binding for LIMIT/OFFSET
 * in many versions (ER_WRONG_ARGUMENTS).
 *
 * Usage: const rows = await query('SELECT * FROM users WHERE id = ?', [id]);
 */
export async function query(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results;
}

/**
 * Execute a query using pool.query (non-prepared, value-interpolated).
 * Use this whenever the SQL contains LIMIT or OFFSET placeholders, or
 * anytime pool.execute raises ER_WRONG_ARGUMENTS.
 *
 * Usage: const rows = await queryRaw('SELECT * FROM t LIMIT ? OFFSET ?', [10, 0]);
 */
export async function queryRaw(sql, params = []) {
  const [results] = await pool.query(sql, params);
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