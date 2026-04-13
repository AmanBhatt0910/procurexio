// src/config/api.js
//
// Centralized API configuration - base URLs and all API endpoints
// Use this to avoid hardcoding URLs throughout the application

// ── Base URLs ────────────────────────────────────────────────────────────

/** Base URL of the application (used for redirects, emails, etc.) */
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

// ── Authentication Endpoints ────────────────────────────────────────────

export const AUTH_ENDPOINTS = {
  ME:             '/api/auth/me',
  LOGIN:          '/api/auth/login',
  LOGOUT:         '/api/auth/logout',
  REGISTER:       '/api/auth/register',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  INVITE:         '/api/auth/invite',
  GOOGLE:         '/api/auth/google',
  LINK_GOOGLE:    '/api/auth/link-google',
};

// ── Notification Endpoints ──────────────────────────────────────────────

export const NOTIFICATION_ENDPOINTS = {
  UNREAD_COUNT:   '/api/notifications/unread-count',
  LIST:           '/api/notifications',
  MARK_READ:      '/api/notifications/mark-read',
};

// ── RFQ Endpoints ───────────────────────────────────────────────────────

export const RFQ_ENDPOINTS = {
  LIST:           '/api/rfqs',
  CREATE:         '/api/rfqs',
  GET:            (id) => `/api/rfqs/${id}`,
  UPDATE:         (id) => `/api/rfqs/${id}`,
  DELETE:         (id) => `/api/rfqs/${id}`,
};

// ── Bid Endpoints ───────────────────────────────────────────────────────

export const BID_ENDPOINTS = {
  LIST:           '/api/bids',
  CREATE:         '/api/bids',
  GET:            (id) => `/api/bids/${id}`,
  UPDATE:         (id) => `/api/bids/${id}`,
  DELETE:         (id) => `/api/bids/${id}`,
};

// ── Vendor Endpoints ────────────────────────────────────────────────────

export const VENDOR_ENDPOINTS = {
  LIST:           '/api/vendors',
  CREATE:         '/api/vendors',
  GET:            (id) => `/api/vendors/${id}`,
  UPDATE:         (id) => `/api/vendors/${id}`,
  DELETE:         (id) => `/api/vendors/${id}`,
};

// ── Company Endpoints ───────────────────────────────────────────────────

export const COMPANY_ENDPOINTS = {
  LIST:           '/api/company',
  GET:            '/api/company',
  UPDATE:         '/api/company',
};

// ── Contract Endpoints ──────────────────────────────────────────────────

export const CONTRACT_ENDPOINTS = {
  LIST:           '/api/contracts',
  CREATE:         '/api/contracts',
  GET:            (id) => `/api/contracts/${id}`,
  UPDATE:         (id) => `/api/contracts/${id}`,
  DELETE:         (id) => `/api/contracts/${id}`,
};

// ── Settings Endpoints ──────────────────────────────────────────────────

export const SETTINGS_ENDPOINTS = {
  GET:            '/api/settings',
  UPDATE:         '/api/settings',
};

// ── Files Endpoints ────────────────────────────────────────────────────

export const FILES_ENDPOINTS = {
  UPLOAD:         '/api/files/upload',
  DELETE:         (id) => `/api/files/${id}`,
};

// ── Admin Endpoints ────────────────────────────────────────────────────

export const ADMIN_ENDPOINTS = {
  DASHBOARD:      '/api/admin/dashboard',
  USERS:          '/api/admin/users',
  COMPANIES:      '/api/admin/companies',
};

// ── All public (no-auth-required) API endpoints
// Used by middleware to determine which routes skip JWT verification
export const PUBLIC_API_ROUTES = [
  AUTH_ENDPOINTS.LOGIN,
  AUTH_ENDPOINTS.FORGOT_PASSWORD,
  AUTH_ENDPOINTS.REGISTER,
  AUTH_ENDPOINTS.INVITE,
  AUTH_ENDPOINTS.GOOGLE,
  AUTH_ENDPOINTS.LINK_GOOGLE,
];

// ── Rate limit excluded routes (called frequently, e.g. on every page load)
export const RATE_LIMIT_EXCLUDED = [AUTH_ENDPOINTS.ME];
