// src/app/api/auth/forgot-password/route.js
//
// POST /api/auth/forgot-password
//
// Generates a cryptographically secure reset token, stores it in the
// password_reset_tokens table, and emails a reset link.
//
// Returns a generic success message regardless of whether the email exists
// to prevent account enumeration.

import { query } from '@/lib/db';
import { sendPasswordResetTokenEmail } from '@/lib/mailer';
import { generatePasswordResetToken, expiresInHours, toMySQLDatetime } from '@/lib/security';
import { logAction, ACTION } from '@/lib/audit';
import { validateEmail } from '@/lib/validation';
import { PASSWORD_RESET_EXPIRY_HOURS } from '@/config/constants';
import { logAuthEvent, getRequestIP } from '@/lib/logger';

const GENERIC_OK = {
  message: 'If that email is registered, a password reset link has been sent to it.',
};

export async function POST(request) {
  const ip = getRequestIP(request);
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    const emailError = validateEmail(email);
    if (emailError) {
      return Response.json({ error: emailError }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    logAuthEvent('password_reset_request', { ip });

    // Look up user — intentionally silent if not found (no enumeration)
    const rows = await query(
      'SELECT id, name, email FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (!rows.length) {
      // Return generic OK so callers cannot enumerate registered emails
      return Response.json(GENERIC_OK, { status: 200 });
    }

    const user = rows[0];

    // Invalidate any existing unused tokens for this user
    await query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE user_id = ? AND used_at IS NULL`,
      [user.id]
    );

    // Generate a new secure token
    const token     = generatePasswordResetToken();
    const expiresAt = toMySQLDatetime(expiresInHours(PASSWORD_RESET_EXPIRY_HOURS));

    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES (?, ?, ?)`,
      [user.id, token, expiresAt]
    );

    // Send email — fire-and-forget style; if mail fails we still return OK
    // so the user isn't confused, but we log the error server-side.
    try {
      await sendPasswordResetTokenEmail({
        to:    user.email,
        name:  user.name || user.email.split('@')[0],
        token,
      });
      logAuthEvent('password_reset_sent', { userId: user.id, ip });
      await logAction(request, {
        userId:      user.id,
        userEmail:   user.email,
        actionType:  ACTION.PASSWORD_RESET_SENT,
        resourceType:'user',
        resourceId:  user.id,
        status:      'success',
      });
    } catch (mailErr) {
      console.error('[forgot-password] mail error:', mailErr.message);
      await logAction(request, {
        userId:      user.id,
        userEmail:   user.email,
        actionType:  ACTION.PASSWORD_RESET_SENT,
        resourceType:'user',
        resourceId:  user.id,
        status:      'failure',
        statusReason: mailErr.message,
      });
    }

    return Response.json(GENERIC_OK, { status: 200 });
  } catch (err) {
    console.error('[POST /api/auth/forgot-password]', err.message);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
