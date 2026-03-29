// src/app/api/auth/register/route.js
//
// Handles TWO registration modes:
//
//   1. INVITE MODE  — body contains { token, name, password }
//      Validates the invitation token, creates the user under the
//      invited company, marks the invitation accepted, then auto-logs
//      the user in by setting the auth cookie.
//
//   2. COMPANY MODE — body contains { companyName, name, email, password }
//      Creates a brand-new company + first company_admin. (original flow, unchanged)

import { NextResponse }          from 'next/server';
import { query, getConnection }  from '@/lib/db';
import { hashPassword }          from '@/lib/password';
import { signToken, buildAuthCookie } from '@/lib/jwt';

export async function POST(request) {
  let conn;
  try {
    const body = await request.json();

    // ── Branch: invite-based registration ─────────────────────────────────────
    if (body.token) {
      return handleInviteRegister(body, request);
    }

    // ── Branch: new-company registration (original) ────────────────────────────
    return handleCompanyRegister(body, request);

  } catch (err) {
    if (conn) await conn.rollback();
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

// ─── Invite-based registration ────────────────────────────────────────────────
async function handleInviteRegister(body, request) {
  const { token, name, password } = body;

  // Validate inputs
  const errors = {};
  if (!name?.trim())  errors.name     = 'Your full name is required.';
  if (!password)      errors.password = 'Password is required.';
  if (password && password.length < 8)
    errors.password = 'Password must be at least 8 characters.';

  if (Object.keys(errors).length) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  // Look up the invitation
  const [rows] = await (await import('@/lib/db')).default.query(
    `SELECT i.id, i.email, i.role, i.company_id, i.expires_at, i.accepted_at,
            c.name AS company_name
     FROM   invitations i
     JOIN   companies   c ON c.id = i.company_id
     WHERE  i.token = ?
     LIMIT  1`,
    [token]
  );

  if (!rows.length) {
    return NextResponse.json({ error: 'Invalid invitation link.' }, { status: 404 });
  }

  const invite = rows[0];

  if (invite.accepted_at) {
    return NextResponse.json({ error: 'This invitation has already been used.' }, { status: 410 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invitation has expired.' }, { status: 410 });
  }

  // Check the email isn't already registered (edge case: duplicate invite)
  const existing = await query(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [invite.email]
  );
  if (existing.length) {
    return NextResponse.json(
      { error: 'An account with this email already exists.' },
      { status: 409 }
    );
  }

  const hashed = await hashPassword(password);

  // Transaction: insert user + mark invitation accepted
  const pool = (await import('@/lib/db')).default;
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const [userResult] = await conn.execute(
      `INSERT INTO users (company_id, name, email, password, role, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [invite.company_id, name.trim(), invite.email, hashed, invite.role]
    );
    const userId = userResult.insertId;

    await conn.execute(
      `UPDATE invitations SET accepted_at = NOW() WHERE id = ?`,
      [invite.id]
    );

    await conn.commit();

    // Sign JWT + set cookie
    const jwtToken = await signToken({
      userId,
      companyId: invite.company_id,
      role:      invite.role,
      email:     invite.email,
    });

    const isSecure =
      process.env.NODE_ENV === 'production' &&
      request.headers.get('x-forwarded-proto') === 'https';

    const safeUser = {
      id:          userId,
      name:        name.trim(),
      email:       invite.email,
      role:        invite.role,
      companyId:   invite.company_id,
      companyName: invite.company_name,
    };

    const response = NextResponse.json(
      { message: 'Account created successfully.', user: safeUser },
      { status: 201 }
    );
    response.headers.set('Set-Cookie', buildAuthCookie(jwtToken, { isSecure }));
    return response;

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─── New-company registration (original logic, unchanged) ─────────────────────
async function handleCompanyRegister(body, request) {
  let conn;
  try {
    const { companyName, name, email, password } = body;

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

    const pool = (await import('@/lib/db')).default;
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [companyResult] = await conn.execute(
      `INSERT INTO companies (name, email, plan, created_at) VALUES (?, ?, 'free', NOW())`,
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

    const token = await signToken({
      userId,
      companyId,
      role:  'company_admin',
      email: normalizedEmail,
    });

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

  } finally {
    if (conn) conn.release();
  }
}