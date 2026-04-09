/**
 * src/lib/notifications/index.js
 *
 * Consolidated notification helpers for server-side use.
 *
 * This module unifies two previously separate files:
 *   - notify.js   — transaction-scoped helpers (take an explicit DB connection)
 *   - notifications.js — pool-scoped helpers (open their own connection from pool)
 *
 * Usage guidance:
 *   - Use the `conn`-based helpers inside an existing DB transaction so that
 *     notifications are rolled back if the parent operation fails.
 *   - Use the pool-based `createNotification` / `createNotifications` helpers
 *     in fire-and-forget contexts where transaction rollback is not required.
 *
 * TODO: Module 7 email stub — wire email delivery here once provider is configured.
 */

// ── Re-export transaction-scoped helpers (from notify.js) ─────────────────
export {
  createNotification          as createNotificationInTx,
  createNotificationsForRole,
  createNotificationsForRoles,
  createNotificationsForRFQVendors,
  createNotificationForVendorUser,
  notifyDeadlineApproaching,
} from '../notify';

// ── Re-export pool-scoped helpers (from notifications.js) ─────────────────
export {
  createNotification,
  createNotifications,
} from '../notifications';
