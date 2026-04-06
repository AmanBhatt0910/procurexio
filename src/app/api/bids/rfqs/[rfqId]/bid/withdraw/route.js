import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logAction, ACTION } from '@/lib/audit';

async function resolveVendor(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.company_id, u.vendor_id
     FROM users u
     WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// POST /api/bids/rfqs/[rfqId]/bid/withdraw
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
    if (['closed', 'cancelled'].includes(rfq.status)) {
      return NextResponse.json({ error: 'Cannot withdraw from a closed or cancelled RFQ' }, { status: 422 });
    }
    if (rfq.deadline && new Date() > new Date(rfq.deadline)) {
      return NextResponse.json({ error: 'RFQ deadline has passed' }, { status: 422 });
    }

    const [[bid]] = await pool.query(
      `SELECT id, status FROM bids WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );
    if (!bid) return NextResponse.json({ error: 'No bid found' }, { status: 404 });
    if (bid.status !== 'submitted') {
      return NextResponse.json({ error: `Only submitted bids can be withdrawn` }, { status: 422 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`UPDATE bids SET status = 'withdrawn' WHERE id = ?`, [bid.id]);
      await conn.query(
        `UPDATE rfq_vendors SET status = 'invited' WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
        [rfqId, vendorId, companyId]
      );
      await conn.commit();
      await logAction(request, {
        userId:       parseInt(userId, 10) || null,
        userEmail:    request.headers.get('x-user-email') || null,
        actionType:   ACTION.BID_WITHDRAWN,
        resourceType: 'bid',
        resourceId:   bid.id,
        resourceName: `RFQ #${rfqId}`,
        status:       'success',
      });
      return NextResponse.json({ message: 'Bid withdrawn' });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('POST /api/bids/rfqs/[rfqId]/bid/withdraw', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}