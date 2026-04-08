import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createNotifications } from '@/lib/notifications';
import { sendBidUpdatedEmail } from '@/lib/mailer';
import { logAction, ACTION } from '@/lib/audit';

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
      `SELECT r.deadline, r.currency, r.status, r.title, r.reference_number,
              v.name AS vendor_name, v.email AS vendor_email
       FROM rfqs r
       JOIN rfq_vendors rv ON rv.rfq_id = r.id
       JOIN vendors v ON v.id = rv.vendor_id
       JOIN users u ON u.vendor_id = v.id AND u.id = ?
       WHERE r.id = ? AND r.company_id = ?`,
      [userId, rfqId, companyId]
    );
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    if (rfq.status === 'closed' || rfq.status === 'cancelled') {
      return NextResponse.json({ error: 'This RFQ is closed — bid amounts can no longer be modified' }, { status: 422 });
    }
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

    // Calculate new total from items (no tax — tax display removed from bid form)
    const newTotalAmount = items.reduce((sum, item) => {
      const up  = parseFloat(item.unit_price) || 0;
      const qty = parseFloat(item.quantity)   || 1;
      return sum + up * qty;
    }, 0);

    if (newTotalAmount <= 0) {
      return NextResponse.json({ error: 'Bid total must be greater than zero' }, { status: 422 });
    }

    // Validate minimum ₹100 reduction — new bid must be strictly lower by at least ₹100
    const oldTotal = parseFloat(bid.total_amount);
    if (newTotalAmount > oldTotal - 100) {
      return NextResponse.json(
        {
          error: `New bid must be at least ₹100 lower than your current bid`,
          currentAmount: oldTotal,
          requiredMaximum: parseFloat((oldTotal - 100).toFixed(2)),
        },
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
          `INSERT INTO bid_items (bid_id, rfq_item_id, company_id, unit_price, quantity, notes, tax_rate)
           VALUES (?, ?, ?, ?, ?, ?, 0)
           ON DUPLICATE KEY UPDATE unit_price = VALUES(unit_price), quantity = VALUES(quantity), notes = VALUES(notes), tax_rate = 0`,
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

    // Notify managers/admins of the bid update
    try {
      const [managers] = await pool.query(
        `SELECT u.id AS userId, u.email, u.name FROM users u
         WHERE u.company_id = ? AND u.role IN ('company_admin', 'manager')`,
        [companyId]
      );
      if (managers.length) {
        await createNotifications(
          managers.map(m => ({ userId: m.userId, companyId })),
          {
            type:  'bid_updated',
            title: `Bid updated on "${rfq.title}"`,
            body:  `${rfq.vendor_name} has updated their bid.`,
            link:  `/dashboard/rfqs/${rfqId}/bids`,
          }
        );
        const rfqLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/dashboard/rfqs/${rfqId}/bids`;
        for (const m of managers) {
          sendBidUpdatedEmail({
            to: m.email,
            managerName: m.name,
            vendorName: rfq.vendor_name,
            rfqTitle: rfq.title,
            rfqReference: rfq.reference_number,
            rfqLink,
          }).catch(() => {});
        }
      }
    } catch (_) { /* notification errors must not fail the request */ }

    await logAction(request, {
      userId:       parseInt(userId, 10) || null,
      userEmail:    request.headers.get('x-user-email') || null,
      actionType:   ACTION.BID_RESUBMITTED,
      resourceType: 'bid',
      resourceId:   bid.id,
      resourceName: rfq.title || `RFQ #${rfqId}`,
      changes:      { oldTotalAmount: parseFloat(bid.total_amount), newTotalAmount },
      status:       'success',
    });

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
