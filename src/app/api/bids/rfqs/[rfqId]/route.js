import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { autoCloseIfExpired, sendDueRFQDeadlineReminders } from '@/lib/rfqUtils';

async function resolveVendor(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.company_id, u.vendor_id
     FROM users u
     WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// GET /api/bids/rfqs/[rfqId] — vendor sees RFQ detail + their own bid
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

    // Auto-close if deadline has passed
    await autoCloseIfExpired(rfqId, companyId);
    // Opportunistic reminder processing (deduplicated)
    await sendDueRFQDeadlineReminders({ companyId, rfqId });

    // Verify invitation
    const [[invite]] = await pool.query(
      `SELECT id, status FROM rfq_vendors WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );
    if (!invite) {
      return NextResponse.json({ error: 'Not invited to this RFQ' }, { status: 403 });
    }

    // Mark as viewed (idempotent)
    if (invite.status === 'invited') {
      await pool.query(
        `UPDATE rfq_vendors SET status = 'viewed' WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
        [rfqId, vendorId, companyId]
      );
    }

    // Fetch RFQ
    const [[rfq]] = await pool.query(
      `SELECT id, title, description, reference_number, status, deadline, budget, currency, created_at
       FROM rfqs WHERE id = ? AND company_id = ?`,
      [rfqId, companyId]
    );
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });

    // Fetch rfq_items
    const [items] = await pool.query(
      `SELECT id, description, quantity, unit, target_price, sort_order
       FROM rfq_items WHERE rfq_id = ? AND company_id = ? ORDER BY sort_order ASC`,
      [rfqId, companyId]
    );

    // Fetch own bid
    const [[bid]] = await pool.query(
      `SELECT id, status, notes, total_amount, currency, gst, rate, payment_terms, freight_charges,
              submitted_at, created_at, updated_at
       FROM bids WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );

    let bidItems = [];
    if (bid) {
      const [bi] = await pool.query(
        `SELECT rfq_item_id, unit_price, quantity, total_price, notes, tax_rate
         FROM bid_items WHERE bid_id = ?`,
        [bid.id]
      );
      bidItems = bi;
    }

    return NextResponse.json({
      message: 'ok',
      data: { rfq, items, bid: bid ? { ...bid, items: bidItems } : null, vendorId, inviteStatus: invite.status === 'invited' ? 'viewed' : invite.status },
    });
  } catch (err) {
    console.error('GET /api/bids/rfqs/[rfqId]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
