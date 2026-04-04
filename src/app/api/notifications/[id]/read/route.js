import pool from '@/lib/db';

// PATCH /api/notifications/[id]/read
// Marks a single notification as read. Must belong to requesting user.
export async function PATCH(request, { params }) {
  const userId    = request.headers.get('x-user-id');
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');
  const { id }    = await params;

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!companyId && role !== 'super_admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!id || isNaN(id)) {
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