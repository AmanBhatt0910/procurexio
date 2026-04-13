// src/app/api/auth/logout/route.js

import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/jwt';
import pool from '@/lib/db';
import { logAction, ACTION } from '@/lib/audit';
import { logAuthEvent, getRequestIP } from '@/lib/logger';
import { validateUserContext } from '@/lib/authUtils';

/**
 * POST /api/auth/logout
 * Clears the auth cookie, invalidates active sessions, and ends the session.
 */
export async function POST(request) {
  const ip = getRequestIP(request);
  
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireUserId: true,
  });

  if (!validated.ok) {
    // Even if JWT validation fails, still try to clear the cookie
    const response = NextResponse.json({ message: 'Logged out' });
    clearAuthCookie(response);
    return response;
  }

  const { userId, email } = validated;

  // Invalidate all active sessions for this user in the DB
  if (userId) {
    try {
      await pool.execute(
        `UPDATE user_sessions
         SET    invalidated_at = NOW()
         WHERE  user_id = ? AND invalidated_at IS NULL`,
        [userId]
      );
    } catch (err) {
      console.error('[logout] session invalidation error:', err.message);
    }

    logAuthEvent('logout', { userId, ip });
    await logAction(request, {
      userId:      parseInt(userId, 10),
      userEmail:   email,
      actionType:  ACTION.LOGOUT,
      resourceType:'user',
      resourceId:  parseInt(userId, 10),
      status:      'success',
    });
  }

  const response = NextResponse.json({ message: 'Logged out.' }, { status: 200 });
  response.headers.set('Set-Cookie', clearAuthCookie({ request }));
  return response;
}
