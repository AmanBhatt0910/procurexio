import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import pool from '@/lib/db';

export async function GET(request) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const { userId } = payload;

    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role,
              u.company_id   AS companyId,
              c.name         AS companyName,
              u.created_at   AS createdAt
       FROM   users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE  u.id = ?
       LIMIT  1`,
      [userId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const res = NextResponse.json({ message: 'OK', data: rows[0] });
    res.headers.set('Cache-Control', 'no-store, no-cache');
    return res;
  } catch (err) {
    console.error('[GET /api/auth/me]', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}