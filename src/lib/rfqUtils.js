// src/lib/rfqUtils.js
// Shared RFQ utility functions

import pool from '@/lib/db';

/**
 * If the RFQ deadline has passed and the status is still 'published',
 * automatically transition it to 'closed'.
 * This is a lightweight "check on access" approach that avoids a separate cron job.
 */
export async function autoCloseIfExpired(rfqId, companyId) {
  try {
    await pool.query(
      `UPDATE rfqs
          SET status = 'closed'
        WHERE id = ? AND company_id = ?
          AND status = 'published'
          AND deadline IS NOT NULL
          AND deadline < NOW()`,
      [rfqId, companyId]
    );
  } catch (err) {
    console.error('autoCloseIfExpired error:', err);
  }
}
