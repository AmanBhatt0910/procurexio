// src/app/api/auth/logout/route.js

import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/jwt';

/**
 * POST /api/auth/logout
 * Clears the auth cookie and ends the session.
 */
export async function POST() {
  const response = NextResponse.json({ message: 'Logged out.' }, { status: 200 });
  response.headers.set('Set-Cookie', clearAuthCookie());
  return response;
}