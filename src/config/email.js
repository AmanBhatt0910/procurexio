// src/config/email.js
//
// Centralized email configuration
// use this to manage all email-related settings from one place

// ── Email Provider Settings ─────────────────────────────────────────────

/** Email address to send from (e.g., 'Procurexio <no-reply@procurexio.com>') */
export const EMAIL_FROM = process.env.INVITE_FROM_EMAIL || 'Procurexio <no-reply@procurexio.com>';

/** Application name used in emails */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Procurexio';

// ── Email Subject Templates ─────────────────────────────────────────────

export const EMAIL_SUBJECTS = {
  TEAM_INVITE:        (companyName) => `You've been invited to join ${companyName} on ${APP_NAME}`,
  PASSWORD_RESET:     () => `Password Reset Request for ${APP_NAME}`,
  VENDOR_INVITE:      (companyName) => `Vendor Invitation from ${companyName}`,
  RFQ_PUBLISHED:      () => `New RFQ Available - ${APP_NAME}`,
  RFQ_CLOSED:         () => `RFQ Closed - ${APP_NAME}`,
  RFQ_DEADLINE_EXTENDED: () => `RFQ Deadline Extended - ${APP_NAME}`,
  RFQ_DEADLINE_REMINDER: () => `RFQ Deadline Reminder - ${APP_NAME}`,
  BID_RECEIVED:       () => `New Bid Received - ${APP_NAME}`,
  CONTRACT_AWARDED:   () => `Contract Awarded - ${APP_NAME}`,
};

// ── Email Polling/Retry Settings ───────────────────────────────────────

/** Default polling interval for unread notifications (in milliseconds) */
export const NOTIFICATION_POLL_INTERVAL = parseInt(process.env.NOTIFICATION_POLL_INTERVAL, 10) || 30000; // 30 seconds

/** Maximum retry attempts for email delivery */
export const EMAIL_MAX_RETRIES = parseInt(process.env.EMAIL_MAX_RETRIES, 10) || 3;

/** Delay between email retry attempts (in milliseconds) */
export const EMAIL_RETRY_DELAY = parseInt(process.env.EMAIL_RETRY_DELAY, 10) || 5000; // 5 seconds
