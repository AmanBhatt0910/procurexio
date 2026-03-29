import pool from '@/lib/db';

// PATCH /api/notifications/read-all
// Marks ALL unread notifications as read for the current user.
export async function PATCH(request) {
  const userId    = request.headers.get('x-user-id');
  const companyId = request.headers.get('x-company-id');

  if (!userId || !companyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE notifications SET is_read = 1
       WHERE user_id = ? AND company_id = ? AND is_read = 0`,
      [userId, companyId]
    );

    return Response.json({
      message: 'All notifications marked as read',
      data: { updated: result.affectedRows },
    });
  } catch (err) {
    console.error('PATCH /api/notifications/read-all error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}