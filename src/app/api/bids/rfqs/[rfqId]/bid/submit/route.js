// POST /api/bids/rfqs/[rfqId]/bid/submit
// Transition bid: draft → submitted. Blocks past deadline.
// Also updates rfq_vendors.status = 'submitted' in same transaction.

import pool from '@/lib/db';

export async function POST(request, { params }) {
  const role      = request.headers.get('x-user-role');
  const userId    = request.headers.get('x-user-id');
  const companyId = request.headers.get('x-company-id');
  const { rfqId } = params;

  if (role !== 'vendor_user') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [vendorRows] = await pool.query(
    `SELECT vendor_id FROM vendor_users WHERE user_id = ? AND company_id = ? LIMIT 1`,
    [userId, companyId]
  );
  if (!vendorRows.length) return Response.json({ error: 'Vendor association not found' }, { status: 404 });
  const vendorId = vendorRows[0].vendor_id;

  // Fetch RFQ to check deadline + status
  const [[rfq]] = await pool.query(
    `SELECT id, status, deadline FROM rfqs WHERE id = ? AND company_id = ?`,
    [rfqId, companyId]
  );
  if (!rfq) return Response.json({ error: 'RFQ not found' }, { status: 404 });
  if (['closed','cancelled'].includes(rfq.status)) {
    return Response.json({ error: 'RFQ is no longer accepting bids' }, { status: 422 });
  }
  if (rfq.deadline && new Date() > new Date(rfq.deadline)) {
    return Response.json({ error: 'RFQ deadline has passed' }, { status: 422 });
  }

  const [[bid]] = await pool.query(
    `SELECT id, status FROM bids WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
    [rfqId, vendorId, companyId]
  );
  if (!bid) return Response.json({ error: 'Bid not found' }, { status: 404 });
  if (bid.status !== 'draft') {
    return Response.json({ error: `Cannot submit bid with status '${bid.status}'` }, { status: 422 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE bids SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
       WHERE id = ? AND company_id = ?`,
      [bid.id, companyId]
    );

    await conn.query(
      `UPDATE rfq_vendors SET status = 'submitted', updated_at = NOW()
       WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );

    await conn.commit();
    return Response.json({ message: 'Bid submitted successfully' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return Response.json({ error: 'Failed to submit bid' }, { status: 500 });
  } finally {
    conn.release();
  }
}