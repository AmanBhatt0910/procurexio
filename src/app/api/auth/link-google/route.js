// src/app/api/auth/link-google/route.js
//
// GET /api/auth/link-google
//   Initiates the Google OAuth flow in "link" mode for an already-authenticated user.
//   Verifies the current session from the HttpOnly auth cookie, then redirects
//   to /api/auth/google/login?action=link which handles the rest of the flow.
//
// The /api/auth/* prefix is treated as public by the middleware (no automatic
// header injection), so this route reads and verifies the JWT from the cookie
// directly — the same approach used by /api/auth/me.

import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(request) {
  // Verify the user has an active session
  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login?error=not_authenticated', request.url));
  }

  const payload = await verifyToken(token);
  if (!payload?.userId) {
    return NextResponse.redirect(new URL('/login?error=not_authenticated', request.url));
  }

  // Hand off to the Google login endpoint with action=link
  return NextResponse.redirect(
    new URL('/api/auth/google/login?action=link', request.url)
  );
}
