/**
 * src/config/routes.js
 *
 * Centralised route definitions.
 * Use these constants instead of hard-coding URL strings throughout the app.
 *
 * @example
 * import { ROUTES } from '@/config/routes';
 * redirect(ROUTES.dashboard.root);
 */

export const ROUTES = Object.freeze({
  // ── Public ──────────────────────────────────────────────────────────────
  home:          '/',
  login:         '/login',
  register:      '/register',
  forgotPassword:'/forgot-password',
  resetPassword: '/reset-password',
  privacy:       '/privacy',
  terms:         '/terms',
  contact:       '/contact',

  // ── Dashboard root ───────────────────────────────────────────────────────
  dashboard: Object.freeze({
    root:      '/dashboard',
    admin:     '/dashboard/admin',
    company:   '/dashboard/company',
    users:     '/dashboard/company/users',

    // RFQs
    rfqs:      '/dashboard/rfqs',
    rfqNew:    '/dashboard/rfqs/new',
    rfq:       (id) => `/dashboard/rfqs/${id}`,
    rfqBids:   (id) => `/dashboard/rfqs/${id}/bids`,
    rfqAward:  (id) => `/dashboard/rfqs/${id}/award`,

    // Bids
    bids:      '/dashboard/bids',
    bid:       (rfqId) => `/dashboard/bids/${rfqId}`,

    // Vendors
    vendors:   '/dashboard/vendors',
    vendorNew: '/dashboard/vendors/new',
    vendor:    (id) => `/dashboard/vendors/${id}`,

    // Contracts
    contracts: '/dashboard/contracts',
    contract:  (id) => `/dashboard/contracts/${id}`,

    // Notifications
    notifications: '/dashboard/notifications',
  }),

  // ── API ──────────────────────────────────────────────────────────────────
  api: Object.freeze({
    auth: Object.freeze({
      login:          '/api/auth/login',
      logout:         '/api/auth/logout',
      me:             '/api/auth/me',
      register:       '/api/auth/register',
      forgotPassword: '/api/auth/forgot-password',
      resetPassword:  '/api/auth/reset-password',
    }),
    rfqs:          '/api/rfqs',
    rfq:           (id) => `/api/rfqs/${id}`,
    rfqBids:       (id) => `/api/rfqs/${id}/bids`,
    rfqAward:      (id) => `/api/rfqs/${id}/award`,
    notifications: '/api/notifications',
    unreadCount:   '/api/notifications/unread-count',
  }),
});
