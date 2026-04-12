import pool from '@/lib/db';

// GET /api/notifications/unread-count
// Lightweight — returns { count: N, latestNotification }. Used for badge polling.
export async function GET(request) {
  const userId    = request.headers.get('x-user-id');
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // super_admin may not have a company — allow userId-only lookup
  if (!companyId && role !== 'super_admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let count;
    let latestNotification = null;

    if (role === 'super_admin' && !companyId) {
      const [[row]] = await pool.execute(
        `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
        [userId]
      );
      count = row.count;

      const [[latest]] = await pool.execute(
        `SELECT id, type, title, body, link, created_at
         FROM notifications
         WHERE user_id = ? AND is_read = 0
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      );
      latestNotification = latest ?? null;
    } else {
      const [[row]] = await pool.execute(
        `SELECT COUNT(*) AS count FROM notifications
         WHERE user_id = ? AND company_id = ? AND is_read = 0`,
        [userId, companyId]
      );
      count = row.count;

      const [[latest]] = await pool.execute(
        `SELECT id, type, title, body, link, created_at
         FROM notifications
         WHERE user_id = ? AND company_id = ? AND is_read = 0
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId, companyId]
      );
      latestNotification = latest ?? null;
    }

    return Response.json({ count, latestNotification });
  } catch (err) {
    console.error('GET /api/notifications/unread-count error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}