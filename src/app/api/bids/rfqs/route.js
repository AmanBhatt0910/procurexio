import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/bids/rfqs — vendor_user: list of RFQs they are invited to
export async function GET(request) {
  const role = request.headers.get('x-user-role');
  const userId = request.headers.get('x-user-id');

  if (role !== 'vendor_user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  try {
    // Resolve vendor_id from the user record
    const [userRows] = await pool.query(
      `SELECT u.id, u.company_id, v.id AS vendor_id
       FROM users u
       LEFT JOIN vendor_contacts vc ON vc.email = u.email AND vc.company_id = u.company_id
       LEFT JOIN vendors v ON v.id = vc.vendor_id AND v.company_id = u.company_id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );

    if (!userRows.length || !userRows[0].vendor_id) {
      return NextResponse.json({ error: 'No vendor account linked to this user' }, { status: 404 });
    }

    const vendorId   = userRows[0].vendor_id;
    const companyId  = userRows[0].company_id;

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM rfq_vendors rv
       JOIN rfqs r ON r.id = rv.rfq_id
       WHERE rv.vendor_id = ? AND rv.company_id = ?
         AND rv.status IN ('invited','viewed','submitted')
         AND r.status IN ('published','closed')`,
      [vendorId, companyId]
    );

    const [rows] = await pool.query(
      `SELECT
         r.id, r.title, r.reference_number, r.status AS rfq_status,
         r.deadline, r.currency,
         rv.status AS invite_status,
         b.id AS bid_id, b.status AS bid_status, b.total_amount, b.submitted_at
       FROM rfq_vendors rv
       JOIN rfqs r ON r.id = rv.rfq_id
       LEFT JOIN bids b ON b.rfq_id = r.id AND b.vendor_id = ?
       WHERE rv.vendor_id = ? AND rv.company_id = ?
         AND rv.status IN ('invited','viewed','submitted')
         AND r.status IN ('published','closed')
       ORDER BY r.deadline ASC
       LIMIT ? OFFSET ?`,
      [vendorId, vendorId, companyId, limit, offset]
    );

    return NextResponse.json({
      message: 'ok',
      data: {
        rfqs: rows,
        vendorId,
        pagination: { page, limit, total: Number(total), pages: Math.ceil(Number(total) / limit) },
      },
    });
  } catch (err) {
    console.error('GET /api/bids/rfqs', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}