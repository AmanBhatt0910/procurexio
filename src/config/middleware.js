// src/config/middleware.js
//
// Centralized middleware configuration
// Shared constants and rules for authentication and authorization

import { AUTH_ENDPOINTS } from './api';
import { PROTECTED_ROUTES } from './routes';

// ── Public Auth Endpoints (no JWT verification required) ────────────────

export const PUBLIC_AUTH_ENDPOINTS = [
  AUTH_ENDPOINTS.LOGIN,
  AUTH_ENDPOINTS.FORGOT_PASSWORD,
  AUTH_ENDPOINTS.REGISTER,
  AUTH_ENDPOINTS.INVITE,
  AUTH_ENDPOINTS.GOOGLE,
  AUTH_ENDPOINTS.LINK_GOOGLE,
];

// ── Public Pages (accessible without authentication) ────────────────────

export const PUBLIC_PAGES = [
  '/',
  '/contact',
  '/privacy',
  '/terms',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/403',
  '/404',
];

// ── Rate Limiting Configuration ─────────────────────────────────────────

/** Maximum requests per window before rate limiting kicks in */
export const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100;

/** Rate limit window duration (in milliseconds) */
export const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000; // 1 minute

/** Routes that are excluded from rate limiting (e.g., frequently called endpoints) */
export const RATE_LIMIT_EXCLUDED_ROUTES = [
  AUTH_ENDPOINTS.ME, // Called on every page load for session verification
];

// ── JWT / Session Configuration ─────────────────────────────────────────

/** JWT secret key for signing and verifying tokens */
export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'demo-secret-key-change-in-production'
);

/** JWT token expiry time (in seconds) */
export const JWT_EXPIRY_SECONDS = parseInt(process.env.JWT_EXPIRY_SECONDS, 10) || 7 * 24 * 60 * 60; // 7 days

/** Cookie name for storing JWT token */
export const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'auth-token';

// ── Route Protection Rules ──────────────────────────────────────────────

/** Routes that require authentication, mapped with required roles */
export const PROTECTED_ROUTES_CONFIG = PROTECTED_ROUTES;

// ── Error Pages ─────────────────────────────────────────────────────────

export const ERROR_PAGES = {
  NOT_FOUND: '/404',
  FORBIDDEN: '/403',
  UNAUTHORIZED: '/login',
};

// ── Default Redirects ───────────────────────────────────────────────────

/** Default redirect after successful login */
export const DEFAULT_POST_LOGIN_REDIRECT = '/dashboard';

/** Default redirect when accessing protected route without auth */
export const DEFAULT_UNAUTHORIZED_REDIRECT = '/login';

/** Default redirect after logout */
export const DEFAULT_POST_LOGOUT_REDIRECT = '/login';
