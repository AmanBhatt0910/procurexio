// src/app/api/company/invite/route.js

import pool                    from '@/lib/db';
import { sendInviteEmail,
         sendVendorInviteEmail } from '@/lib/mailer';
import crypto                  from 'crypto';
import { ROLES, PERMISSIONS, hasPermission } from '@/lib/rbac';
import { logAction, ACTION } from '@/lib/audit';

const TEAM_ROLES   = [ROLES.MANAGER, ROLES.EMPLOYEE];
const VENDOR_ROLES = [ROLES.VENDOR_USER];
const ALL_ROLES    = [...TEAM_ROLES, ...VENDOR_ROLES];

export async function POST(request) {
  const companyId   = request.headers.get('x-company-id');
  const role        = request.headers.get('x-user-role');
  const inviterName = request.headers.get('x-user-name') || 'A team member';

  if (!companyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(role, PERMISSIONS.MANAGE_COMPANY)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { email, role: inviteRole, vendorId, vendorName } = body;

  if (!email || !inviteRole) {
    return Response.json({ error: 'email and role are required' }, { status: 400 });
  }
  if (!ALL_ROLES.includes(inviteRole)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Prevent inviting a second company_admin — only one is allowed per company
  if (inviteRole === ROLES.COMPANY_ADMIN) {
    return Response.json({ error: 'Only one company admin is allowed per company' }, { status: 400 });
  }

  // Vendor invites MUST supply a vendorId
  if (inviteRole === ROLES.VENDOR_USER && !vendorId) {
    return Response.json({ error: 'vendorId is required for vendor_user invitations' }, { status: 400 });
  }

  // Non-vendor invites must NOT include vendorId
  if (TEAM_ROLES.includes(inviteRole) && vendorId) {
    return Response.json({ error: 'vendorId is only valid for vendor_user role' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 1. Verify the vendor belongs to this company (prevents cross-tenant abuse)
    if (inviteRole === ROLES.VENDOR_USER) {
      const [vRows] = await pool.query(
        'SELECT id FROM vendors WHERE id = ? AND company_id = ? LIMIT 1',
        [vendorId, companyId]
      );
      if (!vRows.length) {
        return Response.json({ error: 'Vendor not found' }, { status: 404 });
      }
    }

    // 2. Check if user already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND company_id = ?',
      [normalizedEmail, companyId]
    );
    if (existing.length) {
      return Response.json({ error: 'User already exists in this company' }, { status: 409 });
    }

    // 3. Look for existing non-expired pending invitation for same email+company+vendor
    let pendingQuery =
      `SELECT id, token FROM invitations
       WHERE email = ? AND company_id = ? AND accepted_at IS NULL AND expires_at > NOW()`;
    const pendingParams = [normalizedEmail, companyId];

    if (inviteRole === ROLES.VENDOR_USER) {
      pendingQuery += ' AND vendor_id = ?';
      pendingParams.push(vendorId);
    } else {
      pendingQuery += ' AND vendor_id IS NULL';
    }

    const [pendingInvite] = await pool.query(pendingQuery, pendingParams);

    let token;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (pendingInvite.length) {
      // Refresh existing invitation
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
        `INSERT INTO invitations (company_id, email, role, vendor_id, token, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [companyId, normalizedEmail, inviteRole, vendorId ?? null, token, expiresAt]
      );
    }

    // 4. Fetch company name
    const [companyRows] = await pool.query(
      'SELECT name FROM companies WHERE id = ? LIMIT 1',
      [companyId]
    );
    const companyName = companyRows[0]?.name || 'Your company';

    // 5. Send the appropriate email
    if (inviteRole === ROLES.VENDOR_USER) {
      await sendVendorInviteEmail({
        to:          normalizedEmail,
        token,
        vendorName:  vendorName || 'Your company',
        companyName,
        invitedBy:   inviterName,
      });
    } else {
      await sendInviteEmail({
        to:          normalizedEmail,
        token,
        role:        inviteRole,
        companyName,
        invitedBy:   inviterName,
      });
    }

    const message = pendingInvite.length ? 'Invitation resent' : 'Invitation sent';
    await logAction(request, {
      userId:       parseInt(request.headers.get('x-user-id'), 10) || null,
      userEmail:    request.headers.get('x-user-email') || null,
      actionType:   ACTION.INVITATION_CREATED,
      resourceType: 'invitation',
      resourceName: normalizedEmail,
      changes:      { role: inviteRole, resent: pendingInvite.length > 0 },
      status:       'success',
    });
    return Response.json({
      message,
      data: { email: normalizedEmail, role: inviteRole },
    }, { status: 201 });

  } catch (err) {
    console.error('[POST /api/company/invite]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}