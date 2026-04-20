// src/app/api/settings/user-access/route.js
// GET /api/settings/user-access — list company users with roles
// PUT /api/settings/user-access — change a user's role (company_admin / super_admin only)

import { NextResponse } from 'next/server';
import { getCompanyUsers, getUserInCompany, updateUserRole } from '@/lib/services/settingsService';
import { logAction, ACTION } from '@/lib/logging/audit';
import { validateUserContext } from '@/lib/auth/authUtils';

const ADMIN_ROLES   = ['super_admin', 'company_admin'];
const ALLOWED_ROLES_ENUM = ['company_admin', 'manager', 'employee', 'vendor_user'];

export async function GET(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireCompanyId: true,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const { userId, companyId, role } = validated;

  // Managers may view (read-only); admins can modify
  const canView = ADMIN_ROLES.includes(role) || role === 'manager';
  if (!canView) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const data = await getCompanyUsers(Number(companyId));
    return NextResponse.json({ message: 'OK', data, canEdit: ADMIN_ROLES.includes(role) });
  } catch (err) {
    console.error('[GET /api/settings/user-access]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireRole: ADMIN_ROLES,
    requireCompanyId: true,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const { userId, companyId, role, email: userEmail } = validated;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { target_user_id, new_role } = body;

  if (!target_user_id || !new_role) {
    return NextResponse.json({ error: 'target_user_id and new_role are required.' }, { status: 400 });
  }

  // Prevent assigning super_admin role via this endpoint
  if (!ALLOWED_ROLES_ENUM.includes(new_role)) {
    return NextResponse.json(
      { error: `new_role must be one of: ${ALLOWED_ROLES_ENUM.join(', ')}` },
      { status: 400 }
    );
  }

  // Prevent self-demotion
  if (Number(target_user_id) === Number(userId)) {
    return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 400 });
  }

  try {
    // Prevent changing the role of a Company Admin
    const targetUser = await getUserInCompany(Number(target_user_id), Number(companyId));
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found in your company.' }, { status: 404 });
    }
    if (targetUser.role === 'company_admin') {
      return NextResponse.json(
        { error: 'The role of a Company Admin cannot be changed from this panel.' },
        { status: 403 }
      );
    }

    const updated = await updateUserRole(Number(target_user_id), Number(companyId), new_role);
    if (!updated) {
      return NextResponse.json({ error: 'User not found in your company.' }, { status: 404 });
    }
    await logAction(request, {
      userId:       Number(userId),
      userEmail,
      actionType:   ACTION.USER_ROLE_CHANGED,
      resourceType: 'user',
      resourceId:   Number(target_user_id),
      changes:      { new_role },
      status:       'success',
    });

    return NextResponse.json({ message: 'User role updated.' });
  } catch (err) {
    console.error('[PUT /api/settings/user-access]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
