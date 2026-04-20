import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateUserContext } from '@/lib/auth/authUtils';

// GET /api/admin/users — list all users across all companies for super_admin
export async function GET(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireRole: ['super_admin'],
    requireUserId: true,
  });

  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error },
      { status: validated.status }
    );
  }

  const { searchParams } = new URL(request.url);
  const search    = searchParams.get('search')    || '';
  const company   = searchParams.get('company')   || '';
  const userRole  = searchParams.get('role')      || '';
  const page      = Math.max(1, parseInt(searchParams.get('page')  || '1', 10));
  const limit     = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset    = (page - 1) * limit;

  const conditions = [];
  const params     = [];

  if (search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (company) {
    conditions.push('u.company_id = ?');
    params.push(company);
  }
  if (userRole) {
    conditions.push('u.role = ?');
    params.push(userRole);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM users u ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT
         u.id, u.name, u.email, u.role, u.created_at,
         c.name AS company_name, c.id AS company_id
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       ${where}
       ORDER BY COALESCE(c.name, '~') ASC, FIELD(u.role, 'company_admin', 'manager', 'employee', 'vendor_user') ASC, u.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return NextResponse.json({
      message: 'ok',
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('GET /api/admin/users', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
