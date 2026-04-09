/**
 * src/services/notification/index.js
 *
 * Notification service — business-logic layer for creating and managing
 * in-app notifications. Delegates to lib/notifications for DB writes.
 *
 * Naming note:
 *  - `createNotification` / `createNotifications` — pool-scoped (fire-and-forget)
 *  - `createNotificationInTx` and role-based helpers — transaction-scoped (from notify.js)
 */

// Pool-scoped helpers (fire-and-forget, use the shared connection pool)
export { createNotification, createNotifications } from '@/lib/notifications';

// Transaction-scoped helpers (must be called with an active DB connection)
export {
  createNotification          as createNotificationInTx,
  createNotificationsForRole,
  createNotificationsForRoles,
  createNotificationsForRFQVendors,
  createNotificationForVendorUser,
  notifyDeadlineApproaching,
} from '@/lib/notify';
