// src/app/api/company/users/[id]/route.js
import pool from '@/lib/db';
import { ROLES, PERMISSIONS, hasPermission } from '@/lib/auth/rbac';
import { logAction, ACTION } from '@/lib/logging/audit';
import { validateUserContext } from '@/lib/auth/authUtils';
import { validateNumericId } from '@/lib/auth/authUtils';

const ALLOWED_ROLES = [ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.VENDOR_USER];

// PUT /api/company/users/[id] — update role or active status
export async function PUT(request, { params }) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requirePermission: (role) => hasPermission(role, PERMISSIONS.MANAGE_COMPANY),
    requireCompanyId: true,
  });

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: validated.status });
  }

  const { userId: actorId, companyId } = validated;
  const { id: rawTargetId } = await params;

  // CRITICAL: Validate URL parameter is numeric
  const { ok: idOk, value: targetId } = validateNumericId(rawTargetId);
  if (!idOk) {
    return Response.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  if (String(actorId) === String(targetId)) {
    return Response.json({ error: 'Cannot modify your own account here' }, { status: 400 });
  }

  const body = await request.json();
  const { role, active } = body;

  if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Prevent promoting a user to company_admin — only one is allowed per company
  if (role === ROLES.COMPANY_ADMIN) {
    return Response.json({ error: 'Only one company admin is allowed per company' }, { status: 400 });
  }

  try {
    // Confirm target belongs to same company
    const [target] = await pool.query(
      'SELECT id, role FROM users WHERE id = ? AND company_id = ?',
      [targetId, companyId]
    );
    if (!target.length) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const updates = [];
    const values  = [];

    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }

    // 'active' maps to a soft-delete via a nullable `deactivated_at` column
    // For now we store it as a role sentinel; a proper approach adds a boolean column.
    // Since the schema only has the ENUM roles, we implement active toggle via
    // a separate column when the schema is extended. We skip silently if only
    // active is passed without role changes to avoid breaking the current schema.
    // ⚠️  To fully support deactivation, add: `active TINYINT(1) NOT NULL DEFAULT 1`
    // to the users table and uncomment the block below:
    // if (active !== undefined) {
    //   updates.push('active = ?');
    //   values.push(active ? 1 : 0);
    // }

    if (!updates.length) {
      return Response.json({ error: 'Nothing to update' }, { status: 400 });
    }

    values.push(targetId, companyId);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`,
      values
    );

    await logAction(request, {
      userId:       parseInt(actorId, 10) || null,
      userEmail:    request.headers.get('x-user-email') || null,
      actionType:   role !== undefined ? ACTION.USER_ROLE_CHANGED : ACTION.USER_UPDATED,
      resourceType: 'user',
      resourceId:   parseInt(targetId, 10),
      changes:      role !== undefined ? { role_from: target[0].role, role_to: role } : null,
      status:       'success',
    });

    return Response.json({ message: 'User updated' });
  } catch (err) {
    console.error('[PUT /api/company/users/:id]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}