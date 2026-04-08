import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/bids/rfqs — vendor_user: list of RFQs they are invited to
export async function GET(request) {
  const role   = request.headers.get('x-user-role');
  const userId = request.headers.get('x-user-id');

  if (role !== 'vendor_user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  try {
    // Resolve vendor_id from the user record.
    // Strategy 1: user has a direct vendor_id column (most reliable)
    // Strategy 2: match via vendor_contacts on email (fallback)
    const [userRows] = await pool.query(
      `SELECT
         u.id,
         u.company_id,
         -- direct link if your users table has vendor_id
         COALESCE(u.vendor_id, vc_match.vendor_id) AS vendor_id
       FROM users u
       LEFT JOIN (
         SELECT vc.vendor_id, vc.email, vc.company_id
         FROM vendor_contacts vc
       ) vc_match ON vc_match.email = u.email AND vc_match.company_id = u.company_id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );

    if (!userRows.length || !userRows[0].vendor_id) {
      // Return empty list instead of a hard 404 — better UX,
      // avoids a crash on the vendor bids page
      return NextResponse.json({
        message: 'ok',
        data: {
          rfqs: [],
          vendorId: null,
          pagination: { page, limit, total: 0, pages: 0 },
        },
      });
    }

    const vendorId  = userRows[0].vendor_id;
    const companyId = userRows[0].company_id;

    const [[settingsRow]] = await pool.query(
      `SELECT currency FROM company_settings WHERE company_id = ? LIMIT 1`,
      [companyId]
    );
    const companyCurrency = settingsRow?.currency || 'USD';

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
       ORDER BY b.submitted_at DESC, r.created_at DESC
       LIMIT ? OFFSET ?`,
      [vendorId, vendorId, companyId, limit, offset]
    );

    return NextResponse.json({
      message: 'ok',
      data: {
        rfqs: rows,
        vendorId,
        companyCurrency,
        pagination: { page, limit, total: Number(total), pages: Math.ceil(Number(total) / limit) },
      },
    });
  } catch (err) {
    console.error('GET /api/bids/rfqs', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}