// src/app/api/auth/register/route.js

import { NextResponse } from 'next/server';
import { query, getConnection } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { signToken, buildAuthCookie } from '@/lib/jwt';

/**
 * POST /api/auth/register
 *
 * Registers a new COMPANY with its first admin user.
 *
 * Body:
 *   {
 *     companyName: string,
 *     name:        string,   ← admin user's full name
 *     email:       string,
 *     password:    string,
 *   }
 *
 * Uses a transaction — if anything fails, both inserts are rolled back.
 */
export async function POST(request) {
  let conn;
  try {
    const body = await request.json();
    const { companyName, name, email, password } = body;

    // --- Input validation ---
    const errors = {};
    if (!companyName?.trim()) errors.companyName = 'Company name is required.';
    if (!name?.trim())        errors.name        = 'Your full name is required.';
    if (!email?.trim())       errors.email       = 'Email is required.';
    if (!password)            errors.password    = 'Password is required.';
    if (password && password.length < 8)
      errors.password = 'Password must be at least 8 characters.';

    if (Object.keys(errors).length) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // --- Check if email already exists ---
    const existing = await query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );
    if (existing.length) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);

    // --- Transaction: create company + admin user ---
    conn = await getConnection();
    await conn.beginTransaction();

    const [companyResult] = await conn.execute(
      `INSERT INTO companies (name, email, plan, created_at)
       VALUES (?, ?, 'free', NOW())`,
      [companyName.trim(), normalizedEmail]
    );
    const companyId = companyResult.insertId;

    const [userResult] = await conn.execute(
      `INSERT INTO users (company_id, name, email, password, role, created_at)
       VALUES (?, ?, ?, ?, 'company_admin', NOW())`,
      [companyId, name.trim(), normalizedEmail, hashed]
    );
    const userId = userResult.insertId;

    await conn.commit();

    // --- Sign JWT and return ---
    const token = await signToken({
      userId,
      companyId,
      role:  'company_admin',
      email: normalizedEmail,
    });

    // FIX: same as login — must pass options object, not a bare boolean.
    // Register happens over the same protocol as login, so derive isSecure
    // from X-Forwarded-Proto set by nginx.
    const isSecure =
      process.env.NODE_ENV === 'production' &&
      request.headers.get('x-forwarded-proto') === 'https';

    const safeUser = {
      id:          userId,
      name:        name.trim(),
      email:       normalizedEmail,
      role:        'company_admin',
      companyId,
      companyName: companyName.trim(),
    };

    const response = NextResponse.json(
      { message: 'Registration successful.', user: safeUser },
      { status: 201 }
    );
    response.headers.set('Set-Cookie', buildAuthCookie(token, { isSecure }));
    return response;

  } catch (err) {
    if (conn) await conn.rollback();
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}