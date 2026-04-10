// src/app/api/settings/user-access/route.js
// GET /api/settings/user-access — list company users with roles
// PUT /api/settings/user-access — change a user's role (company_admin / super_admin only)

import { NextResponse } from 'next/server';
import { getCompanyUsers, updateUserRole } from '@/lib/settingsService';
import { logAction, ACTION } from '@/lib/audit';

const ADMIN_ROLES   = ['super_admin', 'company_admin'];
const ALLOWED_ROLES_ENUM = ['company_admin', 'manager', 'employee', 'vendor_user'];

export async function GET(request) {
  const userId    = request.headers.get('x-user-id');
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Managers may view (read-only); admins can modify
  const canView = ADMIN_ROLES.includes(role) || role === 'manager';
  if (!canView) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!companyId) {
    return NextResponse.json({ error: 'No company associated with this account.' }, { status: 400 });
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
  const userId    = request.headers.get('x-user-id');
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');
  const userEmail = request.headers.get('x-user-email') || null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Forbidden — admins only' }, { status: 403 });
  }
  if (!companyId) {
    return NextResponse.json({ error: 'No company associated with this account.' }, { status: 400 });
  }

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
