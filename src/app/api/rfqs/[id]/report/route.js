import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';

// GET /api/rfqs/[id]/report — generate (or fetch) RFQ report on demand
export async function GET(request, { params }) {
  const role      = request.headers.get('x-user-role');
  const companyId = request.headers.get('x-company-id');
  const { id: rfqId } = await params;

  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(role, PERMISSIONS.VIEW_ALL_BIDS)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Fetch RFQ
    const [[rfq]] = await pool.query(
      `SELECT r.id, r.title, r.reference_number, r.status, r.deadline, r.budget, r.currency,
              r.description, r.created_at, u.name AS created_by_name
       FROM rfqs r
       LEFT JOIN users u ON u.id = r.created_by
       WHERE r.id = ? AND r.company_id = ?`,
      [rfqId, companyId]
    );
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });

    // Fetch items
    const [items] = await pool.query(
      `SELECT id, description, quantity, unit, target_price, sort_order
       FROM rfq_items WHERE rfq_id = ? AND company_id = ? ORDER BY sort_order ASC`,
      [rfqId, companyId]
    );

    // Fetch all bids with vendor info (sorted by total_amount ASC for L-levels)
    const [bids] = await pool.query(
      `SELECT b.id AS bid_id, b.vendor_id, v.name AS vendor_name, v.email AS vendor_email,
              b.status, b.total_amount, b.currency, b.submitted_at, b.notes
       FROM bids b
       JOIN vendors v ON v.id = b.vendor_id
       WHERE b.rfq_id = ? AND b.company_id = ?
       ORDER BY b.total_amount ASC`,
      [rfqId, companyId]
    );

    // Assign L-levels to submitted bids
    let levelIndex = 1;
    const structuredBids = bids.map(bid => {
      const level = bid.status === 'submitted' ? `L${levelIndex++}` : null;
      return {
        bidId:       bid.bid_id,
        vendorId:    bid.vendor_id,
        vendorName:  bid.vendor_name,
        vendorEmail: bid.vendor_email,
        status:      bid.status,
        totalAmount: parseFloat(bid.total_amount),
        currency:    bid.currency,
        submittedAt: bid.submitted_at,
        notes:       bid.notes,
        level,
      };
    });

    const submittedBids = structuredBids.filter(b => b.status === 'submitted');
    const totalAmounts  = submittedBids.map(b => b.totalAmount);
    const lowestBid     = submittedBids[0] || null;
    const averageBid    = totalAmounts.length
      ? totalAmounts.reduce((a, b) => a + b, 0) / totalAmounts.length
      : null;

    // Find awarded bid if any
    const awardedBid = structuredBids.find(b => b.status === 'awarded') || null;

    const report = {
      generatedAt: new Date().toISOString(),
      rfq: {
        id:              rfq.id,
        title:           rfq.title,
        reference:       rfq.reference_number,
        status:          rfq.status,
        description:     rfq.description,
        deadline:        rfq.deadline,
        budget:          rfq.budget ? parseFloat(rfq.budget) : null,
        currency:        rfq.currency,
        createdAt:       rfq.created_at,
        createdBy:       rfq.created_by_name,
      },
      items,
      bids: structuredBids,
      summary: {
        totalBids:     bids.length,
        submittedBids: submittedBids.length,
        lowestBid:     lowestBid ? { vendor: lowestBid.vendorName, amount: lowestBid.totalAmount } : null,
        averageBid:    averageBid ? parseFloat(averageBid.toFixed(2)) : null,
        awardedBid:    awardedBid ? { vendor: awardedBid.vendorName, amount: awardedBid.totalAmount } : null,
      },
    };

    return NextResponse.json({ message: 'ok', data: report });
  } catch (err) {
    console.error('GET /api/rfqs/[id]/report', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
