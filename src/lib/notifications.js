// src/lib/notifications.js
// Utility to create notifications for users. Called from API routes.

import pool from '@/lib/db';

/**
 * Insert a notification row for a single user.
 *
 * @param {object} opts
 * @param {number} opts.userId     - Recipient user id
 * @param {number} opts.companyId  - Company id (required by table FK; use 0 only for super_admin)
 * @param {string} opts.type       - Event type key e.g. 'bid_submitted'
 * @param {string} opts.title      - Short title shown in the notification list
 * @param {string} [opts.body]     - Optional longer description
 * @param {string} [opts.link]     - Optional relative URL to navigate to on click
 */
export async function createNotification({ userId, companyId, type, title, body = null, link = null }) {
  try {
    await pool.execute(
      `INSERT INTO notifications (company_id, user_id, type, title, body, link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [companyId, userId, type, title, body, link]
    );
  } catch (err) {
    // Notification failures must never break the primary operation
    console.error('[createNotification] failed:', err.message);
  }
}

/**
 * Insert notifications for multiple users in a single batch.
 * All recipients share the same type/title/body/link but are separate rows.
 *
 * @param {Array<{userId: number, companyId: number}>} recipients
 * @param {object} payload - { type, title, body?, link? }
 */
export async function createNotifications(recipients, { type, title, body = null, link = null }) {
  if (!recipients?.length) return;
  try {
    const values = recipients.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const params = recipients.flatMap(({ userId, companyId }) => [
      companyId, userId, type, title, body, link,
    ]);
    await pool.execute(
      `INSERT INTO notifications (company_id, user_id, type, title, body, link) VALUES ${values}`,
      params
    );
  } catch (err) {
    console.error('[createNotifications] failed:', err.message);
  }
}
