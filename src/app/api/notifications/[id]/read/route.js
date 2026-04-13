import pool from '@/lib/db';
import { validateUserContext } from '@/lib/authUtils';
import { validateNumericId } from '@/lib/authUtils';

// PATCH /api/notifications/[id]/read
// Marks a single notification as read. Must belong to requesting user.
export async function PATCH(request, { params }) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireUserId: true,
  });

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: validated.status });
  }

  const { userId, companyId, role } = validated;
  const { id: rawId } = await params;

  if (!companyId && role !== 'super_admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // CRITICAL: Validate URL parameter is numeric
  const { ok: idOk, value: id } = validateNumericId(rawId);
  if (!idOk) {
    return Response.json({ error: 'Invalid notification ID' }, { status: 400 });
  }

  try {
    let result;
    if (role === 'super_admin' && !companyId) {
      [result] = await pool.execute(
        `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
    } else {
      [result] = await pool.execute(
        `UPDATE notifications SET is_read = 1
         WHERE id = ? AND user_id = ? AND company_id = ?`,
        [id, userId, companyId]
      );
    }

    if (result.affectedRows === 0) {
      return Response.json({ error: 'Notification not found' }, { status: 404 });
    }

    return Response.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error(`PATCH /api/notifications/${id}/read error:`, err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}