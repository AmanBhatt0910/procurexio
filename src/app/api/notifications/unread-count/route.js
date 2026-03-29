import pool from '@/lib/db';

// GET /api/notifications/unread-count
// Lightweight — returns only { count: N }. Used for badge polling.
export async function GET(request) {
  const userId    = request.headers.get('x-user-id');
  const companyId = request.headers.get('x-company-id');

  if (!userId || !companyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [[{ count }]] = await pool.execute(
      `SELECT COUNT(*) AS count FROM notifications
       WHERE user_id = ? AND company_id = ? AND is_read = 0`,
      [userId, companyId]
    );

    return Response.json({ count });
  } catch (err) {
    console.error('GET /api/notifications/unread-count error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}