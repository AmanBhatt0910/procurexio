import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/activity-logs — paginated audit log for super_admin
export async function GET(request) {
  const role = request.headers.get('x-user-role');
  if (role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page       = Math.max(1, parseInt(searchParams.get('page')        || '1',  10));
  const limit      = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));
  const offset     = (page - 1) * limit;
  const actionType = searchParams.get('action_type') || null;
  const userId     = searchParams.get('user_id')     || null;

  try {
    // Check if audit_logs table exists (graceful fallback during migration)
    const [[{ tableExists }]] = await pool.execute(
      `SELECT COUNT(*) AS tableExists
       FROM   information_schema.tables
       WHERE  table_schema = DATABASE()
         AND  table_name   = 'audit_logs'`
    );

    if (!tableExists) {
      return NextResponse.json({
        message: 'ok',
        data: [],
        meta: { total: 0, page, limit, totalPages: 0, notice: 'audit_logs table not yet created — run migrations/001_security_audit.sql' },
      });
    }

    // Build WHERE clause
    const conditions = [];
    const params     = [];
    if (actionType) {
      conditions.push('action_type = ?');
      params.push(actionType);
    }
    if (userId) {
      conditions.push('user_id = ?');
      params.push(parseInt(userId, 10));
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `SELECT id, user_id, user_email, action_type, resource_type, resource_id,
              resource_name, changes, status, status_reason, ip_address, created_at
       FROM   audit_logs
       ${where}
       ORDER  BY created_at DESC
       LIMIT  ${limit} OFFSET ${offset}`,
      params
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM audit_logs ${where}`,
      params
    );

    return NextResponse.json({
      message: 'ok',
      data:    rows,
      meta:    { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('GET /api/admin/activity-logs', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
