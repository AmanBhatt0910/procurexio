import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, clearAuthCookie } from '@/lib/jwt';
import { query } from '@/lib/db';

/**
 * GET /api/auth/me
 *
 * Returns the currently logged-in user from the JWT cookie.
 * Used by the useAuth() hook to hydrate client state.
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Fetch fresh user data (in case role or name changed)
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.role, u.company_id,
              c.name AS company_name
       FROM   users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE  u.id = ?
       LIMIT  1`,
      [decoded.userId]
    );

    if (!rows.length) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const u = rows[0];
    return NextResponse.json({
      user: {
        id:          u.id,
        name:        u.name,
        email:       u.email,
        role:        u.role,
        companyId:   u.company_id,
        companyName: u.company_name,
      },
    });

  } catch (err) {
    console.error('[GET /api/auth/me]', err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

/**
 * POST /api/auth/logout
 *
 * Clears the auth cookie and ends the session.
 */
export async function POST() {
  const response = NextResponse.json({ message: 'Logged out.' }, { status: 200 });
  response.headers.set('Set-Cookie', clearAuthCookie());
  return response;
}