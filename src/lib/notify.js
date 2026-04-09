/**
 * src/lib/notify.js
 * Server-side notification helpers.
 * Always called with an existing DB connection (inside a transaction)
 * so notifications are rolled back if the parent transaction fails.
 *
 * TODO: Module 7 email stub — wire email delivery here once email provider is configured.
 * Each function has a clearly marked stub comment for the email hook.
 */

import pool from '@/lib/db';
import { checkLimit } from '@/lib/subscription';

/**
 * Check email/notification limit for a company before inserting.
 * Returns false (and logs a warning) when the limit has been reached.
 * Non-fatal — never throws.
 *
 * @param {number|string} companyId
 * @returns {Promise<boolean>} true = allowed, false = limit reached
 */
async function isEmailAllowed(companyId) {
  try {
    const { allowed } = await checkLimit(companyId, 'email');
    return allowed;
  } catch {
    return true; // Non-fatal — allow on error
  }
}

/**
 * Create a single notification for one user.
 *
 * @param {import('mysql2/promise').PoolConnection} conn  - active DB connection
 * @param {{ companyId, userId, type, title, body?, link? }} opts
 */
export async function createNotification(conn, { companyId, userId, type, title, body = null, link = null }) {
  if (!(await isEmailAllowed(companyId))) {
    console.warn(`[notify] email limit reached for company ${companyId} — notification skipped`);
    return;
  }

  await conn.execute(
    `INSERT INTO notifications (company_id, user_id, type, title, body, link)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [companyId, userId, type, title, body, link]
  );

  // TODO: Module 7 email stub
  // await sendNotificationEmail({ userId, type, title, body, link });
}

/**
 * Create notifications for all users of a given role within a company.
 * Bulk-inserts in one query for efficiency.
 *
 * @param {import('mysql2/promise').PoolConnection} conn
 * @param {{ companyId, role, type, title, body?, link? }} opts
 */
export async function createNotificationsForRole(conn, { companyId, role, type, title, body = null, link = null }) {
  const [users] = await conn.execute(
    `SELECT id FROM users WHERE company_id = ? AND role = ?`,
    [companyId, role]
  );

  if (!users.length) return;

  const values = users.map(u => [companyId, u.id, type, title, body, link]);
  await conn.query(
    `INSERT INTO notifications (company_id, user_id, type, title, body, link) VALUES ?`,
    [values]
  );

  // TODO: Module 7 email stub
  // for (const u of users) await sendNotificationEmail({ userId: u.id, type, title, body, link });
}

/**
 * Create notifications for multiple specific roles (e.g. company_admin + manager).
 *
 * @param {import('mysql2/promise').PoolConnection} conn
 * @param {{ companyId, roles: string[], type, title, body?, link? }} opts
 */
export async function createNotificationsForRoles(conn, { companyId, roles, type, title, body = null, link = null }) {
  if (!roles.length) return;

  const placeholders = roles.map(() => '?').join(', ');
  const [users] = await conn.execute(
    `SELECT id FROM users WHERE company_id = ? AND role IN (${placeholders})`,
    [companyId, ...roles]
  );

  if (!users.length) return;

  const values = users.map(u => [companyId, u.id, type, title, body, link]);
  await conn.query(
    `INSERT INTO notifications (company_id, user_id, type, title, body, link) VALUES ?`,
    [values]
  );

  // TODO: Module 7 email stub
  // for (const u of users) await sendNotificationEmail({ userId: u.id, type, title, body, link });
}

/**
 * Create notifications for all vendor_user accounts that are invited to an RFQ.
 * Finds vendor_users in the same company whose email matches any rfq_vendor entry.
 *
 * @param {import('mysql2/promise').PoolConnection} conn
 * @param {{ companyId, rfqId, type, title, body?, link? }} opts
 */
export async function createNotificationsForRFQVendors(conn, { companyId, rfqId, type, title, body = null, link = null }) {
  // Find all vendor_user accounts that belong to vendors invited to this RFQ
  const [users] = await conn.execute(
    `SELECT DISTINCT u.id
     FROM users u
     INNER JOIN vendors v ON v.company_id = u.company_id AND v.email = u.email
     INNER JOIN rfq_vendors rv ON rv.vendor_id = v.id AND rv.rfq_id = ?
     WHERE u.company_id = ? AND u.role = 'vendor_user'`,
    [rfqId, companyId]
  );

  if (!users.length) return;

  const values = users.map(u => [companyId, u.id, type, title, body, link]);
  await conn.query(
    `INSERT INTO notifications (company_id, user_id, type, title, body, link) VALUES ?`,
    [values]
  );

  // TODO: Module 7 email stub
}

/**
 * Create a notification for the vendor_user whose vendor was awarded/affected.
 *
 * @param {import('mysql2/promise').PoolConnection} conn
 * @param {{ companyId, vendorId, type, title, body?, link? }} opts
 */
export async function createNotificationForVendorUser(conn, { companyId, vendorId, type, title, body = null, link = null }) {
  const [vendor] = await conn.execute(
    `SELECT email FROM vendors WHERE id = ? AND company_id = ?`,
    [vendorId, companyId]
  );

  if (!vendor.length) return;

  const [users] = await conn.execute(
    `SELECT id FROM users WHERE company_id = ? AND role = 'vendor_user' AND email = ?`,
    [companyId, vendor[0].email]
  );

  if (!users.length) return;

  const values = users.map(u => [companyId, u.id, type, title, body, link]);
  await conn.query(
    `INSERT INTO notifications (company_id, user_id, type, title, body, link) VALUES ?`,
    [values]
  );

  // TODO: Module 7 email stub
}

/**
 * STUB: rfq_deadline_approaching notifications.
 * No cron wiring yet — call manually or wire to a cron job in a future module.
 *
 * @param {import('mysql2/promise').PoolConnection} conn
 * @param {{ companyId, rfqId, rfqTitle, deadline, link? }} opts
 */
export async function notifyDeadlineApproaching(conn, { companyId, rfqId, rfqTitle, deadline, link = null }) {
  // Find vendor_users with an invite but no submitted bid
  const [users] = await conn.execute(
    `SELECT DISTINCT u.id
     FROM users u
     INNER JOIN vendors v ON v.company_id = u.company_id AND v.email = u.email
     INNER JOIN rfq_vendors rv ON rv.vendor_id = v.id AND rv.rfq_id = ?
     LEFT JOIN bids b ON b.rfq_id = ? AND b.vendor_id = v.id AND b.status = 'submitted'
     WHERE u.company_id = ? AND u.role = 'vendor_user' AND b.id IS NULL`,
    [rfqId, rfqId, companyId]
  );

  if (!users.length) return;

  const deadlineStr = new Date(deadline).toLocaleDateString();
  const values = users.map(u => [
    companyId,
    u.id,
    'rfq_deadline_approaching',
    `Deadline approaching: ${rfqTitle}`,
    `Your bid for "${rfqTitle}" is due by ${deadlineStr}. Don't miss it.`,
    link,
  ]);

  await conn.query(
    `INSERT INTO notifications (company_id, user_id, type, title, body, link) VALUES ?`,
    [values]
  );

  // TODO: Module 7 email stub + cron wiring
}