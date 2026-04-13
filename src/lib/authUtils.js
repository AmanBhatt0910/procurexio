// src/lib/authUtils.js
/**
 * Authorization utilities for validating JWT tokens and user context.
 * 
 * CRITICAL: Never trust request headers alone for authorization.
 * Always validate against the JWT token, which is cryptographically signed.
 * 
 * Usage:
 *   import { validateUserContext } from '@/lib/authUtils';
 *   
 *   const validated = await validateUserContext(request, {
 *     requireRole: ['super_admin'],
 *     requireCompanyId: true
 *   });
 *   
 *   if (!validated.ok) {
 *     return NextResponse.json({ error: validated.error }, { status: validated.status });
 *   }
 *   
 *   const { userId, role, companyId } = validated;
 */

import { jwtVerify } from 'jose';

/**
 * Validate user context by verifying JWT token.
 * Returns an object with validation result.
 * 
 * @param {Request} request - Next.js Request object
 * @param {Object} options - Validation options
 * @param {Array<string>} [options.requireRole] - Required roles (any role in array passes)
 * @param {boolean} [options.requireCompanyId] - Whether company_id is mandatory
 * @param {boolean} [options.requireUserId] - Whether user_id is mandatory (default: true)
 * @returns {Promise<{
 *   ok: boolean,
 *   error?: string,
 *   status?: number,
 *   userId?: number,
 *   role?: string,
 *   companyId?: number,
 *   email?: string
 * }>}
 */
export async function validateUserContext(request, options = {}) {
  const {
    requireRole = null,
    requireCompanyId = false,
    requireUserId = true,
  } = options;

  // 1. Extract and verify JWT token
  const token = request.cookies?.get?.('auth_token')?.value;
  if (!token) {
    return {
      ok: false,
      error: 'Unauthorized',
      status: 401,
    };
  }

  let decoded;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    decoded = payload;
  } catch (err) {
    return {
      ok: false,
      error: 'Unauthorized',
      status: 401,
    };
  }

  // 2. Validate required fields
  const userId = decoded?.userId;
  const role = decoded?.role;
  const companyId = decoded?.companyId;
  const email = decoded?.email;

  if (requireUserId && !userId) {
    return {
      ok: false,
      error: 'Unauthorized',
      status: 401,
    };
  }

  if (requireCompanyId && !companyId) {
    return {
      ok: false,
      error: 'Unauthorized',
      status: 401,
    };
  }

  // 3. Validate role if specified
  if (requireRole && !requireRole.includes(role)) {
    return {
      ok: false,
      error: 'Forbidden',
      status: 403,
    };
  }

  // 4. Cross-check against request headers (informational only)
  // These headers are set by middleware but should NOT be trusted for authorization
  const headerRole = request.headers?.get?.('x-user-role');
  const headerCompanyId = request.headers?.get?.('x-company-id');
  const headerId = request.headers?.get?.('x-user-id');

  if (headerRole && headerRole !== role) {
    console.warn('[Security] Header role mismatch detected', {
      decoded: role,
      header: headerRole,
      userId,
    });
    // Log but allow - headers might be stale
  }

  if (headerCompanyId && String(headerCompanyId) !== String(companyId || '')) {
    console.warn('[Security] Header companyId mismatch detected', {
      decoded: companyId,
      header: headerCompanyId,
      userId,
    });
    // Log but allow - headers might be stale
  }

  return {
    ok: true,
    userId: Number(userId),
    role,
    companyId: companyId ? Number(companyId) : null,
    email,
  };
}

/**
 * Require specific roles, throwing error if not authorized.
 * Wrapper around validateUserContext for handler patterns that use try-catch.
 * 
 * @param {Request} request
 * @param {Array<string>} allowedRoles
 * @param {boolean} requireCompanyId
 * @returns {Promise<{ userId, role, companyId, email }>}
 * @throws {Error} with message and status attributes
 */
export async function requireUserContext(request, allowedRoles = [], requireCompanyId = false) {
  const validated = await validateUserContext(request, {
    requireRole: allowedRoles && allowedRoles.length > 0 ? allowedRoles : null,
    requireCompanyId,
  });

  if (!validated.ok) {
    const error = new Error(validated.error);
    error.status = validated.status;
    throw error;
  }

  return validated;
}

/**
 * Validate that user owns/has access to a specific resource
 * Helper for cross-tenant security checks.
 * 
 * @param {number} resourceCompanyId - The company_id of the resource being accessed
 * @param {number} userCompanyId - The user's company_id (from JWT)
 * @param {string} userRole - The user's role (from JWT)
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateCompanyAccess(resourceCompanyId, userCompanyId, userRole) {
  // super_admin can access any company
  if (userRole === 'super_admin') {
    return { ok: true };
  }

  // All other roles must match company
  if (resourceCompanyId !== userCompanyId) {
    return {
      ok: false,
      error: 'Cross-tenant access denied',
    };
  }

  return { ok: true };
}

/**
 * Verify parameter is numeric and within valid range
 * Prevents SQL injection from non-numeric IDs
 * 
 * @param {string|number} param - URL parameter value
 * @param {number} min - Minimum value (default: 1)
 * @param {number} max - Maximum value (default: 2^31-1)
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validateNumericId(param, min = 1, max = 2147483647) {
  if (!param) {
    return { valid: false, error: 'ID is required' };
  }

  const num = Number(param);
  if (!Number.isInteger(num)) {
    return { valid: false, error: 'ID must be an integer' };
  }

  if (num < min || num > max) {
    return { valid: false, error: `ID must be between ${min} and ${max}` };
  }

  return { valid: true, value: num };
}
