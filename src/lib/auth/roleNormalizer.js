// src/lib/roleNormalizer.js

import { ROLES } from './rbac';

/**
 * Mapping of known role string variants (lowercased) to canonical role values.
 * The canonical values match the DB ENUM and the ROLES constants in rbac.js.
 */
const ROLE_ALIAS_MAP = {
  // super_admin variants
  'super_admin':  ROLES.SUPER_ADMIN,
  'superadmin':   ROLES.SUPER_ADMIN,
  'super-admin':  ROLES.SUPER_ADMIN,

  // company_admin variants
  'company_admin':  ROLES.COMPANY_ADMIN,
  'companyadmin':   ROLES.COMPANY_ADMIN,
  'company-admin':  ROLES.COMPANY_ADMIN,
  'admin':          ROLES.COMPANY_ADMIN,

  // manager variants
  'manager': ROLES.MANAGER,

  // employee variants
  'employee': ROLES.EMPLOYEE,
  'staff':    ROLES.EMPLOYEE,
  'user':     ROLES.EMPLOYEE,

  // vendor_user variants
  'vendor_user':  ROLES.VENDOR_USER,
  'vendoruser':   ROLES.VENDOR_USER,
  'vendor-user':  ROLES.VENDOR_USER,
  'vendor':       ROLES.VENDOR_USER,
};

/**
 * Normalize a raw role string to a canonical ROLES value.
 * Returns null if the role is unrecognized.
 *
 * @param {string|null|undefined} rawRole
 * @returns {string|null}
 */
export function normalizeRole(rawRole) {
  if (!rawRole || typeof rawRole !== 'string') return null;
  const key = rawRole.trim().toLowerCase();
  return ROLE_ALIAS_MAP[key] ?? null;
}

/**
 * Returns true if the role string is a recognized, canonical role.
 * @param {string|null|undefined} role
 * @returns {boolean}
 */
export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}
