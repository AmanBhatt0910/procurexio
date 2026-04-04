// src/app/api/company/users/route.js
import pool from '@/lib/db';

// GET /api/company/users
export async function GET(request) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');

  // super_admin and vendor_user do not belong to a company tenant
  if (['super_admin', 'vendor_user'].includes(role)) {
    return Response.json(
      { error: 'super_admin and vendor_user do not have a company context. Use /api/admin/users for platform-level access.' },
      { status: 403 }
    );
  }

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // employees can view the team list (read-only); they just can't edit roles
  if (!['company_admin', 'manager', 'employee'].includes(role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [users] = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM   users
       WHERE  company_id = ?
       ORDER BY created_at DESC`,
      [companyId]
    );
    return Response.json({ message: 'OK', data: users });
  } catch (err) {
    console.error('[GET /api/company/users]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}