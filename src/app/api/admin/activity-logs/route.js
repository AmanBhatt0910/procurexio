import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Human-readable descriptions for every action type
const ACTION_DESCRIPTIONS = {
  login_success:           'Signed in successfully',
  login_failure:           'Sign-in attempt failed',
  logout:                  'Signed out',
  register_success:        'Account registered',
  register_failure:        'Account registration failed',
  password_reset_request:  'Password reset requested',
  password_reset_sent:     'Password reset email sent',
  password_reset_complete: 'Password reset completed',
  account_locked:          'Account locked after too many failed attempts',
  user_created:            'User account created',
  user_updated:            'User account updated',
  user_deactivated:        'User account deactivated',
  user_role_changed:       'User role changed',
  company_created:         'Company registered',
  company_updated:         'Company settings updated',
  company_status_changed:  'Company status changed',
  vendor_created:          'Vendor added',
  vendor_updated:          'Vendor details updated',
  vendor_deactivated:      'Vendor deactivated',
  rfq_created:             'RFQ created',
  rfq_updated:             'RFQ details updated',
  rfq_status_changed:      'RFQ status changed',
  rfq_deleted:             'RFQ deleted',
  bid_created:             'Bid started (draft)',
  bid_updated:             'Bid draft updated',
  bid_submitted:           'Bid submitted',
  bid_withdrawn:           'Bid withdrawn',
  bid_resubmitted:         'Submitted bid revised',
  award_created:           'Contract awarded',
  award_cancelled:         'Contract award cancelled',
  evaluation_submitted:    'Bid evaluation submitted',
  invitation_created:      'Invitation sent',
  invitation_accepted:     'Invitation accepted',
};

// GET /api/admin/activity-logs — paginated audit log for super_admin
export async function GET(request) {
  const role = request.headers.get('x-user-role');
  if (role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page         = Math.max(1, parseInt(searchParams.get('page')        || '1',  10));
  const limit        = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));
  const offset       = (page - 1) * limit;
  const actionType   = searchParams.get('action_type')   || null;
  const resourceType = searchParams.get('resource_type') || null;
  const status       = searchParams.get('status')        || null;
  const userId       = searchParams.get('user_id')       || null;
  const companyId    = searchParams.get('company_id')    || null;
  const dateFrom     = searchParams.get('date_from')     || null;
  const dateTo       = searchParams.get('date_to')       || null;
  const search       = searchParams.get('search')        || null;

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
        meta: { total: 0, page, limit, totalPages: 0, notice: 'audit_logs table not yet created — run src/sql/7_security_schema.sql' },
      });
    }

    // Build WHERE clause
    const conditions = [];
    const params     = [];
    if (actionType)   { conditions.push('al.action_type = ?');   params.push(actionType); }
    if (resourceType) { conditions.push('al.resource_type = ?'); params.push(resourceType); }
    if (status)       { conditions.push('al.status = ?');        params.push(status); }
    if (userId)       { conditions.push('al.user_id = ?');       params.push(parseInt(userId, 10)); }
    if (companyId)    { conditions.push('u.company_id = ?');     params.push(parseInt(companyId, 10)); }
    if (dateFrom)     { conditions.push('al.created_at >= ?');   params.push(dateFrom); }
    if (dateTo)       {
      // Build end-of-day timestamp in UTC from the YYYY-MM-DD date string
      const endOfDay = new Date(dateTo);
      endOfDay.setUTCHours(23, 59, 59, 999);
      conditions.push('al.created_at <= ?');
      params.push(endOfDay.toISOString().slice(0, 19).replace('T', ' '));
    }
    if (search)       {
      conditions.push('(al.user_email LIKE ? OR al.resource_name LIKE ? OR al.action_type LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT
         al.id,
         al.user_id,
         al.user_email,
         al.action_type,
         al.resource_type,
         al.resource_id,
         al.resource_name,
         al.changes,
         al.status,
         al.status_reason,
         al.ip_address,
         al.user_agent,
         al.created_at,
         u.name        AS actor_name,
         u.role        AS actor_role,
         c.name        AS company_name,
         c.id          AS company_id
       FROM audit_logs al
       LEFT JOIN users     u  ON u.id  = al.user_id
       LEFT JOIN companies c  ON c.id  = u.company_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}`,
      params
    );

    // Attach human-readable description to each row and parse changes JSON
    const enriched = rows.map(row => ({
      ...row,
      description: ACTION_DESCRIPTIONS[row.action_type] || row.action_type?.replace(/_/g, ' '),
      changes: row.changes
        ? (typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes)
        : null,
    }));

    // Gather unique action_types for filter dropdown
    const [actionTypes] = await pool.query(
      `SELECT DISTINCT action_type FROM audit_logs ORDER BY action_type ASC`
    );

    return NextResponse.json({
      message: 'ok',
      data:    enriched,
      meta:    { total, page, limit, totalPages: Math.ceil(total / limit) },
      filters: { actionTypes: actionTypes.map(r => r.action_type) },
    });
  } catch (err) {
    console.error('GET /api/admin/activity-logs', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
