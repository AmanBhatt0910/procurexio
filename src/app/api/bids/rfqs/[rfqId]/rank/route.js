import { NextResponse } from 'next/server';
import pool from '@/lib/db';

async function resolveVendor(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.company_id, u.vendor_id FROM users u WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// GET /api/bids/rfqs/[rfqId]/rank — returns the calling vendor's L-level rank
export async function GET(request, { params }) {
  const role   = request.headers.get('x-user-role');
  const userId = request.headers.get('x-user-id');

  if (role !== 'vendor_user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { rfqId } = await params;

  try {
    const userInfo = await resolveVendor(userId);
    if (!userInfo?.vendor_id) {
      return NextResponse.json({ error: 'No vendor linked' }, { status: 404 });
    }
    const { vendor_id: vendorId, company_id: companyId } = userInfo;

    // Get all submitted bids ordered by total_amount ASC
    const [bids] = await pool.query(
      `SELECT vendor_id, total_amount
       FROM bids
       WHERE rfq_id = ? AND company_id = ? AND status = 'submitted'
       ORDER BY total_amount ASC`,
      [rfqId, companyId]
    );

    if (bids.length === 0) {
      return NextResponse.json({ message: 'ok', data: { rank: null, totalBids: 0 } });
    }

    const rankIndex = bids.findIndex(b => b.vendor_id === vendorId);
    const rank = rankIndex >= 0 ? `L${rankIndex + 1}` : null;

    return NextResponse.json({
      message: 'ok',
      data: { rank, totalBids: bids.length },
    });
  } catch (err) {
    console.error('GET /api/bids/rfqs/[rfqId]/rank', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
