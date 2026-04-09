/**
 * src/lib/auth/index.js
 *
 * Barrel re-exports for authentication utilities.
 * Wraps jwt.js, password.js, and rbac.js into a single importable module.
 *
 * @example
 * import { signToken, verifyToken, hashPassword, checkPermission } from '@/lib/auth';
 */

export * from '../jwt';
export * from '../password';
export * from '../rbac';
