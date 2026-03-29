import pool from '@/lib/db';

// GET /api/notifications
// Paginated notifications for the current user.
// Query params: ?unread=true  ?page=1  ?limit=20
export async function GET(request) {
  const userId    = request.headers.get('x-user-id');
  const companyId = request.headers.get('x-company-id');

  if (!userId || !companyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';
  const page       = Math.max(1, parseInt(searchParams.get('page')  || '1', 10));
  const limit      = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset     = (page - 1) * limit;

  const conditions = ['user_id = ?', 'company_id = ?'];
  const params     = [userId, companyId];

  if (unreadOnly) {
    conditions.push('is_read = 0');
  }

  const where = conditions.join(' AND ');

  try {
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM notifications WHERE ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT id, type, title, body, link, is_read AS isRead, created_at AS createdAt
       FROM notifications
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const [[{ unreadCount }]] = await pool.execute(
      `SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND company_id = ? AND is_read = 0`,
      [userId, companyId]
    );

    return Response.json({
      message: 'ok',
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    });
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}