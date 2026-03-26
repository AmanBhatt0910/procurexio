// src/app/api/company/invite/route.js
import pool   from '@/lib/db';
import crypto from 'crypto';

const ALLOWED_ROLES = ['company_admin', 'manager', 'employee', 'vendor_user'];

// POST /api/company/invite
export async function POST(request) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');

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
    // Check if user already exists in this company
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND company_id = ?',
      [normalizedEmail, companyId]
    );
    if (existing.length) {
      return Response.json({ error: 'User already exists in this company' }, { status: 409 });
    }

    // Check for a pending (non-expired, non-accepted) invite
    const [pendingInvite] = await pool.query(
      `SELECT id FROM invitations
       WHERE  email = ? AND company_id = ? AND accepted_at IS NULL AND expires_at > NOW()`,
      [normalizedEmail, companyId]
    );
    if (pendingInvite.length) {
      return Response.json({ error: 'A pending invitation already exists for this email' }, { status: 409 });
    }

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.query(
      `INSERT INTO invitations (company_id, email, role, token, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [companyId, normalizedEmail, inviteRole, token, expiresAt]
    );

    // TODO: send invitation email with token link
    // The invite link would be: /register?token=<token>

    return Response.json({
      message: 'Invitation created',
      data: { email: normalizedEmail, role: inviteRole, token }
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/company/invite]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}