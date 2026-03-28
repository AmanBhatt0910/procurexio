import { NextResponse } from 'next/server';
import pool from '@/lib/db';

async function resolveVendor(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.company_id, v.id AS vendor_id
     FROM users u
     LEFT JOIN vendor_contacts vc ON vc.email = u.email AND vc.company_id = u.company_id
     LEFT JOIN vendors v ON v.id = vc.vendor_id AND v.company_id = u.company_id
     WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// POST /api/bids/rfqs/[rfqId]/bid/submit
export async function POST(request, { params }) {
  const role   = request.headers.get('x-user-role');
  const userId = request.headers.get('x-user-id');
  if (role !== 'vendor_user') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rfqId } = await params;

  try {
    const userInfo = await resolveVendor(userId);
    if (!userInfo?.vendor_id) return NextResponse.json({ error: 'No vendor linked' }, { status: 404 });
    const { vendor_id: vendorId, company_id: companyId } = userInfo;

    const [[rfq]] = await pool.query(
      `SELECT deadline, status FROM rfqs WHERE id = ? AND company_id = ?`,
      [rfqId, companyId]
    );
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    if (rfq.deadline && new Date() > new Date(rfq.deadline)) {
      return NextResponse.json({ error: 'RFQ deadline has passed' }, { status: 422 });
    }
    if (!['published'].includes(rfq.status)) {
      return NextResponse.json({ error: 'RFQ is not open for bidding' }, { status: 422 });
    }

    const [[bid]] = await pool.query(
      `SELECT id, status FROM bids WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );
    if (!bid) return NextResponse.json({ error: 'No bid found' }, { status: 404 });
    if (bid.status !== 'draft') {
      return NextResponse.json({ error: `Cannot submit a bid with status '${bid.status}'` }, { status: 422 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `UPDATE bids SET status = 'submitted', submitted_at = NOW() WHERE id = ?`,
        [bid.id]
      );
      await conn.query(
        `UPDATE rfq_vendors SET status = 'submitted' WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
        [rfqId, vendorId, companyId]
      );
      await conn.commit();
      return NextResponse.json({ message: 'Bid submitted successfully' });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('POST /api/bids/rfqs/[rfqId]/bid/submit', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}