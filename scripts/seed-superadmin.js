#!/usr/bin/env node
// scripts/seed-superadmin.js
//
// Creates (or updates) the super-admin account from environment variables.
//
// Usage:
//   npm run seed:superadmin
//
// Required env vars (set in .env or .env.local):
//   SUPER_ADMIN_EMAIL    — e.g. admin@example.com
//   SUPER_ADMIN_PASSWORD — plaintext password; will be bcrypt-hashed
//
// The script is safe to re-run: it uses INSERT … ON DUPLICATE KEY UPDATE
// so existing data is only overwritten when credentials change.

'use strict';

const path = require('path');
// Load .env / .env.local before anything else
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const SUPER_ADMIN_EMAIL    = process.env.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
const SUPER_ADMIN_NAME     = process.env.SUPER_ADMIN_NAME || 'Super Admin';

if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
  console.error(
    '[seed-superadmin] ERROR: SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env or .env.local'
  );
  process.exit(1);
}

async function run() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'procurement_db',
  });

  try {
    const hash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
    const email = SUPER_ADMIN_EMAIL.trim().toLowerCase();

    await pool.execute(
      `INSERT INTO users (company_id, name, email, password, role)
       VALUES (NULL, ?, ?, ?, 'super_admin')
       ON DUPLICATE KEY UPDATE
         name     = VALUES(name),
         password = VALUES(password),
         role     = 'super_admin'`,
      [SUPER_ADMIN_NAME, email, hash]
    );

    console.log(`[seed-superadmin] Super admin seeded for: ${email}`);
  } finally {
    await pool.end();
  }
}

run().catch(err => {
  console.error('[seed-superadmin] Fatal error:', err.message);
  process.exit(1);
});
