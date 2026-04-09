/**
 * src/services/auth/index.js
 *
 * Authentication service — business-logic layer between API routes and lib/.
 * Composes JWT signing, password hashing, and RBAC checks into named use-cases.
 *
 * API routes should call these service functions rather than reaching into
 * lib/jwt, lib/password, and lib/rbac directly.
 */

export * from '@/lib/jwt';
export * from '@/lib/password';
export * from '@/lib/rbac';
