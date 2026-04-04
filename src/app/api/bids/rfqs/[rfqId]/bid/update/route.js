import { NextResponse } from 'next/server';
import pool from '@/lib/db';

async function resolveVendor(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.company_id, u.vendor_id FROM users u WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function getVendorRank(rfqId, companyId, vendorId) {
  const [bids] = await pool.query(
    `SELECT vendor_id, total_amount
     FROM bids
     WHERE rfq_id = ? AND company_id = ? AND status = 'submitted'
     ORDER BY total_amount ASC`,
    [rfqId, companyId]
  );
  if (bids.length === 0) return { rank: null, totalBids: 0 };
  const idx = bids.findIndex(b => b.vendor_id === vendorId);
  let rank = null;
  if (idx >= 0) {
    const position = idx + 1;
    rank = position <= 3 ? `L${position}` : `Rank #${position}`;
  }
  return { rank, totalBids: bids.length };
}

// PUT /api/bids/rfqs/[rfqId]/bid/update — update a submitted bid (minimum ₹100 change)
export async function PUT(request, { params }) {
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

    // Check RFQ exists and deadline
    const [[rfq]] = await pool.query(
      `SELECT deadline, currency FROM rfqs WHERE id = ? AND company_id = ?`,
      [rfqId, companyId]
    );
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    if (rfq.deadline && new Date() > new Date(rfq.deadline)) {
      return NextResponse.json({ error: 'RFQ deadline has passed' }, { status: 422 });
    }

    // Get existing bid
    const [[bid]] = await pool.query(
      `SELECT id, status, total_amount FROM bids WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );
    if (!bid) return NextResponse.json({ error: 'No bid found' }, { status: 404 });
    if (bid.status === 'withdrawn') {
      return NextResponse.json({ error: 'Cannot update a withdrawn bid' }, { status: 422 });
    }
    if (bid.status === 'awarded') {
      return NextResponse.json({ error: 'Cannot update an awarded bid' }, { status: 422 });
    }
    if (bid.status !== 'submitted') {
      return NextResponse.json({ error: 'Only submitted bids can be updated via this endpoint' }, { status: 422 });
    }

    const body = await request.json();
    const { items = [], notes, currency } = body;

    // Calculate new total from items
    const newTotalAmount = items.reduce((sum, item) => {
      const up  = parseFloat(item.unit_price)  || 0;
      const qty = parseFloat(item.quantity)     || 1;
      return sum + up * qty;
    }, 0);

    if (newTotalAmount <= 0) {
      return NextResponse.json({ error: 'Bid total must be greater than zero' }, { status: 422 });
    }

    // Validate minimum ₹100 change
    const oldTotal = parseFloat(bid.total_amount);
    const diff = Math.abs(newTotalAmount - oldTotal);
    if (diff < 100) {
      return NextResponse.json(
        { error: `Minimum change must be ₹100. Current bid: ₹${oldTotal.toFixed(2)}, required minimum change: ₹100.00` },
        { status: 422 }
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Upsert bid items
      for (const item of items) {
        const { rfq_item_id, unit_price, quantity, notes: iNotes } = item;
        const up  = parseFloat(unit_price) || 0;
        const qty = parseFloat(quantity)   || 1;
        await conn.query(
          `INSERT INTO bid_items (bid_id, rfq_item_id, company_id, unit_price, quantity, notes)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE unit_price = VALUES(unit_price), quantity = VALUES(quantity), notes = VALUES(notes)`,
          [bid.id, rfq_item_id, companyId, up, qty, iNotes || null]
        );
      }

      // Update bid header (keep status as submitted)
      await conn.query(
        `UPDATE bids SET notes = ?, currency = ?, total_amount = ?, updated_at = NOW()
         WHERE id = ?`,
        [notes || null, currency || rfq.currency, newTotalAmount, bid.id]
      );

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    // Return updated rank
    const rankData = await getVendorRank(rfqId, companyId, vendorId);

    return NextResponse.json({
      message: 'Bid updated',
      data: {
        bidId: bid.id,
        newTotalAmount,
        rank: rankData.rank,
        totalBids: rankData.totalBids,
      },
    });
  } catch (err) {
    console.error('PUT /api/bids/rfqs/[rfqId]/bid/update', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
