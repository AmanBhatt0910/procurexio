// src/app/api/auth/login/route.js

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword } from '@/lib/password';
import { signToken, buildAuthCookie } from '@/lib/jwt';

/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 *
 * - Looks up user by email
 * - Compares password
 * - Issues JWT in httpOnly cookie
 * - Returns safe user object (no password)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // --- Input validation ---
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // --- Fetch user from DB ---
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.password, u.role, u.company_id,
              c.name AS company_name
       FROM   users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE  u.email = ?
       LIMIT  1`,
      [email.toLowerCase().trim()]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // --- Compare password ---
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // --- Sign JWT ---
    const token = await signToken({
      userId:    user.id,
      companyId: user.company_id,
      role:      user.role,
      email:     user.email,
    });

    // --- Determine if the connection is secure ---
    // x-forwarded-proto is set by reverse proxies (like nginx, Vercel) to indicate original protocol.
    const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
    const isSecure = proto === 'https';

    // --- Build response with cookie ---
    const safeUser = {
      id:          user.id,
      name:        user.name,
      email:       user.email,
      role:        user.role,
      companyId:   user.company_id,
      companyName: user.company_name,
    };

    const response = NextResponse.json(
      { message: 'Login successful.', user: safeUser },
      { status: 200 }
    );

    response.headers.set('Set-Cookie', buildAuthCookie(token, isSecure));
    return response;

  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}