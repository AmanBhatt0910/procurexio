import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/rfqs/[id]/bids/[bidId] — internal: full bid detail
export async function GET(request, { params }) {
  const role      = request.headers.get('x-user-role');
  const companyId = request.headers.get('x-company-id');

  if (!['company_admin', 'manager', 'employee'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: rfqId, bidId } = await params;

  try {
    const [[bid]] = await pool.query(
      `SELECT b.id, b.rfq_id, b.vendor_id, v.name AS vendor_name,
              b.status, b.notes, b.total_amount, b.currency,
              b.submitted_at, b.created_at, b.updated_at
       FROM bids b
       JOIN vendors v ON v.id = b.vendor_id
       WHERE b.id = ? AND b.rfq_id = ? AND b.company_id = ?`,
      [bidId, rfqId, companyId]
    );
    if (!bid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 });

    const [items] = await pool.query(
      `SELECT bi.rfq_item_id, ri.description, ri.unit, ri.target_price,
              bi.unit_price, bi.quantity, bi.total_price, bi.notes
       FROM bid_items bi
       JOIN rfq_items ri ON ri.id = bi.rfq_item_id
       WHERE bi.bid_id = ?
       ORDER BY ri.sort_order ASC`,
      [bidId]
    );

    return NextResponse.json({ message: 'ok', data: { ...bid, items } });
  } catch (err) {
    console.error('GET /api/rfqs/[id]/bids/[bidId]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}