import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateUserContext } from '@/lib/authUtils';

// GET /api/admin/companies — list all companies for super_admin
export async function GET(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireRole: ['super_admin'],
    requireUserId: true,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const { searchParams } = new URL(request.url);
  const search  = searchParams.get('search')  || '';
  const status  = searchParams.get('status')  || '';
  const page    = Math.max(1, parseInt(searchParams.get('page')  || '1', 10));
  const limit   = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset  = (page - 1) * limit;

  const conditions = [];
  const params     = [];

  if (search) {
    conditions.push('(c.name LIKE ? OR c.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    conditions.push('c.status = ?');
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM companies c ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT
         c.id, c.name, c.email, c.plan, c.status, c.created_at,
         COUNT(DISTINCT u.id)   AS user_count,
         COUNT(DISTINCT r.id)   AS rfq_count,
         COUNT(DISTINCT b.id)   AS bid_count
       FROM companies c
       LEFT JOIN users  u ON u.company_id = c.id
       LEFT JOIN rfqs   r ON r.company_id = c.id
       LEFT JOIN bids   b ON b.company_id = c.id
       ${where}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return NextResponse.json({
      message: 'ok',
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('GET /api/admin/companies', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/companies — update company status
export async function PATCH(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireRole: ['super_admin'],
    requireUserId: true,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  try {
    const { id, status } = await request.json();
    if (!id || !['active', 'inactive', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await pool.execute(
      `UPDATE companies SET status = ? WHERE id = ?`,
      [status, id]
    );

    return NextResponse.json({ message: 'Company status updated' });
  } catch (err) {
    console.error('PATCH /api/admin/companies', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
