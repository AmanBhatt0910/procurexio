// src/app/api/company/invite/route.js
import pool               from '@/lib/db';
import { sendInviteEmail } from '@/lib/mailer';
import crypto             from 'crypto';

const ALLOWED_ROLES = ['company_admin', 'manager', 'employee', 'vendor_user'];

export async function POST(request) {
  const companyId  = request.headers.get('x-company-id');
  const role       = request.headers.get('x-user-role');
  const inviterName = request.headers.get('x-user-name') || 'A team member';

  if (!companyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!['super_admin', 'company_admin'].includes(role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { email, role: inviteRole } = body;

  if (!email || !inviteRole) {
    return Response.json({ error: 'email and role are required' }, { status: 400 });
  }
  if (!ALLOWED_ROLES.includes(inviteRole)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 1. Check if user already exists in this company
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND company_id = ?',
      [normalizedEmail, companyId]
    );
    if (existing.length) {
      return Response.json({ error: 'User already exists in this company' }, { status: 409 });
    }

    // 2. Look for an existing, non‑expired pending invitation
    const [pendingInvite] = await pool.query(
      `SELECT id, token FROM invitations
       WHERE email = ? AND company_id = ? AND accepted_at IS NULL AND expires_at > NOW()`,
      [normalizedEmail, companyId]
    );

    let token;
    let expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (pendingInvite.length) {
      // Update existing invitation
      token = crypto.randomBytes(32).toString('hex');
      await pool.query(
        `UPDATE invitations
         SET token = ?, expires_at = ?, role = ?
         WHERE id = ?`,
        [token, expiresAt, inviteRole, pendingInvite[0].id]
      );
    } else {
      // Create new invitation
      token = crypto.randomBytes(32).toString('hex');
      await pool.query(
        `INSERT INTO invitations (company_id, email, role, token, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
        [companyId, normalizedEmail, inviteRole, token, expiresAt]
      );
    }

    // 3. Fetch company name for the email
    const [companyRows] = await pool.query(
      'SELECT name FROM companies WHERE id = ? LIMIT 1',
      [companyId]
    );
    const companyName = companyRows[0]?.name || 'Your company';

    // 4. Send invitation email
    await sendInviteEmail({
      to:          normalizedEmail,
      token,
      role:        inviteRole,
      companyName,
      invitedBy:   inviterName,
    });

    const message = pendingInvite.length
      ? 'Invitation resent'
      : 'Invitation sent';

    return Response.json({
      message,
      data: { email: normalizedEmail, role: inviteRole },
    }, { status: 201 });

  } catch (err) {
    console.error('[POST /api/company/invite]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}