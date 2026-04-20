import pool from '@/lib/db';
import { validateUserContext } from '@/lib/auth/authUtils';

// GET /api/notifications
// Paginated notifications for the current user.
// Query params: ?unread=true  ?page=1  ?limit=20
export async function GET(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireUserId: true,
  });

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: validated.status });
  }

  const { userId, companyId, role } = validated;

  // super_admin may not have a company — allow userId-only lookup
  if (!companyId && role !== 'super_admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';
  const page       = Math.max(1, parseInt(searchParams.get('page')  || '1', 10));
  const limit      = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset     = (page - 1) * limit;

  // Build query depending on whether companyId is present
  const isSuperAdminNoCompany = role === 'super_admin' && !companyId;

  const conditions = ['user_id = ?'];
  const params     = [userId];

  if (!isSuperAdminNoCompany) {
    conditions.push('company_id = ?');
    params.push(companyId);
  }

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

    const countParams = isSuperAdminNoCompany
      ? [userId]
      : [userId, companyId];
    const countWhere  = isSuperAdminNoCompany
      ? 'user_id = ? AND is_read = 0'
      : 'user_id = ? AND company_id = ? AND is_read = 0';

    const [[{ unreadCount }]] = await pool.execute(
      `SELECT COUNT(*) AS unreadCount FROM notifications WHERE ${countWhere}`,
      countParams
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