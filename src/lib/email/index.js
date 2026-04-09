/**
 * src/lib/email/index.js
 *
 * Barrel re-exports for all email-sending helpers.
 * Wraps the Resend-based mailer.js module.
 *
 * @example
 * import {
 *   sendInviteEmail,
 *   sendVendorInviteEmail,
 *   sendWelcomeEmail,
 *   sendPasswordResetTokenEmail,
 * } from '@/lib/email';
 */

export * from '../mailer';
