// src/middleware.js

import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * IMPORTANT: This file must live at the PROJECT ROOT (next to package.json).
 * NOT inside /src — Next.js only looks for middleware.js at the root or src/ root.
 *
 * Also: Next.js middleware runs on the Edge Runtime.
 * The 'jsonwebtoken' package does NOT work in Edge Runtime.
 * We use 'jose' instead — it's fully Edge-compatible.
 *
 * Install: npm install jose
 */

// ── Rate limiting ────────────────────────────────────────────────────────────
// In-memory sliding-window rate limiter.
// Works correctly for single-server (Node.js) deployments.
// For multi-instance / serverless deployments, replace this store with
// a shared Redis/Upstash client so limits are enforced globally.

const _rlStore = new Map();
let   _rlCleanupCounter = 0;

/** Remove expired entries from the rate-limit store. */
function _rlMaybeCleanup() {
  _rlCleanupCounter += 1;
  if (_rlCleanupCounter < 500) return;
  _rlCleanupCounter = 0;
  const now = Date.now();
  for (const [k, v] of _rlStore) {
    if (v.resetAt <= now) _rlStore.delete(k);
  }
}

/**
 * Evaluate rate-limit for the given (key, max, windowMs).
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
function _rlCheck(key, max, windowMs) {
  _rlMaybeCleanup();
  const now   = Date.now();
  const entry = _rlStore.get(key);

  if (!entry || entry.resetAt <= now) {
    _rlStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  entry.count += 1;
  if (entry.count > max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

/** Extract client IP (handles reverse-proxy X-Forwarded-For). */
function _getIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Rate-limit configuration.
 * auth:    stricter limit for login / register / forgot-password / invite
 * user:    per-user limit for authenticated general API requests
 * ip:      per-IP fallback limit for unauthenticated general API requests
 */
const RATE_LIMIT_CONFIGS = {
  auth: { max: 10,   windowMs: 60_000 },   // 10   req / min  (auth-sensitive mutations)
  user: { max: 1000, windowMs: 60_000 },   // 1000 req / min  (per authenticated user)
  ip:   { max: 60,   windowMs: 60_000 },   // 60   req / min  (unauthenticated fallback)
};

/** Path prefixes that receive the stricter auth rate limit. */
const AUTH_RATE_PATHS = [
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/register',
  '/api/auth/invite',
  '/api/auth/google',      // Google OAuth login, callback, and link endpoints
  '/api/auth/link-google', // Link-Google redirect endpoint
];

/**
 * Paths excluded from rate limiting entirely.
 * /api/auth/me is a lightweight session check called on every page mount —
 * it must not be throttled by the strict auth limit.
 */
const RATE_LIMIT_EXCLUDED = ['/api/auth/me'];

/** Build a 429 NextResponse with standard rate-limit headers. */
function _rateLimitResponse(result, max) {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  return new NextResponse(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type':          'application/json',
        'Retry-After':           String(retryAfter),
        'X-RateLimit-Limit':     String(max),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset':     String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}

/**
 * Apply rate limiting to an API request.
 *
 * - Auth mutation endpoints (login, register, …): strict per-IP limit.
 * - Authenticated general API requests: per-user limit (higher cap).
 * - Unauthenticated general API requests: per-IP fallback limit.
 * - /api/auth/me: excluded (session check, called on every page load).
 *
 * Returns a 429 NextResponse if the limit is exceeded, otherwise null.
 */
async function applyRateLimit(request) {
  const { pathname } = request.nextUrl;
  const ip           = _getIP(request);

  // Paths explicitly excluded from rate limiting
  if (RATE_LIMIT_EXCLUDED.some(p => pathname.startsWith(p))) return null;

  // Auth mutation endpoints: strict per-IP limit
  if (AUTH_RATE_PATHS.some(p => pathname.startsWith(p))) {
    const cfg    = RATE_LIMIT_CONFIGS.auth;
    const result = _rlCheck(`auth:${ip}`, cfg.max, cfg.windowMs);
    return result.allowed ? null : _rateLimitResponse(result, cfg.max);
  }

  // General API: prefer per-user rate limiting for authenticated requests
  const token = request.cookies.get('auth_token')?.value;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      if (payload.userId) {
        const cfg    = RATE_LIMIT_CONFIGS.user;
        const result = _rlCheck(`user:${payload.userId}`, cfg.max, cfg.windowMs);
        return result.allowed ? null : _rateLimitResponse(result, cfg.max);
      }
    } catch {
      // Invalid / expired token — fall through to IP-based limiting
    }
  }

  // Unauthenticated API requests: per-IP fallback
  const cfg    = RATE_LIMIT_CONFIGS.ip;
  const result = _rlCheck(`ip:${ip}`, cfg.max, cfg.windowMs);
  return result.allowed ? null : _rateLimitResponse(result, cfg.max);
}

// ── Route protection ─────────────────────────────────────────────────────────

/**
 * Route protection rules.
 * prefix → { roles: string[] | 'any' }
 */
const PROTECTED_ROUTES = {
  '/dashboard/bids':    { roles: ['vendor_user'] },
  '/dashboard/admin':   { roles: ['super_admin'] },
  '/dashboard/vendors': { roles: ['super_admin', 'company_admin', 'manager'] },
  '/dashboard/rfqs':    { roles: ['super_admin', 'company_admin', 'manager', 'employee'] },
  '/dashboard':         { roles: 'any' },
  '/rfq':               { roles: ['super_admin', 'company_admin', 'manager', 'employee'] },
  '/vendors':           { roles: ['super_admin', 'company_admin', 'manager'] },
  '/admin':             { roles: ['super_admin'] },
  '/vendor-portal':     { roles: ['vendor_user'] },
};

const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/_next',
  '/favicon',
  '/403',
];

// Routes that are public with exact pathname matching
const PUBLIC_EXACT = ['/'];

function isPublic(pathname) {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function matchProtectedRoute(pathname) {
  for (const [prefix, config] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(prefix)) return config;
  }
  return null;
}

// ── Security headers ─────────────────────────────────────────────────────────

/**
 * Apply security headers to a response.
 * Works for both NextResponse.next() and NextResponse.redirect().
 */
function applySecurityHeaders(response) {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Referrer policy — avoid leaking full URL in cross-origin requests
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Restrict browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  // Content Security Policy
  // - default-src 'self': allow same-origin resources by default
  // - script-src includes 'unsafe-inline' and 'unsafe-eval': required by Next.js for
  //   server-side hydration scripts and dynamic code evaluation. Nonce-based CSP is not
  //   yet supported by the Next.js App Router in all configurations. The auth cookie
  //   (HttpOnly) and CSRF-resistant token-in-cookie approach provide complementary
  //   XSS protection.
  // - style-src includes 'unsafe-inline' for CSS-in-JS (inline <style>)
  // - img-src includes data: for base64 images
  // - connect-src allows the app to call its own API
  // - font-src allows Google Fonts
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  // HSTS — only set over HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
  return response;
}

// ── Middleware entry point ───────────────────────────────────────────────────

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.includes('google')
  ) {
    return NextResponse.next();
  }

  // ── 1. Rate limiting (applies to all /api/* requests, including public auth routes)
  if (pathname.startsWith('/api/')) {
    const limited = await applyRateLimit(request);
    if (limited) return applySecurityHeaders(limited);
  }

  // ── 2. Handle public routes
  // For the login page specifically: if the user already has a valid token,
  // redirect them straight to the dashboard so they don't land on the login
  // form and get sent straight back into a redirect loop.
  if (isPublic(pathname)) {
    if (pathname.startsWith('/login')) {
      const token = request.cookies.get('auth_token')?.value;
      if (token) {
        try {
          const secret = new TextEncoder().encode(process.env.JWT_SECRET);
          await jwtVerify(token, secret);
          // Valid token — send authenticated user away from login page
          const redirectTo =
            request.nextUrl.searchParams.get('redirect') || '/dashboard';
          // Only allow relative redirects to prevent open-redirect attacks
          const safeDest = redirectTo.startsWith('/') ? redirectTo : '/dashboard';
          return applySecurityHeaders(
            NextResponse.redirect(new URL(safeDest, request.url))
          );
        } catch {
          // Invalid / expired token — clear it and show login form normally
          const res = applySecurityHeaders(NextResponse.next());
          res.cookies.delete('auth_token');
          return res;
        }
      }
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // ── 3. Require authentication for everything else
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // API routes must get a JSON 401 — not a browser redirect
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ));
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // ── 4. Verify JWT using jose (Edge-compatible)
  let decoded;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    decoded = payload;
  } catch {
    // Invalid or expired token
    if (pathname.startsWith('/api/')) {
      const res = applySecurityHeaders(new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ));
      res.cookies.delete('auth_token');
      return res;
    }
    const response = applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
    response.cookies.delete('auth_token');
    return response;
  }

  // ── 5. Role-based access control (page routes only — API routes enforce their own RBAC)
  if (!pathname.startsWith('/api/')) {
    const routeConfig = matchProtectedRoute(pathname);
    if (routeConfig) {
      const { roles } = routeConfig;
      if (roles !== 'any' && !roles.includes(decoded.role)) {
        return applySecurityHeaders(NextResponse.redirect(new URL('/403', request.url)));
      }
    }
  }

  // ── 6. Forward verified user info as request headers
  //    These values come from the server-validated JWT, not from the client.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id',    String(decoded.userId));
  requestHeaders.set('x-company-id', String(decoded.companyId ?? ''));
  requestHeaders.set('x-user-role',  decoded.role);
  requestHeaders.set('x-user-name',  decoded.name ?? '');

  return applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
};