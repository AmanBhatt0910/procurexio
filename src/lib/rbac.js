// src/lib/rbac.js

/**
 * RBAC — Role-Based Access Control
 *
 * Roles (matches DB ENUM):
 *   super_admin    → Platform owner (you)
 *   company_admin  → Admin of a tenant company
 *   manager        → Company manager (creates RFQs, awards)
 *   employee       → Company staff (view only / limited)
 *   vendor_user    → Vendor-side user (submits bids)
 */

export const ROLES = {
  SUPER_ADMIN:   'super_admin',
  COMPANY_ADMIN: 'company_admin',
  MANAGER:       'manager',
  EMPLOYEE:      'employee',
  VENDOR_USER:   'vendor_user',
};

/**
 * Permission definitions.
 * Add new permissions here as modules are built.
 */
export const PERMISSIONS = {
  // Company management
  MANAGE_COMPANY:    'manage_company',
  VIEW_COMPANY:      'view_company',

  // Vendor management
  MANAGE_VENDORS:    'manage_vendors',
  VIEW_VENDORS:      'view_vendors',

  // RFQ
  CREATE_RFQ:        'create_rfq',
  MANAGE_RFQ:        'manage_rfq',
  VIEW_RFQ:          'view_rfq',

  // Bids
  SUBMIT_BID:        'submit_bid',
  VIEW_ALL_BIDS:     'view_all_bids',
  VIEW_OWN_BID:      'view_own_bid',

  // Awards
  AWARD_CONTRACT:    'award_contract',

  // Admin
  PLATFORM_ADMIN:    'platform_admin',
};

/**
 * Role → permissions map.
 * Each role gets a flat list of allowed permissions.
 */
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // all

  [ROLES.COMPANY_ADMIN]: [
    PERMISSIONS.MANAGE_COMPANY,
    PERMISSIONS.VIEW_COMPANY,
    PERMISSIONS.MANAGE_VENDORS,
    PERMISSIONS.VIEW_VENDORS,
    PERMISSIONS.CREATE_RFQ,
    PERMISSIONS.MANAGE_RFQ,
    PERMISSIONS.VIEW_RFQ,
    PERMISSIONS.VIEW_ALL_BIDS,
    PERMISSIONS.AWARD_CONTRACT,
  ],

  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_COMPANY,
    PERMISSIONS.MANAGE_VENDORS,
    PERMISSIONS.VIEW_VENDORS,
    PERMISSIONS.CREATE_RFQ,
    PERMISSIONS.MANAGE_RFQ,
    PERMISSIONS.VIEW_RFQ,
    PERMISSIONS.VIEW_ALL_BIDS,
    PERMISSIONS.AWARD_CONTRACT,
  ],

  [ROLES.EMPLOYEE]: [
    PERMISSIONS.VIEW_COMPANY,
    PERMISSIONS.VIEW_VENDORS,
    PERMISSIONS.VIEW_RFQ,
    PERMISSIONS.VIEW_ALL_BIDS,
    PERMISSIONS.VIEW_OWN_BID,
  ],

  [ROLES.VENDOR_USER]: [
    PERMISSIONS.VIEW_RFQ,
    PERMISSIONS.SUBMIT_BID,
    PERMISSIONS.VIEW_OWN_BID,
  ],
};

/**
 * Check if a role has a specific permission.
 * @param {string} role       - one of ROLES values
 * @param {string} permission - one of PERMISSIONS values
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(permission);
}

/**
 * Check if a role has ALL of the given permissions.
 * @param {string}   role
 * @param {string[]} permissions
 * @returns {boolean}
 */
export function hasAllPermissions(role, permissions) {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if a role has ANY of the given permissions.
 * @param {string}   role
 * @param {string[]} permissions
 * @returns {boolean}
 */
export function hasAnyPermission(role, permissions) {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Returns true if the role belongs to the company side (not vendor, not super admin).
 * Useful for tenant-scoped queries.
 * @param {string} role
 * @returns {boolean}
 */
export function isCompanyRole(role) {
  return [ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE].includes(role);
}

/**
 * Returns true if the user is a vendor.
 * @param {string} role
 * @returns {boolean}
 */
export function isVendorRole(role) {
  return role === ROLES.VENDOR_USER;
}

/**
 * Enforce that a user has at least one of the required permissions.
 * Throws error if not allowed (use inside API routes).
 *
 * @param {object} user
 * @param {string[]} requiredPermissions
 */
export function requirePermission(user, requiredPermissions = []) {
  if (!user) {
    throw new Error('Unauthorized');
  }

  const allowed = hasAnyPermission(user.role, requiredPermissions);

  if (!allowed) {
    throw new Error('Forbidden');
  }

  return true;
}

export function requireRole(role, allowedRoles = []) {
  return allowedRoles.includes(role);
}

// ------------------------------------------------------------------
// New helper function for RFQ management
// ------------------------------------------------------------------

/**
 * Check if a role can manage RFQs (create, edit, award).
 * @param {string} role
 * @returns {boolean}
 */
export function canManageRFQ(role) {
  return [ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.MANAGER].includes(role);
}