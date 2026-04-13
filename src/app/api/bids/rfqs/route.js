import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateUserContext } from '@/lib/authUtils';

// GET /api/bids/rfqs — vendor_user: list of RFQs they are invited to
export async function GET(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireRole: ['vendor_user'],
    requireUserId: true,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const { userId } = validated;

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
          pagination: { page, limit, total: 0, pages: 0, totalPages: 0 },
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
         r.deadline, r.currency, r.created_at, r.updated_at,
         rv.status AS invite_status,
         b.id AS bid_id, b.status AS bid_status, b.total_amount, b.submitted_at
         FROM rfq_vendors rv
         JOIN rfqs r ON r.id = rv.rfq_id
         LEFT JOIN bids b ON b.rfq_id = r.id AND b.vendor_id = ?
         WHERE rv.vendor_id = ? AND rv.company_id = ?
          AND rv.status IN ('invited','viewed','submitted')
          AND r.status IN ('published','closed')
         ORDER BY
          -- Group statuses for cleaner vendor dashboard sections: published first, then closed.
          CASE r.status
            WHEN 'published' THEN 0
            WHEN 'closed' THEN 1
            ELSE 2
          END ASC,
          -- For published RFQs, prioritize nearest deadline first.
          CASE WHEN r.status = 'published' THEN COALESCE(r.deadline, '9999-12-31 23:59:59') END ASC,
          -- For closed RFQs, show most recently updated/closed first.
          CASE WHEN r.status = 'closed' THEN COALESCE(r.updated_at, r.created_at) END DESC,
          b.submitted_at DESC,
          r.created_at DESC
         LIMIT ? OFFSET ?`,
      [vendorId, vendorId, companyId, limit, offset]
    );

    return NextResponse.json({
      message: 'ok',
      data: {
        rfqs: rows,
        vendorId,
        companyCurrency,
        pagination: { page, limit, total: Number(total), pages: Math.ceil(Number(total) / limit), totalPages: Math.ceil(Number(total) / limit) },
      },
    });
  } catch (err) {
    console.error('GET /api/bids/rfqs', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
