/**
 * src/config/constants.js
 *
 * Application-wide constants. All magic strings and numbers live here.
 * Import this file wherever you need a named constant.
 */

// ── App identity ──────────────────────────────────────────────────────────────
export const APP_NAME    = process.env.NEXT_PUBLIC_APP_NAME || 'Procurexio';
export const BASE_URL    = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
export const SUPPORT_EMAIL = 'support@procurexio.com';

// ── Authentication ────────────────────────────────────────────────────────────
/** JWT token expiry (seconds) */
export const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

/** Password reset token expiry (seconds) */
export const RESET_TOKEN_EXPIRY_SECONDS = 60 * 60; // 1 hour

/** Invitation token expiry (seconds) */
export const INVITE_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

/** Bcrypt work factor */
export const BCRYPT_ROUNDS = 12;

// ── Rate limiting ─────────────────────────────────────────────────────────────
/** Maximum login attempts per window */
export const AUTH_RATE_LIMIT    = 10;

/** Maximum general API requests per window */
export const API_RATE_LIMIT     = 60;

/** Rate-limit window duration (ms) */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// ── Pagination ────────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE     = 100;

// ── Notifications ─────────────────────────────────────────────────────────────
/** Polling interval for unread notification count (ms) */
export const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

// ── RFQ ───────────────────────────────────────────────────────────────────────
/** Hours before deadline to send reminder emails */
export const RFQ_REMINDER_WINDOWS_HOURS = [12, 6];

/** Maximum vendor-user email addresses to include in a single closure email */
export const MAX_VENDOR_USERS_PER_EMAIL = 5;

// ── User roles ────────────────────────────────────────────────────────────────
export const ROLES = Object.freeze({
  SUPER_ADMIN:   'super_admin',
  COMPANY_ADMIN: 'company_admin',
  MANAGER:       'manager',
  EMPLOYEE:      'employee',
  VENDOR_USER:   'vendor_user',
});
