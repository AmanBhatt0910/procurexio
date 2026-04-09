/**
 * src/lib/index.js
 *
 * Top-level barrel re-exports for the lib/ module.
 *
 * Prefer domain-specific imports (e.g. '@/lib/auth', '@/lib/email') for
 * tree-shaking; use this barrel only when importing from multiple domains.
 *
 * @example
 * import { log, successResponse, timeAgo } from '@/lib';
 */

// Utilities
export * from './utils';

// Logging
export * from './logging';

// Authentication
export * from './auth';

// Security
export * from './security';

// Validation
export * from './validation';
