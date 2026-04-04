import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/activity-logs — recent platform activity for super_admin
// This derives activity from existing tables (rfqs, bids, contracts, users, companies)
// rather than requiring a separate audit log table.
export async function GET(request) {
  const role = request.headers.get('x-user-role');
  if (role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page   = Math.max(1, parseInt(searchParams.get('page')  || '1', 10));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));
  const offset = (page - 1) * limit;

  try {
    // Combine recent activity from multiple tables into a unified feed
    const [rows] = await pool.execute(
      `SELECT * FROM (
         SELECT
           'company_created' AS action_type,
           c.id              AS resource_id,
           c.name            AS resource_name,
           NULL              AS actor_name,
           NULL              AS actor_email,
           c.name            AS company_name,
           c.created_at      AS occurred_at
         FROM companies c

         UNION ALL

         SELECT
           'user_registered'  AS action_type,
           u.id               AS resource_id,
           u.name             AS resource_name,
           u.name             AS actor_name,
           u.email            AS actor_email,
           c.name             AS company_name,
           u.created_at       AS occurred_at
         FROM users u
         LEFT JOIN companies c ON c.id = u.company_id

         UNION ALL

         SELECT
           'rfq_created'      AS action_type,
           r.id               AS resource_id,
           r.title            AS resource_name,
           u.name             AS actor_name,
           u.email            AS actor_email,
           c.name             AS company_name,
           r.created_at       AS occurred_at
         FROM rfqs r
         LEFT JOIN users     u ON u.id = r.created_by
         LEFT JOIN companies c ON c.id = r.company_id

         UNION ALL

         SELECT
           'bid_submitted'    AS action_type,
           b.id               AS resource_id,
           r.title            AS resource_name,
           u.name             AS actor_name,
           u.email            AS actor_email,
           c.name             AS company_name,
           b.created_at       AS occurred_at
         FROM bids b
         LEFT JOIN rfqs       r ON r.id = b.rfq_id
         LEFT JOIN users      u ON u.id = b.vendor_user_id
         LEFT JOIN companies  c ON c.id = r.company_id

         UNION ALL

         SELECT
           'contract_awarded' AS action_type,
           ct.id              AS resource_id,
           r.title            AS resource_name,
           u.name             AS actor_name,
           u.email            AS actor_email,
           c.name             AS company_name,
           ct.awarded_at      AS occurred_at
         FROM contracts ct
         LEFT JOIN rfqs       r  ON r.id  = ct.rfq_id
         LEFT JOIN users      u  ON u.id  = ct.awarded_by
         LEFT JOIN companies  c  ON c.id  = r.company_id
       ) AS feed
       ORDER BY occurred_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      []
    );

    const [[{ total }]] = await pool.execute(
      `SELECT (
         (SELECT COUNT(*) FROM companies) +
         (SELECT COUNT(*) FROM users) +
         (SELECT COUNT(*) FROM rfqs) +
         (SELECT COUNT(*) FROM bids) +
         (SELECT COUNT(*) FROM contracts)
       ) AS total`,
      []
    );

    return NextResponse.json({
      message: 'ok',
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('GET /api/admin/activity-logs', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
