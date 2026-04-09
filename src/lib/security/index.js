/**
 * src/lib/security/index.js
 *
 * Barrel re-exports for security and rate-limiting utilities.
 * Includes request sanitization, IP helpers, and in-memory rate limiter.
 *
 * @example
 * import { sanitizeInput, rateLimit } from '@/lib/security';
 */

export * from '../security';
export * from '../rateLimit';
export * from '../roleNormalizer';
