import pool from '@/lib/db';
import { validateUserContext } from '@/lib/authUtils';

// PATCH /api/notifications/read-all
// Marks ALL unread notifications as read for the current user.
export async function PATCH(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireUserId: true,
  });

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: validated.status });
  }

  const { userId, companyId, role } = validated;

  if (!companyId && role !== 'super_admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let result;
    if (role === 'super_admin' && !companyId) {
      [result] = await pool.execute(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
        [userId]
      );
    } else {
      [result] = await pool.execute(
        `UPDATE notifications SET is_read = 1
         WHERE user_id = ? AND company_id = ? AND is_read = 0`,
        [userId, companyId]
      );
    }

    return Response.json({
      message: 'All notifications marked as read',
      data: { updated: result.affectedRows },
    });
  } catch (err) {
    console.error('PATCH /api/notifications/read-all error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}