// src/app/api/auth/forgot-password/route.js
//
// POST /api/auth/forgot-password
//
// Generates a new random password for the given email address, hashes it,
// updates the database, and emails the temporary password using the same
// Resend infrastructure used by other transactional emails.
//
// Returns a generic success message regardless of whether the email exists
// to prevent account enumeration.

import { query } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { sendPasswordResetEmail } from '@/lib/mailer';

/** Generate a random alphanumeric password (16 chars, mixed case + digits). */
function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const GENERIC_OK = {
  message: 'If that email is registered, a temporary password has been sent to it.',
};

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return Response.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up user — intentionally silent if not found (no enumeration)
    const rows = await query(
      'SELECT id, name, email FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (!rows.length) {
      // Return generic OK so callers cannot enumerate registered emails
      return Response.json(GENERIC_OK, { status: 200 });
    }

    const user       = rows[0];
    const tempPass   = generateTempPassword();
    const hashed     = await hashPassword(tempPass);

    // Persist the new password
    await query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);

    // Send email — fire-and-forget style; if mail fails we still return OK
    // so the user isn't confused, but we log the error server-side.
    try {
      await sendPasswordResetEmail({
        to:           user.email,
        name:         user.name || user.email.split('@')[0],
        tempPassword: tempPass,
      });
    } catch (mailErr) {
      console.error('[forgot-password] mail error:', mailErr);
    }

    return Response.json(GENERIC_OK, { status: 200 });
  } catch (err) {
    console.error('[POST /api/auth/forgot-password]', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
