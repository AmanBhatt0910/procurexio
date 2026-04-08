// src/lib/rfqUtils.js
// Shared RFQ utility functions

import pool from '@/lib/db';
import { sendRFQClosedEmail } from '@/lib/mailer';

// Maximum number of user email addresses fetched per vendor when sending closure emails
const MAX_VENDOR_USERS_PER_EMAIL = 5;

/**
 * If the RFQ deadline has passed and the status is still 'published',
 * automatically transition it to 'closed' and notify vendors.
 * This is a lightweight "check on access" approach that avoids a separate cron job.
 */
export async function autoCloseIfExpired(rfqId, companyId) {
  try {
    const [result] = await pool.query(
      `UPDATE rfqs
          SET status = 'closed'
        WHERE id = ? AND company_id = ?
          AND status = 'published'
          AND deadline IS NOT NULL
          AND deadline < NOW()`,
      [rfqId, companyId]
    );

    // Only send notifications if an actual row was updated
    if (result.affectedRows > 0) {
      try {
        await sendRFQClosureEmails(rfqId);
      } catch (emailErr) {
        console.error('autoCloseIfExpired: email error:', emailErr);
      }
    }
  } catch (err) {
    console.error('autoCloseIfExpired error:', err);
  }
}

/**
 * Fetch all relevant vendors for a closed RFQ and send them closure emails
 * with their bid ranking.
 */
export async function sendRFQClosureEmails(rfqId) {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

  // Fetch RFQ details
  const [rfqRows] = await pool.query(
    `SELECT id, title, reference_number FROM rfqs WHERE id = ?`,
    [rfqId]
  );
  if (!rfqRows.length) return;
  const rfq = rfqRows[0];

  // Fetch all submitted bids ordered by total_amount ASC (rank 1 = lowest price)
  const [bids] = await pool.query(
    `SELECT b.id, b.vendor_id, b.total_amount,
            v.name AS vendor_name, v.email AS vendor_email
       FROM bids b
       JOIN vendors v ON v.id = b.vendor_id
      WHERE b.rfq_id = ? AND b.status NOT IN ('draft','withdrawn')
      ORDER BY b.total_amount ASC`,
    [rfqId]
  );

  const totalBids = bids.length;
  const biddedVendorIds = new Set(bids.map(b => b.vendor_id));

  // Send ranked emails to vendors who bid
  for (let i = 0; i < bids.length; i++) {
    const bid = bids[i];
    // Each vendor may have multiple users — fetch the primary user email
    const [vendorUsers] = await pool.query(
      `SELECT u.email FROM users u WHERE u.vendor_id = ? AND u.is_active = 1 LIMIT ?`,
      [bid.vendor_id, MAX_VENDOR_USERS_PER_EMAIL]
    );
    if (!vendorUsers.length) continue;

    const emails = vendorUsers.map(u => u.email);
    try {
      await sendRFQClosedEmail({
        to:            emails,
        vendorName:    bid.vendor_name,
        rfqTitle:      rfq.title,
        rfqReference:  rfq.reference_number || `RFQ-${rfq.id}`,
        rank:          i + 1,
        totalBids,
        dashboardLink: `${BASE_URL}/dashboard/bids/${rfqId}`,
      });
    } catch (err) {
      console.error(`sendRFQClosureEmails: failed for vendor ${bid.vendor_id}:`, err.message);
    }
  }

  // Send emails to invited vendors who did NOT bid
  const [invitedVendors] = await pool.query(
    `SELECT rv.vendor_id, v.name AS vendor_name
       FROM rfq_vendors rv
       JOIN vendors v ON v.id = rv.vendor_id
      WHERE rv.rfq_id = ?`,
    [rfqId]
  );

  for (const invited of invitedVendors) {
    if (biddedVendorIds.has(invited.vendor_id)) continue; // already handled above

    const [vendorUsers] = await pool.query(
      `SELECT u.email FROM users u WHERE u.vendor_id = ? AND u.is_active = 1 LIMIT ?`,
      [invited.vendor_id, MAX_VENDOR_USERS_PER_EMAIL]
    );
    if (!vendorUsers.length) continue;

    const emails = vendorUsers.map(u => u.email);
    try {
      await sendRFQClosedEmail({
        to:            emails,
        vendorName:    invited.vendor_name,
        rfqTitle:      rfq.title,
        rfqReference:  rfq.reference_number || `RFQ-${rfq.id}`,
        rank:          null,
        totalBids,
        dashboardLink: null,
      });
    } catch (err) {
      console.error(`sendRFQClosureEmails: failed for invited vendor ${invited.vendor_id}:`, err.message);
    }
  }
}
