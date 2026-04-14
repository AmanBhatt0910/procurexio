// src/lib/rfqUtils.js
// Shared RFQ utility functions

import pool from '@/lib/db';
import { BASE_URL } from '@/config/api';
import {
  sendRFQClosedEmail,
  sendRFQDeadlineExtendedEmail,
  sendRFQDeadlineReminderEmail,
} from '@/lib/mailer';
import { getDeadlineTimeLeftMs, getEffectiveDeadlineDate } from '@/lib/deadline';

// Maximum number of user email addresses fetched per vendor when sending closure emails
const MAX_VENDOR_USERS_PER_EMAIL = 5;
const REMINDER_WINDOWS = [24, 12, 6];
const EFFECTIVE_DEADLINE_SQL_BY_COLUMN = Object.freeze({
  deadline: `(CASE WHEN TIME(deadline) = '00:00:00' THEN DATE_ADD(DATE(deadline), INTERVAL 1 DAY) ELSE deadline END)`,
  'r.deadline': `(CASE WHEN TIME(r.deadline) = '00:00:00' THEN DATE_ADD(DATE(r.deadline), INTERVAL 1 DAY) ELSE r.deadline END)`,
});
const effectiveDeadlineSql = (column = 'deadline') =>
  EFFECTIVE_DEADLINE_SQL_BY_COLUMN[column] || EFFECTIVE_DEADLINE_SQL_BY_COLUMN.deadline;

function isInReminderWindow(msUntilDeadline, hoursBefore) {
  const HOUR = 60 * 60 * 1000;
  const idx = REMINDER_WINDOWS.indexOf(hoursBefore);
  if (idx === -1) return false;
  const upper = hoursBefore * HOUR;
  const lower = idx + 1 < REMINDER_WINDOWS.length ? REMINDER_WINDOWS[idx + 1] * HOUR : 0;
  return msUntilDeadline <= upper && msUntilDeadline > lower;
}

async function getVendorRecipientsForRfq(rfqId) {
  const [invitedVendors] = await pool.query(
    `SELECT rv.vendor_id, v.name AS vendor_name, v.email AS vendor_email
       FROM rfq_vendors rv
       JOIN vendors v ON v.id = rv.vendor_id
      WHERE rv.rfq_id = ?`,
    [rfqId]
  );

  if (!invitedVendors.length) return [];

  const [userRows] = await pool.query(
    `SELECT DISTINCT u.vendor_id, u.email
       FROM users u
       JOIN rfq_vendors rv ON rv.vendor_id = u.vendor_id
      WHERE rv.rfq_id = ? AND u.is_active = 1`,
    [rfqId]
  );

  const emailMap = new Map(); // vendor_id => Set<string>
  for (const vendor of invitedVendors) {
    const emails = new Set();
    if (vendor.vendor_email) emails.add(vendor.vendor_email);
    emailMap.set(vendor.vendor_id, emails);
  }
  for (const row of userRows) {
    const emails = emailMap.get(row.vendor_id);
    if (emails) emails.add(row.email);
  }

  return invitedVendors.map(vendor => ({
    vendorId: vendor.vendor_id,
    vendorName: vendor.vendor_name,
    emails: Array.from(emailMap.get(vendor.vendor_id) || []).slice(0, MAX_VENDOR_USERS_PER_EMAIL),
  }));
}

/**
 * Close all published RFQs whose deadline has passed, across all companies
 * (or for a single company when companyId is provided).
 * Designed to be called by a scheduled cron job.
 * Returns a summary of how many RFQs were closed.
 */
export async function autoCloseAllExpired({ companyId = null } = {}) {
  const filters = [
    `status = 'published'`,
    'deadline IS NOT NULL',
    `${effectiveDeadlineSql('deadline')} < NOW()`,
  ];
  const values = [];
  if (companyId) {
    filters.push('company_id = ?');
    values.push(companyId);
  }

  // Select candidate IDs first, then update only those specific rows.
  // This avoids any time-window race conditions when identifying which
  // RFQs were newly closed by this invocation.
  const [candidates] = await pool.query(
    `SELECT id FROM rfqs WHERE ${filters.join(' AND ')}`,
    values
  );

  if (candidates.length === 0) return { closedCount: 0, emailsSent: 0, emailErrors: 0 };

  const ids = candidates.map(r => r.id);
  const placeholders = ids.map(() => '?').join(', ');

  const [result] = await pool.query(
    `UPDATE rfqs SET status = 'closed'
      WHERE id IN (${placeholders}) AND status = 'published'`,
    ids
  );

  const closedCount = result.affectedRows;
  if (closedCount === 0) return { closedCount: 0, emailsSent: 0, emailErrors: 0 };

  let emailsSent = 0;
  let emailErrors = 0;
  for (const id of ids) {
    try {
      await sendRFQClosureEmails(id);
      emailsSent += 1;
    } catch (emailErr) {
      emailErrors += 1;
      console.error(`autoCloseAllExpired: email error for rfq ${id}:`, emailErr);
    }
  }

  return { closedCount, emailsSent, emailErrors };
}

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
          AND ${effectiveDeadlineSql('deadline')} < NOW()`,
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
  const recipients = await getVendorRecipientsForRfq(rfqId);
  const recipientMap = new Map(recipients.map(r => [r.vendorId, r]));
  const biddedVendorIds = new Set(bids.map(b => b.vendor_id));
  const nonBidderVendors = recipients.filter(r => !biddedVendorIds.has(r.vendorId));

  // Send ranked emails to vendors who bid
  for (let i = 0; i < bids.length; i++) {
    const bid = bids[i];
    const recipient = recipientMap.get(bid.vendor_id);
    const emails = recipient?.emails || [];
    if (!emails.length) continue;
    try {
      await sendRFQClosedEmail({
        to:            emails,
        vendorName:    recipient?.vendorName || bid.vendor_name,
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
    const emails = invited.emails || [];
    if (!emails.length) continue;
    try {
      await sendRFQClosedEmail({
        to:            emails,
        vendorName:    invited.vendorName,
        rfqTitle:      rfq.title,
        rfqReference:  rfq.reference_number || `RFQ-${rfq.id}`,
        rank:          null,
        totalBids,
        dashboardLink: null,
      });
    } catch (err) {
      console.error(`sendRFQClosureEmails: failed for invited vendor ${invited.vendorId}:`, err.message);
    }
  }
}

/**
 * Notify all invited vendors when a published RFQ deadline is extended.
 */
export async function sendRFQDeadlineExtendedEmails(rfqId, oldDeadline, newDeadline) {

  const [rfqRows] = await pool.query(
    `SELECT id, title, reference_number FROM rfqs WHERE id = ?`,
    [rfqId]
  );
  if (!rfqRows.length) return;
  const rfq = rfqRows[0];

  const recipients = await getVendorRecipientsForRfq(rfqId);
  for (const recipient of recipients) {
    if (!recipient.emails.length) continue;
    try {
      await sendRFQDeadlineExtendedEmail({
        to: recipient.emails,
        vendorName: recipient.vendorName,
        rfqTitle: rfq.title,
        rfqReference: rfq.reference_number || `RFQ-${rfq.id}`,
        oldDeadline,
        newDeadline,
        dashboardLink: `${BASE_URL}/dashboard/bids/${rfqId}`,
      });
    } catch (err) {
      console.error(`sendRFQDeadlineExtendedEmails: failed for vendor ${recipient.vendorId}:`, err.message);
    }
  }
}

/**
 * Send due deadline reminder emails (12h and 6h windows) once per vendor+RFQ+deadline.
 */
export async function sendDueRFQDeadlineReminders({ companyId = null, rfqId = null } = {}) {
  const filters = [
    `r.status = 'published'`,
    'r.deadline IS NOT NULL',
    `${effectiveDeadlineSql('r.deadline')} > NOW()`,
  ];
  const values = [];
  if (companyId) { filters.push('r.company_id = ?'); values.push(companyId); }
  if (rfqId) { filters.push('r.id = ?'); values.push(rfqId); }

  const [rfqs] = await pool.query(
    `SELECT r.id, r.title, r.reference_number, r.deadline
       FROM rfqs r
      WHERE ${filters.join(' AND ')}`,
    values
  );

  const summary = { rfqsChecked: rfqs.length, remindersSent: 0 };

  for (const rfq of rfqs) {
    const msUntilDeadline = getDeadlineTimeLeftMs(rfq.deadline);
    if (msUntilDeadline == null || msUntilDeadline <= 0) continue;
    const deadlineDate = getEffectiveDeadlineDate(rfq.deadline);
    if (!deadlineDate) continue;

    const recipients = await getVendorRecipientsForRfq(rfq.id);
    for (const recipient of recipients) {
      if (!recipient.emails.length) continue;

      for (const hoursBefore of REMINDER_WINDOWS) {
        if (!isInReminderWindow(msUntilDeadline, hoursBefore)) continue;

        const [ins] = await pool.query(
          `INSERT IGNORE INTO rfq_deadline_reminder_logs
             (rfq_id, vendor_id, hours_before, deadline_at)
           VALUES (?, ?, ?, ?)`,
          [rfq.id, recipient.vendorId, hoursBefore, deadlineDate]
        );
        if (!ins.affectedRows) continue;

        try {
          await sendRFQDeadlineReminderEmail({
            to: recipient.emails,
            vendorName: recipient.vendorName,
            rfqTitle: rfq.title,
            rfqReference: rfq.reference_number || `RFQ-${rfq.id}`,
            hoursBefore,
            deadline: deadlineDate,
            dashboardLink: `${BASE_URL}/dashboard/bids/${rfq.id}`,
          });
          summary.remindersSent += 1;
        } catch (err) {
          console.error(`sendDueRFQDeadlineReminders: failed for vendor ${recipient.vendorId}:`, err.message);
        }
      }
    }
  }

  return summary;
}
