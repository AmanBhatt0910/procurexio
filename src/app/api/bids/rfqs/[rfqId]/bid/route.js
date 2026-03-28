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

// POST /api/bids/rfqs/[rfqId]/bid — create a draft bid
export async function POST(request, { params }) {
  const role   = request.headers.get('x-user-role');
  const userId = request.headers.get('x-user-id');
  if (role !== 'vendor_user') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rfqId } = await params;

  try {
    const userInfo = await resolveVendor(userId);
    if (!userInfo?.vendor_id) return NextResponse.json({ error: 'No vendor linked' }, { status: 404 });
    const { vendor_id: vendorId, company_id: companyId } = userInfo;

    // Verify invite
    const [[invite]] = await pool.query(
      `SELECT id FROM rfq_vendors WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );
    if (!invite) return NextResponse.json({ error: 'Not invited to this RFQ' }, { status: 403 });

    // Check deadline
    const [[rfq]] = await pool.query(`SELECT deadline, currency FROM rfqs WHERE id = ? AND company_id = ?`, [rfqId, companyId]);
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    if (rfq.deadline && new Date() > new Date(rfq.deadline)) {
      return NextResponse.json({ error: 'RFQ deadline has passed' }, { status: 422 });
    }

    const body = await request.json().catch(() => ({}));
    const notes    = body.notes    || null;
    const currency = body.currency || rfq.currency || 'USD';

    const [result] = await pool.query(
      `INSERT INTO bids (rfq_id, vendor_id, company_id, status, notes, currency, total_amount)
       VALUES (?, ?, ?, 'draft', ?, ?, 0.00)`,
      [rfqId, vendorId, companyId, notes, currency]
    );

    return NextResponse.json({ message: 'Bid created', data: { bidId: result.insertId } }, { status: 201 });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'A bid already exists for this RFQ' }, { status: 409 });
    }
    console.error('POST /api/bids/rfqs/[rfqId]/bid', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/bids/rfqs/[rfqId]/bid — update bid header + upsert items
export async function PUT(request, { params }) {
  const role   = request.headers.get('x-user-role');
  const userId = request.headers.get('x-user-id');
  if (role !== 'vendor_user') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rfqId } = await params;

  try {
    const userInfo = await resolveVendor(userId);
    if (!userInfo?.vendor_id) return NextResponse.json({ error: 'No vendor linked' }, { status: 404 });
    const { vendor_id: vendorId, company_id: companyId } = userInfo;

    // Check deadline + bid ownership
    const [[rfq]] = await pool.query(`SELECT deadline, currency FROM rfqs WHERE id = ? AND company_id = ?`, [rfqId, companyId]);
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    if (rfq.deadline && new Date() > new Date(rfq.deadline)) {
      return NextResponse.json({ error: 'RFQ deadline has passed' }, { status: 422 });
    }

    const [[bid]] = await pool.query(
      `SELECT id, status FROM bids WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );
    if (!bid) return NextResponse.json({ error: 'No bid found' }, { status: 404 });
    if (bid.status === 'withdrawn') return NextResponse.json({ error: 'Cannot edit a withdrawn bid' }, { status: 422 });

    const body = await request.json();
    const { notes, currency, items = [] } = body;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Upsert bid_items
      let totalAmount = 0;
      for (const item of items) {
        const { rfq_item_id, unit_price, quantity, notes: iNotes } = item;
        const up  = parseFloat(unit_price)  || 0;
        const qty = parseFloat(quantity)     || 1;
        totalAmount += up * qty;
        await conn.query(
          `INSERT INTO bid_items (bid_id, rfq_item_id, company_id, unit_price, quantity, notes)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE unit_price = VALUES(unit_price), quantity = VALUES(quantity), notes = VALUES(notes)`,
          [bid.id, rfq_item_id, companyId, up, qty, iNotes || null]
        );
      }

      // Update bid header
      await conn.query(
        `UPDATE bids SET notes = ?, currency = ?, total_amount = ?, updated_at = NOW()
         WHERE id = ?`,
        [notes || null, currency || rfq.currency, totalAmount, bid.id]
      );

      await conn.commit();
      return NextResponse.json({ message: 'Bid updated', data: { bidId: bid.id, totalAmount } });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('PUT /api/bids/rfqs/[rfqId]/bid', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}