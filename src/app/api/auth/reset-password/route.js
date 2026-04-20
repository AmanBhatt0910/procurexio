// src/app/api/auth/reset-password/route.js
//
// POST /api/auth/reset-password
//
// Verifies a password-reset token and allows the user to set a new password.
// Token must be valid (exists, not expired, not already used).

import { query, getConnection } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { logAction, ACTION } from '@/lib/logging/audit';
import { validatePassword } from '@/lib/utils/validation';
import { logAuthEvent, getRequestIP } from '@/lib/logging/logger';

export async function POST(request) {
  const ip = getRequestIP(request);
  try {
    const body = await request.json().catch(() => ({}));
    const { token, password } = body;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return Response.json({ error: 'Reset token is required.' }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return Response.json({ error: passwordError }, { status: 400 });
    }

    // Look up the token — join user so we can update in one round-trip
    const rows = await query(
      `SELECT prt.id AS token_id, prt.user_id, prt.expires_at, prt.used_at,
              u.email, u.name, u.is_active
       FROM   password_reset_tokens prt
       JOIN   users u ON u.id = prt.user_id
       WHERE  prt.token = ?
       LIMIT  1`,
      [token.trim()]
    );

    if (!rows.length) {
      logAuthEvent('password_reset_invalid_token', { ip, reason: 'token_not_found' });
      return Response.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
    }

    const row = rows[0];

    if (row.used_at) {
      logAuthEvent('password_reset_invalid_token', { ip, reason: 'token_already_used' });
      return Response.json({ error: 'This reset link has already been used.' }, { status: 400 });
    }

    if (new Date(row.expires_at) < new Date()) {
      logAuthEvent('password_reset_invalid_token', { ip, reason: 'token_expired' });
      return Response.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 });
    }

    // Hash new password and update user, mark token used — in a transaction
    const hashed = await hashPassword(password);

    const conn = await getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, row.user_id]);
      await conn.execute(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?',
        [row.token_id]
      );
      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    logAuthEvent('password_reset_complete', { userId: row.user_id, ip });
    await logAction(request, {
      userId:      row.user_id,
      userEmail:   row.email,
      actionType:  ACTION.PASSWORD_RESET_COMPLETE,
      resourceType:'user',
      resourceId:  row.user_id,
      status:      'success',
    });

    return Response.json({ message: 'Password has been reset successfully. You can now sign in.' }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/auth/reset-password]', err.message);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// GET /api/auth/reset-password?token=xxx — validate token without consuming it
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token || token.trim().length === 0) {
    return Response.json({ valid: false, error: 'Token is required.' }, { status: 400 });
  }

  try {
    const rows = await query(
      `SELECT id, expires_at, used_at
       FROM   password_reset_tokens
       WHERE  token = ?
       LIMIT  1`,
      [token.trim()]
    );

    if (!rows.length) {
      return Response.json({ valid: false, error: 'Invalid or expired reset link.' }, { status: 200 });
    }

    const row = rows[0];
    if (row.used_at)                          return Response.json({ valid: false, error: 'This reset link has already been used.' }, { status: 200 });
    if (new Date(row.expires_at) < new Date()) return Response.json({ valid: false, error: 'This reset link has expired.' }, { status: 200 });

    return Response.json({ valid: true }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/auth/reset-password]', err.message);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
