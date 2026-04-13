// src/config/routes.js
//
// Centralized UI routes configuration
// Use this to avoid hardcoding dashboard and app paths throughout the application

// ── Dashboard Routes ────────────────────────────────────────────────────

export const DASHBOARD_ROUTES = {
  HOME:           '/dashboard',
  ADMIN:          '/dashboard/admin',
  VENDORS:        '/dashboard/vendors',
  VENDORS_NEW:    '/dashboard/vendors/new',
  RFQS:           '/dashboard/rfqs',
  RFQS_NEW:       '/dashboard/rfqs/new',
  BIDS:           '/dashboard/bids',
  BIDS_BY_ID:     (id) => `/dashboard/bids/${id}`,
  BIDS_DETAIL:    '/dashboard/bids/[id]',
  CONTRACTS:      '/dashboard/contracts',
  COMPANY:        '/dashboard/company',
  NOTIFICATIONS:  '/dashboard/notifications',
  SETTINGS:       '/dashboard/settings',
};

// ── Auth Routes ─────────────────────────────────────────────────────────

export const AUTH_ROUTES = {
  LOGIN:          '/login',
  REGISTER:       '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
};

// ── Public Routes ───────────────────────────────────────────────────────

export const PUBLIC_ROUTES = {
  HOME:           '/',
  CONTACT:        '/contact',
  PRIVACY:        '/privacy',
  TERMS:          '/terms',
  NOT_FOUND:      '/404',
  FORBIDDEN:      '/403',
};

// ── All routes that require authentication
export const PROTECTED_ROUTES = {
  '/dashboard/bids':    { roles: ['vendor_user'] },
  '/dashboard/admin':   { roles: ['super_admin'] },
  '/dashboard/vendors': { roles: ['super_admin', 'company_admin', 'manager'] },
  '/dashboard/rfqs':    { roles: ['super_admin', 'company_admin', 'manager', 'employee'] },
  '/dashboard':         { roles: 'any' },
};

// ── Default redirect after successful login
export const DEFAULT_LOGIN_REDIRECT = DASHBOARD_ROUTES.HOME;

// ── Default redirect for unauthorized users (no dashboard access)
export const DEFAULT_UNAUTHORIZED_REDIRECT = PUBLIC_ROUTES.FORBIDDEN;
