import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/rfqs/[id]/bids — internal: all bids for an RFQ
export async function GET(request, { params }) {
  const role      = request.headers.get('x-user-role');
  const companyId = request.headers.get('x-company-id');

  if (!['company_admin', 'manager', 'employee'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: rfqId } = await params;

  try {
    // Verify RFQ belongs to this company
    const [[rfq]] = await pool.query(
      `SELECT id, title, reference_number, status, deadline, budget, currency
       FROM rfqs WHERE id = ? AND company_id = ?`,
      [rfqId, companyId]
    );
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });

    // Line items
    const [items] = await pool.query(
      `SELECT id, description, quantity, unit, target_price, sort_order
       FROM rfq_items WHERE rfq_id = ? AND company_id = ? ORDER BY sort_order ASC`,
      [rfqId, companyId]
    );

    // All bids with vendor info
    const [bids] = await pool.query(
      `SELECT b.id AS bid_id, b.vendor_id, v.name AS vendor_name,
              b.status, b.total_amount, b.currency, b.submitted_at, b.notes
       FROM bids b
       JOIN vendors v ON v.id = b.vendor_id
       WHERE b.rfq_id = ? AND b.company_id = ?
       ORDER BY b.total_amount ASC`,
      [rfqId, companyId]
    );

    // Fetch all bid_items in one query
    const bidIds = bids.map(b => b.bid_id);
    let allBidItems = [];
    if (bidIds.length > 0) {
      const placeholders = bidIds.map(() => '?').join(',');
      const [bi] = await pool.query(
        `SELECT bid_id, rfq_item_id, unit_price, quantity, total_price, notes
         FROM bid_items WHERE bid_id IN (${placeholders})`,
        bidIds
      );
      allBidItems = bi;
    }

    // Structure: bids with itemPrices map
    const structuredBids = bids.map(bid => {
      const itemPrices = {};
      allBidItems
        .filter(bi => bi.bid_id === bid.bid_id)
        .forEach(bi => {
          itemPrices[bi.rfq_item_id] = {
            unitPrice:  parseFloat(bi.unit_price),
            quantity:   parseFloat(bi.quantity),
            totalPrice: parseFloat(bi.total_price),
            notes:      bi.notes,
          };
        });
      return {
        bidId:       bid.bid_id,
        vendorId:    bid.vendor_id,
        vendorName:  bid.vendor_name,
        status:      bid.status,
        totalAmount: parseFloat(bid.total_amount),
        currency:    bid.currency,
        submittedAt: bid.submitted_at,
        notes:       bid.notes,
        itemPrices,
      };
    });

    return NextResponse.json({
      message: 'ok',
      data: { rfq, items, bids: structuredBids },
    });
  } catch (err) {
    console.error('GET /api/rfqs/[id]/bids', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}