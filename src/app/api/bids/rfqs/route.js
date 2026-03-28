// GET /api/bids/rfqs
// Returns paginated list of RFQs the current vendor_user is invited to.
// Requires role: vendor_user

import pool from '@/lib/db';

export async function GET(request) {
  const role      = request.headers.get('x-user-role');
  const userId    = request.headers.get('x-user-id');
  const companyId = request.headers.get('x-company-id');

  if (role !== 'vendor_user') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Resolve vendor_id from vendor_users (or equivalent link table)
  const [vendorRows] = await pool.query(
    `SELECT vendor_id FROM vendor_users WHERE user_id = ? AND company_id = ? LIMIT 1`,
    [userId, companyId]
  );
  if (!vendorRows.length) {
    return Response.json({ error: 'Vendor association not found' }, { status: 404 });
  }
  const vendorId = vendorRows[0].vendor_id;

  const { searchParams } = new URL(request.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM rfq_vendors rv
     JOIN rfqs r ON r.id = rv.rfq_id
     WHERE rv.vendor_id = ?
       AND rv.company_id = ?
       AND rv.status IN ('invited','viewed','submitted')
       AND r.status NOT IN ('cancelled')`,
    [vendorId, companyId]
  );

  const [rows] = await pool.query(
    `SELECT
       r.id, r.reference_number, r.title, r.status AS rfq_status,
       r.deadline, r.currency,
       rv.status AS invite_status,
       b.id       AS bid_id,
       b.status   AS bid_status,
       b.total_amount,
       b.submitted_at
     FROM rfq_vendors rv
     JOIN rfqs r ON r.id = rv.rfq_id
     LEFT JOIN bids b ON b.rfq_id = r.id AND b.vendor_id = ?
     WHERE rv.vendor_id = ?
       AND rv.company_id = ?
       AND rv.status IN ('invited','viewed','submitted')
       AND r.status NOT IN ('cancelled')
     ORDER BY r.deadline ASC
     LIMIT ? OFFSET ?`,
    [vendorId, vendorId, companyId, limit, offset]
  );

  return Response.json({
    message: 'OK',
    data: { rows, total, page, limit },
  });
}