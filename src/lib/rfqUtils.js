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

  // Collect all relevant vendor IDs upfront (both bidders and invited non-bidders)
  const [invitedVendors] = await pool.query(
    `SELECT rv.vendor_id, v.name AS vendor_name
       FROM rfq_vendors rv
       JOIN vendors v ON v.id = rv.vendor_id
      WHERE rv.rfq_id = ?`,
    [rfqId]
  );

  // Combine all vendor IDs so we can fetch their users in a single query
  const nonBidderVendors = invitedVendors.filter(iv => !biddedVendorIds.has(iv.vendor_id));
  const allVendorIds = [
    ...bids.map(b => b.vendor_id),
    ...nonBidderVendors.map(iv => iv.vendor_id),
  ];

  // Fetch user emails for all vendors in one query, grouped per vendor
  const vendorUserMap = new Map(); // vendor_id → string[]
  if (allVendorIds.length) {
    const placeholders = allVendorIds.map(() => '?').join(', ');
    const [userRows] = await pool.query(
      `SELECT u.vendor_id, u.email
         FROM users u
        WHERE u.vendor_id IN (${placeholders}) AND u.is_active = 1`,
      allVendorIds
    );
    for (const row of userRows) {
      if (!vendorUserMap.has(row.vendor_id)) vendorUserMap.set(row.vendor_id, []);
      const list = vendorUserMap.get(row.vendor_id);
      if (list.length < MAX_VENDOR_USERS_PER_EMAIL) list.push(row.email);
    }
  }

  // Send ranked emails to vendors who bid
  for (let i = 0; i < bids.length; i++) {
    const bid = bids[i];
    const emails = vendorUserMap.get(bid.vendor_id) || [];
    if (!emails.length) continue;
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
  for (const invited of nonBidderVendors) {
    const emails = vendorUserMap.get(invited.vendor_id) || [];
    if (!emails.length) continue;
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
