// src/config/constants.js
//
// Central home for all runtime-tunable constants that were previously
// hardcoded in individual route files or components.
//
// All values read from environment variables with safe defaults.
// Override any value by setting the corresponding env var.

// ── Authentication / Login Security ─────────────────────────────────────────

/** Number of consecutive failed logins before an account is locked. */
export const MAX_FAILED_ATTEMPTS = parseInt(process.env.MAX_FAILED_ATTEMPTS, 10) || 5;

/** How long (in minutes) an account stays locked after too many bad passwords. */
export const LOCK_DURATION_MINUTES = parseInt(process.env.LOCK_DURATION_MINUTES, 10) || 30;

/** Minimum required password length (enforced at registration and password change). */
export const PASSWORD_MIN_LENGTH = parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 8;

/** Password reset token lifetime in hours. */
export const PASSWORD_RESET_EXPIRY_HOURS = parseInt(process.env.PASSWORD_RESET_EXPIRY_HOURS, 10) || 24;

// ── Invitations ──────────────────────────────────────────────────────────────

/** Invitation token lifetime in days. Referenced in API, JWT cookie, and email copy. */
export const INVITATION_EXPIRY_DAYS = parseInt(process.env.INVITATION_EXPIRY_DAYS, 10) || 7;

/** Derived invitation expiry in milliseconds (used in Date arithmetic). */
export const INVITATION_EXPIRY_MS = INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

/** Derived invitation expiry in seconds (used in cookie Max-Age). */
export const INVITATION_EXPIRY_SECONDS = INVITATION_EXPIRY_DAYS * 24 * 60 * 60;

// ── OAuth ────────────────────────────────────────────────────────────────────

/** Lifetime (in seconds) of the short-lived OAuth state cookie. */
export const OAUTH_STATE_EXPIRY_SECONDS = parseInt(process.env.OAUTH_STATE_EXPIRY_SECONDS, 10) || 600;

// ── Bidding ──────────────────────────────────────────────────────────────────

/**
 * Minimum amount (in the bid's currency) by which a revised bid must be
 * lower than the current submitted total.
 */
export const MIN_BID_REVISION_AMOUNT = parseFloat(process.env.MIN_BID_REVISION_AMOUNT) || 100;

// ── Evaluation ───────────────────────────────────────────────────────────────

/** Minimum valid evaluation score (inclusive). */
export const EVAL_SCORE_MIN = parseInt(process.env.EVAL_SCORE_MIN, 10) || 1;

/** Maximum valid evaluation score (inclusive). */
export const EVAL_SCORE_MAX = parseInt(process.env.EVAL_SCORE_MAX, 10) || 100;

// ── Notifications ────────────────────────────────────────────────────────────

/** How often (ms) the frontend polls for unread notification count. */
export const NOTIFICATION_POLL_MS = parseInt(process.env.NOTIFICATION_POLL_MS, 10) || 30_000;

// ── Localisation ─────────────────────────────────────────────────────────────

/**
 * Default locale tag used for Intl number/date formatting.
 * Components should prefer the authenticated user's locale when available.
 */
export const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE || 'en-US';
