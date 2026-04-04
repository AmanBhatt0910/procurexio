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

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Always allow public routes
  if (isPublic(pathname)) return NextResponse.next();

  // Get token from httpOnly cookie
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify JWT using jose (Edge-compatible)
  let decoded;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    decoded = payload;
  } catch {
    // Invalid or expired token — clear cookie and redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }

  // Check role-based access
  const routeConfig = matchProtectedRoute(pathname);
  if (routeConfig) {
    const { roles } = routeConfig;
    if (roles !== 'any' && !roles.includes(decoded.role)) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  // Forward user info as headers to API routes / server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id',    String(decoded.userId));
  requestHeaders.set('x-company-id', String(decoded.companyId ?? ''));
  requestHeaders.set('x-user-role',  decoded.role);
  requestHeaders.set('x-user-name',  decoded.name ?? '');   // ← added: used by invite email

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};