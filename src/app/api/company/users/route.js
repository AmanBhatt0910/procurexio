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

  const { searchParams } = new URL(request.url);
  const page   = Math.max(1, parseInt(searchParams.get('page')  || '1', 10));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = (page - 1) * limit;

  try {
    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM users WHERE company_id = ?',
      [companyId]
    );

    // Use query (not execute) for LIMIT/OFFSET since some mysql2 versions
    // reject parameterized LIMIT/OFFSET via execute. Values are validated
    // integers above so there is no SQL injection risk.
    const [users] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE company_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [companyId, limit, offset]
    );
    return Response.json({
      message: 'OK',
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[GET /api/company/users]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}