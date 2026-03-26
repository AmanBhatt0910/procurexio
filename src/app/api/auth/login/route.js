// src/app/api/auth/login/route.js

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword } from '@/lib/password';
import { signToken, buildAuthCookie } from '@/lib/jwt';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

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
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId:    user.id,
      companyId: user.company_id,
      role:      user.role,
      email:     user.email,
    });

    // isSecure = true only when request actually arrived over HTTPS.
    // nginx sets X-Forwarded-Proto so this works correctly behind the proxy.
    const isSecure =
      process.env.NODE_ENV === 'production' &&
      request.headers.get('x-forwarded-proto') === 'https';

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

    // FIX: was buildAuthCookie(token, isSecure) — passing a boolean instead of
    // an options object, so destructuring { isSecure = false } = false silently
    // fell back to false, but the cookie still got Secure because NODE_ENV is
    // 'production'.  Always pass the options object.
    response.headers.set('Set-Cookie', buildAuthCookie(token, { isSecure }));
    return response;

  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}